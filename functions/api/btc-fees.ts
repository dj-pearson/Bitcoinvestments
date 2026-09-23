/**
 * Cloudflare Pages Function: GET /api/btc-fees
 *
 * Proxies mempool.space's free recommended-fee endpoint so the browser can
 * show Bitcoin fee rates without calling a third-party host (no CSP change).
 * Cached at the edge for 60 seconds.
 *
 * Response: { asOf, source, fastestFee, halfHourFee, hourFee, economyFee,
 *             minimumFee } — all fee rates in sat/vB, exactly as mempool.space
 * reports them.
 */

interface PagesContext {
  request: Request;
  waitUntil: (promise: Promise<unknown>) => void;
}

const UPSTREAM = 'https://mempool.space/api/v1/fees/recommended';
const CACHE_KEY = 'https://cache.internal/api/btc-fees/v1';
const TTL_S = 60;

const FIELDS = ['fastestFee', 'halfHourFee', 'hourFee', 'economyFee', 'minimumFee'] as const;

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const cache = (caches as unknown as { default: Cache }).default;
  const cached = await cache.match(CACHE_KEY);
  if (cached) return cached;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(UPSTREAM, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`mempool.space responded ${res.status}`);
    const raw = (await res.json()) as Record<string, unknown>;

    const out: Record<string, unknown> = {
      asOf: new Date().toISOString(),
      source: 'mempool.space',
    };
    for (const f of FIELDS) {
      const v = raw[f];
      if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`missing ${f}`);
      out[f] = v;
    }

    const response = new Response(JSON.stringify(out), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${TTL_S}`,
      },
    });
    context.waitUntil(cache.put(CACHE_KEY, response.clone()));
    return response;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Bitcoin fee data is temporarily unavailable.' }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
      }
    );
  }
}
