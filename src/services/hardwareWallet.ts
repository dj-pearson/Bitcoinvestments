/**
 * Hardware Wallet Integration Service
 *
 * Premium feature at $14.99/month for tracking cold storage.
 * Supports Ledger, Trezor, KeepKey, and Coldcard devices.
 * Partner affiliate revenue from hardware sales.
 */

import type {
  HardwareWallet,
  HardwareWalletAddress,
  HardwareWalletHolding,
  HardwareWalletTransaction,
  HardwareWalletSubscription,
  HardwareWalletPortfolioSummary,
  HardwareWalletType,
} from '../types/premiumFeatures';
import { PREMIUM_FEATURES_PRICING } from '../types/premiumFeatures';

// Simulated data for demo purposes - in production, use actual APIs
const DEMO_WALLETS: HardwareWallet[] = [];
const DEMO_ADDRESSES: HardwareWalletAddress[] = [];

/**
 * Hardware Wallet Pricing Configuration
 */
export const HARDWARE_WALLET_PRICING = {
  monthly: {
    id: 'hardware-wallet-monthly',
    name: 'Hardware Wallet Integration',
    price: PREMIUM_FEATURES_PRICING.hardware_wallet.monthly,
    interval: 'month',
    features: [
      'Connect up to 2 hardware wallets',
      'Track 10 addresses per wallet',
      'Multi-chain support (ETH, BTC, Polygon, etc.)',
      'Real-time balance tracking',
      'Transaction history',
      'Portfolio analytics',
      'Export reports',
    ],
    stripePriceId: import.meta.env.VITE_STRIPE_HARDWARE_WALLET_MONTHLY || 'price_hw_monthly',
  },
  yearly: {
    id: 'hardware-wallet-yearly',
    name: 'Hardware Wallet Integration (Annual)',
    price: PREMIUM_FEATURES_PRICING.hardware_wallet.yearly,
    interval: 'year',
    savings: '17% off',
    features: [
      'Connect up to 5 hardware wallets',
      'Track 50 addresses per wallet',
      'Multi-chain support (ETH, BTC, Polygon, etc.)',
      'Real-time balance tracking',
      'Transaction history',
      'Portfolio analytics',
      'Priority sync',
      'Export reports',
      'Priority support',
    ],
    stripePriceId: import.meta.env.VITE_STRIPE_HARDWARE_WALLET_YEARLY || 'price_hw_yearly',
  },
} as const;

/**
 * Partner Affiliate Links for hardware wallet sales
 */
export const HARDWARE_WALLET_AFFILIATES = {
  ledger: {
    name: 'Ledger',
    affiliateUrl: 'https://shop.ledger.com/?r=bitcoinvestments',
    products: [
      { name: 'Ledger Nano S Plus', price: 79, url: 'https://shop.ledger.com/products/ledger-nano-s-plus' },
      { name: 'Ledger Nano X', price: 149, url: 'https://shop.ledger.com/products/ledger-nano-x' },
      { name: 'Ledger Stax', price: 279, url: 'https://shop.ledger.com/products/ledger-stax' },
    ],
    commission: 10, // 10% commission
  },
  trezor: {
    name: 'Trezor',
    affiliateUrl: 'https://trezor.io/?offer_id=bitcoinvestments',
    products: [
      { name: 'Trezor Model One', price: 69, url: 'https://trezor.io/trezor-model-one' },
      { name: 'Trezor Model T', price: 219, url: 'https://trezor.io/trezor-model-t' },
      { name: 'Trezor Safe 3', price: 79, url: 'https://trezor.io/trezor-safe-3' },
    ],
    commission: 12, // 12% commission
  },
} as const;

/**
 * Check if user has hardware wallet premium subscription
 */
export function hasHardwareWalletAccess(
  subscription?: HardwareWalletSubscription | null
): boolean {
  if (!subscription) return false;
  if (subscription.status !== 'active') return false;
  if (subscription.expires_at) {
    return new Date(subscription.expires_at) > new Date();
  }
  return true;
}

