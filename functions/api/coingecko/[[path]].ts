// Cloudflare Pages Function: CoinGecko API Proxy
// Handles CORS by proxying requests from browser to CoinGecko
// Includes aggressive caching to minimize API calls

interface Env {
  /** Preferred name, matching the label shown in admin System Settings. */
  COINGECKO_API_KEY?: string;
  /** Legacy name still honoured so an existing deployment keeps working. */
  VITE_COINGECKO_API_KEY?: string;
  /** 'pro' selects the paid tier. Anything else, including unset, means demo. */
  COINGECKO_API_PLAN?: string;
  COINGECKO_CACHE?: KVNamespace;
}

/**
 * CoinGecko's two tiers need a matching host AND header, and they are not
 * interchangeable: a demo key is only accepted as x-cg-demo-api-key on
 * api.coingecko.com, and a pro key only as x-cg-pro-api-key on
 * pro-api.coingecko.com. Crossing them over is rejected.
 *
 * They are paired here so the two halves cannot be chosen independently. The
 * previous code picked the header from apiKey.startsWith('CG-1V') while the
 * host stayed hardcoded to the demo endpoint. Every CoinGecko key begins with
 * 'CG-', so that test keyed on the random tail of one specific key: rotating
 * to any other demo key sent it as a pro key to the demo host, and a pro key
 * could never work at all. Either way CoinGecko ignores the key and applies
 * the shared unauthenticated quota, which surfaces as intermittent 429s and
 * stale prices with nothing in the logs naming the key as the cause.
 */
const COINGECKO_TIERS = {
  demo: {
    baseUrl: 'https://api.coingecko.com/api/v3',
    headerName: 'x-cg-demo-api-key',
  },
  pro: {
    baseUrl: 'https://pro-api.coingecko.com/api/v3',
    headerName: 'x-cg-pro-api-key',
  },
} as const;

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
  const { request, env } = context;
  
  // Get the path from the URL
  const url = new URL(request.url);
  // Remove /api/coingecko/ from the beginning
  const apiPath = url.pathname.replace(/^\/api\/coingecko\/?/, '');
  const searchParams = url.searchParams.toString();
  
  // This proxy is read-only; it exists so the browser can reach CoinGecko.
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'GET, OPTIONS',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Construct CoinGecko API URL
  const apiKey = env.COINGECKO_API_KEY || env.VITE_COINGECKO_API_KEY || '';
  const tier =
    env.COINGECKO_API_PLAN?.trim().toLowerCase() === 'pro'
      ? COINGECKO_TIERS.pro
      : COINGECKO_TIERS.demo;

  const targetUrl = `${tier.baseUrl}/${apiPath}${searchParams ? `?${searchParams}` : ''}`;

  try {
    // Build headers
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'User-Agent': 'BitcoinInvestments/1.0',
    };

    if (apiKey) {
      headers[tier.headerName] = apiKey;
    }

    // Fetch from CoinGecko with Cloudflare caching
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers,
      cf: {
        // Let Cloudflare cache this at the edge
        cacheTtl: getCacheDuration(apiPath),
        cacheEverything: true,
      },
    });
    
    // Get the response data
    const data = await response.text();
    
    const cacheDuration = getCacheDuration(apiPath);
    
    // Return with CORS headers
    return new Response(data, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': `public, max-age=${cacheDuration}`,
        'X-Rate-Limit-Remaining': response.headers.get('x-ratelimit-remaining') || 'unknown',
      },
    });
  } catch {
    return new Response(
      JSON.stringify({
        error: 'Proxy failed to fetch from CoinGecko',
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
