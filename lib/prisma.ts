import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  // Check if DATABASE_URL is configured
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set')
    // Return a proxy that throws helpful errors
    return new Proxy({} as PrismaClient, {
      get(_, prop) {
        if (prop === 'then') return undefined // For Promise detection
        throw new Error(
          'Database not configured. Please set DATABASE_URL in your environment variables. ' +
          'Example: DATABASE_URL="postgresql://user:password@localhost:5432/crm_db"'
        )
      },
    })
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Check if the database is properly configured and connected
 */
export async function isDatabaseConfigured(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    return false
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}