/**
 * Get subscription limits based on tier
 */
export function getHardwareWalletLimits(
  subscription?: HardwareWalletSubscription | null
): { maxDevices: number; maxAddresses: number } {
  if (!hasHardwareWalletAccess(subscription)) {
    return { maxDevices: 0, maxAddresses: 0 };
  }
  return {
    maxDevices: subscription?.max_devices || PREMIUM_FEATURES_PRICING.hardware_wallet.max_devices_basic,
    maxAddresses: subscription?.max_addresses || PREMIUM_FEATURES_PRICING.hardware_wallet.max_addresses_basic,
  };
}

/**
 * Get supported chains for a wallet type
 */
export function getSupportedChains(walletType: HardwareWalletType): string[] {
  const chains: Record<HardwareWalletType, readonly string[]> = {
    ledger: ['ethereum', 'bitcoin', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'bsc', 'solana'],
    trezor: ['ethereum', 'bitcoin', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'bsc'],
    keepkey: ['ethereum', 'bitcoin', 'polygon'],
    coldcard: ['bitcoin'],
  };
  return [...(chains[walletType] || [])];
}

/**
 * Detect connected hardware wallet (simulated for demo)
 * In production, this would use WebUSB/WebHID APIs
 */
export async function detectHardwareWallet(): Promise<{
  detected: boolean;
  type: HardwareWalletType | null;
  model: string | null;
  error: string | null;
}> {
  // Check if WebUSB is available
  if (!('usb' in navigator)) {
    return {
      detected: false,
      type: null,
      model: null,
      error: 'WebUSB is not supported in this browser. Please use Chrome or Edge.',
    };
  }

  try {
    // In production, this would request USB device access
    // For demo, we simulate a detection delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulated - no actual device connected in demo
    return {
      detected: false,
      type: null,
      model: null,
      error: 'No hardware wallet detected. Please connect your device and try again.',
    };
  } catch (error) {
    return {
      detected: false,
      type: null,
      model: null,
      error: error instanceof Error ? error.message : 'Failed to detect hardware wallet',
    };
  }
}

/**
 * Add a hardware wallet manually by entering addresses
 */
export async function addHardwareWalletManually(
  userId: string,
  walletType: HardwareWalletType,
  deviceName: string,
  addresses: { address: string; chain: string; label?: string }[]
): Promise<{
  wallet: HardwareWallet | null;
  addresses: HardwareWalletAddress[];
  error: string | null;
}> {
  // Validate addresses
  for (const addr of addresses) {
    if (!isValidAddress(addr.address, addr.chain)) {
      return {
        wallet: null,
        addresses: [],
        error: `Invalid ${addr.chain} address: ${addr.address}`,
      };
    }
  }

  // Create wallet entry
  const wallet: HardwareWallet = {
    id: `hw_${Date.now()}`,
    user_id: userId,
    wallet_type: walletType,
    device_id: null,
    device_name: deviceName,
    firmware_version: null,
    model: null,
    serial_number_hash: null,
    connected_at: null,
    last_synced_at: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Create address entries
  const walletAddresses: HardwareWalletAddress[] = addresses.map((addr, index) => ({
    id: `hwaddr_${Date.now()}_${index}`,
    hardware_wallet_id: wallet.id,
    address: addr.address,
    chain: addr.chain,
    derivation_path: getDefaultDerivationPath(addr.chain, index),
    address_index: index,
    label: addr.label || null,
    is_primary: index === 0,
    balance: null,
    balance_usd: null,
    last_synced_at: null,
    created_at: new Date().toISOString(),
  }));

  // In production, save to database
  DEMO_WALLETS.push(wallet);
  DEMO_ADDRESSES.push(...walletAddresses);

  return { wallet, addresses: walletAddresses, error: null };
}

/**
 * Validate blockchain address format
 */
function isValidAddress(address: string, chain: string): boolean {
  switch (chain) {
    case 'ethereum':
    case 'polygon':
    case 'arbitrum':
    case 'optimism':
    case 'avalanche':
    case 'bsc':
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    case 'bitcoin':
      return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address);
    case 'solana':
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    default:
      return false;
  }
}

