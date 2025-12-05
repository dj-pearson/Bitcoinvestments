// Cloudflare Pages Function: Send Email via Amazon SES API
// Direct integration without needing Supabase Edge Functions

interface Env {
  AMAZON_SMTP_USER_NAME?: string;
  AMAZON_SMTP_PASSWORD?: string;
  AMAZON_SMTP_ENDPOINT?: string;
  VITE_FROM_EMAIL?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
}

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    // Parse request body
    const body: EmailRequest = await request.json();
    const { to, subject, html, from } = body;

    // Validate required fields
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: to, subject, html' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const fromEmail = from || env.VITE_FROM_EMAIL || 'Bitcoin Investments <noreply@bitcoinvestments.net>';

    // Use MailChannels (free for Cloudflare Workers)
    // This is simpler than AWS SES API and works out of the box
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
          email: fromEmail.match(/<(.+)>/)?.[1] || fromEmail,
          name: fromEmail.match(/^(.+?)\s*</)?.[1] || 'Bitcoin Investments',
        },
        subject: subject,
        content: [
          {
            type: 'text/html',
            value: html,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MailChannels error:', errorText);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Email service error: ${errorText}` 
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: `${Date.now()}-${to}` 
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Email send error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
