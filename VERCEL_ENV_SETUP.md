# Vercel Environment Variables Setup

## Critical: Set These in Vercel Dashboard

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

### 1. Database (Required)
```
DATABASE_URL=postgresql://your-neon-or-supabase-url
```

### 2. Microsoft Azure AD (Required for Sign-in)
```
MICROSOFT_CLIENT_ID=your-azure-client-id
MICROSOFT_CLIENT_SECRET=your-azure-client-secret
MICROSOFT_TENANT_ID=your-azure-tenant-id
```

### 3. Microsoft Redirect URI (CRITICAL - Fix Sign-in Error)
```
MICROSOFT_REDIRECT_URI=https://your-vercel-url.vercel.app/api/auth/callback
```
**Replace `your-vercel-url.vercel.app` with your actual Vercel domain!**

Example:
- If your app is at: `crm-tracker.vercel.app`
- Set to: `https://crm-tracker.vercel.app/api/auth/callback`

### 4. App URL (Required)
```
NEXT_PUBLIC_APP_URL=https://your-vercel-url.vercel.app
```

### 5. OpenAI (Required for AI features)
```
OPENAI_API_KEY=sk-proj-your-openai-key
```

### 6. Upload Directory (Required)
```
UPLOAD_DIR=/tmp
```

## After Setting Variables

1. **Redeploy** the app in Vercel
2. **Update Azure AD** redirect URIs to match your Vercel URL
3. **Test sign-in** - should work now!

## Quick Fix for Sign-in Error

The error "AADSTS90102: 'redirect_uri' value must be a valid absolute URI" means:
- Either MICROSOFT_REDIRECT_URI is not set in Vercel
- OR it doesn't match what's configured in Azure AD

**Fix:**
1. Get your Vercel URL (e.g., `https://crm-tracker.vercel.app`)
2. Set MICROSOFT_REDIRECT_URI to: `https://YOUR-URL.vercel.app/api/auth/callback`
3. Add same URL to Azure AD → Your App → Authentication → Redirect URIs
4. Redeploy

Your app should work after this! 🚀
