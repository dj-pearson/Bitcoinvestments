/**
 * Cloudflare Workers API: Send Weekly Newsletter
 *
 * This function sends the weekly newsletter to all active subscribers.
 * It's triggered by a cron job or can be manually called by admins.
 *
 * Features:
 * - Fetches all active newsletter subscribers
 * - Generates newsletter content (or uses provided content)
 * - Sends emails via MailChannels API
 * - Tracks sending status
 * - Handles errors and retries
 */

import { createClient } from '@supabase/supabase-js';

interface Env {
  VITE_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  FROM_EMAIL?: string;
}

interface NewsletterContent {
  subject: string;
  preheader?: string;
  headline: string;
  intro: string;
  highlights: { title: string; description: string; link?: string }[];
  marketUpdate?: {
    btcPrice?: string;
    btcChange?: string;
    ethPrice?: string;
    ethChange?: string;
  };
  educationalSpotlight?: {
    title: string;
    summary: string;
    link: string;
  };
  callToAction?: {
    text: string;
    link: string;
  };
}

interface SendResult {
  totalSubscribers: number;
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * Generate newsletter HTML from content
 */
function generateNewsletterHTML(content: NewsletterContent): string {
  const year = new Date().getFullYear();
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.subject}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; color: #e2e8f0; }
    .container { max-width: 600px; margin: 0 auto; padding: 0; }
    .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid #334155; }
    .logo { font-size: 24px; font-weight: bold; color: #f97316; text-decoration: none; }
    .date { font-size: 12px; color: #94a3b8; margin-top: 8px; }
    .content { padding: 32px 24px; background-color: #1e293b; }
    .headline { font-size: 28px; font-weight: bold; color: #ffffff; margin: 0 0 16px 0; line-height: 1.3; }
    .intro { font-size: 16px; color: #cbd5e1; line-height: 1.6; margin-bottom: 32px; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 18px; font-weight: 600; color: #f97316; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .highlight-card { background-color: #0f172a; border-radius: 8px; padding: 16px; margin-bottom: 12px; border: 1px solid #334155; }
    .highlight-title { font-size: 16px; font-weight: 600; color: #ffffff; margin: 0 0 8px 0; }
    .highlight-desc { font-size: 14px; color: #94a3b8; margin: 0; line-height: 1.5; }
    .highlight-link { display: inline-block; margin-top: 8px; font-size: 14px; color: #f97316; text-decoration: none; }
    .market-grid { display: table; width: 100%; border-collapse: collapse; }
    .market-item { display: table-cell; width: 50%; padding: 16px; text-align: center; background-color: #0f172a; border: 1px solid #334155; }
    .market-label { font-size: 12px; color: #94a3b8; margin: 0 0 4px 0; text-transform: uppercase; }
    .market-price { font-size: 20px; font-weight: bold; color: #ffffff; margin: 0; }
    .market-change { font-size: 14px; margin-top: 4px; }
    .market-change.positive { color: #22c55e; }
    .market-change.negative { color: #ef4444; }
    .spotlight { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 8px; padding: 20px; border: 1px solid #f97316; }
    .spotlight-title { font-size: 18px; font-weight: 600; color: #ffffff; margin: 0 0 8px 0; }
    .spotlight-text { font-size: 14px; color: #cbd5e1; margin: 0 0 12px 0; line-height: 1.5; }
    .spotlight-link { display: inline-block; padding: 10px 20px; background-color: #f97316; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500; }
    .cta { text-align: center; padding: 32px 24px; background-color: #0f172a; }
    .cta-button { display: inline-block; padding: 14px 32px; background-color: #f97316; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; }
    .footer { padding: 24px; text-align: center; background-color: #0f172a; border-top: 1px solid #334155; }
    .footer-text { font-size: 12px; color: #64748b; margin: 0 0 8px 0; }
    .footer-links { margin-top: 16px; }
    .footer-links a { color: #94a3b8; text-decoration: none; margin: 0 8px; font-size: 12px; }
    .unsubscribe { margin-top: 16px; }
    .unsubscribe a { color: #64748b; font-size: 11px; text-decoration: underline; }
    @media (max-width: 600px) {
      .market-item { display: block; width: 100%; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <a href="https://bitcoinvestments.net" class="logo">Bitcoinvestments</a>
      <p class="date">${date}</p>
    </div>

    <!-- Content -->
    <div class="content">
      <h1 class="headline">${content.headline}</h1>
      <p class="intro">${content.intro}</p>

      <!-- This Week's Highlights -->
      ${content.highlights.length > 0 ? `
      <div class="section">
        <h2 class="section-title">This Week's Highlights</h2>
        ${content.highlights.map(h => `
        <div class="highlight-card">
          <h3 class="highlight-title">${h.title}</h3>
          <p class="highlight-desc">${h.description}</p>
          ${h.link ? `<a href="${h.link}" class="highlight-link">Learn more &rarr;</a>` : ''}
        </div>
        `).join('')}
      </div>
      ` : ''}

      <!-- Market Update -->
      ${content.marketUpdate ? `
      <div class="section">
        <h2 class="section-title">Market Snapshot</h2>
        <div class="market-grid">
          ${content.marketUpdate.btcPrice ? `
          <div class="market-item">
            <p class="market-label">Bitcoin (BTC)</p>
            <p class="market-price">${content.marketUpdate.btcPrice}</p>
            ${content.marketUpdate.btcChange ? `
            <p class="market-change ${parseFloat(content.marketUpdate.btcChange) >= 0 ? 'positive' : 'negative'}">
              ${parseFloat(content.marketUpdate.btcChange) >= 0 ? '↑' : '↓'} ${content.marketUpdate.btcChange}
            </p>
            ` : ''}
          </div>
          ` : ''}
          ${content.marketUpdate.ethPrice ? `
          <div class="market-item">
            <p class="market-label">Ethereum (ETH)</p>
            <p class="market-price">${content.marketUpdate.ethPrice}</p>
            ${content.marketUpdate.ethChange ? `
            <p class="market-change ${parseFloat(content.marketUpdate.ethChange) >= 0 ? 'positive' : 'negative'}">
              ${parseFloat(content.marketUpdate.ethChange) >= 0 ? '↑' : '↓'} ${content.marketUpdate.ethChange}
            </p>
            ` : ''}
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}

      <!-- Educational Spotlight -->
      ${content.educationalSpotlight ? `
      <div class="section">
        <h2 class="section-title">Learn Something New</h2>
        <div class="spotlight">
          <h3 class="spotlight-title">${content.educationalSpotlight.title}</h3>
          <p class="spotlight-text">${content.educationalSpotlight.summary}</p>
          <a href="${content.educationalSpotlight.link}" class="spotlight-link">Read the Guide</a>
        </div>
      </div>
      ` : ''}
    </div>

    <!-- Call to Action -->
    ${content.callToAction ? `
    <div class="cta">
      <a href="${content.callToAction.link}" class="cta-button">${content.callToAction.text}</a>
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">You're receiving this because you subscribed to Bitcoinvestments newsletter.</p>
      <div class="footer-links">
        <a href="https://bitcoinvestments.net/learn">Guides</a>
        <a href="https://bitcoinvestments.net/compare">Compare</a>
        <a href="https://bitcoinvestments.net/charts">Charts</a>
        <a href="https://bitcoinvestments.net/glossary">Glossary</a>
      </div>
      <div class="unsubscribe">
        <a href="https://bitcoinvestments.net/unsubscribe?email={{email}}">Unsubscribe from this newsletter</a>
      </div>
      <p class="footer-text" style="margin-top: 16px;">&copy; ${year} Bitcoinvestments. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate default newsletter content with current market data
 */
async function generateDefaultContent(): Promise<NewsletterContent> {
  // Fetch current BTC/ETH prices
  let btcPrice = '$--,---';
  let btcChange = '0%';
  let ethPrice = '$-,---';
  let ethChange = '0%';

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true'
    );
    if (response.ok) {
      const data = await response.json();
      if (data.bitcoin) {
        btcPrice = `$${data.bitcoin.usd.toLocaleString()}`;
        btcChange = `${data.bitcoin.usd_24h_change?.toFixed(2) || 0}%`;
      }
      if (data.ethereum) {
        ethPrice = `$${data.ethereum.usd.toLocaleString()}`;
        ethChange = `${data.ethereum.usd_24h_change?.toFixed(2) || 0}%`;
      }
    }
  } catch (error) {
    console.error('Failed to fetch prices:', error);
  }

  // Get current week number
  const now = new Date();
  const weekNum = Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);

  return {
    subject: `Your Weekly Crypto Update - Week ${weekNum}`,
    preheader: 'Market insights, educational content, and platform news',
    headline: `Weekly Crypto Insights: Week ${weekNum}`,
    intro: `Welcome to your weekly crypto digest! Here's what's happening in the market and what you should know this week.`,
    highlights: [
      {
        title: 'Market Overview',
        description: `Bitcoin is trading at ${btcPrice} this week. Stay informed with our real-time charts and price alerts to track market movements.`,
        link: 'https://bitcoinvestments.net/charts',
      },
      {
        title: 'Compare Top Exchanges',
        description: `Looking for the best place to trade? Compare fees, features, and security across leading exchanges to find your perfect match.`,
        link: 'https://bitcoinvestments.net/compare',
      },
      {
        title: 'Plan Your Investment Strategy',
        description: `Use our DCA calculator to plan your investment strategy and see how dollar-cost averaging can help reduce volatility risk.`,
        link: 'https://bitcoinvestments.net/calculators',
      },
    ],
    marketUpdate: {
      btcPrice,
      btcChange,
      ethPrice,
      ethChange,
    },
    educationalSpotlight: {
      title: 'Understanding Dollar-Cost Averaging',
      summary: `DCA is a popular strategy where you invest a fixed amount regularly, regardless of price. Learn why many successful investors swear by this approach.`,
      link: 'https://bitcoinvestments.net/learn/dca-strategies',
    },
    callToAction: {
      text: 'Explore Our Guides',
      link: 'https://bitcoinvestments.net/learn',
    },
  };
}

/**
 * Send email via MailChannels API
 */
async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  fromEmail: string
): Promise<boolean> {
  try {
    // Personalize unsubscribe link
    const personalizedHtml = htmlContent.replace('{{email}}', encodeURIComponent(to));

    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
          },
        ],
        from: {
          email: fromEmail.includes('<') ? fromEmail.match(/<(.+)>/)?.[1] || fromEmail : fromEmail,
          name: fromEmail.includes('<') ? fromEmail.split('<')[0].trim() : 'Bitcoinvestments',
        },
        subject,
        content: [
          {
            type: 'text/html',
            value: personalizedHtml,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to send to ${to}:`, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error sending to ${to}:`, error);
    return false;
  }
}

/**
 * Main handler for POST requests
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Verify authorization
  const authHeader = request.headers.get('Authorization');
  const cronHeader = request.headers.get('X-Cloudflare-Cron');

  // Allow cron trigger or bearer token auth
  if (!cronHeader && authHeader !== `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse optional custom content from request body
    let customContent: NewsletterContent | null = null;
    try {
      const body = await request.json() as { content?: NewsletterContent };
      if (body.content) {
        customContent = body.content;
      }
    } catch {
      // No body or invalid JSON, will use default content
    }

    // Initialize Supabase client
    const supabase = createClient(
      env.VITE_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch active subscribers
    const { data: subscribers, error: subError } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .eq('is_active', true)
      .is('unsubscribed_at', null);

    if (subError) {
      console.error('Failed to fetch subscribers:', subError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscribers', details: subError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!subscribers || subscribers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active subscribers', sent: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate newsletter content
    const content = customContent || await generateDefaultContent();
    const htmlContent = generateNewsletterHTML(content);
    const fromEmail = env.FROM_EMAIL || 'Bitcoinvestments <noreply@bitcoinvestments.net>';

    // Send newsletters
    const result: SendResult = {
      totalSubscribers: subscribers.length,
      sent: 0,
      failed: 0,
      errors: [],
    };

    // Send in batches to avoid rate limiting
    const batchSize = 10;
    const delayBetweenBatches = 1000; // 1 second

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map(({ email }) => sendEmail(email, content.subject, htmlContent, fromEmail))
      );

      for (let j = 0; j < results.length; j++) {
        const sendResult = results[j];
        if (sendResult.status === 'fulfilled' && sendResult.value) {
          result.sent++;
        } else {
          result.failed++;
          result.errors.push(`Failed to send to ${batch[j].email}`);
        }
      }

      // Delay between batches
      if (i + batchSize < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    console.log(`Newsletter sent: ${result.sent}/${result.totalSubscribers} successful`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Newsletter sending error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to send newsletter',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Handle CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
