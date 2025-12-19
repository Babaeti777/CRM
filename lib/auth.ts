import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ConfidentialClientApplication } from '@azure/msal-node'
import { prisma } from './prisma'

// Type for authenticated user
export interface AuthenticatedUser {
  id: string
  email: string
  name: string | null
  msAccessToken: string | null
  msRefreshToken: string | null
  msTokenExpiry: Date | null
}

// MSAL configuration
const getMsalConfig = () => ({
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}`,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
  },
})

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')?.value

    if (!userId) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

/**
 * Wrapper for protected API routes
 * Returns 401 if user is not authenticated
 */
export async function withAuth<T>(
  handler: (user: AuthenticatedUser) => Promise<T>
): Promise<T | NextResponse> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return handler(user)
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    )
  }
}

/**
 * Check if the access token is expired or about to expire (within 5 minutes)
 */
function isTokenExpired(expiryDate: Date | null): boolean {
  if (!expiryDate) return true

  const now = new Date()
  const bufferTime = 5 * 60 * 1000 // 5 minutes buffer
  return new Date(expiryDate).getTime() - bufferTime < now.getTime()
}

/**
 * Refresh the Microsoft access token using the refresh token
 */
async function refreshAccessToken(userId: string, refreshToken: string): Promise<string | null> {
  try {
    const msalClient = new ConfidentialClientApplication(getMsalConfig())

    const tokenResponse = await msalClient.acquireTokenByRefreshToken({
      refreshToken,
      scopes: ['User.Read', 'Calendars.ReadWrite', 'Mail.ReadWrite', 'Mail.Send', 'offline_access'],
    })

    if (!tokenResponse) {
      console.error('Failed to refresh token: no response')
      return null
    }

    // Update the user's tokens in the database
    await prisma.user.update({
      where: { id: userId },
      data: {
        msAccessToken: tokenResponse.accessToken,
        msTokenExpiry: tokenResponse.expiresOn || null,
      },
    })

    console.log('Token refreshed successfully')
    return tokenResponse.accessToken
  } catch (error) {
    console.error('Error refreshing token:', error)
    return null
  }
}

/**
 * Get a valid access token, refreshing if necessary
 */
export async function getAccessToken(): Promise<string | null> {
  const user = await getCurrentUser()

  if (!user?.msAccessToken) {
    return null
  }

  // Check if token is expired or about to expire
  if (isTokenExpired(user.msTokenExpiry)) {
    console.log('Access token expired or expiring soon, attempting refresh...')

    // If we have a refresh token, try to refresh
    if (user.msRefreshToken) {
      const newToken = await refreshAccessToken(user.id, user.msRefreshToken)
      if (newToken) {
        return newToken
      }
    }

    console.warn('Unable to refresh token, user needs to re-authenticate')
    return null
  }

  return user.msAccessToken
}

/**
 * Get access token with automatic refresh, returns both token and validity status
 */
export async function getValidAccessToken(): Promise<{
  token: string | null
  isValid: boolean
  needsReauth: boolean
}> {
  const user = await getCurrentUser()

  if (!user) {
    return { token: null, isValid: false, needsReauth: true }
  }

  if (!user.msAccessToken) {
    return { token: null, isValid: false, needsReauth: true }
  }

  // Token is still valid
  if (!isTokenExpired(user.msTokenExpiry)) {
    return { token: user.msAccessToken, isValid: true, needsReauth: false }
  }

  // Try to refresh
  if (user.msRefreshToken) {
    const newToken = await refreshAccessToken(user.id, user.msRefreshToken)
    if (newToken) {
      return { token: newToken, isValid: true, needsReauth: false }
    }
  }

  // Token expired and can't refresh
  return { token: null, isValid: false, needsReauth: true }
}
