/**
 * Route discovery shared by the indexing audit and the prerender step.
 *
 * Routes are read from src/App.tsx, and data-driven detail pages (guides,
 * course modules, comparison pages) are expanded from the repo data that
 * backs them, so neither script can drift from what actually renders.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

/**
 * Guide and course URLs are data-driven, but the data lives in the repo, so
 * like comparison pages they are checked exactly rather than waved through.
 */
export function extractContentUrls() {
  const urls = new Set();
  // One file per guide; its first `id:` is the guide's slug.
  for (const file of fs.readdirSync(path.join(root, 'src/data/guides'))) {
    if (!file.endsWith('.ts') || file === 'index.ts') continue;
    const id = read(`src/data/guides/${file}`).match(/^\s*id: '([a-z0-9-]+)'/m)?.[1];
    if (id) urls.add(`/learn/${id}`);
  }
  const courses = read('src/data/courses/index.ts');
  let course = null;
  for (const [, indent, id] of courses.matchAll(/^(\s*)id: '([a-z0-9-]+)'/gm)) {
    if (indent.length <= 2) {
      course = id;
      urls.add(`/course/${id}`);
    } else if (course) {
      urls.add(`/course/${course}/${id}`);
    }
  }
  return urls;
}

/**
 * Comparison detail URLs are data-driven but the data lives in the repo, so
 * they can be checked exactly. Compare.tsx matches the SINGULAR type segment
 * ('/compare/exchange/:id'); anything plural falls through to its
 * "Platform Not Found" branch.
 */
export function extractCompareUrls() {
  const ids = (file) =>
    [...read(file).matchAll(/^\s*id: '([a-z0-9-]+)'/gm)].map((m) => m[1]);

  return new Set([
    ...ids('src/data/exchanges.ts').map((id) => `/compare/exchange/${id}`),
    ...ids('src/data/wallets.ts').map((id) => `/compare/wallet/${id}`),
  ]);
}

/**
 * Extract every statically addressable route from App.tsx, resolving the paths
 * of nested <Route> children against their parent.
 */
export function extractRoutes() {
  const lines = read('src/App.tsx').split('\n');
  const parents = [];
  const routes = [];

  for (const line of lines) {
    const match = line.match(/path="([^"]*)"/);

    if (match) {
      const segment = match[1];
      const base = parents.join('/');
      const joined = segment === '/' ? base || '/' : `${base}/${segment}`;
      const full = joined === '/' ? '/' : `/${joined}`.replace(/\/+/g, '/').replace(/\/$/, '');

      // ':' marks a route param and '*' the catch-all; neither is a fixed URL.
      if (!full.includes(':') && !full.includes('*')) {
        routes.push({
          path: full,
          // A route whose FeatureGate has a public fallback page (served while
          // accounts are off) is not login-walled for crawlers.
          gated: line.includes('<ProtectedRoute>') && !line.includes('fallback='),
          // A route whose element is only a <Navigate> is a redirect, not a page.
          redirect: /element=\{<Navigate /.test(line),
        });
      }

      // A <Route> that is not self-closing wraps the routes that follow.
      if (!line.trimEnd().endsWith('/>')) {
        parents.push(segment === '/' ? '' : segment.replace(/^\/|\/$/g, ''));
      }
    }

    if (line.includes('</Route>') && parents.length > 0) {
      parents.pop();
    }
  }

  return routes;
}
