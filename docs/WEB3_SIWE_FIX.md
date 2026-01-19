# Web3/SIWE Bundle Fix - COMPLETE SOLUTION

## Problem Summary

The production site was showing a black screen with the following error on initial page load:

```
vendor-web3-core-CAOS0oWN.js:2 Uncaught TypeError: Object.defineProperty called on non-object
    at Object.defineProperty (<anonymous>)
    at Hg (vendor-web3-core-CAOS0oWN.js:2:450830)
    at Qc (vendor-web3-utils-DFGmwUm_.js:1:297524)
```

This error occurred because **SIWE (Sign-In with Ethereum)** code was being loaded and executed **before React even mounted**, causing CommonJS modules to fail during browser initialization.

## Root Cause Analysis

After extensive investigation, we identified **4 separate issues** that all contributed to premature Web3 code loading:

### 1. ❌ Static imports in `Web3ProviderWrapper.tsx`
**Problem**: Even though `Web3ProviderWrapper` was lazy-loaded, it had static imports like:
```typescript
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
```
These imports were evaluated as soon as the module was parsed, before React mounted.

### 2. ❌ Static imports of Web3 components on non-Web3 pages
**Problem**: `WalletImport` and `TransactionImport` components (which contain `wagmi` imports) were statically imported in:
- `src/components/PortfolioTracker.tsx`
- `src/pages/TaxReports.tsx`

This caused Web3 code to load on **every page**, not just Web3-specific routes.

### 3. ❌ Top-level config creation in `src/lib/wagmi.ts`
**Problem**: The Wagmi config was created at the top level:
```typescript
export const wagmiConfig = getDefaultConfig({...});  // ❌ Runs immediately!
```
This `getDefaultConfig()` call loaded SIWE as soon as the module was imported.

### 4. ❌ **THE BIG ONE**: Vite's automatic `modulepreload` (THE ROOT CAUSE)
**Problem**: Vite was automatically adding these lines to `dist/index.html`:
```html
<link rel="modulepreload" crossorigin href="/assets/js/vendor-web3-utils-DFGmwUm_.js">
<link rel="modulepreload" crossorigin href="/assets/js/vendor-web3-wallets-DwiSNfV0.js">
<link rel="modulepreload" crossorigin href="/assets/js/vendor-web3-core-CAOS0oWN.js">
```

**`modulepreload`** tells the browser to **immediately fetch and PARSE** these modules, even though they're not needed yet. This caused the SIWE code to execute before React mounted, triggering the `Object.defineProperty` error.

## Complete Solution (4-Layer Fix)

### Layer 1: Make Web3ProviderWrapper truly dynamic ✅

**File**: `src/components/Web3ProviderWrapper.tsx`

Converted ALL static imports to dynamic imports inside a lazy-loaded component:

```typescript
const Web3Content = lazy(async () => {
  // Dynamic imports - ONLY load when this component is rendered
  const [
    { WagmiProvider },
    { QueryClient, QueryClientProvider },
    { RainbowKitProvider },
    { wagmiConfig },
  ] = await Promise.all([
    import('wagmi'),
    import('@tanstack/react-query'),
    import('@rainbow-me/rainbowkit'),
    import('../lib/wagmi'),
    import('@rainbow-me/rainbowkit/styles.css'), // CSS also loaded dynamically
  ]);

  const web3QueryClient = new QueryClient({...});

  const Provider = ({ children }: { children: ReactNode }) => (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={web3QueryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
  
  return { default: Provider };
});

export function Web3ProviderWrapper({ children }: Web3ProviderWrapperProps) {
  const [hasError, setHasError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClient(true);
    }
  }, []);

  if (!isClient) {
    return <>{children}</>;
  }

  if (hasError) {
    return <ErrorFallbackUI />;
  }

  return (
    <Suspense fallback={<PageLoader message="Loading Web3 providers..." />}>
      <Web3Content>{children}</Web3Content>
    </Suspense>
  );
}
```

### Layer 2: Lazy-load Web3 components on non-Web3 pages ✅

