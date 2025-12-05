// Supabase Edge Function: Send Email via Amazon SES SMTP
// Uses Deno's SMTP client to send emails through Amazon SES

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

interface EmailRequest {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // Parse request body
    const body: EmailRequest = await req.json();
    const { from, to, subject, html, text } = body;

    // Validate required fields
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get SMTP credentials from Supabase secrets
    const smtpUser = Deno.env.get('AMAZON_SMTP_USER_NAME');
    const smtpPassword = Deno.env.get('AMAZON_SMTP_PASSWORD');
    const smtpEndpoint = Deno.env.get('AMAZON_SMTP_ENDPOINT') || 'email-smtp.us-east-1.amazonaws.com';
    const smtpPort = parseInt(Deno.env.get('AMAZON_SMTP_PORT') || '587');

    if (!smtpUser || !smtpPassword) {
      console.error('Amazon SES SMTP credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: smtpEndpoint,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPassword,
        },
      },
    });

    // Extract plain text from HTML if not provided
    const plainText = text || html.replace(/<[^>]*>/g, '');

    // Send email
    console.log(`Sending email to ${to} via Amazon SES`);
    
    await client.send({
      from: from,
      to: to,
      subject: subject,
      content: plainText,
      html: html,
    });

    await client.close();

    console.log(`Email sent successfully to ${to}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        messageId: `${Date.now()}-${to}` // Simple message ID
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
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

