import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all bids
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const divisionId = searchParams.get('divisionId')

    const where: any = {}
    if (status) where.status = status
    if (divisionId) where.divisionId = divisionId

    const bids = await prisma.bid.findMany({
      where,
      include: {
        division: true,
        documents: true,
        responses: {
          include: {
            subcontractor: true,
          },
        },
        calendarEvents: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(bids)
  } catch (error) {
    console.error('Error fetching bids:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bids' },
      { status: 500 }
    )
  }
}

// POST create new bid
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, divisionId, dueDate, status } = body

    const bid = await prisma.bid.create({
      data: {
        title,
        description,
        divisionId,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || 'DRAFT',
      },
      include: {
        division: true,
      },
    })

    return NextResponse.json(bid, { status: 201 })
  } catch (error) {
    console.error('Error creating bid:', error)
    return NextResponse.json(
      { error: 'Failed to create bid' },
      { status: 500 }
    )
  }
}
