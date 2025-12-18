# Documentation Index

Complete documentation for the CRM Bid Tracking System.

## Quick Start Guides

### 🚀 Getting Started
- **[README.md](../README.md)** - Main project overview and feature list
- **[SETUP_GUIDE.md](../SETUP_GUIDE.md)** - Local development setup
- **[DEPLOY_QUICK.md](../DEPLOY_QUICK.md)** - 5-minute deployment guide

### ☁️ Deployment
- **[DEPLOYMENT.md](../DEPLOYMENT.md)** - Complete deployment guide
  - Vercel deployment (recommended)
  - Railway deployment
  - Render deployment
  - AWS/Azure options
  - Mobile access setup
  - PWA configuration

## Integration Guides

### 🔐 Microsoft Azure AD
- **[AZURE_SETUP.md](../AZURE_SETUP.md)** - Complete Azure AD setup
  - Step-by-step app registration
  - API permissions configuration
  - Client secret generation
  - Redirect URI setup
  - Troubleshooting guide
  - Security best practices

### 🤖 OpenAI API
- **[OPENAI_SETUP.md](../OPENAI_SETUP.md)** - OpenAI API configuration
  - Account creation
  - API key generation
  - Cost optimization
  - Model selection
  - Usage monitoring
  - Customization guide

## Feature Guides

### 📄 Document Management
- Upload bid documents
- AI-powered analysis
- File storage configuration
- Supported formats

### 👥 Subcontractor Management
- Adding subcontractors
- Division assignments
- Contact management
- Response tracking

### 📊 Bid Tracking
- Creating bids
- Status management
- Response monitoring
- Analytics dashboard

### 📧 Email & Calendar
- Sending notifications
- Creating events
- Tracking communications
- Microsoft 365 sync

## Technical Documentation

### 🏗️ Architecture
- **Tech Stack:**
  - Frontend: Next.js 14, React, TypeScript
  - Backend: Next.js API Routes
  - Database: PostgreSQL + Prisma ORM
  - Auth: Microsoft OAuth 2.0
  - AI: OpenAI GPT-4

### 📁 Project Structure
```
/CRM
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── page.tsx          # Landing page
├── lib/                   # Utility libraries
│   ├── prisma.ts         # Database client
│   ├── microsoft-graph.ts # MS Graph API
│   └── openai.ts         # AI integration
├── prisma/               # Database schema
└── public/               # Static assets
```

### 🗄️ Database Schema
See `prisma/schema.prisma` for complete schema.

**Main entities:**
- Bid
- Division
- Subcontractor
- BidResponse
- Document
- CalendarEvent
- EmailThread
- User

### 🔌 API Endpoints

**Bids:**
- `GET /api/bids` - List all bids
- `POST /api/bids` - Create bid
- `GET /api/bids/:id` - Get bid details
- `PATCH /api/bids/:id` - Update bid
- `DELETE /api/bids/:id` - Delete bid
- `POST /api/bids/:id/upload` - Upload document
- `POST /api/bids/:id/notify-subcontractors` - Send notifications

**Divisions:**
- `GET /api/divisions` - List divisions
- `POST /api/divisions` - Create division

**Subcontractors:**
- `GET /api/subcontractors` - List subcontractors
- `POST /api/subcontractors` - Create subcontractor

**Responses:**
- `GET /api/responses` - List responses
- `PATCH /api/responses/:id` - Update response

**Authentication:**
- `GET /api/auth/microsoft` - Initiate OAuth
- `GET /api/auth/callback` - OAuth callback

## Troubleshooting

### Common Issues

**Database Connection:**
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Run `npx prisma db push`

**Microsoft OAuth:**
- Check redirect URIs match exactly
- Verify API permissions granted
- See [AZURE_SETUP.md](../AZURE_SETUP.md) troubleshooting

**OpenAI API:**
- Verify API key is correct
- Check usage limits
- See [OPENAI_SETUP.md](../OPENAI_SETUP.md) troubleshooting

**Deployment:**
- Check environment variables
- Verify build logs
- See [DEPLOYMENT.md](../DEPLOYMENT.md)

## Security

### Best Practices
- Never commit `.env` files
- Rotate secrets regularly
- Use environment variables
- Enable HTTPS in production
- Review API permissions

### Data Privacy
- Encrypt sensitive data
- Comply with GDPR/regulations
- Implement access controls
- Regular security audits

## Cost Breakdown

### Free Tier (Development)
- **Vercel Hobby:** FREE
- **Neon Database:** FREE (0.5GB)
- **OpenAI:** ~$1-5/month
- **Azure AD:** FREE
- **Total:** ~$1-5/month

### Production
- **Vercel Pro:** $20/month (optional)
- **Database:** $10-50/month (scaled)
- **OpenAI:** $5-20/month (usage-based)
- **Total:** $15-90/month

## Support & Community

### Getting Help
1. Check documentation above
2. Review troubleshooting guides
3. Search GitHub Issues
4. Create new issue with details

### Contributing
- Fork the repository
- Create feature branch
- Submit pull request
- Follow code style

### Updates
- Check for new versions
- Review changelog
- Update dependencies
- Test before deploying

## License

MIT License - See LICENSE file

## Version

Current Version: 1.0.0
Last Updated: 2025-12-18

---

## Quick Links

- 🏠 [Main README](../README.md)
- 🚀 [Quick Deploy](../DEPLOY_QUICK.md)
- 🔐 [Azure Setup](../AZURE_SETUP.md)
- 🤖 [OpenAI Setup](../OPENAI_SETUP.md)
- ☁️ [Deployment](../DEPLOYMENT.md)
- 📚 [Setup Guide](../SETUP_GUIDE.md)

---

**Need more help?** All documentation is in the `/docs` folder and root directory.
