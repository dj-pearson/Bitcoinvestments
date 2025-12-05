// Cloudflare Pages Function: CoinGecko API Proxy
// Handles CORS by proxying requests from browser to CoinGecko

interface Env {
  VITE_COINGECKO_API_KEY?: string;
}

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;
  
  // Get the path after /api/coingecko/
  const url = new URL(request.url);
  const apiPath = url.pathname.replace('/api/coingecko/', '');
  const searchParams = url.searchParams.toString();
  
  // Construct CoinGecko API URL
  const apiKey = env.VITE_COINGECKO_API_KEY || '';
  const baseUrl = apiKey ? 'https://pro-api.coingecko.com/api/v3' : 'https://api.coingecko.com/api/v3';
  const targetUrl = `${baseUrl}/${apiPath}${searchParams ? `?${searchParams}` : ''}`;
  
  try {
    // Add API key header if available
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };
    
    if (apiKey) {
      headers['x-cg-pro-api-key'] = apiKey;
    }
    
    // Forward the request to CoinGecko
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
    });
    
    // Get the response data
    const data = await response.text();
    
    // Return with CORS headers
    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=60', // Cache for 1 minute
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch from CoinGecko',
        message: error instanceof Error ? error.message : 'Unknown error'
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
