/**
 * Server-side head collection for prerendering.
 *
 * In the browser <SEO> writes tags into document.head from an effect. Effects
 * never run during react-dom/server rendering, so the prerender step provides a
 * collector through HeadContext and <SEO> records its resolved tags into it
 * during render instead (last writer wins, matching the client, where the
 * page's <SEO> runs after RouteHead's defaults).
 */

import { createContext } from 'react';

export interface MetaTag {
  attr: 'name' | 'property';
  key: string;
  content: string;
}

export interface HeadCollector {
  title?: string;
  canonical?: string;
  meta: Map<string, MetaTag>;
}

export const HeadContext = createContext<HeadCollector | null>(null);

export function createHeadCollector(): HeadCollector {
  return { meta: new Map() };
}

const escapeAttr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Serialise collected tags as HTML for the document head. */
export function renderHeadTags(head: HeadCollector): string {
  const parts: string[] = [];
  if (head.title) parts.push(`<title>${escapeAttr(head.title)}</title>`);
  for (const tag of head.meta.values()) {
    parts.push(`<meta ${tag.attr}="${escapeAttr(tag.key)}" content="${escapeAttr(tag.content)}" />`);
  }
  if (head.canonical) parts.push(`<link rel="canonical" href="${escapeAttr(head.canonical)}" />`);
  return parts.join('\n    ');
}
