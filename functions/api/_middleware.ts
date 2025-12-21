/**
 * Cloudflare Pages Middleware
 *
 * This middleware handles:
 * 1. Rate limiting for API endpoints
 * 2. Security headers (CSP, CORS, etc.)
 * 3. Request logging for debugging
 *
 * It applies to all requests under /api/*
 */

interface Env {
  RATE_LIMIT_KV?: KVNamespace;
}

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyPrefix?: string;    // Optional prefix for rate limit key
}

// Rate limit configurations per endpoint type
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Authentication endpoints - stricter limits
  'auth': {
    windowMs: 60 * 1000,     // 1 minute
    maxRequests: 10,         // 10 requests per minute
    keyPrefix: 'auth',
  },
  // Checkout endpoints - moderate limits
  'checkout': {
    windowMs: 60 * 1000,     // 1 minute
    maxRequests: 20,         // 20 requests per minute
    keyPrefix: 'checkout',
  },
  // General API endpoints - standard limits
  'default': {
    windowMs: 60 * 1000,     // 1 minute
    maxRequests: 100,        // 100 requests per minute
    keyPrefix: 'api',
  },
  // Webhook endpoints - higher limits (server-to-server)
  'webhook': {
    windowMs: 60 * 1000,     // 1 minute
    maxRequests: 500,        // 500 requests per minute
    keyPrefix: 'webhook',
  },
  // Public data endpoints (like coingecko proxy) - higher limits
  'public': {
    windowMs: 60 * 1000,     // 1 minute
    maxRequests: 200,        // 200 requests per minute
    keyPrefix: 'public',
  },
};

// In-memory rate limit store (fallback when KV is not available)
// Note: This is per-worker instance, so not perfectly accurate across multiple workers
const inMemoryStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Get the rate limit configuration based on the request path
 */
function getRateLimitConfig(path: string): RateLimitConfig {
  // Determine endpoint type based on path
  if (path.includes('webhook')) {
    return RATE_LIMITS.webhook;
  }
  if (path.includes('checkout') || path.includes('portal')) {
    return RATE_LIMITS.checkout;
  }
  if (path.includes('auth') || path.includes('login') || path.includes('signup')) {
    return RATE_LIMITS.auth;
  }
  if (path.includes('coingecko')) {
    return RATE_LIMITS.public;
  }
  return RATE_LIMITS.default;
}

/**
 * Extract client identifier for rate limiting
 * Uses CF-Connecting-IP header (Cloudflare provides real client IP)
 */
function getClientIdentifier(request: Request): string {
  // Cloudflare provides the real client IP
  const cfIP = request.headers.get('CF-Connecting-IP');
  if (cfIP) return cfIP;

  // Fallback to X-Forwarded-For
  const forwardedFor = request.headers.get('X-Forwarded-For');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Last resort fallback
  return 'unknown';
}

/**
 * Check rate limit using KV store
 */
async function checkRateLimitKV(
  kv: KVNamespace,
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = Date.now();
  const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
  const kvKey = `ratelimit:${config.keyPrefix}:${key}:${windowStart}`;

  // Get current count
  const currentData = await kv.get(kvKey);
  const currentCount = currentData ? parseInt(currentData, 10) : 0;

  if (currentCount >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: windowStart + config.windowMs,
    };
  }

  // Increment count
  const newCount = currentCount + 1;
  const ttlSeconds = Math.ceil(config.windowMs / 1000);
  await kv.put(kvKey, newCount.toString(), { expirationTtl: ttlSeconds });

  return {
    allowed: true,
    remaining: config.maxRequests - newCount,
    resetTime: windowStart + config.windowMs,
  };
}

/**
 * Check rate limit using in-memory store (fallback)
 */
function checkRateLimitMemory(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
  const storeKey = `${config.keyPrefix}:${key}:${windowStart}`;

  // Clean up old entries
  for (const [k, v] of inMemoryStore.entries()) {
    if (v.resetTime < now) {
      inMemoryStore.delete(k);
    }
  }

  const current = inMemoryStore.get(storeKey);
  const currentCount = current?.count ?? 0;

  if (currentCount >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: windowStart + config.windowMs,
    };
  }

  // Increment count
  const newCount = currentCount + 1;
  inMemoryStore.set(storeKey, {
    count: newCount,
    resetTime: windowStart + config.windowMs,
  });

  return {
    allowed: true,
    remaining: config.maxRequests - newCount,
    resetTime: windowStart + config.windowMs,
  };
}

/**
 * Main rate limiting function
 */
async function checkRateLimit(
  request: Request,
  env: Env
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const url = new URL(request.url);
  const config = getRateLimitConfig(url.pathname);
  const clientId = getClientIdentifier(request);
  const key = `${clientId}:${url.pathname}`;

  // Use KV if available, otherwise fall back to in-memory
  if (env.RATE_LIMIT_KV) {
    return checkRateLimitKV(env.RATE_LIMIT_KV, key, config);
  }

  return checkRateLimitMemory(key, config);
}

/**
 * Get security headers for the response
 */
function getSecurityHeaders(): Record<string, string> {
  return {
    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https: http:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.coingecko.com https://pro-api.coingecko.com https://api.stripe.com https://*.walletconnect.com wss://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.org https://rpc.ankr.com https://*.infura.io wss://*.infura.io https://*.alchemy.com wss://*.alchemy.com https://cloudflare-eth.com",
      "frame-src 'self' https://js.stripe.com https://challenges.cloudflare.com https://verify.walletconnect.com",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join('; '),
    // Prevent clickjacking
    'X-Frame-Options': 'SAMEORIGIN',
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    // Enable XSS filter
    'X-XSS-Protection': '1; mode=block',
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // Permissions policy
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(self)',
    // Strict Transport Security
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  };
}

/**
 * Create rate limit exceeded response
 */
function createRateLimitResponse(resetTime: number): Response {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': '0',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
        ...getSecurityHeaders(),
      },
    }
  );
}

/**
 * Add rate limit headers to response
 */
function addRateLimitHeaders(
  response: Response,
  rateLimitResult: { remaining: number; resetTime: number },
  config: RateLimitConfig
): Response {
  const headers = new Headers(response.headers);

  headers.set('X-RateLimit-Limit', config.maxRequests.toString());
  headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  headers.set('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString());

  // Add security headers
  for (const [key, value] of Object.entries(getSecurityHeaders())) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Middleware entry point
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Skip rate limiting for OPTIONS requests (CORS preflight)
  if (request.method === 'OPTIONS') {
    return next();
  }

  // Skip rate limiting for certain paths (e.g., health checks)
  if (url.pathname === '/api/health' || url.pathname === '/api/ping') {
    return next();
  }

  try {
    // Check rate limit
    const rateLimitResult = await checkRateLimit(request, env);

    if (!rateLimitResult.allowed) {
      console.warn(
        `Rate limit exceeded for ${getClientIdentifier(request)} on ${url.pathname}`
      );
      return createRateLimitResponse(rateLimitResult.resetTime);
    }

    // Continue to the actual handler
    const response = await next();

    // Add rate limit and security headers to the response
    const config = getRateLimitConfig(url.pathname);
    return addRateLimitHeaders(response, rateLimitResult, config);

  } catch (error) {
    console.error('Middleware error:', error);
    // On middleware error, allow the request to proceed
    // but log the error for debugging
    return next();
  }
};
