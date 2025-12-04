# Production Deployment Checklist

This checklist will guide you through deploying Bitcoin Investments to production. Follow these steps in order to ensure a smooth launch.

## 📋 Pre-Deployment Checklist

### 1. Code & Configuration

- [x] All features implemented and tested locally
- [ ] Environment variables configured in `.env`
- [ ] No sensitive data committed to git
- [ ] `.gitignore` includes `.env` and `.dev.vars`
- [ ] Build completes without errors (`npm run build`)
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without errors (`npm run lint`)

### 2. Supabase Setup

- [ ] Supabase project created
- [ ] Database schema applied (`supabase/schema.sql`)
- [ ] Row Level Security (RLS) policies enabled
- [ ] Service role key obtained (for backend API)
- [ ] Anon key obtained (for frontend)
- [ ] All tables have proper indexes
- [ ] Test data added for development

**Verify:**
```sql
-- Run in Supabase SQL Editor
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- Should show: users, portfolios, holdings, transactions,
-- price_alerts, affiliate_clicks, articles, newsletter_subscribers, advertisements
```

### 3. Stripe Setup

- [ ] Stripe account created and verified
- [ ] Products created in Stripe Dashboard:
  - [ ] Premium Monthly ($9.99/month)
  - [ ] Premium Annual ($99.99/year)
- [ ] Price IDs copied
- [ ] Test mode keys obtained
- [ ] Live mode keys obtained (when ready)
- [ ] Stripe Customer Portal configured
- [ ] Tax settings configured (if applicable)

**Test Mode First:**
- Use test keys (`pk_test_...` and `sk_test_...`)
- Test with card: `4242 4242 4242 4242`

### 4. Email Setup (Resend)

- [ ] Resend account created
- [ ] Domain verified in Resend
- [ ] API key generated
- [ ] Test email sent successfully
- [ ] Welcome email template tested
- [ ] From email address configured

**Verify:**
```bash
# Test with curl
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"from":"hello@yourdomain.com","to":"test@example.com","subject":"Test","html":"<p>Test</p>"}'
```

## 🚀 Deployment Steps

### Step 1: Deploy to Cloudflare Pages

#### Option A: Via GitHub (Recommended)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Connect to Cloudflare**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to **Workers & Pages**
   - Click **Create application** > **Pages** > **Connect to Git**
   - Select your repository
   - Configure build settings:
     - **Framework preset**: None
     - **Build command**: `npm run build`
     - **Build output directory**: `dist`
   - Click **Save and Deploy**

#### Option B: Via Wrangler CLI

1. **Build project**
   ```bash
   npm run build
   ```

2. **Deploy**
   ```bash
   npm run deploy
   ```

### Step 2: Configure Environment Variables

In Cloudflare Dashboard > Your Project > Settings > Environment Variables:

#### Production Environment

```bash
# Supabase (Frontend - Public)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...your-anon-key

# Supabase (Backend - Secret!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key

# Stripe (Frontend - Public)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx  # Use pk_live_xxxxx for production
VITE_STRIPE_PRICE_MONTHLY=price_xxxxx
VITE_STRIPE_PRICE_ANNUAL=price_xxxxx

# Stripe (Backend - Secret!)
STRIPE_SECRET_KEY=sk_test_xxxxx  # Use sk_live_xxxxx for production
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Resend (Backend - Secret!)
VITE_RESEND_API_KEY=re_xxxxx
VITE_FROM_EMAIL=hello@yourdomain.com

# APIs (Optional)
VITE_COINGECKO_API_KEY=your-api-key
VITE_CRYPTOCOMPARE_API_KEY=your-api-key
```

**Important:**
- Start with **test mode** Stripe keys
- Switch to **live mode** only after testing

### Step 3: Configure Stripe Webhooks

1. **Get your deployment URL**
   - After deployment, note your URL: `https://your-project.pages.dev`
   - Or use custom domain if configured

2. **Add webhook in Stripe**
   - Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
   - Click **Add endpoint**
   - URL: `https://your-domain.com/api/stripe-webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Click **Add endpoint**

3. **Update webhook secret**
   - Copy the **Signing secret** from Stripe
   - Add to Cloudflare environment variables: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`

### Step 4: Test Production Deployment

#### Test 1: Basic Functionality
- [ ] Homepage loads correctly
- [ ] Navigation works
- [ ] Dashboard shows live prices
- [ ] Educational content accessible
- [ ] Platform comparison works

#### Test 2: Authentication
- [ ] Sign up with email
- [ ] Receive verification email
- [ ] Log in successfully
- [ ] Profile page displays correctly
- [ ] Log out works

#### Test 3: Portfolio Tracker
- [ ] Add cryptocurrency holding
- [ ] View portfolio summary
- [ ] Check P/L calculations
- [ ] Data syncs to Supabase

#### Test 4: Stripe Integration (Test Mode)
- [ ] Visit `/pricing` page
- [ ] Click "Subscribe Monthly"
- [ ] Redirected to Stripe Checkout
- [ ] Complete checkout with test card: `4242 4242 4242 4242`
- [ ] Redirected back to profile
- [ ] Subscription status shows "Premium"
- [ ] Verify webhook received in Stripe Dashboard

#### Test 5: Customer Portal
- [ ] Go to Profile > Subscription tab
- [ ] Click "Manage Subscription"
- [ ] Opens Stripe Customer Portal
- [ ] Can view invoices
- [ ] Can update payment method
- [ ] Can cancel subscription (test, then revert)

