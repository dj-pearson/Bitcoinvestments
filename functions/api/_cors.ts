/**
 * Shared CORS Configuration
 *
 * SECURITY: Restricts CORS to specific trusted origins instead of allowing all (*)
 * This prevents unauthorized websites from making requests to our API endpoints.
 */

/**
 * List of allowed origins for CORS
 * Add your production and development domains here
 */
export const ALLOWED_ORIGINS = [
  // The canonical production origin MUST stay first. The checkout endpoints use
  // ALLOWED_ORIGINS[0] as the fallback when a request's Origin is not on this
  // list, and that value becomes the Stripe success_url and cancel_url - so a
  // preview domain in this slot sends paying customers to the wrong site.
  'https://bitcoinvestments.net',
  'https://www.bitcoinvestments.net',
  'https://bitcoin-investments.pages.dev',
  'http://localhost:5173', // Vite dev server
  'http://localhost:4173', // Vite preview
];

/**
 * Get CORS headers for a given request
 * Only allows requests from origins in the ALLOWED_ORIGINS list
 */
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin');

  // Check if origin is in allowed list
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Vary': 'Origin', // Important for caching with multiple origins
  };
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflightRequest(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}
