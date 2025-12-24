import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function maskUrl(url: string | undefined): string {
  if (!url) return 'NOT SET'
  if (url.length <= 20) return '***SET BUT SHORT***'
  // Show first 20 chars and last 10 chars
  return url.substring(0, 20) + '...' + url.substring(url.length - 10)
}

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
    database: {
      DATABASE_URL_EXISTS: !!databaseUrl,
      DATABASE_URL_LENGTH: databaseUrl?.length || 0,
      DATABASE_URL_PREVIEW: maskUrl(databaseUrl),
      DATABASE_URL_STARTS_WITH: databaseUrl?.substring(0, 15) || 'N/A',
    },
    auth: {
      GOOGLE_CLIENT_ID_EXISTS: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET_EXISTS: !!process.env.GOOGLE_CLIENT_SECRET,
      NEXTAUTH_SECRET_EXISTS: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    },
    instructions: !databaseUrl ? {
      problem: 'DATABASE_URL is not set in the Vercel environment',
      steps: [
        '1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables',
        '2. Make sure DATABASE_URL is added for Production, Preview, AND Development',
        '3. The value should start with: postgresql://',
        '4. Click Save after adding/editing',
        '5. Go to Deployments → Click "..." on latest → Redeploy',
        '6. IMPORTANT: Choose "Redeploy" NOT "Redeploy with existing Build Cache"',
      ]
    } : null
  })
}
