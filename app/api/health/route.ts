import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface ConfigStatus {
  configured: boolean
  error?: string
}

function checkConfig(): {
  database: ConfigStatus
  microsoft: ConfigStatus
  openai: ConfigStatus
  overall: boolean
} {
  const database: ConfigStatus = {
    configured: !!process.env.DATABASE_URL,
    error: !process.env.DATABASE_URL ? 'DATABASE_URL not set' : undefined,
  }

  const microsoftConfigured =
    !!process.env.MICROSOFT_CLIENT_ID &&
    !!process.env.MICROSOFT_TENANT_ID &&
    !!process.env.MICROSOFT_CLIENT_SECRET

  const microsoft: ConfigStatus = {
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
  }

  const openai: ConfigStatus = {
    configured: !!process.env.OPENAI_API_KEY,
    error: !process.env.OPENAI_API_KEY ? 'OPENAI_API_KEY not set' : undefined,
  }

  return {
    database,
    microsoft,
    openai,
    overall: database.configured && microsoft.configured,
  }
}

export async function GET() {
  const status = checkConfig()

  return NextResponse.json({
    status: status.overall ? 'healthy' : 'misconfigured',
    timestamp: new Date().toISOString(),
    config: {
      database: status.database,
      microsoft: status.microsoft,
      openai: status.openai,
    },
    instructions: !status.overall
      ? {
          message: 'Please configure the required environment variables',
          required: [
            'DATABASE_URL - PostgreSQL connection string',
            'MICROSOFT_CLIENT_ID - Azure AD App Client ID',
            'MICROSOFT_TENANT_ID - Azure AD Tenant ID',
            'MICROSOFT_CLIENT_SECRET - Azure AD App Secret',
          ],
          optional: ['OPENAI_API_KEY - For AI-powered division suggestions'],
          documentation: '/SETUP_GUIDE.md',
        }
      : undefined,
  })
}
