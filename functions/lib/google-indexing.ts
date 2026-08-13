/**
 * Google Indexing API Client
 *
 * Uses the GOOGLE_SERVICE_ACCOUNT_JSON environment variable
 * to authenticate via JWT and submit URLs to Google's Indexing API.
 *
 * Reference: https://developers.google.com/search/apis/indexing-api/v3/prereqs
 */

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  token_uri: string;
}

export type IndexingAction = 'URL_UPDATED' | 'URL_DELETED';

export interface IndexingResult {
  url: string;
  action: IndexingAction;
  success: boolean;
  status: number;
  response?: unknown;
  error?: string;
}

const INDEXING_API_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const SCOPE = 'https://www.googleapis.com/auth/indexing';

/**
 * Base64url encode (no padding, URL-safe)
 */
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

/**
 * Parse a PEM-encoded RSA private key and import it as a CryptoKey
 */
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

/**
 * Create a signed JWT for Google API authentication
 */
async function createSignedJWT(credentials: ServiceAccountCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: credentials.client_email,
    scope: SCOPE,
    aud: credentials.token_uri,
    iat: now,
    exp: now + 3600, // 1 hour
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

  const encodedSignature = base64urlEncode(new Uint8Array(signature));
  return `${signingInput}.${encodedSignature}`;
}

/**
 * Exchange JWT for an access token via Google's OAuth2 token endpoint
 */
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

/**
 * Parse the service account JSON from the environment variable
 */
function parseServiceAccountJSON(jsonString: string): ServiceAccountCredentials {
  const parsed = JSON.parse(jsonString);
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error('Invalid service account JSON: missing client_email or private_key');
  }
  return {
    client_email: parsed.client_email,
    private_key: parsed.private_key,
    token_uri: parsed.token_uri || 'https://oauth2.googleapis.com/token',
  };
}

/**
 * Submit a single URL to the Google Indexing API
 */
export async function submitUrlToGoogle(
  serviceAccountJson: string,
  url: string,
  action: IndexingAction = 'URL_UPDATED'
): Promise<IndexingResult> {
  const credentials = parseServiceAccountJSON(serviceAccountJson);
  const accessToken = await getAccessToken(credentials);

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
}

/**
 * Submit multiple URLs to the Google Indexing API
 * Processes sequentially to respect rate limits
 */
export async function submitUrlsToGoogle(
  serviceAccountJson: string,
  urls: string[],
  action: IndexingAction = 'URL_UPDATED'
): Promise<IndexingResult[]> {
  const credentials = parseServiceAccountJSON(serviceAccountJson);
  const accessToken = await getAccessToken(credentials);
  const results: IndexingResult[] = [];

  for (const url of urls) {
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

      results.push({
        url,
        action,
        success: response.ok,
        status: response.status,
        response: responseData,
        error: response.ok ? undefined : JSON.stringify(responseData),
      });
    } catch (error) {
      results.push({
        url,
        action,
        success: false,
        status: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}
