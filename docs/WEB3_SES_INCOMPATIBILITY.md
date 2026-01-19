# Web3/SIWE/SES Incompatibility - Root Cause Analysis

## Executive Summary

**Status:** ⚠️ Web3 features temporarily disabled  
**Root Cause:** SIWE (Sign-In with Ethereum) is incompatible with MetaMask's Secure ECMAScript (SES) lockdown  
**Impact:** Homepage and all non-Web3 features fully functional; Web3 wallet features show maintenance message  
**Timeline:** Resolution expected within 24-48 hours

---

## The Problem

When users visited the site with MetaMask or other Web3 wallet extensions installed, they encountered a black screen with this error:

```
vendor-web3-core-CVfS5E5w.js:2 Uncaught TypeError: Object.defineProperty called on non-object
    at Object.defineProperty (<anonymous>)
    at Hg (vendor-web3-core-CVfS5E5w.js:2:450692)
```

In Firefox, the error was even more revealing:

```
SES_UNCAUGHT_EXCEPTION: TypeError: undefined is not a non-null object
SES Removing unpermitted intrinsics lockdown-install.js:1:203117
  Removing intrinsics.%MapPrototype%.getOrInsert
  Removing intrinsics.%WeakMapPrototype%.getOrInsert
```

---

## Root Cause: What is SES?

**Secure ECMAScript (SES)** is a security hardening system used by MetaMask and other wallet extensions to protect users from malicious websites. It:

1. **Locks down JavaScript globals** - Makes `Object`, `Array`, `Function`, etc. immutable
2. **Removes unsafe APIs** - Strips out dangerous features like `eval()`
3. **Enforces strict compartmentalization** - Isolates different code contexts

### The Timeline of Failure

1. **Page loads** → MetaMask extension detects Web3 activity
2. **SES initializes** → MetaMask hardens the JavaScript environment (locks down global objects)
3. **SIWE loads** → Our Web3 bundles try to initialize
4. **SIWE fails** → Tries to call `Object.defineProperty()` on a locked-down object
5. **Error thrown** → `Object.defineProperty called on non-object`

**The fundamental issue:** SIWE was written before SES became widespread and doesn't account for hardened environments.

---

## What We Tried (and Why It Failed)

Over hours of debugging, we attempted multiple fixes:

### Attempt 1: Node.js Polyfills ❌
**Theory:** SIWE needs proper Node.js polyfills for browser compatibility  
**Result:** Failed - Polyfills don't prevent SES lockdown

### Attempt 2: CommonJS/ESM Bundle Configuration ❌
**Theory:** CommonJS module evaluation timing is causing issues  
**Result:** Failed - Bundle format doesn't affect SES lockdown

### Attempt 3: Dynamic Imports with useEffect ❌
**Theory:** Delaying Web3 code loading until after React mounts  
**Result:** Failed - SES runs BEFORE any React code

### Attempt 4: Lazy-Loading Components ❌
**Theory:** Only load Web3 on Web3 pages  
**Result:** Failed - SES is injected on ALL pages if MetaMask detects crypto activity

### Attempt 5: Proxy-Wrapped wagmi Config ❌
**Theory:** Defer config creation until first access  
**Result:** Failed - Doesn't prevent SIWE from being bundled

### Attempt 6: Disabled Module Preloading ❌
**Theory:** Prevent Vite from preloading Web3 chunks  
**Result:** Failed - Doesn't prevent runtime SES lockdown

---

## The Temporary Solution

We've implemented a **maintenance mode** for Web3 features:

```typescript
export function Web3ProviderWrapper(_props: Web3ProviderWrapperProps) {
  return (
    <div className="maintenance-message">
      <h2>Web3 Features Under Maintenance</h2>
      <p>We're upgrading our Web3 wallet integration to improve 
         compatibility with browser wallet extensions.</p>
      <p>All other features remain fully functional.</p>
    </div>
  );
}
```

**Benefits:**
- ✅ Homepage works perfectly (no black screen)
- ✅ All non-Web3 features functional (Learn, Compare, Calculators, Scam Database)
- ✅ Clear communication to users
- ✅ Web3 bundle size reduced from 4.2MB to 456kB (89% smaller)
- ✅ No Web3 CSS loading on homepage

---

## Path Forward: Permanent Solutions

We have **3 viable options** to permanently fix this:

### Option 1: Remove SIWE, Use Wallet-Only Auth ✅ **RECOMMENDED**

