import { PrismaClient } from '@prisma/client'

// Define types for Prisma log events
interface LogEvent {
  timestamp: Date
  message: string
  target: string
}

interface QueryEvent {
  timestamp: Date
  query: string
  params: string
  duration: number
  target: string
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  dbConnectionValidated: boolean | undefined
}

// Connection pool configuration for serverless environments
const POOL_CONFIG = {
  // Maximum connections in the pool (lower for serverless to prevent exhaustion)
  connectionLimit: parseInt(process.env.DATABASE_POOL_SIZE || '5', 10),
  // Connection timeout in seconds
  connectTimeout: parseInt(process.env.DATABASE_CONNECT_TIMEOUT || '10', 10),
}

/**
 * Custom logger for database error/warn events
 */
function logDatabaseEvent(event: LogEvent) {
  const timestamp = new Date().toISOString()
  console.error(`[DB ${timestamp}]`, event.message)
}

/**
 * Custom logger for database query events
 */
function logQueryEvent(event: QueryEvent) {
  const timestamp = new Date().toISOString()
  console.log(`[DB QUERY ${timestamp}] Duration: ${event.duration}ms`)
}

function createPrismaClient(): PrismaClient {
  // Check if DATABASE_URL is configured
  if (!process.env.DATABASE_URL) {
    console.error('[DB ERROR] DATABASE_URL environment variable is not set')
    // Return a proxy that throws helpful errors
    return new Proxy({} as PrismaClient, {
      get(_, prop) {
        if (prop === 'then') return undefined // For Promise detection
        if (prop === '$disconnect') return () => Promise.resolve() // Allow disconnect
        throw new Error(
          'Database not configured. Please set DATABASE_URL in your environment variables. ' +
          'Example: DATABASE_URL="postgresql://user:password@localhost:5432/crm_db?connection_limit=5"'
        )
      },
    })
  }

  // Ensure connection URL has proper pooling parameters for serverless
  let connectionUrl = process.env.DATABASE_URL
  if (!connectionUrl.includes('connection_limit') && !connectionUrl.includes('pool_timeout')) {
    const separator = connectionUrl.includes('?') ? '&' : '?'
    connectionUrl = `${connectionUrl}${separator}connection_limit=${POOL_CONFIG.connectionLimit}&connect_timeout=${POOL_CONFIG.connectTimeout}`
  }

  const client = new PrismaClient({
    log: [
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
      ...(process.env.DATABASE_QUERY_LOGGING === 'true' ? [{ level: 'query' as const, emit: 'event' as const }] : []),
    ],
    datasources: {
      db: {
        url: connectionUrl,
      },
    },
  })

  // Attach event listeners for logging
  client.$on('error', logDatabaseEvent)
  client.$on('warn', logDatabaseEvent)
  if (process.env.DATABASE_QUERY_LOGGING === 'true') {
    client.$on('query', logQueryEvent)
  }

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Check if the database is properly configured (without connecting)
 */
export function isDatabaseUrlConfigured(): boolean {
  return !!process.env.DATABASE_URL
}

/**
 * Validate database connection with detailed error reporting
 * Returns connection status and any error details
 */
export async function validateDatabaseConnection(): Promise<{
  connected: boolean
  latencyMs?: number
  error?: string
  errorCode?: string
}> {
  if (!process.env.DATABASE_URL) {
    return {
      connected: false,
      error: 'DATABASE_URL environment variable is not set',
      errorCode: 'ENV_MISSING',
    }
  }

  const startTime = Date.now()

  try {
    await prisma.$queryRaw`SELECT 1`
    const latencyMs = Date.now() - startTime
    globalForPrisma.dbConnectionValidated = true
    return { connected: true, latencyMs }
  } catch (error) {
    const latencyMs = Date.now() - startTime
    globalForPrisma.dbConnectionValidated = false

    // Parse Prisma errors for better diagnostics using duck typing
    // since Prisma error classes may not be available at compile time
    const prismaError = error as { code?: string; message?: string; name?: string }

    if (prismaError.name === 'PrismaClientKnownRequestError' && prismaError.code) {
      return {
        connected: false,
        latencyMs,
        error: `Database error: ${prismaError.message || 'Unknown error'}`,
        errorCode: prismaError.code,
      }
    }

    if (prismaError.name === 'PrismaClientInitializationError') {
      // Common connection issues
      const errorMsg = (prismaError.message || '').toLowerCase()
      if (errorMsg.includes('connection refused')) {
        return {
          connected: false,
          latencyMs,
          error: 'Database connection refused. Check if the database server is running and accessible.',
          errorCode: 'CONNECTION_REFUSED',
        }
      }
      if (errorMsg.includes('timeout')) {
        return {
          connected: false,
          latencyMs,
          error: 'Database connection timed out. Check network connectivity and firewall rules.',
          errorCode: 'CONNECTION_TIMEOUT',
        }
      }
      if (errorMsg.includes('authentication') || errorMsg.includes('password')) {
        return {
          connected: false,
          latencyMs,
          error: 'Database authentication failed. Check username and password in DATABASE_URL.',
          errorCode: 'AUTH_FAILED',
        }
      }
      return {
        connected: false,
        latencyMs,
        error: `Database initialization error: ${prismaError.message || 'Unknown error'}`,
        errorCode: 'INIT_ERROR',
      }
    }

    return {
      connected: false,
      latencyMs,
      error: error instanceof Error ? error.message : 'Unknown database error',
      errorCode: 'UNKNOWN',
    }
  }
}

/**
 * Check if the database is properly configured and connected
 * @deprecated Use validateDatabaseConnection() for better error details
 */
export async function isDatabaseConfigured(): Promise<boolean> {
  const result = await validateDatabaseConnection()
  return result.connected
}

/**
 * Gracefully disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.error('[DB ERROR] Failed to disconnect:', error)
  }
}

/**
 * Execute a database operation with automatic retry on transient errors
 */
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  options: { maxRetries?: number; retryDelayMs?: number } = {}
): Promise<T> {
  const { maxRetries = 3, retryDelayMs = 1000 } = options
  let lastError: Error | undefined

  // Transient error codes that warrant retry
  const TRANSIENT_ERROR_CODES = ['P1001', 'P1002', 'P1008', 'P1017', 'P2024']

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Check if this is a transient Prisma error using duck typing
      const prismaError = error as { code?: string; name?: string }
      const isTransient =
        prismaError.name === 'PrismaClientKnownRequestError' &&
        typeof prismaError.code === 'string' &&
        TRANSIENT_ERROR_CODES.includes(prismaError.code)

      if (!isTransient || attempt === maxRetries) {
        throw lastError
      }

      console.warn(`[DB WARN] Transient error on attempt ${attempt}/${maxRetries}, retrying in ${retryDelayMs}ms...`)
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt))
    }
  }

  throw lastError
}
