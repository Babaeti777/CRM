# OpenAI API Setup Guide

Complete guide to setting up OpenAI API for AI-powered division suggestions in your CRM Bid Tracking System.

## What OpenAI Does in Your CRM

Your CRM uses OpenAI GPT-4 to:
- 🤖 Analyze uploaded bid documents
- 📋 Suggest appropriate divisions based on content
- 🎯 Provide confidence scores for suggestions
- 📊 Extract key information from documents
- ✅ Help you categorize bids automatically

**Example:**
- Upload a document about electrical work
- AI analyzes: "This document discusses electrical panels, wiring, and lighting"
- AI suggests: Division = "Electrical" (Confidence: 92%)
- You confirm or change the suggestion

---

## Step 1: Create OpenAI Account

### Sign Up

1. Go to **https://platform.openai.com**
2. Click **"Sign up"**
3. Create account with:
   - Email address
   - OR Google account
   - OR Microsoft account

4. Verify your email

### Add Payment Method

**Important:** OpenAI requires a payment method, but you only pay for what you use.

1. After signing in, click your profile (top-right)
2. Click **"Billing"**
3. Click **"Payment methods"**
4. Add credit/debit card

**Cost estimate for CRM usage:**
- GPT-4 Turbo: ~$0.01 per document analysis
- 100 documents/month = ~$1.00/month
- Very affordable! 💰

---

## Step 2: Get Your API Key

### Create API Key

1. Click your profile (top-right)
2. Click **"API keys"** or go to: https://platform.openai.com/api-keys

3. Click **"+ Create new secret key"**

4. Fill in:
   - **Name:** `CRM Bid Tracking System`
   - **Permissions:** All (default)
   - **Project:** Default project (or create new)

5. Click **"Create secret key"**

6. **COPY THE KEY IMMEDIATELY** ⚠️
   - Starts with `sk-proj-...` or `sk-...`
   - Example: `sk-proj-Ab12Cd34Ef56Gh78Ij90Kl12Mn34Op56...`
   - You can't see it again!

7. Click **"Done"**

---

## Step 3: Add to Your App

### Local Development (.env file)

```env
# OpenAI API Configuration
OPENAI_API_KEY="sk-proj-your-actual-key-here"
```

### Production (Vercel)

1. Go to Vercel Dashboard
2. Select your project
3. Click **Settings** → **Environment Variables**
4. Add:
   ```
   Name: OPENAI_API_KEY
   Value: sk-proj-your-actual-key-here
   ```
5. Click **"Save"**
6. Redeploy your app

---

## Step 4: Set Usage Limits (Recommended)

### Protect Your Billing

1. Go to **Billing** → **Usage limits**

2. Set monthly budget:
   - **Soft limit:** $10/month (email alert)
   - **Hard limit:** $20/month (API stops)

3. This prevents unexpected charges

### Monitor Usage

1. Go to **Usage** dashboard
2. View:
   - Requests per day
   - Tokens used
   - Cost breakdown

**Your CRM is optimized to minimize costs:**
- Only analyzes when documents are uploaded
- Uses efficient prompts
- Caches results

---

## Step 5: Choose Your Model

Your CRM is configured to use **GPT-4 Turbo** by default.

### Model Options:

**GPT-4 Turbo (Default - Recommended):**
- Best accuracy for document analysis
- Great for complex bid documents
- Cost: ~$0.01 per document
- File: `/lib/openai.ts` line 30

**GPT-3.5 Turbo (Budget Option):**
- Faster, cheaper
- Good enough for simple documents
- Cost: ~$0.002 per document
- To use: Edit `/lib/openai.ts`

### Change Model (Optional)

If you want to use GPT-3.5 instead:

1. Open `/lib/openai.ts`
2. Find line ~30:
   ```typescript
   model: 'gpt-4-turbo-preview',
   ```
3. Change to:
   ```typescript
   model: 'gpt-3.5-turbo',
   ```
4. Save and redeploy

**When to use GPT-3.5:**
- Processing hundreds of documents daily
- Budget-conscious
- Simple bid categorization

**When to use GPT-4:**
- Complex technical documents
- High accuracy needed
- Better reasoning for edge cases

---

## Step 6: Test Your Setup

### Test Locally

1. Make sure `.env` has your API key
2. Start your app:
   ```bash
   npm run dev
   ```
3. Go to `http://localhost:3000`
4. Create a new bid
5. Upload a document (PDF, TXT, or DOCX)
6. Watch AI suggest the division! 🤖

### Verify API Call

Check your terminal for:
```
✓ Document uploaded successfully
✓ AI analyzing document...
✓ Suggested division: Electrical (92% confidence)
```

### Check OpenAI Dashboard

1. Go to https://platform.openai.com/usage
2. You should see a new API request
3. Verify the cost (should be ~$0.01)

---

## Understanding AI Suggestions

### How It Works:

1. **Document Upload:**
   - You upload a bid document
   - System extracts text content

2. **AI Analysis:**
   - Sends document to GPT-4
   - Analyzes content for keywords and context
   - Compares against your divisions

3. **Suggestion:**
   - Returns best-fit division
   - Provides confidence score (0-100%)
   - Explains reasoning

4. **User Confirmation:**
   - You review the suggestion
   - Accept or change manually
   - System updates the bid

### Example Output:

```json
{
  "division": "Electrical",
  "confidence": 0.92,
  "reasoning": "Document discusses electrical panels, circuit breakers,
                and wiring installation. Strong indicators of electrical
                work scope."
}
```

---

## Customizing AI Behavior

### Edit Prompts (Advanced)

File: `/lib/openai.ts`

