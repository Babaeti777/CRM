import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSubcontractors, createSubcontractor, getSubcontractorByEmail, getDivisionById, getBidResponses } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET all subcontractors
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const divisionId = searchParams.get('divisionId')

    const subcontractors = await getSubcontractors({
      divisionId: divisionId || undefined,
    })

    // Get divisions and response counts for each subcontractor
    const subcontractorsWithDetails = await Promise.all(
      subcontractors.map(async (sub) => {
        const [divisions, responses] = await Promise.all([
          Promise.all(sub.divisionIds.map(id => getDivisionById(id))),
          getBidResponses({ subcontractorId: sub.id }),
        ])
        return {
          ...sub,
          divisions: divisions.filter(Boolean).map(d => ({ division: d })),
          _count: { responses: responses.length },
        }
      })
    )

    return NextResponse.json(subcontractorsWithDetails)
  } catch (error) {
    console.error('[SUBCONTRACTORS API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch subcontractors' }, { status: 500 })
  }
}

// POST create new subcontractor
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
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { name, email, phone, company, address, divisionIds } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Check if email already exists
    const existing = await getSubcontractorByEmail(email)
    if (existing) {
      return NextResponse.json({ error: 'Subcontractor with this email already exists' }, { status: 409 })
    }

    const subcontractor = await createSubcontractor({
      name,
      email,
      phone,
      company,
      address,
      divisionIds: divisionIds || [],
    })

    // Get divisions for response
    const divisions = await Promise.all(
      (divisionIds || []).map((id: string) => getDivisionById(id))
    )

    return NextResponse.json({
      ...subcontractor,
      divisions: divisions.filter(Boolean).map(d => ({ division: d })),
    }, { status: 201 })
  } catch (error) {
    console.error('[SUBCONTRACTORS API] Error:', error)
    return NextResponse.json({ error: 'Failed to create subcontractor' }, { status: 500 })
  }
}
