/**
 * Cloudflare Pages Function to proxy CoinGecko API requests
 * Uses Cloudflare Cache API for persistent edge caching
 */

interface Env {
  COINGECKO_API_KEY?: string;
}

// Cache durations in seconds
const CACHE_DURATION = 5 * 60; // 5 minutes for successful responses
const STALE_CACHE_DURATION = 30 * 60; // 30 minutes for stale fallback

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, params, env } = context;
  
  // Get the path segments after /api/coingecko/
  const pathSegments = params.path as string[];
  const path = pathSegments ? pathSegments.join('/') : '';
  
  // Get query string from original request
  const url = new URL(request.url);
  const queryString = url.search;
  
  // Build the CoinGecko API URL
  const coingeckoUrl = `https://api.coingecko.com/api/v3/${path}${queryString}`;
  
  // Create a cache key for Cloudflare Cache API
  const cacheKey = new Request(`https://cache.bitcoinvestments.net/coingecko/${path}${queryString}`, {
    method: 'GET',
  });
  
  // Try to get from Cloudflare Cache
  const cache = caches.default;
  let cachedResponse = await cache.match(cacheKey);
  
  if (cachedResponse) {
    // Check if it's still fresh
    const age = cachedResponse.headers.get('X-Cache-Age');
    const cachedAt = age ? parseInt(age) : 0;
    const isFresh = Date.now() - cachedAt < CACHE_DURATION * 1000;
    
    if (isFresh) {
      return new Response(cachedResponse.body, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': `public, max-age=${CACHE_DURATION}`,
          'X-Cache': 'HIT',
        },
      });
    }
  }
  
  try {
    // Build headers for the CoinGecko request
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'User-Agent': 'Bitcoinvestments/1.0',
    };
    
    // Add API key if available (for Pro tier)
    if (env.COINGECKO_API_KEY) {
      headers['x-cg-demo-api-key'] = env.COINGECKO_API_KEY;
    }
    
    const response = await fetch(coingeckoUrl, { headers });
    
    if (!response.ok) {
      // If rate limited or forbidden, return cached data if available
      if ((response.status === 429 || response.status === 403) && cachedResponse) {
        const body = await cachedResponse.text();
        return new Response(body, {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': `public, max-age=${CACHE_DURATION}`,
            'X-Cache': 'STALE',
          },
        });
      }
      
      // Return demo data for common endpoints when no cache available
      const demoData = getDemoData(path);
      if (demoData) {
        return new Response(JSON.stringify(demoData), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-Cache': 'DEMO',
          },
        });
      }
      
      return new Response(JSON.stringify({ error: `CoinGecko API error: ${response.status}` }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    const data = await response.text();
    
    // Store in Cloudflare Cache
    const responseToCache = new Response(data, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${STALE_CACHE_DURATION}`,
        'X-Cache-Age': Date.now().toString(),
      },
    });
    
    // Cache in background (don't wait)
    context.waitUntil(cache.put(cacheKey, responseToCache.clone()));
    
    return new Response(data, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': `public, max-age=${CACHE_DURATION}`,
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    // On error, return cached data if available
    if (cachedResponse) {
      const body = await cachedResponse.text();
      return new Response(body, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': `public, max-age=${CACHE_DURATION}`,
          'X-Cache': 'ERROR-FALLBACK',
        },
      });
    }
    
    // Return demo data as last resort
    const demoData = getDemoData(path);
    if (demoData) {
      return new Response(JSON.stringify(demoData), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Cache': 'DEMO',
        },
      });
    }
    
    return new Response(JSON.stringify({ error: 'Failed to fetch from CoinGecko' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};

// Demo data for common endpoints when API is unavailable
function getDemoData(path: string): unknown {
  if (path === 'global') {
    return {
      data: {
        total_market_cap: { usd: 3200000000000 },
        total_volume: { usd: 150000000000 },
        market_cap_percentage: { btc: 52, eth: 17 },
        market_cap_change_percentage_24h_usd: 1.5,
        active_cryptocurrencies: 14000,
        markets: 900,
      }
    };
  }
  
  if (path === 'search/trending') {
    return {
      coins: [
        { item: { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', thumb: '', market_cap_rank: 1, price_btc: 1 } },
        { item: { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', thumb: '', market_cap_rank: 2, price_btc: 0.05 } },
      ]
    };
  }
  
  if (path.startsWith('coins/markets')) {
    return [
      { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 100000, market_cap: 2000000000000, market_cap_rank: 1, price_change_percentage_24h: 2.5, sparkline_in_7d: { price: [] } },
      { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 3500, market_cap: 420000000000, market_cap_rank: 2, price_change_percentage_24h: 1.8, sparkline_in_7d: { price: [] } },
      { id: 'tether', symbol: 'usdt', name: 'Tether', current_price: 1, market_cap: 140000000000, market_cap_rank: 3, price_change_percentage_24h: 0.01, sparkline_in_7d: { price: [] } },
      { id: 'solana', symbol: 'sol', name: 'Solana', current_price: 180, market_cap: 85000000000, market_cap_rank: 4, price_change_percentage_24h: 3.2, sparkline_in_7d: { price: [] } },
      { id: 'binancecoin', symbol: 'bnb', name: 'BNB', current_price: 650, market_cap: 95000000000, market_cap_rank: 5, price_change_percentage_24h: 1.1, sparkline_in_7d: { price: [] } },
    ];
  }
  
  return null;
}

// Handle CORS preflight requests
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
};

