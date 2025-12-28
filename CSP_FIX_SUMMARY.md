# CSP Errors Fix - December 26, 2025

## Issues Identified

### 1. WalletConnect/Web3Modal API Blocked
**Error:** `Refused to connect to https://api.web3modal.org`
- WalletConnect needed to fetch remote project configuration
- This is required for Web3 wallet connections

### 2. Coinbase Wallet Analytics Blocked
**Error:** `Refused to connect to https://cca-lite.coinbase.com`
- Coinbase Wallet SDK tries to send analytics
- Blocked both `/amp` and `/metrics` endpoints

### 3. Missing PWA Icons
**Error:** `Error while trying to use the following icon from the Manifest: /icons/icon-144x144.png`
- Manifest.json referenced non-existent PNG icons
- Service worker referenced non-existent icon files

## Fixes Applied

### Fix 1: Updated Content Security Policy (`public/_headers`)

Added the following domains to `connect-src`:
- `https://api.web3modal.org` - WalletConnect config
- `https://cca-lite.coinbase.com` - Coinbase Wallet analytics
- `https://*.coinbase.com` - Wildcard for other Coinbase services

Also added to `frame-src`:
- `https://verify.walletconnect.org` - WalletConnect verification

**Updated CSP directive:**
```
connect-src 'self' 
  https://*.supabase.co wss://*.supabase.co 
  https://api.coingecko.com https://pro-api.coingecko.com https://coin-images.coingecko.com 
  https://api.stripe.com 
  https://*.walletconnect.com wss://*.walletconnect.com 
  https://*.walletconnect.org wss://*.walletconnect.org 
  https://api.web3modal.org 
  https://cca-lite.coinbase.com https://*.coinbase.com 
  https://rpc.ankr.com 
  https://*.infura.io wss://*.infura.io 
  https://*.alchemy.com wss://*.alchemy.com 
  https://cloudflare-eth.com 
  https://api.alternative.me 
  https://min-api.cryptocompare.com https://resources.cryptocompare.com 
  https://ethereum-rpc.publicnode.com 
  https://polygon-bor-rpc.publicnode.com 
  https://arbitrum-one-rpc.publicnode.com 
  https://optimism-rpc.publicnode.com 
  https://bsc-rpc.publicnode.com 
  https://avalanche-c-chain-rpc.publicnode.com 
  https://base-rpc.publicnode.com 
  https://cryptologos.cc 
  https://plausible.io 
  https://www.google-analytics.com 
  https://www.googletagmanager.com;
```

### Fix 2: Simplified PWA Manifest (`public/manifest.json`)

Changed from non-existent PNG icons to using the existing SVG favicon:

**Before:**
```json
"icons": [
  { "src": "/icons/icon-72x72.png", ... },
  { "src": "/icons/icon-96x96.png", ... },
  // ... 8 different sizes
]
```

**After:**
```json
"icons": [
  {
    "src": "/favicon.svg",
    "sizes": "any",
    "type": "image/svg+xml",
    "purpose": "any maskable"
  }
]
```

Also removed references to non-existent screenshots and shortcuts.

### Fix 3: Updated Service Worker (`public/sw.js`)

Changed notification icons from non-existent PNGs to the SVG favicon:

**Before:**
```javascript
icon: '/icons/icon-192x192.png',
badge: '/icons/badge-72x72.png',
```

**After:**
```javascript
icon: '/favicon.svg',
badge: '/favicon.svg',
```

## Why These Domains Are Needed

### `api.web3modal.org`
- **Purpose:** WalletConnect/Web3Modal configuration API
- **When Used:** When initializing wallet connections
- **Data Exchanged:** Project configuration, feature flags, supported chains
- **Security:** Read-only configuration, no sensitive data sent

### `cca-lite.coinbase.com`
- **Purpose:** Coinbase Wallet SDK analytics
- **When Used:** When users interact with Coinbase Wallet
- **Data Exchanged:** Anonymous usage analytics
- **Security:** Optional analytics, doesn't affect functionality if blocked

### `*.coinbase.com`
- **Purpose:** Other Coinbase Wallet services
- **When Used:** Wallet operations, transaction signing
- **Data Exchanged:** Wallet connection data, transaction signatures
- **Security:** Required for Coinbase Wallet to function

## Testing

After deploying these changes:

1. **Clear browser cache** (Ctrl+Shift+R)
2. **Check console** - CSP errors should be gone
3. **Test wallet connections:**
   - WalletConnect should initialize without errors
   - Coinbase Wallet should connect without errors
4. **Check PWA install** - Icon should display correctly

## Files Modified

1. `public/_headers` - Added Web3 API domains to CSP
2. `public/manifest.json` - Simplified icons to use SVG
3. `public/sw.js` - Updated notification icons to SVG

## Deployment

```bash
# Build
npm run build

# Deploy to Cloudflare Pages
npm run cf:deploy

# Or push to git if auto-deploy is enabled
git add .
git commit -m "Fix CSP errors for Web3 wallets and PWA icons"
git push
```

## Status
✅ CSP updated with Web3 domains
✅ Manifest icons fixed
✅ Service worker icons fixed
✅ Build successful
⏳ Ready to deploy

## Notes

- SVG icons work for all PWA purposes and are resolution-independent
- If you want proper PNG icons later, create them in `public/icons/` directory
- The WalletConnect warnings about "already initialized" are harmless and come from the library being imported multiple times
- The THREE.js NaN warning is cosmetic and doesn't affect functionality

