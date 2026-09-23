// Cloudflare Pages Function: CoinGecko API Proxy
//
// Lets the browser reach CoinGecko from our own origin with the site's API key
// attached server-side. Hardened so it is not an open proxy:
// - only GET, and only the read-only endpoint paths the app uses (ALLOWED_PATHS)
// - only known query parameters are forwarded; ids/paths are validated
// - successful (2xx) responses are cached at the edge; errors never are
// - the last good response per URL is kept (Cache API, plus KV when the
//   COINGECKO_CACHE binding exists) and served with `X-Data-Stale: true` when
//   CoinGecko rate-limits us or fails, so the site degrades to "as of" data
//   instead of blank sections.

interface Env {
  /** Preferred name, matching the label shown in admin System Settings. */
  COINGECKO_API_KEY?: string;
  /** Legacy name still honoured so an existing deployment keeps working. */
  VITE_COINGECKO_API_KEY?: string;
  /** 'pro' selects the paid tier. Anything else, including unset, means demo. */
  COINGECKO_API_PLAN?: string;
  /** Optional KV namespace for last-good snapshots (survives cache eviction). */
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

const COIN_ID = '[a-z0-9][a-z0-9-]{0,99}';

/** Allowed endpoint paths and their edge cache TTL (seconds). */
const ALLOWED_PATHS: Array<{ pattern: RegExp; ttl: number }> = [
  { pattern: /^ping$/, ttl: 3600 },
  { pattern: /^simple\/price$/, ttl: 60 },
  { pattern: /^simple\/supported_vs_currencies$/, ttl: 86400 },
  { pattern: /^coins\/markets$/, ttl: 120 },
  { pattern: /^coins\/list$/, ttl: 86400 },
  { pattern: /^coins\/categories$/, ttl: 600 },
  { pattern: new RegExp(`^coins/${COIN_ID}$`), ttl: 600 },
  { pattern: new RegExp(`^coins/${COIN_ID}/market_chart$`), ttl: 300 },
  { pattern: new RegExp(`^coins/${COIN_ID}/market_chart/range$`), ttl: 300 },
  { pattern: new RegExp(`^coins/${COIN_ID}/ohlc$`), ttl: 300 },
  { pattern: /^global$/, ttl: 300 },
  { pattern: /^search$/, ttl: 600 },
  { pattern: /^search\/trending$/, ttl: 600 },
  { pattern: /^exchange_rates$/, ttl: 600 },
];

/** Query parameters forwarded upstream; everything else is dropped. */
const ALLOWED_PARAMS = new Set([
  'vs_currency',
  'vs_currencies',
  'ids',
  'order',
  'per_page',
  'page',
  'sparkline',
  'price_change_percentage',
  'days',
  'from',
  'to',
  'interval',
  'precision',
  'query',
  'category',
  'include_market_cap',
  'include_24hr_vol',
  'include_24hr_change',
  'include_last_updated_at',
  'include_platform',
  'localization',
  'tickers',
  'market_data',
  'community_data',
  'developer_data',
]);

const MAX_PARAM_LENGTH = 2000;
/** How long a last-good copy is kept for fallback. */
const LAST_GOOD_TTL = 24 * 60 * 60;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(body: unknown, status: number, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...CORS_HEADERS,
      ...extra,
    },
  });
}

function lastGoodKey(apiPath: string, query: string): Request {
  // A synthetic URL used only as a Cache API key.
  return new Request(`https://coingecko-last-good.internal/${apiPath}?${query}`);
}

async function readLastGood(
  env: Env,
  apiPath: string,
  query: string
): Promise<{ body: string; fetchedAt: string } | null> {
  try {
    const cached = await caches.default.match(lastGoodKey(apiPath, query));
    if (cached) {
      return {
        body: await cached.text(),
        fetchedAt: cached.headers.get('X-Data-Fetched-At') || '',
      };
    }
  } catch {
    /* cache unavailable */
  }
  if (env.COINGECKO_CACHE) {
    try {
      const stored = await env.COINGECKO_CACHE.get(`lastgood:${apiPath}?${query}`, 'json') as
        | { body: string; fetchedAt: string }
        | null;
      if (stored?.body) return stored;
    } catch {
      /* KV unavailable */
    }
  }
  return null;
}

