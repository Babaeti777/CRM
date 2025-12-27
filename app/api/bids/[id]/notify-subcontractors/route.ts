import { NextRequest, NextResponse } from 'next/server'
import { getBidById, getDivisionById, getSubcontractors, upsertBidResponse, createEmailThread, createCalendarEvent } from '@/lib/db'
import { sendEmail, createCalendarEvent as createGoogleCalendarEvent } from '@/lib/google'
import { getServerSession } from 'next-auth'

interface NotifyRequestBody {
  message?: string
  createEvent?: boolean
}

/**
 * Safely parse JSON request body with error handling
 */
async function parseRequestBody(request: NextRequest): Promise<{ success: true; data: NotifyRequestBody } | { success: false; error: string }> {
  try {
    const data = await request.json()
    return { success: true, data }
  } catch (error) {
    console.error('[NOTIFY] Failed to parse request body:', error)
    return { success: false, error: 'Invalid JSON in request body' }
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = `notify-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  console.log(`[NOTIFY ${requestId}] Starting notification process`)

  try {
    // Check authentication and get access token
    const session = await getServerSession()
    if (!session || !session.accessToken) {
      console.warn(`[NOTIFY ${requestId}] Authentication failed`)
      return NextResponse.json(
        { error: 'Authentication required. Please sign in again.' },
        { status: 401 }
      )
    }

    const accessToken = session.accessToken as string

    const { id: bidId } = await params
    console.log(`[NOTIFY ${requestId}] Processing bid: ${bidId}`)

    // Parse request body with error handling
    const parseResult = await parseRequestBody(request)
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error }, { status: 400 })
    }
    const { message, createEvent } = parseResult.data

    // Get bid
    const bid = await getBidById(bidId)
    if (!bid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
    }

    // Get division
    const division = await getDivisionById(bid.divisionId)
    if (!division) {
      return NextResponse.json(
        { error: 'Bid division not found' },
        { status: 404 }
      )
    }

    if (!bid.divisionConfirmed) {
      return NextResponse.json(
        { error: 'Division must be confirmed before notifying subcontractors' },
        { status: 400 }
      )
    }

    // Get subcontractors for this division
    const subcontractors = await getSubcontractors({ divisionId: bid.divisionId })

    if (subcontractors.length === 0) {
      return NextResponse.json(
        { error: 'No subcontractors found for this division' },
        { status: 400 }
      )
    }

    // Create bid responses for each subcontractor with error isolation
    // Using Promise.allSettled to ensure one failure doesn't block others
    console.log(`[NOTIFY ${requestId}] Creating bid responses for ${subcontractors.length} subcontractors`)

    const responseResults = await Promise.allSettled(
      subcontractors.map((subcontractor) =>
        upsertBidResponse({
          bidId: bid.id,
          subcontractorId: subcontractor.id,
          status: 'PENDING',
        })
      )
    )

    // Process results and log any failures
    const responses = []
    const failedResponses = []
    for (let i = 0; i < responseResults.length; i++) {
      const result = responseResults[i]
      if (result.status === 'fulfilled') {
        responses.push(result.value)
      } else {
        failedResponses.push({
          subcontractor: subcontractors[i],
          error: result.reason?.message || 'Unknown error',
        })
        console.error(`[NOTIFY ${requestId}] Failed to create response for ${subcontractors[i].email}:`, result.reason)
      }
    }

    if (failedResponses.length > 0) {
      console.warn(`[NOTIFY ${requestId}] ${failedResponses.length}/${subcontractors.length} bid responses failed to create`)
    }

    // Send emails to subcontractors
    const emailSubject = `New Bid Opportunity: ${bid.title}`
    const emailBody = `
      <h2>${bid.title}</h2>
      <p>${bid.description || ''}</p>
      <p><strong>Division:</strong> ${division.name}</p>
      ${bid.dueDate ? `<p><strong>Due Date:</strong> ${new Date(bid.dueDate).toLocaleDateString()}</p>` : ''}
      <p>${message || 'Please review this bid opportunity and respond at your earliest convenience.'}</p>
    `

    try {
      await sendEmail(accessToken, {
        to: subcontractors.map((sc) => sc.email),
        subject: emailSubject,
        body: emailBody,
      })

      // Create email thread record
      await createEmailThread({
        bidId: bid.id,
        subject: emailSubject,
        recipients: subcontractors.map((sc) => sc.email),
      })
    } catch (emailError) {
      console.error('Error sending emails:', emailError)
    }

    // Optionally create calendar event
    if (createEvent && bid.dueDate) {
      try {
        const eventStart = new Date(bid.dueDate)
        eventStart.setDate(eventStart.getDate() - 1) // Day before due date
        eventStart.setHours(9, 0, 0, 0)

        const eventEnd = new Date(eventStart)
        eventEnd.setHours(10, 0, 0, 0)

        const googleEvent = await createGoogleCalendarEvent(accessToken, {
          subject: `Bid Due: ${bid.title}`,
          body: `Reminder: Bid responses due for ${bid.title}`,
          start: eventStart,
          end: eventEnd,
          attendees: subcontractors.map((sc) => sc.email),
        })

        // Save calendar event to database
        await createCalendarEvent({
          bidId: bid.id,
          googleEventId: googleEvent.id || undefined,
          title: `Bid Due: ${bid.title}`,
          description: `Reminder: Bid responses due for ${bid.title}`,
          startTime: eventStart,
          endTime: eventEnd,
          attendees: subcontractors.map((sc) => sc.email),
        })
      } catch (eventError) {
        console.error('Error creating calendar event:', eventError)
      }
    }

    console.log(`[NOTIFY ${requestId}] Notification process completed successfully`)

    return NextResponse.json({
      message: failedResponses.length > 0
        ? `Subcontractors notified with ${failedResponses.length} failures`
        : 'Subcontractors notified successfully',
      notifiedCount: responses.length,
      failedCount: failedResponses.length,
      responses,
      ...(failedResponses.length > 0 && { failedSubcontractors: failedResponses.map(f => f.subcontractor.email) }),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error(`[NOTIFY] Error notifying subcontractors:`, {
      error: errorMessage,
      stack: errorStack,
    })
    return NextResponse.json(
      {
        error: 'Failed to notify subcontractors',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    )
  }
}