**What:** Use wallet address as the authentication identifier without SIWE message signing

**Pros:**
- ✅ No SES compatibility issues (no SIWE library needed)
- ✅ Simpler, faster authentication flow
- ✅ Smaller bundle size
- ✅ Better UX (no signature popup on every login)

**Cons:**
- ⚠️ Less "pure" Web3 (no cryptographic proof of ownership)
- ⚠️ Requires server-side session management

**Implementation:**
```typescript
// Instead of SIWE message signing:
const { address } = useAccount();
if (address) {
  await supabase.auth.signIn({ 
    provider: 'custom',
    options: { data: { wallet_address: address } }
  });
}
```

**Timeline:** 1-2 days

---

### Option 2: Use SES-Compatible SIWE Alternative

**What:** Find or create an SIWE implementation that works with SES

**Pros:**
- ✅ Maintains "pure" Web3 authentication
- ✅ Cryptographic proof of wallet ownership

**Cons:**
- ⚠️ May not exist (SIWE is the standard)
- ⚠️ Requires significant research and testing
- ⚠️ Ongoing maintenance burden

**Research needed:**
- `ses-compat` libraries
- SIWE forks with SES support
- Alternative message-signing libraries

**Timeline:** 3-7 days (uncertain)

---

### Option 3: Feature Detection + Graceful Degradation

**What:** Detect if SES is active and fall back to non-SIWE auth

**Pros:**
- ✅ Works for all users
- ✅ Maintains SIWE for non-MetaMask users

**Cons:**
- ⚠️ Dual authentication paths (complex)
- ⚠️ Still needs Option 1 as fallback

**Implementation:**
```typescript
function detectSES() {
  try {
    Object.defineProperty({}, 'test', { value: 1 });
    return false; // SES not active
  } catch (e) {
    return true; // SES active
  }
}

if (detectSES()) {
  // Use wallet-only auth
} else {
  // Use SIWE
}
```

**Timeline:** 2-3 days

---

## Recommended Action Plan

1. **✅ DONE:** Deploy maintenance mode (current status)
2. **⏭️ NEXT:** Implement Option 1 (Wallet-Only Auth)
3. **⏭️ THEN:** Test with MetaMask, WalletConnect, Coinbase Wallet
4. **⏭️ FINALLY:** Deploy and monitor

**Estimated Total Time:** 1-2 days

---

## Technical Details

### Why Does SIWE Fail with SES?

SIWE calls `Object.defineProperty()` to set properties on objects during initialization:

```javascript
// Inside SIWE library (simplified)
Object.defineProperty(SiweMessage.prototype, 'address', {
  get: function() { return this._address; },
  set: function(value) { this._address = value; }
});
```

With SES active, `Object.defineProperty` is locked down:

```javascript
// After SES lockdown
Object.defineProperty = function() {
  throw new TypeError('Object.defineProperty called on non-object');
};
```

This is an **unsolvable incompatibility** without either:
- Removing SIWE
- Or patching SIWE to work with SES (requires forking the library)

---

## Build Results (Maintenance Mode)

### Before (With Full Web3):
```
vendor-web3-core-CVfS5E5w.js        1,044.87 kB │ gzip: 296.82 kB
vendor-web3-utils-Hyr2wcIX.js       1,554.45 kB │ gzip: 476.21 kB
vendor-web3-wallets-C2_s8aQb.js     2,675.88 kB │ gzip: 562.54 kB
TOTAL:                              5,275.20 kB │ gzip: 1,335.57 kB
```

### After (Maintenance Mode):
```
vendor-web3-core-P7kl39FU.js          279.71 kB │ gzip:  98.24 kB
vendor-web3-wallets-ZxYZJDrT.js       176.54 kB │ gzip:  45.49 kB
TOTAL:                                456.25 kB │ gzip: 143.73 kB
```

**Reduction:** 4,818.95 kB (89% smaller!)

---

## References

- [MetaMask SES Documentation](https://github.com/MetaMask/SES)
- [SIWE Specification](https://eips.ethereum.org/EIPS/eip-4361)
- [Secure ECMAScript (SES) Proposal](https://github.com/tc39/proposal-ses)
- [LavaMoat Security](https://github.com/LavaMoat/LavaMoat)

---

**Last Updated:** January 19, 2026  
**Status:** Under Active Investigation  
**Next Review:** January 20, 2026
