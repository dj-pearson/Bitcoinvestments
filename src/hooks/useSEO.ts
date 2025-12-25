/**
 * useSEO Hook
 *
 * A reusable hook for managing SEO metadata across pages.
 * Provides easy access to page metadata and schema generators.
 */

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  PAGE_METADATA,
  SEO_CONFIG,
  generateBreadcrumbSchema,
  generateWebPageSchema,
  generateToolSchema,
  generateProductSchema,
  getCanonicalUrl,
  type PageMeta,
} from '../lib/seo';

interface UseSEOOptions {
  /** Override the page key lookup */
  pageKey?: string;
  /** Custom title (overrides default) */
  title?: string;
  /** Custom description (overrides default) */
  description?: string;
  /** Additional keywords to merge */
  additionalKeywords?: string[];
  /** Custom schema */
  schema?: Record<string, unknown> | Record<string, unknown>[];
  /** Breadcrumb items */
  breadcrumbs?: Array<{ name: string; url: string }>;
  /** Whether to include tool schema */
  isTool?: boolean;
  /** Tool name for schema */
  toolName?: string;
}

interface UseSEOReturn extends PageMeta {
  fullTitle: string;
  canonicalUrl: string;
  siteName: string;
  defaultImage: string;
  schemas: Record<string, unknown>[];
}

/**
 * Convert pathname to page key
 */
function pathToPageKey(pathname: string): string {
  const path = pathname.replace(/^\//, '').replace(/\/$/, '');

  // Handle specific path mappings
  const pathMappings: Record<string, string> = {
    '': 'home',
    'scam-database': 'scamDatabase',
    'staking-calculator': 'stakingCalculator',
    'retirement-calculator': 'retirementCalculator',
    'whale-tracking': 'whaleTracking',
    'trading-indicators': 'tradingIndicators',
    'onchain-analytics': 'onChainAnalytics',
    'defi-yield': 'defiYield',
    'gas-optimizer': 'gasOptimizer',
    'hardware-wallet': 'hardwareWallet',
    'multi-exchange': 'multiExchange',
    'dca-automation': 'dcaAutomation',
    'rebalancing-alerts': 'rebalancingAlerts',
    'alert-bundles': 'alertBundles',
    'social-trading': 'socialTrading',
    'influencer-verification': 'influencerVerification',
    'forgot-password': 'forgotPassword',
  };

  return pathMappings[path] || path;
}

/**
 * useSEO Hook
 *
 * Usage:
 * ```tsx
 * const seo = useSEO({ pageKey: 'dashboard' });
 * // or
 * const seo = useSEO(); // auto-detect from path
 *
 * <SEO
 *   title={seo.title}
 *   description={seo.description}
 *   keywords={seo.keywords}
 *   schema={seo.schemas}
 * />
 * ```
 */
export function useSEO(options: UseSEOOptions = {}): UseSEOReturn {
  const location = useLocation();

  return useMemo(() => {
    const {
      pageKey: customPageKey,
      title: customTitle,
      description: customDescription,
      additionalKeywords = [],
      schema: customSchema,
      breadcrumbs,
      isTool = false,
      toolName,
    } = options;

    // Determine page key
    const pageKey = customPageKey || pathToPageKey(location.pathname);

    // Get base metadata
    const baseMeta = PAGE_METADATA[pageKey] || {
      title: 'Cryptocurrency Tools & Education',
      description: SEO_CONFIG.defaultDescription,
      keywords: ['cryptocurrency', 'Bitcoin', 'crypto'],
    };

    // Merge custom values
    const title = customTitle || baseMeta.title;
    const description = customDescription || baseMeta.description;
    const keywords = [...baseMeta.keywords, ...additionalKeywords];

    // Build schemas array
    const schemas: Record<string, unknown>[] = [];

    // Add webpage schema
    schemas.push(
      generateWebPageSchema({
        title,
        description,
        url: location.pathname,
      })
    );

    // Add breadcrumb schema if provided
    if (breadcrumbs && breadcrumbs.length > 0) {
      schemas.push(generateBreadcrumbSchema(breadcrumbs));
    }

    // Add tool schema if applicable
    if (isTool && toolName) {
      schemas.push(
        generateToolSchema({
          name: toolName,
          description,
          url: location.pathname,
        })
      );
    }

    // Add custom schema
    if (customSchema) {
      if (Array.isArray(customSchema)) {
        schemas.push(...customSchema);
      } else {
        schemas.push(customSchema);
      }
    }

    return {
      title,
      description,
      keywords,
      fullTitle: `${title} | ${SEO_CONFIG.siteName}`,
      canonicalUrl: getCanonicalUrl(location.pathname),
      siteName: SEO_CONFIG.siteName,
      defaultImage: SEO_CONFIG.defaultImage,
      schemas,
    };
  }, [location.pathname, options]);
}

/**
 * Generate exchange SEO metadata
 */
export function useExchangeSEO(exchange: {
  name: string;
  description: string;
  user_rating?: number;
  review_count?: number;
  fees?: { maker_fee: number; taker_fee: number };
}) {
  const location = useLocation();

  return useMemo(() => {
    const title = `${exchange.name} Review - Fees, Features & Safety`;
    const description = `${exchange.name} review: ${exchange.description.slice(0, 120)}... Compare fees, security, and features.`;
    const keywords = [
      exchange.name,
      `${exchange.name} review`,
      `${exchange.name} fees`,
      `${exchange.name} vs`,
      'crypto exchange',
      'exchange review',
    ];

    const schema = generateProductSchema({
      name: exchange.name,
      description: exchange.description,
      rating: exchange.user_rating,
      reviewCount: exchange.review_count,
      url: location.pathname,
      brand: exchange.name,
    });

    return {
      title,
      description,
      keywords,
      schema,
    };
  }, [exchange, location.pathname]);
}

/**
 * Generate wallet SEO metadata
 */
export function useWalletSEO(wallet: {
  name: string;
  description: string;
  type: string;
  user_rating?: number;
  review_count?: number;
  price?: number;
}) {
  const location = useLocation();

  return useMemo(() => {
    const walletType = wallet.type === 'hardware' ? 'Hardware' : 'Software';
    const title = `${wallet.name} Review - ${walletType} Wallet Guide`;
    const description = `${wallet.name} ${walletType.toLowerCase()} wallet review: ${wallet.description.slice(0, 100)}... Features, security, and pricing.`;
    const keywords = [
      wallet.name,
      `${wallet.name} review`,
      `${wallet.name} wallet`,
      `${walletType.toLowerCase()} wallet`,
      'crypto wallet',
      'Bitcoin wallet',
    ];

    const schema = generateProductSchema({
      name: wallet.name,
      description: wallet.description,
      rating: wallet.user_rating,
      reviewCount: wallet.review_count,
      url: location.pathname,
      brand: wallet.name,
    });

    return {
      title,
      description,
      keywords,
      schema,
    };
  }, [wallet, location.pathname]);
}

export default useSEO;
