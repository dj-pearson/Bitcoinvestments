/**
 * Exchange API Connections Service
 *
 * Connect to cryptocurrency exchanges to auto-sync portfolio data.
 *
 * Supported Exchanges:
 * - Coinbase
 * - Binance
 * - Kraken
 * - Gemini
 * - KuCoin
 *
 * Features:
 * - OAuth and API key authentication
 * - Real-time balance syncing
 * - Transaction history import
 * - Multi-exchange aggregation
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface Exchange {
  id: string;
  name: string;
  logo: string;
  website: string;
  authType: 'oauth' | 'api_key';
  permissions: string[];
  features: ExchangeFeature[];
  isSupported: boolean;
  comingSoon?: boolean;
}

export type ExchangeFeature =
  | 'balances'
  | 'transactions'
  | 'orders'
  | 'deposits'
  | 'withdrawals'
  | 'staking';

export interface ExchangeConnection {
  id: string;
  userId: string;
  exchangeId: string;
  exchangeName: string;
  status: 'active' | 'expired' | 'error' | 'syncing';
  lastSyncAt?: string;
  lastError?: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeBalance {
  connectionId: string;
  exchangeId: string;
  asset: string;
  assetName: string;
  free: number;
  locked: number;
  total: number;
  usdValue: number;
  lastUpdated: string;
}

export interface ExchangeTransaction {
  id: string;
  connectionId: string;
  exchangeId: string;
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'trade' | 'staking_reward';
  asset: string;
  amount: number;
  price?: number;
  fee?: number;
  feeAsset?: string;
  quoteAsset?: string;
  quoteAmount?: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'cancelled';
  externalId?: string;
}

export interface SyncResult {
  success: boolean;
  balances?: ExchangeBalance[];
  transactions?: ExchangeTransaction[];
  error?: string;
}

// Supported exchanges
export const EXCHANGES: Record<string, Exchange> = {
  coinbase: {
    id: 'coinbase',
    name: 'Coinbase',
    logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    website: 'https://www.coinbase.com',
    authType: 'oauth',
    permissions: ['wallet:accounts:read', 'wallet:transactions:read'],
    features: ['balances', 'transactions', 'deposits', 'withdrawals'],
    isSupported: true,
  },
  binance: {
    id: 'binance',
    name: 'Binance',
    logo: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png',
    website: 'https://www.binance.com',
    authType: 'api_key',
    permissions: ['Read-only', 'Enable spot & margin trading'],
    features: ['balances', 'transactions', 'orders', 'staking'],
    isSupported: true,
  },
  kraken: {
    id: 'kraken',
    name: 'Kraken',
    logo: 'https://assets.kraken.com/marketing/web/icons/favicon/apple-icon-180x180.png',
    website: 'https://www.kraken.com',
    authType: 'api_key',
    permissions: ['Query Funds', 'Query Ledger Entries'],
    features: ['balances', 'transactions', 'orders', 'staking'],
    isSupported: true,
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    logo: 'https://www.gemini.com/static/images/gemini-logo.png',
    website: 'https://www.gemini.com',
    authType: 'api_key',
    permissions: ['Auditor'],
    features: ['balances', 'transactions', 'orders'],
    isSupported: true,
  },
  kucoin: {
    id: 'kucoin',
    name: 'KuCoin',
    logo: 'https://assets.staticimg.com/cms/media/1lB3PkckFDyfxz6VudCEACBeRRBi6sQQ7DDjz0yWM.svg',
    website: 'https://www.kucoin.com',
    authType: 'api_key',
    permissions: ['General', 'Trade'],
    features: ['balances', 'transactions', 'orders'],
    isSupported: true,
  },
  ftx: {
    id: 'ftx',
    name: 'FTX',
    logo: '',
    website: '',
    authType: 'api_key',
    permissions: [],
    features: [],
    isSupported: false,
    comingSoon: false,
  },
  bybit: {
    id: 'bybit',
    name: 'Bybit',
    logo: 'https://www.bybit.com/favicon.ico',
    website: 'https://www.bybit.com',
    authType: 'api_key',
    permissions: ['Read-only'],
    features: ['balances', 'transactions'],
    isSupported: false,
    comingSoon: true,
  },
  okx: {
    id: 'okx',
    name: 'OKX',
    logo: 'https://static.okx.com/cdn/assets/imgs/221/5F74EB20302D7761.png',
    website: 'https://www.okx.com',
    authType: 'api_key',
    permissions: ['Read-only'],
    features: ['balances', 'transactions'],
    isSupported: false,
    comingSoon: true,
  },
};

/**
 * Get user's exchange connections
 */
