import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getBidWithDetails, updateBid, deleteBid, getBidById } from '@/lib/db'

// GET single bid
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params
    const result = await getBidWithDetails(id)

    if (!result) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...result.bid,
      division: result.division,
      responses: result.responses,
    })
  } catch (error) {
    console.error('[BID API] Error fetching bid:', error)
    return NextResponse.json({ error: 'Failed to fetch bid' }, { status: 500 })
  }
}

// PATCH update bid
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params

    // Check if bid exists
    const existingBid = await getBidById(id)
    if (!existingBid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { title, description, divisionId, status, dueDate, divisionConfirmed, aiSuggestedDivision } = body

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (divisionId !== undefined) updateData.divisionId = divisionId
    if (status !== undefined) updateData.status = status
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate)
    if (divisionConfirmed !== undefined) updateData.divisionConfirmed = divisionConfirmed
    if (aiSuggestedDivision !== undefined) updateData.aiSuggestedDivision = aiSuggestedDivision

    const bid = await updateBid(id, updateData)
    return NextResponse.json(bid)
  } catch (error) {
    console.error('[BID API] Error updating bid:', error)
    return NextResponse.json({ error: 'Failed to update bid' }, { status: 500 })
  }
}

// DELETE bid
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params

    // Check if bid exists
    const existingBid = await getBidById(id)
    if (!existingBid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
    }

    await deleteBid(id)
    return NextResponse.json({ message: 'Bid deleted successfully' })
  } catch (error) {
    console.error('[BID API] Error deleting bid:', error)
    return NextResponse.json({ error: 'Failed to delete bid' }, { status: 500 })
  }
}
