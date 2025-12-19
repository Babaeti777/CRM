import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mark this route as dynamic (not static)
export const dynamic = 'force-dynamic'

// GET all responses
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const bidId = searchParams.get('bidId')
    const subcontractorId = searchParams.get('subcontractorId')
    const status = searchParams.get('status')

    const where: any = {}
    if (bidId) where.bidId = bidId
    if (subcontractorId) where.subcontractorId = subcontractorId
    if (status) where.status = status

    const responses = await prisma.bidResponse.findMany({
      where,
      include: {
        bid: {
          include: {
            division: true,
          },
        },
        subcontractor: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(responses)
  } catch (error) {
    console.error('Error fetching responses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    )
  }
}
