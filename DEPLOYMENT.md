# Web Deployment Guide

## Quick Deploy to Vercel (Recommended - FREE)

Vercel is the easiest way to deploy this Next.js app with automatic HTTPS and global CDN.

### Step 1: Prepare Your Code

Your code is already ready! It's on the `claude/crm-bid-tracking-system-v9f9i` branch.

### Step 2: Set Up Cloud Database

Choose one of these **FREE** PostgreSQL options:

#### Option A: Neon (Recommended)
1. Go to [neon.tech](https://neon.tech)
2. Sign up for free account
3. Create new project
4. Copy the connection string (looks like: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb`)
5. Save this for later

#### Option B: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Sign up and create new project
3. Go to Settings → Database
4. Copy the connection string (URI mode)
5. Save this for later

#### Option C: Railway
1. Go to [railway.app](https://railway.app)
2. Sign up and create new PostgreSQL database
3. Copy the connection string
4. Save this for later

### Step 3: Deploy to Vercel

#### A. Using Vercel Dashboard (Easiest)

1. **Go to Vercel:**
   - Visit [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Your Repository:**
   - Click "Add New Project"
   - Import your GitHub repository `Babaeti777/CRM`
   - Select the branch: `claude/crm-bid-tracking-system-v9f9i`

3. **Configure Build Settings:**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next` (default)

4. **Add Environment Variables:**
   Click "Environment Variables" and add these:

   ```
   DATABASE_URL=your_neon_or_supabase_connection_string

   MICROSOFT_CLIENT_ID=your_azure_client_id
   MICROSOFT_CLIENT_SECRET=your_azure_client_secret
   MICROSOFT_TENANT_ID=your_azure_tenant_id
   MICROSOFT_REDIRECT_URI=https://your-app-name.vercel.app/api/auth/callback

   OPENAI_API_KEY=your_openai_api_key

   NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
   UPLOAD_DIR=/tmp
   ```

   **Note:** You'll need to update `MICROSOFT_REDIRECT_URI` and `NEXT_PUBLIC_APP_URL` with your actual Vercel URL after deployment.

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - You'll get a URL like: `https://your-app-name.vercel.app`

#### B. Using Vercel CLI (Alternative)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts
# Set environment variables when prompted
```

### Step 4: Update Azure AD Redirect URIs

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Azure AD App Registration
3. Go to "Authentication"
4. Add new redirect URI:
   - `https://your-app-name.vercel.app/api/auth/callback`
5. Save changes

### Step 5: Initialize Production Database

After deployment, you need to push your schema to the production database:

```bash
# Set your production DATABASE_URL
DATABASE_URL="your_production_database_url" npx prisma db push

# Seed the database
DATABASE_URL="your_production_database_url" npx tsx prisma/seed.ts
```

**OR** use Vercel's terminal:
1. Go to your project in Vercel Dashboard
2. Click on "Deployments" → Latest Deployment
3. Click "..." → "Connect to Preview"
4. Run commands in the browser terminal:
   ```bash
   npx prisma db push
   npx tsx prisma/seed.ts
   ```

### Step 6: Test Your Deployment

1. Visit your Vercel URL
2. Click "Sign in with Microsoft"
3. Authorize the app
4. Start creating bids!

---

## Alternative: Deploy to Railway

Railway offers easy deployment with built-in PostgreSQL:

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add PostgreSQL database (automatically creates DATABASE_URL)
6. Add other environment variables
7. Deploy!

Your app will be available at: `https://your-app.railway.app`

---

## Alternative: Deploy to Render

1. Go to [render.com](https://render.com)
2. Sign up and create "New Web Service"
3. Connect your GitHub repository
4. Configure:
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm start`
5. Add PostgreSQL database
6. Set environment variables
7. Deploy!

---

## Mobile Access

Once deployed, you can access your app from any device:

### On iPhone/Android:
1. Open browser (Safari/Chrome)
2. Visit your Vercel URL
3. Sign in with Microsoft
4. **Add to Home Screen** for app-like experience:
   - **iPhone:** Tap Share → Add to Home Screen
   - **Android:** Tap Menu → Add to Home Screen

### Progressive Web App (PWA)
The app is mobile-responsive and works great on phones!

---

## File Upload in Production

**Important:** Vercel has read-only filesystem except `/tmp`.

For production file uploads, use cloud storage:

### Option 1: Vercel Blob Storage
```bash
npm install @vercel/blob
```

### Option 2: AWS S3
```bash
npm install @aws-sdk/client-s3
```

### Option 3: Cloudinary
```bash
npm install cloudinary
```

I can help you implement any of these if needed!

---

## Cost Breakdown (FREE Options)

- **Vercel Hobby Plan:** FREE
  - Unlimited deployments
  - Automatic HTTPS
  - Global CDN
  - 100GB bandwidth/month

- **Neon Free Tier:** FREE
  - 0.5 GB storage
  - Unlimited databases
  - Auto-scaling

- **Total Cost:** $0/month for starting! 🎉

When you need to scale:
- Vercel Pro: $20/month (team features, more bandwidth)
- Neon Pro: $19/month (more storage, better performance)

---

## Post-Deployment Checklist

- [ ] Database deployed and seeded
- [ ] Azure redirect URIs updated
- [ ] Environment variables set
- [ ] Microsoft OAuth working
- [ ] AI features working (OpenAI)
- [ ] Can access from phone
- [ ] Can create bids
- [ ] Can upload documents
- [ ] Email notifications working
- [ ] Calendar integration working

---

## Quick Deploy Commands

```bash
# 1. Push to GitHub (already done!)
git push origin claude/crm-bid-tracking-system-v9f9i

# 2. Deploy to Vercel
vercel --prod

# 3. Set up database
DATABASE_URL="your_url" npx prisma db push
DATABASE_URL="your_url" npx tsx prisma/seed.ts
```

---

## Troubleshooting

### "Database connection failed"
- Verify DATABASE_URL in Vercel environment variables
- Make sure database allows external connections
- Check if Prisma schema was pushed

### "Microsoft login not working"
- Update redirect URIs in Azure AD
- Check MICROSOFT_* environment variables
- Verify tenant ID is correct

### "File upload fails"
- Use `/tmp` for UPLOAD_DIR in production
- Consider implementing cloud storage (S3, Cloudinary)

### "Can't access from phone"
- Verify HTTPS is enabled (Vercel does this automatically)
- Check if URL is publicly accessible
- Clear browser cache on phone

---

## Need Help?

1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Test Microsoft OAuth flow

Ready to deploy! 🚀
