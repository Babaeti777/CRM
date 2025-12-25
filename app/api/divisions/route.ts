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
        message: 'DATABASE_URL environment variable is not set on the server',
        details: 'The server cannot find DATABASE_URL. This usually means the environment variable was not saved correctly in Vercel, or the app needs to be redeployed.',
        suggestion: 'Go to Vercel → Settings → Environment Variables → Make sure DATABASE_URL is set for Production → Redeploy (without cache)',
        debug: {
          nodeEnv: process.env.NODE_ENV,
          vercel: process.env.VERCEL,
          vercelEnv: process.env.VERCEL_ENV,
        }
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

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Provide specific error messages based on the error type
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