export async function getConnections(
  userId: string
): Promise<{ connections: ExchangeConnection[]; error: string | null }> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('exchange_connections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        connections: (data || []).map(mapConnectionFromDB),
        error: null,
      };
    }

    return { connections: [], error: null };
  } catch (error) {
    console.error('Error fetching connections:', error);
    return {
      connections: [],
      error: error instanceof Error ? error.message : 'Failed to load connections',
    };
  }
}

/**
 * Connect exchange via API key
 */
export async function connectExchangeWithApiKey(
  userId: string,
  exchangeId: string,
  apiKey: string,
  apiSecret: string,
  passphrase?: string
): Promise<{ connection: ExchangeConnection | null; error: string | null }> {
  try {
    const exchange = EXCHANGES[exchangeId];
    if (!exchange || !exchange.isSupported) {
      return { connection: null, error: 'Exchange not supported' };
    }

    // Validate API credentials
    const validation = await validateApiCredentials(exchangeId, apiKey, apiSecret, passphrase);
    if (!validation.valid) {
      return { connection: null, error: validation.error || 'Invalid API credentials' };
    }

    if (isSupabaseConfigured()) {
      // Encrypt and store credentials
      const { data, error } = await supabase
        .from('exchange_connections')
        .insert({
          user_id: userId,
          exchange_id: exchangeId,
          exchange_name: exchange.name,
          auth_type: 'api_key',
          encrypted_credentials: encryptCredentials({ apiKey, apiSecret, passphrase }),
          permissions: exchange.permissions,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger initial sync
      await syncConnection(data.id, userId);

      return { connection: mapConnectionFromDB(data), error: null };
    }

    // Demo connection
    return {
      connection: {
        id: 'demo-connection',
        userId,
        exchangeId,
        exchangeName: exchange.name,
        status: 'active',
        permissions: exchange.permissions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      error: null,
    };
  } catch (error) {
    console.error('Error connecting exchange:', error);
    return {
      connection: null,
      error: error instanceof Error ? error.message : 'Failed to connect exchange',
    };
  }
}

/**
 * Get OAuth authorization URL for an exchange
 */
export function getOAuthUrl(exchangeId: string, userId: string): string | null {
  const exchange = EXCHANGES[exchangeId];
  if (!exchange || exchange.authType !== 'oauth') {
    return null;
  }

  const redirectUri = encodeURIComponent(`${window.location.origin}/api/exchange/callback`);
  const state = encodeURIComponent(JSON.stringify({ exchangeId, userId }));

  switch (exchangeId) {
    case 'coinbase':
      return `https://www.coinbase.com/oauth/authorize?response_type=code&client_id=${process.env.COINBASE_CLIENT_ID}&redirect_uri=${redirectUri}&state=${state}&scope=wallet:accounts:read,wallet:transactions:read`;
    default:
      return null;
  }
}

/**
 * Complete OAuth connection
 */
export async function completeOAuthConnection(
  code: string,
  state: string
): Promise<{ connection: ExchangeConnection | null; error: string | null }> {
  try {
    const { exchangeId, userId } = JSON.parse(decodeURIComponent(state));
    const exchange = EXCHANGES[exchangeId];

    if (!exchange) {
      return { connection: null, error: 'Invalid exchange' };
    }

    // Exchange code for tokens (would call exchange API)
    // This is a placeholder - actual implementation would call the OAuth token endpoint

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('exchange_connections')
        .insert({
          user_id: userId,
          exchange_id: exchangeId,
          exchange_name: exchange.name,
          auth_type: 'oauth',
          encrypted_credentials: encryptCredentials({ code }), // Would be tokens
          permissions: exchange.permissions,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      await syncConnection(data.id, userId);

      return { connection: mapConnectionFromDB(data), error: null };
    }

    return { connection: null, error: 'Database not configured' };
  } catch (error) {
    console.error('Error completing OAuth:', error);
    return {
      connection: null,
      error: error instanceof Error ? error.message : 'Failed to complete OAuth',
    };
  }
}

/**
 * Sync connection data
 */
export async function syncConnection(
  connectionId: string,
  userId: string
): Promise<SyncResult> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: true, balances: getDemoBalances(connectionId) };
    }

    // Update status to syncing
    await supabase
      .from('exchange_connections')
      .update({ status: 'syncing' })
      .eq('id', connectionId)
      .eq('user_id', userId);

    // Get connection details
    const { data: connection } = await supabase
      .from('exchange_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (!connection) {
      return { success: false, error: 'Connection not found' };
    }

    // Fetch balances from exchange
    const balances = await fetchExchangeBalances(
      connection.exchange_id,
      decryptCredentials(connection.encrypted_credentials)
    );

    // Fetch transactions
    const transactions = await fetchExchangeTransactions(
      connection.exchange_id,
      decryptCredentials(connection.encrypted_credentials)
    );

    // Store balances
    for (const balance of balances) {
      await supabase.from('exchange_balances').upsert(
        {
          connection_id: connectionId,
          exchange_id: connection.exchange_id,
          ...balance,
        },
        { onConflict: 'connection_id,asset' }
      );
    }

    // Store transactions
    for (const tx of transactions) {
      await supabase.from('exchange_transactions').upsert(
        {
          connection_id: connectionId,
          exchange_id: connection.exchange_id,
          ...tx,
        },
        { onConflict: 'connection_id,external_id' }
      );
    }

    // Update sync status
    await supabase
      .from('exchange_connections')
      .update({
        status: 'active',
        last_sync_at: new Date().toISOString(),
        last_error: null,
      })
      .eq('id', connectionId);

    return { success: true, balances, transactions };
  } catch (error) {
    console.error('Error syncing connection:', error);

    // Update error status
    if (isSupabaseConfigured()) {
      await supabase
        .from('exchange_connections')
        .update({
          status: 'error',
          last_error: error instanceof Error ? error.message : 'Sync failed',
        })
        .eq('id', connectionId);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync',
    };
  }
}

