/**
 * CoinGecko market data client.
 *
 * Two layers of API live in this file:
 *
 * 1. **Strict functions** (`fetch*`). They resolve to a `MarketData<T>`
 *    envelope — `{ data, fetchedAt, stale }` — and throw a `CoinGeckoError`
 *    when nothing usable is available. When the network or CoinGecko fails but
 *    a last-known-good copy exists (in memory or in localStorage), they resolve
 *    with that copy and `stale: true`, so a page can show the numbers together
 *    with an honest "as of {time}" note instead of a blank section. New code
 *    should use these.
 *
 * 2. **Legacy functions** (`get*`). Same names and return types as before so
 *    existing callers (home page, footer, calculators, search) keep working.
 *    The list-style ones still resolve to an empty value on failure; they are
 *    thin wrappers over the strict functions and share their cache.
 *
 * Caching:
 * - In memory for the life of the tab.
 * - Persisted in localStorage (key prefix `bi:cg:v1:`) so a cold page load has
 *   a last-known-good fallback. Storage is only touched from inside these
 *   functions, which callers invoke from effects/handlers — never during
 *   render — so the module is safe to import in a prerender.
 * - `{ force: true }` skips the fresh-cache shortcut, so a Refresh button
 *   really goes back to the network. In production the request is served by
 *   our `/api/coingecko` proxy, which itself caches upstream responses for
 *   1–10 minutes depending on the endpoint.
 */
import type {
  Cryptocurrency,
  CryptoHistoricalData,
  FearGreedIndex,
  FearGreedHistorical,
} from '../types';

// In production, use our Cloudflare proxy (same origin, API key server-side).
// In development, call CoinGecko directly.
const isDevelopment = import.meta.env.DEV;
const COINGECKO_API_BASE = isDevelopment
  ? 'https://api.coingecko.com/api/v3'
  : '/api/coingecko';

const ALTERNATIVE_ME_API = 'https://api.alternative.me/fng';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CoinGeckoErrorKind =
  | 'rate_limited'
  | 'not_found'
  | 'http'
  | 'network'
  | 'bad_response';

/** A typed failure from the market-data layer. */
export class CoinGeckoError extends Error {
  readonly kind: CoinGeckoErrorKind;
  readonly status?: number;

  constructor(kind: CoinGeckoErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'CoinGeckoError';
    this.kind = kind;
    this.status = status;
  }
}

/** Envelope returned by every strict `fetch*` function. */
export interface MarketData<T> {
  data: T;
  /** Epoch ms at which this data was fetched from the source. */
  fetchedAt: number;
  /** True when this is a last-known-good copy served because a refresh failed. */
  stale: boolean;
  /** Why the refresh failed, when `stale` is true. */
  error?: CoinGeckoError;
}

export interface FetchOptions {
  /** Bypass the fresh-cache shortcut and go to the network. */
  force?: boolean;
}

export interface GlobalMarketData {
  total_market_cap: Record<string, number>;
  total_volume: Record<string, number>;
  market_cap_percentage: Record<string, number>;
  market_cap_change_percentage_24h_usd: number;
  active_cryptocurrencies: number;
  markets: number;
}

export interface TrendingCoin {
  id: string;
  coin_id: number;
  name: string;
  symbol: string;
  thumb: string;
  market_cap_rank: number | null;
  price_btc: number;
}

export interface CoinSearchResult {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  market_cap_rank?: number | null;
}

/** Human-readable message for any error thrown by this module. */
export function describeMarketError(error: unknown): string {
  if (error instanceof CoinGeckoError) {
    switch (error.kind) {
      case 'rate_limited':
        return 'Our market data provider (CoinGecko) is rate-limiting requests right now. Please try again in a minute.';
      case 'not_found':
        return 'CoinGecko has no data for this coin.';
      case 'network':
        return 'Could not reach the market data service. Check your connection and try again.';
      default:
        return 'Market data from CoinGecko is temporarily unavailable.';
    }
  }
  return 'Market data is temporarily unavailable.';
}

// ---------------------------------------------------------------------------
// Cache (memory + localStorage)
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: unknown;
  fetchedAt: number;
}

const memoryCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<MarketData<unknown>>>();

const STORAGE_PREFIX = 'bi:cg:v1:';
/** Persisted copies older than this are not used even as a fallback. */
const MAX_FALLBACK_AGE = 7 * 24 * 60 * 60 * 1000;
/** Do not persist single payloads bigger than this (characters). */
const MAX_PERSIST_SIZE = 400_000;

