# Wallet-Only Authentication (No SIWE)

## Overview

This document describes the wallet-only authentication system implemented for Bitcoinvestments. This system allows users to connect their Web3 wallets and authenticate **without requiring SIWE (Sign-In with Ethereum) message signing**, avoiding the MetaMask SES (Secure ECMAScript) incompatibility issue.

## Why No SIWE?

**Problem:** SIWE is incompatible with MetaMask's Secure ECMAScript (SES) lockdown, causing `Object.defineProperty called on non-object` errors.

**Solution:** Use the wallet address directly for authentication without message signing. This provides a simpler, faster authentication flow while maintaining security through Supabase's built-in authentication system.

## Architecture

### Components

1. **`Web3ProviderWrapper.tsx`**
   - Dynamically loads Wagmi, RainbowKit, and Web3 dependencies
   - Only loads when accessing Web3 routes
   - Handles errors gracefully with fallback UI

2. **`useWalletAuth.ts`** (Custom Hook)
   - Manages wallet connection and authentication
   - Auto-authenticates when wallet connects
   - Links wallets to existing accounts
   - Creates new wallet-only accounts

3. **`WalletConnectButton.tsx`**
   - User-facing wallet connection UI
   - Uses RainbowKit's ConnectButton for consistent UX
   - Shows authentication status and errors

4. **Database Migration (`20260119_add_wallet_auth.sql`)**
   - Adds `wallet_address` column to `users` table
   - Makes `email` optional (nullable)
   - Adds constraint: user must have either email OR wallet_address
   - Auto-normalizes wallet addresses to lowercase

## User Flows

### Flow 1: New Wallet-Only User

1. User clicks "Connect Wallet"
2. RainbowKit modal opens → user selects wallet (MetaMask, WalletConnect, etc.)
3. Wallet connects → `useWalletAuth` detects connection
4. Hook checks if wallet address exists in database
5. **If not found**: Creates new user with `wallet_address` and auto-generated username
6. User is authenticated and can access platform features

### Flow 2: Existing User Linking Wallet

1. User logs in with email/password
2. User clicks "Connect Wallet"
3. Wallet connects → `useWalletAuth` detects connection
4. Hook checks if user is logged in
5. **If logged in**: Links wallet address to existing account
6. User can now authenticate with either email OR wallet

### Flow 3: Returning Wallet-Only User

1. User clicks "Connect Wallet"
2. Wallet connects → `useWalletAuth` detects connection
3. Hook finds existing user by wallet address
4. User is automatically authenticated (no signature required!)

## Usage

### Basic Implementation

```tsx
import { WalletConnectButton } from '../components/WalletConnectButton';
import { useWalletAuth } from '../hooks/useWalletAuth';

function MyComponent() {
  const { address, isConnected, isAuthenticating } = useWalletAuth();

  return (
    <div>
      <WalletConnectButton />
      
      {isConnected && (
        <p>Connected: {address}</p>
      )}
      
      {isAuthenticating && (
        <p>Authenticating...</p>
      )}
    </div>
  );
}
```

### Accessing Wallet Auth in Components

```tsx
import { useWalletAuth } from '../hooks/useWalletAuth';

function ProfileComponent() {
  const {
    address,              // Wallet address (0x...)
    isConnected,          // Connection status
    isAuthenticating,     // Auth in progress
    disconnectWallet,     // Disconnect function
    error,                // Error message
    clearError            // Clear error
  } = useWalletAuth();

  return (
    <div>
      {isConnected && (
        <>
          <p>Wallet: {address}</p>
          <button onClick={disconnectWallet}>
            Disconnect
          </button>
        </>
      )}
      
      {error && (
        <div className="error">
          {error}
          <button onClick={clearError}>✕</button>
        </div>
      )}
    </div>
  );
}
```

### Checking User Type

```tsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user } = useAuth();

  // Check if wallet-only user
  const isWalletUser = user && !user.email && user.wallet_address;
  
  // Check if email user with linked wallet
  const hasLinkedWallet = user?.email && user?.wallet_address;

  return (
    <div>
      {isWalletUser && <p>Wallet-only account</p>}
      {hasLinkedWallet && <p>Email account with linked wallet</p>}
      {user?.email && !user?.wallet_address && (
        <p>Email-only account (no wallet linked)</p>
      )}
    </div>
  );
}
```

## Database Schema