**Change industry terms:**
```typescript
// Current (Construction):
content: 'You are an expert in construction project management...'

// Change to Real Estate:
content: 'You are an expert in real estate development...'
```

**Adjust confidence threshold:**
```typescript
// Only suggest if >80% confident
if (suggestion.confidence < 0.8) {
  return defaultDivision;
}
```

**Add more context:**
```typescript
const prompt = `You are analyzing a bid document.

Available divisions: ${divisionNames.join(', ')}
Company type: General Contractor
Location: [Your City/State]

Document: ${documentText}

Suggest the most appropriate division.`;
```

---

## Cost Optimization Tips

### 1. Limit Text Sent
Currently limited to 2000 characters (optimized).

### 2. Cache Results
System already caches suggestions in database.

### 3. Batch Processing
If processing many documents:
```typescript
// Process multiple at once
const suggestions = await Promise.all(
  documents.map(doc => suggestDivision(doc, divisions))
);
```

### 4. Use Cheaper Model for Simple Docs
Auto-detect complexity:
```typescript
const model = documentLength > 1000
  ? 'gpt-4-turbo-preview'  // Complex
  : 'gpt-3.5-turbo';        // Simple
```

---

## Security Best Practices

### ✅ Do's:

1. **Keep API key secret:**
   - Never commit to git
   - Use environment variables
   - Rotate keys periodically

2. **Monitor usage:**
   - Check dashboard weekly
   - Set up billing alerts
   - Review unexpected spikes

3. **Use rate limiting:**
   - Built into the app
   - Prevents abuse
   - Protects your budget

### ❌ Don'ts:

1. Never expose API key in frontend code
2. Don't share keys between apps
3. Don't commit `.env` to repository
4. Don't skip usage limits

---

## Troubleshooting

### Error: "Invalid API key"

**Solution:**
- Verify key starts with `sk-proj-` or `sk-`
- Check for extra spaces in .env
- Regenerate key if needed
- Update environment variables
- Redeploy app

### Error: "Rate limit exceeded"

**Solution:**
- OpenAI free tier has limits
- Upgrade to paid tier
- Wait a few minutes
- Implement exponential backoff (already built-in)

### Error: "Insufficient quota"

**Solution:**
- Add payment method
- Increase usage limits
- Check billing dashboard
- Verify card is valid

### AI Suggestions Are Wrong

**Solution:**
- GPT-4 is usually 90%+ accurate
- Fine-tune prompts in `/lib/openai.ts`
- Add more context about your industry
- Provide better division descriptions
- Use more specific division names

### No AI Suggestions Appearing

**Solution:**
1. Check browser console for errors
2. Verify API key in environment variables
3. Check OpenAI usage dashboard
4. Review server logs
5. Ensure document has text content

---

## Advanced Features

### Future Enhancements You Can Add:

1. **Document Summarization:**
```typescript
export async function summarizeBid(text: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [{
      role: 'user',
      content: `Summarize this bid in 3 bullet points: ${text}`
    }]
  });
  return response.choices[0].message.content;
}
```

2. **Budget Estimation:**
```typescript
export async function estimateCost(text: string) {
  // AI analyzes scope and estimates cost range
}
```

3. **Risk Analysis:**
```typescript
export async function analyzeRisks(text: string) {
  // AI identifies potential risks in bid
}
```

4. **Email Generation:**
```typescript
export async function generateEmail(bidInfo: any) {
  // AI writes professional emails to subcontractors
}
```

---

## API Key Management

### Best Practices:

1. **Separate Keys for Environments:**
   - Development: `sk-proj-dev-...`
   - Production: `sk-proj-prod-...`
   - Create separate keys in OpenAI dashboard

2. **Key Rotation Schedule:**
   - Rotate every 90 days
   - Update in Vercel immediately
   - Test before deleting old key

3. **Access Control:**
   - Only give keys to necessary team members
   - Use OpenAI Projects for organization
   - Review API key usage logs

### Rotating Keys:

1. Create new key in OpenAI dashboard
2. Update Vercel environment variables
3. Redeploy app
4. Verify new key works
5. Delete old key from OpenAI

---

## Monthly Cost Estimates

### Low Usage (Personal/Small Business)
- 50 documents/month
- **Cost: ~$0.50/month**
- GPT-4 Turbo

### Medium Usage (Growing Business)
- 200 documents/month
- **Cost: ~$2.00/month**
- GPT-4 Turbo

### High Usage (Enterprise)
- 1000 documents/month
- **Cost: ~$10.00/month**
- GPT-4 Turbo

**Switch to GPT-3.5 to save 90% on costs!**

---

## Summary Checklist

Before proceeding, make sure you:

- [ ] Created OpenAI account
- [ ] Added payment method
- [ ] Generated API key
- [ ] Copied and saved API key securely
- [ ] Added to `.env` file for local development
- [ ] Added to Vercel environment variables
- [ ] Set usage limits ($10-20/month recommended)
- [ ] Tested document upload and AI suggestion
- [ ] Verified API call in OpenAI dashboard
- [ ] Reviewed first suggestion for accuracy

**All set?** Your CRM now has AI-powered intelligence! 🤖

---

## What's Next?

Your CRM can now:
- ✅ Automatically suggest divisions
- ✅ Analyze document content
- ✅ Provide confidence scores
- ✅ Save you time categorizing bids

**Next steps:**
1. Upload some test documents
2. Review AI suggestions
3. Adjust prompts if needed
4. Start using for real bids!

**Total cost:** ~$1-5/month for most users 💰
**Time saved:** Hours per week! ⏰

Enjoy your AI-powered CRM! 🚀
