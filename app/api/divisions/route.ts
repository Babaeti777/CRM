import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all divisions
export async function GET() {
  try {
    const divisions = await prisma.division.findMany({
      include: {
        _count: {
          select: {
            bids: true,
            subcontractors: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(divisions)
  } catch (error) {
    console.error('Error fetching divisions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch divisions' },
      { status: 500 }
    )
  }
}

// POST create new division
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Division name is required' },
        { status: 400 }
      )
    }

    const division = await prisma.division.create({
      data: {
        name,
        description,
      },
    })

    return NextResponse.json(division, { status: 201 })
  } catch (error) {
    console.error('Error creating division:', error)
    return NextResponse.json(
      { error: 'Failed to create division' },
      { status: 500 }
    )
  }
}
