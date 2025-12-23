/**
 * Multi-Exchange Portfolio Aggregation Service
 *
 * Auto-sync portfolios across Coinbase, Binance, Kraken, and more via API.
 * Free users: manual entry only
 * Premium: automatic syncing for unlimited exchanges
 */

import type {
  SupportedExchange,
  ExchangeCredentials,
  ExchangeBalance,
  ExchangeTransaction,
  AggregatedPortfolio,
} from '../types/premiumFeatures';

// Mock data for demonstration
const mockExchangeBalances: Record<SupportedExchange, ExchangeBalance[]> = {
  coinbase: [
    { id: '1', exchange_credential_id: 'cred-1', exchange: 'coinbase', asset_symbol: 'BTC', asset_name: 'Bitcoin', available_balance: 0.5, locked_balance: 0, total_balance: 0.5, usd_value: 21500, btc_value: 0.5, last_updated_at: new Date().toISOString() },
    { id: '2', exchange_credential_id: 'cred-1', exchange: 'coinbase', asset_symbol: 'ETH', asset_name: 'Ethereum', available_balance: 5.2, locked_balance: 0, total_balance: 5.2, usd_value: 12480, btc_value: 0.29, last_updated_at: new Date().toISOString() },
  ],
  binance: [
    { id: '3', exchange_credential_id: 'cred-2', exchange: 'binance', asset_symbol: 'BTC', asset_name: 'Bitcoin', available_balance: 0.25, locked_balance: 0.1, total_balance: 0.35, usd_value: 15050, btc_value: 0.35, last_updated_at: new Date().toISOString() },
    { id: '4', exchange_credential_id: 'cred-2', exchange: 'binance', asset_symbol: 'SOL', asset_name: 'Solana', available_balance: 50, locked_balance: 0, total_balance: 50, usd_value: 5000, btc_value: 0.116, last_updated_at: new Date().toISOString() },
  ],
  kraken: [
    { id: '5', exchange_credential_id: 'cred-3', exchange: 'kraken', asset_symbol: 'ETH', asset_name: 'Ethereum', available_balance: 2.0, locked_balance: 0, total_balance: 2.0, usd_value: 4800, btc_value: 0.112, last_updated_at: new Date().toISOString() },
  ],
  gemini: [],
  kucoin: [],
  ftx: [],
  bitfinex: [],
  huobi: [],
  okx: [],
  bybit: [],
};

const mockTransactions: ExchangeTransaction[] = [
  { id: 't1', exchange_credential_id: 'cred-1', exchange: 'coinbase', transaction_id: 'tx-001', transaction_type: 'buy', asset_symbol: 'BTC', amount: 0.1, price_usd: 42000, fee: 5, fee_asset: 'USD', timestamp: new Date(Date.now() - 86400000).toISOString(), order_id: 'ord-001', pair: 'BTC-USD', side: 'buy', created_at: new Date().toISOString() },
  { id: 't2', exchange_credential_id: 'cred-2', exchange: 'binance', transaction_id: 'tx-002', transaction_type: 'trade', asset_symbol: 'ETH', amount: 1.5, price_usd: 2400, fee: 0.001, fee_asset: 'ETH', timestamp: new Date(Date.now() - 172800000).toISOString(), order_id: 'ord-002', pair: 'ETH-USDT', side: 'buy', created_at: new Date().toISOString() },
  { id: 't3', exchange_credential_id: 'cred-3', exchange: 'kraken', transaction_id: 'tx-003', transaction_type: 'deposit', asset_symbol: 'ETH', amount: 2.0, price_usd: null, fee: 0, fee_asset: 'ETH', timestamp: new Date(Date.now() - 259200000).toISOString(), order_id: null, pair: null, side: null, created_at: new Date().toISOString() },
];

/**
 * Get all connected exchange credentials for a user
 */
