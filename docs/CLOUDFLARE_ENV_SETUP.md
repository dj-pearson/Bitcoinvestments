# Cloudflare Pages Environment Variables Setup

This guide will help you properly configure environment variables in Cloudflare Pages so they're available during build time and runtime.

## Understanding Cloudflare Pages Environment Variables

Cloudflare Pages has two types of environment variables:

1. **Build Environment Variables** - Available during `npm run build`
2. **Runtime Environment Variables** - Available to Functions (API routes)

For our app, we need **both** types:
- **Build time**: Frontend variables (VITE_*)
- **Runtime**: Backend secrets (STRIPE_SECRET_KEY, etc.)

## Step-by-Step Setup

### 1. Access Environment Variables in Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **Workers & Pages**
3. Select your **bitcoin-investments** project
4. Click **Settings**
5. Scroll to **Environment variables**

### 2. Add Production Environment Variables

Click **Add variables** and add each of the following:

#### Frontend Variables (Available at Build Time)

These MUST be set for **Production** environment:

```
Variable name: VITE_SUPABASE_URL
Value: https://mkdckqrukmukbmgxabyk.supabase.co
Type: Text (not Secret)
Environment: Production
```

```
Variable name: VITE_SUPABASE_PUBLISHABLE_KEY
Value: your-supabase-anon-key
Type: Text (not Secret - it's public)
Environment: Production
```

```
Variable name: VITE_STRIPE_PUBLISHABLE_KEY
Value: pk_test_xxxxx (or pk_live_xxxxx for production)
Type: Text (not Secret - it's public)
Environment: Production
```

```
Variable name: VITE_STRIPE_PRICE_MONTHLY
Value: price_xxxxx (from Stripe Dashboard)
Type: Text
Environment: Production
```

```
Variable name: VITE_STRIPE_PRICE_ANNUAL
Value: price_xxxxx (from Stripe Dashboard)
Type: Text
Environment: Production
```

#### Backend Secrets (Runtime Only)

These are SECRET and should be encrypted:

```
Variable name: STRIPE_SECRET_KEY
Value: sk_test_xxxxx (or sk_live_xxxxx)
Type: Secret (click "Encrypt")
Environment: Production
```

```
Variable name: STRIPE_WEBHOOK_SECRET
Value: whsec_xxxxx
Type: Secret (click "Encrypt")
Environment: Production
```

```
Variable name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGc... (your service role key)
Type: Secret (click "Encrypt")
Environment: Production
```

### 3. Important: Do NOT Mark Frontend Variables as "Secret"

**Critical:** Variables starting with `VITE_` should be **Text** type, not **Secret**.

Why? Vite needs to read these at build time and embed them in the JavaScript bundle. If they're marked as "Secret", Cloudflare won't expose them during the build process.

### 4. Verify Variables Are Set

After adding all variables, you should see them listed like this:

**Production Environment:**
- VITE_SUPABASE_URL: https://mkdckqrukmukbmgxabyk.supabase.co
- VITE_SUPABASE_PUBLISHABLE_KEY: (your key)
- VITE_STRIPE_PUBLISHABLE_KEY: pk_test_...
- VITE_STRIPE_PRICE_MONTHLY: price_...
- VITE_STRIPE_PRICE_ANNUAL: price_...
- STRIPE_SECRET_KEY: •••••••• (encrypted)
- STRIPE_WEBHOOK_SECRET: •••••••• (encrypted)
- SUPABASE_SERVICE_ROLE_KEY: •••••••• (encrypted)

### 5. Trigger a New Deployment

After setting variables, you need to trigger a new build:

**Option A: Push a commit**
```bash
git commit --allow-empty -m "Trigger rebuild with env vars"
git push origin main
```

**Option B: Use Cloudflare Dashboard**
1. Go to **Deployments** tab
2. Click **Retry deployment** on the latest deployment

### 6. Verify Variables During Build

Check the build logs in Cloudflare Dashboard. You should see:

```
✓ VITE_SUPABASE_URL is set
✓ VITE_STRIPE_PUBLISHABLE_KEY is set
✓ Build completed successfully
```

