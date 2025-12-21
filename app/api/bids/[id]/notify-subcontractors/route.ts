import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, createCalendarEvent } from '@/lib/google'
import { getServerSession } from 'next-auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and get access token
    const session = await getServerSession()
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in again.' },
        { status: 401 }
      )
    }

    const accessToken = session.accessToken as string

    const { id: bidId } = await params
    const body = await request.json()
    const { message, createEvent } = body

    // Get bid with division and subcontractors
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        division: {
          include: {
            subcontractors: {
              include: {
                subcontractor: true,
              },
            },
          },
        },
        documents: true,
      },
    })

    if (!bid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
    }

    if (!bid.division) {
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

    const subcontractors = bid.division.subcontractors.map(
      (sc: { subcontractor: { id: string; name: string; email: string; phone: string | null; company: string | null } }) => sc.subcontractor
    )

    if (subcontractors.length === 0) {
      return NextResponse.json(
        { error: 'No subcontractors found for this division' },
        { status: 400 }
      )
    }

    // Create bid responses for each subcontractor
    const responses = await Promise.all(
      subcontractors.map((subcontractor: { id: string; name: string; email: string }) =>
        prisma.bidResponse.upsert({
          where: {
            bidId_subcontractorId: {
              bidId: bid.id,
              subcontractorId: subcontractor.id,
            },
          },
          create: {
            bidId: bid.id,
            subcontractorId: subcontractor.id,
            status: 'PENDING',
          },
          update: {},
        })
      )
    )

    // Send emails to subcontractors
    const emailSubject = `New Bid Opportunity: ${bid.title}`
    const emailBody = `
      <h2>${bid.title}</h2>
      <p>${bid.description || ''}</p>
      <p><strong>Division:</strong> ${bid.division.name}</p>
      ${bid.dueDate ? `<p><strong>Due Date:</strong> ${new Date(bid.dueDate).toLocaleDateString()}</p>` : ''}
      <p>${message || 'Please review this bid opportunity and respond at your earliest convenience.'}</p>
      <p>Documents attached: ${bid.documents.length}</p>
    `

    try {
      await sendEmail(accessToken, {
        to: subcontractors.map((sc: { email: string }) => sc.email),
        subject: emailSubject,
        body: emailBody,
      })

      // Create email thread record
      await prisma.emailThread.create({
        data: {
          bidId: bid.id,
          subject: emailSubject,
          recipients: subcontractors.map((sc: { email: string }) => sc.email),
          lastMessageAt: new Date(),
        },
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

        const calendarEvent = await createCalendarEvent(accessToken, {
          subject: `Bid Due: ${bid.title}`,
          body: `Reminder: Bid responses due for ${bid.title}`,
          start: eventStart,
          end: eventEnd,
          attendees: subcontractors.map((sc: { email: string }) => sc.email),
        })

        // Save calendar event to database
        await prisma.calendarEvent.create({
          data: {
            bidId: bid.id,
            msEventId: calendarEvent.id,
            title: `Bid Due: ${bid.title}`,
            description: `Reminder: Bid responses due for ${bid.title}`,
            startTime: eventStart,
            endTime: eventEnd,
            attendees: subcontractors.map((sc: { email: string }) => sc.email),
          },
        })
      } catch (eventError) {
        console.error('Error creating calendar event:', eventError)
      }
    }

    return NextResponse.json({
      message: 'Subcontractors notified successfully',
      notifiedCount: subcontractors.length,
      responses,
    })
  } catch (error) {
    console.error('Error notifying subcontractors:', error)
    return NextResponse.json(
      { error: 'Failed to notify subcontractors' },
      { status: 500 }
    )
  }
}
