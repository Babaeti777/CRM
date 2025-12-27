import { NextRequest, NextResponse } from 'next/server'
import { validateFirebaseConnection, isFirebaseConfigured } from '@/lib/firebase'

export const dynamic = 'force-dynamic'

interface ConfigStatus {
  configured: boolean
  connected?: boolean
  latencyMs?: number
  error?: string
}

async function checkConfig(request: NextRequest): Promise<{
  firebase: ConfigStatus
  google: ConfigStatus
  openai: ConfigStatus
  overall: boolean
  environment: {
    nodeEnv: string
    vercelUrl: string | undefined
    appUrl: string | undefined
    host: string | null
  }
}> {
  // Check Firebase configuration and actual connectivity
  const firebaseConfigured = isFirebaseConfigured()
  let firebase: ConfigStatus = {
    configured: firebaseConfigured,
    error: !firebaseConfigured ? 'FIREBASE_SERVICE_ACCOUNT_KEY not set' : undefined,
  }

  // If configured, validate actual connectivity
  if (firebaseConfigured) {
    const fbValidation = await validateFirebaseConnection()
    firebase = {
      ...firebase,
      connected: fbValidation.connected,
      latencyMs: fbValidation.latencyMs,
      error: fbValidation.error,
    }
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

  const openai: ConfigStatus = {
    configured: !!process.env.OPENAI_API_KEY,
    error: !process.env.OPENAI_API_KEY ? 'OPENAI_API_KEY not set' : undefined,
  }

  // Overall health requires Firebase to be both configured AND connected
  const fbHealthy = firebase.configured && firebase.connected !== false

  return {
    firebase,
    google,
    openai,
    overall: fbHealthy && google.configured,
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
      firebase: status.firebase,
      google: status.google,
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
            'FIREBASE_SERVICE_ACCOUNT_KEY - Firebase service account JSON (base64 encoded)',
            'GOOGLE_CLIENT_ID - Google OAuth Client ID',
            'GOOGLE_CLIENT_SECRET - Google OAuth Client Secret',
            'NEXTAUTH_SECRET - NextAuth secret for JWT signing',
            'NEXTAUTH_URL - Your app URL (e.g., https://your-app.vercel.app)',
          ],
          optional: ['OPENAI_API_KEY - For AI-powered division suggestions'],
        }
      : undefined,
  })
}
