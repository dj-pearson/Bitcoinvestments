/**
 * POST /api/newsletter-welcome  { email }
 *
 * Sends the fixed welcome email to someone who has just joined the newsletter.
 *
 * Subscribers are anonymous, so this cannot require a login. It is kept safe by
 * accepting no content from the caller at all (the template is built here) and
 * by only mailing an address that is an active row in newsletter_subscribers
 * created within the last WINDOW_MINUTES - so it cannot be pointed at arbitrary
 * addresses, and repeated calls for the same address stop working quickly. The
 * /api rate-limit middleware bounds it further.
 */

import { jsonError, jsonSuccess, parseAndValidateBody, validateEmail } from '../lib/validation';
import { sendMail, type MailerEnv } from '../lib/mailer';
import { handleCorsPreflightRequest } from './_cors';

interface Env extends MailerEnv {
  VITE_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

const WINDOW_MINUTES = 10;
const SITE_URL = 'https://bitcoinvestments.net';

function welcomeHtml(): string {
  const link = (path: string, label: string) =>
    `<a href="${SITE_URL}${path}" style="color:#f97316;text-decoration:none;font-weight:500;">${label}</a>`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Welcome to Bitcoinvestments</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#0f1419;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1419;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#1a1f2e;border-radius:12px;overflow:hidden;">
<tr><td style="background:#f97316;padding:32px 30px;text-align:center;">
<h1 style="margin:0;color:#fff;font-size:26px;">Bitcoinvestments</h1>
<p style="margin:8px 0 0;color:#fff;font-size:15px;">Plain-English crypto education</p></td></tr>
<tr><td style="padding:32px 30px;color:#d1d5db;font-size:16px;line-height:1.6;">
<h2 style="margin:0 0 16px;color:#fff;font-size:22px;">Thanks for subscribing</h2>
<p style="margin:0 0 16px;">You'll get a short weekly email: what moved in the market and why, one concept explained simply, and new guides and tools as we publish them.</p>
<p style="margin:0 0 8px;">Good places to start:</p>
<p style="margin:0 0 6px;">${link('/learn/what-is-bitcoin', 'What is Bitcoin?')}</p>
<p style="margin:0 0 6px;">${link('/learn/how-to-buy-crypto', 'How to buy your first cryptocurrency')}</p>
<p style="margin:0 0 20px;">${link('/learn/crypto-wallets-explained', 'Crypto wallets explained')}</p>
<p style="margin:0;font-size:13px;color:#9ca3af;">Nothing we send is financial advice. Crypto is volatile - never invest more than you can afford to lose.</p>
</td></tr>
<tr><td style="background:#111827;padding:24px 30px;text-align:center;font-size:12px;color:#6b7280;">
You're receiving this because you subscribed at bitcoinvestments.net.<br>
${link('/privacy', 'Privacy Policy')}
</td></tr></table></td></tr></table></body></html>`;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const { data: body, error } = await parseAndValidateBody<{ email: string }>(request, ['email']);
  if (error || !body) return jsonError(error || 'Invalid request body', 400);

  const check = validateEmail(body.email);
  if (!check.isValid) return jsonError(check.error || 'Invalid email', 400);

  if (!env.VITE_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonError('Newsletter is not configured', 503);
  }

  const email = body.email.trim().toLowerCase();
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const query =
    `email=eq.${encodeURIComponent(email)}&is_active=eq.true` +
    `&subscribed_at=gte.${encodeURIComponent(since)}&select=id`;

  const lookup = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/newsletter_subscribers?${query}`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!lookup.ok) return jsonError('Lookup failed', 502);

  const rows = (await lookup.json()) as unknown[];
  // Same response whether or not the address qualified, so the endpoint cannot
  // be used to test who is subscribed.
  if (rows.length === 0) return jsonSuccess({ success: true }, 200);

  const result = await sendMail(env, {
    to: email,
    subject: 'Welcome to Bitcoinvestments',
    html: welcomeHtml(),
  });
  if (!result.ok) return jsonError(result.error, 502);

  return jsonSuccess({ success: true }, 200);
}

export async function onRequestOptions(context: { request: Request }) {
  return handleCorsPreflightRequest(context.request);
}
