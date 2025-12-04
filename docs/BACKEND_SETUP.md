# Backend API Setup Guide

This guide explains how to set up and deploy the backend API functions for Bitcoin Investments. The backend handles Stripe payments, webhooks, and other server-side operations.

## Architecture

The backend uses **Cloudflare Workers** (serverless functions) deployed alongside your frontend on Cloudflare Pages. This provides:

- ✅ Zero cold starts (edge computing)
- ✅ Global distribution (200+ cities)
- ✅ Automatic scaling
- ✅ Free tier: 100,000 requests/day
- ✅ Built-in secrets management

## API Endpoints

All API endpoints are located in the `functions/api/` directory:

1. **`create-checkout-session.ts`** - Creates Stripe checkout sessions
2. **`create-portal-session.ts`** - Opens Stripe customer portal
3. **stripe-webhook.ts`** - Handles Stripe webhook events

## Prerequisites

1. Cloudflare account ([sign up free](https://dash.cloudflare.com/sign-up))
2. Stripe account with products configured
3. Supabase project with `users` table
4. Wrangler CLI (optional for local development)

## Step 1: Get Required Keys

### Stripe Keys (Backend)

1. Go to [Stripe Dashboard > Developers > API Keys](https://dashboard.stripe.com/apikeys)
2. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)
3. Save this - you'll need it for Cloudflare

### Stripe Webhook Secret

1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Enter URL: `https://yourdomain.com/api/stripe-webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)

### Supabase Service Role Key

