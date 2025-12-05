// Cloudflare Pages Function: Send Email via Amazon SES SMTP
// Uses Supabase secrets for SMTP credentials

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  AMAZON_SMTP_USER_NAME?: string;
  AMAZON_SMTP_PASSWORD?: string;
  AMAZON_SMTP_ENDPOINT?: string;
  VITE_FROM_EMAIL?: string;
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

    // Get SMTP credentials from environment
    const smtpUser = env.AMAZON_SMTP_USER_NAME;
    const smtpPassword = env.AMAZON_SMTP_PASSWORD;
    const smtpEndpoint = env.AMAZON_SMTP_ENDPOINT || 'email-smtp.us-east-1.amazonaws.com';
    const fromEmail = from || env.VITE_FROM_EMAIL || 'Bitcoin Investments <noreply@bitcoinvestments.net>';

    // Check if SMTP is configured
    if (!smtpUser || !smtpPassword) {
      console.error('Amazon SES SMTP not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email service not configured' 
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Build email message in RFC 822 format
    const boundary = `----=_NextPart_${Date.now()}`;
    const emailMessage = [
      `From: ${fromEmail}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      html,
      '',
      `--${boundary}--`,
    ].join('\r\n');

    // Send via Amazon SES SMTP using fetch
    // Note: We'll use the SES API instead of direct SMTP as Cloudflare Workers don't support SMTP
    const sesResponse = await sendViaSESAPI(
      env,
      {
        from: fromEmail,
        to,
        subject,
        html,
      }
    );

    if (sesResponse.success) {
      return new Response(
        JSON.stringify({ success: true, messageId: sesResponse.messageId }),
        {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    } else {
      throw new Error(sesResponse.error || 'Failed to send email');
    }
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

/**
 * Send email using Amazon SES API (since Workers don't support SMTP directly)
 * We'll use AWS SIG V4 signing
 */
async function sendViaSESAPI(
  env: Env,
  email: { from: string; to: string; subject: string; html: string }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // For now, we'll use Supabase's built-in email functionality
    // which is configured to use Amazon SES SMTP
    const supabaseUrl = env.SUPABASE_URL;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase not configured');
    }

    // Use Supabase Edge Function for email sending
    // Supabase Auth email will use the custom SMTP configured in dashboard
    // For transactional emails, we'll call our own Supabase function
    
    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify(email),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase function error: ${error}`);
    }

    const data = await response.json();
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('SES API error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