/**
 * Get default derivation path for a chain
 */
function getDefaultDerivationPath(chain: string, index: number): string {
  switch (chain) {
    case 'ethereum':
    case 'polygon':
    case 'arbitrum':
    case 'optimism':
    case 'avalanche':
    case 'bsc':
      return `m/44'/60'/0'/0/${index}`;
    case 'bitcoin':
      return `m/84'/0'/0'/0/${index}`;
    case 'solana':
      return `m/44'/501'/${index}'/0'`;
    default:
      return `m/44'/0'/0'/0/${index}`;
  }
}

/**
 * Sync wallet balances from blockchain
 */
export async function syncWalletBalances(
  walletId: string
): Promise<{
  holdings: HardwareWalletHolding[];
  totalValueUsd: number;
  error: string | null;
}> {
  // Find wallet addresses
  const addresses = DEMO_ADDRESSES.filter(a => a.hardware_wallet_id === walletId);

  if (addresses.length === 0) {
    return { holdings: [], totalValueUsd: 0, error: 'No addresses found for wallet' };
  }

  // In production, fetch from blockchain APIs (Alchemy, Moralis, etc.)
  // For demo, return sample data
  const holdings: HardwareWalletHolding[] = addresses.map(addr => ({
    id: `holding_${addr.id}`,
    wallet_address_id: addr.id,
    asset_symbol: addr.chain === 'bitcoin' ? 'BTC' : 'ETH',
    asset_name: addr.chain === 'bitcoin' ? 'Bitcoin' : 'Ethereum',
    chain: addr.chain,
    contract_address: null,
    balance: Math.random() * 2,
    balance_usd: Math.random() * 5000,
    price_usd: addr.chain === 'bitcoin' ? 45000 : 2500,
    price_change_24h: (Math.random() - 0.5) * 10,
    last_updated_at: new Date().toISOString(),
  }));

  const totalValueUsd = holdings.reduce((sum, h) => sum + (h.balance_usd || 0), 0);

  return { holdings, totalValueUsd, error: null };
}

/**
 * Get transaction history for a wallet address
 */
export async function getTransactionHistory(
  addressId: string,
  _limit: number = 50
): Promise<{
  transactions: HardwareWalletTransaction[];
  error: string | null;
}> {
  const address = DEMO_ADDRESSES.find(a => a.id === addressId);

  if (!address) {
    return { transactions: [], error: 'Address not found' };
  }

  // In production, fetch from blockchain APIs
  // For demo, return sample transactions
  const transactions: HardwareWalletTransaction[] = Array.from({ length: 5 }, (_, i) => ({
    id: `tx_${addressId}_${i}`,
    wallet_address_id: addressId,
    tx_hash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
    chain: address.chain,
    block_number: 18000000 - i * 1000,
    timestamp: new Date(Date.now() - i * 86400000).toISOString(),
    from_address: i % 2 === 0 ? address.address : '0x' + 'a'.repeat(40),
    to_address: i % 2 === 0 ? '0x' + 'b'.repeat(40) : address.address,
    asset_symbol: address.chain === 'bitcoin' ? 'BTC' : 'ETH',
    asset_name: address.chain === 'bitcoin' ? 'Bitcoin' : 'Ethereum',
    amount: Math.random() * 0.5,
    amount_usd: Math.random() * 1000,
    fee: 0.001,
    fee_usd: 2.5,
    tx_type: i % 2 === 0 ? 'send' : 'receive',
    status: 'confirmed',
    created_at: new Date().toISOString(),
  }));

  return { transactions, error: null };
}

/**
 * Get portfolio summary for all connected wallets
 */