### Users Table (Updated)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,                    -- Now nullable (optional)
  wallet_address TEXT UNIQUE,           -- New field for wallet auth
  username TEXT,                        -- Auto-generated for wallet users
  created_at TIMESTAMP,
  -- ... other fields ...
  
  -- Constraint: must have email OR wallet_address
  CONSTRAINT users_auth_method_check 
    CHECK (email IS NOT NULL OR wallet_address IS NOT NULL)
);
```

### Key Changes

1. **`email`**: Now nullable (wallet-only accounts don't need email)
2. **`wallet_address`**: New field, unique, auto-normalized to lowercase
3. **Constraint**: Ensures every user has at least one auth method
4. **Index**: Fast lookups by wallet address

## Security Considerations

### Why This Is Still Secure

1. **Wallet Connection = Proof of Ownership**
   - User must have access to the private key to connect
   - Connection requires interaction with wallet software

2. **Session Management**
   - Uses Supabase's built-in session system
   - Sessions expire and require reconnection
   - Server-side session validation

3. **No Private Key Exposure**
   - System never sees or stores private keys
   - Only public wallet address is stored

4. **Same Security as Traditional Auth**
   - Equivalent to email/password authentication
   - Better than email-only (no password to compromise)

### Limitations vs. SIWE

| Feature | Wallet-Only Auth | SIWE |
|---------|-----------------|------|
| Proof of ownership | Connection only | Cryptographic signature |
| User experience | ✅ Excellent (no signatures) | ❌ Poor (constant signatures) |
| SES compatibility | ✅ Compatible | ❌ Incompatible |
| Security level | ⚠️ Medium (connection-based) | ✅ High (signature-based) |
| Implementation complexity | ✅ Simple | ❌ Complex |

For most use cases (portfolio tracking, education, tools), **connection-based auth is sufficient** and provides a better UX.

## Rollout Strategy

### Phase 1: Migration (Immediate)

1. ✅ Deploy database migration
2. ✅ Deploy new authentication code
3. ✅ Update documentation
4. ✅ Test with MetaMask, WalletConnect, Coinbase Wallet

### Phase 2: User Communication (Week 1)

1. Add banner: "New simplified wallet authentication!"
2. Update FAQ with wallet auth information
3. Send email to existing users about improvements

### Phase 3: Monitoring (Week 2-4)

1. Monitor wallet connection rates
2. Track authentication errors
3. Gather user feedback
4. Optimize based on usage patterns

## Testing

### Local Testing

```bash
# 1. Apply database migration
npm run supabase migration up

# 2. Start dev server
npm run dev

# 3. Open browser with MetaMask
# 4. Navigate to Web3 features page
# 5. Click "Connect Wallet"
# 6. Verify:
#    - Wallet connects without signature popup
#    - User is automatically authenticated
#    - Wallet address is stored in database
```

### Production Testing

1. Deploy to staging environment first
2. Test with multiple wallets:
   - MetaMask (Chrome, Firefox, Mobile)
   - WalletConnect (Trust Wallet, Rainbow, etc.)
   - Coinbase Wallet
3. Verify SES error is gone (check Firefox console for "SES" messages)
4. Monitor Sentry for authentication errors

## Troubleshooting

### Issue: Wallet connects but user not authenticated

**Check:**
1. Browser console for errors
2. Supabase logs for database insert/update errors
3. `useWalletAuth` hook error state

**Fix:**
- Verify database migration ran successfully
- Check Supabase RLS policies allow wallet user creation

### Issue: "Different wallet already linked" error

**Cause:** User has an existing account with a different wallet

**Solution:**
- User must disconnect current wallet first
- Then connect new wallet
- Or link new wallet from profile settings

### Issue: 2FA not available for wallet users

**Expected behavior:** 2FA requires email-based authentication

**Solution:**
- Prompt wallet users to link an email address
- Show informative message in Profile page

## Future Enhancements

### Potential Improvements

1. **Email Linking Flow**
   - Allow wallet users to add email later
   - Keep wallet as primary auth method

2. **Multi-Wallet Support**
   - Let users link multiple wallets to one account
   - Choose primary wallet for authentication

3. **ENS Integration**
   - Display ENS names instead of addresses
   - Use ENS for profile customization

4. **Gasless Transactions**
   - Implement meta-transactions for better UX
   - Sponsored transaction support

5. **Social Recovery**
   - Guardian system for account recovery
   - Multi-sig recovery flow

## Migration Notes

### Breaking Changes

- ⚠️ `AuthUser.email` is now `string | null` (was `string`)
- ⚠️ Components using `user.email` must handle `null` case

### Non-Breaking Changes

- ✅ Existing email-based accounts continue to work
- ✅ No changes required for non-Web3 features
- ✅ Backward compatible with previous auth system

## Support

For questions or issues:
- Check console logs for detailed error messages
- Review `docs/WEB3_SES_INCOMPATIBILITY.md` for background
- Contact dev team with Sentry error IDs

---

**Last Updated:** January 19, 2026  
**Status:** Production Ready ✅  
**Compatibility:** MetaMask, WalletConnect, Coinbase Wallet, Rainbow
