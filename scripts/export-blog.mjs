#!/usr/bin/env node
/**
 * Build-time blog export.
 *
 * Fetches published posts, blog categories and public author profiles from
 * Supabase (PostgREST, anon/publishable key) and writes them to
 * src/content/blog/snapshot.json. The app renders that snapshot on first paint
 * (and the prerender step can turn it into static HTML), then merges live
 * results from Supabase on top in the browser.
 *
 * This script must never break a build. With no credentials, no network, or
 * any failed request it leaves the existing snapshot untouched, logs a warning
 * and exits 0.
 *
 * Env:
 *   VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY   (falls back to wrangler.toml [vars])
 *   BLOG_EXPORT_SKIP=1          do nothing
 *   BLOG_EXPORT_ALLOW_EMPTY=1   allow replacing a non-empty snapshot with zero posts
 *   BLOG_EXPORT_TIMEOUT_MS      per-request timeout (default 15000)
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = path.join(ROOT, 'src/content/blog/snapshot.json');
const TIMEOUT_MS = Number(process.env.BLOG_EXPORT_TIMEOUT_MS) || 15000;
const PAGE_SIZE = 500;

const POST_COLUMNS = [
  'id', 'slug', 'title', 'excerpt', 'content', 'featured_image', 'og_image',
  'category', 'tags', 'meta_keywords', 'seo_title', 'seo_description',
  'status', 'ai_generated', 'word_count', 'read_time_minutes',
  'published_at', 'created_at', 'updated_at', 'author_profile_id',
];
// Columns guaranteed by the original articles schema, used if the newer
// migrations (blog enhancements / public authors) have not been applied yet.
const BASE_POST_COLUMNS = [
  'id', 'slug', 'title', 'excerpt', 'content', 'featured_image',
  'category', 'tags', 'seo_title', 'seo_description', 'status',
  'read_time_minutes', 'published_at', 'created_at', 'updated_at',
];
const CATEGORY_COLUMNS = ['id', 'name', 'slug', 'description', 'sort_order', 'created_at'];
const AUTHOR_COLUMNS = [
  'id', 'slug', 'display_name', 'bio', 'credentials', 'avatar_url', 'profile_links',
];

const log = (msg) => console.log(`[export-blog] ${msg}`);
const warn = (msg) => console.warn(`[export-blog] WARNING: ${msg}`);

async function readWranglerVars() {
  try {
    const toml = await readFile(path.join(ROOT, 'wrangler.toml'), 'utf8');
    const vars = {};
    let inVars = false;
    for (const raw of toml.split(/\r?\n/)) {
      const line = raw.trim();
      if (line.startsWith('[')) {
        inVars = line === '[vars]';
        continue;
      }
      if (!inVars || !line || line.startsWith('#')) continue;
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*"([^"]*)"/);
      if (m) vars[m[1]] = m[2];
    }
    return vars;
  } catch {
    return {};
  }
}

async function getConfig() {
  let url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  let key =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    const vars = await readWranglerVars();
    url = url || vars.VITE_SUPABASE_URL;
    key = key || vars.VITE_SUPABASE_PUBLISHABLE_KEY;
  }
  if (!url || !key) return null;
  return { url: url.replace(/\/+$/, ''), key };
}

class HttpError extends Error {
  constructor(status, body) {
    super(`HTTP ${status}: ${body.slice(0, 200)}`);
    this.status = status;
  }
}

async function rest(config, table, query) {
  const headers = { apikey: config.key, Accept: 'application/json' };
  // Legacy anon keys are JWTs and also go in Authorization; the newer
  // sb_publishable_* keys are sent as `apikey` only.
  if (config.key.startsWith('eyJ')) headers.Authorization = `Bearer ${config.key}`;
  const res = await fetch(`${config.url}/rest/v1/${table}?${query}`, {
    headers,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new HttpError(res.status, await res.text().catch(() => ''));
  return res.json();
}

async function fetchAll(config, table, columns, filters, order) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const q = new URLSearchParams({ select: columns.join(','), order, limit: String(PAGE_SIZE), offset: String(offset) });
    const extra = filters ? `&${filters}` : '';
    const page = await rest(config, table, q.toString() + extra);
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows;
}

async function fetchPosts(config) {
  const run = (cols) => fetchAll(config, 'articles', cols, 'status=eq.published', 'published_at.desc.nullslast');
  try {
    return await run(POST_COLUMNS);
  } catch (err) {
    // 400 = unknown column: an older schema without the newer migrations.
    if (err instanceof HttpError && err.status === 400) {
      warn('articles is missing newer columns; exporting the base column set');
      return run(BASE_POST_COLUMNS);
    }
    throw err;
  }
}

async function fetchOptional(config, table, columns, order) {
  try {
    return await fetchAll(config, table, columns, '', order);
  } catch (err) {
    // 404 = table not created yet (e.g. public authors migration not applied).
    if (err instanceof HttpError && (err.status === 404 || err.status === 400)) {
      warn(`${table} unavailable (${err.message}); exporting it as empty`);
      return [];
    }
    throw err;
  }
}

async function readExisting() {
  if (!existsSync(SNAPSHOT_PATH)) return null;
  try {
    return JSON.parse(await readFile(SNAPSHOT_PATH, 'utf8'));
  } catch {
    return null;
  }
}

async function main() {
  if (process.env.BLOG_EXPORT_SKIP === '1') {
    log('BLOG_EXPORT_SKIP=1, leaving the snapshot as is');
    return;
  }

  const config = await getConfig();
  if (!config) {
    warn('Supabase URL/key not set; keeping the existing blog snapshot');
    return;
  }

  let posts, categories, authors;
  try {
    [posts, categories, authors] = await Promise.all([
      fetchPosts(config),
      fetchOptional(config, 'blog_categories', CATEGORY_COLUMNS, 'sort_order.asc'),
      fetchOptional(config, 'authors', AUTHOR_COLUMNS, 'display_name.asc'),
    ]);
  } catch (err) {
    warn(`export failed (${err?.message || err}); keeping the existing blog snapshot`);
    return;
  }

  const existing = await readExisting();
  if (posts.length === 0 && existing?.posts?.length > 0 && process.env.BLOG_EXPORT_ALLOW_EMPTY !== '1') {
    warn(
      `Supabase returned 0 published posts but the snapshot has ${existing.posts.length}; ` +
        'keeping the existing snapshot (set BLOG_EXPORT_ALLOW_EMPTY=1 to override)'
    );
    return;
  }

  const snapshot = {
    generatedAt: new Date().toISOString(),
    posts,
    categories,
    authors,
  };

  await mkdir(path.dirname(SNAPSHOT_PATH), { recursive: true });
  await writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + '\n');
  log(`wrote ${posts.length} posts, ${categories.length} categories, ${authors.length} authors`);
}

main().catch((err) => {
  // Last-resort guard: an export problem must never fail the build.
  warn(`unexpected error (${err?.stack || err}); keeping the existing blog snapshot`);
});