export async function getPortfolioSummary(
  userId: string
): Promise<HardwareWalletPortfolioSummary> {
  const wallets = DEMO_WALLETS.filter(w => w.user_id === userId && w.is_active);
  const addresses = DEMO_ADDRESSES.filter(a =>
    wallets.some(w => w.id === a.hardware_wallet_id)
  );

  // Calculate totals (demo data)
  const totalValueUsd = 25000 + Math.random() * 10000;
  const change24h = (Math.random() - 0.5) * 2000;

  return {
    total_value_usd: totalValueUsd,
    total_change_24h: change24h,
    total_change_24h_percent: (change24h / totalValueUsd) * 100,
    wallets_connected: wallets.length,
    total_addresses: addresses.length,
    holdings_by_chain: [
      { chain: 'ethereum', value_usd: totalValueUsd * 0.6, percentage: 60 },
      { chain: 'bitcoin', value_usd: totalValueUsd * 0.3, percentage: 30 },
      { chain: 'polygon', value_usd: totalValueUsd * 0.1, percentage: 10 },
    ],
    top_holdings: [],
    recent_transactions: [],
  };
}

/**
 * Get all user's hardware wallets
 */
export function getUserWallets(userId: string): HardwareWallet[] {
  return DEMO_WALLETS.filter(w => w.user_id === userId);
}

/**
 * Get addresses for a wallet
 */
export function getWalletAddresses(walletId: string): HardwareWalletAddress[] {
  return DEMO_ADDRESSES.filter(a => a.hardware_wallet_id === walletId);
}

/**
 * Remove a hardware wallet
 */
export async function removeWallet(walletId: string): Promise<{ success: boolean; error: string | null }> {
  const index = DEMO_WALLETS.findIndex(w => w.id === walletId);
  if (index === -1) {
    return { success: false, error: 'Wallet not found' };
  }

  // Remove wallet and its addresses
  DEMO_WALLETS.splice(index, 1);
  const addressesToRemove = DEMO_ADDRESSES.filter(a => a.hardware_wallet_id === walletId);
  addressesToRemove.forEach(addr => {
    const addrIndex = DEMO_ADDRESSES.indexOf(addr);
    if (addrIndex !== -1) DEMO_ADDRESSES.splice(addrIndex, 1);
  });

  return { success: true, error: null };
}

/**
 * Export wallet data for tax reporting
 */
export async function exportWalletData(
  userId: string,
  format: 'csv' | 'json' = 'csv'
): Promise<{ data: string; filename: string; error: string | null }> {
  const wallets = getUserWallets(userId);

  if (wallets.length === 0) {
    return { data: '', filename: '', error: 'No wallets found' };
  }

  // Gather all transactions
  const allTransactions: HardwareWalletTransaction[] = [];
  for (const wallet of wallets) {
    const addresses = getWalletAddresses(wallet.id);
    for (const addr of addresses) {
      const { transactions } = await getTransactionHistory(addr.id);
      allTransactions.push(...transactions);
    }
  }

  if (format === 'json') {
    return {
      data: JSON.stringify(allTransactions, null, 2),
      filename: `hardware_wallet_transactions_${new Date().toISOString().split('T')[0]}.json`,
      error: null,
    };
  }

  // CSV format
  const headers = ['Date', 'Type', 'Asset', 'Amount', 'Value (USD)', 'From', 'To', 'TX Hash', 'Chain'];
  const rows = allTransactions.map(tx => [
    tx.timestamp,
    tx.tx_type,
    tx.asset_symbol,
    tx.amount.toString(),
    tx.amount_usd?.toString() || '',
    tx.from_address,
    tx.to_address,
    tx.tx_hash,
    tx.chain,
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  return {
    data: csv,
    filename: `hardware_wallet_transactions_${new Date().toISOString().split('T')[0]}.csv`,
    error: null,
  };
}

/**
 * Track affiliate click for hardware wallet purchase
 */
export async function trackAffiliateClick(
  userId: string | null,
  walletBrand: 'ledger' | 'trezor',
  product: string
): Promise<void> {
  // In production, log to analytics/database
  console.log('Hardware wallet affiliate click:', { userId, walletBrand, product });
}
