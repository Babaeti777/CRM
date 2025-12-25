import { NextRequest, NextResponse } from 'next/server'
import { validateDatabaseConnection, isDatabaseUrlConfigured } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface ConfigStatus {
  configured: boolean
  connected?: boolean
  latencyMs?: number
  error?: string
  errorCode?: string
  value?: string  // Masked value for debugging
}

function maskValue(value: string | undefined): string | undefined {
  if (!value) return undefined
  if (value.length <= 8) return '***'
  return value.substring(0, 4) + '...' + value.substring(value.length - 4)
}

async function checkConfig(request: NextRequest): Promise<{
  database: ConfigStatus
  microsoft: ConfigStatus & { redirectUri?: string }
  openai: ConfigStatus
  overall: boolean
  environment: {
    nodeEnv: string
    vercelUrl: string | undefined
    appUrl: string | undefined
    host: string | null
  }
}> {
  // Check database configuration and actual connectivity
  const dbUrlConfigured = isDatabaseUrlConfigured()
  let database: ConfigStatus = {
    configured: dbUrlConfigured,
    error: !dbUrlConfigured ? 'DATABASE_URL not set' : undefined,
    value: maskValue(process.env.DATABASE_URL),
  }

  // If URL is configured, validate actual connectivity
  if (dbUrlConfigured) {
    const dbValidation = await validateDatabaseConnection()
    database = {
      ...database,
      connected: dbValidation.connected,
      latencyMs: dbValidation.latencyMs,
      error: dbValidation.error,
      errorCode: dbValidation.errorCode,
    }
  }

  const microsoftConfigured =
    !!process.env.MICROSOFT_CLIENT_ID &&
    !!process.env.MICROSOFT_TENANT_ID &&
    !!process.env.MICROSOFT_CLIENT_SECRET

  // Calculate what redirect URI will be used
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                  `https://${request.headers.get('host')}`)
  const computedRedirectUri = process.env.MICROSOFT_REDIRECT_URI || `${baseUrl}/api/auth/callback`

  const microsoft: ConfigStatus & { redirectUri?: string } = {
    configured: microsoftConfigured,
    error: !microsoftConfigured
      ? 'Missing: ' +
        [
          !process.env.MICROSOFT_CLIENT_ID && 'MICROSOFT_CLIENT_ID',
          !process.env.MICROSOFT_TENANT_ID && 'MICROSOFT_TENANT_ID',
          !process.env.MICROSOFT_CLIENT_SECRET && 'MICROSOFT_CLIENT_SECRET',
        ]
          .filter(Boolean)
          .join(', ')
      : undefined,
    redirectUri: computedRedirectUri,
  }

  const openai: ConfigStatus = {
    configured: !!process.env.OPENAI_API_KEY,
    error: !process.env.OPENAI_API_KEY ? 'OPENAI_API_KEY not set' : undefined,
  }

  // Overall health requires database to be both configured AND connected
  const dbHealthy = database.configured && database.connected !== false

  return {
    database,
    microsoft,
    openai,
    overall: dbHealthy && microsoft.configured,
    environment: {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      vercelUrl: process.env.VERCEL_URL,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      host: request.headers.get('host'),
    },
  }
}

export async function GET(request: NextRequest) {
  const status = await checkConfig(request)

  return NextResponse.json({
    status: status.overall ? 'healthy' : 'misconfigured',
    timestamp: new Date().toISOString(),
    environment: status.environment,
    config: {
      database: status.database,
      microsoft: status.microsoft,
      openai: status.openai,
    },
    instructions: !status.overall
      ? {
          message: 'Please configure environment variables in Vercel Dashboard',
          vercelSteps: [
            '1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables',
            '2. Add each required variable for Production environment',
            '3. Redeploy your application after adding variables',
          ],
          required: [
            'DATABASE_URL - PostgreSQL connection string',
            'MICROSOFT_CLIENT_ID - Azure AD App Client ID',
            'MICROSOFT_TENANT_ID - Azure AD Tenant ID',
            'MICROSOFT_CLIENT_SECRET - Azure AD App Secret',
            'MICROSOFT_REDIRECT_URI - Must match Azure AD exactly (e.g., https://crm-blond-six.vercel.app/api/auth/callback)',
            'NEXT_PUBLIC_APP_URL - Your app URL (e.g., https://crm-blond-six.vercel.app)',
          ],
          optional: ['OPENAI_API_KEY - For AI-powered division suggestions'],
          azureSteps: [
            '1. Go to Azure Portal > Azure Active Directory > App registrations',
            '2. Select your app > Authentication',
            '3. Under Redirect URIs, add: https://crm-blond-six.vercel.app/api/auth/callback',
            '4. Ensure URI matches EXACTLY (no trailing slash)',
          ],
        }
      : undefined,
  })
}
