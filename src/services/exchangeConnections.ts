/**
 * Exchange API Connections Service: DISABLED.
 *
 * Connecting exchange accounts is not implemented, and every function that
 * would accept, store or use exchange credentials throws
 * ExchangeConnectionsDisabledError. Nothing in the app calls them.
 *
 * Why it was disabled
 * -------------------
 * The previous version "encrypted" API secrets in the browser with AES-GCM,
 * using a key derived from the user's id and a salt hard-coded in this file.
 * Anyone who could read the database row and knew the user id (which is not
 * a secret) could decrypt the credentials, so that was obfuscation, not
 * encryption. It also asked users for trading permissions (Binance "Enable
 * spot & margin trading", KuCoin "Trade") that a portfolio tracker never
 * needs, and its balance sync returned hard-coded demo balances.
 *
 * Secure design required before re-enabling
 * -----------------------------------------
 * 1. Read-only keys only. Request and validate view/read permissions; reject a
 *    key that can trade or withdraw (most exchanges expose the key's
 *    permissions through an API call - check it server-side on connect).
 * 2. Server-side only. The browser sends the key once, over HTTPS, to a
 *    server endpoint (Supabase Edge Function or Cloudflare Worker). The
 *    browser never stores, encrypts or reads back the secret.
 * 3. Real encryption at rest. The server encrypts with a key held in a
 *    secret manager / KMS (e.g. a Worker secret or Supabase Vault), never in
 *    source code and never derived from user data. Rotate that key.
 * 4. Server-side exchange calls. Private exchange APIs are called from the
 *    server (they are not CORS-enabled and must not see browser code), on a
 *    schedule or on demand, and only balances/transactions are written to
 *    the database under RLS.
 * 5. IP allow-listing. Publish the worker's egress IPs so users can restrict
 *    keys to them where the exchange supports it.
 * 6. Easy revocation. Deleting a connection deletes the ciphertext; tell users
 *    to also delete the key at the exchange.
 * 7. Security review before launch. NEEDS-OWNER: decide whether to build this
 *    at all; the dashboard's manual tracker already covers the basic need.
 *
 * FTX was removed from the exchange list (bankrupt since November 2022).
 */

import { isSupabaseConfigured, db } from '../lib/supabase';

export class ExchangeConnectionsDisabledError extends Error {
  constructor() {
    super(
      'Exchange connections are not available. They are disabled until a server-side, read-only key vault exists.'
    );
    this.name = 'ExchangeConnectionsDisabledError';
  }
}

/** Feature flag. Must stay false until the design above is implemented. */
export const EXCHANGE_CONNECTIONS_ENABLED = false;

export interface Exchange {
  id: string;
  name: string;
  website: string;
  /** Read-only permissions a future integration would request. Never trading or withdrawal. */
  readOnlyPermissions: string[];
}

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

/**
 * Exchanges a future read-only integration could target. Permission names are
 * each exchange's read-only scope, as a reminder of what to request.
 */
export const EXCHANGES: Record<string, Exchange> = {
  coinbase: {
    id: 'coinbase',
    name: 'Coinbase',
    website: 'https://www.coinbase.com',
    readOnlyPermissions: ['wallet:accounts:read', 'wallet:transactions:read'],
  },
  kraken: {
    id: 'kraken',
    name: 'Kraken',
    website: 'https://www.kraken.com',
    readOnlyPermissions: ['Query Funds', 'Query Ledger Entries'],
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    website: 'https://www.gemini.com',
    readOnlyPermissions: ['Auditor'],
  },
  binance: {
    id: 'binance',
    name: 'Binance',
    website: 'https://www.binance.com',
    readOnlyPermissions: ['Enable Reading'],
  },
};

interface DbExchangeConnection {
  id: string;
  user_id: string;
  exchange_id: string;
  exchange_name: string;
  status: string;
  last_sync_at?: string;
  last_error?: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

function mapConnectionFromDB(data: DbExchangeConnection): ExchangeConnection {
  return {
    id: data.id,
    userId: data.user_id,
    exchangeId: data.exchange_id,
    exchangeName: data.exchange_name,
    status: data.status as ExchangeConnection['status'],
    lastSyncAt: data.last_sync_at,
    lastError: data.last_error,
    permissions: data.permissions,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * List a user's existing connection rows (metadata only, never credentials).
 * Returns [] when the database is not configured. Kept so any rows created by
 * the old implementation can be found and removed.
 */
export async function getConnections(
  userId: string
): Promise<{ connections: ExchangeConnection[]; error: string | null }> {
  if (!isSupabaseConfigured()) return { connections: [], error: null };
  try {
    const { data, error } = await db
      .from('exchange_connections')
      .select('id, user_id, exchange_id, exchange_name, status, last_sync_at, last_error, permissions, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { connections: ((data || []) as DbExchangeConnection[]).map(mapConnectionFromDB), error: null };
  } catch (error) {
    console.error('Error fetching exchange connections:', error);
    return {
      connections: [],
      error: error instanceof Error ? error.message : 'Failed to load connections',
    };
  }
}

/** Delete a connection row (and its stored ciphertext). Allowed so users can clean up. */
export async function disconnectExchange(
  connectionId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Database is not configured' };
  try {
    const { error } = await db
      .from('exchange_connections')
      .delete()
      .eq('id', connectionId)
      .eq('user_id', userId);
    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Error disconnecting exchange:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to disconnect' };
  }
}

/** Disabled: never accept exchange credentials in the browser. */
export async function connectExchangeWithApiKey(..._args: unknown[]): Promise<never> {
  throw new ExchangeConnectionsDisabledError();
}

/** Disabled: OAuth tokens would need the same server-side vault. */
export async function completeOAuthConnection(..._args: unknown[]): Promise<never> {
  throw new ExchangeConnectionsDisabledError();
}

/** Disabled: exchange APIs must be called server-side. */
export async function syncConnection(..._args: unknown[]): Promise<never> {
  throw new ExchangeConnectionsDisabledError();
}
