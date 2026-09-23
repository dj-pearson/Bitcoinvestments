#!/usr/bin/env node
/**
 * Build-time prerendering.
 *
 * Runs after `vite build` (browser bundle -> dist/) and
 * `vite build --ssr src/entry-server.tsx --outDir dist-ssr`. For every public
 * route whose content lives in the repo it renders the React tree to HTML and
 * writes it next to the SPA, so crawlers and AI engines that never run
 * JavaScript receive the page's real title, meta, canonical, JSON-LD, H1 and
 * body text. The browser then hydrates that HTML and live data (CoinGecko,
 * Supabase) loads on top, exactly as before.
 *
 * Output
 *   dist/index.html              the homepage
 *   dist/<path>.html             every other route (Pages serves /learn from learn.html)
 *   dist/404.html                NotFound; its presence makes Pages return a real
 *                                404 for unknown URLs instead of the SPA with 200
 *   dist/_shell.html             the empty SPA, served by functions/ for
 *                                database-driven routes (/blog/:slug, /scam/:id ...)
 *   dist/sitemap.xml             every indexable prerendered route
 *
 * Checks (indexable pages only): exactly one <h1>, a self-referencing
 * canonical, title <= 60 and description <= 160 characters, no render errors.
 * Violations are printed; they fail the build when PRERENDER_STRICT=1 (CI).
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { root, read, extractRoutes, extractContentUrls, extractCompareUrls } from './lib/routes.mjs';

const SITE_URL = 'https://bitcoinvestments.net';
const DIST = path.join(root, 'dist');
const SSR_ENTRY = path.join(root, 'dist-ssr', 'entry-server.js');
const STRICT = process.env.PRERENDER_STRICT === '1';

const { render, shouldNoindex, prerenderExtraPaths } = await import(pathToFileURL(SSR_ENTRY).href);

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

// dist/index.html is overwritten with the prerendered homepage below, so a
// re-run (without a fresh vite build) takes the template from the shell copy.
const shellPath = path.join(DIST, '_shell.html');
const template = fs.readFileSync(fs.existsSync(shellPath) ? shellPath : path.join(DIST, 'index.html'), 'utf8');
const HEAD_RE = /<!--head:start-->[\s\S]*?<!--head:end-->/;
const ROOT_TAG = '<div id="root"></div>';
if (!HEAD_RE.test(template) || !template.includes(ROOT_TAG)) {
  throw new Error('dist/index.html is missing the head markers or the empty #root');
}

function page(head, html) {
  return template
    .replace(HEAD_RE, () => head)
    .replace(ROOT_TAG, () => `<div id="root" data-ssr="static">${html}</div>`);
}

function outFile(route) {
  if (route === '/') return path.join(DIST, 'index.html');
  return path.join(DIST, `${route.slice(1)}.html`);
}

function write(file, contents) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}

// The shell keeps index.html's generic head and an empty root. It is only ever
// served through functions/_lib/shell.ts, which replaces the head per route.
write(shellPath, template);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

const staticRoutes = extractRoutes()
  .filter((r) => !r.redirect && !r.path.startsWith('/admin'))
  .map((r) => r.path);

const routes = [
  ...new Set([
    ...staticRoutes,
    ...extractContentUrls(),
    ...extractCompareUrls(),
    ...(prerenderExtraPaths?.() ?? []),
  ]),
].filter((r) => r !== '/404');

// ---------------------------------------------------------------------------
// Render + check
// ---------------------------------------------------------------------------

const attr = (html, re) => html.match(re)?.[1]?.replace(/&amp;/g, '&').replace(/&quot;/g, '"') ?? '';
const problems = [];
const indexable = [];

async function renderRoute(route) {
  const { html, head, errors } = await render(route);
  const noindex = /<meta name="robots" content="noindex/.test(head) || shouldNoindex(route);

  if (!noindex) {
    const where = route;
    const h1s = (html.match(/<h1[\s>]/g) || []).length;
    const title = attr(head, /<title>([^<]*)<\/title>/);
    const description = attr(head, /<meta name="description" content="([^"]*)"/);
    const canonical = attr(head, /<link rel="canonical" href="([^"]*)"/);
    const expected = `${SITE_URL}${route === '/' ? '/' : route}`;

    if (errors.length) problems.push(`${where}: render error - ${errors[0].split('\n')[0]}`);
    if (h1s !== 1) problems.push(`${where}: ${h1s} <h1> elements (want exactly 1)`);
    if (title.length > 60) problems.push(`${where}: title is ${title.length} chars (max 60): "${title}"`);
    if (description.length > 160) problems.push(`${where}: description is ${description.length} chars (max 160)`);
    if (!description) problems.push(`${where}: no meta description`);
    if (canonical !== expected) problems.push(`${where}: canonical ${canonical || '(none)'} != ${expected}`);

    indexable.push(route);
  }

  write(outFile(route), page(head, html));
}

const started = Date.now();
for (const route of routes) {
  try {
    await renderRoute(route);
  } catch (error) {
    problems.push(`${route}: failed to render - ${error.message}`);
  }
}

// 404 page: rendered from the catch-all route.
// It is served for every unknown URL, so it is client-rendered rather than
// hydrated: the markup was rendered for /404 and would not match the route tree
// of whatever URL the visitor actually requested.
{
  const { html, head } = await render('/404');
  write(path.join(DIST, '404.html'), page(head, html).replace(' data-ssr="static"', ''));
}

// ---------------------------------------------------------------------------
// Sitemap
// ---------------------------------------------------------------------------

/** Source files whose last commit date is a route's lastmod. */
function sourcesFor(route) {
  if (route.startsWith('/learn/')) return [`src/data/guides/${route.split('/')[2]}.ts`];
  if (route.startsWith('/course/')) return ['src/data/courses'];
  if (route.startsWith('/compare/exchange/')) return ['src/data/exchanges.ts'];
  if (route.startsWith('/compare/wallet/')) return ['src/data/wallets.ts'];
  return [];
}