## Troubleshooting

### Issue: "VITE_SUPABASE_URL is undefined"

**Solution:**
1. Make sure the variable is set in **Production** environment (not Preview)
2. Make sure it's **Text** type, not **Secret**
3. Trigger a new deployment after adding variables
4. Check the variable name exactly matches (case-sensitive)

### Issue: "Cannot read properties of undefined"

**Solution:**
This means the variable is not available at build time. Double-check:
1. Variable name starts with `VITE_`
2. Variable is set in the **correct environment** (Production vs Preview)
3. You've deployed AFTER setting the variable

### Issue: Backend API returns 500 errors

**Solution:**
Backend secrets (STRIPE_SECRET_KEY, etc.) are not being read. Make sure:
1. They're set in **Production** environment
2. They CAN be marked as **Secret** (they're only used at runtime)
3. Your Functions are deployed (happens automatically with Pages)

## Testing Environment Variables Locally

### For Frontend (Vite)

Create/edit `.env.local` file:
```bash
VITE_SUPABASE_URL=https://mkdckqrukmukbmgxabyk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_STRIPE_PRICE_MONTHLY=price_xxxxx
VITE_STRIPE_PRICE_ANNUAL=price_xxxxx
```

Run dev server:
```bash
npm run dev
```

### For Backend (Cloudflare Functions)

Create `.dev.vars` file (from `.dev.vars.example`):
```bash
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
VITE_SUPABASE_URL=https://mkdckqrukmukbmgxabyk.supabase.co
VITE_STRIPE_PRICE_MONTHLY=price_xxxxx
VITE_STRIPE_PRICE_ANNUAL=price_xxxxx
```

Run with Wrangler:
```bash
npm run build
npm run dev:wrangler
```

## Preview Environment (Optional)

If you want different values for preview deployments (e.g., test Stripe keys):

1. Add the same variables again
2. Set **Environment** to **Preview**
3. Use test/staging values

Example:
- Production: `VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx`
- Preview: `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx`

## Quick Checklist

Before deploying, verify:

- [ ] All `VITE_*` variables are set as **Text** (not Secret)
- [ ] Backend secrets are set as **Secret**
- [ ] Variables are set for **Production** environment
- [ ] Variable names match exactly (case-sensitive)
- [ ] You've triggered a new deployment after adding variables
- [ ] Build logs show variables are available
- [ ] Frontend loads without "undefined" errors
- [ ] Backend API functions work correctly

## Common Variable Names Reference

| Variable | Type | Required | Purpose |
|----------|------|----------|---------|
| VITE_SUPABASE_URL | Text | ✅ Yes | Supabase project URL |
| VITE_SUPABASE_PUBLISHABLE_KEY | Text | ✅ Yes | Supabase anon key |
| VITE_STRIPE_PUBLISHABLE_KEY | Text | ✅ Yes | Stripe public key |
| VITE_STRIPE_PRICE_MONTHLY | Text | ✅ Yes | Stripe monthly price ID |
| VITE_STRIPE_PRICE_ANNUAL | Text | ✅ Yes | Stripe annual price ID |
| STRIPE_SECRET_KEY | Secret | ✅ Yes | Stripe secret key (backend) |
| STRIPE_WEBHOOK_SECRET | Secret | ✅ Yes | Stripe webhook signing secret |
| SUPABASE_SERVICE_ROLE_KEY | Secret | ✅ Yes | Supabase admin key (backend) |
| VITE_RESEND_API_KEY | Text | ⚠️ Optional | Email service API key |
| VITE_FROM_EMAIL | Text | ⚠️ Optional | Newsletter from email |
| VITE_COINGECKO_API_KEY | Text | ⚠️ Optional | CoinGecko API key |
| VITE_CRYPTOCOMPARE_API_KEY | Text | ⚠️ Optional | CryptoCompare API key |

## Support

If you're still having issues:

1. Check Cloudflare build logs for specific errors
2. Verify variables in Cloudflare Dashboard match this guide
3. Make sure you deployed AFTER setting variables
4. Try clearing Cloudflare cache and redeploying

---

**Questions?** Open an issue or check the main documentation.
