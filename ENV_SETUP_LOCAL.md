# Local Development Environment Setup

## Create .env File

Create a file named `.env` in the root directory with the following variables:

```env
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# Stripe Configuration (Optional - for premium features)
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_STRIPE_PRICE_MONTHLY=price_xxx
VITE_STRIPE_PRICE_ANNUAL=price_xxx

# API Keys (Optional - for enhanced features)
VITE_COINGECKO_API_KEY=your_coingecko_api_key
VITE_CRYPTOCOMPARE_API_KEY=your_cryptocompare_api_key
VITE_RESEND_API_KEY=your_resend_api_key
VITE_FROM_EMAIL=noreply@yourdomain.com

# Web3 Configuration (Optional - for wallet features)
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
VITE_ALCHEMY_API_KEY=your_alchemy_api_key
```

## Getting Your Keys

### 1. Supabase (REQUIRED)
1. Go to https://supabase.com
2. Sign in or create an account
3. Create a new project (or use existing)
4. Go to Settings > API
5. Copy:
   - Project URL → `VITE_SUPABASE_URL`
   - anon/public key → `VITE_SUPABASE_PUBLISHABLE_KEY`

### 2. CoinGecko API (Optional - Free tier available)
1. Go to https://www.coingecko.com/en/api
2. Sign up for a free API key
3. Add to `VITE_COINGECKO_API_KEY`
4. Note: Many features work without this key using public endpoints

### 3. CryptoCompare API (Optional - For news features)
1. Go to https://min-api.cryptocompare.com/
2. Sign up for a free API key
3. Add to `VITE_CRYPTOCOMPARE_API_KEY`

### 4. Resend (Optional - For email features)
1. Go to https://resend.com
2. Sign up and verify your email
3. Get API key from dashboard
4. Add to `VITE_RESEND_API_KEY`

## Quick Start (Minimum Required)

For a basic working app, you only need Supabase:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The app will work with these minimal settings. Other features will be disabled until you add their respective API keys.

## After Creating .env

1. Save the `.env` file
2. Restart the dev server: `npm run dev`
3. The app should now load without errors

## Note

- Never commit `.env` to git (it's already in .gitignore)
- For production deployment, set these in Cloudflare Dashboard

