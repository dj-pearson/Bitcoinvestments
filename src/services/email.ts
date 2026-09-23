/**
 * Email Service
 *
 * Handles all email sending through Amazon SES SMTP via Supabase.
 * SMTP credentials are configured in Supabase secrets:
 * - AMAZON_SMTP_USER_NAME
 * - AMAZON_SMTP_PASSWORD
 * - AMAZON_SMTP_ENDPOINT
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Email API endpoint (Cloudflare Function -> Supabase Edge Function -> Amazon SES)
const EMAIL_API_URL = import.meta.env.DEV 
  ? 'http://localhost:8788/api/send-email'  // Local development
  : '/api/send-email';  // Production (Cloudflare Function)

/**
 * /api/send-email only accepts signed-in callers (it would otherwise be an open
 * relay), so every request carries the current Supabase access token.
 */
export async function emailAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const { supabase } = await import('../lib/supabase');
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return headers;
}

/**
 * Check if email service is configured
 * In production, this always returns true as SMTP is configured server-side
 */
export function isEmailConfigured(): boolean {
  return true;  // Amazon SES SMTP is configured in Supabase secrets
}

/**
 * Send an email using Amazon SES SMTP
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(EMAIL_API_URL, {
      method: 'POST',
      headers: await emailAuthHeaders(),
      body: JSON.stringify({
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Email send failed:', data);
      return { success: false, error: data.error || 'Failed to send email' };
    }

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: 'Network error sending email' };
  }
}

/**
 * Send the welcome email to a new newsletter subscriber.
 *
 * Subscribers are anonymous, so this cannot go through /api/send-email. The
 * dedicated endpoint renders a fixed server-side template and only mails an
 * address that was added to newsletter_subscribers in the last few minutes.
 */
export async function sendNewsletterWelcomeEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/newsletter-welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      return { success: false, error: 'Failed to send welcome email' };
    }
    return { success: true };
  } catch {
    return { success: false, error: 'Network error sending email' };
  }
}

/**
 * Send weekly newsletter to all active subscribers
 * This would be called by a cron job or scheduled function
 */
export async function sendWeeklyNewsletter(
  subscribers: string[],
  content: {
    subject: string;
    html: string;
  }
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const email of subscribers) {
    const result = await sendEmail({
      to: email,
      subject: content.subject,
      html: content.html,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
    }

    // Rate limiting: wait 100ms between emails to avoid API limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { sent, failed };
}

/**
 * Send price alert notification
 */
export async function sendPriceAlert(
  email: string,
  cryptocurrency: string,
  symbol: string,
  targetPrice: number,
  currentPrice: number,
  condition: 'above' | 'below'
): Promise<{ success: boolean; error?: string }> {
  const subject = `🚨 Price Alert: ${symbol} ${condition === 'above' ? 'Above' : 'Below'} $${targetPrice.toLocaleString()}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Price Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: sans-serif; background-color: #0f1419;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #1a1f2e; border-radius: 12px; padding: 40px;">
          <tr>
            <td align="center">
              <h1 style="margin: 0 0 20px; color: #ffffff; font-size: 24px;">
                🚨 Price Alert Triggered
              </h1>
              <p style="margin: 0 0 30px; color: #9ca3af; font-size: 16px;">
                ${cryptocurrency} (${symbol}) has ${condition === 'above' ? 'risen above' : 'fallen below'} your target price.
              </p>

              <div style="background-color: #111827; border-radius: 8px; padding: 20px; margin: 0 0 30px;">
                <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; text-transform: uppercase;">Current Price</p>
                <p style="margin: 0; color: #f97316; font-size: 36px; font-weight: bold;">
                  $${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>

              <p style="margin: 0 0 30px; color: #9ca3af; font-size: 14px;">
                Your target was: $${targetPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>

              <a href="https://bitcoininvestments.com/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #f97316; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
                View Live Prices
              </a>

              <p style="margin: 30px 0 0; color: #6b7280; font-size: 12px;">
                This is an automated alert from Bitcoin Investments.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({ to: email, subject, html });
}
