# Wallet Integration Guide

## Overview

The Bitcoin Investments platform now supports **direct wallet integration** via **RainbowKit** and **Wagmi**, allowing users to:
- 🔗 Connect their MetaMask, WalletConnect, Coinbase Wallet, and other Web3 wallets
- 📥 Automatically import cryptocurrency holdings from their wallet
- 📊 Track real-time portfolio performance

## Features

### Supported Wallets

Thanks to RainbowKit, the following wallets are supported out of the box:
- **MetaMask** - Browser extension and mobile
- **WalletConnect** - Universal wallet connector
- **Coinbase Wallet** - Browser extension and mobile
- **Rainbow Wallet** - Mobile wallet
- **Trust Wallet** - Mobile wallet
- And many more...

### Supported Networks

Currently, the platform supports:
- **Ethereum Mainnet** (ETH)
- **Polygon** (MATIC)
- **Arbitrum** (ETH)
- **Optimism** (ETH)

Users can switch between networks, and their balances will update automatically.

### Token Support

**Native Tokens:**
- ✅ ETH (Ethereum)
- ✅ MATIC (Polygon)
- ✅ ETH (Arbitrum)
- ✅ ETH (Optimism)

**ERC-20 Tokens:**
- Can be easily extended to support any ERC-20 token
- Currently set up for common tokens (USDC, USDT, DAI, etc.)

## How It Works

### 1. Connect Wallet

Users click the "Import from Wallet" button, which opens a modal with a RainbowKit connect button.

```tsx
<ConnectButton />
```

### 2. Fetch Balances

Once connected, the app uses Wagmi hooks to fetch token balances:

```tsx
const { data: ethBalance } = useBalance({ address });
```

### 3. Select Tokens

Users can see all their token holdings and select which ones to import into their portfolio.

### 4. Import to Portfolio

Selected tokens are added to the portfolio:
- **Amount**: Current wallet balance
- **Purchase Price**: Set to $0 (unknown cost basis)
- **Current Price**: Fetched from CoinGecko API

Users can edit the purchase price later for accurate profit/loss tracking.

## Implementation Details

### Key Components

#### `WalletImport.tsx`
Main component that handles wallet connection and token import:
- Uses `useAccount()` to get connected wallet address
- Uses `useBalance()` to fetch token balances
- Integrates with portfolio service to add holdings

#### `WalletImportModal.tsx`
Modal wrapper for the wallet import component.

#### Updated `PortfolioTracker.tsx`
- Added "Import from Wallet" button
- Integrated WalletImportModal
- Shows wallet import option on portfolio creation

### Configuration

#### Environment Variables

Required in `.env`:

```env
# WalletConnect Project ID (get from https://cloud.walletconnect.com/)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Alchemy API Key (optional, for advanced features)
VITE_ALCHEMY_API_KEY=your_alchemy_key_here
```

Also add to `wrangler.toml` for production:

```toml
[vars]
VITE_WALLETCONNECT_PROJECT_ID = "your_project_id_here"
VITE_ALCHEMY_API_KEY = "your_alchemy_key_here"
```

#### Wagmi Config (`src/lib/wagmi.ts`)

```tsx
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, arbitrum, optimism } from 'wagmi/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'Bitcoin Investments',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
  chains: [mainnet, polygon, arbitrum, optimism],
  ssr: false,
});
```

#### App Providers (`src/App.tsx`)

The app is wrapped with necessary providers:

```tsx
<WagmiProvider config={wagmiConfig}>
  <QueryClientProvider client={queryClient}>
    <RainbowKitProvider>
      {/* App content */}
    </RainbowKitProvider>
  </QueryClientProvider>
</WagmiProvider>
```

## User Flow

### First-Time User

1. Navigate to Dashboard
2. See "Track Your Portfolio" card
3. Click **"Import from Wallet"**
4. Connect wallet (e.g., MetaMask)
5. Review token balances
6. Select tokens to import
7. Click **"Import X Tokens"**
8. Portfolio is created with wallet holdings

### Existing Portfolio User

1. Open Portfolio Tracker (full view)
2. Click **"Import"** button in header
3. Connect wallet
4. Select additional tokens
5. Import to existing portfolio

## Future Enhancements

### Planned Features

- [ ] **Multi-chain balance aggregation** - Show combined balance across all chains
- [ ] **ERC-20 token detection** - Auto-detect all ERC-20 tokens in wallet
- [ ] **NFT support** - Import and track NFT holdings
- [ ] **DeFi position tracking** - Track staking, liquidity pools, etc.
- [ ] **Historical balance tracking** - Track wallet balance over time
- [ ] **Transaction history import** - Import past transactions for cost basis
- [ ] **Multi-wallet support** - Connect and track multiple wallets

### Token Expansion

To add more ERC-20 tokens, update `SUPPORTED_TOKENS` in `WalletImport.tsx`:

```tsx
const SUPPORTED_TOKENS = [
  { 
    id: 'usd-coin', 
    symbol: 'USDC', 
    name: 'USD Coin',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6
  },
  // Add more tokens...
];
```

Then use `useToken()` hook to fetch ERC-20 balances.

## Testing

### Local Development

1. Install MetaMask or another Web3 wallet
2. Switch to a testnet (e.g., Sepolia)
3. Get testnet ETH from a faucet
4. Test the wallet connection and import flow

### Manual Testing Checklist

- [ ] Connect wallet successfully
- [ ] View correct balances for native token
- [ ] Select and deselect tokens
- [ ] Import tokens to portfolio
- [ ] Verify portfolio updates with correct amounts
- [ ] Disconnect wallet
- [ ] Reconnect wallet and verify state
- [ ] Switch networks and verify balance updates

## Troubleshooting

### "No projectId found" Error

**Solution**: Add your WalletConnect Project ID to `.env`:
1. Go to https://cloud.walletconnect.com/
2. Create a free project
3. Copy the Project ID
4. Add to `.env`: `VITE_WALLETCONNECT_PROJECT_ID=your_id_here`

### Wallet Not Connecting

**Solutions**:
- Ensure wallet extension is installed and unlocked
- Try switching networks in your wallet
- Clear browser cache and reload
- Check browser console for errors

### Balances Not Showing

**Solutions**:
- Verify you're on a supported network (Ethereum, Polygon, Arbitrum, Optimism)
- Check that wallet has tokens
- Try disconnecting and reconnecting wallet

### Import Button Disabled

**Causes**:
- No tokens selected
- Already imported (auto-closes after 2 seconds)
- No tokens found in wallet

## Security Considerations

### What We Access

- ✅ Wallet public address
- ✅ Token balances (read-only)
- ✅ Network information

### What We DON'T Access

- ❌ Private keys (never leave your wallet)
- ❌ Transaction signing (unless you explicitly approve)
- ❌ Spending permissions

### Best Practices

1. **Never share your seed phrase** - We will never ask for it
2. **Review transactions** - Always review before signing
3. **Use hardware wallets** - For maximum security
4. **Keep software updated** - Update wallet extensions regularly

## Resources

- [RainbowKit Documentation](https://www.rainbowkit.com/docs/introduction)
- [Wagmi Documentation](https://wagmi.sh/)
- [WalletConnect Cloud](https://cloud.walletconnect.com/)
- [MetaMask Documentation](https://docs.metamask.io/)

## Support

For issues or questions:
1. Check this documentation
2. Review console errors
3. Check environment variables
4. Verify wallet is connected to supported network

