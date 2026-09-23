/**
 * Outbound email for Pages Functions.
 *
 * Resend is the provider the scheduled jobs already use (check-price-alerts).
 * MailChannels is kept only as a fallback for deployments that have not set a
 * RESEND_API_KEY: its free Cloudflare Workers tier ended in 2024, so without an
 * account-level API key it rejects every message.
 */

export interface MailerEnv {
  RESEND_API_KEY?: string;
  MAILCHANNELS_API_KEY?: string;
  FROM_EMAIL?: string;
  VITE_FROM_EMAIL?: string;
}

export interface OutboundEmail {
  to: string;
  subject: string;
  html: string;
}

const DEFAULT_FROM = 'Bitcoinvestments <noreply@bitcoinvestments.net>';

function senderOf(env: MailerEnv): string {
  return env.FROM_EMAIL || env.VITE_FROM_EMAIL || DEFAULT_FROM;
}

export async function sendMail(
  env: MailerEnv,
  message: OutboundEmail
): Promise<{ ok: true } | { ok: false; error: string }> {
  const from = senderOf(env);
  const to = message.to.trim().toLowerCase();

  if (env.RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from, to: [to], subject: message.subject, html: message.html }),
    });
    if (!response.ok) {
      console.error('Resend error:', await response.text());
      return { ok: false, error: 'Email service error' };
    }
    return { ok: true };
  }

  if (env.MAILCHANNELS_API_KEY) {
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': env.MAILCHANNELS_API_KEY },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: {
          email: from.match(/<(.+)>/)?.[1] || from,
          name: from.match(/^(.+?)\s*</)?.[1] || 'Bitcoinvestments',
        },
        subject: message.subject,
        content: [{ type: 'text/html', value: message.html }],
      }),
    });
    if (!response.ok) {
      console.error('MailChannels error:', await response.text());
      return { ok: false, error: 'Email service error' };
    }
    return { ok: true };
  }

  return { ok: false, error: 'Email is not configured' };
}
