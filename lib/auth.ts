import { cookies } from 'next/headers'
import { prisma } from './prisma'

export async function getCurrentUser() {
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

export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

export async function getAccessToken(): Promise<string | null> {
  const user = await getCurrentUser()

  if (!user?.msAccessToken) {
    return null
  }

  // Check if token is expired
  if (user.msTokenExpiry && new Date(user.msTokenExpiry) < new Date()) {
    console.warn('Access token expired')
    return null
  }

  return user.msAccessToken
}
