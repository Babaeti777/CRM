import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { updateBidResponse, getBidResponseById, getBidById, getSubcontractorById } from '@/lib/db'

// PATCH update response
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

    // Check if response exists
    const existing = await getBidResponseById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { status, amount, notes } = body

    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (amount !== undefined) updateData.amount = amount
    if (notes !== undefined) updateData.notes = notes

    if (status === 'QUOTED' || status === 'DECLINED') {
      updateData.submittedAt = new Date()
    }

    const response = await updateBidResponse(id, updateData)

    // Get bid and subcontractor for response
    const [bid, subcontractor] = await Promise.all([
      getBidById(response!.bidId),
      getSubcontractorById(response!.subcontractorId),
    ])

    return NextResponse.json({
      ...response,
      bid,
      subcontractor,
    })
  } catch (error) {
    console.error('[RESPONSE API] Error:', error)
    return NextResponse.json({ error: 'Failed to update response' }, { status: 500 })
  }
}
