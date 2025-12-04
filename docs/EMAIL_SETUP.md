# Email Service Setup Guide

This guide will help you set up email sending for your Bitcoin Investments platform using Resend.

## Why Resend?

- **Modern & Developer-Friendly**: Simple API, great documentation
- **Generous Free Tier**: 100 emails/day, 3,000 emails/month
- **Better Deliverability**: Built on top of AWS SES
- **Great DX**: TypeScript support, webhooks, analytics

## Step 1: Sign Up for Resend

1. Go to [https://resend.com](https://resend.com)
2. Click "Sign Up" and create an account
3. Verify your email address

## Step 2: Get Your API Key

1. Log in to your Resend dashboard
2. Go to "API Keys" in the left sidebar
3. Click "Create API Key"
4. Give it a name (e.g., "Bitcoin Investments Production")
5. Copy the API key (it starts with `re_`)

## Step 3: Add Domain (Required for Production)

### For Testing (Free)
- You can use `onboarding@resend.dev` as your from address
- This is fine for testing but has limits

### For Production (Recommended)
1. Go to "Domains" in Resend dashboard
2. Click "Add Domain"
3. Enter your domain (e.g., `bitcoininvestments.com`)
4. Follow the DNS configuration instructions:
   - Add the provided SPF record
   - Add the provided DKIM record
   - Add the provided DMARC record (optional but recommended)
5. Wait for verification (usually 1-5 minutes)
6. Once verified, you can send from any address @yourdomain.com

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your Resend configuration to `.env`:
   ```env
   # Email Service (Resend)
   VITE_RESEND_API_KEY=re_your_actual_api_key_here
   VITE_FROM_EMAIL=Bitcoin Investments <hello@yourdomain.com>
   ```

   **For testing**, you can use:
   ```env
   VITE_FROM_EMAIL=Bitcoin Investments <onboarding@resend.dev>
   ```

3. Restart your development server for changes to take effect

## Step 5: Test Email Sending

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to any page with a newsletter signup form
3. Enter your email and subscribe
4. Check your inbox for the welcome email
5. Check Resend dashboard for delivery logs

## Email Templates Included

The platform includes pre-built email templates for:

### 1. Newsletter Welcome Email
- **Trigger**: New newsletter subscription
- **Purpose**: Welcome new subscribers and guide them to resources
- **Features**:
  - Branded header with orange gradient
  - Benefits list with checkmarks
  - CTA button to learning center
  - Recommended reading section
  - Footer with links

### 2. Price Alert Email
- **Trigger**: Cryptocurrency price hits user's target
- **Purpose**: Notify users of price movements
- **Features**:
  - Alert icon and clear subject line
  - Current price display (large, highlighted)
  - Target price comparison
  - Link to live dashboard

### 3. Weekly Newsletter (Template Ready)
- **Function**: `sendWeeklyNewsletter()`
- **Purpose**: Send regular market updates to subscribers
- **Setup**: Connect to your content management system or create manually

## Customizing Email Templates

Email templates are located in:
```
src/services/email.ts
```

### To customize the design:
1. Open `src/services/email.ts`
2. Find the relevant function (e.g., `sendNewsletterWelcomeEmail`)
3. Edit the `html` variable
4. Test by triggering the email

### Design Tips:
- ✅ Use tables for layout (better email client support)
- ✅ Inline CSS for maximum compatibility
- ✅ Keep width under 600px for mobile
- ✅ Test in multiple email clients (Gmail, Outlook, Apple Mail)
- ✅ Use web-safe fonts
- ✅ Include alt text for images
- ✅ Add unsubscribe link (required by law)

## Setting Up Automated Newsletters

To send weekly newsletters automatically, you'll need:

### Option 1: Cloudflare Workers (Recommended)
```javascript
// workers/send-newsletter.js
export default {
  async scheduled(event, env, ctx) {
    // Fetch active subscribers from Supabase
    // Generate newsletter content
    // Call your API endpoint to send emails
  }
}
```

### Option 2: Vercel Cron Jobs
```javascript
// api/cron/newsletter.js
export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end('Unauthorized');
  }

  // Your newsletter logic here
}
```

### Option 3: GitHub Actions
```yaml
# .github/workflows/newsletter.yml
name: Send Weekly Newsletter
on:
  schedule:
    - cron: '0 9 * * 1' # Every Monday at 9 AM UTC
jobs:
  send:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Send Newsletter
        run: node scripts/send-newsletter.js
```

## Monitoring & Analytics

### Resend Dashboard
- Track open rates
- Monitor delivery status
- View bounce rates
- Check spam complaints

### Recommended Metrics to Track
- Subscription rate
- Open rate (industry avg: 20-30%)
- Click-through rate (industry avg: 2-5%)
- Unsubscribe rate (keep below 0.5%)

## Troubleshooting

### Emails Not Sending

1. **Check API Key**
   - Verify `VITE_RESEND_API_KEY` is set in `.env`
   - Make sure it starts with `re_`
   - Check it hasn't been regenerated in Resend dashboard

2. **Check From Address**
   - For testing: use `onboarding@resend.dev`
   - For production: make sure domain is verified

3. **Check Console Logs**
   - Open browser dev tools console
   - Look for errors from email service
   - Check Network tab for API responses

### Emails Going to Spam

1. **Verify Domain Authentication**
   - SPF record added correctly
   - DKIM record added correctly
   - DMARC policy set up

2. **Content Best Practices**
   - Don't use spam trigger words (FREE, !!!, URGENT)
   - Include unsubscribe link
   - Balance text and images
   - Use consistent from address
   - Warm up new domains gradually

3. **List Hygiene**
   - Only email people who subscribed
   - Remove bounced emails
   - Honor unsubscribe requests immediately

### Rate Limits

Free tier limits:
- **100 emails per day**
- **3,000 emails per month**

If you exceed limits:
- Upgrade to paid plan ($20/month for 50k emails)
- Or implement queueing to spread out sends

## Security Best Practices

### Environment Variables
- ✅ Never commit `.env` to git
- ✅ Use different API keys for development/production
- ✅ Rotate API keys every 90 days
- ✅ Limit API key permissions if possible

### Email Content
- ✅ Sanitize user input before including in emails
- ✅ Use HTTPS links only
- ✅ Include proper unsubscribe mechanism
- ✅ Comply with CAN-SPAM Act / GDPR

## Legal Compliance

### Required Elements
1. **Unsubscribe Link**: Every email must have one
2. **Physical Address**: Include your business address
3. **Sender Identification**: Clear "from" name and email
4. **Truthful Subject Lines**: No deceptive subjects

### Best Practices
- Get explicit consent before sending
- Make unsubscribe easy (one click)
- Honor unsubscribe requests within 10 days
- Keep records of consent

## Next Steps

1. ✅ Set up Resend account and API key
2. ✅ Configure environment variables
3. ✅ Test newsletter subscription
4. ✅ Verify domain for production use
5. ⏳ Set up automated weekly newsletters
6. ⏳ Monitor deliverability and engagement
7. ⏳ Optimize templates based on metrics

## Alternative Email Services

If Resend doesn't fit your needs:

### SendGrid
- **Pros**: More features, analytics dashboard
- **Cons**: More complex setup, heavier pricing
- **Free tier**: 100 emails/day

### Postmark
- **Pros**: Focus on transactional emails
- **Cons**: No free tier, $15/month minimum
- **Best for**: Larger scale operations

### AWS SES
- **Pros**: Very cheap at scale
- **Cons**: Complex setup, requires AWS knowledge
- **Pricing**: $0.10 per 1,000 emails

## Support

For help with email setup:
- **Resend Docs**: https://resend.com/docs
- **Resend Community**: https://resend.com/community
- **Bitcoin Investments**: Check our GitHub issues

---

Last updated: December 2025