**File**: `src/components/PortfolioTracker.tsx`

Made `WalletImportModal` lazy-loaded:

```typescript
import { lazy, Suspense } from 'react';
import { PageLoader } from './LoadingSkeletons';

// Lazy load WalletImport to avoid loading wagmi on every page
const WalletImportModal = lazy(() =>
  import('./WalletImport').then(m => ({ default: m.WalletImportModal }))
);

// In render:
{showWalletImport && (
  <Suspense fallback={<PageLoader message="Loading wallet import..." />}>
    <WalletImportModal
      open={showWalletImport}
      onClose={() => setShowWalletImport(false)}
      portfolio={portfolio!}
      onUpdate={(p) => setPortfolio(p)}
    />
  </Suspense>
)}
```

**File**: `src/pages/TaxReports.tsx`

Made `TransactionImport` lazy-loaded:

```typescript
import { lazy, Suspense } from 'react';
import { PageLoader } from '../components/LoadingSkeletons';

// Lazy load TransactionImport to avoid loading wagmi on every page
const TransactionImport = lazy(() =>
  import('../components/TransactionImport').then(m => ({ default: m.TransactionImport }))
);

// In render:
{showTransactionImportModal && (
  <Suspense fallback={<PageLoader message="Loading transaction import..." />}>
    <TransactionImport
      isOpen={showTransactionImportModal}
      onClose={() => setShowTransactionImportModal(false)}
      onImport={handleImportTransactions}
    />
  </Suspense>
)}
```

### Layer 3: Lazy-create Wagmi config with Proxy ✅

**File**: `src/lib/wagmi.ts`

Wrapped `wagmiConfig` in a Proxy that only creates the config when first accessed:

```typescript
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, arbitrum, optimism } from 'viem/chains';
import { http } from 'wagmi';
import type { Config } from 'wagmi';

const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY || '';
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

const getTransports = () => ({
  [mainnet.id]: http(alchemyApiKey ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}` : 'https://eth.llamarpc.com'),
  [polygon.id]: http(alchemyApiKey ? `https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}` : 'https://polygon.llamarpc.com'),
  [arbitrum.id]: http(alchemyApiKey ? `https://arb-mainnet.g.alchemy.com/v2/${alchemyApiKey}` : 'https://arbitrum.llamarpc.com'),
  [optimism.id]: http(alchemyApiKey ? `https://opt-mainnet.g.alchemy.com/v2/${alchemyApiKey}` : 'https://optimism.llamarpc.com'),
});

// Lazy-create wagmi config to avoid loading SIWE on page load
let _wagmiConfig: Config | null = null;

