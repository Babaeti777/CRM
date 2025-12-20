# Firebase + Google Drive Setup Guide

## 🔥 Firebase Storage Setup (5 minutes)

### Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Add project"**
3. Project name: `CRM Bid Tracker`
4. **Disable Google Analytics** (not needed)
5. Click **"Create project"**

### Step 2: Enable Firebase Storage

1. In your Firebase project, click **"Storage"** in left sidebar
2. Click **"Get started"**
3. **Security rules:** Start in **production mode** (we'll configure later)
4. **Storage location:** Choose closest to you (e.g., `us-central1`)
5. Click **"Done"**

### Step 3: Get Service Account Key

1. Click **⚙️ (gear icon)** → **"Project settings"**
2. Go to **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Click **"Generate key"** → Downloads a JSON file
5. **IMPORTANT:** Keep this file safe! It has admin access to your Firebase project

### Step 4: Configure Storage Bucket

1. Go back to **Storage** in left sidebar
2. Click **"Rules"** tab
3. Replace with these rules (allows authenticated users to upload):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;  // Public read
      allow write: if request.auth != null;  // Authenticated write
    }
  }
}
```

4. Click **"Publish"**

### Step 5: Get Your Storage Bucket Name

1. In **Storage** page, look at the top
2. You'll see something like: `crm-bid-tracker.appspot.com`
3. **Copy this** - you'll need it for environment variables

---

## 🚗 Google Drive Integration (Optional)

Google Drive is already enabled through your Google OAuth setup!

The app will:
- ✅ Use **Firebase Storage** for primary file storage (fast, reliable)
- ✅ Optionally backup to **Google Drive** (user's personal drive)

---

## 🔐 Environment Variables for Vercel

Add these to **Vercel** → **Settings** → **Environment Variables**:

### **Firebase (Required):**

```bash
# Firebase Storage Bucket (from Step 5)
FIREBASE_STORAGE_BUCKET=crm-bid-tracker.appspot.com

# Firebase Service Account (from Step 3)
# Copy the ENTIRE contents of the downloaded JSON file
FIREBASE_SERVICE_ACCOUNT={
  "type": "service_account",
  "project_id": "crm-bid-tracker",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-...@crm-bid-tracker.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

**⚠️ IMPORTANT:**
- Copy the **entire JSON** (including curly braces `{}`)
- Paste it as a **single line** or Vercel will format it correctly
- Make sure the private key includes `\n` for newlines

---

## ✅ Complete Setup Checklist

- [ ] Created Firebase project
- [ ] Enabled Firebase Storage
- [ ] Generated service account key (JSON file)
- [ ] Configured storage security rules
- [ ] Copied storage bucket name
- [ ] Added `FIREBASE_STORAGE_BUCKET` to Vercel
- [ ] Added `FIREBASE_SERVICE_ACCOUNT` to Vercel (entire JSON)
- [ ] Redeployed app

---

## 🧪 Test File Upload

1. Sign in to your app
2. Create a new bid
3. Upload a document
4. File should upload to Firebase Storage
5. Check Firebase Console → Storage to see the file

---

## 💾 File Storage Summary

| Storage | Purpose | Cost |
|---------|---------|------|
| **Firebase Storage** | Primary file storage | Free: 5GB storage, 1GB/day downloads |
| **Google Drive** | Optional user backup | Free: 15GB per Google account |

**Files are stored in Firebase and optionally backed up to user's Google Drive!** 🎉

---

## 📁 File Structure

Files are organized like this in Firebase Storage:

```
/bids
  /bid-id-1
    /timestamp-document1.pdf
    /timestamp-document2.docx
  /bid-id-2
    /timestamp-document3.pdf
```

Each bid gets its own folder for easy management!