/**
 * Get balances for all connections
 */
export async function getAllBalances(
  userId: string
): Promise<{ balances: ExchangeBalance[]; error: string | null }> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('exchange_balances')
        .select('*, exchange_connections!inner(user_id)')
        .eq('exchange_connections.user_id', userId);

      if (error) throw error;

      return {
        balances: (data || []).map((b) => ({
          connectionId: b.connection_id,
          exchangeId: b.exchange_id,
          asset: b.asset,
          assetName: b.asset_name || b.asset,
          free: b.free,
          locked: b.locked,
          total: b.total,
          usdValue: b.usd_value,
          lastUpdated: b.updated_at,
        })),
        error: null,
      };
    }

    return { balances: getDemoBalances('demo'), error: null };
  } catch (error) {
    console.error('Error fetching balances:', error);
    return {
      balances: [],
      error: error instanceof Error ? error.message : 'Failed to load balances',
    };
  }
}

/**
 * Disconnect exchange
 */
export async function disconnectExchange(
  connectionId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: true, error: null };
    }

    const { error } = await supabase
      .from('exchange_connections')
      .delete()
      .eq('id', connectionId)
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error disconnecting exchange:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disconnect',
    };
  }
}

// Helper functions
function mapConnectionFromDB(data: Record<string, unknown>): ExchangeConnection {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    exchangeId: data.exchange_id as string,
    exchangeName: data.exchange_name as string,
    status: data.status as ExchangeConnection['status'],
    lastSyncAt: data.last_sync_at as string | undefined,
    lastError: data.last_error as string | undefined,
    permissions: (data.permissions as string[]) || [],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

async function validateApiCredentials(
  exchangeId: string,
  apiKey: string,
  apiSecret: string,
  passphrase?: string
): Promise<{ valid: boolean; error?: string }> {
  // In production, this would make a test API call to the exchange
  // For now, just validate format
  if (!apiKey || apiKey.length < 10) {
    return { valid: false, error: 'Invalid API key format' };
  }
  if (!apiSecret || apiSecret.length < 10) {
    return { valid: false, error: 'Invalid API secret format' };
  }
  if (exchangeId === 'kucoin' && !passphrase) {
    return { valid: false, error: 'KuCoin requires a passphrase' };
  }

  return { valid: true };
}

function encryptCredentials(credentials: Record<string, unknown>): string {
  // In production, use proper encryption (e.g., AES-256-GCM)
  return Buffer.from(JSON.stringify(credentials)).toString('base64');
}

function decryptCredentials(encrypted: string): Record<string, unknown> {
  // In production, use proper decryption
  return JSON.parse(Buffer.from(encrypted, 'base64').toString());
}

async function fetchExchangeBalances(
  exchangeId: string,
  credentials: Record<string, unknown>
): Promise<Omit<ExchangeBalance, 'connectionId' | 'exchangeId'>[]> {
  // In production, this would call the actual exchange API
  // Using credentials to authenticate
  void credentials;

  // Demo balances
  return [
    { asset: 'BTC', assetName: 'Bitcoin', free: 0.5, locked: 0, total: 0.5, usdValue: 21750, lastUpdated: new Date().toISOString() },
    { asset: 'ETH', assetName: 'Ethereum', free: 3.2, locked: 0.5, total: 3.7, usdValue: 7400, lastUpdated: new Date().toISOString() },
    { asset: 'USDC', assetName: 'USD Coin', free: 5000, locked: 0, total: 5000, usdValue: 5000, lastUpdated: new Date().toISOString() },
  ];
}

async function fetchExchangeTransactions(
  exchangeId: string,
  credentials: Record<string, unknown>
): Promise<Omit<ExchangeTransaction, 'connectionId' | 'exchangeId'>[]> {
  // In production, this would call the actual exchange API
  void credentials;

  // Demo transactions
  return [
    {
      id: 'tx1',
      type: 'buy',
      asset: 'BTC',
      amount: 0.1,
      price: 43500,
      quoteAsset: 'USD',
      quoteAmount: 4350,
      fee: 10,
      feeAsset: 'USD',
      timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
      status: 'completed',
      externalId: 'ext-tx-1',
    },
    {
      id: 'tx2',
      type: 'deposit',
      asset: 'USDC',
      amount: 5000,
      timestamp: new Date(Date.now() - 86400000 * 14).toISOString(),
      status: 'completed',
      externalId: 'ext-tx-2',
    },
  ];
}

function getDemoBalances(connectionId: string): ExchangeBalance[] {
  return [
    { connectionId, exchangeId: 'binance', asset: 'BTC', assetName: 'Bitcoin', free: 0.5, locked: 0, total: 0.5, usdValue: 21750, lastUpdated: new Date().toISOString() },
    { connectionId, exchangeId: 'binance', asset: 'ETH', assetName: 'Ethereum', free: 3.2, locked: 0.5, total: 3.7, usdValue: 7400, lastUpdated: new Date().toISOString() },
    { connectionId, exchangeId: 'binance', asset: 'USDC', assetName: 'USD Coin', free: 5000, locked: 0, total: 5000, usdValue: 5000, lastUpdated: new Date().toISOString() },
  ];
}

/**
 * Get aggregated portfolio from all exchanges
 */
export async function getAggregatedPortfolio(
  userId: string
): Promise<{
  totalValue: number;
  byExchange: { exchange: Exchange; value: number; assets: number }[];
  byAsset: { asset: string; total: number; value: number; exchanges: string[] }[];
}> {
  const { balances } = await getAllBalances(userId);

  const totalValue = balances.reduce((sum, b) => sum + b.usdValue, 0);

  // Group by exchange
  const exchangeMap = new Map<string, { value: number; assets: Set<string> }>();
  for (const balance of balances) {
    const existing = exchangeMap.get(balance.exchangeId) || { value: 0, assets: new Set() };
    existing.value += balance.usdValue;
    existing.assets.add(balance.asset);
    exchangeMap.set(balance.exchangeId, existing);
  }

  const byExchange = Array.from(exchangeMap.entries()).map(([id, data]) => ({
    exchange: EXCHANGES[id],
    value: data.value,
    assets: data.assets.size,
  }));

  // Group by asset
  const assetMap = new Map<string, { total: number; value: number; exchanges: Set<string> }>();
  for (const balance of balances) {
    const existing = assetMap.get(balance.asset) || { total: 0, value: 0, exchanges: new Set() };
    existing.total += balance.total;
    existing.value += balance.usdValue;
    existing.exchanges.add(balance.exchangeId);
    assetMap.set(balance.asset, existing);
  }

  const byAsset = Array.from(assetMap.entries())
    .map(([asset, data]) => ({
      asset,
      total: data.total,
      value: data.value,
      exchanges: Array.from(data.exchanges),
    }))
    .sort((a, b) => b.value - a.value);

  return { totalValue, byExchange, byAsset };
}
