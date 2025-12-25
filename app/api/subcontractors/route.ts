import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mark this route as dynamic (not static)
export const dynamic = 'force-dynamic'

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

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    let userMessage = 'Database connection failed'
    let suggestion = 'Check your DATABASE_URL and ensure the database is accessible'

    if (errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
      userMessage = 'Database tables not found'
      suggestion = 'Run "npx prisma db push" or "npx prisma migrate deploy" to create the database tables'
    } else if (errorMessage.includes('connect') || errorMessage.includes('ECONNREFUSED')) {
      userMessage = 'Cannot connect to database'
      suggestion = 'Check that your database server is running and DATABASE_URL is correct'
    } else if (errorMessage.includes('authentication') || errorMessage.includes('password')) {
      userMessage = 'Database authentication failed'
      suggestion = 'Check your database username and password in DATABASE_URL'
    } else if (errorMessage.includes('timeout')) {
      userMessage = 'Database connection timed out'
      suggestion = 'Check network connectivity to your database server'
    }

    return NextResponse.json({
      error: userMessage,
      details: errorMessage,
      suggestion: suggestion,
      message: `${userMessage}. ${suggestion}`
    }, { status: 500 })
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
