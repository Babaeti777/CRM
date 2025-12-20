import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { suggestDivision } from '@/lib/openai'
import { uploadFileToFirebase } from '@/lib/firebase'
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
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

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

    // Upload to Firebase Storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileUrl = await uploadFileToFirebase(buffer, sanitizedName, `bids/${bidId}`)

    // Create document record
    const document = await prisma.document.create({
      data: {
        bidId,
        fileName: sanitizedName,
        filePath: fileUrl, // Store Firebase URL
        fileSize: file.size,
        mimeType: file.type,
      },
    })

    // Extract text content for AI analysis (simplified - in production use proper document parsing)
    let documentText = ''
    if (file.type === 'text/plain') {
      documentText = buffer.toString('utf-8')
    } else if (file.type === 'application/pdf') {
      // In production, use a PDF parsing library like pdf-parse
      documentText = 'PDF content parsing would go here'
    }

    // Get AI suggestion if this is the first document
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { documents: true },
    })

    if (bid && bid.documents.length === 1 && !bid.divisionConfirmed) {
      const divisions = await prisma.division.findMany()
      const divisionNames = divisions.map((d: { name: string }) => d.name)

      if (divisionNames.length > 0) {
        const suggestion = await suggestDivision(documentText, divisionNames)

        // Find the suggested division
        const suggestedDivision = divisions.find(
          (d: { id: string; name: string }) => d.name === suggestion.division
        )

        if (suggestedDivision) {
          await prisma.bid.update({
            where: { id: bidId },
            data: {
              aiSuggestedDivision: JSON.stringify(suggestion),
              status: 'PENDING_DIVISION',
            },
          })
        }
      }
    }

    return NextResponse.json({
      document,
      message: 'File uploaded successfully',
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
