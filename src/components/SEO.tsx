/**
 * SEO Component
 *
 * Provides comprehensive SEO support including:
 * - Meta tags (title, description, keywords)
 * - Open Graph tags for social sharing
 * - Twitter Card tags
 * - JSON-LD structured data
 * - Canonical URLs
 */

import { useContext, useEffect } from 'react';
import { HeadContext, type MetaTag } from '../lib/head';
import { useLocation } from 'react-router-dom';
import { shouldNoindex } from '../lib/index-pruning';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  imageAlt?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  noindex?: boolean;
  nofollow?: boolean;
  schema?: Record<string, unknown> | Record<string, unknown>[];
  /** GEO: Short BLUF summary for AI engines (1-2 sentences, Bottom Line Up Front) */
  blufSummary?: string;
  /** GEO: Content category for AI classification */
  contentCategory?: string;
  children?: React.ReactNode;
}

// Site defaults
const SITE_NAME = 'Bitcoinvestments';
const SITE_URL = 'https://bitcoinvestments.net';
const DEFAULT_DESCRIPTION =
  'Learn how to invest in Bitcoin and cryptocurrency safely. Compare exchanges, wallets, and get educational guides for beginners.';
const DEFAULT_IMAGE = '/og-image.png';
const DEFAULT_KEYWORDS = [
  'Bitcoin',
  'cryptocurrency',
  'crypto investment',
  'DCA',
  'dollar cost averaging',
  'crypto education',
  'exchange comparison',
  'wallet comparison',
  'Bitcoin guide',
  'cryptocurrency for beginners',
];

/**
 * Content each managed meta tag had before <SEO> first modified it.
 *
 * `null` means the tag did not exist in the document and was created by <SEO>,
 * so it can be removed outright. A string means the tag came from index.html and
 * must be restored to that value rather than deleted.
 *
 * Keyed by `"${attribute}|${key}"`.
 */
const originalMetaContent = new Map<string, string | null>();

/** Meta tag keys written by the most recent <SEO> render. */
let previouslyAppliedKeys = new Set<string>();

/**
 * SEO Component
 *
 * Use this component on any page to set SEO meta tags.
 *
 * @example
 * ```tsx
 * <SEO
 *   title="Bitcoin DCA Calculator"
 *   description="Calculate your potential returns with dollar cost averaging"
 *   keywords={['DCA', 'calculator', 'Bitcoin investment']}
 * />
 * ```
 */
