import { google } from 'googleapis'

export function getGoogleCalendar(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: accessToken })

  return google.calendar({ version: 'v3', auth: oauth2Client })
}

export function getGmail(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: accessToken })

  return google.gmail({ version: 'v1', auth: oauth2Client })
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
  const calendar = getGoogleCalendar(accessToken)

  const calendarEvent = {
    summary: event.subject,
    description: event.body,
    start: {
      dateTime: event.start.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: event.end.toISOString(),
      timeZone: 'UTC',
    },
    location: event.location,
    attendees: event.attendees?.map((email) => ({ email })),
  }

  const result = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: calendarEvent,
  })

  return result.data
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
  const gmail = getGmail(accessToken)

  const message = [
    `To: ${email.to.join(', ')}`,
    email.cc ? `Cc: ${email.cc.join(', ')}` : '',
    `Subject: ${email.subject}`,
    '',
    email.body,
  ]
    .filter(Boolean)
    .join('\n')

  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  })
}
