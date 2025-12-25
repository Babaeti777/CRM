import { NextRequest, NextResponse } from 'next/server'
import { prisma, withDatabaseRetry } from '@/lib/prisma'
import { suggestDivision } from '@/lib/openai'
import { uploadToGoogleDrive } from '@/lib/google-drive'
import { getServerSession } from 'next-auth'
import path from 'path'

// File upload configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/jpg',
]
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg']

/**
 * Sanitize filename to prevent path traversal attacks
 */
function sanitizeFilename(filename: string): string {
  // Remove path separators and null bytes
  return filename
    .replace(/[/\\]/g, '')
    .replace(/\0/g, '')
    .replace(/\.\./g, '')
    .trim()
}

/**
 * Validate file type by extension and MIME type
 */
function isValidFileType(filename: string, mimeType: string): boolean {
  const ext = path.extname(filename).toLowerCase()
  const isValidExtension = ALLOWED_EXTENSIONS.includes(ext)
  const isValidMimeType = ALLOWED_MIME_TYPES.includes(mimeType)

  return isValidExtension && isValidMimeType
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign out and sign in again.' },
        { status: 401 }
      )
    }

    const accessToken = session.accessToken as string

    const { id: bidId } = await params

    // Verify bid exists
    const existingBid = await prisma.bid.findUnique({
      where: { id: bidId },
    })

    if (!existingBid) {
      return NextResponse.json(
        { error: 'Bid not found' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Validate file type
    if (!isValidFileType(file.name, file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      )
    }

    // Sanitize filename
    const sanitizedName = sanitizeFilename(file.name)
    if (!sanitizedName) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      )
    }

    const requestId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    console.log(`[UPLOAD ${requestId}] Starting file upload: ${sanitizedName}`)

    // Upload to Google Drive
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const driveFile = await uploadToGoogleDrive(
      accessToken,
      buffer,
      sanitizedName,
      file.type
    )

    console.log(`[UPLOAD ${requestId}] File uploaded to Google Drive`)

    // Extract text content for AI analysis (simplified - in production use proper document parsing)
    let documentText = ''
    if (file.type === 'text/plain') {
      documentText = buffer.toString('utf-8')
    } else if (file.type === 'application/pdf') {
      // In production, use a PDF parsing library like pdf-parse
      documentText = 'PDF content parsing would go here'
    }

    // Use a transaction to atomically create document and check/update AI suggestion
    // This prevents race conditions when multiple files are uploaded concurrently
    interface TransactionResult {
      document: {
        id: string
        bidId: string
        fileName: string
        filePath: string
        fileSize: number
        mimeType: string
        uploadedAt: Date
      }
      aiSuggestionApplied: boolean
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: TransactionResult = await withDatabaseRetry(() =>
      prisma.$transaction(async (tx: any) => {
        // Create document record within transaction
        const document = await tx.document.create({
          data: {
            bidId,
            fileName: sanitizedName,
            filePath: driveFile.webViewLink, // Store Google Drive URL
            fileSize: file.size,
            mimeType: file.type,
          },
        })

        console.log(`[UPLOAD ${requestId}] Document record created: ${document.id}`)

        // Get current bid state within transaction to check document count atomically
        const bid = await tx.bid.findUnique({
          where: { id: bidId },
          include: {
            documents: {
              select: { id: true },
            },
          },
        })

        let aiSuggestionApplied = false

        // Only trigger AI suggestion if this is the first document AND division not yet confirmed
        // The transaction ensures no race condition here
        if (bid && bid.documents.length === 1 && !bid.divisionConfirmed && !bid.aiSuggestedDivision) {
          const divisions = await tx.division.findMany()
          const divisionNames = divisions.map((d: { name: string }) => d.name)

          if (divisionNames.length > 0) {
            console.log(`[UPLOAD ${requestId}] Triggering AI division suggestion`)

            try {
              const suggestion = await suggestDivision(documentText, divisionNames)

              // Find the suggested division
              const suggestedDivision = divisions.find(
                (d: { id: string; name: string }) => d.name === suggestion.division
              )

              if (suggestedDivision) {
                await tx.bid.update({
                  where: { id: bidId },
                  data: {
                    aiSuggestedDivision: JSON.stringify(suggestion),
                    status: 'PENDING_DIVISION',
                  },
                })
                aiSuggestionApplied = true
                console.log(`[UPLOAD ${requestId}] AI suggestion applied: ${suggestion.division}`)
              }
            } catch (aiError) {
              // Log AI error but don't fail the upload
              console.error(`[UPLOAD ${requestId}] AI suggestion failed:`, aiError)
            }
          }
        }

        return { document, aiSuggestionApplied }
      }, {
        // Use serializable isolation to prevent concurrent modifications
        isolationLevel: 'Serializable' as const,
        maxWait: 5000, // 5 seconds max wait to acquire lock
        timeout: 30000, // 30 seconds timeout for the transaction
      })
    )

    console.log(`[UPLOAD ${requestId}] Upload completed successfully`)

    return NextResponse.json({
      document: result.document,
      message: 'File uploaded successfully',
      aiSuggestionApplied: result.aiSuggestionApplied,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[UPLOAD] Error uploading file:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        error: 'Failed to upload file',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    )
  }
}
