# Cloudflare Environment Variables & Secrets Setup

## 🔐 Understanding Cloudflare Variables vs Secrets

### **Variables** (Public - Safe to commit)
These are **embedded in your frontend bundle** and visible to users:
- `VITE_SUPABASE_URL` ✅
- `VITE_SUPABASE_PUBLISHABLE_KEY` ✅  
- `VITE_STRIPE_PUBLISHABLE_KEY` ✅
- `VITE_WALLETCONNECT_PROJECT_ID` ✅

These are **meant to be public** and are safe in `wrangler.toml`.

### **Secrets** (Private - NEVER commit)
These should **ONLY** be in Cloudflare Dashboard as encrypted secrets:
- `VITE_COINGECKO_API_KEY` 🔒
- `VITE_CRYPTOCOMPARE_API_KEY` 🔒
- `VITE_ALCHEMY_API_KEY` 🔒
- `VITE_RESEND_API_KEY` 🔒
- `STRIPE_SECRET_KEY` 🔒
- `STRIPE_WEBHOOK_SECRET` 🔒
- `SUPABASE_SERVICE_ROLE_KEY` 🔒

---

## ✅ Current Status

Your `wrangler.toml` is now clean:
- ✅ Public keys are in `wrangler.toml`
- ✅ Secret API keys removed from `wrangler.toml`
- ✅ Empty placeholders (`""`) for optional keys

---

## 📝 How to Add Secrets to Cloudflare

### Step 1: Go to Cloudflare Dashboard

1. Navigate to: https://dash.cloudflare.com/
2. Select **Pages** from the left sidebar
3. Click on your **bitcoinvestments** project
4. Go to **Settings** → **Environment variables**

### Step 2: Add Production Variables

Click **"Add variables"** and add these as **encrypted secrets**:

#### Required for Full Functionality:

**CoinGecko API Key** (for higher rate limits)
```
Variable name: VITE_COINGECKO_API_KEY
Value: [Your CoinGecko API key]
Type: Encrypted ✅
```

**CryptoCompare API Key** (for news feed)
```
Variable name: VITE_CRYPTOCOMPARE_API_KEY
Value: [Your CryptoCompare API key]
Type: Encrypted ✅
```

**Alchemy API Key** (for advanced Web3 features)
```
Variable name: VITE_ALCHEMY_API_KEY
Value: [Your Alchemy API key]
Type: Encrypted ✅
```

**Resend API Key** (for email notifications)
```
Variable name: VITE_RESEND_API_KEY
Value: [Your Resend API key]
Type: Encrypted ✅
```

**From Email Address**
```
Variable name: VITE_FROM_EMAIL
Value: noreply@yourdomain.com
Type: Encrypted ✅
```

#### Backend Secrets (for Workers/Functions):

**Stripe Secret Key**
```
Variable name: STRIPE_SECRET_KEY
Value: sk_test_xxxxx (or sk_live_xxxxx for production)
Type: Encrypted ✅
```

**Stripe Webhook Secret**
```
Variable name: STRIPE_WEBHOOK_SECRET
Value: whsec_xxxxx
Type: Encrypted ✅
```

**Supabase Service Role Key**
```
Variable name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGc... (from Supabase dashboard)
Type: Encrypted ✅
```

### Step 3: Add Preview/Development Variables (Optional)

For preview deployments, you can add the same variables under the **Preview** tab if you want them available for testing branches.

---

## 🔄 What Happens After Adding Secrets

1. **Cloudflare will trigger a new deployment** automatically
2. The build logs will show `VITE_COINGECKO_API_KEY: [secure]` (value hidden)
3. Your app will have access to these variables at runtime
4. The values are **never exposed** in the browser or build output

---

## 🧹 Cleaning Up Old Variables

### Problem: Variables inherited from `wrangler.toml` showing as plaintext

**This happens when:**
- Variables were previously in `wrangler.toml`
- You removed them from the file
- But Cloudflare still has them cached from earlier deployments

### Solution:

1. **Go to**: Cloudflare Dashboard → Pages → bitcoinvestments → Settings → Environment variables

2. **Delete old plaintext variables**:
   - Find `VITE_COINGECKO_API_KEY` (if showing as plaintext)
   - Click **"Edit"**
   - Click **"Delete"**
   - Repeat for `VITE_CRYPTOCOMPARE_API_KEY` and `VITE_ALCHEMY_API_KEY`

3. **Re-add as encrypted secrets** (see Step 2 above)

4. **Redeploy** (automatically triggers after saving changes)

---

## ✅ Verification Checklist

After setting up secrets, verify:

