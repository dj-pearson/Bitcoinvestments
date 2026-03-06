/**
 * Google Indexing API Worker
 *
 * Standalone Cloudflare Worker that submits URLs to Google's Indexing API.
 * Can be triggered via HTTP request or on a schedule.
 *
 * Environment secrets (set in Cloudflare Dashboard):
 * - GOOGLE_SERVICE_ACCOUNT_JSON: The full service account JSON export
 * - SUPABASE_SERVICE_ROLE_KEY: For auth verification on manual triggers
 * - PAGES_URL: The base URL of the site (e.g., https://bitcoinvestments.net)
 */

interface Env {
  GOOGLE_SERVICE_ACCOUNT_JSON: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  PAGES_URL: string;
}

type IndexingAction = 'URL_UPDATED' | 'URL_DELETED';

interface IndexingResult {
  url: string;
  action: IndexingAction;
  success: boolean;
  status: number;
  response?: unknown;
  error?: string;
}

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  token_uri: string;
}

const INDEXING_API_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const SCOPE = 'https://www.googleapis.com/auth/indexing';

function base64urlEncode(data: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function textToBase64url(text: string): string {
  return base64urlEncode(new TextEncoder().encode(text));
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace(/-----BEGIN (RSA )?PRIVATE KEY-----/g, '')
    .replace(/-----END (RSA )?PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  const binaryStr = atob(pemContents);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  return crypto.subtle.importKey(
    'pkcs8',
    bytes.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

async function createSignedJWT(credentials: ServiceAccountCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: credentials.client_email,
    scope: SCOPE,
    aud: credentials.token_uri,
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = textToBase64url(JSON.stringify(header));
  const encodedPayload = textToBase64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await importPrivateKey(credentials.private_key);
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput)
  );

  return `${signingInput}.${base64urlEncode(new Uint8Array(signature))}`;
}

async function getAccessToken(credentials: ServiceAccountCredentials): Promise<string> {
  const jwt = await createSignedJWT(credentials);

  const response = await fetch(credentials.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

async function submitUrl(
  accessToken: string,
  url: string,
  action: IndexingAction
): Promise<IndexingResult> {
  try {
    const response = await fetch(INDEXING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ url, type: action }),
    });

    const responseData = await response.json().catch(() => null);

    return {
      url,
      action,
      success: response.ok,
      status: response.status,
      response: responseData,
      error: response.ok ? undefined : JSON.stringify(responseData),
    };
  } catch (error) {
    return {
      url,
      action,
      success: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get the key pages to submit for indexing on a schedule
 */
function getSiteUrls(baseUrl: string): string[] {
  return [
    `${baseUrl}/`,
    `${baseUrl}/dashboard`,
    `${baseUrl}/charts`,
    `${baseUrl}/calculators`,
    `${baseUrl}/compare`,
    `${baseUrl}/learn`,
    `${baseUrl}/glossary`,
    `${baseUrl}/pricing`,
    `${baseUrl}/scam-database`,
    `${baseUrl}/staking-calculator`,
    `${baseUrl}/retirement-calculator`,
    `${baseUrl}/backtesting`,
    `${baseUrl}/whale-tracking`,
    `${baseUrl}/trading-indicators`,
    `${baseUrl}/onchain-analytics`,
    `${baseUrl}/defi-yield`,
  ];
}

export default {
  /**
   * Scheduled handler - runs on a cron schedule to submit key pages
   */
  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<void> {
    console.log('Running scheduled Google Indexing submission...');

    if (!env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      console.error('GOOGLE_SERVICE_ACCOUNT_JSON not configured');
      return;
    }

    try {
      const credentials: ServiceAccountCredentials = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
      const accessToken = await getAccessToken({
        client_email: credentials.client_email,
        private_key: credentials.private_key,
        token_uri: credentials.token_uri || 'https://oauth2.googleapis.com/token',
      });

      const urls = getSiteUrls(env.PAGES_URL || 'https://bitcoinvestments.net');
      let succeeded = 0;
      let failed = 0;

      for (const url of urls) {
        const result = await submitUrl(accessToken, url, 'URL_UPDATED');
        if (result.success) {
          succeeded++;
          console.log(`Indexed: ${url}`);
        } else {
          failed++;
          console.error(`Failed to index ${url}: ${result.error}`);
        }
      }

      console.log(`Indexing complete: ${succeeded} succeeded, ${failed} failed out of ${urls.length}`);
    } catch (error) {
      console.error('Error running Google Indexing:', error);
    }
  },

  /**
   * HTTP handler - allows manual URL submission
   */
  async fetch(request: Request, env: Env): Promise<Response> {
    // Verify auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      return new Response(
        JSON.stringify({ error: 'GOOGLE_SERVICE_ACCOUNT_JSON not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const body = (await request.json()) as {
        url?: string;
        urls?: string[];
        action?: IndexingAction;
      };

      const action: IndexingAction = body.action || 'URL_UPDATED';
      const urlsToSubmit: string[] = body.urls || (body.url ? [body.url] : []);

      if (urlsToSubmit.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Missing "url" or "urls" in request body' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (urlsToSubmit.length > 200) {
        return new Response(
          JSON.stringify({ error: 'Maximum 200 URLs per request' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const credentials: ServiceAccountCredentials = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
      const accessToken = await getAccessToken({
        client_email: credentials.client_email,
        private_key: credentials.private_key,
        token_uri: credentials.token_uri || 'https://oauth2.googleapis.com/token',
      });

      const results: IndexingResult[] = [];
      for (const url of urlsToSubmit) {
        results.push(await submitUrl(accessToken, url, action));
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
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};
