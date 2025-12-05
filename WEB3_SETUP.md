# Web3 Features Setup Guide

This guide will help you set up and configure the Web3 features for the Bitcoin Investments application.

## Features Implemented

### 1. Transaction History Import (P1-High)
- **Description**: Import on-chain transactions for tax reporting and portfolio analysis
- **Multi-chain Support**: Ethereum, Polygon, Arbitrum, Optimism, Solana
- **API**: Alchemy for EVM chains, Solana RPC for Solana
- **Location**: `/web3` → Transaction Import tab

### 2. Web3 Authentication (P2-Medium)
- **Description**: Sign-In with Ethereum (SIWE) for wallet-based authentication
- **Features**: Parallel authentication (users can sign in with email OR wallet)
- **Standard**: EIP-4361 (Sign-In with Ethereum)
- **Location**: `/web3` → Web3 Authentication tab

### 3. Token Approval Manager (P3-Low)
- **Description**: View and revoke token approvals for connected wallets
- **Features**: Risk assessment, approval tracking, one-click revocation
- **Chains**: Ethereum, Polygon, Arbitrum, Optimism
- **Location**: `/web3` → Token Approvals tab

## Prerequisites

1. **Node.js 18+**
2. **Supabase Project** (already configured)
3. **Alchemy API Key** (for blockchain data)
4. **WalletConnect Project ID** (for wallet connections)

## Environment Variables Setup

Add the following to your `.env` file:

```bash
# Existing Supabase vars...
SUPABASE_ACCESS_TOKEN=your_existing_token

# Web3 Configuration (ADD THESE)
VITE_ALCHEMY_API_KEY=your_alchemy_api_key_here
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
```

### Getting API Keys

