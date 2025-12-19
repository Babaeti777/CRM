import { NextRequest, NextResponse } from 'next/server'
import { ConfidentialClientApplication } from '@azure/msal-node'
import { prisma } from '@/lib/prisma'

// Mark this route as dynamic (not static)
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const getMsalConfig = () => ({
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}`,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
  },
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')

    // Get the base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                    `https://${request.headers.get('host')}`)

    if (!code) {
      return NextResponse.redirect(`${baseUrl}?error=no_code`)
    }

    const redirectUri = process.env.MICROSOFT_REDIRECT_URI || `${baseUrl}/api/auth/callback`

    const msalClient = new ConfidentialClientApplication(getMsalConfig())

    const tokenResponse = await msalClient.acquireTokenByCode({
      code,
      scopes: ['User.Read', 'Calendars.ReadWrite', 'Mail.ReadWrite', 'Mail.Send', 'offline_access'],
      redirectUri: redirectUri,
    })

    if (!tokenResponse) {
      return NextResponse.redirect(`${baseUrl}?error=token_failed`)
    }

    // Get user info from token
    const account = tokenResponse.account

    if (!account) {
      return NextResponse.redirect(`${baseUrl}?error=no_account`)
    }

    // Save or update user
    const user = await prisma.user.upsert({
      where: { email: account.username },
      create: {
        email: account.username,
        name: account.name || account.username,
        msAccessToken: tokenResponse.accessToken,
        msRefreshToken: null, // MSAL handles refresh tokens internally via cache
        msTokenExpiry: tokenResponse.expiresOn || null,
      },
      update: {
        msAccessToken: tokenResponse.accessToken,
        msRefreshToken: null, // MSAL handles refresh tokens internally via cache
        msTokenExpiry: tokenResponse.expiresOn || null,
      },
    })

    // In production, set httpOnly cookie with session token
    const response = NextResponse.redirect(`${baseUrl}/dashboard`)
    response.cookies.set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('Error in auth callback:', error)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    return NextResponse.redirect(`${baseUrl}?error=auth_failed`)
  }
}
