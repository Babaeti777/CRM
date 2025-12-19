# Fix Sign-In Error: Quick Guide

## The Error You're Seeing

```
AADSTS90102: 'redirect_uri' value must be a valid absolute URI
```

This means the redirect URI either:
1. Isn't set in Vercel environment variables
2. Doesn't match what's in Azure AD
3. Is malformed

## Quick Fix (5 minutes)

### Step 1: Get Your Vercel URL

Your app is deployed at something like:
- `https://crm-tracker.vercel.app` OR
- `https://your-app-name.vercel.app` OR
- `https://your-project-git-branch.vercel.app`

**Find it:** Go to Vercel Dashboard → Your Project → Domains

### Step 2: Set Environment Variable in Vercel

1. Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. Click **"Add New"**
3. Enter:
   - **Name:** `MICROSOFT_REDIRECT_URI`
   - **Value:** `https://YOUR-ACTUAL-URL.vercel.app/api/auth/callback`

   **Example:** If your URL is `https://crm-bid-tracker.vercel.app`, enter:
   ```
   https://crm-bid-tracker.vercel.app/api/auth/callback
   ```

4. Select **Production, Preview, and Development**
5. Click **Save**

### Step 3: Add Same URL to Azure AD

1. Go to: **https://portal.azure.com**
2. Navigate to: **Azure Active Directory → App registrations → Your App**
3. Click **Authentication** (left sidebar)
4. Under **Web** platform, click **"Add URI"**
5. Enter: `https://YOUR-ACTUAL-URL.vercel.app/api/auth/callback`
6. Click **Save** at the bottom

### Step 4: Redeploy

```bash
vercel --prod --force
```

OR in Vercel Dashboard: **Deployments → Redeploy**

### Step 5: Test

1. Go to your Vercel URL
2. Click "Sign in with Microsoft"
3. Should work! ✅

## Still Not Working?

### Check These:

1. **URLs must match EXACTLY:**
   - Vercel env var: `https://your-app.vercel.app/api/auth/callback`
   - Azure AD redirect URI: `https://your-app.vercel.app/api/auth/callback`
   - Must include `https://`
   - Must include `/api/auth/callback`
   - No trailing slash

2. **Check capitalization:**
   - Use lowercase
   - Example: `vercel.app` not `Vercel.App`

3. **Wait 2-3 minutes:**
   - Azure AD changes take time to propagate
   - Redeploy after adding variables

## Debug Steps

If still failing, check Vercel deployment logs:

1. Go to: **Vercel → Deployments → Latest → Runtime Logs**
2. Look for: `Auth redirect URI:` in logs
3. Copy that exact URL
4. Add it to Azure AD

## All Environment Variables Needed

While you're in Vercel settings, add all these:

```
MICROSOFT_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
MICROSOFT_CLIENT_ID=your-azure-client-id
MICROSOFT_CLIENT_SECRET=your-azure-client-secret
MICROSOFT_TENANT_ID=your-azure-tenant-id
DATABASE_URL=your-database-url
OPENAI_API_KEY=your-openai-key
UPLOAD_DIR=/tmp
```

## Success Checklist

- [ ] Got my Vercel URL
- [ ] Added `MICROSOFT_REDIRECT_URI` to Vercel
- [ ] Added same URL to Azure AD → Authentication
- [ ] Redeployed app
- [ ] Waited 2-3 minutes
- [ ] Tested sign-in
- [ ] It works! 🎉

**The issue is almost always a mismatch between Vercel and Azure AD URLs. Make sure they're identical!**
