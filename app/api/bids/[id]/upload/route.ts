import { NextRequest, NextResponse } from 'next/server'
import { getBidById, updateBid, getDivisions } from '@/lib/db'
import { suggestDivision } from '@/lib/openai'
import { getServerSession } from 'next-auth'

// File configuration for AI analysis
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt']

/**
 * Validate file type by extension and MIME type
 */
function isValidFileType(filename: string, mimeType: string): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
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
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      )
    }

    const { id: bidId } = await params

    // Verify bid exists
    const existingBid = await getBidById(bidId)
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

    const requestId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    console.log(`[UPLOAD ${requestId}] Processing file for AI analysis: ${file.name}`)

    // Extract text content for AI analysis
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let documentText = ''
    if (file.type === 'text/plain') {
      documentText = buffer.toString('utf-8')
    } else if (file.type === 'application/pdf') {
      // In production, use a PDF parsing library like pdf-parse
      documentText = 'PDF content would be parsed here'
    }

    let aiSuggestionApplied = false

    // Only trigger AI suggestion if division not yet confirmed
    if (!existingBid.divisionConfirmed && !existingBid.aiSuggestedDivision) {
      const divisions = await getDivisions()
      const divisionNames = divisions.map((d) => d.name)

      if (divisionNames.length > 0 && documentText) {
        console.log(`[UPLOAD ${requestId}] Triggering AI division suggestion`)

        try {
          const suggestion = await suggestDivision(documentText, divisionNames)

          // Find the suggested division
          const suggestedDivision = divisions.find(
            (d) => d.name === suggestion.division
          )

          if (suggestedDivision) {
            await updateBid(bidId, {
              aiSuggestedDivision: JSON.stringify(suggestion),
              status: 'PENDING_DIVISION',
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

    console.log(`[UPLOAD ${requestId}] Processing completed successfully`)

    return NextResponse.json({
      message: 'File processed successfully',
      fileName: file.name,
      fileSize: file.size,
      aiSuggestionApplied,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[UPLOAD] Error processing file:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      {
        error: 'Failed to process file',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    )
  }
}
