# CoinGecko API Configuration Guide

## 🐛 Problem Fixed

### Errors You Were Seeing:
```
pro-api.coingecko.com/api/v3/...: 400 (Bad Request)
Access-Control-Allow-Origin header is present (CORS errors)
Error fetching price for ethereum/matic-network/etc.
```

### Root Cause:
The code was trying to use `pro-api.coingecko.com` without a valid paid API key, causing 400 errors.

---

## ✅ Solution Implemented

### Default Behavior (FREE API):
- Uses `api.coingecko.com` (free endpoint)
- No API key required
- Rate limits: 10-30 calls/minute
- **CORS issues**: Some endpoints blocked from browser
- **Status**: Works for most features, some errors in console (non-breaking)

### Optional (PAID API):
- Uses `pro-api.coingecko.com`
- Requires paid CoinGecko plan ($129+/month)
- Much higher rate limits
- **Only enable if you have a PAID plan**

---

## 📝 Configuration Options

### Option 1: FREE API (Default) ✅ **RECOMMENDED**

**No configuration needed!**

The app now defaults to the free API which works for most features.

**Pros**:
- ✅ Free
- ✅ No setup needed
- ✅ Works for most features

**Cons**:
- ⚠️ Some CORS errors in console (non-breaking)
- ⚠️ Rate limits (10-30 req/min)
- ⚠️ Gas price USD conversion may fail

**Console errors you'll see** (can be ignored):
```
Access-Control-Allow-Origin header is present
Error fetching price for matic-network
```

These are **non-critical** and won't break your app.

---

### Option 2: DEMO API Key (Still Free)

CoinGecko offers demo API keys for free accounts, but they still use the same free endpoint.

**How to add**:

1. **Get demo key**: https://www.coingecko.com/en/api → Sign up (free)

2. **Add to Cloudflare**: Dashboard → Pages → bitcoinvestments → Settings → Environment variables
   ```
   Name: VITE_COINGECKO_API_KEY
   Value: CG-[your-demo-key]
   Type: Encrypted
   ```

3. **Don't enable PRO mode** (leave `VITE_COINGECKO_USE_PRO` unset)

**Result**:
- Still uses `api.coingecko.com` (free endpoint)
- Slightly higher rate limits
- May reduce some 429 errors
- **CORS issues still present**

---

### Option 3: PAID API (Pro/Expert Plan)

**Only for paid CoinGecko plans** ($129-$499/month)

**Setup**:

1. **Subscribe to paid plan**: https://www.coingecko.com/en/api/pricing

2. **Add API key to Cloudflare**:
   ```
   Name: VITE_COINGECKO_API_KEY
   Value: CG-[your-paid-key]
   Type: Encrypted
   ```

3. **Enable PRO mode**:
   ```
   Name: VITE_COINGECKO_USE_PRO
   Value: true
   Type: Plain text
   ```

4. **Redeploy**

**Result**:
- Uses `pro-api.coingecko.com`
- Much higher rate limits
- **No CORS issues** (pro API allows browser access)
- All features work perfectly

---

## 🎯 **RECOMMENDED SETUP**

### For Most Users:

**DO**:
- ✅ Use default configuration (no API key)
- ✅ Ignore console CORS errors (they're handled gracefully)
- ✅ Let the app use cached data when APIs fail

**DON'T**:
- ❌ Don't add demo API key (won't help with CORS)
- ❌ Don't enable `VITE_COINGECKO_USE_PRO` unless you have a paid plan
- ❌ Don't worry about console errors - they're non-critical

### For Power Users:

**Option A** - Free with caching:
```bash
# No env vars needed - just use defaults
```

**Option B** - Paid plan (if you need guaranteed uptime):
```bash
VITE_COINGECKO_API_KEY=CG-your-paid-key
VITE_COINGECKO_USE_PRO=true
```

---

## 🧪 Testing

### Check Current Configuration:

Open browser console on your site and run:
```javascript
// Check which endpoint is being used
fetch('https://api.coingecko.com/api/v3/ping')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**Expected with free API**:
```json
{
  "gecko_says": "(V3) To the Moon!"
}
```

### Check for CORS Errors:

These are **expected and handled**:
```
Access-Control-Allow-Origin header is present
TypeError: Failed to fetch
```

The app will:
1. Use cached data
2. Show fallback values
3. Retry later
4. Continue working normally

---

## 🔧 Environment Variables Reference

| Variable | Purpose | Values | Required |
|----------|---------|--------|----------|
| `VITE_COINGECKO_API_KEY` | Your API key | `CG-xxxxx` | No |
| `VITE_COINGECKO_USE_PRO` | Use pro endpoint | `true` / unset | No |

### Examples:

**Free API (default)**:
```bash
# No variables needed
```

**Free API with demo key**:
```bash
VITE_COINGECKO_API_KEY=CG-demo-key-here
# VITE_COINGECKO_USE_PRO is NOT set
```

**Paid API**:
```bash
VITE_COINGECKO_API_KEY=CG-paid-key-here
VITE_COINGECKO_USE_PRO=true
```

---

## 📊 Feature Impact

| Feature | Free API | Demo Key | Paid API |
|---------|----------|----------|----------|
| Price charts | ✅ Works (with cache) | ✅ Better | ✅ Perfect |
| Portfolio prices | ✅ Works | ✅ Works | ✅ Perfect |
| Market data | ✅ Works (with cache) | ✅ Better | ✅ Perfect |
| Gas prices (USD) | ⚠️ May fail (CORS) | ⚠️ May fail | ✅ Works |
| Trending coins | ✅ Works | ✅ Works | ✅ Perfect |
| News feed | ✅ Works | ✅ Works | ✅ Perfect |

**Key**: 
- ✅ Works = Fully functional
- ⚠️ May fail = Works with fallbacks/cache
- ✅ Perfect = No errors, fastest performance

---

## 🐛 Troubleshooting

### Still seeing 400 errors after deployment?

**Check**:
1. Clear browser cache (`Ctrl + Shift + R`)
2. Wait 2-3 minutes for Cloudflare rebuild
3. Verify you don't have `VITE_COINGECKO_USE_PRO=true` set (unless you have paid plan)

### Gas prices showing $0?

This is **expected** with free API due to CORS. The gas prices in Gwei still work, just not the USD conversion.

**Solutions**:
1. Ignore it (non-critical feature)
2. Add a paid CoinGecko API key
3. Wait for cached price data to populate

### Charts not loading?

**If you see**: `CoinGecko API error: 400`

**Fix**:
1. Remove `VITE_COINGECKO_USE_PRO` from Cloudflare
2. Save (triggers redeploy)
3. Wait for build to finish
4. Hard refresh browser

---

## ✅ Current Status (After This Fix)

### ✅ Fixed:
- 400 errors from pro-api endpoint
- Excessive console spam
- App breaking due to API errors

### ⚠️ Expected Behavior:
- Some CORS errors in console (handled gracefully)
- Gas price USD conversion may fail (Gwei still works)
- Occasional rate limit warnings (cached data used)

### 🎯 Result:
- App works smoothly
- All critical features functional
- Non-critical errors suppressed

---

## 📚 Additional Resources

- **CoinGecko API Docs**: https://www.coingecko.com/en/api/documentation
- **CoinGecko Pricing**: https://www.coingecko.com/en/api/pricing
- **Rate Limits**: https://support.coingecko.com/hc/en-us/articles/21880397454233-User-Free-Plan-Rate-Limits

---

## 🎉 Summary

**What changed**:
- ✅ Default to free API endpoint
- ✅ Only use pro API if explicitly enabled
- ✅ Silent non-critical errors
- ✅ Better caching and fallbacks

**What to do**:
- 🎯 **Nothing!** Default configuration works
- 📊 Ignore CORS console errors (handled automatically)
- 💰 Optional: Add paid API key for perfect experience

**Deployment**: `fb1b357`
```
fix: Resolve CoinGecko API errors and reduce console noise
```

---

**Your app should now work smoothly with minimal console errors!** 🚀

