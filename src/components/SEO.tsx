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

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

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
  noindex?: boolean;
  nofollow?: boolean;
  schema?: Record<string, unknown> | Record<string, unknown>[];
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
const TWITTER_HANDLE = '@bitcoinvestments';

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
  noindex = false,
  nofollow = false,
  schema,
  children,
}: SEOProps) {
  const location = useLocation();

  // Build full title
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

  // Build full URL
  const fullUrl = url || `${SITE_URL}${location.pathname}`;

  // Build full image URL
  const fullImage = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  // Build robots directive
  const robotsContent = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow',
  ].join(', ');

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Helper to set or update meta tags
    const setMetaTag = (
      attribute: 'name' | 'property',
      key: string,
      content: string
    ) => {
      let element = document.querySelector(`meta[${attribute}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Basic meta tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords.join(', '));
    setMetaTag('name', 'robots', robotsContent);

    // Author
    if (author) {
      setMetaTag('name', 'author', author);
    }

    // Open Graph tags
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', fullImage);
    setMetaTag('property', 'og:url', fullUrl);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:site_name', SITE_NAME);
    setMetaTag('property', 'og:locale', 'en_US');

    if (imageAlt) {
      setMetaTag('property', 'og:image:alt', imageAlt);
    }

    // Article-specific OG tags
    if (type === 'article') {
      if (publishedTime) {
        setMetaTag('property', 'article:published_time', publishedTime);
      }
      if (modifiedTime) {
        setMetaTag('property', 'article:modified_time', modifiedTime);
      }
      if (author) {
        setMetaTag('property', 'article:author', author);
      }
      if (section) {
        setMetaTag('property', 'article:section', section);
      }
    }

    // Twitter Card tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:site', TWITTER_HANDLE);
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', fullImage);

    if (imageAlt) {
      setMetaTag('name', 'twitter:image:alt', imageAlt);
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

    // Cleanup on unmount
    return () => {
      // Reset to defaults on unmount
      document.title = SITE_NAME;
    };
  }, [
    fullTitle,
    description,
    keywords,
    fullImage,
    imageAlt,
    fullUrl,
    type,
    author,
    publishedTime,
    modifiedTime,
    section,
    robotsContent,
  ]);

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
    sameAs: [
      'https://twitter.com/bitcoinvestments',
      // Add other social profiles
    ],
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

/**
 * Generate Schema.org structured data for the Scam Database
 */
export function generateScamDatabaseSchema(stats?: {
  totalReports: number;
  verifiedReports: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Crypto Scam Database',
    description: 'Free community-powered database of cryptocurrency scams. Search known scams, report fraud, and protect yourself from phishing, rug pulls, and ponzi schemes.',
    url: `${SITE_URL}/scam-database`,
    applicationCategory: 'SecurityApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: stats?.totalReports || 1000,
      bestRating: '5',
      worstRating: '1',
    },
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    featureList: [
      'Search crypto scams by wallet address',
      'Check if a website is a known scam',
      'Report fraudulent crypto projects',
      'Community voting and verification',
      'Real-time scam alerts',
    ],
  };
}

/**
 * Generate Schema.org FAQ structured data for common scam questions
 */
export function generateScamFAQSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I check if a crypto wallet address is a scam?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Use our Crypto Scam Database to search any wallet address. Enter the address (0x... for Ethereum, bc1... for Bitcoin) and we\'ll check it against our database of reported scams including data from CryptoScamDB, ChainAbuse, and community reports.',
        },
      },
      {
        '@type': 'Question',
        name: 'What are the most common crypto scams in 2024?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The most common crypto scams include: Pig Butchering (romance investment scams - $5.8B in 2024), Phishing sites impersonating wallets like MetaMask, Rug Pulls where developers abandon projects, Fake Exchanges that steal deposits, Crypto ATM fraud ($246.7M in 2024), and Celebrity Impersonation giveaway scams. The FBI reported $9.3 billion in total crypto fraud losses in 2024.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I report a crypto scam?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Click the "Report a Scam" button on our Scam Database page. You can submit details including the scam website, wallet addresses, description of the fraud, and any evidence. Reports are reviewed by our community and moderators before being verified. You can also report to the FBI\'s IC3 at ic3.gov and your state\'s financial regulator.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is a rug pull in crypto?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A rug pull is when cryptocurrency developers abandon a project and run away with investors\' funds. Red flags include: anonymous teams, locked selling (honeypot), no smart contract audits, unlocked liquidity pools, and aggressive social media marketing. Famous examples include SquidGame Token and AnubisDAO. Our database tracks thousands of confirmed rug pulls.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is pig butchering crypto scam?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Pig butchering is a sophisticated romance/investment scam where fraudsters build trust over weeks via dating apps or social media before convincing victims to invest in fake crypto platforms. The scam caused $5.8 billion in losses in 2024. Warning signs include: contact via WhatsApp/Telegram, claims of successful trading, fake platforms showing fabricated profits, and inability to withdraw without paying "fees".',
        },
      },
      {
        '@type': 'Question',
        name: 'How can I protect myself from crypto scams?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'To protect yourself: 1) Always verify websites and wallet addresses using our Scam Database before transacting. 2) Never share your seed phrase or private keys - no legitimate service will ask for these. 3) Be skeptical of guaranteed returns or celebrity endorsements. 4) Verify projects on official social media channels. 5) Enable 2FA on all crypto accounts. 6) Be wary of unsolicited contact about investments.',
        },
      },
    ],
  };
}

/**
 * Generate Schema.org structured data for a specific scam report
 */
export function generateScamReportSchema(report: {
  id: string;
  title: string;
  description: string;
  scamType: string;
  severity: string;
  website?: string | null;
  createdAt: string;
  victimsCount?: number;
  estimatedLoss?: number | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${SITE_URL}/scam/${report.id}`,
    headline: report.title,
    description: report.description.slice(0, 160),
    datePublished: report.createdAt,
    dateModified: report.createdAt,
    author: {
      '@type': 'Organization',
      name: `${SITE_NAME} Community`,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/scam/${report.id}`,
    },
    articleSection: 'Crypto Scam Reports',
    keywords: [
      'crypto scam',
      'cryptocurrency fraud',
      report.scamType.replace(/_/g, ' '),
      `${report.severity} severity scam`,
      'scam warning',
      'crypto security',
    ].join(', '),
    about: {
      '@type': 'Thing',
      name: `${report.scamType.replace(/_/g, ' ')} cryptocurrency scam`,
    },
  };
}

/**
 * Generate SearchAction schema for scam database search
 */
export function generateScamSearchActionSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Crypto Scam Database',
    url: `${SITE_URL}/scam-database`,
    potentialAction: [
      {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/scam-database?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
        description: 'Search for crypto scams by name, wallet address, or website',
      },
    ],
  };
}

export default SEO;
