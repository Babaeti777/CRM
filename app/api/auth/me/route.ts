import { NextResponse } from 'next/server'
import { getCurrentUser, getValidAccessToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get valid access token with automatic refresh
    const tokenResult = await getValidAccessToken()

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      hasValidToken: tokenResult.isValid,
      accessToken: tokenResult.token,
      needsReauth: tokenResult.needsReauth,
    })
  } catch (error) {
    console.error('Error getting current user:', error)
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 })
  }
}
