import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getBids, createBid, getDivisionById } from '@/lib/db'
import type { BidStatus } from '@/lib/firebase'

export const dynamic = 'force-dynamic'

const VALID_STATUSES: BidStatus[] = ['DRAFT', 'PENDING_DIVISION', 'ACTIVE', 'CLOSED', 'AWARDED', 'CANCELLED']

function isValidBidStatus(status: string): status is BidStatus {
  return VALID_STATUSES.includes(status as BidStatus)
}

// GET all bids
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const divisionId = searchParams.get('divisionId')

    if (status && !isValidBidStatus(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const bids = await getBids({
      status: status as BidStatus | undefined,
      divisionId: divisionId || undefined,
    })

    // Get divisions for each bid
    const bidsWithDivisions = await Promise.all(
      bids.map(async (bid) => {
        const division = await getDivisionById(bid.divisionId)
        return { ...bid, division }
      })
    )

    return NextResponse.json(bidsWithDivisions)
  } catch (error) {
    console.error('[BIDS API] Error fetching bids:', error)
    return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 })
  }
}

// POST create new bid
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const { title, description, divisionId, dueDate, status } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!divisionId || typeof divisionId !== 'string') {
      return NextResponse.json({ error: 'Division ID is required' }, { status: 400 })
    }

    if (status && !isValidBidStatus(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify division exists
    const division = await getDivisionById(divisionId)
    if (!division) {
      return NextResponse.json({ error: 'Division not found' }, { status: 404 })
    }

    const bid = await createBid({
      title: title.trim(),
      description,
      divisionId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: status || 'DRAFT',
    })

    return NextResponse.json({ ...bid, division }, { status: 201 })
  } catch (error) {
    console.error('[BIDS API] Error creating bid:', error)
    return NextResponse.json({ error: 'Failed to create bid' }, { status: 500 })
  }
}
