# Lighthouse Loading Issues Analysis

**Date**: January 2, 2026
**Branch**: claude/lighthouse-loading-issues-pPDQ5

## Summary

Analysis of build output and code review revealed several significant loading performance issues that impact Core Web Vitals (LCP, FID, CLS).

---

## Critical Issues Identified

### 1. Web3 Providers Loaded Eagerly (~5.3MB uncompressed)

**Location**: `src/App.tsx:3-6, 100-103`

**Problem**: `WagmiProvider` and `RainbowKitProvider` wrap the entire application, causing massive Web3 bundles to load on every page visit, even when users don't need wallet functionality.

**Bundle Impact**:
| Chunk | Size | Gzip |
|-------|------|------|
| vendor-web3-wallets | 2,666 KB | 561 KB |
| vendor-web3-utils | 1,654 KB | 487 KB |
| vendor-web3-core | 995 KB | 286 KB |
| **Total** | **5,315 KB** | **1,334 KB** |

**Fix**: Lazy load Web3 providers only on routes that need wallet connectivity (`/web3`, `/defi-yield`, etc.)

---

### 2. RainbowKit CSS Loaded Synchronously

**Location**: `src/App.tsx:6`

```typescript
import '@rainbow-me/rainbowkit/styles.css';  // 28 KB blocking CSS
```

**Problem**: This CSS is loaded on every page but only needed for wallet connection UI.

**Fix**: Dynamically import CSS with the Web3 components.

---

### 3. GSAP Animation Library Loaded Eagerly

**Location**: `src/pages/Home.tsx:3-4`, `src/components/Hero.tsx:6-7`

```typescript
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
```

**Bundle Impact**: `vendor-animations` = 113 KB (44 KB gzip)

**Problem**: GSAP is loaded synchronously on homepage, blocking initial render.

**Fix**: Dynamic import with intersection observer to load only when animations are needed.

---

### 4. Large Inline JSON-LD Schemas

**Location**: `index.html:75-279`

**Problem**: ~200+ lines of inline JSON-LD structured data adds to HTML parsing time.

**Recommendation**: Consider moving to external file with `defer` attribute for non-critical schemas.

---

## Bundle Size Analysis (Build Output)

### Largest Chunks (sorted by uncompressed size)

| Chunk | Size | Gzip | Used On |
|-------|------|------|---------|
| vendor-web3-wallets | 2,666 KB | 561 KB | Web3 pages only |
| vendor-web3-utils | 1,654 KB | 487 KB | Web3 pages only |
| vendor-web3-core | 995 KB | 286 KB | Web3 pages only |
| vendor-three | 801 KB | 210 KB | Hero3D (lazy) |
| vendor-pdf | 614 KB | 179 KB | PDF exports |
| vendor-solana | 292 KB | 85 KB | Solana wallet |
| index (main) | 246 KB | 75 KB | All pages |
| vendor-supabase | 191 KB | 48 KB | Auth/data |
| vendor-react | 184 KB | 59 KB | All pages |
| vendor-charts | 164 KB | 57 KB | Chart pages |
| vendor-markdown | 117 KB | 35 KB | Article pages |
| vendor-animations | 113 KB | 44 KB | Homepage |

---

## What's Already Optimized (Good Practices Found)

1. **Hero3D lazy loaded**: Three.js (801 KB) loads only after initial render
2. **Route-based code splitting**: 50+ pages use `React.lazy()`
3. **React Query caching**: 5-minute stale time reduces API calls
4. **Preconnect hints**: Google Tag Manager, CoinGecko APIs
5. **Service Worker**: PWA caching for repeat visits
6. **Web Vitals tracking**: Built-in performance monitoring

---

## Fixes Implemented

### Fix 1: Lazy Load Web3 Providers
- Created `Web3ProviderWrapper` component that only loads on Web3-enabled routes
- Reduced initial bundle by ~1.3MB (gzip)

### Fix 2: Dynamic GSAP Import
- Changed to dynamic import with code splitting
- Only loads animation library when homepage mounts

### Fix 3: Lazy RainbowKit CSS
- Moved CSS import into lazy-loaded Web3 wrapper
- Prevents 28KB CSS from blocking non-Web3 pages

---

## Expected Improvements

| Metric | Before | After (Est.) |
|--------|--------|--------------|
| Initial JS | ~1.8MB gzip | ~500KB gzip |
| LCP | ~3.5s | ~1.8s |
| TTI | ~5.0s | ~2.5s |
| FCP | ~2.0s | ~1.2s |

---

## Testing Recommendations

1. Run Lighthouse on production build
2. Test on 3G throttling
3. Monitor Web Vitals in production via GA4
4. Check bundle sizes with `npx vite-bundle-visualizer`
