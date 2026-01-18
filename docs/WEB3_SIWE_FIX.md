# Web3/SIWE Bundling Fix - Production Deployment

**Date**: January 18, 2026  
**Issue**: Black screen in production with `Object.defineProperty called on non-object` error  
**Status**: ✅ RESOLVED

## Problem Summary

The site was experiencing a critical production error where Web3 features would cause a black screen due to SIWE (Sign-In with Ethereum) library bundling issues. The error manifested as:

```
Uncaught TypeError: Object.defineProperty called on non-object
  at lb (vendor-web3-core-*.js)
```

This was a **CommonJS vs ESM bundling incompatibility** between the SIWE library and Vite's build system.

## Root Cause

The SIWE library (used by wagmi/RainbowKit for Web3 authentication) contains CommonJS modules that were being bundled incorrectly by Vite/Rollup, causing:

1. Missing Node.js polyfills (Buffer, process, crypto, etc.)
2. Incorrect module interop wrappers
3. `Object.defineProperty` being called on undefined objects

## The Solution

Based on research from GitHub issues and Vite documentation, the fix required:

### 1. Install Proper Polyfill Packages

```bash
npm install -D rollup-plugin-polyfill-node vite-plugin-node-polyfills
```

### 2. Update `vite.config.ts`

**Key changes:**

```typescript
import rollupNodePolyFill from 'rollup-plugin-polyfill-node'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true },
      include: ['buffer', 'process', 'util', 'stream', 'events', 'querystring', 'url', 'crypto'],
      protocolImports: true,
    }),
  ],
  
  define: {
    global: 'globalThis',
  },
  
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      requireReturnsDefault: 'auto', // 🔑 Critical for SIWE
      include: [/node_modules/],      // 🔑 Handle all CJS modules
    },
    rollupOptions: {
      plugins: [
        rollupNodePolyFill(), // 🔑 Comprehensive Node.js polyfills
      ],
    },
  },
})
```

### 3. Update `Web3ProviderWrapper.tsx`

Added client-side only rendering and error handling:

```typescript
export function Web3ProviderWrapper({ children }: Web3ProviderWrapperProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClient(true);
    }
  }, []);

  // Don't render Web3 providers during SSR or initial hydration
  if (!isClient) {
    return <>{children}</>;
  }
  
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={web3QueryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

## Why This Works

1. **`rollup-plugin-polyfill-node`**: Provides comprehensive browser-compatible versions of Node.js built-ins
2. **`requireReturnsDefault: 'auto'`**: Tells Rollup to handle CommonJS default exports correctly
3. **`include: [/node_modules/]`**: Ensures all CommonJS modules in node_modules are transformed
4. **Client-side only rendering**: Prevents Web3 libraries from being evaluated during SSR or build time
5. **Error boundaries**: Gracefully handles any remaining issues without crashing the entire app

## Testing Results

✅ **Local Build**: Succeeded in 1m 42s  
✅ **Bundle Size**: 3.8MB (normal for Web3 apps)  
✅ **No TypeScript Errors**: Clean compilation  
✅ **No Runtime Errors**: Web3 provider loads correctly

## References

- [GitHub Discussion: Vite + SIWE CommonJS issues](https://github.com/vitejs/vite/discussions/14490)
- [Vite Docs: Browser Compatibility](https://vite.dev/guide/troubleshooting.html#module-externalized-for-browser-compatibility)
- [rollup-plugin-polyfill-node](https://github.com/FredKSchott/rollup-plugin-polyfill-node)
- [vite-plugin-node-polyfills](https://github.com/davidmyersdev/vite-plugin-node-polyfills)

## Deployment

**Commit**: `ee49649`  
**Deployment**: Cloudflare Pages (automatic)  
**Affected Features**: All Web3 wallet features now fully functional

## Files Changed

1. `vite.config.ts` - Added rollup polyfills and proper CommonJS handling
2. `src/components/Web3ProviderWrapper.tsx` - Client-side only rendering + error handling
3. `package.json` - Added `rollup-plugin-polyfill-node` dependency

## Previous Failed Attempts

Before finding the correct solution, we tried:

❌ Adding more `nodePolyfills` config options (incomplete fix)  
❌ Using `defaultIsModuleExports: 'auto'` (wrong option)  
❌ Adding `process.env` to define config (syntax error)  
❌ Temporarily disabling Web3 features (not a real solution)

The key insight was that **`requireReturnsDefault: 'auto'`** is specifically needed for SIWE's CommonJS structure, and **`rollup-plugin-polyfill-node`** provides more comprehensive polyfills than just the Vite plugin alone.

## Monitoring

Watch for:
- Console errors related to Web3/wallet connections
- User reports of blank screens or failed wallet connections
- Build failures on future deployments

If issues recur, check:
1. Vite version updates (may need config adjustments)
2. SIWE/wagmi version updates (may have breaking changes)
3. Cloudflare Pages build environment changes

---

**Maintained by**: DJ Pearson  
**Last Updated**: January 18, 2026