const TTL = {
  markets: 2 * 60 * 1000,
  global: 5 * 60 * 1000,
  trending: 10 * 60 * 1000,
  simplePrice: 60 * 1000,
  chart: 5 * 60 * 1000,
  search: 10 * 60 * 1000,
  static: 24 * 60 * 60 * 1000,
} as const;

// Free-tier "delayed data" mode (see useDataDelay). Stretches the fresh TTL.
let currentDataDelay = 0;

/** Set the data delay for the current user (0 = no extra delay). */
export function setDataDelay(delayMs: number): void {
  currentDataDelay = delayMs;
}

/** Get the current data delay setting. */
export function getDataDelayMs(): number {
  return currentDataDelay;
}

/** Whether data is being deliberately delayed (free tier). */
export function isDataDelayed(): boolean {
  return currentDataDelay > 0;
}

function effectiveTtl(ttl: number): number {
  return Math.max(ttl, currentDataDelay);
}

function getStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function readPersisted(key: string): CacheEntry | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { t?: number; d?: unknown };
    if (typeof parsed.t !== 'number' || parsed.d === undefined) return null;
    if (Date.now() - parsed.t > MAX_FALLBACK_AGE) {
      storage.removeItem(STORAGE_PREFIX + key);
      return null;
    }
    return { data: parsed.d, fetchedAt: parsed.t };
  } catch {
    return null;
  }
}

function clearPersisted(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => storage.removeItem(k));
  } catch {
    /* storage unavailable */
  }
}

function writePersisted(key: string, entry: CacheEntry): void {
  const storage = getStorage();
  if (!storage) return;
  let payload: string;
  try {
    payload = JSON.stringify({ t: entry.fetchedAt, d: entry.data });
  } catch {
    return;
  }
  if (payload.length > MAX_PERSIST_SIZE) return;
  try {
    storage.setItem(STORAGE_PREFIX + key, payload);
  } catch {
    // Quota exceeded: drop our own entries and try once more.
    clearPersisted();
    try {
      storage.setItem(STORAGE_PREFIX + key, payload);
    } catch {
      /* give up silently; memory cache still works */
    }
  }
}

function getEntry(key: string): CacheEntry | null {
  const mem = memoryCache.get(key);
  if (mem) return mem;
  const persisted = readPersisted(key);
  if (persisted) memoryCache.set(key, persisted);
  return persisted;
}

function setEntry(key: string, entry: CacheEntry): void {
  memoryCache.set(key, entry);
  writePersisted(key, entry);
}

// ---------------------------------------------------------------------------
// Request queue (gentle spacing between requests)
// ---------------------------------------------------------------------------

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = isDevelopment ? 1500 : 100;
let queueTail: Promise<void> = Promise.resolve();

function waitForSlot(): Promise<void> {
  const slot = queueTail.then(async () => {
    const wait = MIN_REQUEST_INTERVAL - (Date.now() - lastRequestTime);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestTime = Date.now();
  });
  queueTail = slot.catch(() => undefined);
  return slot;
}

function buildUrl(path: string, params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) search.set(k, String(v));
  }
  const qs = search.toString();
  return `${COINGECKO_API_BASE}/${path}${qs ? `?${qs}` : ''}`;
}

async function networkFetch(url: string, force: boolean): Promise<{ json: unknown; serverStale: boolean; serverFetchedAt?: number }> {
  await waitForSlot();

  let response: Response;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      response = await fetch(url, {
        signal: controller.signal,
        // `no-cache` revalidates rather than reusing the browser's HTTP cache.
        cache: force ? 'no-cache' : 'default',
        headers: { Accept: 'application/json' },
      });
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    throw new CoinGeckoError('network', err instanceof Error ? err.message : 'Network error');
  }

  if (response.status === 429) {
    throw new CoinGeckoError('rate_limited', 'CoinGecko rate limit reached', 429);
  }
  if (response.status === 404) {
    throw new CoinGeckoError('not_found', 'Not found', 404);
  }
  if (!response.ok) {
    throw new CoinGeckoError('http', `CoinGecko API error: ${response.status}`, response.status);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new CoinGeckoError('bad_response', 'CoinGecko returned invalid JSON', response.status);
  }

  const serverStale = response.headers.get('X-Data-Stale') === 'true';
  const fetchedHeader = Number(response.headers.get('X-Data-Fetched-At'));
  return {
    json,
    serverStale,
    serverFetchedAt: Number.isFinite(fetchedHeader) && fetchedHeader > 0 ? fetchedHeader : undefined,
  };
}

