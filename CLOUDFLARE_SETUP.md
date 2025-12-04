# 🚀 Quick Start: Cloudflare Pages Deployment

This is a **quick reference** for deploying your Bitcoin Investments platform to Cloudflare Pages.

For detailed instructions, see: `docs/CLOUDFLARE_ENV_SETUP.md`

## ⚡ Prerequisites

- GitHub repository connected to Cloudflare Pages
- Supabase project created
- Stripe account (optional for testing)

## 📋 Required Environment Variables

Go to **Cloudflare Dashboard → Workers & Pages → bitcoin-investments → Settings → Environment Variables**

### Set These Variables for Production:

| Variable Name | Type | Example Value | Where to Get It |
|--------------|------|---------------|-----------------|
| `VITE_SUPABASE_URL` | **Text** | `https://xxx.supabase.co` | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **Text** | `eyJhbGc...` | Supabase Dashboard → Settings → API → anon/public key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | **Text** | `pk_test_xxx` or `pk_live_xxx` | Stripe Dashboard → Developers → API Keys |
| `VITE_STRIPE_PRICE_MONTHLY` | **Text** | `price_xxx` | Stripe Dashboard → Products → Monthly product → Price ID |
| `VITE_STRIPE_PRICE_ANNUAL` | **Text** | `price_xxx` | Stripe Dashboard → Products → Annual product → Price ID |
| `STRIPE_SECRET_KEY` | **Secret** ⚠️ | `sk_test_xxx` or `sk_live_xxx` | Stripe Dashboard → Developers → API Keys (secret) |
| `STRIPE_WEBHOOK_SECRET` | **Secret** ⚠️ | `whsec_xxx` | Stripe Dashboard → Developers → Webhooks → Signing secret |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** ⚠️ | `eyJhbGc...` | Supabase Dashboard → Settings → API → service_role key |

## ⚠️ CRITICAL: Variable Types

- **Frontend variables** (`VITE_*`): Type = **Text** (NOT Secret!)
  - These must be readable at build time
  - If marked as Secret, the build will fail

- **Backend secrets**: Type = **Secret** (Click "Encrypt")
  - Only used by API functions at runtime
  - Should never be exposed to frontend

## 🔧 Step-by-Step Setup

### 1. Add Variables in Cloudflare Dashboard

```
1. Go to Cloudflare Dashboard
2. Click "Workers & Pages"
3. Select your project
4. Click "Settings" tab
5. Scroll to "Environment variables"
6. Click "Add variables"
7. For each variable:
   - Enter Variable name
   - Enter Value
   - Select Type (Text or Secret)
   - Select Environment: Production
   - Click "Save"
```

### 2. Trigger New Deployment

After adding all variables, trigger a new deployment:

**Option A: Push a commit**
```bash
git commit --allow-empty -m "Trigger rebuild"
git push origin main
```

**Option B: Retry in dashboard**
```
1. Go to "Deployments" tab
2. Click "Retry deployment" on latest build
```

### 3. Verify Variables Are Working

Check the build logs:
```
✓ VITE_SUPABASE_URL: https://xxx.supabase.co
✓ Build completed successfully
```

Visit your site and check browser console:
```
✓ Supabase configured
✗ No "environment variables not set" errors
```

## 🐛 Troubleshooting

### Error: "Supabase environment variables not set"

**Cause:** Variables not set in Cloudflare Dashboard or set incorrectly

**Fix:**
1. ✅ Verify variables are set for **Production** environment
2. ✅ Verify `VITE_*` variables are type **Text** (not Secret)
3. ✅ Check spelling exactly matches (case-sensitive)
4. ✅ Trigger new deployment after adding variables

### Error: "supabaseUrl is required"

**Cause:** `VITE_SUPABASE_URL` is empty or undefined

**Fix:**
1. Set `VITE_SUPABASE_URL` in Cloudflare Dashboard
2. Make sure it's type **Text**
3. Value should be: `https://your-project.supabase.co`
4. Redeploy after setting

### Error: "Binding name 'VITE_SUPABASE_URL' already in use"

**Cause:** Variable defined in both `wrangler.toml` and Dashboard

**Fix:**
1. Remove `[vars]` section from `wrangler.toml`
2. Only set variables in Cloudflare Dashboard
3. Already fixed in latest version

## 📚 Additional Resources

- **Detailed Setup Guide**: `docs/CLOUDFLARE_ENV_SETUP.md`
- **Backend API Setup**: `docs/BACKEND_SETUP.md`
- **Stripe Integration**: `docs/STRIPE_SETUP.md`
- **Email Setup**: `docs/EMAIL_SETUP.md`

## ✅ Deployment Checklist

Before going live:

- [ ] All 8 environment variables set in Cloudflare Dashboard
- [ ] `VITE_*` variables are type **Text**
- [ ] Backend secrets are type **Secret**
- [ ] Variables set for **Production** environment
- [ ] New deployment triggered after adding variables
- [ ] Build completed without errors
- [ ] Site loads without console errors
- [ ] Can sign up/login (tests Supabase)
- [ ] Dashboard shows live prices (tests APIs)

## 🎯 Quick Test

After deployment, test these features:

1. **Homepage loads** ✅
2. **Sign up works** → Tests Supabase
3. **Dashboard shows prices** → Tests CoinGecko API
4. **Can add portfolio holding** → Tests Supabase database

If all work, you're live! 🎉

## 🆘 Still Having Issues?

1. Check build logs in Cloudflare Dashboard
2. Check browser console for errors
3. Verify all variables are set correctly
4. Read `docs/CLOUDFLARE_ENV_SETUP.md` for detailed troubleshooting
5. Open an issue with error logs

---

**Note:** This is a quick reference. For detailed explanations and advanced configuration, see the docs in the `docs/` folder.
