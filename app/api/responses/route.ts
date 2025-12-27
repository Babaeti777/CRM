import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getBidResponses, getBidById, getSubcontractorById, getDivisionById } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET all responses
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const bidId = searchParams.get('bidId')
    const subcontractorId = searchParams.get('subcontractorId')

    const responses = await getBidResponses({
      bidId: bidId || undefined,
      subcontractorId: subcontractorId || undefined,
    })

    // Get bid and subcontractor details for each response
    const responsesWithDetails = await Promise.all(
      responses.map(async (response) => {
        const [bid, subcontractor] = await Promise.all([
          getBidById(response.bidId),
          getSubcontractorById(response.subcontractorId),
        ])

        let bidWithDivision = null
        if (bid) {
          const division = await getDivisionById(bid.divisionId)
          bidWithDivision = { ...bid, division }
        }

        return {
          ...response,
          bid: bidWithDivision,
          subcontractor,
        }
      })
    )

    return NextResponse.json(responsesWithDetails)
  } catch (error) {
    console.error('[RESPONSES API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 })
  }
}