#### Alchemy API Key
1. Go to [https://www.alchemy.com/](https://www.alchemy.com/)
2. Sign up for a free account
3. Create a new app
4. Select networks: Ethereum, Polygon, Arbitrum, Optimism
5. Copy your API key
6. Add to `.env` as `VITE_ALCHEMY_API_KEY`

#### WalletConnect Project ID
1. Go to [https://cloud.walletconnect.com/](https://cloud.walletconnect.com/)
2. Sign up for a free account
3. Create a new project
4. Copy your Project ID
5. Add to `.env` as `VITE_WALLETCONNECT_PROJECT_ID`

## Database Migration

Run the following SQL migration in your Supabase SQL Editor:

```bash
# The migration file is located at:
supabase/migrations/20251204_add_web3_tables.sql
```

### Manual Migration Steps

1. Open Supabase Dashboard: [https://supabase.com/dashboard/project/YOUR_PROJECT_ID](https://supabase.com/dashboard)
2. Go to "SQL Editor"
3. Click "New Query"
4. Copy the contents of `supabase/migrations/20251204_add_web3_tables.sql`
5. Paste into the editor
6. Click "Run" to execute

This will create the following tables:
- `user_wallets` - Connected wallet addresses
- `transaction_syncs` - Transaction sync history
- `token_approvals` - Token approval tracking
- `wallet_auth_nonces` - SIWE authentication nonces

And extend:
- `transactions` - With blockchain-specific fields

## Cloudflare Environment Variables

For production deployment on Cloudflare Pages, add these environment variables:

1. Go to Cloudflare Dashboard → Pages → Your Project
2. Settings → Environment Variables
3. Add for both Production and Preview:
   - `VITE_ALCHEMY_API_KEY`
   - `VITE_WALLETCONNECT_PROJECT_ID`

## Testing the Features

### 1. Test Wallet Connection

```bash
# Start dev server
npm run dev

# Navigate to http://localhost:5173/web3

# Steps:
1. Click "Connect Wallet" button
2. Select MetaMask (or your preferred wallet)
3. Approve the connection
4. You should see your wallet address and balance
```

### 2. Test Transaction Import

```bash
# Prerequisites:
- Connected wallet (from step 1)
- Logged in with email account

# Steps:
1. Navigate to /web3
2. Go to "Transaction Import" tab
3. Your connected wallet should appear in the list
4. Click "Sync Transactions"
5. Wait for the import to complete
6. Check transaction count
```

### 3. Test Web3 Authentication

```bash
# Steps:
1. Navigate to /web3
2. Go to "Web3 Authentication" tab
3. Connect your wallet (if not already connected)
4. Click "Sign In with Wallet"
5. Sign the message in your wallet
6. You should be authenticated and see success message
```

### 4. Test Token Approval Manager

```bash
# Prerequisites:
- Connected wallet with some token approvals
- (You can create test approvals on Uniswap testnet)

# Steps:
1. Navigate to /web3
2. Go to "Token Approvals" tab
3. View existing approvals
4. Click "Revoke" on an approval
5. Confirm the transaction in your wallet
6. Approval should be marked as revoked
```

## File Structure

```
src/
├── components/
│   └── Web3/
│       ├── WalletConnect.tsx          # RainbowKit wallet connection
│       ├── TransactionImport.tsx      # Transaction history import UI
│       ├── Web3Auth.tsx               # SIWE authentication UI
│       ├── TokenApprovalManager.tsx   # Token approval management UI
│       └── index.ts                   # Exports
├── services/
│   ├── alchemy.ts                     # Alchemy API integration
│   ├── solana.ts                      # Solana blockchain integration
│   ├── walletSync.ts                  # Wallet transaction syncing
│   ├── siwe.ts                        # Sign-In with Ethereum
│   └── tokenApprovals.ts              # Token approval management
├── lib/
│   └── wagmi.ts                       # Wagmi & RainbowKit configuration
├── types/
│   └── web3-database.ts               # Web3 database type definitions
├── pages/
│   └── Web3Features.tsx               # Main Web3 features page
└── App.tsx                            # Updated with Web3 providers
```

## Dependencies Installed

```json
{
  "@rainbow-me/rainbowkit": "^2.x",
  "wagmi": "^2.x",
  "viem": "^2.x",
  "@tanstack/react-query": "^5.x",
  "alchemy-sdk": "latest",
  "siwe": "latest",
  "@solana/web3.js": "latest"
}
```

## Supported Networks

### EVM Chains (via Alchemy)
- Ethereum Mainnet (Chain ID: 1)
- Polygon (Chain ID: 137)
- Arbitrum (Chain ID: 42161)
- Optimism (Chain ID: 10)

### Non-EVM Chains
- Solana (via public RPC)

## Security Considerations

1. **API Keys**: Never commit API keys to git. Always use environment variables.
2. **RLS Policies**: Database tables have Row Level Security enabled. Users can only access their own data.
3. **SIWE Nonces**: Expire after 10 minutes and can only be used once.
4. **Token Approvals**: Always verify contract addresses before revoking approvals.

## Troubleshooting

### Issue: "No wallet provider found"
**Solution**: Install MetaMask or another Web3 wallet browser extension.

### Issue: "Failed to fetch transactions"
**Solution**:
- Check your Alchemy API key is correct
- Ensure you have credits remaining on your Alchemy account
- Verify the network is supported

### Issue: "Signature verification failed"
**Solution**:
- Ensure you're signing with the correct wallet
- Check that nonces are being generated properly
- Verify system time is correct (SIWE uses timestamps)

### Issue: "Database migration failed"
**Solution**:
- Check Supabase logs for error details
- Ensure you're running the migration as a database owner
- Verify no conflicting table names exist

## Development Tips

1. **Testing with Testnets**: Update `src/lib/wagmi.ts` to include testnets:
   ```typescript
   import { sepolia, polygonMumbai } from 'wagmi/chains';
   chains: [mainnet, sepolia, polygon, polygonMumbai, arbitrum, optimism]
   ```

2. **Debugging**: Enable verbose logging:
   ```typescript
   // In wagmi.ts
   export const wagmiConfig = getDefaultConfig({
     // ...existing config
     ssr: false,
     logger: {
       warn: console.warn,
       error: console.error,
     },
   });
   ```

3. **Rate Limiting**: Alchemy free tier limits:
   - 300M compute units per month
   - Consider implementing caching for production

## Production Checklist

- [ ] Environment variables set in Cloudflare Pages
- [ ] Database migrations run on production Supabase
- [ ] Alchemy API key has sufficient credits
- [ ] WalletConnect Project ID is from production project
- [ ] Test all features on production URL
- [ ] Monitor Alchemy usage dashboard
- [ ] Set up error tracking (e.g., Sentry)

## Support & Resources

- **RainbowKit Docs**: [https://rainbowkit.com](https://rainbowkit.com)
- **Wagmi Docs**: [https://wagmi.sh](https://wagmi.sh)
- **Alchemy Docs**: [https://docs.alchemy.com](https://docs.alchemy.com)
- **SIWE Spec**: [https://eips.ethereum.org/EIPS/eip-4361](https://eips.ethereum.org/EIPS/eip-4361)

## Next Steps

1. Obtain API keys from Alchemy and WalletConnect
2. Add environment variables
3. Run database migration
4. Test wallet connection locally
5. Deploy to production
6. Monitor usage and errors

## Notes

- The transaction import feature fetches the last 100 transactions by default. Adjust `maxCount` in `src/services/alchemy.ts` for more.
- Token approval detection is currently basic. For production, consider integrating with services like Revoke.cash API.
- Web3 authentication creates a Supabase account with a generated email. Users cannot log in via traditional email/password once they've used wallet auth (by design for parallel auth strategy).