1. Go to [Supabase Dashboard > Settings > API](https://supabase.com/dashboard/project/_/settings/api)
2. Copy your **service_role** key (NOT the anon key)
3. ⚠️ **IMPORTANT**: This key bypasses Row Level Security - keep it secret!

## Step 2: Configure Cloudflare Environment Variables

### Option A: Via Cloudflare Dashboard (Recommended for Production)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your **Pages project**
3. Go to **Settings > Environment variables**
4. Add the following variables:

#### Production Environment

```
# Stripe (Secret Keys)
STRIPE_SECRET_KEY = sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET = whsec_xxxxxxxxxxxxxxxxxxxxx

# Supabase
VITE_SUPABASE_URL = https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx

# Stripe Price IDs
VITE_STRIPE_PRICE_MONTHLY = price_xxxxxxxxxxxxxxxxxxxxx
VITE_STRIPE_PRICE_ANNUAL = price_xxxxxxxxxxxxxxxxxxxxx
```

#### Preview Environment (for testing)

Add the same variables but with **test mode** keys:

```
STRIPE_SECRET_KEY = sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET = whsec_test_xxxxxxxxxxxxxxxxxxxxx
```

### Option B: Via Wrangler CLI (Local Development)

1. Install Wrangler:
   ```bash
   npm install -g wrangler
   ```

2. Create `.dev.vars` file (copy from `.dev.vars.example`):
   ```bash
   cp .dev.vars.example .dev.vars
   ```

3. Edit `.dev.vars` with your actual keys:
   ```bash
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
   STRIPE_WEBHOOK_SECRET=whsec_test_xxxxxxxxxxxxxxxxxxxxx
   VITE_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx
   VITE_STRIPE_PRICE_MONTHLY=price_xxxxxxxxxxxxxxxxxxxxx
   VITE_STRIPE_PRICE_ANNUAL=price_xxxxxxxxxxxxxxxxxxxxx
   ```

4. Run local development server:
   ```bash
   npx wrangler pages dev dist --compatibility-date=2024-11-20
   ```

## Step 3: Deploy to Cloudflare Pages

### Initial Deployment

1. Build your project:
   ```bash
   npm run build
   ```

2. Deploy using Wrangler:
   ```bash
   npx wrangler pages deploy dist --project-name=bitcoin-investments
   ```

   Or connect via GitHub:
   - Go to Cloudflare Dashboard > Pages
   - Click **Create a project**
   - Connect your GitHub repository
   - Configure build settings:
     - Build command: `npm run build`
     - Build output directory: `dist`

### Automatic Deployments

Once connected to GitHub, Cloudflare automatically deploys on every push to:
- **Production**: `main` branch → `yourdomain.com`
- **Preview**: Other branches → `branch-name.yourdomain.pages.dev`

## Step 4: Update Supabase Schema

Make sure your `users` table has the required columns:

```sql
-- Add Stripe columns if not already present
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id
ON users(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_users_subscription_status
ON users(subscription_status);
```

Run this SQL in your Supabase SQL Editor.

## Step 5: Test the Integration

### Test Checkout Flow

1. Visit `https://yourdomain.com/pricing`
2. Click "Subscribe Monthly"
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete checkout
5. Verify you're redirected to profile page
6. Check subscription status shows "Premium"

### Test Webhook Delivery

1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click on your webhook endpoint
3. View the **Attempts** tab
4. Verify events are being received successfully (200 status)

### Test Customer Portal

1. Go to Profile > Subscription tab
2. Click "Manage Subscription"
3. Verify you can:
   - View invoices
   - Update payment method
   - Cancel subscription

## Step 6: Monitor and Debug

### View Logs

#### Cloudflare Dashboard
1. Go to **Workers & Pages > Your project**
2. Click on a deployment
3. View **Functions logs** in real-time

#### Wrangler CLI (Local)
```bash
npx wrangler pages deployment tail
```

### Common Issues

**Issue: "Missing environment variables"**
- Solution: Set all required environment variables in Cloudflare Dashboard

**Issue: "Invalid signature" on webhook**
- Solution: Verify `STRIPE_WEBHOOK_SECRET` matches your webhook's signing secret
- Make sure you're using the correct secret for test/live mode

**Issue: "Unauthorized" when updating Supabase**
- Solution: Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check that RLS policies allow service role access

**Issue: Webhook not receiving events**
- Solution: Verify webhook URL is correct and publicly accessible
- Check webhook is enabled in Stripe Dashboard
- Test webhook with Stripe CLI: `stripe trigger checkout.session.completed`

## Local Development

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.dev.vars` file with your test keys

3. Build the project:
   ```bash
   npm run build
   ```

4. Start Wrangler dev server:
   ```bash
   npx wrangler pages dev dist
   ```

5. Your API will be available at:
   - `http://localhost:8788/api/create-checkout-session`
   - `http://localhost:8788/api/create-portal-session`
   - `http://localhost:8788/api/stripe-webhook`

### Test Webhooks Locally

Use Stripe CLI to forward webhook events to your local server:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli

2. Login:
   ```bash
   stripe login
   ```

3. Forward webhooks:
   ```bash
   stripe listen --forward-to localhost:8788/api/stripe-webhook
   ```

4. Copy the webhook signing secret and add to `.dev.vars`

5. Trigger test events:
   ```bash
   stripe trigger checkout.session.completed
   stripe trigger customer.subscription.updated
   ```

## Security Best Practices

### DO:
- ✅ Use environment variables for all secrets
- ✅ Validate webhook signatures
- ✅ Use HTTPS for all webhooks
- ✅ Keep service role key secure
- ✅ Enable Stripe Radar for fraud detection
- ✅ Monitor failed webhook deliveries
- ✅ Set up alerts for payment failures

### DON'T:
- ❌ Commit `.dev.vars` to git
- ❌ Expose secret keys in frontend code
- ❌ Use service role key in client-side code
- ❌ Skip webhook signature verification
- ❌ Log sensitive customer data
- ❌ Use live keys in development

## Performance Optimization

### Edge Caching

Cloudflare Workers run at the edge, so API responses are fast globally. No additional configuration needed!

### Rate Limiting

Add rate limiting to prevent abuse:

```typescript
// Example: Add to your API functions
const rateLimiter = new Map();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const requests = rateLimiter.get(ip) || [];

  // Allow 10 requests per minute
  const recentRequests = requests.filter(time => now - time < 60000);

  if (recentRequests.length >= 10) {
    return false;
  }

  recentRequests.push(now);
  rateLimiter.set(ip, recentRequests);
  return true;
}
```

## Cost Estimation

### Cloudflare Workers Pricing

**Free Tier:**
- 100,000 requests/day
- Unlimited bandwidth
- No cold starts

**Paid ($5/month):**
- 10 million requests/month
- Additional requests: $0.50 per million

### Expected Costs

With 10,000 daily active users:
- API requests: ~30,000/day (3 per user)
- Monthly requests: ~900,000
- **Cost: FREE** (within free tier)

With 100,000 daily active users:
- API requests: ~300,000/day
- Monthly requests: ~9 million
- **Cost: $5/month** (Paid plan)

## Deployment Checklist

Before going live:

- [ ] Set all environment variables in Cloudflare Dashboard
- [ ] Switch to live Stripe keys (`sk_live_`, not `sk_test_`)
- [ ] Update webhook URL to production domain
- [ ] Test checkout flow with real card (small amount)
- [ ] Verify webhook events are received
- [ ] Test customer portal access
- [ ] Enable Stripe Radar for fraud protection
- [ ] Set up email notifications for failed payments
- [ ] Configure custom domain in Cloudflare
- [ ] Enable SSL/TLS (automatic with Cloudflare)
- [ ] Test subscription cancellation flow

## Troubleshooting Commands

```bash
# View Cloudflare Workers logs
npx wrangler pages deployment tail

# Test webhook locally
stripe listen --forward-to localhost:8788/api/stripe-webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
stripe trigger customer.subscription.deleted

# Check Stripe webhook status
stripe webhooks list

# View recent webhook events
stripe events list --limit 10
```

## Support

- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **Stripe API**: https://stripe.com/docs/api
- **Supabase**: https://supabase.com/docs

---

**Next Steps:**
1. Complete Steps 1-6 above
2. Test thoroughly in test mode
3. Deploy to production
4. Monitor for any issues

For questions, check the main documentation or open an issue on GitHub.
