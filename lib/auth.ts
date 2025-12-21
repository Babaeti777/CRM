import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

// Type for authenticated user (simplified - no MS fields)
export interface AuthenticatedUser {
  id: string
  email: string
  name: string | null
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return null
    }

    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.name || null,
    }
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
