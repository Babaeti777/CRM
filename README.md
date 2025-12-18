# CRM Bid Tracking System

A comprehensive bid and CRM tracking system with AI-powered division selection and Microsoft Calendar/Outlook integration.

## Features

### 📄 Document Management
- Upload bid documents (PDF, DOC, DOCX, TXT)
- Automatic document parsing and analysis
- Secure file storage

### 🤖 AI-Powered Division Selection
- Automatic division suggestion using OpenAI GPT-4
- Confidence scoring for suggestions
- User confirmation workflow
- Intelligent document analysis

### 👥 Subcontractor Management
- Complete subcontractor database
- Division-based organization
- Contact information management
- Response tracking

### 📧 Microsoft Outlook Integration
- Send emails to subcontractors
- Track email conversations
- Automatic email threading
- Bulk notifications

### 📅 Microsoft Calendar Integration
- Automatic calendar events for bid deadlines
- Meeting scheduling with subcontractors
- Calendar sync for all team members
- Reminder notifications

### 📊 Bid Tracking & Analytics
- Real-time response tracking
- Status management (Draft, Active, Closed, etc.)
- Response statistics and reporting
- Bid lifecycle management

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Microsoft OAuth 2.0
- **AI**: OpenAI GPT-4
- **Integrations**: Microsoft Graph API (Calendar & Outlook)

## Setup Instructions

### Prerequisites

1. Node.js 18+ installed
2. PostgreSQL database
3. Microsoft Azure AD App Registration
4. OpenAI API key

### 1. Clone and Install

\`\`\`bash
cd /home/user/CRM
npm install
\`\`\`

### 2. Database Setup

\`\`\`bash
# Create PostgreSQL database
createdb crm_db

# Run Prisma migrations
npx prisma db push

# (Optional) Seed initial data
npx prisma db seed
\`\`\`

### 3. Microsoft Azure Setup

1. Go to [Azure Portal](https://portal.azure.com)
2. Register a new application in Azure AD
3. Add these redirect URIs:
   - `http://localhost:3000/api/auth/callback`
4. Enable these API permissions:
   - `Calendars.ReadWrite`
   - `Mail.Send`
   - `Mail.Read`
   - `User.Read`
5. Generate a client secret
6. Copy Client ID, Tenant ID, and Client Secret

### 4. OpenAI Setup

1. Get API key from [OpenAI Platform](https://platform.openai.com)
2. Ensure you have access to GPT-4

### 5. Environment Variables

Create `.env` file:

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` with your credentials:

\`\`\`env
DATABASE_URL="postgresql://user:password@localhost:5432/crm_db"

MICROSOFT_CLIENT_ID="your-azure-client-id"
MICROSOFT_CLIENT_SECRET="your-azure-client-secret"
MICROSOFT_TENANT_ID="your-azure-tenant-id"
MICROSOFT_REDIRECT_URI="http://localhost:3000/api/auth/callback"

OPENAI_API_KEY="sk-..."

NEXT_PUBLIC_APP_URL="http://localhost:3000"
UPLOAD_DIR="./uploads"
\`\`\`

### 6. Run the Application

\`\`\`bash
# Development mode
npm run dev

# Production build
npm run build
npm start
\`\`\`

Visit `http://localhost:3000`

## Usage Guide

### Creating a Bid

1. Click "Create New Bid" on the dashboard
2. Fill in bid details (title, description, division, due date)
3. Upload bid document
4. AI will analyze and suggest appropriate division
5. Confirm or change division selection
6. Click "Create Bid"

### Managing Subcontractors

1. Navigate to "Manage Subcontractors"
2. Add subcontractor details (name, email, company)
3. Assign to relevant divisions
4. Subcontractors automatically receive notifications for their divisions

### Notifying Subcontractors

1. Open a bid
2. Confirm the division if not already confirmed
3. Click "Notify Subcontractors"
4. System sends emails and creates calendar events
5. Track responses in real-time

### Tracking Responses

1. View bid details to see all responses
2. Update response status as needed
3. View statistics and analytics
4. Filter by status, division, or date

## API Endpoints

### Bids
- `GET /api/bids` - List all bids
- `POST /api/bids` - Create new bid
- `GET /api/bids/:id` - Get bid details
- `PATCH /api/bids/:id` - Update bid
- `DELETE /api/bids/:id` - Delete bid
- `POST /api/bids/:id/upload` - Upload document
- `POST /api/bids/:id/notify-subcontractors` - Notify subcontractors

### Divisions
- `GET /api/divisions` - List all divisions
- `POST /api/divisions` - Create division

### Subcontractors
- `GET /api/subcontractors` - List all subcontractors
- `POST /api/subcontractors` - Create subcontractor

### Responses
- `GET /api/responses` - List all responses
- `PATCH /api/responses/:id` - Update response

### Authentication
- `GET /api/auth/microsoft` - Initiate Microsoft OAuth
- `GET /api/auth/callback` - OAuth callback

## Database Schema

See `prisma/schema.prisma` for complete schema.

### Main Models
- **Bid**: Core bid entity
- **Division**: Organizational divisions/departments
- **Subcontractor**: Subcontractor database
- **BidResponse**: Subcontractor responses to bids
- **Document**: Uploaded bid documents
- **CalendarEvent**: Microsoft Calendar events
- **EmailThread**: Outlook email tracking

## Security Considerations

1. **Authentication**: Implement proper session management
2. **File Upload**: Validate and sanitize uploaded files
3. **API Security**: Add rate limiting and authentication middleware
4. **Data Privacy**: Encrypt sensitive data at rest
5. **CORS**: Configure appropriate CORS policies for production

## Development

### Adding New Divisions

\`\`\`typescript
await prisma.division.create({
  data: {
    name: 'Electrical',
    description: 'Electrical contractors and services'
  }
})
\`\`\`

### Customizing AI Suggestions

Edit `/lib/openai.ts` to customize:
- Model selection
- Prompt engineering
- Confidence thresholds
- Analysis depth

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Run `npx prisma db push`

### Microsoft OAuth Errors
- Verify redirect URIs match Azure AD
- Check API permissions are granted
- Ensure client secret is valid

### File Upload Issues
- Check UPLOAD_DIR permissions
- Verify file size limits
- Check supported MIME types

## Production Deployment

1. Set up production database
2. Configure environment variables
3. Update redirect URIs for production domain
4. Enable HTTPS
5. Set up file storage (S3, Azure Blob, etc.)
6. Configure CDN for static assets
7. Enable monitoring and logging

## License

MIT

## Support

For issues and questions, please open a GitHub issue.
