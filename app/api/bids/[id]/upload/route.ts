import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { suggestDivision } from '@/lib/openai'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', params.id)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `${Date.now()}-${file.name}`
    const filePath = path.join(uploadsDir, fileName)
    await writeFile(filePath, buffer)

    // Create document record
    const document = await prisma.document.create({
      data: {
        bidId: params.id,
        fileName: file.name,
        filePath: filePath,
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
      where: { id: params.id },
      include: { documents: true },
    })

    if (bid && bid.documents.length === 1 && !bid.divisionConfirmed) {
      const divisions = await prisma.division.findMany()
      const divisionNames = divisions.map((d) => d.name)

      if (divisionNames.length > 0) {
        const suggestion = await suggestDivision(documentText, divisionNames)

        // Find the suggested division
        const suggestedDivision = divisions.find(
          (d) => d.name === suggestion.division
        )

        if (suggestedDivision) {
          await prisma.bid.update({
            where: { id: params.id },
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
