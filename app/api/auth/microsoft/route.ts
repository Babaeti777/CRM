import { NextRequest, NextResponse } from 'next/server'

// Mark this route as dynamic (not static)
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get the base URL from environment or request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                    `https://${request.headers.get('host')}`)

    const redirectUri = process.env.MICROSOFT_REDIRECT_URI || `${baseUrl}/api/auth/callback`

    // Check if required env vars are present
    if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_TENANT_ID) {
      console.error('Missing Microsoft credentials')
      return NextResponse.json({
        error: 'Microsoft authentication not configured. Please set MICROSOFT_CLIENT_ID and MICROSOFT_TENANT_ID in environment variables.'
      }, { status: 500 })
    }

    const authUrl = `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?` +
      `client_id=${process.env.MICROSOFT_CLIENT_ID}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent('User.Read Calendars.ReadWrite Mail.ReadWrite Mail.Send offline_access')}` +
      `&response_mode=query`

    console.log('Auth URL:', authUrl)
    console.log('Redirect URI:', redirectUri)

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Error in auth route:', error)
    return NextResponse.json({ error: 'Failed to initiate authentication' }, { status: 500 })
  }
}
