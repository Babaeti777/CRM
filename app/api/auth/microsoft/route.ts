import { NextRequest, NextResponse } from 'next/server'

// Mark this route as dynamic (not static)
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Get the base URL from environment or request
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                  `https://${request.headers.get('host')}`

  const redirectUri = process.env.MICROSOFT_REDIRECT_URI || `${baseUrl}/api/auth/callback`

  const authUrl = `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?` +
    `client_id=${process.env.MICROSOFT_CLIENT_ID}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent('https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/Mail.Read User.Read')}` +
    `&response_mode=query`

  console.log('Auth redirect URI:', redirectUri) // Debug log

  return NextResponse.redirect(authUrl)
}
