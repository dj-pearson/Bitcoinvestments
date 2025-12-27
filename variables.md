# Environment Variables Master Sheet

This document contains a comprehensive list of all environment variables used across the Bitcoin Investments platform. This includes variables for the frontend (Vite), backend edge functions (Supabase/Deno), Cloudflare Pages, and build processes.

---

## Table of Contents

1. [Quick Reference Summary](#quick-reference-summary)
2. [Environment Types](#environment-types)
3. [Core Platform Variables](#core-platform-variables)
4. [Stripe Payment Variables](#stripe-payment-variables)
5. [Feature Add-On Price Variables](#feature-add-on-price-variables)
6. [Web3 & Blockchain Variables](#web3--blockchain-variables)
7. [Affiliate Variables](#affiliate-variables)
8. [Email & Notifications Variables](#email--notifications-variables)
9. [Supabase Edge Function Variables](#supabase-edge-function-variables)
10. [Where to Set Each Variable](#where-to-set-each-variable)
11. [Security Classification](#security-classification)
12. [Validation Checklist](#validation-checklist)

---

## Quick Reference Summary

| Category | Count | Type |
|----------|-------|------|
| Core Platform (Supabase/Stripe) | 6 | Mixed |
| Stripe Price IDs | 35+ | Plain Text |
| Web3/Blockchain | 2 | Mixed |
| Affiliate IDs | 7 | Plain Text |
| Email/Notifications | 2 | Plain Text |
| Edge Function Secrets | 4 | Supabase Secrets |
| **Total** | **56+** | - |

---

## Environment Types

### 1. Vite Frontend Variables (`VITE_*`)
- **Access Method**: `import.meta.env.VITE_*`
- **Set In**: Cloudflare Pages Dashboard (Text type, NOT Secret)
- **Available At**: Build time, bundled into JavaScript
- **Security**: Public (exposed to browser)

### 2. Backend Secrets (No `VITE_` prefix)
- **Access Method**: Via Cloudflare Functions `env` object
- **Set In**: Cloudflare Pages Dashboard (Secret/Encrypted type)
- **Available At**: Runtime only (Cloudflare Functions)
- **Security**: Private (never exposed to browser)

### 3. Supabase Edge Function Secrets
- **Access Method**: `Deno.env.get('VARIABLE_NAME')`
- **Set In**: Supabase Dashboard > Project Settings > Edge Functions > Secrets
- **Available At**: Runtime only (Edge Functions)
- **Security**: Private (never exposed to browser)

### 4. Built-in Vite Flags
- **Access Method**: `import.meta.env.DEV` / `import.meta.env.PROD`
- **Set In**: Automatic based on build mode
- **Available At**: Build time

---

## Core Platform Variables

### Supabase Configuration

| Variable | Type | Required | Where to Set | Description |
|----------|------|----------|--------------|-------------|
| `VITE_SUPABASE_URL` | Plain Text | Yes | Cloudflare (Text) | Supabase project URL (e.g., `https://xxxxx.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Plain Text | Yes | Cloudflare (Text) | Supabase anonymous/public key (safe to expose) |
| `VITE_SUPABASE_PROJECT_ID` | Plain Text | No | Cloudflare (Text) | Supabase project ID (used for storage URLs) |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Yes | Cloudflare (Secret) | Supabase service role key for admin operations |

**Source Files**:
- `src/lib/supabase.ts:4-5` - URL and publishable key
- `src/lib/supabase.ts:44` - Project ID

### Stripe Core Configuration

| Variable | Type | Required | Where to Set | Description |
|----------|------|----------|--------------|-------------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Plain Text | Yes | Cloudflare (Text) | Stripe publishable key (`pk_test_*` or `pk_live_*`) |
| `STRIPE_SECRET_KEY` | Secret | Yes | Cloudflare (Secret) | Stripe secret key (`sk_test_*` or `sk_live_*`) |
| `STRIPE_WEBHOOK_SECRET` | Secret | Yes | Cloudflare (Secret) | Stripe webhook signing secret (`whsec_*`) |

**Source Files**:
- `src/services/stripe.ts:17` - Publishable key
- Backend functions use secret key

---

## Stripe Payment Variables

### Main Subscription Plans

| Variable | Type | Required | Where to Set | Description |
|----------|------|----------|--------------|-------------|
| `VITE_STRIPE_PRICE_MONTHLY` | Plain Text | Yes | Cloudflare (Text) | Premium Monthly subscription price ID ($9.99/month) |
| `VITE_STRIPE_PRICE_ANNUAL` | Plain Text | Yes | Cloudflare (Text) | Premium Annual subscription price ID ($99.99/year) |
| `VITE_STRIPE_PRICE_LIFETIME` | Plain Text | Yes | Cloudflare (Text) | Lifetime Premium one-time price ID ($299) |
| `VITE_STRIPE_PRICE_ADVISOR` | Plain Text | Yes | Cloudflare (Text) | Advisor Plan price ID ($49/month) |
| `VITE_STRIPE_PRICE_ENTERPRISE` | Plain Text | Yes | Cloudflare (Text) | Enterprise Plan price ID ($99/month) |

**Source Files**:
- `src/services/stripe.ts:72-154` - All main plan price IDs

### Tax Package Plans (One-Time Purchases)

| Variable | Type | Required | Where to Set | Description |
|----------|------|----------|--------------|-------------|
| `VITE_STRIPE_TAX_PACKAGE_BASIC` | Plain Text | No | Cloudflare (Text) | Tax Report Basic package price ID ($29.99) |
| `VITE_STRIPE_TAX_PACKAGE_PREMIUM` | Plain Text | No | Cloudflare (Text) | Tax Report Premium package price ID ($49.99) |

**Source File**: `src/services/subscriptionLimits.ts:564-565`

### API Developer Tiers

| Variable | Type | Required | Where to Set | Description |
|----------|------|----------|--------------|-------------|
| `VITE_STRIPE_API_STARTER_MONTHLY` | Plain Text | No | Cloudflare (Text) | API Starter Monthly price ID |
| `VITE_STRIPE_API_STARTER_YEARLY` | Plain Text | No | Cloudflare (Text) | API Starter Yearly price ID |
| `VITE_STRIPE_API_PROFESSIONAL_MONTHLY` | Plain Text | No | Cloudflare (Text) | API Professional Monthly price ID |
| `VITE_STRIPE_API_PROFESSIONAL_YEARLY` | Plain Text | No | Cloudflare (Text) | API Professional Yearly price ID |

**Source File**: `.dev.vars.example:55-65`

---

## Feature Add-On Price Variables

### Hardware Wallet Feature

| Variable | Type | Required | Where to Set | Description |
|----------|------|----------|--------------|-------------|
| `VITE_STRIPE_HARDWARE_WALLET_MONTHLY` | Plain Text | No | Cloudflare (Text) | Hardware Wallet feature monthly |
| `VITE_STRIPE_HARDWARE_WALLET_YEARLY` | Plain Text | No | Cloudflare (Text) | Hardware Wallet feature yearly |

**Source File**: `src/services/hardwareWallet.ts:42-61`

### Gas Optimizer Feature

| Variable | Type | Required | Where to Set | Description |
|----------|------|----------|--------------|-------------|
| `VITE_STRIPE_GAS_OPTIMIZER_MONTHLY` | Plain Text | No | Cloudflare (Text) | Gas Optimizer monthly subscription |
| `VITE_STRIPE_GAS_OPTIMIZER_YEARLY` | Plain Text | No | Cloudflare (Text) | Gas Optimizer yearly subscription |

**Source File**: `src/services/gasOptimizer.ts:69-70`

### DeFi Yield Tracker Feature

| Variable | Type | Required | Where to Set | Description |
|----------|------|----------|--------------|-------------|
| `VITE_STRIPE_DEFI_YIELD_MONTHLY` | Plain Text | No | Cloudflare (Text) | DeFi Yield Tracker monthly |
| `VITE_STRIPE_DEFI_YIELD_YEARLY` | Plain Text | No | Cloudflare (Text) | DeFi Yield Tracker yearly |

**Source File**: `src/services/defiYield.ts:72-73`

### Retirement Calculator Feature

| Variable | Type | Required | Where to Set | Description |
|----------|------|----------|--------------|-------------|
| `VITE_STRIPE_RETIREMENT_YEARLY` | Plain Text | No | Cloudflare (Text) | Retirement Calculator yearly |

**Source File**: `src/services/retirementCalculator.ts:64`

### Influencer Transparency Feature

| Variable | Type | Required | Where to Set | Description |
|----------|------|----------|--------------|-------------|
| `VITE_STRIPE_INFLUENCER_TRANSPARENCY_MONTHLY` | Plain Text | No | Cloudflare (Text) | Influencer Transparency monthly |
| `VITE_STRIPE_INFLUENCER_TRANSPARENCY_YEARLY` | Plain Text | No | Cloudflare (Text) | Influencer Transparency yearly |
| `VITE_STRIPE_INFLUENCER_BADGE` | Plain Text | No | Cloudflare (Text) | Influencer Badge feature |

**Source File**: `src/services/subscriptionLimits.ts:769-787`

### NFT Portfolio Feature

| Variable | Type | Required | Where to Set | Description |
|----------|------|----------|--------------|-------------|
| `VITE_STRIPE_NFT_PORTFOLIO_MONTHLY` | Plain Text | No | Cloudflare (Text) | NFT Portfolio Tracker monthly |
| `VITE_STRIPE_NFT_PORTFOLIO_YEARLY` | Plain Text | No | Cloudflare (Text) | NFT Portfolio Tracker yearly |

**Source File**: `src/services/subscriptionLimits.ts:818-819`

### Copy Trading Feature

| Variable | Type | Required | Where to Set | Description |
|----------|------|----------|--------------|-------------|
| `VITE_STRIPE_COPY_TRADING` | Plain Text | No | Cloudflare (Text) | Copy Trading feature price ID |

**Source File**: `src/services/subscriptionLimits.ts:857`

### On-Chain Pro Analytics

| Variable | Type | Required | Where to Set | Description |
|----------|------|----------|--------------|-------------|
| `VITE_STRIPE_ONCHAIN_PRO_MONTHLY` | Plain Text | No | Cloudflare (Text) | On-Chain Pro monthly |
| `VITE_STRIPE_ONCHAIN_PRO_YEARLY` | Plain Text | No | Cloudflare (Text) | On-Chain Pro yearly |

**Source File**: `src/services/subscriptionLimits.ts:922-923`

### Multi-Exchange Feature

| Variable | Type | Required | Where to Set | Description |
|----------|------|----------|--------------|-------------|
| `VITE_STRIPE_MULTI_EXCHANGE_MONTHLY` | Plain Text | No | Cloudflare (Text) | Multi-Exchange monthly |
| `VITE_STRIPE_MULTI_EXCHANGE_YEARLY` | Plain Text | No | Cloudflare (Text) | Multi-Exchange yearly |

**Source File**: `src/services/subscriptionLimits.ts:1236-1237`

### Staking Calculator Feature

| Variable | Type | Required | Where to Set | Description |
|----------|------|----------|--------------|-------------|
| `VITE_STRIPE_STAKING_CALC_MONTHLY` | Plain Text | No | Cloudflare (Text) | Staking Calculator monthly |
| `VITE_STRIPE_STAKING_CALC_YEARLY` | Plain Text | No | Cloudflare (Text) | Staking Calculator yearly |

**Source File**: `src/services/subscriptionLimits.ts:1290-1291`

### Trading Indicators Feature

| Variable | Type | Required | Where to Set | Description |
|----------|------|----------|--------------|-------------|
| `VITE_STRIPE_TRADING_INDICATORS_MONTHLY` | Plain Text | No | Cloudflare (Text) | Trading Indicators monthly |
| `VITE_STRIPE_TRADING_INDICATORS_YEARLY` | Plain Text | No | Cloudflare (Text) | Trading Indicators yearly |

**Source File**: `src/services/subscriptionLimits.ts:1345-1346`

### Whale Tracking Feature

| Variable | Type | Required | Where to Set | Description |
|----------|------|----------|--------------|-------------|
| `VITE_STRIPE_WHALE_TRACKING_MONTHLY` | Plain Text | No | Cloudflare (Text) | Whale Tracking monthly |
| `VITE_STRIPE_WHALE_TRACKING_YEARLY` | Plain Text | No | Cloudflare (Text) | Whale Tracking yearly |

**Source File**: `src/services/subscriptionLimits.ts:1400-1401`

### Portfolio Rebalancing Feature

| Variable | Type | Required | Where to Set | Description |
|----------|------|----------|--------------|-------------|
| `VITE_STRIPE_REBALANCING_MONTHLY` | Plain Text | No | Cloudflare (Text) | Portfolio Rebalancing monthly |
| `VITE_STRIPE_REBALANCING_YEARLY` | Plain Text | No | Cloudflare (Text) | Portfolio Rebalancing yearly |

**Source File**: `src/services/subscriptionLimits.ts:1455-1456`

### DCA (Dollar Cost Averaging) Feature

| Variable | Type | Required | Where to Set | Description |
|----------|------|----------|--------------|-------------|
| `VITE_STRIPE_DCA_BASIC_MONTHLY` | Plain Text | No | Cloudflare (Text) | DCA Basic monthly |
| `VITE_STRIPE_DCA_PREMIUM_MONTHLY` | Plain Text | No | Cloudflare (Text) | DCA Premium monthly |

**Source File**: `src/services/subscriptionLimits.ts:1526-1527`

---

## Web3 & Blockchain Variables

| Variable | Type | Required | Where to Set | Description |
|----------|------|----------|--------------|-------------|
| `VITE_ALCHEMY_API_KEY` | Sensitive | Yes | Cloudflare (Text) | Alchemy SDK API key for Ethereum/Polygon RPC |
| `VITE_WALLETCONNECT_PROJECT_ID` | Plain Text | Yes | Cloudflare (Text) | WalletConnect Cloud project ID |

**Source Files**:
- `src/lib/wagmi.ts:6-7` - Alchemy and WalletConnect
- `src/services/alchemy.ts:3` - Alchemy SDK initialization

**Notes**:
- `VITE_ALCHEMY_API_KEY` is used client-side but should be treated as sensitive (can identify usage)
- Get Alchemy key from: https://dashboard.alchemy.com/
- Get WalletConnect ID from: https://cloud.walletconnect.com/

---

## Affiliate Variables

| Variable | Type | Required | Where to Set | Description |
|----------|------|----------|--------------|-------------|
| `VITE_COINBASE_AFFILIATE_ID` | Plain Text | No | Cloudflare (Text) | Coinbase affiliate tracking ID |
| `VITE_KRAKEN_AFFILIATE_ID` | Plain Text | No | Cloudflare (Text) | Kraken affiliate tracking ID |
| `VITE_BINANCE_AFFILIATE_ID` | Plain Text | No | Cloudflare (Text) | Binance affiliate tracking ID |
| `VITE_LEDGER_AFFILIATE_ID` | Plain Text | No | Cloudflare (Text) | Ledger affiliate tracking ID |
| `VITE_TREZOR_AFFILIATE_ID` | Plain Text | No | Cloudflare (Text) | Trezor affiliate tracking ID |
| `VITE_COINTRACKER_AFFILIATE_ID` | Plain Text | No | Cloudflare (Text) | CoinTracker affiliate tracking ID |
| `VITE_KOINLY_AFFILIATE_ID` | Plain Text | No | Cloudflare (Text) | Koinly affiliate tracking ID |

**Source File**: `src/services/affiliate.ts:17-83`

---

## Email & Notifications Variables

### Frontend Email Configuration

| Variable | Type | Required | Where to Set | Description |
|----------|------|----------|--------------|-------------|
| `VITE_FROM_EMAIL` | Plain Text | No | Cloudflare (Text) | Default "from" email address for outgoing emails |
| `VITE_VAPID_PUBLIC_KEY` | Plain Text | No | Cloudflare (Text) | Web Push VAPID public key for push notifications |

**Source Files**:
- `src/services/email.ts:18` - From email
- `src/services/pushNotifications.ts:46` - VAPID key

---

## Supabase Edge Function Variables

These variables are set in **Supabase Dashboard** under:
`Project Settings > Edge Functions > Secrets`

### Amazon SES SMTP Configuration

| Variable | Type | Required | Where to Set | Description |
|----------|------|----------|--------------|-------------|
| `AMAZON_SMTP_USER_NAME` | Secret | Yes | Supabase Secrets | Amazon SES SMTP username |
| `AMAZON_SMTP_PASSWORD` | Secret | Yes | Supabase Secrets | Amazon SES SMTP password |
| `AMAZON_SMTP_ENDPOINT` | Plain Text | No | Supabase Secrets | SES endpoint (default: `email-smtp.us-east-1.amazonaws.com`) |
| `AMAZON_SMTP_PORT` | Plain Text | No | Supabase Secrets | SMTP port (default: `587`) |

**Source File**: `supabase/functions/send-email/index.ts:44-47`

**Setup Instructions**:
1. Go to AWS Console > SES > SMTP Settings
2. Create SMTP credentials
3. Verify your domain/email in SES
4. Add credentials to Supabase Edge Function secrets

---

## Where to Set Each Variable

### Cloudflare Pages Dashboard (Production)

**Path**: Cloudflare Dashboard > Workers & Pages > [Project] > Settings > Environment Variables

#### Text Type Variables (Build-time + Publicly Visible)
All `VITE_*` variables should be set as **Text** (NOT Secret):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_STRIPE_PRICE_*` (all price IDs)
- `VITE_ALCHEMY_API_KEY`
- `VITE_WALLETCONNECT_PROJECT_ID`
- `VITE_*_AFFILIATE_ID` (all affiliate IDs)
- `VITE_FROM_EMAIL`
- `VITE_VAPID_PUBLIC_KEY`

#### Secret Type Variables (Runtime-only + Private)
Non-`VITE_` variables should be set as **Secret** (Encrypted):
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

### Supabase Dashboard (Edge Functions)

**Path**: Supabase Dashboard > [Project] > Project Settings > Edge Functions > Secrets

- `AMAZON_SMTP_USER_NAME`
- `AMAZON_SMTP_PASSWORD`
- `AMAZON_SMTP_ENDPOINT` (optional)
- `AMAZON_SMTP_PORT` (optional)

### Local Development Files

#### `.env.local` (Vite Development)
```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_STRIPE_PRICE_MONTHLY=price_xxxxx
# ... other VITE_* variables
```

#### `.dev.vars` (Cloudflare Wrangler)
```bash
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_URL=https://xxxxx.supabase.co
# ... other variables needed by functions
```

---

## Security Classification

### CONFIDENTIAL (Never Expose to Client)
These should ONLY be set in backend environments:

| Variable | Risk Level | Notes |
|----------|------------|-------|
| `STRIPE_SECRET_KEY` | Critical | Full access to Stripe account |
| `STRIPE_WEBHOOK_SECRET` | Critical | Validates webhook authenticity |
| `SUPABASE_SERVICE_ROLE_KEY` | Critical | Bypasses all RLS policies |
| `AMAZON_SMTP_USER_NAME` | High | Email sending access |
| `AMAZON_SMTP_PASSWORD` | High | Email sending access |

### SENSITIVE (Handle with Care)
These are client-visible but should be monitored:

| Variable | Risk Level | Notes |
|----------|------------|-------|
| `VITE_ALCHEMY_API_KEY` | Medium | Can be rate-limited, reveals usage patterns |

### PUBLIC (Safe to Expose)
These are designed to be public:

| Variable | Notes |
|----------|-------|
| `VITE_SUPABASE_URL` | Public by design |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public anon key with RLS protection |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Public by design |
| `VITE_STRIPE_PRICE_*` | Price IDs are not secret |
| `VITE_WALLETCONNECT_PROJECT_ID` | Public project identifier |
| `VITE_*_AFFILIATE_ID` | Public tracking identifiers |
| `VITE_FROM_EMAIL` | Public email address |
| `VITE_VAPID_PUBLIC_KEY` | Public key (private key not used) |

---

## Validation Checklist

### Before Deploying to Production

#### Required Variables
- [ ] `VITE_SUPABASE_URL` is set (Text type)
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` is set (Text type)
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` is set (Text type, use `pk_live_*` for production)
- [ ] `VITE_STRIPE_PRICE_MONTHLY` is set (Text type)
- [ ] `VITE_STRIPE_PRICE_ANNUAL` is set (Text type)
- [ ] `STRIPE_SECRET_KEY` is set (Secret type, use `sk_live_*` for production)
- [ ] `STRIPE_WEBHOOK_SECRET` is set (Secret type)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set (Secret type)

#### Optional But Recommended
- [ ] `VITE_ALCHEMY_API_KEY` is set (for Web3 features)
- [ ] `VITE_WALLETCONNECT_PROJECT_ID` is set (for wallet connections)
- [ ] All `VITE_STRIPE_PRICE_*` for enabled features are set

#### Supabase Edge Functions (If Using Email)
- [ ] `AMAZON_SMTP_USER_NAME` is set in Supabase Secrets
- [ ] `AMAZON_SMTP_PASSWORD` is set in Supabase Secrets
- [ ] Domain/email verified in Amazon SES

### Security Verification
- [ ] All `VITE_*` variables are set as **Text** (not Secret) in Cloudflare
- [ ] All non-`VITE_*` secrets are set as **Secret** (Encrypted) in Cloudflare
- [ ] No secret keys appear in frontend code or browser console
- [ ] Production uses live keys (`pk_live_*`, `sk_live_*`) not test keys

### After Deployment
- [ ] Frontend loads without "undefined" errors
- [ ] Stripe checkout works correctly
- [ ] Authentication works (Supabase connection)
- [ ] Web3 wallet connection works (if enabled)
- [ ] Email sending works (if enabled)

---

## Troubleshooting

### "VITE_* is undefined" Error
1. Variable is not set in Cloudflare Dashboard
2. Variable is set as **Secret** instead of **Text**
3. Variable is set in wrong environment (Preview vs Production)
4. Need to trigger a new deployment after adding variable

### "stripe is not defined" Error
1. `VITE_STRIPE_PUBLISHABLE_KEY` is missing or empty
2. Stripe script failed to load (check network tab)

### "supabase" Connection Failed
1. `VITE_SUPABASE_URL` is incorrect
2. `VITE_SUPABASE_PUBLISHABLE_KEY` is missing

### Webhook Signature Verification Failed
1. `STRIPE_WEBHOOK_SECRET` doesn't match Stripe Dashboard
2. Using wrong webhook secret for environment (test vs live)

### Email Sending Failed
1. Check Supabase Edge Function logs
2. Verify SMTP credentials in Supabase Secrets
3. Ensure email/domain is verified in Amazon SES

---

## Quick Copy Template

### .env.local (Local Development)
```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
VITE_SUPABASE_PROJECT_ID=your-project-id

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_STRIPE_PRICE_MONTHLY=price_xxxxx
VITE_STRIPE_PRICE_ANNUAL=price_xxxxx
VITE_STRIPE_PRICE_LIFETIME=price_xxxxx
VITE_STRIPE_PRICE_ADVISOR=price_xxxxx
VITE_STRIPE_PRICE_ENTERPRISE=price_xxxxx

# Web3
VITE_ALCHEMY_API_KEY=xxxxx
VITE_WALLETCONNECT_PROJECT_ID=xxxxx

# Optional: Affiliates
VITE_COINBASE_AFFILIATE_ID=
VITE_KRAKEN_AFFILIATE_ID=
VITE_BINANCE_AFFILIATE_ID=
VITE_LEDGER_AFFILIATE_ID=
VITE_TREZOR_AFFILIATE_ID=
VITE_COINTRACKER_AFFILIATE_ID=
VITE_KOINLY_AFFILIATE_ID=

# Optional: Email
VITE_FROM_EMAIL=noreply@yourdomain.com
VITE_VAPID_PUBLIC_KEY=
```

### .dev.vars (Cloudflare Wrangler Local)
```bash
# Backend Secrets
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# Also include VITE_* for functions that need them
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_STRIPE_PRICE_MONTHLY=price_xxxxx
VITE_STRIPE_PRICE_ANNUAL=price_xxxxx
```

---

**Last Updated**: 2025-12-27