#### Test 6: Newsletter
- [ ] Subscribe to newsletter on homepage
- [ ] Receive welcome email
- [ ] Email formatted correctly
- [ ] Unsubscribe link works

### Step 5: Configure Custom Domain (Optional)

1. **Add custom domain in Cloudflare**
   - Go to **Custom domains** section
   - Click **Set up a custom domain**
   - Enter your domain (e.g., `bitcoininvestments.com`)
   - Follow DNS configuration instructions

2. **Update Stripe webhook URL**
   - Update webhook endpoint to use custom domain
   - Test webhook delivery again

3. **Update environment variables**
   - Update any URLs that reference the domain
   - Redeploy if necessary

## 🔴 Go Live (Switch to Live Mode)

**Only proceed after thorough testing in test mode!**

### Prerequisites
- [ ] Test mode fully tested
- [ ] All features working correctly
- [ ] Webhooks receiving events successfully
- [ ] Email automation working
- [ ] At least 10 test transactions completed successfully

### Switch to Live Mode

1. **Update Stripe keys in Cloudflare**
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
   STRIPE_SECRET_KEY=sk_live_xxxxx
   ```

2. **Update Stripe webhook**
   - Create new webhook endpoint for live mode
   - Update `STRIPE_WEBHOOK_SECRET` with live webhook secret

3. **Update Price IDs**
   ```
   VITE_STRIPE_PRICE_MONTHLY=price_live_xxxxx
   VITE_STRIPE_PRICE_ANNUAL=price_live_xxxxx
   ```

4. **Test with real card (small amount)**
   - Make a real subscription
   - Verify everything works
   - Cancel and refund if testing

5. **Enable Stripe Radar**
   - Fraud protection is automatic in live mode
   - Configure rules in Stripe Dashboard

## 📊 Post-Deployment Monitoring

### Week 1: Daily Monitoring

- [ ] Check Cloudflare analytics for traffic
- [ ] Monitor error logs in Cloudflare Dashboard
- [ ] Check Stripe Dashboard for subscriptions
- [ ] Monitor webhook delivery success rate
- [ ] Check Supabase logs for errors
- [ ] Verify email delivery rate in Resend

### Week 2-4: Regular Monitoring

- [ ] Review subscription metrics weekly
- [ ] Monitor churn rate
- [ ] Check conversion rate (free to premium)
- [ ] Review user feedback
- [ ] Monitor page load times
- [ ] Check for any security alerts

## 🔧 Troubleshooting Common Issues

### Issue: Webhook not receiving events

**Solution:**
1. Verify webhook URL is correct
2. Check webhook signing secret matches
3. Test webhook with Stripe CLI:
   ```bash
   stripe listen --forward-to https://your-domain.com/api/stripe-webhook
   ```
4. Check Cloudflare Functions logs for errors

### Issue: Subscription status not updating

**Solution:**
1. Check webhook logs in Stripe Dashboard
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
3. Check Supabase logs for RLS policy errors
4. Manually trigger webhook event to test

### Issue: Emails not sending

**Solution:**
1. Verify Resend API key is correct
2. Check domain is verified in Resend
3. Check Resend activity log for errors
4. Verify from email address matches verified domain

### Issue: High error rate

**Solution:**
1. Check Cloudflare Functions logs
2. Review Sentry/error tracking (if configured)
3. Check browser console for frontend errors
4. Verify all environment variables are set

## 📈 Optimization

### Performance
- [ ] Enable Cloudflare cache
- [ ] Optimize images (use WebP format)
- [ ] Minimize CSS/JS bundle size
- [ ] Enable HTTP/2 and HTTP/3
- [ ] Configure service worker for offline support

### SEO
- [ ] Add meta tags for social sharing
- [ ] Create sitemap.xml
- [ ] Submit to Google Search Console
- [ ] Configure robots.txt
- [ ] Add structured data (Schema.org)

### Analytics
- [ ] Set up Plausible or Mixpanel
- [ ] Configure conversion tracking
- [ ] Set up funnel analysis
- [ ] Track key metrics (signups, subscriptions, churn)

## 🎯 Launch Checklist

### Marketing Preparation
- [ ] Landing page optimized
- [ ] Pricing page finalized
- [ ] Blog content ready
- [ ] Social media accounts created
- [ ] Email campaigns prepared
- [ ] Press release drafted

### Legal & Compliance
- [ ] Privacy policy reviewed
- [ ] Terms of service reviewed
- [ ] Cookie consent working
- [ ] GDPR compliance verified
- [ ] Refund policy published
- [ ] Business entity registered (if applicable)

### Support Setup
- [ ] Support email configured (support@yourdomain.com)
- [ ] FAQ page created
- [ ] Documentation complete
- [ ] Contact form working
- [ ] Response templates prepared

## 🎉 Launch Day

1. **Final smoke test**
   - Test all critical paths
   - Verify payment flow
   - Check email delivery

2. **Announce launch**
   - Social media posts
   - Email to waitlist
   - Product Hunt launch (optional)
   - Reddit, Twitter, etc.

3. **Monitor closely**
   - Watch error logs
   - Monitor user signups
   - Check payment success rate
   - Respond to support requests

4. **Celebrate! 🎊**
   - You've built a production-ready crypto platform!

## 📞 Support Resources

- **Cloudflare**: https://developers.cloudflare.com/pages/
- **Stripe**: https://stripe.com/docs
- **Supabase**: https://supabase.com/docs
- **Resend**: https://resend.com/docs

---

**Questions?** Check the documentation in `docs/` or open an issue on GitHub.

**Ready to launch?** Work through this checklist step by step. Good luck! 🚀
