import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if token is expired
    const isTokenValid = user.msAccessToken &&
      (!user.msTokenExpiry || new Date(user.msTokenExpiry) > new Date())

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      hasValidToken: isTokenValid,
      accessToken: isTokenValid ? user.msAccessToken : null,
    })
  } catch (error) {
    console.error('Error getting current user:', error)
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 })
  }
}
