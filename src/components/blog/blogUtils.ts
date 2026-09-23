/**
 * Pure helpers for the public blog pages: date formatting, heading anchors
 * and structured data. No browser APIs, so they are safe during prerender.
 */

import { FALLBACK_AUTHOR_NAME, slugify } from '../../content/blog';
import type { BlogPost } from '../../types/blog';

export const SITE_URL = 'https://bitcoinvestments.net';
const SITE_NAME = 'Bitcoinvestments';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

/**
 * Format an ISO date in UTC so the server render and the browser agree
 * (a local-timezone format can differ by a day and break hydration).
 */
export function formatDate(iso: string | null | undefined, month: 'long' | 'short' = 'long'): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month, day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/** True when the post was meaningfully updated after publication (> 1 day). */
export function wasUpdated(post: Pick<BlogPost, 'published_at' | 'updated_at'>): boolean {
  if (!post.published_at || !post.updated_at) return false;
  const diff = Date.parse(post.updated_at) - Date.parse(post.published_at);
  return Number.isFinite(diff) && diff > 24 * 60 * 60 * 1000;
}

export interface TocEntry {
  id: string;
  text: string;
}

const decodeEntities = (s: string): string =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'");

/**
 * Give every `<h2>` in (already sanitised) HTML a stable, unique id derived
 * from its text, and return the matching table of contents. Built from the
 * same string that is rendered, so every TOC link has a target.
 */
export function addHeadingIds(html: string): { html: string; toc: TocEntry[] } {
  const toc: TocEntry[] = [];
  const used = new Map<string, number>();
  let n = 0;
  const out = html.replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/gi, (_m, attrs: string | undefined, inner: string) => {
    n += 1;
    const text = decodeEntities(inner.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();
    const base = slugify(text) || `section-${n}`;
    const count = used.get(base) || 0;
    used.set(base, count + 1);
    const id = count === 0 ? base : `${base}-${count + 1}`;
    toc.push({ id, text: text || `Section ${n}` });
    // Drop any stored id so the element never carries two.
    const cleanAttrs = (attrs || '').replace(/\s+id\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    return `<h2${cleanAttrs} id="${id}">${inner}</h2>`;
  });
  return { html: out, toc };
}

/** Absolute URL for an image path. */
export function absoluteUrl(path: string | null | undefined): string {
  if (!path) return DEFAULT_IMAGE;
  return path.startsWith('http') ? path : `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** schema.org BlogPosting for a post, with a Person author when one is set. */
export function buildBlogPostingSchema(post: BlogPost, categoryName: string): Record<string, unknown> {
  const url = `${SITE_URL}/blog/${post.slug}`;
  const author = post.author
    ? {
        '@type': 'Person',
        name: post.author.display_name,
        ...(post.author.credentials ? { jobTitle: post.author.credentials } : {}),
        ...(post.author.profile_links?.length ? { sameAs: post.author.profile_links } : {}),
      }
    : { '@type': 'Organization', name: FALLBACK_AUTHOR_NAME, url: SITE_URL };

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: (post.seo_title || post.title).slice(0, 110),
    description: post.seo_description || post.excerpt,
    image: absoluteUrl(post.og_image || post.featured_image),
    author,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    inLanguage: 'en-US',
    ...(categoryName ? { articleSection: categoryName } : {}),
    ...(post.tags.length ? { keywords: post.tags.join(', ') } : {}),
    ...(post.word_count ? { wordCount: post.word_count } : {}),
    isPartOf: { '@type': 'Blog', name: `${SITE_NAME} Blog`, url: `${SITE_URL}/blog` },
  };
}

/** CollectionPage + ItemList for a listing of posts. */
export function buildCollectionSchema(opts: {
  name: string;
  description: string;
  path: string;
  posts: BlogPost[];
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: opts.name,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: opts.posts.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}/blog/${p.slug}`,
        name: p.title,
      })),
    },
  };
}
