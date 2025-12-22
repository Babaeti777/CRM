import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface ConfigStatus {
  configured: boolean
  error?: string
  value?: string  // Masked value for debugging
}

function maskValue(value: string | undefined): string | undefined {
  if (!value) return undefined
  if (value.length <= 8) return '***'
  return value.substring(0, 4) + '...' + value.substring(value.length - 4)
}

function checkConfig(request: NextRequest): {
  database: ConfigStatus
  google: ConfigStatus
  nextauth: ConfigStatus
  openai: ConfigStatus
  overall: boolean
  environment: {
    nodeEnv: string
    vercelUrl: string | undefined
    appUrl: string | undefined
    host: string | null
  }
} {
  const database: ConfigStatus = {
    configured: !!process.env.DATABASE_URL,
    error: !process.env.DATABASE_URL ? 'DATABASE_URL not set' : undefined,
    value: maskValue(process.env.DATABASE_URL),
  }

  const googleConfigured =
    !!process.env.GOOGLE_CLIENT_ID &&
    !!process.env.GOOGLE_CLIENT_SECRET

  const google: ConfigStatus = {
    configured: googleConfigured,
    error: !googleConfigured
      ? 'Missing: ' +
        [
          !process.env.GOOGLE_CLIENT_ID && 'GOOGLE_CLIENT_ID',
          !process.env.GOOGLE_CLIENT_SECRET && 'GOOGLE_CLIENT_SECRET',
        ]
          .filter(Boolean)
          .join(', ')
      : undefined,
  }

  const nextauthConfigured = !!process.env.NEXTAUTH_SECRET
  const nextauth: ConfigStatus = {
    configured: nextauthConfigured,
    error: !nextauthConfigured ? 'NEXTAUTH_SECRET not set' : undefined,
  }

  const openai: ConfigStatus = {
    configured: !!process.env.OPENAI_API_KEY,
    error: !process.env.OPENAI_API_KEY ? 'OPENAI_API_KEY not set (optional)' : undefined,
  }

  return {
    database,
    google,
    nextauth,
    openai,
    overall: database.configured && googleConfigured && nextauthConfigured,
    environment: {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      vercelUrl: process.env.VERCEL_URL,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      host: request.headers.get('host'),
    },
  }
}

export async function GET(request: NextRequest) {
  const status = checkConfig(request)

  return NextResponse.json({
    status: status.overall ? 'healthy' : 'misconfigured',
    timestamp: new Date().toISOString(),
    environment: status.environment,
    config: {
      database: status.database,
      google: status.google,
      nextauth: status.nextauth,
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
            'DATABASE_URL - PostgreSQL connection string (e.g., postgresql://user:pass@host:5432/db)',
            'GOOGLE_CLIENT_ID - Google OAuth Client ID from Google Cloud Console',
            'GOOGLE_CLIENT_SECRET - Google OAuth Client Secret',
            'NEXTAUTH_SECRET - Random string for JWT encryption (run: openssl rand -base64 32)',
            'NEXTAUTH_URL - Your app URL (e.g., https://your-app.vercel.app)',
          ],
          optional: ['OPENAI_API_KEY - For AI-powered division suggestions'],
          googleCloudSteps: [
            '1. Go to Google Cloud Console > APIs & Services > Credentials',
            '2. Create OAuth 2.0 Client ID (Web application type)',
            '3. Add Authorized redirect URI: https://your-app.vercel.app/api/auth/callback/google',
            '4. Copy Client ID and Client Secret to Vercel environment variables',
          ],
          databaseSteps: [
            '1. Create a PostgreSQL database (e.g., on Neon, Supabase, or Railway)',
            '2. Copy the connection string to DATABASE_URL',
            '3. Run "npx prisma db push" locally or set up a deploy hook',
          ],
        }
      : undefined,
  })
}
