import { NextRequest, NextResponse } from 'next/server'
import { prisma, withDatabaseRetry } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import type { BidStatus } from '@prisma/client'

// Mark this route as dynamic (not static)
export const dynamic = 'force-dynamic'

// Valid bid statuses
const VALID_STATUSES: BidStatus[] = ['DRAFT', 'PENDING_DIVISION', 'ACTIVE', 'CLOSED', 'AWARDED', 'CANCELLED']

/**
 * Safely parse JSON request body with error handling
 */
async function parseJsonBody<T>(request: NextRequest): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const data = await request.json()
    return { success: true, data }
  } catch (error) {
    console.error('[BIDS API] Failed to parse request body:', error)
    return { success: false, error: 'Invalid JSON in request body' }
  }
}

// GET all bids
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const divisionId = searchParams.get('divisionId')

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = {}
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[BIDS API] Error fetching bids:', { error: errorMessage, stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json(
      {
        error: 'Failed to fetch bids',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    )
  }
}

// POST create new bid
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body with error handling
    const parseResult = await parseJsonBody<{
      title?: string
      description?: string
      divisionId?: string
      dueDate?: string
      status?: BidStatus
    }>(request)

    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error }, { status: 400 })
    }

    const { title, description, divisionId, dueDate, status } = parseResult.data

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (!divisionId || typeof divisionId !== 'string') {
      return NextResponse.json(
        { error: 'Division ID is required' },
        { status: 400 }
      )
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate due date if provided
    if (dueDate && isNaN(Date.parse(dueDate))) {
      return NextResponse.json(
        { error: 'Invalid due date format' },
        { status: 400 }
      )
    }

    // Verify division exists
    const division = await prisma.division.findUnique({
      where: { id: divisionId },
    })

    if (!division) {
      return NextResponse.json(
        { error: 'Division not found' },
        { status: 404 }
      )
    }

    const bid = await withDatabaseRetry(() =>
      prisma.bid.create({
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
    )

    return NextResponse.json(bid, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[BIDS API] Error creating bid:', { error: errorMessage, stack: error instanceof Error ? error.stack : undefined })
    return NextResponse.json(
      {
        error: 'Failed to create bid',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    )
  }
}
