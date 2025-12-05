import type {
  Cryptocurrency,
  CryptoHistoricalData,
  FearGreedIndex,
  FearGreedHistorical,
} from '../types';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const ALTERNATIVE_ME_API = 'https://api.alternative.me/fng';

// Enhanced cache with longer duration to avoid rate limiting
const dataCache = new Map<string, { data: unknown; timestamp: number; error?: boolean }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for successful responses
const ERROR_CACHE_DURATION = 30 * 1000; // 30 seconds for error responses

// Rate limiting helper with request queue
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests (safer for free tier)
const requestQueue: Array<{ resolve: () => void }> = [];
let isProcessingQueue = false;

async function processQueue(): Promise<void> {
  if (isProcessingQueue) return;
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => 
        setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      );
    }
    
    const request = requestQueue.shift();
    if (request) {
      lastRequestTime = Date.now();
      request.resolve();
    }
  }
  
  isProcessingQueue = false;
}

async function rateLimitedFetch(url: string, cacheKey?: string): Promise<Response> {
  // Check cache first
  if (cacheKey) {
    const cached = dataCache.get(cacheKey);
    if (cached) {
      const maxAge = cached.error ? ERROR_CACHE_DURATION : CACHE_DURATION;
      if (Date.now() - cached.timestamp < maxAge) {
        // Return a mock response from cache
        return new Response(JSON.stringify(cached.data), {
          status: cached.error ? 429 : 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }

  // Queue the request
  await new Promise<void>(resolve => {
    requestQueue.push({ resolve });
    processQueue();
  });

  try {
    const response = await fetch(url);
    
    // If rate limited, return cached data or throw
    if (response.status === 429) {
      const cached = dataCache.get(cacheKey || url);
      if (cached && cached.data) {
        console.warn('CoinGecko rate limited, returning cached data');
        return new Response(JSON.stringify(cached.data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return response;
  } catch (error) {
    // On network error, try to return cached data
    const cached = dataCache.get(cacheKey || url);
    if (cached && cached.data) {
      console.warn('Network error, returning cached data');
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    throw error;
  }
}

function cacheResponse(key: string, data: unknown, isError: boolean = false): void {
  dataCache.set(key, { data, timestamp: Date.now(), error: isError });
}

/**
 * Fetch top cryptocurrencies by market cap
 */
export async function getTopCryptocurrencies(
  limit: number = 50,
  page: number = 1,
  currency: string = 'usd'
): Promise<Cryptocurrency[]> {
  const cacheKey = `top_cryptos_${limit}_${page}_${currency}`;
  
  try {
    const url = `${COINGECKO_API_BASE}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${limit}&page=${page}&sparkline=true&price_change_percentage=7d,30d`;

    const response = await rateLimitedFetch(url, cacheKey);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    cacheResponse(cacheKey, data);
    return data as Cryptocurrency[];
  } catch (error) {
    console.error('Error fetching cryptocurrencies:', error);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
}

/**
 * Fetch single cryptocurrency details
 */
export async function getCryptocurrencyById(
  id: string,
  currency: string = 'usd'
): Promise<Cryptocurrency | null> {
  try {
    const url = `${COINGECKO_API_BASE}/coins/markets?vs_currency=${currency}&ids=${id}&sparkline=true&price_change_percentage=7d,30d`;

    const response = await rateLimitedFetch(url);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error(`Error fetching cryptocurrency ${id}:`, error);
    throw error;
  }
}

/**
 * Search cryptocurrencies by name or symbol
 */
export async function searchCryptocurrencies(
  query: string
): Promise<{ id: string; name: string; symbol: string; thumb: string }[]> {
  try {
    const url = `${COINGECKO_API_BASE}/search?query=${encodeURIComponent(query)}`;

    const response = await rateLimitedFetch(url);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    return data.coins || [];
  } catch (error) {
    console.error('Error searching cryptocurrencies:', error);
    throw error;
  }
}

/**
 * Get historical price data for a cryptocurrency
 */
export async function getHistoricalData(
  id: string,
  days: number = 30,
  currency: string = 'usd'
): Promise<CryptoHistoricalData> {
  try {
    const url = `${COINGECKO_API_BASE}/coins/${id}/market_chart?vs_currency=${currency}&days=${days}`;

    const response = await rateLimitedFetch(url);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    return data as CryptoHistoricalData;
  } catch (error) {
    console.error(`Error fetching historical data for ${id}:`, error);
    throw error;
  }
}

/**
 * Get historical data within a specific date range
 */
export async function getHistoricalDataRange(
  id: string,
  fromTimestamp: number,
  toTimestamp: number,
  currency: string = 'usd'
): Promise<CryptoHistoricalData> {
  try {
    const url = `${COINGECKO_API_BASE}/coins/${id}/market_chart/range?vs_currency=${currency}&from=${fromTimestamp}&to=${toTimestamp}`;

    const response = await rateLimitedFetch(url);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    return data as CryptoHistoricalData;
  } catch (error) {
    console.error(`Error fetching historical range data for ${id}:`, error);
    throw error;
  }
}

/**
 * Get simple price for multiple cryptocurrencies
 */
export async function getSimplePrices(
  ids: string[],
  currencies: string[] = ['usd'],
  includeMarketCap: boolean = false,
  include24hChange: boolean = false
): Promise<Record<string, Record<string, number>>> {
  const cacheKey = `simple_prices_${ids.join('_')}_${currencies.join('_')}`;
  
  try {
    const url = `${COINGECKO_API_BASE}/simple/price?ids=${ids.join(',')}&vs_currencies=${currencies.join(',')}&include_market_cap=${includeMarketCap}&include_24hr_change=${include24hChange}`;

    const response = await rateLimitedFetch(url, cacheKey);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    cacheResponse(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching simple prices:', error);
    return {};
  }
}

/**
 * Get global cryptocurrency market data
 */
export async function getGlobalMarketData(): Promise<{
  total_market_cap: Record<string, number>;
  total_volume: Record<string, number>;
  market_cap_percentage: Record<string, number>;
  market_cap_change_percentage_24h_usd: number;
  active_cryptocurrencies: number;
  markets: number;
} | null> {
  const cacheKey = 'global_market_data';
  
  try {
    const url = `${COINGECKO_API_BASE}/global`;

    const response = await rateLimitedFetch(url, cacheKey);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const marketData = data.data || data;
    cacheResponse(cacheKey, marketData);
    return marketData;
  } catch (error) {
    console.error('Error fetching global market data:', error);
    return null;
  }
}

/**
 * Get trending cryptocurrencies
 */
export async function getTrendingCryptocurrencies(): Promise<{
  id: string;
  coin_id: number;
  name: string;
  symbol: string;
  thumb: string;
  market_cap_rank: number;
  price_btc: number;
}[]> {
  const cacheKey = 'trending_cryptos';
  
  try {
    const url = `${COINGECKO_API_BASE}/search/trending`;

    const response = await rateLimitedFetch(url, cacheKey);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const trending = data.coins?.map((item: { item: unknown }) => item.item) || [];
    cacheResponse(cacheKey, trending);
    return trending;
  } catch (error) {
    console.error('Error fetching trending cryptocurrencies:', error);
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

/**
 * Get list of supported currencies
 */
export async function getSupportedCurrencies(): Promise<string[]> {
  try {
    const url = `${COINGECKO_API_BASE}/simple/supported_vs_currencies`;

    const response = await rateLimitedFetch(url);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching supported currencies:', error);
    throw error;
  }
}

/**
 * Get OHLC (Open, High, Low, Close) data for charts
 */
export async function getOHLCData(
  id: string,
  days: 1 | 7 | 14 | 30 | 90 | 180 | 365 | 'max' = 30,
  currency: string = 'usd'
): Promise<[number, number, number, number, number][]> {
  try {
    const url = `${COINGECKO_API_BASE}/coins/${id}/ohlc?vs_currency=${currency}&days=${days}`;

    const response = await rateLimitedFetch(url);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching OHLC data for ${id}:`, error);
    throw error;
  }
}

// Cache utilities for reducing API calls
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute

export function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
}

export function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function clearCache(): void {
  cache.clear();
}

/**
 * Cached version of getTopCryptocurrencies
 */
export async function getCachedTopCryptocurrencies(
  limit: number = 50,
  page: number = 1,
  currency: string = 'usd'
): Promise<Cryptocurrency[]> {
  const cacheKey = `top_${limit}_${page}_${currency}`;
  const cached = getCached<Cryptocurrency[]>(cacheKey);

  if (cached) {
    return cached;
  }

  const data = await getTopCryptocurrencies(limit, page, currency);
  setCache(cacheKey, data);
  return data;
}

/**
 * Cached version of getFearGreedIndex
 */
export async function getCachedFearGreedIndex(): Promise<FearGreedIndex> {
  const cacheKey = 'fear_greed_index';
  const cached = getCached<FearGreedIndex>(cacheKey);

  if (cached) {
    return cached;
  }

  const data = await getFearGreedIndex();
  setCache(cacheKey, data);
  return data;
}
