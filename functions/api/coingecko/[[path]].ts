/**
 * Cloudflare Pages Function to proxy CoinGecko API requests
 * This avoids CORS issues and rate limiting from the client
 */

interface Env {
  COINGECKO_API_KEY?: string;
}

// Simple in-memory cache for edge caching
const cache = new Map<string, { data: string; timestamp: number }>();
const CACHE_DURATION = 60 * 1000; // 1 minute cache

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
  
  // Check cache first
  const cacheKey = coingeckoUrl;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return new Response(cached.data, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
        'X-Cache': 'HIT',
      },
    });
  }
  
  try {
    // Build headers for the CoinGecko request
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };
    
    // Add API key if available (for Pro tier)
    if (env.COINGECKO_API_KEY) {
      headers['x-cg-pro-api-key'] = env.COINGECKO_API_KEY;
    }
    
    const response = await fetch(coingeckoUrl, {
      headers,
      cf: {
        // Cache at the edge for 1 minute
        cacheTtl: 60,
        cacheEverything: true,
      },
    });
    
    if (!response.ok) {
      // If rate limited, return cached data if available (even if stale)
      if (response.status === 429 && cached) {
        return new Response(cached.data, {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=60',
            'X-Cache': 'STALE',
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
    
    // Cache the response
    cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return new Response(data, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    // On error, return cached data if available
    if (cached) {
      return new Response(cached.data, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60',
          'X-Cache': 'ERROR-FALLBACK',
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

