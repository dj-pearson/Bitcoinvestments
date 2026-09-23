/**
 * Scheduled Price Alert Checker
 *
 * Cloudflare Worker that runs on a schedule (see wrangler-cron.toml) and calls
 * the check-price-alerts Pages Function, which does the actual work.
 *
 * While the site runs in STATIC_MODE there are no accounts and so no
 * price_alerts rows; see the pause instructions in wrangler-cron.toml.
 */

interface Env {
  SUPABASE_SERVICE_ROLE_KEY: string;
  /** Base URL of the Pages deployment, e.g. https://bitcoinvestments.net */
  PAGES_URL: string;
}

/**
 * Constant-time string comparison, matching functions/api/_scheduledAuth.ts,
 * so the manual-trigger endpoint does not leak the token through timing.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function checkUrl(env: Env): string | null {
  const base = (env.PAGES_URL || '').trim().replace(/\/+$/, '');
  if (!/^https?:\/\//.test(base)) return null;
  return `${base}/api/check-price-alerts`;
}

async function runCheck(env: Env): Promise<Response> {
  const url = checkUrl(env);
  if (!url) {
    // Fail loudly instead of fetching "undefined/api/check-price-alerts".
    return new Response(JSON.stringify({ error: 'PAGES_URL is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
  });
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    try {
      const response = await runCheck(env);
      const result = await response.text();
      if (response.ok) {
        console.log('Price alert check completed:', result);
      } else {
        console.error(`Price alert check failed (HTTP ${response.status}):`, result);
      }
    } catch (error) {
      console.error('Error running price alert check:', error instanceof Error ? error.message : error);
    }
  },

  // Manual trigger via HTTP, authorised with the same bearer token.
  async fetch(request: Request, env: Env): Promise<Response> {
    const authHeader = request.headers.get('Authorization') || '';
    if (!env.SUPABASE_SERVICE_ROLE_KEY || !timingSafeEqual(authHeader, `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`)) {
      return new Response('Unauthorized', { status: 401 });
    }

    try {
      const response = await runCheck(env);
      return new Response(await response.text(), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Failed to check price alerts',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};
