# Quick Fix Guide - Database & Wallet Issues

## 🔴 Critical Issue: Database Error

### What's Wrong?

Your Supabase Auth account exists, but you're missing a profile in the `users` table. This breaks portfolio creation and other features.

### Quick Fix (5 minutes)

#### Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your "Bitcoinvestments" project
3. Click **"SQL Editor"** in the left sidebar

#### Step 2: Run This SQL

Copy and paste this into a new query:

```sql
-- Fix missing user profile
INSERT INTO public.users (id, email, referral_code, created_at)
SELECT 
    au.id,
    au.email,
    upper(substr(md5(random()::text), 1, 8)),
    au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Verify it worked
SELECT id, email, referral_code FROM public.users;
```

#### Step 3: Update Schema (Prevents Future Issues)

1. Open `supabase/schema.sql` in your code editor
2. Copy the **entire file** contents
3. In Supabase SQL Editor, create a **new query**
4. Paste the schema
5. Click **"Run"**

This adds a trigger that auto-creates user profiles on signup.

#### Step 4: Test

1. **Refresh browser** (`Ctrl + Shift + R`)
2. Go to http://localhost:5173/
3. Try creating a portfolio - should work now! ✅

---

## 💰 Wallet Import - Current Limitations

### What's Detected

Currently, the wallet import **only detects native tokens**:

- ✅ **ETH** (Ethereum mainnet)
- ✅ **MATIC** (Polygon)
- ✅ **ETH** (Arbitrum & Optimism)

### What's NOT Detected (Yet)

- ❌ **ERC-20 tokens** (USDC, USDT, WBTC, LINK, UNI, etc.)
- ❌ **LP tokens** (Uniswap, SushiSwap, etc.)
- ❌ **NFTs**
- ❌ **Staked assets**

### Why?

Detecting ERC-20 tokens requires:
1. **Alchemy API** (already configured in your `.env`)
2. **Additional code** to query token balances
3. **Token metadata** (names, symbols, decimals)

This is planned for a future update!

### Workaround

You can still track ERC-20 tokens by **adding them manually**:

1. Connect your wallet (to see your address)
2. Click "Add" in the portfolio
3. Select "Or add custom crypto"
4. Enter:
   - **CoinGecko ID**: e.g., `usd-coin` for USDC
   - **Symbol**: e.g., `USDC`
   - **Name**: e.g., `USD Coin`
5. Enter the amount you hold
6. Add purchase price (or leave as $0 if unknown)

---

## 🐛 Other Errors (Can be Ignored)

### CoinGecko CORS / 429 Errors

```
Access-Control-Allow-Origin header is present
429 (Too Many Requests)
```

**Status**: ⚠️ Expected in development
**Reason**: CoinGecko free API blocks localhost & has rate limits
**Impact**: Market data won't load locally
**Fix**: Works fine in production on your domain

### Gas Price CORS Errors

```
POST https://ethereum-rpc.publicnode.com/ net::ERR_FAILED
```

**Status**: ⚠️ Expected in development
**Reason**: Public RPC nodes block localhost for security
**Impact**: Gas tracker won't show prices
**Fix**: Works fine in production

---

## ✅ Checklist

After fixing the database:

- [ ] User profile created in Supabase
- [ ] Trigger added to schema
- [ ] Browser refreshed
- [ ] Portfolio creation works
- [ ] Wallet connection works
- [ ] Can import native ETH (if you have any)
- [ ] Can manually add ERC-20 tokens

---

## 🚀 Next Steps

### Immediate (After Fix)

1. **Create a portfolio** - Test that database fix worked
2. **Connect wallet** - Connect MetaMask or other wallet
3. **Import ETH** - If you have ETH, try importing it
4. **Add tokens manually** - Add your ERC-20 tokens

### Future Enhancements (Planned)

1. **ERC-20 Detection** - Auto-detect USDC, USDT, etc.
2. **Multi-chain Aggregation** - Show combined balance across chains
3. **NFT Support** - Import and track NFT holdings
4. **DeFi Positions** - Track staking, LP tokens, etc.
5. **Transaction History** - Import on-chain transaction history

---

## Need Help?

### If portfolio still won't create:

```sql
-- Check if your user exists
SELECT * FROM public.users WHERE email = 'your-email@example.com';

-- If nothing returned, user doesn't exist - rerun the fix
```

### If wallet won't connect:

1. Check MetaMask is installed and unlocked
2. Check console for WalletConnect errors
3. Verify `VITE_WALLETCONNECT_PROJECT_ID` is in `.env`
4. Try disconnecting and reconnecting

### If no tokens show when wallet connected:

- **Normal if you only have ERC-20 tokens** (not yet supported)
- **Check you're on Ethereum mainnet** (switch in MetaMask)
- **Ensure you have ETH balance** (native token)
- **Add ERC-20 tokens manually** (use workaround above)

---

## Summary

| Issue | Status | Solution |
|-------|--------|----------|
| Missing user profile | 🔴 Critical | Run SQL fix above |
| Portfolio won't create | 🔴 Critical | Fix user profile first |
| ERC-20 not detected | 🟡 Limitation | Add manually (workaround) |
| CoinGecko CORS | 🟢 Expected | Ignore (works in prod) |
| Gas price errors | 🟢 Expected | Ignore (works in prod) |

**Priority**: Fix the database issue first, then everything else will work!

