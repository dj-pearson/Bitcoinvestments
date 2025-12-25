/**
 * PageSEO Component
 *
 * A simplified wrapper around SEO that uses centralized page metadata.
 * Use this for quick SEO implementation on standard pages.
 */

import { SEO } from './SEO';
import {
  PAGE_METADATA,
  generateWebPageSchema,
  generateToolSchema,
  generateFAQSchema,
} from '../lib/seo';

type PageKey = keyof typeof PAGE_METADATA;

interface PageSEOProps {
  /** Key to look up in PAGE_METADATA */
  pageKey: PageKey;
  /** Override the default title */
  title?: string;
  /** Override the default description */
  description?: string;
  /** Additional keywords to merge */
  additionalKeywords?: string[];
  /** Is this a tool/calculator page? */
  isTool?: boolean;
  /** Tool name for schema (if isTool is true) */
  toolName?: string;
  /** FAQ items to include in schema */
  faqs?: Array<{ question: string; answer: string }>;
  /** Custom schema to add */
  customSchema?: Record<string, unknown> | Record<string, unknown>[];
  /** URL path for schema */
  urlPath?: string;
}

/**
 * PageSEO Component
 *
 * Usage:
 * ```tsx
 * <PageSEO pageKey="dashboard" />
 *
 * // With overrides
 * <PageSEO
 *   pageKey="calculators"
 *   isTool
 *   toolName="DCA Calculator"
 *   faqs={[{ question: 'What is DCA?', answer: '...' }]}
 * />
 * ```
 */
export function PageSEO({
  pageKey,
  title: customTitle,
  description: customDescription,
  additionalKeywords = [],
  isTool = false,
  toolName,
  faqs,
  customSchema,
  urlPath,
}: PageSEOProps) {
  const meta = PAGE_METADATA[pageKey] || {
    title: 'Cryptocurrency Tools & Education',
    description: 'Learn how to invest in Bitcoin and cryptocurrency safely.',
    keywords: ['cryptocurrency', 'Bitcoin'],
  };

  const title = customTitle || meta.title;
  const description = customDescription || meta.description;
  const keywords = [...meta.keywords, ...additionalKeywords];

  // Build schemas
  const schemas: Record<string, unknown>[] = [];

  // Add webpage schema
  schemas.push(
    generateWebPageSchema({
      title,
      description,
      url: urlPath || `/${pageKey.replace(/([A-Z])/g, '-$1').toLowerCase()}`,
    })
  );

  // Add tool schema if applicable
  if (isTool && toolName) {
    schemas.push(
      generateToolSchema({
        name: toolName,
        description,
        url: urlPath || `/${pageKey.replace(/([A-Z])/g, '-$1').toLowerCase()}`,
      })
    );
  }

  // Add FAQ schema if provided
  if (faqs && faqs.length > 0) {
    schemas.push(generateFAQSchema(faqs));
  }

  // Add custom schema
  if (customSchema) {
    if (Array.isArray(customSchema)) {
      schemas.push(...customSchema);
    } else {
      schemas.push(customSchema);
    }
  }

  return (
    <SEO
      title={title}
      description={description}
      keywords={keywords}
      schema={schemas}
    />
  );
}

export default PageSEO;
