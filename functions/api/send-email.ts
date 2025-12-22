// Cloudflare Pages Function: Send Email via MailChannels
// With comprehensive input validation and sanitization

import {
  parseAndValidateBody,
  validateEmailContent,
  sanitizeString,
  jsonError,
  jsonSuccess,
} from '../lib/validation';

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
    // Parse and validate request body
    const { data: body, error: parseError } = await parseAndValidateBody<EmailRequest>(
      request,
      ['to', 'subject', 'html']
    );

    if (parseError || !body) {
      return jsonError(parseError || 'Invalid request body', 400);
    }

    const { to, subject, html, from } = body;

    // Validate email content
    const contentValidation = validateEmailContent({ to, subject, html });
    if (!contentValidation.isValid) {
      return jsonError(contentValidation.error || 'Invalid email content', 400);
    }

    // Sanitize subject (keep HTML in email body but sanitize subject)
    const sanitizedSubject = sanitizeString(subject);

    const fromEmail = from || env.VITE_FROM_EMAIL || 'Bitcoin Investments <noreply@bitcoinvestments.net>';

    // Use MailChannels (free for Cloudflare Workers)
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to.trim().toLowerCase() }],
          },
        ],
        from: {
          email: fromEmail.match(/<(.+)>/)?.[1] || fromEmail,
          name: fromEmail.match(/^(.+?)\s*</)?.[1] || 'Bitcoin Investments',
        },
        subject: sanitizedSubject,
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
      return jsonError(`Email service error: ${errorText}`, 500);
    }

    return jsonSuccess(
      {
        success: true,
        messageId: `${Date.now()}-${to.trim().toLowerCase()}`,
      },
      200
    );
  } catch (error) {
    console.error('Email send error:', error);
    return jsonError(
      error instanceof Error ? error.message : 'Failed to send email',
      500
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