export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  image = DEFAULT_IMAGE,
  imageAlt,
  url,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  section,
  tags,
  noindex = false,
  nofollow = false,
  schema,
  blufSummary,
  contentCategory,
  children,
}: SEOProps) {
  const location = useLocation();

  // Build full title
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

  // Build full URL
  const fullUrl = url || `${SITE_URL}${location.pathname}`;

  // Build full image URL
  const fullImage = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  // Build robots directive with automatic index pruning
  const autoNoindex = shouldNoindex(location.pathname);
  // Serialise the array props so the effect below depends on their contents
  // rather than on array identity. Callers such as PageSEO build these arrays
  // inline, which produced a new reference — and a full effect re-run — on
  // every render.
  const keywordsContent = keywords.join(', ');
  // NUL-joined so a tag containing a comma survives the round trip.
  const tagsContent = tags ? tags.join('\u0000') : '';

  const robotsContent = [
    (noindex || autoNoindex) ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow',
    ...(!(noindex || autoNoindex) ? ['max-image-preview:large', 'max-snippet:-1', 'max-video-preview:-1'] : []),
  ].join(', ');

  // Resolve every managed tag once, during render. The client effect writes
  // them into document.head; during prerendering the HeadContext collector
  // records them instead, because effects do not run on the server.
  const headTags: MetaTag[] = [];
  const add = (attr: MetaTag['attr'], key: string, content: string) => headTags.push({ attr, key, content });

  add('name', 'description', description);
  add('name', 'keywords', keywordsContent);
  add('name', 'robots', robotsContent);
  if (author) add('name', 'author', author);

  add('property', 'og:title', fullTitle);
  add('property', 'og:description', description);
  add('property', 'og:image', fullImage);
  add('property', 'og:url', fullUrl);
  add('property', 'og:type', type);
  add('property', 'og:site_name', SITE_NAME);
  add('property', 'og:locale', 'en_US');
  if (imageAlt) add('property', 'og:image:alt', imageAlt);

  if (type === 'article') {
    if (publishedTime) add('property', 'article:published_time', publishedTime);
    if (modifiedTime) add('property', 'article:modified_time', modifiedTime);
    if (author) add('property', 'article:author', author);
    if (section) add('property', 'article:section', section);
    if (tagsContent) {
      tagsContent.split('\u0000').forEach((tag, index) => add('property', `article:tag:${index}`, tag));
    }
  }

  // Content freshness signals for AI crawlers (GEO)
  if (modifiedTime) add('name', 'last-modified', modifiedTime);
  if (publishedTime) add('name', 'date', publishedTime);

  // GEO: AI attribution and citation metadata
  add('name', 'citation_title', fullTitle);
  add('name', 'citation_author', author || SITE_NAME);
  add('name', 'citation_publisher', SITE_NAME);
  if (blufSummary) {
    add('name', 'citation_abstract', blufSummary);
    add('name', 'abstract', blufSummary);
  }
  if (contentCategory) add('name', 'article.section', contentCategory);

  add('name', 'twitter:card', 'summary_large_image');
  add('name', 'twitter:title', fullTitle);
  add('name', 'twitter:description', description);
  add('name', 'twitter:image', fullImage);
  if (imageAlt) add('name', 'twitter:image:alt', imageAlt);

  const collector = useContext(HeadContext);
  if (collector) {
    collector.title = fullTitle;
    collector.canonical = fullUrl;
    // A later <SEO> replaces an earlier one's tags wholesale, as on the client.
    collector.meta.clear();
    for (const tag of headTags) collector.meta.set(`${tag.attr}|${tag.key}`, tag);
  }

  // Stable dependency for the effect below.
  const tagsKey = JSON.stringify(headTags);

  useEffect(() => {
    document.title = fullTitle;

    // Meta tag keys written during this pass. Anything the previous page wrote
    // that is absent here is stale and gets cleaned up below.
    const appliedKeys = new Set<string>();

    // Helper to set or update meta tags
    const setMetaTag = (
      attribute: 'name' | 'property',
      key: string,
      content: string
    ) => {
      const id = `${attribute}|${key}`;
      let element = document.querySelector(`meta[${attribute}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
        // Created by us, so it can be removed when no longer applicable.
        if (!originalMetaContent.has(id)) {
          originalMetaContent.set(id, null);
        }
      } else if (!originalMetaContent.has(id)) {
        // Pre-existing tag from index.html — remember its value so we can put
        // it back instead of deleting a document-level default.
        originalMetaContent.set(id, element.getAttribute('content'));
      }
      element.setAttribute('content', content);
      appliedKeys.add(id);
    };

    for (const tag of JSON.parse(tagsKey) as MetaTag[]) {
      setMetaTag(tag.attr, tag.key, tag.content);
    }

    // Canonical URL
    let canonicalLink = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', fullUrl);

    // Clear metadata the previous page set that this page does not.
    //
    // Many tags here are conditional: article:published_time, article:author,
    // article:section and article:tag:N are only written for type="article";
    // abstract/citation_abstract only when blufSummary is given; author,
    // date, last-modified and *:image:alt only when their prop is present.
    // Because setMetaTag only ever creates or updates, those tags used to
    // survive client-side navigation and go on describing the page the user
    // just left — a blog post's publish date and tag list would still be in
    // the head on the calculators page. article:tag:N was worse than stale:
    // moving from an eight-tag post to a two-tag post left tags 2-7 behind,
    // silently merging two posts' tag sets.
    previouslyAppliedKeys.forEach((id) => {
      if (appliedKeys.has(id)) return;

      const separator = id.indexOf('|');
      const attribute = id.slice(0, separator);
      const key = id.slice(separator + 1);
      const element = document.querySelector(`meta[${attribute}="${key}"]`);
      if (!element) return;

      const original = originalMetaContent.get(id);
      if (original == null) {
        element.remove();
      } else {
        element.setAttribute('content', original);
      }
    });
    previouslyAppliedKeys = appliedKeys;

    // Cleanup on unmount
    return () => {
      // Reset to defaults on unmount
      document.title = SITE_NAME;
    };
  }, [fullTitle, fullUrl, tagsKey]);

  // Render JSON-LD schema (supports single schema or array of schemas)
  const renderSchema = () => {
    if (!schema) return null;

    // If it's an array, render each schema as a separate script tag
    if (Array.isArray(schema)) {
      return (
        <>
          {schema.map((s, index) => (
            <script
              key={index}
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(s),
              }}
            />
          ))}
        </>
      );
    }

    // Single schema object
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />
    );
  };

  return (
    <>
      {renderSchema()}
      {children}
    </>
  );
}

// ============================================
// Pre-built Schema.org Generators
// ============================================

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    // `sameAs` intentionally omitted: it asserts to search engines that these
    // profiles are ours, so add entries only for accounts that actually exist.
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@bitcoinvestments.net',
      contactType: 'customer support',
    },
  };
}

/**
 * Generate WebSite schema with search action
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate Article schema for guides/blog posts
 */
export function generateArticleSchema({
  title,
  description,
  image,
  author,
  publishedDate,
  modifiedDate,
  url,
}: {
  title: string;
  description: string;
  image?: string;
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    image: image || DEFAULT_IMAGE,
    author: {
      '@type': 'Organization',
      name: author || SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    datePublished: publishedDate,
    dateModified: modifiedDate || publishedDate,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}

/**
 * Generate Course schema for educational content
 */
export function generateCourseSchema({
  name,
  description,
  provider,
  url,
}: {
  name: string;
  description: string;
  provider?: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: name,
    description: description,
    provider: {
      '@type': 'Organization',
      name: provider || SITE_NAME,
      sameAs: SITE_URL,
    },
    url: url,
  };
}

/**
 * Generate HowTo schema for guides
 */
export function generateHowToSchema({
  name,
  description,
  steps,
  totalTime,
  image,
}: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string }>;
  totalTime?: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: name,
    description: description,
    image: image,
    totalTime: totalTime,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

/**
 * Generate FAQ schema
 */
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * Generate Product schema (for exchanges/wallets)
 */
export function generateProductSchema({
  name,
  description,
  image,
  rating,
  reviewCount,
  url,
}: {
  name: string;
  description: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  url: string;
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: name,
    description: description,
    image: image,
    url: url,
  };

  if (rating && reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating,
      bestRating: 5,
      worstRating: 1,
      ratingCount: reviewCount,
    };
  }

  return schema;
}

/**
 * Generate SoftwareApplication schema (for wallets)
 */
export function generateSoftwareSchema({
  name,
  description,
  operatingSystem,
  applicationCategory,
  rating,
  reviewCount,
  price,
  url,
}: {
  name: string;
  description: string;
  operatingSystem?: string;
  applicationCategory?: string;
  rating?: number;
  reviewCount?: number;
  price?: string;
  url: string;
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: name,
    description: description,
    operatingSystem: operatingSystem || 'Windows, macOS, Linux, iOS, Android',
    applicationCategory: applicationCategory || 'FinanceApplication',
    url: url,
    offers: {
      '@type': 'Offer',
      price: price || '0',
      priceCurrency: 'USD',
    },
  };

  if (rating && reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating,
      bestRating: 5,
      worstRating: 1,
      ratingCount: reviewCount,
    };
  }

  return schema;
}

// ============================================
// Scam Database Schema Generators
// ============================================





export default SEO;