### In Cloudflare Dashboard:
- [ ] All API keys show as **"Encrypted"** type (not plaintext)
- [ ] Build logs show `[secure]` for secret values
- [ ] No API keys visible in plaintext in dashboard

### In Your App:
- [ ] CoinGecko API calls work without 429 errors
- [ ] News feed loads articles (CryptoCompare)
- [ ] Wallet connections work (Alchemy)
- [ ] Email notifications send (Resend)
- [ ] Stripe checkout works

### In Git Repository:
- [ ] No API keys in `wrangler.toml`
- [ ] No API keys in any committed files
- [ ] `.env` file is in `.gitignore`

---

## 🚨 Security Best Practices

### ✅ DO:
- Store secrets **only** in Cloudflare Dashboard (encrypted)
- Use placeholder values (`""` or `xxxxx`) in `wrangler.toml`
- Keep public keys (Supabase, Stripe publishable, WalletConnect) in `wrangler.toml`
- Add secrets separately for Production and Preview environments

### ❌ DON'T:
- **Never** commit API keys to Git
- **Never** store secrets in `wrangler.toml` vars section
- **Never** store secrets in frontend `.env` files that get committed
- **Never** log secret values in your code

---

## 🔍 How to Get API Keys

### CoinGecko API Key
1. Go to: https://www.coingecko.com/en/api
2. Sign up for a free account
3. Get your API key from dashboard
4. **Free tier**: 10-30 calls/minute (sufficient for most use)

### CryptoCompare API Key
1. Go to: https://min-api.cryptocompare.com/
2. Sign up for a free account
3. Get your API key
4. **Free tier**: 100,000 calls/month

### Alchemy API Key
1. Go to: https://www.alchemy.com/
2. Sign up for a free account
3. Create a new app
4. Copy the API key
5. **Free tier**: 300M compute units/month

### Resend API Key
1. Go to: https://resend.com/
2. Sign up for a free account
3. Add and verify your domain (or use resend.dev for testing)
4. Create an API key
5. **Free tier**: 3,000 emails/month

---

## 🐛 Troubleshooting

### Variables not taking effect?

1. **Check Environment**: Make sure you added variables to the correct environment (Production/Preview)
2. **Redeploy**: Trigger a new deployment (push a commit or redeploy from dashboard)
3. **Clear Cache**: In Cloudflare → Pages → Deployments → Manage build → "Clear build cache"

### Still seeing old values?

1. **Delete ALL environment variables** in Cloudflare dashboard
2. **Wait 1 minute**
3. **Re-add only the correct ones** as encrypted secrets
4. **Trigger new deployment**

### API calls still failing?

1. **Check API key validity**: Test keys directly in API provider's dashboard
2. **Check rate limits**: Free tiers have limits (CoinGecko: 10-30 req/min)
3. **Check browser console**: Look for specific error messages
4. **Verify key names**: Must exactly match `VITE_COINGECKO_API_KEY` (case-sensitive)

---

## 📊 Summary

| Variable | Type | Location | Committed? |
|----------|------|----------|------------|
| `VITE_SUPABASE_URL` | Public | `wrangler.toml` | ✅ Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public | `wrangler.toml` | ✅ Yes |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Public | `wrangler.toml` | ✅ Yes |
| `VITE_WALLETCONNECT_PROJECT_ID` | Public | `wrangler.toml` | ✅ Yes |
| `VITE_COINGECKO_API_KEY` | Secret | Cloudflare Dashboard | ❌ No |
| `VITE_CRYPTOCOMPARE_API_KEY` | Secret | Cloudflare Dashboard | ❌ No |
| `VITE_ALCHEMY_API_KEY` | Secret | Cloudflare Dashboard | ❌ No |
| `VITE_RESEND_API_KEY` | Secret | Cloudflare Dashboard | ❌ No |
| `STRIPE_SECRET_KEY` | Secret | Cloudflare Dashboard | ❌ No |
| `STRIPE_WEBHOOK_SECRET` | Secret | Cloudflare Dashboard | ❌ No |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Cloudflare Dashboard | ❌ No |

---

## ✅ Final Checklist

- [ ] All secret API keys removed from `wrangler.toml`
- [ ] All secret API keys added to Cloudflare Dashboard as encrypted
- [ ] Old plaintext variables deleted from Cloudflare
- [ ] New deployment triggered and successful
- [ ] App tested and all features working
- [ ] No secrets visible in build logs (showing `[secure]`)
- [ ] `.env` file in `.gitignore`
- [ ] No API keys in any committed files

---

**Status**: ✅ **Your configuration is secure!**

The latest commit has removed all secret API keys from `wrangler.toml`. Add them to the Cloudflare Dashboard as encrypted secrets, and you're all set! 🚀

