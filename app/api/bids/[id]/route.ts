import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single bid
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const bid = await prisma.bid.findUnique({
      where: { id },
      include: {
        division: true,
        documents: true,
        responses: {
          include: {
            subcontractor: true,
          },
        },
      },
    })

    if (!bid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
    }

    return NextResponse.json(bid)
  } catch (error) {
    console.error('Error fetching bid:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bid' },
      { status: 500 }
    )
  }
}

// PATCH update bid
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      title,
      description,
      divisionId,
      status,
      dueDate,
      divisionConfirmed,
      aiSuggestedDivision,
    } = body

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (divisionId !== undefined) updateData.divisionId = divisionId
    if (status !== undefined) updateData.status = status
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate)
    if (divisionConfirmed !== undefined)
      updateData.divisionConfirmed = divisionConfirmed
    if (aiSuggestedDivision !== undefined)
      updateData.aiSuggestedDivision = aiSuggestedDivision

    const bid = await prisma.bid.update({
      where: { id },
      data: updateData,
      include: {
        division: true,
        documents: true,
        responses: {
          include: {
            subcontractor: true,
          },
        },
      },
    })

    return NextResponse.json(bid)
  } catch (error) {
    console.error('Error updating bid:', error)
    return NextResponse.json(
      { error: 'Failed to update bid' },
      { status: 500 }
    )
  }
}

// DELETE bid
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.bid.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Bid deleted successfully' })
  } catch (error) {
    console.error('Error deleting bid:', error)
    return NextResponse.json(
      { error: 'Failed to delete bid' },
      { status: 500 }
    )
  }
}
