import { NextRequest, NextResponse } from 'next/server'
import { ConfidentialClientApplication } from '@azure/msal-node'
import { prisma } from '@/lib/prisma'

const msalConfig = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}`,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
  },
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=no_code`)
    }

    const msalClient = new ConfidentialClientApplication(msalConfig)

    const tokenResponse = await msalClient.acquireTokenByCode({
      code,
      scopes: ['https://graph.microsoft.com/.default'],
      redirectUri: process.env.MICROSOFT_REDIRECT_URI!,
    })

    if (!tokenResponse) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=token_failed`)
    }

    // Get user info from token
    const account = tokenResponse.account

    if (!account) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=no_account`)
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
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`)
    response.cookies.set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('Error in auth callback:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=auth_failed`)
  }
}
