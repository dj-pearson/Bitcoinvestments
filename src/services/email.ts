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
  from?: string;
}

const FROM_EMAIL = import.meta.env.VITE_FROM_EMAIL || 'Bitcoin Investments <noreply@bitcoinvestments.net>';

// Email API endpoint (Cloudflare Function -> Supabase Edge Function -> Amazon SES)
const EMAIL_API_URL = import.meta.env.DEV 
  ? 'http://localhost:8788/api/send-email'  // Local development
  : '/api/send-email';  // Production (Cloudflare Function)

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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || FROM_EMAIL,
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
 * Send welcome email to new newsletter subscriber
 */
export async function sendNewsletterWelcomeEmail(email: string): Promise<{ success: boolean; error?: string }> {
  const subject = 'Welcome to Bitcoin Investments - Your Crypto Journey Starts Here! 🚀';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Bitcoin Investments</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f1419;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f1419; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #1a1f2e; border-radius: 12px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #fb923c 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                ₿ Bitcoin Investments
              </h1>
              <p style="margin: 10px 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">
                Your Crypto Education Hub
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #ffffff; font-size: 24px; font-weight: 600;">
                Welcome aboard! 🎉
              </h2>

              <p style="margin: 0 0 16px; color: #9ca3af; font-size: 16px; line-height: 1.6;">
                Thank you for subscribing to our newsletter! You've just taken the first step towards smarter crypto investing.
              </p>

              <p style="margin: 0 0 24px; color: #9ca3af; font-size: 16px; line-height: 1.6;">
                Here's what you can expect from us:
              </p>

              <!-- Benefits List -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                <tr>
                  <td style="padding: 12px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right: 12px; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background-color: #10b981; border-radius: 50%; text-align: center; line-height: 24px; color: #ffffff; font-size: 14px;">✓</span>
                        </td>
                        <td style="color: #d1d5db; font-size: 15px; line-height: 1.5;">
                          <strong style="color: #ffffff;">Weekly Market Insights</strong> - Simplified analysis you can actually understand
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right: 12px; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background-color: #10b981; border-radius: 50%; text-align: center; line-height: 24px; color: #ffffff; font-size: 14px;">✓</span>
                        </td>
                        <td style="color: #d1d5db; font-size: 15px; line-height: 1.5;">
                          <strong style="color: #ffffff;">Beginner-Friendly Guides</strong> - Learn crypto without the jargon
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right: 12px; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background-color: #10b981; border-radius: 50%; text-align: center; line-height: 24px; color: #ffffff; font-size: 14px;">✓</span>
                        </td>
                        <td style="color: #d1d5db; font-size: 15px; line-height: 1.5;">
                          <strong style="color: #ffffff;">Investment Tools</strong> - DCA calculators, exchange comparisons, and more
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right: 12px; vertical-align: top;">
                          <span style="display: inline-block; width: 24px; height: 24px; background-color: #10b981; border-radius: 50%; text-align: center; line-height: 24px; color: #ffffff; font-size: 14px;">✓</span>
                        </td>
                        <td style="color: #d1d5db; font-size: 15px; line-height: 1.5;">
                          <strong style="color: #ffffff;">Exclusive Deals</strong> - Special offers from trusted crypto platforms
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                <tr>
                  <td align="center">
                    <a href="https://bitcoininvestments.com/learn" style="display: inline-block; padding: 14px 32px; background-color: #f97316; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Start Learning Now →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Recommended Reading -->
              <div style="background-color: #111827; border-left: 3px solid #f97316; padding: 20px; margin: 0 0 30px; border-radius: 4px;">
                <h3 style="margin: 0 0 12px; color: #ffffff; font-size: 18px; font-weight: 600;">
                  📚 Recommended Reading
                </h3>
                <p style="margin: 0 0 8px;">
                  <a href="https://bitcoininvestments.com/learn/what-is-bitcoin" style="color: #f97316; text-decoration: none; font-weight: 500;">What is Bitcoin?</a>
                  <span style="color: #6b7280; font-size: 14px;"> - 8 min read</span>
                </p>
                <p style="margin: 0 0 8px;">
                  <a href="https://bitcoininvestments.com/learn/how-to-buy-crypto" style="color: #f97316; text-decoration: none; font-weight: 500;">How to Buy Your First Cryptocurrency</a>
                  <span style="color: #6b7280; font-size: 14px;"> - 10 min read</span>
                </p>
                <p style="margin: 0;">
                  <a href="https://bitcoininvestments.com/learn/crypto-wallets-explained" style="color: #f97316; text-decoration: none; font-weight: 500;">Crypto Wallets Explained</a>
                  <span style="color: #6b7280; font-size: 14px;"> - 12 min read</span>
                </p>
              </div>

              <p style="margin: 0 0 16px; color: #9ca3af; font-size: 16px; line-height: 1.6;">
                We're excited to be part of your crypto journey. If you have any questions or feedback, just reply to this email - we read every message!
              </p>

              <p style="margin: 0; color: #9ca3af; font-size: 16px; line-height: 1.6;">
                Happy investing! 🚀<br>
                <strong style="color: #ffffff;">The Bitcoin Investments Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #111827; padding: 30px; text-align: center; border-top: 1px solid #374151;">
              <p style="margin: 0 0 12px; color: #6b7280; font-size: 13px;">
                Bitcoin Investments - Your Crypto Education Hub
              </p>
              <p style="margin: 0 0 12px; color: #6b7280; font-size: 13px;">
                <a href="https://bitcoininvestments.com" style="color: #f97316; text-decoration: none;">Visit Website</a>
                &nbsp;•&nbsp;
                <a href="https://bitcoininvestments.com/learn" style="color: #f97316; text-decoration: none;">Learning Center</a>
                &nbsp;•&nbsp;
                <a href="https://bitcoininvestments.com/dashboard" style="color: #f97316; text-decoration: none;">Live Prices</a>
              </p>
              <p style="margin: 0 0 16px; color: #6b7280; font-size: 12px;">
                You're receiving this email because you subscribed to our newsletter.
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                <a href="{{unsubscribe_url}}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
                &nbsp;•&nbsp;
                <a href="https://bitcoininvestments.com/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy Policy</a>
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
