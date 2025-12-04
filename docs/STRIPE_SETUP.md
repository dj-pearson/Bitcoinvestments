# Stripe Payment Integration Setup

Bitcoin Investments includes a complete Stripe integration for premium membership subscriptions. This guide walks you through setting up Stripe for your platform.

## Features

- Multiple subscription tiers (Free, Monthly $9.99, Annual $99.99)
- Secure checkout with Stripe Checkout
- Customer portal for subscription management
- Automatic subscription status sync
- Premium feature gates (ad-free, cloud sync, priority support)
- 30-day money-back guarantee
- Responsive pricing page with FAQ

## Prerequisites

1. A Stripe account ([sign up at stripe.com](https://stripe.com))
2. Your Bitcoin Investments platform deployed or running locally
3. Access to your Supabase database

## Step 1: Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and sign up
2. Complete the account verification process
3. Enable "Test mode" (toggle in top right) for development

## Step 2: Get API Keys

1. Navigate to **Developers > API keys** in your Stripe dashboard
2. Copy your **Publishable key** (starts with `pk_test_` in test mode)
3. Keep your **Secret key** handy (starts with `sk_test_` in test mode)

**Important:** Never commit your secret key to git. Only the publishable key goes in your `.env` file.

## Step 3: Create Products and Prices

### Create Monthly Subscription

1. Go to **Products** in your Stripe dashboard
2. Click **Add product**
3. Fill in:
   - **Name**: Premium Monthly
   - **Description**: Monthly premium membership for Bitcoin Investments
   - **Pricing**: Recurring
   - **Price**: $9.99 USD
   - **Billing period**: Monthly
4. Click **Save product**
5. Copy the **Price ID** (starts with `price_`)

### Create Annual Subscription

1. Click **Add product** again
2. Fill in:
   - **Name**: Premium Annual
   - **Description**: Annual premium membership for Bitcoin Investments (17% off)
   - **Pricing**: Recurring
   - **Price**: $99.99 USD
   - **Billing period**: Yearly
3. Click **Save product**
4. Copy the **Price ID**

## Step 4: Configure Environment Variables

Update your `.env` file with your Stripe keys:

```bash
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
VITE_STRIPE_PRICE_MONTHLY=price_xxxxxxxxxxxxxxxxxxxxx
VITE_STRIPE_PRICE_ANNUAL=price_xxxxxxxxxxxxxxxxxxxxx
```

**For production:**
- Use live keys (start with `pk_live_` and `sk_live_`)
- Update the price IDs to your live product prices

## Step 5: Create Backend API Routes

You'll need to create server-side endpoints to handle Stripe operations. Here's what you need:

### Required Endpoints

1. **POST /api/create-checkout-session**
   - Creates a Stripe Checkout session
   - Returns session ID to redirect user

2. **POST /api/create-portal-session**
   - Creates a Stripe Customer Portal session
   - Returns portal URL for subscription management

3. **POST /api/stripe-webhook**
   - Handles Stripe webhook events
   - Updates subscription status in Supabase

### Example: Create Checkout Session (Node.js/Express)

```javascript
// api/create-checkout-session.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/create-checkout-session', async (req, res) => {
  const { priceId, userId, userEmail, successUrl, cancelUrl } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      client_reference_id: userId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId,
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Example: Create Portal Session

```javascript
// api/create-portal-session.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/create-portal-session', async (req, res) => {
  const { customerId, returnUrl } = req.body;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Example: Webhook Handler

```javascript
// api/stripe-webhook.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.post('/api/stripe-webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await handleCheckoutComplete(session);
      break;

    case 'customer.subscription.updated':
      const subscription = event.data.object;
      await handleSubscriptionUpdate(subscription);
      break;

    case 'customer.subscription.deleted':
      const deletedSub = event.data.object;
      await handleSubscriptionCanceled(deletedSub);
      break;
  }

  res.json({ received: true });
});

async function handleCheckoutComplete(session) {
  const userId = session.client_reference_id;
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0].price.id;

  // Determine tier
  let tier = 'free';
  if (priceId === process.env.VITE_STRIPE_PRICE_MONTHLY) {
    tier = 'monthly';
  } else if (priceId === process.env.VITE_STRIPE_PRICE_ANNUAL) {
    tier = 'annual';
  }

  // Update user in Supabase
  await supabase
    .from('users')
    .update({
      subscription_status: 'premium',
      subscription_tier: tier,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', userId);
}

async function handleSubscriptionUpdate(subscription) {
  const customerId = subscription.customer;
  const status = subscription.status;
  const priceId = subscription.items.data[0].price.id;

  // Determine tier
  let tier = 'free';
  if (priceId === process.env.VITE_STRIPE_PRICE_MONTHLY) {
    tier = 'monthly';
  } else if (priceId === process.env.VITE_STRIPE_PRICE_ANNUAL) {
    tier = 'annual';
  }

  // Update status
  const subscriptionStatus = status === 'active' ? 'premium' : 'free';

  await supabase
    .from('users')
    .update({
      subscription_status: subscriptionStatus,
      subscription_tier: tier,
      subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_customer_id', customerId);
}

async function handleSubscriptionCanceled(subscription) {
  const customerId = subscription.customer;

  await supabase
    .from('users')
    .update({
      subscription_status: 'free',
      subscription_tier: 'free',
      subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_customer_id', customerId);
}
```

## Step 6: Configure Webhooks

Webhooks allow Stripe to notify your server when subscription events occur.

### Local Development (using Stripe CLI)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe-webhook`
4. Copy the webhook signing secret (starts with `whsec_`)

### Production

1. Go to **Developers > Webhooks** in Stripe dashboard
2. Click **Add endpoint**
3. Enter your webhook URL: `https://yourdomain.com/api/stripe-webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.created`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret**

Add the webhook secret to your environment:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

## Step 7: Update Supabase Schema

Make sure your `users` table has the required Stripe columns:

```sql
-- Add Stripe columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
```

## Step 8: Test the Integration

### Test Mode

1. Visit `/pricing` on your site
2. Click "Subscribe Monthly" or "Subscribe Annual"
3. Use Stripe test card: `4242 4242 4242 4242`
4. Any future expiry date (e.g., 12/34)
5. Any 3-digit CVC (e.g., 123)
6. Any billing postal code

### Verify Success

1. Check that you're redirected to `/profile?session_id=...`
2. Verify subscription status shows "Premium" in profile
3. Check Stripe dashboard for the test subscription
4. Verify webhook was received (check logs)

### Test Customer Portal

1. Go to Profile > Subscription tab
2. Click "Manage Subscription"
3. Verify you can:
   - Update payment method
   - View invoices
   - Cancel subscription

## Step 9: Go Live

### Checklist

- [ ] Switch to live API keys (`pk_live_` and `sk_live_`)
- [ ] Create live products and prices
- [ ] Update `.env` with live keys and price IDs
- [ ] Configure live webhook endpoint
- [ ] Test a real subscription (small amount first)
- [ ] Set up Stripe Radar for fraud protection
- [ ] Configure email receipts in Stripe settings
- [ ] Review and customize customer portal settings
- [ ] Add business details (tax ID, address) in Stripe settings
- [ ] Enable 3D Secure for cards (Settings > Payment methods)

## Deployment Options

### Option 1: Cloudflare Workers (Recommended)

Create API routes as Cloudflare Workers:

1. Create `functions/api/create-checkout-session.ts`
2. Create `functions/api/create-portal-session.ts`
3. Create `functions/api/stripe-webhook.ts`
4. Deploy to Cloudflare Pages

### Option 2: Vercel Serverless Functions

Create API routes in `api/` directory:

1. `api/create-checkout-session.ts`
2. `api/create-portal-session.ts`
3. `api/stripe-webhook.ts`

### Option 3: Netlify Functions

Create functions in `netlify/functions/`:

1. `netlify/functions/create-checkout-session.ts`
2. `netlify/functions/create-portal-session.ts`
3. `netlify/functions/stripe-webhook.ts`

## Premium Feature Gates

The platform automatically shows/hides premium features based on subscription status:

### Ad-Free Experience

```typescript
// In AdUnit.tsx
if (hasPremiumAccess(user?.subscription_status, user?.subscription_expires_at)) {
  return null; // Don't show ads
}
```

### Cloud Portfolio Sync

```typescript
// In Portfolio.tsx
if (user?.subscription_status === 'premium') {
  // Sync to Supabase
} else {
  // Use local storage only
}
```

### Email Alerts

```typescript
// In database.ts
if (user?.subscription_status === 'premium') {
  await sendPriceAlert(user.email, alert);
}
```

## Pricing Strategy

### Current Pricing

- **Free**: $0 (ads, local storage, basic features)
- **Monthly**: $9.99/month (all premium features)
- **Annual**: $99.99/year ($8.33/month, 17% savings)

### Revenue Projections

With 1,000 active users:
- 80% free (800 users) = $0
- 15% monthly (150 users × $9.99) = $1,498.50/mo
- 5% annual (50 users × $99.99 / 12) = $416.63/mo
- **Total**: ~$1,915/month or $23,000/year

With 10,000 active users:
- 80% free (8,000 users) = $0
- 15% monthly (1,500 users × $9.99) = $14,985/mo
- 5% annual (500 users × $99.99 / 12) = $4,166/mo
- **Total**: ~$19,150/month or $230,000/year

### Optimization Tips

1. **Free Trial**: Offer 7-day or 14-day free trial of premium
2. **Discounts**: Student (50% off), nonprofit (50% off), annual (17% off)
3. **Lifetime Deal**: One-time $299 payment for lifetime access (limited)
4. **Team Plans**: $29.99/month for up to 5 users
5. **Upsells**: Premium research reports ($29/month add-on)

## Troubleshooting

### Common Issues

**Issue: Checkout redirects to error page**
- Verify Stripe publishable key is correct
- Check browser console for errors
- Ensure API endpoint is accessible

**Issue: Webhook not received**
- Verify webhook URL is publicly accessible
- Check webhook signing secret is correct
- Test webhook with Stripe CLI: `stripe trigger checkout.session.completed`

**Issue: Subscription status not updating**
- Check webhook logs in Stripe dashboard
- Verify Supabase credentials are correct
- Check that user ID matches `client_reference_id`

**Issue: Customer portal not opening**
- Verify customer ID is saved in database
- Check that customer exists in Stripe
- Enable Customer Portal in Stripe settings

### Testing Webhook Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe-webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

## Security Best Practices

1. **Never expose secret key**: Only use in server-side code
2. **Verify webhook signatures**: Always validate webhook events
3. **Use HTTPS**: Required for production webhooks
4. **Enable Radar**: Stripe's fraud detection (automatic in live mode)
5. **Rate limiting**: Prevent abuse of API endpoints
6. **Input validation**: Sanitize all user inputs
7. **Error handling**: Don't expose sensitive error details to users

## Legal Requirements

### Required Pages

- [x] **Privacy Policy**: Explain how payment data is handled (already created)
- [x] **Terms of Service**: Include subscription terms (already created)
- [ ] **Refund Policy**: Document your 30-day guarantee

### Compliance

- **PCI DSS**: Stripe handles all card data (no PCI requirements for you)
- **GDPR**: Allow users to export/delete data (via customer portal)
- **Sales Tax**: Enable Stripe Tax for automatic calculation
- **Receipts**: Stripe sends email receipts automatically

## Support

### For Users

Create a support email: support@yourdomain.com

Common support requests:
- Billing questions → Stripe Customer Portal
- Refund requests → Process via Stripe dashboard
- Technical issues → Your support system

### For Developers

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Discord](https://discord.gg/stripe)
- [Stripe Support](https://support.stripe.com)

## Next Steps

1. Complete backend API implementation
2. Test thoroughly in test mode
3. Add additional premium features (advanced analytics, AI insights)
4. Set up monitoring for failed payments
5. Create email campaigns for free users (upgrade prompts)
6. Implement usage analytics (track feature adoption)
7. A/B test pricing ($7.99 vs $9.99)

---

**Questions?** Check the Bitcoin Investments documentation or open an issue on GitHub.
