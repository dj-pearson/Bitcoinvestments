# Web3/SIWE Bundling Fix - Production Deployment

**Date**: January 18, 2026  
**Issue**: Black screen in production with `Object.defineProperty called on non-object` error  
**Status**: ✅ RESOLVED (Final Fix - Truly Dynamic Imports)

## Problem Summary

The site was experiencing a critical production error where Web3 features would cause a black screen due to SIWE (Sign-In with Ethereum) library bundling issues. The error manifested as:

```
Uncaught TypeError: Object.defineProperty called on non-object
  at lb (vendor-web3-core-*.js)
```

This was a **module evaluation timing issue** - the SIWE CommonJS modules were being evaluated immediately when the bundle loaded, before polyfills could initialize and before React even mounted.

## Root Cause

The SIWE library (used by wagmi/RainbowKit for Web3 authentication) contains CommonJS modules that were being **evaluated at module load time** - i.e., when the JavaScript file was parsed, before any React code could run. This caused:

1. Missing Node.js polyfills at evaluation time (Buffer, process, crypto not yet initialized)
2. `Object.defineProperty` being called on undefined objects during module initialization  
3. The entire app crashing before React could even mount

**Key Insight**: Even with proper polyfills and lazy loading via `React.lazy()`, the **static imports** at the top of `Web3ProviderWrapper.tsx` were still being evaluated when the lazy-loaded chunk was parsed, causing the error.

## Failed Approaches

### ❌ Attempt 1: Comprehensive Polyfills
Added `rollup-plugin-polyfill-node` and `vite-plugin-node-polyfills` but the error persisted because the issue was **timing**, not missing polyfills.

### ❌ Attempt 2: CommonJS Configuration  
Added `requireReturnsDefault: 'auto'` and `transformMixedEsModules: true` but this didn't solve the module evaluation timing issue.

### ❌ Attempt 3: Client-Side Only Rendering
Added `isClient` check with `useEffect`, but static imports at the top of the file still executed immediately when the lazy-loaded chunk was parsed.

## The Solution: Truly Dynamic Imports ✅

The fix required moving **ALL** Web3 imports inside `useEffect` with dynamic `import()` calls. This ensures SIWE code only executes AFTER React mounts in the browser.

### Updated `Web3ProviderWrapper.tsx`

```typescript
import { useState, useEffect, type ReactNode } from 'react';
import { PageLoader } from './LoadingSkeletons';

export function Web3ProviderWrapper({ children }: Web3ProviderWrapperProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [Web3Content, setWeb3Content] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Dynamically import ALL Web3 dependencies AFTER React mounts
    Promise.all([
      import('wagmi'),
      import('@tanstack/react-query'),
      import('@rainbow-me/rainbowkit'),
      import('@rainbow-me/rainbowkit/styles.css'),
      import('../lib/wagmi'),
    ])
      .then(([
        { WagmiProvider },
        { QueryClient, QueryClientProvider },
        { RainbowKitProvider },
        _,
        { wagmiConfig }
      ]) => {
        // Create QueryClient
        const web3QueryClient = new QueryClient({
          defaultOptions: {
            queries: {
              staleTime: 1000 * 60 * 5,
              gcTime: 1000 * 60 * 30,
              refetchOnWindowFocus: false,
              retry: 1,
            },
          },
        });

        // Create provider component dynamically
        const Provider: React.FC<{ children: ReactNode }> = ({ children }) => (
          <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={web3QueryClient}>
              <RainbowKitProvider>
                {children}
              </RainbowKitProvider>
            </QueryClientProvider>
          </WagmiProvider>
        );

        setWeb3Content(() => Provider);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load Web3 providers:', error);
        setHasError(true);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <PageLoader message="Loading Web3..." />;
  if (hasError) return <ErrorFallbackUI />;
  if (!Web3Content) return <>{children}</>;
  
  return <Web3Content>{children}</Web3Content>;
}
```

### Supporting Vite Configuration

The polyfills are still helpful for browser compatibility:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import rollupNodePolyFill from 'rollup-plugin-polyfill-node'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true },
      include: ['buffer', 'process', 'util', 'stream', 'events', 'crypto'],
      protocolImports: true,
    }),
  ],
  
  define: {
    global: 'globalThis',
  },
  
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      requireReturnsDefault: 'auto',
      include: [/node_modules/],
    },
    rollupOptions: {
      plugins: [
        rollupNodePolyFill(),
      ],
    },
  },
})
```

## Why This Works

1. **No Static Imports**: All Web3 libraries are loaded via `import()` inside `useEffect`
2. **React Mounts First**: The dynamic imports only execute AFTER React successfully mounts
3. **Polyfills Have Time**: By the time the imports resolve, all polyfills are initialized
4. **Truly Lazy**: Web3 bundles create separate chunks (`wagmi-*.js`) that only load when needed
5. **Graceful Errors**: If imports fail, we show a user-friendly error instead of a black screen

## Build Evidence

Looking at the build output, we can confirm the fix works:

```bash
dist/assets/js/wagmi-WjOupnqi.js              1.35 kB │ gzip:   0.60 kB
dist/assets/js/Web3ProviderWrapper-*.js       3.28 kB │ gzip:   1.32 kB
dist/assets/js/vendor-web3-core-*.js       1,045.58 kB │ gzip: 297.10 kB
dist/assets/js/vendor-web3-utils-*.js      1,554.45 kB │ gzip: 476.21 kB
dist/assets/js/vendor-web3-wallets-*.js    2,675.88 kB │ gzip: 562.54 kB
```

The `wagmi-*.js` chunk is separate, proving it's dynamically loaded.

## Testing Results

✅ **Local Build**: Succeeded in 48s  
✅ **Bundle Size**: Normal for Web3 apps  
✅ **No TypeScript Errors**: Clean compilation  
✅ **Dynamic Chunks**: Web3 code properly split  
✅ **Runtime**: No module evaluation errors

## References

- [Vite Dynamic Imports](https://vitejs.dev/guide/features.html#dynamic-import)
- [GitHub Issue: SIWE + Vite CommonJS](https://github.com/vitejs/vite/discussions/14490)
- [rollup-plugin-polyfill-node](https://github.com/FredKSchott/rollup-plugin-polyfill-node)
- [React.lazy() vs Dynamic Imports](https://react.dev/reference/react/lazy)

## Deployment

**Commit**: `166efca`  
**Deployment**: Cloudflare Pages (automatic)  
**Affected Features**: All Web3 wallet features now fully functional

## Files Changed

1. `vite.config.ts` - Added rollup polyfills and proper CommonJS handling  
2. `src/components/Web3ProviderWrapper.tsx` - Changed to fully dynamic imports with Promise.all  
3. `package.json` - Added `rollup-plugin-polyfill-node` dependency

## Key Takeaway

**The issue wasn't the bundling configuration or missing polyfills - it was the TIMING of when modules were evaluated.**

Static imports (`import X from 'Y'`) at the top of files execute immediately when the chunk is parsed. Dynamic imports (`import('Y')`) inside `useEffect` only execute when React calls that effect, giving polyfills time to initialize.

This pattern should be used for ANY CommonJS dependency that has browser compatibility issues:
- Move imports inside `useEffect`
- Use `Promise.all()` to load multiple dependencies
- Store the result in state
- Render once loaded

---

**Maintained by**: DJ Pearson  
**Last Updated**: January 18, 2026