/**
 * Core cached request. Returns fresh cache, else the network result, else a
 * stale last-known-good copy; throws CoinGeckoError only when none exist.
 */
async function cgRequest<T>(
  cacheKey: string,
  path: string,
  params: Record<string, string | number | boolean | undefined>,
  ttl: number,
  options: FetchOptions = {},
  transform: (json: unknown) => T = (json) => json as T
): Promise<MarketData<T>> {
  const entry = getEntry(cacheKey);
  if (!options.force && entry && Date.now() - entry.fetchedAt < effectiveTtl(ttl)) {
    return { data: entry.data as T, fetchedAt: entry.fetchedAt, stale: false };
  }

  const existing = inflight.get(cacheKey);
  if (existing) return existing as Promise<MarketData<T>>;

  const request = (async (): Promise<MarketData<T>> => {
    try {
      const { json, serverStale, serverFetchedAt } = await networkFetch(buildUrl(path, params), !!options.force);
      const data = transform(json);
      const fetchedAt = serverFetchedAt ?? Date.now();
      if (!serverStale) {
        setEntry(cacheKey, { data, fetchedAt });
      } else if (!entry || entry.fetchedAt < fetchedAt) {
        // The proxy served its own last-good copy; keep it but mark it stale.
        setEntry(cacheKey, { data, fetchedAt });
      }
      return { data, fetchedAt, stale: serverStale };
    } catch (err) {
      const error =
        err instanceof CoinGeckoError
          ? err
          : new CoinGeckoError('bad_response', err instanceof Error ? err.message : 'Unexpected response');
      const fallback = getEntry(cacheKey);
      if (fallback && error.kind !== 'not_found') {
        return { data: fallback.data as T, fetchedAt: fallback.fetchedAt, stale: true, error };
      }
      throw error;
    } finally {
      inflight.delete(cacheKey);
    }
  })();

  inflight.set(cacheKey, request as Promise<MarketData<unknown>>);
  return request;
}

function expectArray(json: unknown): unknown[] {
  if (!Array.isArray(json)) throw new CoinGeckoError('bad_response', 'Expected a list from CoinGecko');
  return json;
}

// ---------------------------------------------------------------------------
// Strict API
// ---------------------------------------------------------------------------

/** Top coins by market cap (one page of `coins/markets`). */
export function fetchTopCryptocurrencies(
  limit: number = 50,
  page: number = 1,
  currency: string = 'usd',
  options?: FetchOptions
): Promise<MarketData<Cryptocurrency[]>> {
  const perPage = Math.min(Math.max(Math.floor(limit), 1), 250);
  return cgRequest(
    `markets_${perPage}_${page}_${currency}`,
    'coins/markets',
    { vs_currency: currency, order: 'market_cap_desc', per_page: perPage, page, sparkline: false },
    TTL.markets,
    options,
    (json) => expectArray(json) as Cryptocurrency[]
  );
}

/**
 * Market data for one coin. Throws `CoinGeckoError('not_found')` when
 * CoinGecko does not know the id.
 */
export function fetchCoinMarket(
  id: string,
  currency: string = 'usd',
  options?: FetchOptions
): Promise<MarketData<Cryptocurrency>> {
  return cgRequest(
    `coin_${id}_${currency}`,
    'coins/markets',
    { vs_currency: currency, ids: id, sparkline: false },
    TTL.markets,
    options,
    (json) => {
      const list = expectArray(json) as Cryptocurrency[];
      if (!list[0]) throw new CoinGeckoError('not_found', `Unknown coin: ${id}`, 404);
      return list[0];
    }
  );
}

/** Global market totals (`/global`). */
export function fetchGlobalMarketData(options?: FetchOptions): Promise<MarketData<GlobalMarketData>> {
  return cgRequest('global', 'global', {}, TTL.global, options, (json) => {
    const obj = json as { data?: GlobalMarketData } | GlobalMarketData;
    const data = ('data' in obj && obj.data ? obj.data : obj) as GlobalMarketData;
    if (!data || typeof data !== 'object' || !data.total_market_cap) {
      throw new CoinGeckoError('bad_response', 'Unexpected /global response');
    }
    return data;
  });
}

