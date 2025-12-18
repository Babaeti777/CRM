# Quick Setup Guide

## Step-by-Step Installation

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Set Up Database

#### Option A: Local PostgreSQL

\`\`\`bash
# Create database
createdb crm_db

# Update .env with your database URL
DATABASE_URL="postgresql://username:password@localhost:5432/crm_db"
\`\`\`

#### Option B: Use Docker

\`\`\`bash
docker run --name crm-postgres -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=crm_db -p 5432:5432 -d postgres

# Update .env
DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/crm_db"
\`\`\`

### 3. Configure Environment

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` and add your credentials:

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `MICROSOFT_CLIENT_ID` - From Azure AD app registration
- `MICROSOFT_CLIENT_SECRET` - From Azure AD app registration
- `MICROSOFT_TENANT_ID` - Your Azure AD tenant ID
- `OPENAI_API_KEY` - OpenAI API key for AI features

### 4. Initialize Database

\`\`\`bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed initial data (divisions and sample subcontractors)
npx tsx prisma/seed.ts
\`\`\`

### 5. Run Application

\`\`\`bash
# Development
npm run dev

# Production
npm run build
npm start
\`\`\`

Visit: `http://localhost:3000`

## Microsoft Azure Setup

### Create Azure AD App

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Enter name: "CRM Bid Tracking System"
5. Select "Accounts in this organizational directory only"
6. Add Redirect URI: `http://localhost:3000/api/auth/callback`
7. Click "Register"

### Configure API Permissions

1. In your app, go to "API permissions"
2. Click "Add a permission"
3. Select "Microsoft Graph"
4. Choose "Delegated permissions"
5. Add these permissions:
   - `Calendars.ReadWrite`
   - `Mail.Send`
   - `Mail.Read`
   - `User.Read`
6. Click "Grant admin consent"

### Create Client Secret

1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Enter description and expiry
4. Copy the secret value (you won't see it again!)
5. Add to `.env` as `MICROSOFT_CLIENT_SECRET`

### Get IDs

1. **Client ID**: On the "Overview" page, copy "Application (client) ID"
2. **Tenant ID**: On the "Overview" page, copy "Directory (tenant) ID"

## OpenAI Setup

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create account or sign in
3. Navigate to API keys
4. Create new API key
5. Copy and add to `.env` as `OPENAI_API_KEY`

**Note:** Ensure you have access to GPT-4 models for best AI suggestions.

## Testing the Setup

### 1. Test Database Connection

\`\`\`bash
npx prisma studio
\`\`\`

This opens a browser interface to view your database.

### 2. Test Microsoft Integration

1. Visit `http://localhost:3000`
2. Click "Sign in with Microsoft"
3. Authorize the application
4. You should be redirected to the dashboard

### 3. Test AI Features

1. Create a new bid
2. Upload a document
3. AI should suggest a division
4. Review and confirm the suggestion

## Common Issues

### Database Connection Failed
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Ensure database exists

### Microsoft OAuth Error
- Verify redirect URI matches exactly
- Check client secret hasn't expired
- Ensure API permissions are granted

### AI Suggestions Not Working
- Verify OPENAI_API_KEY is correct
- Check you have GPT-4 access
- Review API usage limits

## Next Steps

1. **Add More Divisions**: Navigate to "Manage Divisions" to add your specific divisions
2. **Import Subcontractors**: Add your subcontractor database
3. **Customize AI Prompts**: Edit `/lib/openai.ts` for your industry-specific terminology
4. **Configure Email Templates**: Customize notification emails
5. **Set Up Calendar Preferences**: Configure default calendar settings

## Production Deployment

### Recommended Services

- **Hosting**: Vercel, AWS, Azure
- **Database**: PostgreSQL on AWS RDS, Azure Database, or Supabase
- **File Storage**: AWS S3, Azure Blob Storage
- **Monitoring**: Sentry, LogRocket

### Production Checklist

- [ ] Set up production database
- [ ] Configure environment variables
- [ ] Update redirect URIs for production domain
- [ ] Enable HTTPS
- [ ] Set up file storage service
- [ ] Configure CORS policies
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Implement session management
- [ ] Add authentication middleware

## Support

For detailed documentation, see [README.md](./README.md)
