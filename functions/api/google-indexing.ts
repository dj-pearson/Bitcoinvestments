/**
 * Google Indexing API Endpoint
 *
 * Submits URLs to Google's Indexing API for faster crawling/indexing.
 * Requires GOOGLE_SERVICE_ACCOUNT_JSON and SUPABASE_SERVICE_ROLE_KEY secrets
 * set in Cloudflare Dashboard.
 *
 * POST /api/google-indexing
 * Headers: Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
 * Body: { "urls": ["https://..."], "action": "URL_UPDATED" | "URL_DELETED" }
 */

import {
  submitUrlToGoogle,
  submitUrlsToGoogle,
  type IndexingAction,
  type IndexingResult,
} from '../lib/google-indexing';

interface Env {
  GOOGLE_SERVICE_ACCOUNT_JSON: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface RequestBody {
  url?: string;
  urls?: string[];
  action?: IndexingAction;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Only allow POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify authorization
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify Google service account is configured
  if (!env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return new Response(
      JSON.stringify({ error: 'GOOGLE_SERVICE_ACCOUNT_JSON not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = (await request.json()) as RequestBody;
    const action: IndexingAction = body.action || 'URL_UPDATED';

    let results: IndexingResult[];

    if (body.urls && body.urls.length > 0) {
      // Batch submission
      if (body.urls.length > 200) {
        return new Response(
          JSON.stringify({ error: 'Maximum 200 URLs per request' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      results = await submitUrlsToGoogle(env.GOOGLE_SERVICE_ACCOUNT_JSON, body.urls, action);
    } else if (body.url) {
      // Single URL submission
      const result = await submitUrlToGoogle(env.GOOGLE_SERVICE_ACCOUNT_JSON, body.url, action);
      results = [result];
    } else {
      return new Response(
        JSON.stringify({ error: 'Missing "url" or "urls" in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        message: `Submitted ${results.length} URL(s): ${succeeded} succeeded, ${failed} failed`,
        results,
      }),
      {
        status: failed > 0 && succeeded === 0 ? 502 : 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Google Indexing API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
