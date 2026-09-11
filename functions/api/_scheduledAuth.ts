/**
 * Authorization for endpoints that only the scheduled workers may invoke.
 *
 * These endpoints send mail to real recipients - price alerts to a user, the
 * newsletter to the entire subscriber list - so reaching one without credentials
 * is enough to spam every subscriber, burn the Resend quota and exhaust the
 * CoinGecko budget.
 *
 * Both endpoints previously accepted EITHER a bearer token OR the mere presence
 * of an `X-Cloudflare-Cron` header:
 *
 *   if (!cronHeader && authHeader !== `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`)
 *
 * Cloudflare does not set or validate that header. It is attached by our own
 * worker in workers/weekly-newsletter-cron.ts, so it is a value the caller
 * chooses, and any request carrying it skipped the token check entirely. Both
 * scheduled workers already send a real Authorization header, so the header
 * branch never authorised a legitimate caller - only an anonymous one.
 */

/**
 * Constant-time string comparison.
 *
 * A plain `!==` on a secret leaks its prefix through response timing, which is
 * worth avoiding on an endpoint an attacker can call repeatedly.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * True when the request carries the scheduled-worker bearer token.
 *
 * Returns false when the secret is absent from the environment: a missing
 * binding must fail closed, never authorise everyone.
 */
export function isAuthorizedScheduledRequest(
  request: Request,
  secret: string | undefined
): boolean {
  if (!secret) return false;

  const header = request.headers.get('Authorization');
  if (!header) return false;

  return timingSafeEqual(header, `Bearer ${secret}`);
}

/**
 * Standard 401 for these endpoints. The body says nothing about why, so it
 * cannot be used to distinguish a missing header from a wrong token.
 */
export function unauthorizedResponse(): Response {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
