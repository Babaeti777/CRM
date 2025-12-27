import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getDivisions, createDivision, getDivisionByName, getSubcontractors, getBids } from '@/lib/db'
import { isFirebaseConfigured } from '@/lib/firebase'

export const dynamic = 'force-dynamic'

// GET all divisions
export async function GET() {
  try {
    if (!isFirebaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured', message: 'Please set Firebase environment variables' },
        { status: 503 }
      )
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const divisions = await getDivisions()

    // Get counts for each division
    const divisionsWithCounts = await Promise.all(
      divisions.map(async (division) => {
        const [subcontractors, bids] = await Promise.all([
          getSubcontractors({ divisionId: division.id }),
          getBids({ divisionId: division.id }),
        ])
        return {
          ...division,
          _count: {
            subcontractors: subcontractors.length,
            bids: bids.length,
          },
        }
      })
    )

    return NextResponse.json(divisionsWithCounts)
  } catch (error) {
    console.error('[DIVISIONS API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch divisions' }, { status: 500 })
  }
}

// POST create new division
export async function POST(request: NextRequest) {
  try {
    if (!isFirebaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { name, description } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Division name is required' }, { status: 400 })
    }

    // Check if division with same name exists
    const existing = await getDivisionByName(name.trim())
    if (existing) {
      return NextResponse.json({ error: 'Division with this name already exists' }, { status: 409 })
    }

    const division = await createDivision({
      name: name.trim(),
      description,
    })

    return NextResponse.json(division, { status: 201 })
  } catch (error) {
    console.error('[DIVISIONS API] Error:', error)
    return NextResponse.json({ error: 'Failed to create division' }, { status: 500 })
  }
}
