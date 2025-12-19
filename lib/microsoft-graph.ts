import { Client } from '@microsoft/microsoft-graph-client'

export async function getGraphClient(accessToken: string) {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken)
    },
  })
}

export async function createCalendarEvent(
  accessToken: string,
  event: {
    subject: string
    body: string
    start: Date
    end: Date
    location?: string
    attendees?: string[]
  }
) {
  const client = await getGraphClient(accessToken)

  const calendarEvent = {
    subject: event.subject,
    body: {
      contentType: 'HTML',
      content: event.body,
    },
    start: {
      dateTime: event.start.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: event.end.toISOString(),
      timeZone: 'UTC',
    },
    location: event.location ? {
      displayName: event.location,
    } : undefined,
    attendees: event.attendees?.map((email) => ({
      emailAddress: {
        address: email,
      },
      type: 'required',
    })),
  }

  const result = await client.api('/me/calendar/events').post(calendarEvent)
  return result
}

export async function sendEmail(
  accessToken: string,
  email: {
    to: string[]
    subject: string
    body: string
    cc?: string[]
  }
) {
  const client = await getGraphClient(accessToken)

  const message = {
    message: {
      subject: email.subject,
      body: {
        contentType: 'HTML',
        content: email.body,
      },
      toRecipients: email.to.map((addr) => ({
        emailAddress: {
          address: addr,
        },
      })),
      ccRecipients: email.cc?.map((addr) => ({
        emailAddress: {
          address: addr,
        },
      })),
    },
  }

  await client.api('/me/sendMail').post(message)
}

export async function getEmails(accessToken: string, folderId?: string) {
  const client = await getGraphClient(accessToken)
  const endpoint = folderId
    ? `/me/mailFolders/${folderId}/messages`
    : '/me/messages'

  const result = await client
    .api(endpoint)
    .top(50)
    .orderby('receivedDateTime DESC')
    .get()

  return result.value
}

export async function getCalendarEvents(
  accessToken: string,
  startDate: Date,
  endDate: Date
) {
  const client = await getGraphClient(accessToken)

  const result = await client
    .api('/me/calendar/events')
    .filter(
      `start/dateTime ge '${startDate.toISOString()}' and end/dateTime le '${endDate.toISOString()}'`
    )
    .orderby('start/dateTime')
    .get()

  return result.value
}

export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  updates: any
) {
  const client = await getGraphClient(accessToken)
  const result = await client.api(`/me/calendar/events/${eventId}`).patch(updates)
  return result
}

export async function deleteCalendarEvent(accessToken: string, eventId: string) {
  const client = await getGraphClient(accessToken)
  await client.api(`/me/calendar/events/${eventId}`).delete()
}
