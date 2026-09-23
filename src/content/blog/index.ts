/**
 * Blog static baseline.
 *
 * `snapshot.json` is written at build time by scripts/export-blog.mjs from the
 * published rows in Supabase and committed, so every build — including one with
 * no database credentials — ships the last known posts. Pages render from this
 * data on their first (and server) render; src/services/blog.ts then merges
 * live Supabase results on top in the browser.
 *
 * Everything here is pure and synchronous: no Supabase client, no browser APIs.
 * The prerender step can import it directly.
 */

import rawSnapshot from './snapshot.json';
import type { BlogAuthor, BlogCategory, BlogPost, BlogSnapshot } from '../../types/blog';

/** Byline used when a post has no public author profile. */
export const FALLBACK_AUTHOR_NAME = 'Bitcoinvestments Editorial Team';

/** Lower-case, hyphenated slug ("Crypto Regulation" → "crypto-regulation"). */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Resolve a stored `articles.category` value to a category. Older rows store
 * the display name ("Bitcoin"), newer ones the slug ("bitcoin"); both match.
 */
export function resolveCategory(
  stored: string | null | undefined,
  categories: BlogCategory[]
): { slug: string; name: string } {
  const value = (stored || '').trim();
  const lower = value.toLowerCase();
  const match = categories.find(
    (c) => c.slug.toLowerCase() === lower || c.name.trim().toLowerCase() === lower
  );
  if (match) return { slug: match.slug, name: match.name };
  const slug = slugify(value);
  // Unknown category: keep what was stored as the label, title-cased if it
  // looks like a bare slug.
  const name = value && value === slug
    ? value.replace(/-/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())
    : value;
  return { slug, name };
}

type Row = Record<string, unknown>;

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const strOrNull = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);
const num = (v: unknown, fallback = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
/** Only absolute http(s) URLs are rendered as links or images. */
const isWebUrl = (v: string): boolean => /^https?:\/\//i.test(v);

export function normalizeAuthor(row: Row | null | undefined): BlogAuthor | null {
  if (!row || typeof row !== 'object' || !row.id || !row.display_name) return null;
  return {
    id: str(row.id),
    slug: str(row.slug),
    display_name: str(row.display_name),
    bio: strOrNull(row.bio),
    credentials: strOrNull(row.credentials),
    avatar_url: ((u) => (u && isWebUrl(u) ? u : null))(strOrNull(row.avatar_url)),
    profile_links: strArr(row.profile_links).filter(isWebUrl),
  };
}

export function normalizeCategory(row: Row): BlogCategory {
  return {
    id: str(row.id),
    name: str(row.name),
    slug: str(row.slug),
    description: strOrNull(row.description),
    sort_order: num(row.sort_order),
    created_at: str(row.created_at),
  };
}

/**
 * Turn a snapshot or PostgREST row into a complete BlogPost, with derived
 * category slug/name and the public author (embedded, or looked up by id).
 */
export function normalizePost(
  row: Row,
  categories: BlogCategory[],
  authors: BlogAuthor[]
): BlogPost {
  const cat = resolveCategory(str(row.category), categories);
  const authorProfileId = strOrNull(row.author_profile_id);
  const embedded = normalizeAuthor(row.author as Row | null | undefined);
  const author = embedded || (authorProfileId ? authors.find((a) => a.id === authorProfileId) || null : null);
  const content = str(row.content);
  const wordCount = num(row.word_count) || (content ? content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length : 0);
  const createdAt = str(row.created_at) || str(row.published_at);

  return {
    id: str(row.id),
    title: str(row.title),
    slug: str(row.slug),
    excerpt: str(row.excerpt),
    content,
    content_json: null,
    featured_image: strOrNull(row.featured_image),
    og_image: strOrNull(row.og_image),
    author_id: '',
    category: str(row.category),
    tags: strArr(row.tags),
    meta_keywords: strArr(row.meta_keywords),
    seo_title: strOrNull(row.seo_title),
    seo_description: strOrNull(row.seo_description),
    status: 'published',
    ai_generated: row.ai_generated === true,
    ai_source_urls: null,
    ai_generation_settings: null,
    word_count: wordCount,
    read_time_minutes: num(row.read_time_minutes) || Math.max(1, Math.ceil(wordCount / 200)),
    view_count: 0,
    last_edited_by: null,
    published_at: strOrNull(row.published_at),
    created_at: createdAt,
    updated_at: str(row.updated_at) || createdAt,
    author_profile_id: authorProfileId,
    author,
    category_slug: cat.slug,
    category_name: cat.name,
  };
}

const time = (iso: string | null | undefined): number => {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(t) ? 0 : t;
};

/** Newest first by published date, then by id for a stable order. */
export function sortPosts(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort(
    (a, b) => time(b.published_at || b.created_at) - time(a.published_at || a.created_at) || a.id.localeCompare(b.id)
  );
}

/** Timestamp helper shared with the service's merge logic. */
export const postTimestamp = (p: Pick<BlogPost, 'updated_at'>): number => time(p.updated_at);

interface RawSnapshot {
  generatedAt?: string | null;
  posts?: Row[];
  categories?: Row[];
  authors?: Row[];
}

function buildSnapshot(raw: RawSnapshot): BlogSnapshot {
  const categories = (raw.categories || [])
    .map(normalizeCategory)
    .filter((c) => c.slug)
    .sort((a, b) => a.sort_order - b.sort_order);
  const authors = (raw.authors || [])
    .map((a) => normalizeAuthor(a))
    .filter((a): a is BlogAuthor => a !== null);
  const posts = sortPosts(
    (raw.posts || [])
      .filter((p) => !p.status || p.status === 'published')
      .map((p) => normalizePost(p, categories, authors))
      .filter((p) => p.id && p.slug && p.title)
  );
  return { generatedAt: raw.generatedAt || null, posts, categories, authors };
}

const SNAPSHOT: BlogSnapshot = buildSnapshot(rawSnapshot as unknown as RawSnapshot);

/** The full build-time snapshot (posts newest first). */
export function getBlogSnapshot(): BlogSnapshot {
  return SNAPSHOT;
}

/** Published posts from the build-time snapshot, newest first. For prerendering. */
export function getSnapshotPosts(): BlogPost[] {
  return SNAPSHOT.posts;
}

/** Blog categories from the build-time snapshot, in display order. */
export function getSnapshotCategories(): BlogCategory[] {
  return SNAPSHOT.categories;
}

/** One post from the build-time snapshot, or undefined. */
export function getSnapshotPost(slug: string): BlogPost | undefined {
  return SNAPSHOT.posts.find((p) => p.slug === slug);
}
