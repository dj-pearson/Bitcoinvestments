# How to Get a Free CoinGecko API Key

## 🚨 **Why You Need This**

**Current Issue**:
```
403 Forbidden
429 Too Many Requests
```

**Cause**: CoinGecko blocks server-to-server requests without an API key, even on their free tier.

**Solution**: Get a **FREE demo API key** (takes 2 minutes!)

---

## 📝 **Step 1: Sign Up for CoinGecko**

1. **Go to**: https://www.coingecko.com/en/api

2. **Click**: "Get Your Free API Key"

3. **Sign up** with:
   - Email address
   - Password
   - Name

4. **Verify email** (check inbox/spam)

---

## 🔑 **Step 2: Get Your API Key**

1. **Log in** to CoinGecko

2. **Go to**: https://www.coingecko.com/en/developers/dashboard

3. **Copy** your API key (starts with `CG-`)

**Example**:
```
CG-abc123def456ghi789
```

---

## ☁️ **Step 3: Add to Cloudflare**

### **Option A: Cloudflare Dashboard (Recommended)**

1. **Go to**: https://dash.cloudflare.com/

2. **Navigate to**: Pages → **bitcoinvestments** → **Settings** → **Environment variables**

3. **Click**: "Add variables"

4. **Add this**:
   ```
   Variable name: VITE_COINGECKO_API_KEY
   Value: [paste your CG-xxx key here]
   Environment: Production
   Type: Encrypted ✅
   ```

5. **Click**: "Save"

6. **Click**: "Redeploy" (triggers a new build)

---

### **Option B: Using Wrangler CLI**

```bash
# From your project directory
npx wrangler pages secret put VITE_COINGECKO_API_KEY --project-name=bitcoinvestments

# Paste your API key when prompted
# Press Enter
```

---

## ✅ **Step 4: Verify It Works**

### **Wait for Build**
- Cloudflare will rebuild (~2-3 minutes)
- Check: Dashboard → Pages → Deployments

### **Hard Refresh Browser**
```
Ctrl + Shift + R
```

### **Check Console**
Should now see:
- ✅ No 403/429 errors
- ✅ Data loading successfully
- ✅ Requests showing "X-Cache-Status: HIT" or "MISS"

---

## 📊 **Free Tier Limits**

CoinGecko's **free demo key** gives you:

- ✅ **30 calls/minute** (vs 10-15 without key)
- ✅ **10,000 calls/month** (plenty for your app)
- ✅ **Server-to-server allowed** (no more 403!)
- ✅ **All API endpoints**
- ✅ **Commercial use allowed**

**Cost**: $0 / month (forever free!)

---

## 🎯 **How Our Caching Helps**

With the new aggressive caching, your app will:

**Before** (without caching):
- 🔴 Every user = new API call
- 🔴 100 users = 100+ calls/minute
- 🔴 Rate limited quickly

**After** (with caching):
- ✅ First user = API call (cached 2-5 min)
- ✅ Next 99 users = serve from cache
- ✅ 100 users = ~5-10 calls/minute
- ✅ Well under limits

**Cache Durations**:
```
Coin prices:        60 seconds
Market data:        2 minutes
Historical charts:  5 minutes
Global stats:       5 minutes
Trending:           10 minutes
Coin list:          24 hours
```

---

## 🧪 **Testing Your Setup**

### **Test 1: Check API Key in Dashboard**

1. Go to CoinGecko Dashboard
2. Should see usage increasing after you add key
3. Usage should be minimal due to caching

### **Test 2: Check Cache Headers**

Open browser console:
```javascript
fetch('/api/coingecko/simple/price?ids=bitcoin&vs_currencies=usd')
  .then(r => {
    console.log('Status:', r.status);
    console.log('Cache:', r.headers.get('X-Cache-Status'));
    return r.json();
  })
  .then(console.log);
```

**Expected**:
```
Status: 200
Cache: MISS (first call) or HIT (subsequent calls)
{ bitcoin: { usd: 43250 } }
```

### **Test 3: Rapid Requests**

```javascript
// Make 10 rapid requests
for (let i = 0; i < 10; i++) {
  fetch('/api/coingecko/simple/price?ids=bitcoin&vs_currencies=usd')
    .then(r => console.log(`Request ${i + 1}:`, r.headers.get('X-Cache-Status')));
}
```

**Expected**:
```
Request 1: MISS (calls API)
Request 2: HIT (from cache)
Request 3: HIT
...
Request 10: HIT
```

Only the first request hits CoinGecko! 🎉

---

## 🐛 **Troubleshooting**

### **Still seeing 403 errors?**

**Check**:
1. API key copied correctly (starts with `CG-`)
2. Added as "Encrypted" in Cloudflare
3. Cloudflare rebuild completed
4. Hard refreshed browser

**Fix**: Delete and re-add the environment variable

---

### **Still seeing 429 errors?**

**Possible causes**:
1. Very high traffic
2. Cache not working
3. Multiple sites using same key

**Check cache status**:
```javascript
fetch('/api/coingecko/ping')
  .then(r => console.log('Cache:', r.headers.get('X-Cache-Status')));
```

**Should see**: "HIT" on repeated calls

---

### **Not seeing usage in CoinGecko dashboard?**

**Possible causes**:
1. API key not added correctly
2. Cache serving all requests
3. Dashboard update delay (can take 5-10 min)

**Test**: Make a unique request that won't be cached:
```javascript
fetch(`/api/coingecko/coins/bitcoin?timestamp=${Date.now()}`)
  .then(r => r.json())
  .then(console.log);
```

Check dashboard in 5 minutes.

---

## 💰 **Should You Upgrade?**

### **Stay on Free Tier If**:
- ✅ < 100 active users
- ✅ Caching working well
- ✅ No 429 errors
- ✅ Dashboard showing < 10k calls/month

### **Consider Paid Plan If**:
- ⚠️ > 500 active users
- ⚠️ Frequent 429 errors
- ⚠️ Need real-time prices (< 1 min cache)
- ⚠️ Building a high-traffic platform

**Pricing**:
- Free: $0/mo (10k calls)
- Analyst: $129/mo (500k calls)
- Lite: $649/mo (2.5M calls)

---

## 📚 **Summary**

### **What to Do Now**:

1. ✅ **Sign up**: https://www.coingecko.com/en/api
2. ✅ **Get API key**: Dashboard → Copy `CG-xxx`
3. ✅ **Add to Cloudflare**: Environment variables → Encrypted
4. ✅ **Redeploy**: Trigger new build
5. ✅ **Test**: Hard refresh, check console

### **Expected Results**:

**Before** ❌:
- 403 Forbidden
- 429 Too Many Requests
- No data loading
- Console errors

**After** ✅:
- 200 OK
- Data loads perfectly
- Cache serving most requests
- Clean console

### **Time Required**:
- Sign up: 2 minutes
- Add to Cloudflare: 1 minute
- Redeploy: 2-3 minutes
- **Total: < 10 minutes**

---

## 🎉 **Next Steps**

After adding your API key:

1. **Monitor usage**: Check CoinGecko dashboard daily for first week
2. **Optimize caching**: Adjust durations if needed
3. **Track errors**: Check Cloudflare logs for issues
4. **Enjoy**: Your app will work perfectly! 🚀

---

**Get your free API key now**: https://www.coingecko.com/en/api

**Questions?** Check the CoinGecko docs: https://www.coingecko.com/en/api/documentation

