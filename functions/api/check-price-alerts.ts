/**
 * Price Alert Checker (Pages Function, called by workers/price-alerts-cron.ts)
 *
 * 1. Fetch active price alerts from Supabase (service role).
 * 2. Resolve each alert to a CoinGecko id. Rows created before 2026-09 stored
 *    the lowercased ticker ("btc") instead of the id ("bitcoin"); those are
 *    mapped here so they can still fire. See
 *    supabase/migrations/20260923000000_price_alerts_coingecko_ids_and_backoff.sql
 *    for the backfill.
 * 3. Fetch prices from CoinGecko in batches.
 * 4. Look up recipient emails in one batched query per run.
 * 5. Email triggered alerts and deactivate them. Delivery failures back off
 *    exponentially and the alert is deactivated after MAX_FAILURES attempts,
 *    so a broken address or mail outage does not re-send every 5 minutes
 *    forever.
 */

import { isAuthorizedScheduledRequest, unauthorizedResponse } from './_scheduledAuth';
import { sendMail, type MailerEnv } from '../lib/mailer';

interface Env extends MailerEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  /** Optional CoinGecko demo key (same variable the coingecko proxy uses). */
  COINGECKO_API_KEY?: string;
}

interface PriceAlertRow {
  id: string;
  user_id: string;
  cryptocurrency_id: string;
  symbol: string;
  target_price: number;
  condition: 'above' | 'below';
  is_active: boolean;
  created_at: string;
  /** Present once the backoff migration has run. */
  failure_count?: number | null;
  last_attempt_at?: string | null;
}

/** Stop retrying (and deactivate) after this many failed deliveries. */
const MAX_FAILURES = 6;
/** First retry delay; doubles per failure, capped at MAX_BACKOFF_MS. */
const BASE_BACKOFF_MS = 15 * 60 * 1000;
const MAX_BACKOFF_MS = 24 * 60 * 60 * 1000;
const COINGECKO_BATCH = 100;
const NO_EMAIL = 'No email address for user';

/**
 * Lowercased ticker -> CoinGecko id, for legacy rows. Mirrors
 * src/lib/coinIds.ts (Pages Functions are bundled separately from src/).
 */
const LEGACY_TICKER_TO_ID: Record<string, string> = {
  btc: 'bitcoin',
  eth: 'ethereum',
  usdt: 'tether',
  usdc: 'usd-coin',
  bnb: 'binancecoin',
  sol: 'solana',
  xrp: 'ripple',
  ada: 'cardano',
  doge: 'dogecoin',
  trx: 'tron',
  avax: 'avalanche-2',
  link: 'chainlink',
  dot: 'polkadot',
  ltc: 'litecoin',
  bch: 'bitcoin-cash',
  xlm: 'stellar',
  atom: 'cosmos',
  uni: 'uniswap',
  pol: 'polygon-ecosystem-token',
  near: 'near',
  dai: 'dai',
};

