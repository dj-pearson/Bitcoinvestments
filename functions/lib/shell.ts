/**
 * Serving routes that are not prerendered.
 *
 * scripts/prerender.mjs writes a top-level 404.html, which turns off Cloudflare
 * Pages' SPA fallback: an unknown URL now gets a real 404 instead of the app
 * with status 200. Routes whose pages come from the database or live APIs
 * (/blog/:slug, /scam/:id, /coin/:id, /sponsored/:slug, /admin/*) cannot all be
 * prerendered, so these functions serve them explicitly:
 *
 *   1. a prerendered file for the URL, if the build wrote one;
 *   2. otherwise the SPA shell (dist/_shell.html), optionally with the head
 *      and body rewritten from a database row by the caller.
 */

export interface ShellEnv {
  ASSETS: { fetch: (input: Request | URL | string) => Promise<Response> };
}

export interface PageContext<E extends ShellEnv = ShellEnv> {
  request: Request;
  env: E;
  params: Record<string, string | string[]>;
  waitUntil: (promise: Promise<unknown>) => void;
}

/** Fetch the prerendered asset for this URL, or null when there is none. */
export async function prerendered(context: PageContext): Promise<Response | null> {
  const response = await context.env.ASSETS.fetch(context.request);
  return response.status === 404 ? null : response;
}

/** The SPA shell, with the header that keeps /_shell itself out of search removed. */
export async function shell(context: PageContext, status = 200): Promise<Response> {
  const asset = await context.env.ASSETS.fetch(new URL('/_shell', context.request.url));
  const headers = new Headers(asset.headers);
  headers.delete('X-Robots-Tag');
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('Cache-Control', 'no-cache');
  return new Response(asset.body, { status, headers });
}

/** The prerendered 404 page with a real 404 status. */
export async function notFound(context: PageContext): Promise<Response> {
  const asset = await context.env.ASSETS.fetch(new URL('/404', context.request.url));
  const headers = new Headers(asset.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  return new Response(asset.body, { status: 404, headers });
}

/** Default handler: prerendered file if present, else the client-rendered shell. */
export async function prerenderedOrShell(context: PageContext): Promise<Response> {
  return (await prerendered(context)) ?? shell(context);
}

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
