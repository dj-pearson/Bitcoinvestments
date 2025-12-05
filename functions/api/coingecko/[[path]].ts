// Cloudflare Pages Function: CoinGecko API Proxy
// Handles CORS by proxying requests from browser to CoinGecko
// Includes aggressive caching to minimize API calls

interface Env {
  VITE_COINGECKO_API_KEY?: string;
  COINGECKO_CACHE?: KVNamespace;
}

// Cache durations based on endpoint volatility
const CACHE_DURATIONS: Record<string, number> = {
  'ping': 3600,                    // 1 hour
  'simple/price': 60,              // 1 minute
  'coins/markets': 120,            // 2 minutes
  'coins/list': 86400,             // 24 hours
  'global': 300,                   // 5 minutes
  'search/trending': 600,          // 10 minutes
  'market_chart': 300,             // 5 minutes (historical data)
  'default': 120,                  // 2 minutes
};

function getCacheDuration(path: string): number {
  for (const [key, duration] of Object.entries(CACHE_DURATIONS)) {
    if (path.includes(key)) {
      return duration;
    }
  }
  return CACHE_DURATIONS.default;
}

export async function onRequest(context: { 
  request: Request; 
  env: Env; 
  params?: { path?: string[] };
  waitUntil?: (promise: Promise<any>) => void;
}) {
  const { request, env, waitUntil } = context;
  
  // Get the path from the URL
  const url = new URL(request.url);
  // Remove /api/coingecko/ from the beginning
  const apiPath = url.pathname.replace(/^\/api\/coingecko\/?/, '');
  const searchParams = url.searchParams.toString();
  
  // Construct CoinGecko API URL
  const apiKey = env.VITE_COINGECKO_API_KEY || '';
  const baseUrl = 'https://api.coingecko.com/api/v3';
  const targetUrl = `${baseUrl}/${apiPath}${searchParams ? `?${searchParams}` : ''}`;
  
  try {
    // Check Cloudflare cache first using the full URL as cache key
    const cacheKey = new Request(request.url, request);
    const cache = caches.default;
    
    // Try to get from cache
    let response = await cache.match(cacheKey);
    
    if (!response) {
      // Not in cache, fetch from CoinGecko
      const headers: HeadersInit = {
        'Accept': 'application/json',
        'User-Agent': 'BitcoinInvestments/1.0',
      };
      
      if (apiKey) {
        headers['x-cg-pro-api-key'] = apiKey;
      }
      
      response = await fetch(targetUrl, {
        method: request.method,
        headers,
        cf: {
          // Cloudflare-specific options
          cacheTtl: getCacheDuration(apiPath),
          cacheEverything: true,
        },
      });
      
      // Only cache successful responses
      if (response.ok) {
        const cacheDuration = getCacheDuration(apiPath);
        const cacheResponse = new Response(response.body, response);
        cacheResponse.headers.set('Cache-Control', `public, max-age=${cacheDuration}`);
        cacheResponse.headers.set('X-Cache-Status', 'MISS');
        
        // Store in cache (don't await, let it happen in background)
        if (waitUntil) {
          waitUntil(cache.put(cacheKey, cacheResponse.clone()));
        }
        
        response = cacheResponse;
      }
    } else {
      // Mark as cache hit
      response = new Response(response.body, response);
      response.headers.set('X-Cache-Status', 'HIT');
    }
    
    // Get the response data
    const data = await response.text();
    
    // Return with CORS headers
    return new Response(data, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': response.headers.get('Cache-Control') || 'public, max-age=120',
        'X-Cache-Status': response.headers.get('X-Cache-Status') || 'UNKNOWN',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Proxy failed to fetch from CoinGecko',
        message: error instanceof Error ? error.message : 'Unknown error',
        tip: 'Add VITE_COINGECKO_API_KEY to Cloudflare environment variables',
      }), 
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

// Handle OPTIONS preflight requests
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
