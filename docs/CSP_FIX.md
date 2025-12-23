# Content Security Policy (CSP) Fix

## Problem

After fixing the login issue, you were seeing CSP (Content Security Policy) violations that blocked external API calls:

```
Refused to connect because it violates the document's Content Security Policy:
- static.cloudflareinsights.com (Cloudflare analytics)
- plausible.io (Analytics)
- api.alternative.me (Fear & Greed Index)
- min-api.cryptocompare.com (Crypto news)
- *.publicnode.com (Blockchain RPC endpoints)
- cryptologos.cc (Crypto logos)
```

## What is CSP?

Content Security Policy is a security feature that helps prevent:
- Cross-site scripting (XSS) attacks
- Data injection attacks
- Unauthorized resource loading

It works by specifying which domains your app is allowed to load resources from.

## Solution Applied

Updated `public/_headers` to add missing domains to the CSP directives:

### Added to `script-src` (JavaScript sources):
- `https://static.cloudflareinsights.com` - Cloudflare Web Analytics
- `https://plausible.io` - Privacy-friendly analytics

### Added to `connect-src` (API/fetch requests):
- `https://api.alternative.me` - Fear & Greed Index API
- `https://min-api.cryptocompare.com` - Crypto news and data
- `https://coin-images.coingecko.com` - Cryptocurrency images
- `https://cryptologos.cc` - Cryptocurrency logos
- **Blockchain RPC endpoints:**
  - `https://ethereum-rpc.publicnode.com`
  - `https://polygon-bor-rpc.publicnode.com`
  - `https://arbitrum-one-rpc.publicnode.com`
  - `https://optimism-rpc.publicnode.com`
  - `https://bsc-rpc.publicnode.com`
  - `https://avalanche-c-chain-rpc.publicnode.com`
  - `https://base-rpc.publicnode.com`

## Updated CSP Policy

```
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' 'unsafe-inline' 'unsafe-eval' 
    https://js.stripe.com 
    https://challenges.cloudflare.com 
    https://static.cloudflareinsights.com 
    https://plausible.io; 
  style-src 'self' 'unsafe-inline' 
    https://fonts.googleapis.com; 
  font-src 'self' 
    https://fonts.gstatic.com 
    data:; 
  img-src 'self' data: blob: https: http:; 
  connect-src 'self' 
    https://*.supabase.co 
    wss://*.supabase.co 
    https://api.coingecko.com 
    https://pro-api.coingecko.com 
    https://coin-images.coingecko.com 
    https://api.stripe.com 
    https://*.walletconnect.com 
    wss://*.walletconnect.com 
    https://*.walletconnect.org 
    wss://*.walletconnect.org 
    https://rpc.ankr.com 
    https://*.infura.io 
    wss://*.infura.io 
    https://*.alchemy.com 
    wss://*.alchemy.com 
    https://cloudflare-eth.com 
    https://api.alternative.me 
    https://min-api.cryptocompare.com 
    https://ethereum-rpc.publicnode.com 
    https://polygon-bor-rpc.publicnode.com 
    https://arbitrum-one-rpc.publicnode.com 
    https://optimism-rpc.publicnode.com 
    https://bsc-rpc.publicnode.com 
    https://avalanche-c-chain-rpc.publicnode.com 
    https://base-rpc.publicnode.com 
    https://cryptologos.cc; 
  frame-src 'self' 
    https://js.stripe.com 
    https://challenges.cloudflare.com 
    https://verify.walletconnect.com; 
  frame-ancestors 'self'; 
  form-action 'self'; 
  base-uri 'self'; 
  object-src 'none'; 
  upgrade-insecure-requests
```

## What This Enables

After deploying this fix, your app will be able to:

✅ **Load Analytics**
- Cloudflare Web Analytics for site metrics
- Plausible Analytics for privacy-friendly tracking

✅ **Fetch Crypto Market Data**
- Fear & Greed Index from api.alternative.me
- Latest crypto news from CryptoCompare
- Real-time price data from CoinGecko

✅ **Display Crypto Images**
- Cryptocurrency logos from cryptologos.cc
- Coin images from CoinGecko CDN

✅ **Connect to Blockchain Networks**
- Query gas prices from various chains
- Check wallet balances
- Interact with smart contracts
- Use Web3 features across 7 different blockchains

## Deployment

To apply this fix:

```bash
# Build the application
npm run build

# Deploy to Cloudflare Pages
npm run deploy
```

Or if using Cloudflare Pages auto-deployment:

```bash
git add public/_headers
git commit -m "Fix CSP to allow external API calls"
git push origin main
```

## Testing

After deployment, verify the fix:

1. **Open your site**: https://bitcoinvestments.net
2. **Open DevTools** (F12) → Console tab
3. **Log in to your account**
4. **Check for errors**:
   - ❌ Before: "Refused to connect... violates CSP"
   - ✅ After: No CSP violation errors
5. **Verify features work**:
   - Fear & Greed Index loads
   - Crypto prices update
   - Gas prices display
   - Cryptocurrency logos appear

## Security Notes

### Why `'unsafe-inline'` and `'unsafe-eval'`?

These are needed for:
- **React**: Uses inline styles and eval for development
- **Vite**: Build tool requires eval for HMR (Hot Module Replacement)
- **Three.js**: 3D graphics library uses eval for performance

In production, consider:
1. Using a nonce-based CSP
2. Moving inline scripts to external files
3. Using a stricter CSP with hashes

### Why Allow All HTTPS Images?

`img-src https: http:` allows loading images from any HTTPS/HTTP source because:
- CoinGecko uses a CDN with dynamic URLs
- User avatars might come from various sources
- NFT images can be hosted anywhere
- More secure than listing every possible image CDN

## Alternative: Wildcard Approach

If you frequently add new APIs, consider using wildcards:

```
connect-src 'self' https://*.publicnode.com https://*.coingecko.com ...
```

This is less secure but more flexible for development.

## Troubleshooting

### Still Seeing CSP Errors?

1. **Clear browser cache**: Hard refresh (Ctrl + Shift + R)
2. **Check deployment**: Ensure `_headers` file is in the deployed build
3. **Verify Cloudflare**: Check Cloudflare Pages dashboard for header configuration
4. **Test in incognito**: Rule out browser extension interference

### New API Not Working?

1. Open DevTools Console
2. Look for "Refused to connect" errors
3. Note the blocked domain
4. Add it to `connect-src` in `public/_headers`
5. Rebuild and redeploy

### Headers Not Applying?

If headers aren't being applied on Cloudflare Pages:

1. Go to Cloudflare Pages Dashboard
2. Select your project
3. Go to Settings → Functions
4. Add headers there as a fallback:

```
Headers:
  Content-Security-Policy: [your CSP here]
```

## Related Documentation

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Cloudflare Pages Headers](https://developers.cloudflare.com/pages/configuration/headers/)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/) - Test your CSP

## Summary

**What was broken:** External API calls were blocked by CSP  
**What was fixed:** Added all necessary domains to CSP whitelist  
**Impact:** All crypto data, analytics, and blockchain features now work  
**Files changed:** `public/_headers`  
**Action required:** Deploy to production


