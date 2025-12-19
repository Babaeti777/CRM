# ⚠️ Critical: Database Not Connected

## The Error

```
GET /api/divisions 500 (Internal Server Error)
TypeError: s.map is not a function
```

This means your **database is NOT connected** to the Vercel deployment.

## Quick Fix (2 minutes)

### Step 1: Set DATABASE_URL in Vercel

You **MUST** add your database connection string:

1. Go to **Vercel Dashboard**
2. Click your project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Enter:
   - **Name:** `DATABASE_URL`
   - **Value:** Your database connection string

**Where to get the connection string:**

#### Option A: Neon (Recommended - FREE)
1. Go to https://neon.tech
2. Sign up (free)
3. Create new project
4. Copy the connection string (looks like):
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

#### Option B: Supabase (FREE)
1. Go to https://supabase.com
2. Create project
3. Go to Settings → Database → Connection string (URI mode)
4. Copy it

### Step 2: Add to Vercel

Paste the connection string in Vercel:
```
Name: DATABASE_URL
Value: postgresql://user:password@host/database?sslmode=require
Environment: Production, Preview, Development
```

### Step 3: Initialize Database

After adding DATABASE_URL, run these commands locally:

```bash
# Set your production database URL
DATABASE_URL="your-production-url" npx prisma db push

# Seed initial data
DATABASE_URL="your-production-url" npx tsx prisma/seed.ts
```

This creates the database tables and adds sample divisions.

### Step 4: Redeploy

```bash
vercel --prod --force
```

OR in Vercel Dashboard: **Deployments → Redeploy**

## All Required Environment Variables

Make sure ALL of these are set in Vercel:

```
DATABASE_URL=postgresql://...
MICROSOFT_CLIENT_ID=your-azure-id
MICROSOFT_CLIENT_SECRET=your-azure-secret
MICROSOFT_TENANT_ID=your-tenant-id
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
UPLOAD_DIR=/tmp
```

**Optional (but recommended):**
```
MICROSOFT_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback
```

## Why This Happened

The app needs a database to store:
- Bids
- Divisions
- Subcontractors
- Responses
- Everything else

Without `DATABASE_URL`, the API routes fail with 500 errors.

## After Setting DATABASE_URL

1. **Redeploy** the app
2. **Wait 2-3 minutes** for deployment
3. **Visit your app**
4. Dashboard should load ✅
5. You can create bids ✅

## Success Checklist

- [ ] Created database on Neon or Supabase
- [ ] Copied connection string
- [ ] Added `DATABASE_URL` to Vercel
- [ ] Ran `prisma db push` with production URL
- [ ] Ran seed script to add divisions
- [ ] Redeployed app
- [ ] App works! 🎉

**The database is the most critical piece - everything else depends on it!**