/** Trending searches on CoinGecko (`/search/trending`). */
export function fetchTrendingCryptocurrencies(options?: FetchOptions): Promise<MarketData<TrendingCoin[]>> {
  return cgRequest('trending', 'search/trending', {}, TTL.trending, options, (json) => {
    const coins = (json as { coins?: { item: TrendingCoin }[] }).coins;
    if (!Array.isArray(coins)) throw new CoinGeckoError('bad_response', 'Unexpected trending response');
    return coins.map((c) => c.item);
  });
}

/** Historical prices/volumes (`/coins/{id}/market_chart`). */
export function fetchHistoricalData(
  id: string,
  days: number = 30,
  currency: string = 'usd',
  options?: FetchOptions
): Promise<MarketData<CryptoHistoricalData>> {
  return cgRequest(
    `chart_${id}_${days}_${currency}`,
    `coins/${encodeURIComponent(id)}/market_chart`,
    { vs_currency: currency, days },
    TTL.chart,
    options,
    (json) => {
      const data = json as CryptoHistoricalData;
      if (!data || !Array.isArray(data.prices)) {
        throw new CoinGeckoError('bad_response', 'Unexpected chart response');
      }
      return data;
    }
  );
}

/** Simple prices for several ids (`/simple/price`). */
export function fetchSimplePrices(
  ids: string[],
  currencies: string[] = ['usd'],
  includeMarketCap: boolean = false,
  include24hChange: boolean = false,
  options?: FetchOptions
): Promise<MarketData<Record<string, Record<string, number>>>> {
  const sortedIds = [...new Set(ids)].sort();
  return cgRequest(
    `simple_${sortedIds.join(',')}_${currencies.join(',')}_${includeMarketCap}_${include24hChange}`,
    'simple/price',
    {
      ids: sortedIds.join(','),
      vs_currencies: currencies.join(','),
      include_market_cap: includeMarketCap,
      include_24hr_change: include24hChange,
    },
    TTL.simplePrice,
    options,
    (json) => {
      if (!json || typeof json !== 'object' || Array.isArray(json)) {
        throw new CoinGeckoError('bad_response', 'Unexpected price response');
      }
      return json as Record<string, Record<string, number>>;
    }
  );
}

// ---------------------------------------------------------------------------
// Legacy API (kept for existing callers)
// ---------------------------------------------------------------------------

/** Top coins; resolves to [] on failure. Prefer fetchTopCryptocurrencies. */
export async function getTopCryptocurrencies(
  limit: number = 50,
  page: number = 1,
  currency: string = 'usd'
): Promise<Cryptocurrency[]> {
  try {
    return (await fetchTopCryptocurrencies(limit, page, currency)).data;
  } catch (error) {
    if (isDevelopment) console.warn('Error fetching cryptocurrencies:', error);
    return [];
  }
}

/** One coin's market data; null when unknown, throws on other failures. */
export async function getCryptocurrencyById(
  id: string,
  currency: string = 'usd'
): Promise<Cryptocurrency | null> {
  try {
    return (await fetchCoinMarket(id, currency)).data;
  } catch (error) {
    if (error instanceof CoinGeckoError && error.kind === 'not_found') return null;
    throw error;
  }
}

/** Search coins by name or symbol. Throws on failure. */
export async function searchCryptocurrencies(query: string): Promise<CoinSearchResult[]> {
  const q = query.trim().toLowerCase();
  const result = await cgRequest(`search_${q}`, 'search', { query: q }, TTL.search, {}, (json) => {
    const coins = (json as { coins?: CoinSearchResult[] }).coins;
    return Array.isArray(coins) ? coins : [];
  });
  return result.data;
}

/** Historical chart data. Throws on failure. */
export async function getHistoricalData(
  id: string,
  days: number = 30,
  currency: string = 'usd'
): Promise<CryptoHistoricalData> {
  return (await fetchHistoricalData(id, days, currency)).data;
}

/** Historical data within a date range (seconds). Throws on failure. */
export async function getHistoricalDataRange(
  id: string,
  fromTimestamp: number,
  toTimestamp: number,
  currency: string = 'usd'
): Promise<CryptoHistoricalData> {
  const result = await cgRequest<CryptoHistoricalData>(
    `range_${id}_${fromTimestamp}_${toTimestamp}_${currency}`,
    `coins/${encodeURIComponent(id)}/market_chart/range`,
    { vs_currency: currency, from: fromTimestamp, to: toTimestamp },
    TTL.chart
  );
  return result.data;
}

