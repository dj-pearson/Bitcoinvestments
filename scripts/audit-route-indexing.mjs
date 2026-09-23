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

/**
 * Route path prefixes whose children come from a CMS or database, so their
 * validity cannot be checked from the repo.
 */
const DYNAMIC_PREFIXES = ['/blog/', '/article/', '/coin/', '/scam/', '/sponsored/'];

/**
 * Guide and course URLs are data-driven, but the data lives in the repo, so
 * like comparison pages they are checked exactly rather than waved through.
 */
function extractContentUrls() {
  const urls = new Set();
  for (const [, slug] of read('src/data/guides/index.ts').matchAll(/^\s*'([a-z0-9-]+)':\s*\w+/gm)) {
    urls.add(`/learn/${slug}`);
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
function extractCompareUrls() {
  const ids = (file) =>
    [...read(file).matchAll(/^\s*id: '([a-z0-9-]+)'/gm)].map((m) => m[1]);

  return new Set([
    ...ids('src/data/exchanges.ts').map((id) => `/compare/exchange/${id}`),
    ...ids('src/data/wallets.ts').map((id) => `/compare/wallet/${id}`),
  ]);
}

/**
 * Site-relative URLs published for AI crawlers in llms.txt and ai.txt. These
 * files were hand-written and listed eleven guide and course URLs that never
 * existed, so they are held to the same rules as the sitemap.
 */
function extractAiFileUrls() {
  const urls = new Map();
  for (const file of ['public/llms.txt', 'public/ai.txt']) {
    const src = read(file);
    for (const [, url] of src.matchAll(/https:\/\/bitcoinvestments\.net(\/[a-z0-9/_-]*)(?![a-z0-9/_.-])/g)) {
      urls.set(url.replace(/\/$/, '') || '/', file);
    }
    for (const [, url] of src.matchAll(/\]\((\/[a-z0-9/_-]*)\)/g)) {
      urls.set(url.replace(/\/$/, '') || '/', file);
    }
    // ai.txt lists paths as YAML-ish "- /path" items. Only the ones offered
    // for citation count; restricted-paths is a deny list.
    const offered = src.split(/^restricted-paths:/m)[0];
    for (const [, url] of offered.matchAll(/^\s*-\s+(\/[a-z0-9/_-]+)\s*$/gm)) {
      urls.set(url, file);
    }
  }
  return urls;
}

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
const validCompareUrls = new Set([...extractCompareUrls(), ...extractContentUrls()]);

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
  if (!isDynamic && !declaredPaths.has(entry) && !validCompareUrls.has(entry)) {
    problems.push(`Listed but routeless: ${entry} is in public/sitemap.xml but matches no route.`);
  }
}

// The comparison detail pages are real content with their own review schema and
// canonical URLs, so an omission here means those pages are never submitted.
for (const url of validCompareUrls) {
  if (!sitemap.has(url)) {
    problems.push(`Indexable but unlisted: ${url} is a data-driven detail page missing from public/sitemap.xml.`);
  }
}

for (const [url, file] of extractAiFileUrls()) {
  const isDynamic = DYNAMIC_PREFIXES.some((prefix) => url.startsWith(prefix));
  if (isNoindexed(url)) {
    problems.push(`${file} lists ${url}, which emits "noindex".`);
  } else if (!isDynamic && !declaredPaths.has(url) && !validCompareUrls.has(url)) {
    problems.push(`${file} lists ${url}, which matches no route.`);
  }
}

if (problems.length === 0) {
  console.log(
    `Route indexing OK - ${routes.length} routes, ${sitemap.size} sitemap URLs, ` +
      `${validCompareUrls.size} comparison pages, no mismatches.`
  );
  process.exit(0);
}

console.error(`Route indexing audit found ${problems.length} problem(s):\n`);
for (const problem of problems) {
  console.error(`  - ${problem}`);
}
process.exit(1);