export const wagmiConfig: Config = new Proxy({} as Config, {
  get(_target, prop) {
    // Create config on first access
    if (!_wagmiConfig) {
      _wagmiConfig = getDefaultConfig({
        appName: 'Bitcoin Investments',
        projectId: walletConnectProjectId,
        chains: [mainnet, polygon, arbitrum, optimism],
        transports: getTransports(),
        ssr: false,
      });
    }
    return Reflect.get(_wagmiConfig, prop);
  },
});
```

### Layer 4: Disable modulepreload for Web3 chunks ✅ (THE FIX!)

**File**: `vite.config.ts`

Added `modulePreload.resolveDependencies` to filter out Web3 chunks from being preloaded:

```typescript
export default defineConfig({
  // ... other config
  build: {
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: 'terser',
    
    // **CRITICAL**: Disable modulepreload for Web3 chunks to prevent early evaluation
    modulePreload: {
      polyfill: true,
      resolveDependencies: (_filename, deps, _context) => {
        // Filter out Web3 chunks from modulepreload to prevent SIWE loading on page load
        return deps.filter(dep => {
          const isWeb3Chunk = dep.includes('vendor-web3') || 
                             dep.includes('WalletImport') || 
                             dep.includes('TransactionImport') ||
                             dep.includes('Web3Features') ||
                             dep.includes('Web3ProviderWrapper');
          return !isWeb3Chunk; // Only preload non-Web3 chunks
        });
      },
    },
    
    commonjsOptions: {
      transformMixedEsModules: true,
      requireReturnsDefault: 'auto',
      include: [/node_modules/],
    },
    // ... rest of build config
  },
});
```

**Result**: The HTML no longer contains `<link rel="modulepreload">` tags for Web3 bundles!

**Before (broken)**:
```html
<link rel="modulepreload" href="/assets/js/vendor-web3-utils-DFGmwUm_.js">    ❌
<link rel="modulepreload" href="/assets/js/vendor-web3-wallets-DwiSNfV0.js">  ❌
<link rel="modulepreload" href="/assets/js/vendor-web3-core-CAOS0oWN.js">     ❌
```

**After (fixed)**:
```html
<!-- NO Web3 modulepreload links! -->  ✅
<link rel="modulepreload" href="/assets/js/vendor-react-BAvX0ZXQ.js">
<link rel="modulepreload" href="/assets/js/vendor-supabase-8RHVLiO9.js">
```

## Why This Fix Works

### Before the Fix
1. Browser loads `index.html`
2. Sees `<link rel="modulepreload" href="vendor-web3-core.js">`
3. **IMMEDIATELY** fetches and parses `vendor-web3-core.js`
4. SIWE code executes during parsing → `Object.defineProperty` error!
5. React never mounts → black screen

### After the Fix
1. Browser loads `index.html`
2. **NO modulepreload links for Web3 chunks**
3. React app mounts successfully
4. User navigates to `/web3` route
5. **THEN** `Web3ProviderWrapper` lazy-loads
6. **THEN** dynamic imports load Web3 chunks
7. **THEN** Proxy creates wagmi config
8. Web3 features work perfectly! ✅

## Testing Checklist

- ✅ **Home page** - Loads instantly, no Web3 errors
- ✅ **Dashboard** - Loads instantly, no Web3 errors
- ✅ **All non-Web3 pages** - No Web3 code loaded
- ✅ **Navigate to `/web3`** - Web3 loads on demand
- ✅ **Click "Import from Wallet"** - WalletImport loads on demand
- ✅ **Connect wallet** - Wagmi config created on demand
- ✅ **Sign message with wallet** - SIWE works correctly
- ✅ **No console errors** on any page

## Key Learnings

1. **`modulepreload` is powerful but dangerous** - It's great for performance, but can cause modules to execute before they're ready.

2. **Vite's automatic optimizations aren't always optimal** - Sometimes you need to manually configure chunk loading behavior.

3. **CommonJS/ESM interop is tricky in browsers** - SIWE and other Node.js libraries need careful handling in browser environments.

4. **Multi-layer lazy loading is required** - For deeply problematic libraries, you need to lazy-load at EVERY level:
   - Component level (React.lazy)
   - Import level (dynamic import())
   - Config level (Proxy)
   - Build level (modulepreload filtering)

5. **Always check the built HTML** - The source code might look fine, but the built output might have unexpected preload/prefetch hints.

## Related Issues

- Web3 authentication errors
- SIWE sign-in failures
- Wallet connection issues
- Black screen on production
- `Object.defineProperty` errors
- CommonJS module errors in browser

## Files Modified

1. `src/components/Web3ProviderWrapper.tsx` - Dynamic imports
2. `src/components/PortfolioTracker.tsx` - Lazy-load WalletImport
3. `src/pages/TaxReports.tsx` - Lazy-load TransactionImport
4. `src/lib/wagmi.ts` - Lazy Proxy config
5. `vite.config.ts` - Disable modulepreload for Web3

## Deployment Status

- ✅ **Commit**: 7b3d98d
- ✅ **Branch**: main
- ✅ **Deployed**: Cloudflare Pages
- ✅ **Status**: Production ready

---

**Last Updated**: January 19, 2026  
**Status**: ✅ RESOLVED  
**Severity**: Critical (Black screen on production)  
**Time to Resolution**: Multiple attempts over several deployments

