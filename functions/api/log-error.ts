/**
 * Cloudflare Workers API: Error Logging Endpoint
 *
 * Receives error reports from the frontend and forwards them to
 * the error logging service (Sentry). Also logs to Cloudflare Logpush.
 *
 * This endpoint is useful for:
 * - Capturing errors that can't be caught by the frontend SDK
 * - Server-side validation of error reports
 * - Adding server-side context to errors
 */

import { getCorsHeaders, handleCorsPreflightRequest } from './_cors';

interface Env {
  SENTRY_DSN?: string;
}

interface ErrorReport {
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  userId?: string;
  sessionId?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: 'error' | 'warning' | 'info';
  timestamp?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const corsHeaders = getCorsHeaders(request);

  try {
    const body = await request.json() as ErrorReport;

    // Validate required fields
    if (!body.message) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: message' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Get client info
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const country = request.headers.get('CF-IPCountry') || 'unknown';
    const userAgent = body.userAgent || request.headers.get('User-Agent') || 'unknown';

    // Build the error report
    const errorReport = {
      message: body.message,
      stack: body.stack,
      url: body.url,
      userAgent,
      userId: body.userId,
      sessionId: body.sessionId,
      tags: {
        ...body.tags,
        source: 'frontend',
        country,
      },
      extra: {
        ...body.extra,
        clientIP,
        timestamp: body.timestamp || new Date().toISOString(),
      },
      level: body.level || 'error',
    };

    // Log to Cloudflare (visible in Logpush/Workers Logs)
    // Forward to Sentry if configured; avoid logging full report to console

    // If Sentry DSN is configured, forward to Sentry
    if (env.SENTRY_DSN) {
      try {
        // Note: For full Sentry integration in Workers, you'd need the Sentry SDK
        // This is a simplified version that logs the error
        // In production, consider using @sentry/cloudflare package

        // Parse the Sentry DSN
        const dsn = new URL(env.SENTRY_DSN);
        const projectId = dsn.pathname.replace('/', '');
        const publicKey = dsn.username;

        // Build Sentry event
        const sentryEvent = {
          event_id: crypto.randomUUID().replace(/-/g, ''),
          timestamp: new Date().toISOString(),
          platform: 'javascript',
          level: errorReport.level,
          logger: 'cloudflare-worker',
          message: {
            message: errorReport.message,
          },
          exception: errorReport.stack ? {
            values: [{
              type: 'Error',
              value: errorReport.message,
              stacktrace: {
                frames: parseStackTrace(errorReport.stack),
              },
            }],
          } : undefined,
          request: {
            url: errorReport.url,
            headers: {
              'User-Agent': userAgent,
            },
          },
          user: errorReport.userId ? {
            id: errorReport.userId,
          } : undefined,
          tags: errorReport.tags,
          extra: errorReport.extra,
        };

        // Send to Sentry
        const sentryUrl = `https://${dsn.host}/api/${projectId}/store/?sentry_version=7&sentry_key=${publicKey}`;

        await fetch(sentryUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sentryEvent),
        });
      } catch (sentryError) {
        console.error('[Sentry Error]', sentryError);
        // Don't fail the request if Sentry fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Error logged successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error) {
    console.error('Error processing error report:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to process error report',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

// Handle CORS preflight - uses shared CORS config for security
export const onRequestOptions: PagesFunction = async (context) => {
  return handleCorsPreflightRequest(context.request);
};

/**
 * Parse a JavaScript stack trace into Sentry frame format
 */
function parseStackTrace(stack: string): Array<{
  filename?: string;
  function?: string;
  lineno?: number;
  colno?: number;
}> {
  const lines = stack.split('\n');
  const frames: Array<{
    filename?: string;
    function?: string;
    lineno?: number;
    colno?: number;
  }> = [];

  for (const line of lines) {
    // Match Chrome/Node stack trace format
    const match = line.match(/^\s*at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)$/);
    if (match) {
      frames.push({
        function: match[1],
        filename: match[2],
        lineno: parseInt(match[3], 10),
        colno: parseInt(match[4], 10),
      });
      continue;
    }

    // Match anonymous function format
    const match2 = line.match(/^\s*at\s+(.+?):(\d+):(\d+)$/);
    if (match2) {
      frames.push({
        filename: match2[1],
        lineno: parseInt(match2[2], 10),
        colno: parseInt(match2[3], 10),
      });
    }
  }

  // Sentry expects frames in reverse order (most recent last)
  return frames.reverse();
}