/** Simple prices; resolves to {} on failure. Prefer fetchSimplePrices. */
export async function getSimplePrices(
  ids: string[],
  currencies: string[] = ['usd'],
  includeMarketCap: boolean = false,
  include24hChange: boolean = false
): Promise<Record<string, Record<string, number>>> {
  try {
    return (await fetchSimplePrices(ids, currencies, includeMarketCap, include24hChange)).data;
  } catch (error) {
    if (isDevelopment) console.warn('Error fetching simple prices:', error);
    return {};
  }
}

/** Global market data; null on failure. Prefer fetchGlobalMarketData. */
export async function getGlobalMarketData(): Promise<GlobalMarketData | null> {
  try {
    return (await fetchGlobalMarketData()).data;
  } catch (error) {
    if (isDevelopment) console.warn('Error fetching global market data:', error);
    return null;
  }
}

/** Trending coins; [] on failure. Prefer fetchTrendingCryptocurrencies. */
export async function getTrendingCryptocurrencies(): Promise<TrendingCoin[]> {
  try {
    return (await fetchTrendingCryptocurrencies()).data;
  } catch (error) {
    if (isDevelopment) console.warn('Error fetching trending cryptocurrencies:', error);
    return [];
  }
}

/**
 * Get Fear & Greed Index from alternative.me
 */
export async function getFearGreedIndex(): Promise<FearGreedIndex> {
  try {
    const response = await fetch(`${ALTERNATIVE_ME_API}/?limit=1`);

    if (!response.ok) {
      throw new Error(`Fear & Greed API error: ${response.status}`);
    }

    const data = await response.json();
    const item = data.data[0];

    return {
      value: parseInt(item.value),
      value_classification: item.value_classification,
      timestamp: new Date(parseInt(item.timestamp) * 1000).toISOString(),
      time_until_update: item.time_until_update,
    };
  } catch (error) {
    console.error('Error fetching Fear & Greed Index:', error);
    throw error;
  }
}

/**
 * Get historical Fear & Greed Index data
 */
export async function getFearGreedHistorical(
  limit: number = 30
): Promise<FearGreedHistorical> {
  try {
    const response = await fetch(`${ALTERNATIVE_ME_API}/?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`Fear & Greed API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      data: data.data.map((item: { value: string; value_classification: string; timestamp: string }) => ({
        value: parseInt(item.value),
        value_classification: item.value_classification,
        timestamp: new Date(parseInt(item.timestamp) * 1000).toISOString(),
      })),
    };
  } catch (error) {
    console.error('Error fetching Fear & Greed historical data:', error);
    throw error;
  }
}

/** Supported quote currencies. Throws on failure. */
export async function getSupportedCurrencies(): Promise<string[]> {
  const result = await cgRequest<string[]>(
    'supported_currencies',
    'simple/supported_vs_currencies',
    {},
    TTL.static,
    {},
    (json) => expectArray(json) as string[]
  );
  return result.data;
}

/** OHLC candles. Throws on failure. */
export async function getOHLCData(
  id: string,
  days: 1 | 7 | 14 | 30 | 90 | 180 | 365 | 'max' = 30,
  currency: string = 'usd'
): Promise<[number, number, number, number, number][]> {
  const result = await cgRequest<[number, number, number, number, number][]>(
    `ohlc_${id}_${days}_${currency}`,
    `coins/${encodeURIComponent(id)}/ohlc`,
    { vs_currency: currency, days },
    TTL.chart,
    {},
    (json) => expectArray(json) as [number, number, number, number, number][]
  );
  return result.data;
}

// Legacy cache helpers (memory only)
export function getCached<T>(key: string): T | null {
  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < effectiveTtl(TTL.markets)) {
    return cached.data as T;
  }
  return null;
}

export function setCache<T>(key: string, data: T): void {
  memoryCache.set(key, { data, fetchedAt: Date.now() });
}

/** Clears the in-memory cache (persisted last-good copies are kept). */
export function clearCache(): void {
  memoryCache.clear();
}

/** Alias kept for backwards compatibility. */
export const getCachedTopCryptocurrencies = getTopCryptocurrencies;

/** Alias kept for backwards compatibility. */
export const getCachedFearGreedIndex = getFearGreedIndex;
