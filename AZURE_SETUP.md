# Complete Azure AD Setup Guide for CRM Bid Tracking System

This guide walks you through setting up Microsoft Azure Active Directory (Azure AD) for your CRM Bid Tracking System, enabling Calendar and Outlook integration.

## Overview

Your CRM needs Azure AD to:
- ✅ Send emails to subcontractors via Outlook
- ✅ Create calendar events for bid deadlines
- ✅ Track email conversations
- ✅ Sync with Microsoft 365
- ✅ Authenticate users

**Time Required:** 15-20 minutes
**Cost:** FREE (Azure AD Free tier)

---

## Part 1: Create Azure AD App Registration

### Step 1: Access Azure Portal

1. Go to **https://portal.azure.com**
2. Sign in with your Microsoft account
   - Use your work/organization account if available
   - Personal accounts work too (outlook.com, hotmail.com)

3. If you don't have an Azure account:
   - Click "Create one"
   - Follow registration (credit card required but NOT charged for free services)

### Step 2: Navigate to Azure Active Directory

1. In Azure Portal, click the **≡ Menu** (top-left)
2. Click **"Azure Active Directory"**
   - Or search "Azure Active Directory" in the top search bar
3. You'll see your organization's directory dashboard

### Step 3: Create App Registration

1. In the left sidebar, click **"App registrations"**
2. Click **"+ New registration"** (top of page)