async function writeLastGood(env: Env, apiPath: string, query: string, body: string, fetchedAt: string) {
  const tasks: Promise<unknown>[] = [
    caches.default
      .put(
        lastGoodKey(apiPath, query),
        new Response(body, {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': `public, max-age=${LAST_GOOD_TTL}`,
            'X-Data-Fetched-At': fetchedAt,
          },
        })
      )
      .catch(() => undefined),
  ];
  // KV writes are rate limited; only snapshot small, commonly used payloads.
  if (env.COINGECKO_CACHE && body.length < 200_000) {
    tasks.push(
      env.COINGECKO_CACHE.put(`lastgood:${apiPath}?${query}`, JSON.stringify({ body, fetchedAt }), {
        expirationTtl: LAST_GOOD_TTL,
      }).catch(() => undefined)
    );
  }
  await Promise.all(tasks);
}

export async function onRequest(context: {
  request: Request;
  env: Env;
  params?: { path?: string[] };
  waitUntil?: (promise: Promise<unknown>) => void;
}) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return onRequestOptions();
  }

  // This proxy is read-only; it exists so the browser can reach CoinGecko.
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405, { Allow: 'GET, OPTIONS' });
  }

  const url = new URL(request.url);
  const apiPath = url.pathname.replace(/^\/api\/coingecko\/?/, '').replace(/\/+$/, '');

  const route = ALLOWED_PATHS.find((r) => r.pattern.test(apiPath));
  if (!route) {
    return jsonResponse({ error: 'Endpoint not allowed' }, 404);
  }

  // Forward only known parameters, in a stable order (better cache hit rate).
  const forwarded = new URLSearchParams();
  const names = [...new Set([...url.searchParams.keys()])].filter((k) => ALLOWED_PARAMS.has(k)).sort();
  for (const name of names) {
    const value = url.searchParams.get(name) ?? '';
    if (value.length > MAX_PARAM_LENGTH) {
      return jsonResponse({ error: `Parameter too long: ${name}` }, 400);
    }
    forwarded.set(name, value);
  }
  const perPage = Number(forwarded.get('per_page'));
  if (forwarded.has('per_page') && (!Number.isFinite(perPage) || perPage < 1 || perPage > 250)) {
    return jsonResponse({ error: 'per_page must be between 1 and 250' }, 400);
  }
  const query = forwarded.toString();

  const apiKey = env.COINGECKO_API_KEY || env.VITE_COINGECKO_API_KEY || '';
  const tier =
    env.COINGECKO_API_PLAN?.trim().toLowerCase() === 'pro'
      ? COINGECKO_TIERS.pro
      : COINGECKO_TIERS.demo;

  const targetUrl = `${tier.baseUrl}/${apiPath}${query ? `?${query}` : ''}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': 'BitcoinInvestments/1.0',
  };
  if (apiKey) {
    headers[tier.headerName] = apiKey;
  }

  const serveStale = async (reason: string, upstreamStatus: number) => {
    const lastGood = await readLastGood(env, apiPath, query);
    if (lastGood) {
      return new Response(lastGood.body, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // Short browser cache so the client retries soon.
          'Cache-Control': 'public, max-age=30',
          'X-Data-Stale': 'true',
          'X-Data-Fetched-At': lastGood.fetchedAt,
          'X-Upstream-Status': String(upstreamStatus),
          ...CORS_HEADERS,
        },
      });
    }
    return jsonResponse({ error: reason }, upstreamStatus === 429 ? 429 : 502, {
      'X-Upstream-Status': String(upstreamStatus),
    });
  };

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method: 'GET',
      headers,
      cf: {
        // Only successful responses are cached at the edge.
        cacheTtlByStatus: { '200-299': route.ttl, '300-599': 0 },
        cacheEverything: true,
      },
    } as RequestInit);
  } catch {
    return serveStale('Proxy failed to reach CoinGecko', 0);
  }

  if (upstream.status === 404) {
    return jsonResponse({ error: 'Not found' }, 404);
  }

  if (!upstream.ok) {
    return serveStale(`CoinGecko responded with ${upstream.status}`, upstream.status);
  }

  const body = await upstream.text();
  // An edge-cached subrequest carries Age; report when the data was really fetched.
  const age = Number(upstream.headers.get('Age')) || 0;
  const fetchedAt = String(Date.now() - age * 1000);

  const save = writeLastGood(env, apiPath, query, body, fetchedAt);
  if (context.waitUntil) context.waitUntil(save);
  else await save;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${route.ttl}`,
      'X-Data-Fetched-At': fetchedAt,
      'X-Rate-Limit-Remaining': upstream.headers.get('x-ratelimit-remaining') || 'unknown',
      ...CORS_HEADERS,
    },
  });
}

// Handle OPTIONS preflight requests
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      'Access-Control-Max-Age': '86400',
    },
  });
}
