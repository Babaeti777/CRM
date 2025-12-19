import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mark this route as dynamic (not static)
export const dynamic = 'force-dynamic'

// GET all divisions
export async function GET() {
  try {
    // Check if database is configured
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not configured')
      return NextResponse.json({
        error: 'Database not configured',
        message: 'Please set DATABASE_URL in environment variables'
      }, { status: 500 })
    }

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
    return NextResponse.json({
      error: 'Failed to fetch divisions',
      details: error instanceof Error ? error.message : 'Unknown error',
      message: 'Make sure DATABASE_URL is set correctly and database is initialized'
    }, { status: 500 })
  }
}

// POST create new division
export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        error: 'Database not configured'
      }, { status: 500 })
    }

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
      {
        error: 'Failed to create division',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