3. Fill in the registration form:

   **Name:**
   ```
   CRM Bid Tracking System
   ```

   **Supported account types:**
   Select one:
   - ✅ **"Accounts in this organizational directory only"** (Recommended for business)
     - Use this if you're using a work Microsoft 365 account
     - Only your organization can sign in

   - OR **"Accounts in any organizational directory and personal Microsoft accounts"**
     - Use this if you want to allow personal Microsoft accounts
     - More flexible for small businesses

   **Redirect URI:**
   - Platform: **Web** (dropdown)
   - URI: Leave BLANK for now (we'll add this later)

4. Click **"Register"**

### Step 4: Copy Your App Credentials

After registration, you'll see the **Overview** page.

**Copy these values NOW:**

1. **Application (client) ID**
   - Example: `12345678-1234-1234-1234-123456789abc`
   - Save as: `MICROSOFT_CLIENT_ID`

2. **Directory (tenant) ID**
   - Example: `87654321-4321-4321-4321-cba987654321`
   - Save as: `MICROSOFT_TENANT_ID`

💡 **Tip:** Create a temporary text file to store these values safely.

---

## Part 2: Create Client Secret

### Step 5: Generate Client Secret

1. In your app's page, click **"Certificates & secrets"** (left sidebar)
2. Click the **"Client secrets"** tab
3. Click **"+ New client secret"**

4. Fill in:
   - **Description:** `CRM Production Secret`
   - **Expires:**
     - Development: Choose "3 months" or "6 months"
     - Production: Choose "24 months"
   - Click **"Add"**

5. **IMMEDIATELY COPY THE SECRET VALUE** ⚠️
   - You'll see it in the "Value" column
   - Example: `a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0`
   - Save as: `MICROSOFT_CLIENT_SECRET`
   - **You can't see this again!** If you lose it, create a new one.

---

## Part 3: Configure API Permissions

### Step 6: Add Microsoft Graph Permissions

1. Click **"API permissions"** (left sidebar)
2. You'll see "Microsoft Graph" with "User.Read" already added
3. Click **"+ Add a permission"**

4. Click **"Microsoft Graph"**
5. Click **"Delegated permissions"** (not Application permissions)

6. **Add these permissions one by one:**

   **For Calendar Integration:**
   - Search: `Calendars`
   - Check ✅ **Calendars.ReadWrite**
   - Description: "Read and write user calendars"

   **For Email/Outlook Integration:**
   - Search: `Mail`
   - Check ✅ **Mail.Send**
   - Description: "Send mail as a user"
   - Check ✅ **Mail.Read**
   - Description: "Read user mail"

   **For User Info:**
   - Already added: **User.Read**
   - Description: "Sign in and read user profile"

7. Click **"Add permissions"**

### Step 7: Grant Admin Consent

**Important:** These permissions need admin approval.

1. After adding permissions, you'll see them listed
2. Click **"Grant admin consent for [Your Organization]"**
   - If you're the admin, click "Yes"
   - If not, ask your IT admin to approve

3. Status should change to green checkmarks ✅

**What each permission does in your CRM:**
- `Calendars.ReadWrite` → Creates bid deadline reminders
- `Mail.Send` → Sends notifications to subcontractors
- `Mail.Read` → Tracks email responses
- `User.Read` → Gets user profile info

---

## Part 4: Configure Redirect URIs

### Step 8: Add Development Redirect URI

1. Click **"Authentication"** (left sidebar)
2. Under "Platform configurations", click **"+ Add a platform"**
3. Select **"Web"**

4. Add redirect URIs:

   **For Local Development:**
   ```
   http://localhost:3000/api/auth/callback
   ```

   **For Vercel Preview (if using):**
   ```
   https://your-app-git-branch-name.vercel.app/api/auth/callback
   ```

5. Under "Implicit grant and hybrid flows":
   - Keep all UNCHECKED (we use authorization code flow)

6. Click **"Configure"**

### Step 9: Add Production Redirect URI

**After you deploy to Vercel:**

1. Get your production URL (e.g., `https://crm-bid-tracker.vercel.app`)
2. Return to Azure Portal → Your App → **Authentication**
3. Under "Web" platform, click **"Add URI"**
4. Add:
   ```
   https://your-actual-vercel-url.vercel.app/api/auth/callback
   ```
5. Click **"Save"** at the bottom

💡 **Important:** The redirect URI must EXACTLY match your deployment URL.

---

## Part 5: Configure Token Settings (Optional but Recommended)

### Step 10: Enable ID Tokens

1. Still in **"Authentication"**
2. Scroll to "Implicit grant and hybrid flows"
3. Check ✅ **"ID tokens"** (for hybrid flow)
4. Click **"Save"**

### Step 11: Configure Token Version

1. Click **"Manifest"** (left sidebar)
2. Find the line: `"accessTokenAcceptedVersion": null`
3. Change to: `"accessTokenAcceptedVersion": 2`
4. Click **"Save"**

This ensures you get v2.0 tokens (more secure).

---

## Part 6: Set Up Your Environment Variables

### Step 12: Create .env File

Now use the values you copied earlier:

```env
# Microsoft Azure AD Configuration
MICROSOFT_CLIENT_ID="paste-your-client-id-here"
MICROSOFT_CLIENT_SECRET="paste-your-client-secret-here"
MICROSOFT_TENANT_ID="paste-your-tenant-id-here"

# Local development
MICROSOFT_REDIRECT_URI="http://localhost:3000/api/auth/callback"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# For production (update after deployment)
# MICROSOFT_REDIRECT_URI="https://your-app.vercel.app/api/auth/callback"
# NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

### Step 13: Add to Vercel (Production)

When deploying to Vercel:

1. Go to Vercel Dashboard
2. Select your project
3. Click **Settings** → **Environment Variables**
4. Add each variable:

```
Name: MICROSOFT_CLIENT_ID
Value: [your-client-id]

Name: MICROSOFT_CLIENT_SECRET
Value: [your-client-secret]

Name: MICROSOFT_TENANT_ID
Value: [your-tenant-id]

Name: MICROSOFT_REDIRECT_URI
Value: https://your-app.vercel.app/api/auth/callback

Name: NEXT_PUBLIC_APP_URL
Value: https://your-app.vercel.app
```

5. Redeploy your app for changes to take effect

---

## Part 7: Test Your Setup

### Step 14: Test Authentication Flow

1. Start your app:
   ```bash
   npm run dev
   ```

2. Visit: `http://localhost:3000`

3. Click **"Sign in with Microsoft"**

4. You should see Microsoft login page:
   - Enter your Microsoft email
   - Enter password
   - Accept permissions (first time only)

5. After successful login:
   - You'll be redirected to `/dashboard`
   - Your user info is saved in database

### Step 15: Test Calendar Integration

1. Create a new bid
2. Set a due date
3. Click "Notify Subcontractors"
4. Check **"Create calendar event"**
5. Open your Microsoft Calendar
6. You should see the event created!

### Step 16: Test Email Integration

1. Make sure you have subcontractors added
2. Open a bid
3. Click "Notify Subcontractors"
4. Check your Outlook Sent Items
5. Subcontractors should receive emails!

---

## Common Issues & Solutions

### Issue 1: "AADSTS50011: The redirect URI specified does not match"

**Solution:**
- Go to Azure Portal → Your App → Authentication
- Verify redirect URI EXACTLY matches your app URL
- No trailing slash
- Must include `/api/auth/callback`
- Check for typos

### Issue 2: "AADSTS65001: The user or administrator has not consented"

**Solution:**
- Go to API Permissions
- Click "Grant admin consent"
- If not admin, ask IT admin to approve

### Issue 3: "Invalid client secret"

**Solution:**
- Client secret may have expired
- Generate new secret in "Certificates & secrets"
- Update your .env file and Vercel environment variables
- Redeploy

### Issue 4: "Access token validation failure"

**Solution:**
- Check `accessTokenAcceptedVersion` in Manifest is set to `2`
- Verify MICROSOFT_TENANT_ID is correct
- Clear browser cache and try again

### Issue 5: "Insufficient privileges to complete the operation"

**Solution:**
- Missing API permissions
- Go to API Permissions and verify all are granted
- Click "Grant admin consent" again

### Issue 6: Can send emails but can't create calendar events

**Solution:**
- Check Calendars.ReadWrite permission is granted
- Sign out and sign in again to refresh token
- Verify user has a calendar in Microsoft 365

---

## Security Best Practices

### ✅ Do's:

1. **Keep secrets secure:**
   - Never commit `.env` to git
   - Use environment variables
   - Rotate secrets every 6-12 months

2. **Use least privilege:**
   - Only request permissions you need
   - We only use delegated permissions (user context)

3. **Validate redirect URIs:**
   - Only add URIs you control
   - Use HTTPS in production

4. **Monitor app usage:**
   - Check Azure AD sign-in logs regularly
   - Review API permissions periodically

### ❌ Don'ts:

1. Never share client secret publicly
2. Don't use personal accounts for production
3. Don't grant more permissions than needed
4. Don't skip admin consent

---

## Multi-Tenant vs Single-Tenant

### Single-Tenant (Recommended for most)
- Only your organization can sign in
- More secure
- Selected: "Accounts in this organizational directory only"
- Use for: Company-internal CRM

### Multi-Tenant
- Any Microsoft account can sign in
- More flexible
- Selected: "Accounts in any organizational directory"
- Use for: SaaS applications

**For your CRM:** Stick with single-tenant unless you need to allow external users.

---

## Upgrading to Production

### When you're ready for production:

1. **Create separate Azure AD app for production:**
   - Follow same steps
   - Use different name: "CRM Bid Tracking - Production"
   - Use production redirect URIs only

2. **Use Azure Key Vault (optional but recommended):**
   - Store secrets in Azure Key Vault
   - Reference in your app
   - Better security than environment variables

3. **Set up monitoring:**
   - Enable Azure AD logs
   - Monitor failed sign-ins
   - Set up alerts

4. **Get a custom domain:**
   - Instead of `your-app.vercel.app`
   - Use `crm.yourcompany.com`
   - Update redirect URIs accordingly

---

## Quick Reference Card

Save this for future reference:

```
┌─────────────────────────────────────────────┐
│  AZURE AD QUICK REFERENCE                   │
├─────────────────────────────────────────────┤
│  Portal: https://portal.azure.com           │
│  Location: Azure Active Directory           │
│           → App registrations                │
│                                              │
│  What You Need:                              │
│  ✓ Application (client) ID                   │
│  ✓ Directory (tenant) ID                     │
│  ✓ Client secret (value)                     │
│                                              │
│  Permissions Required:                       │
│  ✓ User.Read                                 │
│  ✓ Calendars.ReadWrite                       │
│  ✓ Mail.Send                                 │
│  ✓ Mail.Read                                 │
│                                              │
│  Redirect URIs:                              │
│  Dev:  http://localhost:3000/api/auth/callback│
│  Prod: https://[your-app]/api/auth/callback  │
└─────────────────────────────────────────────┘
```

---

## Help & Support

### Official Microsoft Documentation:
- Azure AD Overview: https://docs.microsoft.com/azure/active-directory/
- App Registration: https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app
- Microsoft Graph API: https://docs.microsoft.com/graph/overview

### Troubleshooting:
- Check Azure AD Sign-in logs (Azure Portal → Azure AD → Sign-in logs)
- Review app's API permissions regularly
- Test with Microsoft Graph Explorer: https://developer.microsoft.com/graph/graph-explorer

### Need Help?
- Azure AD has extensive documentation
- Microsoft Q&A forums
- Stack Overflow (tag: azure-active-directory)

---

## Summary Checklist

Before proceeding, make sure you have:

- [ ] Created Azure AD App Registration
- [ ] Copied Application (client) ID
- [ ] Copied Directory (tenant) ID
- [ ] Generated and copied Client Secret
- [ ] Added all required API permissions:
  - [ ] User.Read
  - [ ] Calendars.ReadWrite
  - [ ] Mail.Send
  - [ ] Mail.Read
- [ ] Granted admin consent for permissions
- [ ] Added redirect URI for development
- [ ] Added redirect URI for production (after deployment)
- [ ] Added all values to .env file
- [ ] Added all values to Vercel environment variables
- [ ] Tested sign-in flow
- [ ] Tested email sending
- [ ] Tested calendar creation

**All done?** Your CRM is now fully integrated with Microsoft 365! 🎉

---

## What's Next?

1. Deploy to Vercel (see DEPLOYMENT.md)
2. Set up your database (see SETUP_GUIDE.md)
3. Add your OpenAI API key for AI features
4. Start creating bids and tracking subcontractors!

Your CRM can now:
- ✅ Send professional emails via Outlook
- ✅ Create calendar events automatically
- ✅ Track all communications
- ✅ Sync with Microsoft 365
- ✅ Work from any device

**Total setup time:** ~20 minutes
**Monthly cost:** $0 (Azure AD Free tier)

Enjoy your fully integrated CRM Bid Tracking System! 🚀
