import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all subcontractors
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const divisionId = searchParams.get('divisionId')

    const where: any = {}
    if (divisionId) {
      where.divisions = {
        some: {
          divisionId,
        },
      }
    }

    const subcontractors = await prisma.subcontractor.findMany({
      where,
      include: {
        divisions: {
          include: {
            division: true,
          },
        },
        _count: {
          select: {
            responses: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(subcontractors)
  } catch (error) {
    console.error('Error fetching subcontractors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subcontractors' },
      { status: 500 }
    )
  }
}

// POST create new subcontractor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, company, address, divisionIds } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    const subcontractor = await prisma.subcontractor.create({
      data: {
        name,
        email,
        phone,
        company,
        address,
        divisions: divisionIds
          ? {
              create: divisionIds.map((divisionId: string) => ({
                divisionId,
              })),
            }
          : undefined,
      },
      include: {
        divisions: {
          include: {
            division: true,
          },
        },
      },
    })

    return NextResponse.json(subcontractor, { status: 201 })
  } catch (error) {
    console.error('Error creating subcontractor:', error)
    return NextResponse.json(
      { error: 'Failed to create subcontractor' },
      { status: 500 }
    )
  }
}