const pageFiles = new Map();
{
  const app = read('src/App.tsx');
  const imports = new Map(
    [...app.matchAll(/const (\w+) = lazy\(\(\) => import\('\.\/(pages\/[\w/]+)'\)/g)].map(([, name, file]) => [name, file])
  );
  for (const [, name, file] of app.matchAll(/import \{ (\w+) \} from '@\/(pages\/\w+)';/g)) imports.set(name, file);
  for (const line of app.split('\n')) {
    const p = line.match(/path="([^"]*)"/)?.[1];
    const el = line.match(/<(\w+) \/>/)?.[1];
    if (p && el && imports.has(el)) pageFiles.set(p.replace(/^\//, ''), `src/${imports.get(el)}.tsx`);
  }
}

function lastmod(route) {
  const files = [...sourcesFor(route)];
  const key = route === '/' ? '/' : route.slice(1).split('/')[0];
  if (pageFiles.has(key)) files.push(pageFiles.get(key));
  if (files.length === 0) return new Date().toISOString().slice(0, 10);
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...files], { cwd: root })
      .toString()
      .trim();
    return out || new Date().toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by scripts/prerender.mjs from the prerendered, indexable routes. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable
  .sort()
  .map((r) => `  <url>\n    <loc>${SITE_URL}${r === '/' ? '/' : r}</loc>\n    <lastmod>${lastmod(r)}</lastmod>\n  </url>`)
  .join('\n')}
</urlset>
`;
write(path.join(DIST, 'sitemap.xml'), sitemap);

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

console.log(
  `Prerendered ${routes.length} routes (${indexable.length} indexable) in ${((Date.now() - started) / 1000).toFixed(1)}s`
);
if (problems.length) {
  console.log(`\n${problems.length} prerender check(s) failed:\n  - ${problems.join('\n  - ')}`);
  if (STRICT) process.exit(1);
}
