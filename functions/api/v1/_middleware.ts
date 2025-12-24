/**
 * Developer API Middleware
 *
 * Handles authentication, rate limiting, and request logging for all v1 API endpoints.
 */

import { createClient } from '@supabase/supabase-js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface ApiKeyRecord {
  id: string;
  user_id: string;
  tier: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'revoked' | 'expired';
  permissions: string[];
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  requests_today: number;
  ip_whitelist: string[];
  allowed_origins: string[];
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const startTime = Date.now();

  // Get origin from request
  const origin = request.headers.get('Origin');

  /**
   * SECURITY: Restrict CORS to specific origins
   *
   * Instead of allowing all origins (*), we:
   * 1. For authenticated requests: Use API key's allowed_origins
   * 2. For unauthenticated/error requests: Use a safe default list
   *
   * The wildcard '*' is a security risk as it allows any website to make
   * requests to your API, enabling CSRF attacks and credential theft.
   */
  const defaultAllowedOrigins = [
    'https://bitcoin-investments.pages.dev',
    'https://bitcoinvestments.com',
    'http://localhost:5173', // Vite dev server
    'http://localhost:4173', // Vite preview
  ];

  // Determine if origin is allowed (will be refined after API key validation)
  const isOriginAllowed = (allowedOrigins: string[]) => {
    if (!origin) return false; // No origin header = not a browser request
    return allowedOrigins.includes(origin);
  };

  const getCorsHeaders = (allowedOrigins: string[] = defaultAllowedOrigins) => {
    // Only set Access-Control-Allow-Origin if origin is in allowed list
    const allowOrigin = origin && isOriginAllowed(allowedOrigins) ? origin : 'null';

    return {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin', // Important for caching
    };
  };

  // Handle CORS preflight with default allowed origins
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders() });
  }

  // Use default CORS headers for early returns
  const corsHeaders = getCorsHeaders();

  // Extract API key from headers
  const authHeader = request.headers.get('Authorization');
  const apiKeyHeader = request.headers.get('X-API-Key');

  let apiKey: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    apiKey = authHeader.substring(7);
  } else if (apiKeyHeader) {
    apiKey = apiKeyHeader;
  }

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: 'Authentication required',
        message: 'Please provide an API key via Authorization header (Bearer token) or X-API-Key header',
        code: 'AUTH_REQUIRED'
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }

  // Validate API key format
  if (!apiKey.startsWith('bv_live_') && !apiKey.startsWith('bv_test_')) {
    return new Response(
      JSON.stringify({
        error: 'Invalid API key format',
        message: 'API keys must start with bv_live_ or bv_test_',
        code: 'INVALID_KEY_FORMAT'
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }

  const isTestMode = apiKey.startsWith('bv_test_');

  try {
    // Initialize Supabase client
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Hash the API key for lookup
    const keyHash = await hashApiKey(apiKey);

    // Look up API key in database
    const { data: keyRecord, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .single();

    if (keyError || !keyRecord) {
      return new Response(
        JSON.stringify({
          error: 'Invalid API key',
          message: 'The provided API key is not valid',
          code: 'INVALID_KEY'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    const apiKeyData = keyRecord as ApiKeyRecord;

    // Check key status
    if (apiKeyData.status !== 'active') {
      return new Response(
        JSON.stringify({
          error: 'API key inactive',
          message: `This API key is ${apiKeyData.status}`,
          code: 'KEY_INACTIVE'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    // Check IP whitelist (if configured)
    if (apiKeyData.ip_whitelist.length > 0) {
      const clientIp = request.headers.get('CF-Connecting-IP') ||
                      request.headers.get('X-Forwarded-For')?.split(',')[0].trim() ||
                      '';

      if (!apiKeyData.ip_whitelist.includes(clientIp)) {
        return new Response(
          JSON.stringify({
            error: 'IP not allowed',
            message: 'Your IP address is not in the whitelist for this API key',
            code: 'IP_NOT_ALLOWED'
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }
    }

    // Check origin (if configured)
    const origin = request.headers.get('Origin');
    if (apiKeyData.allowed_origins.length > 0 && origin) {
      if (!apiKeyData.allowed_origins.includes(origin)) {
        return new Response(
          JSON.stringify({
            error: 'Origin not allowed',
            message: 'This origin is not in the allowed origins for this API key',
            code: 'ORIGIN_NOT_ALLOWED'
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }
    }

    // Rate limiting check - get recent requests
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { count: recentRequests } = await supabase
      .from('api_usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('api_key_id', apiKeyData.id)
      .gte('created_at', oneMinuteAgo);

    if ((recentRequests || 0) >= apiKeyData.rate_limit_per_minute) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `You have exceeded the rate limit of ${apiKeyData.rate_limit_per_minute} requests per minute`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: 60
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            'X-RateLimit-Limit': String(apiKeyData.rate_limit_per_minute),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 60),
            ...corsHeaders
          }
        }
      );
    }

    // Check daily limit
    if (apiKeyData.requests_today >= apiKeyData.rate_limit_per_day) {
      return new Response(
        JSON.stringify({
          error: 'Daily limit exceeded',
          message: `You have exceeded the daily limit of ${apiKeyData.rate_limit_per_day} requests`,
          code: 'DAILY_LIMIT_EXCEEDED'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    // Attach API key data to context for use in handlers
    (context as any).apiKey = apiKeyData;
    (context as any).isTestMode = isTestMode;

    // Process the request
    const response = await next();

    // Log the request (async, don't wait)
    const responseTime = Date.now() - startTime;
    const url = new URL(request.url);

    supabase
      .from('api_usage_logs')
      .insert({
        api_key_id: apiKeyData.id,
        endpoint: url.pathname,
        method: request.method,
        status_code: response.status,
        response_time_ms: responseTime,
        ip_address: request.headers.get('CF-Connecting-IP'),
        user_agent: request.headers.get('User-Agent'),
      })
      .then(() => {
        // Increment usage counter
        return supabase.rpc('increment_api_usage', { key_id: apiKeyData.id });
      })
      .catch(console.error);

    // Add rate limit headers to response
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-RateLimit-Limit', String(apiKeyData.rate_limit_per_minute));
    newHeaders.set('X-RateLimit-Remaining', String(Math.max(0, apiKeyData.rate_limit_per_minute - (recentRequests || 0) - 1)));
    newHeaders.set('X-API-Tier', apiKeyData.tier);

    // Use API key's allowed_origins if configured, otherwise use defaults
    const finalCorsHeaders = getCorsHeaders(
      apiKeyData.allowed_origins.length > 0 ? apiKeyData.allowed_origins : defaultAllowedOrigins
    );
    Object.entries(finalCorsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (error) {
    console.error('API middleware error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
};

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
