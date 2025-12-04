/**
 * Price Alert Checker - Cloudflare Worker
 * 
 * This function runs on a schedule to:
 * 1. Fetch all active price alerts from Supabase
 * 2. Get current cryptocurrency prices from CoinGecko
 * 3. Check if any alerts should be triggered
 * 4. Send email notifications to users
 * 5. Mark alerts as triggered in the database
 */

interface Env {
  // Supabase
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  
  // Resend Email
  RESEND_API_KEY: string;
  FROM_EMAIL: string;
}

interface PriceAlert {
  id: string;
  user_id: string;
  user_email?: string;
  cryptocurrency_id: string;
  symbol: string;
  target_price: number;
  condition: 'above' | 'below';
  is_active: boolean;
  created_at: string;
}

interface CoinGeckoPriceResponse {
  [coinId: string]: {
    usd: number;
  };
}

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // Verify this is a cron request or authorized request
  const authHeader = request.headers.get('Authorization');
  const cronHeader = request.headers.get('X-Cloudflare-Cron');
  
  // Allow cron jobs or requests with valid auth token
  if (!cronHeader && authHeader !== `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('Starting price alert check...');

    // Step 1: Fetch all active price alerts from Supabase
    const alerts = await fetchActiveAlerts(env);
    
    if (alerts.length === 0) {
      console.log('No active alerts found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active alerts to check',
          checked: 0,
          triggered: 0
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Found ${alerts.length} active alerts`);

    // Step 2: Get unique cryptocurrency IDs
    const cryptoIds = [...new Set(alerts.map(a => a.cryptocurrency_id))];

    // Step 3: Fetch current prices from CoinGecko
    const prices = await fetchCurrentPrices(cryptoIds);

    // Step 4: Check each alert and trigger if necessary
    let triggeredCount = 0;
    const results = [];

    for (const alert of alerts) {
      const currentPrice = prices[alert.cryptocurrency_id]?.usd;

      if (!currentPrice) {
        console.log(`No price data for ${alert.cryptocurrency_id}, skipping`);
        continue;
      }

      // Check if alert should be triggered
      const shouldTrigger =
        (alert.condition === 'above' && currentPrice >= alert.target_price) ||
        (alert.condition === 'below' && currentPrice <= alert.target_price);

      if (shouldTrigger) {
        console.log(
          `Alert triggered: ${alert.symbol} ${alert.condition} $${alert.target_price} (current: $${currentPrice})`
        );

        // Send email notification
        const emailSent = await sendPriceAlertEmail(
          env,
          alert.user_email || '',
          alert.symbol,
          alert.cryptocurrency_id,
          alert.target_price,
          currentPrice,
          alert.condition
        );

        // Mark alert as triggered in database
        if (emailSent) {
          await markAlertAsTriggered(env, alert.id);
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
          results.push({
            alertId: alert.id,
            symbol: alert.symbol,
            error: 'Failed to send email',
          });
        }
      }
    }

    console.log(`Price alert check complete. Triggered: ${triggeredCount}/${alerts.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        checked: alerts.length,
        triggered: triggeredCount,
        results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error checking price alerts:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to check price alerts',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Fetch all active price alerts from Supabase
 */
async function fetchActiveAlerts(env: Env): Promise<PriceAlert[]> {
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/price_alerts?is_active=eq.true&select=id,user_id,cryptocurrency_id,symbol,target_price,condition,is_active,created_at`,
    {
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch alerts: ${response.statusText}`);
  }

  const alerts = await response.json();

  // Fetch user emails for each alert
  const alertsWithEmails = await Promise.all(
    alerts.map(async (alert: PriceAlert) => {
      const userResponse = await fetch(
        `${env.SUPABASE_URL}/auth/v1/admin/users/${alert.user_id}`,
        {
          headers: {
            'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
        }
      );

      if (userResponse.ok) {
        const userData = await userResponse.json();
        return { ...alert, user_email: userData.email };
      }

      return alert;
    })
  );

  return alertsWithEmails;
}

/**
 * Fetch current prices from CoinGecko API
 */
async function fetchCurrentPrices(
  cryptoIds: string[]
): Promise<CoinGeckoPriceResponse> {
  const ids = cryptoIds.join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch prices: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Send price alert email notification
 */
async function sendPriceAlertEmail(
  env: Env,
  userEmail: string,
  symbol: string,
  cryptoName: string,
  targetPrice: number,
  currentPrice: number,
  condition: 'above' | 'below'
): Promise<boolean> {
  if (!env.RESEND_API_KEY || !userEmail) {
    console.warn('Email not configured or user email missing');
    return false;
  }

  const subject = `🚨 Price Alert: ${symbol} ${condition === 'above' ? 'Above' : 'Below'} $${targetPrice.toLocaleString()}`;

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
                🚨 Price Alert
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 24px; color: #9ca3af; font-size: 16px; line-height: 1.6; text-align: center;">
                <strong style="color: #ffffff;">${cryptoName} (${symbol})</strong> has ${condition === 'above' ? 'risen above' : 'fallen below'} your target price!
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
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || 'Bitcoin Investments <alerts@bitcoinvestments.net>',
        to: [userEmail],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to send email:', error);
      return false;
    }

    console.log(`Email sent to ${userEmail} for ${symbol} alert`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Mark price alert as triggered in Supabase
 */
async function markAlertAsTriggered(env: Env, alertId: string): Promise<void> {
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/price_alerts?id=eq.${alertId}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        is_active: false,
        triggered_at: new Date().toISOString(),
      }),
    }
  );

  if (!response.ok) {
    console.error(`Failed to mark alert ${alertId} as triggered`);
  }
}

