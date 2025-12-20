# Google OAuth Setup Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Click **"Select a project"** → **"New Project"**
3. Project name: `CRM Bid Tracker`
4. Click **"Create"**

### Step 2: Enable APIs

1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search and enable these 3 APIs:
   - ✅ **Google Calendar API** (click "Enable")
   - ✅ **Gmail API** (click "Enable")
   - ✅ **Google+ API** (click "Enable")

### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (allows any Google account)
3. Click **"Create"**
4. Fill in:
   - **App name:** `CRM Bid Tracker`
   - **User support email:** Your email
   - **Developer contact:** Your email
5. Click **"Save and Continue"**
6. **Scopes:** Click **"Add or Remove Scopes"**
   - Search and add:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `.../auth/calendar`
     - `.../auth/gmail.send`
   - Click **"Update"** → **"Save and Continue"**
7. **Test users:** Click **"Add Users"**
   - Add your Gmail address
   - Click **"Save and Continue"**
8. Click **"Back to Dashboard"**

### Step 4: Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: `CRM Production`
5. **Authorized JavaScript origins:**
   - Add: `https://your-vercel-url.vercel.app`
6. **Authorized redirect URIs:**
   - Add: `https://your-vercel-url.vercel.app/api/auth/callback/google`
7. Click **"Create"**
8. **COPY** the Client ID and Client Secret (you'll need these!)

---

## 🔐 Environment Variables

Add these to **Vercel** → **Settings** → **Environment Variables**:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here

# NextAuth
NEXTAUTH_URL=https://your-vercel-url.vercel.app
NEXTAUTH_SECRET=generate-random-secret-here

# Database (you already have this)
DATABASE_URL=postgresql://...

# Optional
OPENAI_API_KEY=sk-...
```

### Generate NEXTAUTH_SECRET:

Run this command:
```bash
openssl rand -base64 32
```

Or use: https://generate-secret.vercel.app/32

---

## ✅ Complete Setup Checklist

- [ ] Created Google Cloud project
- [ ] Enabled Google Calendar API
- [ ] Enabled Gmail API
- [ ] Enabled Google+ API
- [ ] Configured OAuth consent screen
- [ ] Added test users
- [ ] Created OAuth credentials
- [ ] Added redirect URI
- [ ] Copied Client ID and Secret
- [ ] Added `GOOGLE_CLIENT_ID` to Vercel
- [ ] Added `GOOGLE_CLIENT_SECRET` to Vercel
- [ ] Added `NEXTAUTH_URL` to Vercel
- [ ] Generated and added `NEXTAUTH_SECRET` to Vercel
- [ ] Redeployed app

---

## 🧪 Test

1. Go to your app
2. Click **"Sign in with Google"**
3. Select your Gmail account
4. Grant permissions
5. You should land on `/dashboard`

**That's it! Much simpler than Microsoft! 🎉**
