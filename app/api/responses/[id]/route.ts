import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH update response
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, amount, notes } = body

    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (amount !== undefined) updateData.amount = amount
    if (notes !== undefined) updateData.notes = notes

    if (status === 'QUOTED' || status === 'DECLINED') {
      updateData.submittedAt = new Date()
    }

    const response = await prisma.bidResponse.update({
      where: { id: params.id },
      data: updateData,
      include: {
        bid: true,
        subcontractor: true,
      },
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating response:', error)
    return NextResponse.json(
      { error: 'Failed to update response' },
      { status: 500 }
    )
  }
}