/** CoinGecko id for an alert, tolerating legacy ticker-valued rows. */
function resolveCoinId(alert: Pick<PriceAlertRow, 'cryptocurrency_id' | 'symbol'>): string {
  const stored = (alert.cryptocurrency_id || '').trim().toLowerCase();
  if (LEGACY_TICKER_TO_ID[stored]) return LEGACY_TICKER_TO_ID[stored];
  if (stored) return stored;
  return LEGACY_TICKER_TO_ID[(alert.symbol || '').trim().toLowerCase()] ?? '';
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function serviceHeaders(env: Env): Record<string, string> {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
}

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // Only the scheduled worker may run this: it sends mail and spends API quota.
  if (!isAuthorizedScheduledRequest(request, env.SUPABASE_SERVICE_ROLE_KEY)) {
    return unauthorizedResponse();
  }

  try {
    const { alerts, backoffSupported } = await fetchActiveAlerts(env);
    if (alerts.length === 0) {
      return json({ success: true, message: 'No active alerts to check', checked: 0, triggered: 0 });
    }

    const now = Date.now();
    const due = backoffSupported ? alerts.filter((a) => isDueForAttempt(a, now)) : alerts;

    const coinIds = [...new Set(due.map(resolveCoinId).filter(Boolean))];
    const prices = await fetchCurrentPrices(env, coinIds);

    const triggeredAlerts = due.filter((alert) => {
      const price = prices[resolveCoinId(alert)]?.usd;
      if (typeof price !== 'number') return false;
      return (
        (alert.condition === 'above' && price >= alert.target_price) ||
        (alert.condition === 'below' && price <= alert.target_price)
      );
    });

    const emails = await fetchUserEmails(env, [...new Set(triggeredAlerts.map((a) => a.user_id))]);

    let triggeredCount = 0;
    const results: Array<Record<string, unknown>> = [];

    for (const alert of triggeredAlerts) {
      const coinId = resolveCoinId(alert);
      const currentPrice = prices[coinId].usd;
      const email = emails.get(alert.user_id);

      const sent = email
        ? await sendMail(env, {
            to: email,
            ...buildPriceAlertEmail(alert.symbol, coinId, alert.target_price, currentPrice, alert.condition),
          })
        : { ok: false as const, error: NO_EMAIL };

      if (sent.ok) {
        await markAlertAsTriggered(env, alert.id, coinId, backoffSupported);
        triggeredCount++;
        results.push({
          alertId: alert.id,
          symbol: alert.symbol,
          condition: alert.condition,
          targetPrice: alert.target_price,
          currentPrice,
          emailSent: true,
        });
      } else {
        const deactivated = await recordFailure(env, alert, sent.error, backoffSupported);
        results.push({ alertId: alert.id, symbol: alert.symbol, error: sent.error, deactivated });
      }
    }

    return json({
      success: true,
      checked: alerts.length,
      evaluated: due.length,
      skippedForBackoff: alerts.length - due.length,
      triggered: triggeredCount,
      results,
    });
  } catch (error) {
    console.error('Error checking price alerts:', error instanceof Error ? error.message : error);
    return json(
      {
        error: 'Failed to check price alerts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
}

/** True when an alert has never failed or its backoff window has passed. */
function isDueForAttempt(alert: PriceAlertRow, now: number): boolean {
  const failures = alert.failure_count ?? 0;
  if (failures <= 0 || !alert.last_attempt_at) return true;
  const wait = Math.min(BASE_BACKOFF_MS * 2 ** (failures - 1), MAX_BACKOFF_MS);
  return now - Date.parse(alert.last_attempt_at) >= wait;
}

/**
 * Active alerts. Tries to include the backoff columns; if the migration that
 * adds them has not run yet (PostgREST answers 400 for an unknown column),
 * falls back to the original columns and runs without backoff.
 */
async function fetchActiveAlerts(env: Env): Promise<{ alerts: PriceAlertRow[]; backoffSupported: boolean }> {
  const base = 'id,user_id,cryptocurrency_id,symbol,target_price,condition,is_active,created_at';
  const url = (cols: string) => `${env.SUPABASE_URL}/rest/v1/price_alerts?is_active=eq.true&select=${cols}`;

  let response = await fetch(url(`${base},failure_count,last_attempt_at`), { headers: serviceHeaders(env) });
  let backoffSupported = true;
  if (response.status === 400) {
    console.warn('price_alerts backoff columns missing; run the 20260923000000 migration');
    backoffSupported = false;
    response = await fetch(url(base), { headers: serviceHeaders(env) });
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch alerts: HTTP ${response.status}`);
  }
  const alerts = (await response.json()) as PriceAlertRow[];
  return { alerts, backoffSupported };
}

/**
 * Emails for a set of users in one query against public.users (the service
 * role bypasses RLS). Any user missing there falls back to the auth admin API,
 * one request per distinct user rather than one per alert.
 */
async function fetchUserEmails(env: Env, userIds: string[]): Promise<Map<string, string>> {
  const emails = new Map<string, string>();
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const ids = userIds.filter((id) => uuid.test(id));
  if (ids.length === 0) return emails;

  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/users?select=id,email&id=in.(${ids.join(',')})`, {
    headers: serviceHeaders(env),
  });
  if (response.ok) {
    const rows = (await response.json()) as Array<{ id: string; email: string | null }>;
    for (const row of rows) if (row.email) emails.set(row.id, row.email);
  } else {
    console.warn(`users email lookup failed: HTTP ${response.status}`);
  }

  for (const id of ids.filter((i) => !emails.has(i))) {
    const admin = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${id}`, {
      headers: serviceHeaders(env),
    });
    if (admin.ok) {
      const user = (await admin.json()) as { email?: string };
      if (user.email) emails.set(id, user.email);
    }
  }
  return emails;
}

/** USD prices from CoinGecko, batched so the query string stays short. */
async function fetchCurrentPrices(env: Env, coinIds: string[]): Promise<Record<string, { usd: number }>> {
  const out: Record<string, { usd: number }> = {};
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (env.COINGECKO_API_KEY) headers['x-cg-demo-api-key'] = env.COINGECKO_API_KEY;

  for (let i = 0; i < coinIds.length; i += COINGECKO_BATCH) {
    const batch = coinIds.slice(i, i + COINGECKO_BATCH).map(encodeURIComponent).join(',');
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${batch}&vs_currencies=usd`, {
      headers,
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch prices: HTTP ${response.status}`);
    }
    Object.assign(out, (await response.json()) as Record<string, { usd: number }>);
  }
  return out;
}

function escapeHtml(s: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return s.replace(/[&<>"']/g, (c) => map[c]);
}

function buildPriceAlertEmail(
  symbol: string,
  coinName: string,
  targetPrice: number,
  currentPrice: number,
  condition: 'above' | 'below'
): { subject: string; html: string } {
  const subject = `Price Alert: ${symbol} ${condition === 'above' ? 'Above' : 'Below'} $${targetPrice.toLocaleString()}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Price Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f1419;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f1419; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #1a1f2e; border-radius: 12px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Price Alert
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 24px; color: #9ca3af; font-size: 16px; line-height: 1.6; text-align: center;">
                <strong style="color: #ffffff;">${escapeHtml(coinName)} (${escapeHtml(symbol)})</strong> has ${condition === 'above' ? 'risen above' : 'fallen below'} your target price!
              </p>

              <div style="background-color: #111827; border-radius: 12px; padding: 24px; margin: 0 0 24px; text-align: center;">
                <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Current Price</p>
                <p style="margin: 0 0 16px; color: #f97316; font-size: 42px; font-weight: bold; line-height: 1;">
                  $${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </p>
                <div style="height: 1px; background-color: #374151; margin: 16px 0;"></div>
                <p style="margin: 0; color: #9ca3af; font-size: 14px;">
                  Your target: <span style="color: #ffffff; font-weight: 600;">$${targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                </p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <a href="https://bitcoinvestments.net/dashboard" style="display: inline-block; padding: 14px 32px; background-color: #f97316; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      View Live Prices →
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background-color: #111827; border-left: 3px solid #f97316; padding: 16px; border-radius: 4px;">
                <p style="margin: 0; color: #d1d5db; font-size: 13px; line-height: 1.5;">
                  <strong style="color: #ffffff;">💡 Tip:</strong> Crypto prices can be volatile. Always do your own research before making investment decisions.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #111827; padding: 24px 30px; text-align: center; border-top: 1px solid #374151;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;">
                This is an automated alert from Bitcoin Investments
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 11px;">
                <a href="https://bitcoinvestments.net/profile" style="color: #9ca3af; text-decoration: underline;">Manage Alerts</a>
                &nbsp;•&nbsp;
                <a href="https://bitcoinvestments.net/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy Policy</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;  return { subject, html };
}

/** Deactivates a delivered alert and records the id it was resolved to. */
async function markAlertAsTriggered(
  env: Env,
  alertId: string,
  coinId: string,
  backoffSupported: boolean
): Promise<void> {
  const triggeredAt = new Date().toISOString();
  const body: Record<string, unknown> = {
    is_active: false,
    triggered_at: triggeredAt,
    // Heal legacy ticker-valued rows as they fire.
    cryptocurrency_id: coinId,
  };
  if (backoffSupported) {
    body.last_attempt_at = triggeredAt;
    body.last_error = null;
  }
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/price_alerts?id=eq.${encodeURIComponent(alertId)}`, {
    method: 'PATCH',
    headers: { ...serviceHeaders(env), Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    console.error(`Failed to mark alert ${alertId} as triggered: HTTP ${response.status}`);
  }
}

/**
 * Records a failed delivery. Returns true when the alert was deactivated.
 * Without the backoff columns there is nowhere to count attempts, so a user
 * with no email address is deactivated immediately (delivery can never
 * succeed) and other errors are retried on the next run.
 */
async function recordFailure(
  env: Env,
  alert: PriceAlertRow,
  error: string,
  backoffSupported: boolean
): Promise<boolean> {
  let body: Record<string, unknown>;
  let deactivate: boolean;

  if (backoffSupported) {
    const failures = (alert.failure_count ?? 0) + 1;
    deactivate = failures >= MAX_FAILURES || error === NO_EMAIL;
    body = {
      failure_count: failures,
      last_attempt_at: new Date().toISOString(),
      last_error: error.slice(0, 500),
      ...(deactivate ? { is_active: false } : {}),
    };
  } else {
    deactivate = error === NO_EMAIL;
    if (!deactivate) return false;
    body = { is_active: false };
  }

  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/price_alerts?id=eq.${encodeURIComponent(alert.id)}`, {
    method: 'PATCH',
    headers: { ...serviceHeaders(env), Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    console.error(`Failed to record delivery failure for alert ${alert.id}: HTTP ${response.status}`);
    return false;
  }
  return deactivate;
}
