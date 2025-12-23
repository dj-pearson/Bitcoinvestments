/**
 * Whale Wallet Tracking Service
 *
 * Track and get alerts on major wallet movements (whales).
 * Free users: 24h delayed data, 3 alerts, top 10 whales
 * Premium: real-time, unlimited alerts, custom tracking
 */

import type {
  WhaleWallet,
  WhaleTransaction,
  WhaleAlert,
  WhaleActivity,
  WhaleAlertType,
  WhaleCategory,
} from '../types/premiumFeatures';

// Mock whale wallets data
const mockWhaleWallets: WhaleWallet[] = [
  { id: 'w1', address: '0x28C6c06298d514Db089934071355E5743bf21d60', chain: 'ethereum', label: 'Binance 14', category: 'exchange', entity_name: 'Binance', balance_usd: 5200000000, balance_btc: 120930, first_seen_at: '2019-01-15', last_activity_at: new Date().toISOString(), total_transactions: 45823, is_tracked: true, is_verified: true, tags: ['exchange', 'cex', 'binance'], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'w2', address: '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549', chain: 'ethereum', label: 'Binance 15', category: 'exchange', entity_name: 'Binance', balance_usd: 3800000000, balance_btc: 88372, first_seen_at: '2019-03-22', last_activity_at: new Date().toISOString(), total_transactions: 32156, is_tracked: true, is_verified: true, tags: ['exchange', 'cex', 'binance'], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'w3', address: 'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97', chain: 'bitcoin', label: 'Bitfinex Cold Wallet', category: 'exchange', entity_name: 'Bitfinex', balance_usd: 2100000000, balance_btc: 48837, first_seen_at: '2017-08-10', last_activity_at: new Date(Date.now() - 86400000).toISOString(), total_transactions: 8923, is_tracked: true, is_verified: true, tags: ['exchange', 'cex', 'cold-wallet'], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'w4', address: '0x8103683202aa8DA10536036EDef04CDd865c225E', chain: 'ethereum', label: 'Unknown Whale', category: 'whale', entity_name: null, balance_usd: 890000000, balance_btc: 20698, first_seen_at: '2020-05-18', last_activity_at: new Date().toISOString(), total_transactions: 1256, is_tracked: true, is_verified: false, tags: ['whale', 'accumulator'], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'w5', address: '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8', chain: 'ethereum', label: 'Binance Hot Wallet', category: 'exchange', entity_name: 'Binance', balance_usd: 4500000000, balance_btc: 104651, first_seen_at: '2018-07-12', last_activity_at: new Date().toISOString(), total_transactions: 156789, is_tracked: true, is_verified: true, tags: ['exchange', 'cex', 'hot-wallet'], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'w6', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f62812', chain: 'ethereum', label: 'MicroStrategy', category: 'institution', entity_name: 'MicroStrategy Inc.', balance_usd: 4200000000, balance_btc: 97674, first_seen_at: '2020-08-11', last_activity_at: new Date(Date.now() - 172800000).toISOString(), total_transactions: 89, is_tracked: true, is_verified: true, tags: ['institution', 'corporate', 'hodler'], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'w7', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', chain: 'bitcoin', label: 'Marathon Digital', category: 'miner', entity_name: 'Marathon Digital Holdings', balance_usd: 520000000, balance_btc: 12093, first_seen_at: '2021-01-15', last_activity_at: new Date().toISOString(), total_transactions: 2345, is_tracked: true, is_verified: true, tags: ['miner', 'corporate'], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'w8', address: '0xDef1C0ded9bec7F1a1670819833240f027b25EfF', chain: 'ethereum', label: '0x Protocol', category: 'smart_money', entity_name: '0x Labs', balance_usd: 180000000, balance_btc: 4186, first_seen_at: '2019-06-20', last_activity_at: new Date().toISOString(), total_transactions: 45678, is_tracked: true, is_verified: true, tags: ['defi', 'smart-money', 'protocol'], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

// Mock recent whale transactions
const mockTransactions: WhaleTransaction[] = [
  { id: 't1', tx_hash: '0x1234...abcd', chain: 'ethereum', block_number: 18500000, timestamp: new Date(Date.now() - 1800000).toISOString(), from_address: '0x28C6c06298d514Db089934071355E5743bf21d60', from_label: 'Binance 14', from_category: 'exchange', to_address: '0x8103683202aa8DA10536036EDef04CDd865c225E', to_label: 'Unknown Whale', to_category: 'whale', asset_symbol: 'ETH', amount: 10000, amount_usd: 24000000, transaction_type: 'exchange_withdrawal', significance_score: 85, is_notable: true, created_at: new Date().toISOString() },
  { id: 't2', tx_hash: '0x5678...efgh', chain: 'ethereum', block_number: 18499980, timestamp: new Date(Date.now() - 3600000).toISOString(), from_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f62812', from_label: 'MicroStrategy', from_category: 'institution', to_address: '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8', to_label: 'Binance Hot Wallet', to_category: 'exchange', asset_symbol: 'BTC', amount: 500, amount_usd: 21500000, transaction_type: 'exchange_deposit', significance_score: 92, is_notable: true, created_at: new Date().toISOString() },
  { id: 't3', tx_hash: '0x9abc...ijkl', chain: 'bitcoin', block_number: 820000, timestamp: new Date(Date.now() - 7200000).toISOString(), from_address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', from_label: 'Marathon Digital', from_category: 'miner', to_address: '0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549', to_label: 'Binance 15', to_category: 'exchange', asset_symbol: 'BTC', amount: 1000, amount_usd: 43000000, transaction_type: 'large_transfer', significance_score: 88, is_notable: true, created_at: new Date().toISOString() },
  { id: 't4', tx_hash: '0xdef0...mnop', chain: 'ethereum', block_number: 18499950, timestamp: new Date(Date.now() - 14400000).toISOString(), from_address: '0x8103683202aa8DA10536036EDef04CDd865c225E', from_label: 'Unknown Whale', from_category: 'whale', to_address: 'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97', to_label: 'Bitfinex Cold Wallet', to_category: 'exchange', asset_symbol: 'ETH', amount: 5000, amount_usd: 12000000, transaction_type: 'exchange_deposit', significance_score: 78, is_notable: true, created_at: new Date().toISOString() },
  { id: 't5', tx_hash: '0x1111...qrst', chain: 'ethereum', block_number: 18499900, timestamp: new Date(Date.now() - 28800000).toISOString(), from_address: '0xDef1C0ded9bec7F1a1670819833240f027b25EfF', from_label: '0x Protocol', from_category: 'smart_money', to_address: '0x8103683202aa8DA10536036EDef04CDd865c225E', to_label: 'Unknown Whale', to_category: 'whale', asset_symbol: 'USDC', amount: 50000000, amount_usd: 50000000, transaction_type: 'accumulation', significance_score: 72, is_notable: false, created_at: new Date().toISOString() },
];

/**
 * Get whale wallets (limited for free tier)
 */
export async function getWhaleWallets(
  isPremium: boolean = false,
  options?: {
    chain?: string;
    category?: WhaleCategory;
    limit?: number;
  }
): Promise<WhaleWallet[]> {
  let wallets = [...mockWhaleWallets];

  if (options?.chain) {
    wallets = wallets.filter(w => w.chain === options.chain);
  }

  if (options?.category) {
    wallets = wallets.filter(w => w.category === options.category);
  }

  // Sort by balance
  wallets.sort((a, b) => b.balance_usd - a.balance_usd);

  if (!isPremium) {
    // Free users only see top 10
    return wallets.slice(0, 10);
  }

  return wallets.slice(0, options?.limit || 100);
}

/**
 * Get whale transactions (delayed for free tier)
 */
export async function getWhaleTransactions(
  isPremium: boolean = false,
  options?: {
    chain?: string;
    minAmountUsd?: number;
    type?: WhaleAlertType;
    limit?: number;
  }
): Promise<WhaleTransaction[]> {
  let transactions = [...mockTransactions];

  if (options?.chain) {
    transactions = transactions.filter(t => t.chain === options.chain);
  }

  if (options?.minAmountUsd) {
    transactions = transactions.filter(t => t.amount_usd >= options.minAmountUsd!);
  }

  if (options?.type) {
    transactions = transactions.filter(t => t.transaction_type === options.type);
  }

  if (!isPremium) {
    // Free users get 24h delayed data
    const delayMs = 24 * 60 * 60 * 1000;
    transactions = transactions.map(t => ({
      ...t,
      timestamp: new Date(new Date(t.timestamp).getTime() - delayMs).toISOString(),
    }));
  }

  return transactions.slice(0, options?.limit || 50);
}

/**
 * Get whale activity summary for a chain
 */
export async function getWhaleActivity(
  chain: string = 'ethereum',
  isPremium: boolean = false
): Promise<WhaleActivity> {
  const transactions = await getWhaleTransactions(isPremium, { chain });

  const totalVolume = transactions.reduce((sum, t) => sum + t.amount_usd, 0);

  // Calculate net exchange flow
  let exchangeDeposits = 0;
  let exchangeWithdrawals = 0;

  transactions.forEach(t => {
    if (t.transaction_type === 'exchange_deposit') {
      exchangeDeposits += t.amount_usd;
    } else if (t.transaction_type === 'exchange_withdrawal') {
      exchangeWithdrawals += t.amount_usd;
    }
  });

  const netExchangeFlow = exchangeDeposits - exchangeWithdrawals;

  // Determine sentiment
  let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let sentimentScore = 0;

  if (netExchangeFlow < -10000000) {
    sentiment = 'bullish'; // More withdrawals = accumulation
    sentimentScore = Math.min(100, Math.abs(netExchangeFlow) / 1000000);
  } else if (netExchangeFlow > 10000000) {
    sentiment = 'bearish'; // More deposits = potential selling
    sentimentScore = -Math.min(100, netExchangeFlow / 1000000);
  }

  const accumulationCount = transactions.filter(t => t.transaction_type === 'accumulation').length;
  const distributionCount = transactions.filter(t => t.transaction_type === 'distribution').length;

  return {
    chain,
    total_volume_24h: totalVolume,
    net_exchange_flow: netExchangeFlow,
    large_transactions_count: transactions.length,
    accumulation_addresses: accumulationCount,
    distribution_addresses: distributionCount,
    sentiment,
    sentiment_score: sentimentScore,
    notable_transactions: transactions.filter(t => t.is_notable),
  };
}

/**
 * Create a whale alert
 */
export async function createWhaleAlert(
  userId: string,
  alert: Omit<WhaleAlert, 'id' | 'user_id' | 'triggered_count' | 'last_triggered_at' | 'created_at' | 'updated_at'>
): Promise<WhaleAlert> {
  const newAlert: WhaleAlert = {
    id: `alert-${Date.now()}`,
    user_id: userId,
    ...alert,
    triggered_count: 0,
    last_triggered_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // In production, this would save to database
  return newAlert;
}

/**
 * Get user's whale alerts
 */
export async function getUserWhaleAlerts(
  userId: string,
  isPremium: boolean = false
): Promise<WhaleAlert[]> {
  // Mock alerts
  const mockAlerts: WhaleAlert[] = [
    {
      id: 'alert-1',
      user_id: userId,
      chain: 'ethereum',
      asset_symbol: null,
      alert_type: ['large_transfer', 'exchange_deposit'],
      min_amount_usd: 10000000,
      specific_addresses: [],
      categories: ['whale', 'institution'],
      is_active: true,
      notify_email: true,
      notify_push: true,
      cooldown_minutes: 60,
      triggered_count: 5,
      last_triggered_at: new Date(Date.now() - 3600000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'alert-2',
      user_id: userId,
      chain: 'bitcoin',
      asset_symbol: 'BTC',
      alert_type: ['exchange_withdrawal'],
      min_amount_usd: 50000000,
      specific_addresses: [],
      categories: ['exchange'],
      is_active: true,
      notify_email: true,
      notify_push: false,
      cooldown_minutes: 120,
      triggered_count: 2,
      last_triggered_at: new Date(Date.now() - 86400000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  if (!isPremium) {
    return mockAlerts.slice(0, 3); // Free users limited to 3 alerts
  }

  return mockAlerts;
}

/**
 * Track a specific wallet
 */
export async function trackWallet(
  _userId: string,
  address: string,
  chain: string,
  label?: string
): Promise<WhaleWallet> {
  // In production, this would add to user's tracked wallets
  return {
    id: `tracked-${Date.now()}`,
    address,
    chain,
    label: label || 'Custom Tracked Wallet',
    category: 'unknown',
    entity_name: null,
    balance_usd: 0, // Would be fetched from blockchain
    balance_btc: 0,
    first_seen_at: new Date().toISOString(),
    last_activity_at: new Date().toISOString(),
    total_transactions: 0,
    is_tracked: true,
    is_verified: false,
    tags: ['custom', 'user-tracked'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Get whale wallet by address
 */
export async function getWalletByAddress(
  address: string
): Promise<WhaleWallet | null> {
  return mockWhaleWallets.find(w => w.address.toLowerCase() === address.toLowerCase()) || null;
}
