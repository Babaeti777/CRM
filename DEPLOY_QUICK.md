# One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Babaeti777/CRM&project-name=crm-bid-tracking&repo-name=crm-bid-tracking)

## Quick Start for Web Deployment

This app can be deployed to the web in minutes!

### 1. Click the Deploy Button Above

OR manually deploy:

### 2. Set Up Free Cloud Database

**Neon (Recommended - FREE):**
1. Go to https://neon.tech
2. Sign up → Create Project
3. Copy connection string

**Supabase (Alternative - FREE):**
1. Go to https://supabase.com
2. Create Project
3. Copy PostgreSQL connection string

### 3. Deploy to Vercel

**Automatic (Recommended):**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Manual:**
1. Go to https://vercel.com
2. Import GitHub repository
3. Add environment variables (see below)
4. Deploy!

### 4. Required Environment Variables

Add these in Vercel Dashboard (Settings → Environment Variables):

```env
DATABASE_URL=postgresql://...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_TENANT_ID=...
MICROSOFT_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
UPLOAD_DIR=/tmp
```

### 5. Update Azure AD

Go to Azure Portal → Your App → Authentication:
- Add redirect URI: `https://your-app.vercel.app/api/auth/callback`

### 6. Initialize Database

After deployment:
```bash
# Set DATABASE_URL to your production database
DATABASE_URL="your_production_url" npx prisma db push
DATABASE_URL="your_production_url" npx tsx prisma/seed.ts
```

### 7. Access from Any Device

Visit your Vercel URL from:
- Phone (iOS/Android)
- Tablet
- Desktop
- Any browser

**Add to Home Screen** on mobile for app-like experience!

---

## Cost: $0/month

- Vercel Hobby: FREE
- Neon Database: FREE (0.5GB)
- Total: FREE! 🎉

---

## Mobile Features

✅ Responsive design
✅ Touch-friendly interface
✅ Works offline (PWA-ready)
✅ Add to home screen
✅ Push notifications (can be added)

---

## Alternative Platforms

### Railway
```bash
# One command deploy
railway up
```

### Render
- Go to render.com
- Connect GitHub
- Deploy!

### AWS/Azure
- For enterprise deployments
- See DEPLOYMENT.md for details

---

## Need Help?

See `DEPLOYMENT.md` for detailed instructions!