export async function getConnectedExchanges(userId: string): Promise<ExchangeCredentials[]> {
  // In production, this would fetch from database
  return [
    {
      id: 'cred-1',
      user_id: userId,
      exchange: 'coinbase',
      api_key_encrypted: '***',
      api_secret_encrypted: '***',
      permissions: ['read'],
      is_active: true,
      last_synced_at: new Date(Date.now() - 300000).toISOString(),
      connection_status: 'connected',
      error_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'cred-2',
      user_id: userId,
      exchange: 'binance',
      api_key_encrypted: '***',
      api_secret_encrypted: '***',
      permissions: ['read'],
      is_active: true,
      last_synced_at: new Date(Date.now() - 600000).toISOString(),
      connection_status: 'connected',
      error_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'cred-3',
      user_id: userId,
      exchange: 'kraken',
      api_key_encrypted: '***',
      api_secret_encrypted: '***',
      permissions: ['read'],
      is_active: true,
      last_synced_at: new Date(Date.now() - 900000).toISOString(),
      connection_status: 'connected',
      error_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

/**
 * Connect a new exchange with API credentials
 */
export async function connectExchange(
  _userId: string,
  _exchange: SupportedExchange,
  apiKey: string,
  apiSecret: string,
  _passphrase?: string
): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  // In production, this would:
  // 1. Encrypt the API credentials
  // 2. Test the connection
  // 3. Store in database
  // 4. Trigger initial sync

  // Simulate API validation
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (!apiKey || !apiSecret) {
    return { success: false, error: 'API key and secret are required' };
  }

  return {
    success: true,
    credentialId: `cred-${Date.now()}`,
  };
}

/**
 * Disconnect an exchange
 */
export async function disconnectExchange(_credentialId: string): Promise<boolean> {
  // In production, this would remove the credentials from database
  await new Promise(resolve => setTimeout(resolve, 500));
  return true;
}

/**
 * Sync balances for a specific exchange
 */
export async function syncExchangeBalances(
  _credentialId: string,
  exchange: SupportedExchange
): Promise<ExchangeBalance[]> {
  // In production, this would call the exchange API
  await new Promise(resolve => setTimeout(resolve, 1000));
  return mockExchangeBalances[exchange] || [];
}

/**
 * Get aggregated portfolio across all exchanges
 */
export async function getAggregatedPortfolio(userId: string): Promise<AggregatedPortfolio> {
  const credentials = await getConnectedExchanges(userId);

  // Aggregate balances from all exchanges
  const allBalances: ExchangeBalance[] = [];
  for (const cred of credentials) {
    const balances = mockExchangeBalances[cred.exchange] || [];
    allBalances.push(...balances);
  }

  // Calculate totals
  const totalValueUsd = allBalances.reduce((sum, b) => sum + b.usd_value, 0);
  const totalValueBtc = allBalances.reduce((sum, b) => sum + b.btc_value, 0);

  // Group by exchange
  const exchangeTotals = credentials.map(cred => {
    const exchangeBalances = allBalances.filter(b => b.exchange === cred.exchange);
    const exchangeValue = exchangeBalances.reduce((sum, b) => sum + b.usd_value, 0);
    return {
      exchange: cred.exchange,
      total_value_usd: exchangeValue,
      percentage: totalValueUsd > 0 ? (exchangeValue / totalValueUsd) * 100 : 0,
      connection_status: cred.connection_status,
      last_synced_at: cred.last_synced_at,
    };
  });

  // Group holdings by asset
  const holdingsByAsset = new Map<string, {
    asset_symbol: string;
    asset_name: string;
    total_balance: number;
    total_usd_value: number;
    by_exchange: { exchange: SupportedExchange; balance: number; usd_value: number }[];
  }>();

  for (const balance of allBalances) {
    const existing = holdingsByAsset.get(balance.asset_symbol);
    if (existing) {
      existing.total_balance += balance.total_balance;
      existing.total_usd_value += balance.usd_value;
      existing.by_exchange.push({
        exchange: balance.exchange,
        balance: balance.total_balance,
        usd_value: balance.usd_value,
      });
    } else {
      holdingsByAsset.set(balance.asset_symbol, {
        asset_symbol: balance.asset_symbol,
        asset_name: balance.asset_name,
        total_balance: balance.total_balance,
        total_usd_value: balance.usd_value,
        by_exchange: [{
          exchange: balance.exchange,
          balance: balance.total_balance,
          usd_value: balance.usd_value,
        }],
      });
    }
  }

  const holdings = Array.from(holdingsByAsset.values()).map(h => ({
    ...h,
    percentage: totalValueUsd > 0 ? (h.total_usd_value / totalValueUsd) * 100 : 0,
  }));

  // Sort holdings by value
  holdings.sort((a, b) => b.total_usd_value - a.total_usd_value);

  return {
    total_value_usd: totalValueUsd,
    total_value_btc: totalValueBtc,
    total_change_24h: totalValueUsd * 0.025, // Mock 2.5% change
    total_change_24h_percent: 2.5,
    exchanges: exchangeTotals,
    holdings,
    recent_transactions: mockTransactions,
  };
}

/**
 * Get transaction history across all exchanges
 */
export async function getExchangeTransactions(
  _userId: string,
  options?: {
    exchange?: SupportedExchange;
    limit?: number;
    offset?: number;
  }
): Promise<ExchangeTransaction[]> {
  let transactions = [...mockTransactions];

  if (options?.exchange) {
    transactions = transactions.filter(t => t.exchange === options.exchange);
  }

  return transactions.slice(options?.offset || 0, (options?.offset || 0) + (options?.limit || 50));
}

/**
 * Sync all connected exchanges
 */
export async function syncAllExchanges(userId: string): Promise<{
  success: boolean;
  synced: SupportedExchange[];
  errors: { exchange: SupportedExchange; error: string }[];
}> {
  const credentials = await getConnectedExchanges(userId);
  const synced: SupportedExchange[] = [];
  const errors: { exchange: SupportedExchange; error: string }[] = [];

  for (const cred of credentials) {
    try {
      await syncExchangeBalances(cred.id, cred.exchange);
      synced.push(cred.exchange);
    } catch (error) {
      errors.push({
        exchange: cred.exchange,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { success: errors.length === 0, synced, errors };
}

/**
 * Validate API credentials for an exchange
 */
export async function validateExchangeCredentials(
  _exchange: SupportedExchange,
  apiKey: string,
  apiSecret: string,
  _passphrase?: string
): Promise<{ valid: boolean; permissions: string[]; error?: string }> {
  // In production, this would test the connection with a read-only API call
  await new Promise(resolve => setTimeout(resolve, 800));

  if (!apiKey || !apiSecret) {
    return { valid: false, permissions: [], error: 'Invalid credentials' };
  }

  return {
    valid: true,
    permissions: ['read'],
  };
}
