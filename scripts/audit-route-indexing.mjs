#!/usr/bin/env node
/**
 * Route indexing audit.
 *
 * Cross-checks three sources that have to agree but live in different files and
 * drift apart silently:
 *
 *   1. src/App.tsx            - the routes that actually exist
 *   2. src/lib/index-pruning  - which of them emit noindex
 *   3. public/sitemap.xml     - which of them we ask Google to crawl
 *
 * Reports three classes of mismatch:
 *
 *   - Gated but indexable: a <ProtectedRoute> page telling crawlers to index it.
 *     Googlebot only ever reaches the auth redirect, so the URL lands in the
 *     index as thin or soft-404 content, which is exactly what index pruning
 *     exists to avoid.
 *   - Indexable but unlisted: a public page we never submit for crawling.
 *   - Listed but noindexed / missing: a sitemap URL that contradicts the meta
 *     robots tag, or points at no route at all. Both draw Search Console errors.
 *
 * Exits non-zero when anything is found, so it can gate a build.
 *
 * Usage: node scripts/audit-route-indexing.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const SITE_URL = 'https://bitcoinvestments.net';

/** Route path prefixes whose children are generated from data, not declared. */
const DYNAMIC_PREFIXES = [
  '/learn/',
  '/course/',
  '/blog/',
  '/article/',
  '/coin/',
  '/compare/',
  '/scam/',
  '/sponsored/',
];

/**
 * Extract every statically addressable route from App.tsx, resolving the paths
 * of nested <Route> children against their parent.
 */
function extractRoutes() {
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
        routes.push({ path: full, gated: line.includes('<ProtectedRoute>') });
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

/** Read the noindex path lists straight from index-pruning.ts. */
function extractNoindexRules() {
  const src = read('src/lib/index-pruning.ts');
  const list = (name) => {
    const match = src.match(new RegExp(`const ${name}: string\\[\\] = \\[([\\s\\S]*?)\\n\\];`));
    if (!match) throw new Error(`Could not find ${name} in src/lib/index-pruning.ts`);
    return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  };

  const exact = new Set([...list('NOINDEX_PATHS'), ...list('CONDITIONAL_INDEX_PATHS')]);
  const prefixes = list('NOINDEX_PREFIXES');

  return (routePath) =>
    exact.has(routePath) || prefixes.some((prefix) => routePath.startsWith(prefix));
}

/** Read the submitted URLs out of the sitemap as site-relative paths. */
function extractSitemap() {
  const xml = read('public/sitemap.xml');
  return new Set(
    [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1].replace(SITE_URL, '') || '/')
  );
}

const routes = extractRoutes();
const isNoindexed = extractNoindexRules();
const sitemap = extractSitemap();
const declaredPaths = new Set(routes.map((r) => r.path));

const problems = [];

for (const route of routes) {
  if (route.gated && !isNoindexed(route.path)) {
    problems.push(
      `Gated but indexable: ${route.path} is behind <ProtectedRoute> but emits "index". ` +
        `Add it to NOINDEX_PATHS in src/lib/index-pruning.ts.`
    );
  }

  if (!route.gated && !isNoindexed(route.path) && !sitemap.has(route.path)) {
    problems.push(
      `Indexable but unlisted: ${route.path} is public and indexable but is not in public/sitemap.xml.`
    );
  }
}

for (const entry of sitemap) {
  if (isNoindexed(entry)) {
    problems.push(
      `Listed but noindexed: ${entry} is in public/sitemap.xml but emits "noindex". ` +
        `Search Console reports these as "Submitted URL marked noindex".`
    );
  }

  const isDynamic = DYNAMIC_PREFIXES.some((prefix) => entry.startsWith(prefix));
  if (!isDynamic && !declaredPaths.has(entry)) {
    problems.push(`Listed but routeless: ${entry} is in public/sitemap.xml but matches no route.`);
  }
}

if (problems.length === 0) {
  console.log(
    `Route indexing OK - ${routes.length} routes, ${sitemap.size} sitemap URLs, no mismatches.`
  );
  process.exit(0);
}

console.error(`Route indexing audit found ${problems.length} problem(s):\n`);
for (const problem of problems) {
  console.error(`  - ${problem}`);
}
process.exit(1);
