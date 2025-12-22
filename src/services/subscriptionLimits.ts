/**
 * Subscription Limits Service
 *
 * Centralized configuration and validation for freemium feature limits.
 * Supports Free, Premium, Advisor, and Enterprise tiers.
 */

import { hasPremiumAccess } from './stripe';
import type { SubscriptionStatus } from '../types';

/**
 * Feature limits configuration for each tier
 */
export const TIER_LIMITS = {
  free: {
    // Portfolio limits
    maxAssets: 10,
    maxClientPortfolios: 0,

    // Watchlist limits
    maxWatchlistItems: 5,

    // Price alert limits
    maxActiveAlerts: 3,

    // Data freshness (in milliseconds)
    // Free tier gets 15-minute delayed data
    priceDataDelay: 15 * 60 * 1000, // 15 minutes

    // Tax reports - free users can preview but not export
    canExportTaxReports: false,

    // Export formats
    exportFormats: {
      csv: true,
      pdf: false,
      excel: false,
      taxSoftware: false,
    },

    // Monthly performance reports
    monthlyPerformanceReport: false,

    // Research reports
    premiumResearchReports: false,

    // Calculator features
    calculatorFeatures: {
      basic: true,
      advanced: false,
      projections: false,
      comparisons: false,
      taxOptimization: false,
    },

    // Other features
    cloudSync: false,
    emailAlerts: false,
    smsAlerts: false,
    advancedAnalytics: false,
    adFree: false,
    aiPortfolioAnalysis: false,
    backtestingAdvanced: false,

    // Advisor features
    whiteLabelReports: false,
    clientDashboard: false,
    complianceExports: false,
    customBranding: false,
    apiAccess: false,
    teamAccess: false,
  },
  premium: {
    // Portfolio limits - unlimited for self
    maxAssets: Infinity,
    maxClientPortfolios: 0,

    // Watchlist limits - unlimited
    maxWatchlistItems: Infinity,

    // Price alert limits - unlimited
    maxActiveAlerts: Infinity,

    // Data freshness - real-time (5 min cache for API efficiency)
    priceDataDelay: 0, // Real-time

    // Tax reports - full access
    canExportTaxReports: true,

    // Export formats - all formats available
    exportFormats: {
      csv: true,
      pdf: true,
      excel: true,
      taxSoftware: true,
    },

    // Monthly performance reports
    monthlyPerformanceReport: true,

    // Research reports
    premiumResearchReports: true,

    // Calculator features - all features
    calculatorFeatures: {
      basic: true,
      advanced: true,
      projections: true,
      comparisons: true,
      taxOptimization: true,
    },

    // Other features
    cloudSync: true,
    emailAlerts: true,
    smsAlerts: true,
    advancedAnalytics: true,
    adFree: true,
    aiPortfolioAnalysis: true,
    backtestingAdvanced: true,

    // Advisor features
    whiteLabelReports: false,
    clientDashboard: false,
    complianceExports: false,
    customBranding: false,
    apiAccess: false,
    teamAccess: false,
  },
  advisor: {
    // Portfolio limits
    maxAssets: Infinity,
    maxClientPortfolios: 10, // Up to 10 client portfolios

    // Watchlist limits - unlimited
    maxWatchlistItems: Infinity,

    // Price alert limits - unlimited
    maxActiveAlerts: Infinity,

    // Data freshness - real-time
    priceDataDelay: 0,

    // Tax reports - full access
    canExportTaxReports: true,

    // Export formats - all formats available
    exportFormats: {
      csv: true,
      pdf: true,
      excel: true,
      taxSoftware: true,
    },

    // Monthly performance reports
    monthlyPerformanceReport: true,

    // Research reports
    premiumResearchReports: true,

    // Calculator features - all features
    calculatorFeatures: {
      basic: true,
      advanced: true,
      projections: true,
      comparisons: true,
      taxOptimization: true,
    },

    // Other features
    cloudSync: true,
    emailAlerts: true,
    smsAlerts: true,
    advancedAnalytics: true,
    adFree: true,
    aiPortfolioAnalysis: true,
    backtestingAdvanced: true,

    // Advisor features
    whiteLabelReports: true,
    clientDashboard: true,
    complianceExports: true,
    customBranding: 'basic' as const,
    apiAccess: false,
    teamAccess: false,
  },
  enterprise: {
    // Portfolio limits - unlimited
    maxAssets: Infinity,
    maxClientPortfolios: Infinity, // Unlimited client portfolios

    // Watchlist limits - unlimited
    maxWatchlistItems: Infinity,

    // Price alert limits - unlimited
    maxActiveAlerts: Infinity,

    // Data freshness - real-time
    priceDataDelay: 0,

    // Tax reports - full access
    canExportTaxReports: true,

    // Export formats - all formats available
    exportFormats: {
      csv: true,
      pdf: true,
      excel: true,
      taxSoftware: true,
    },

    // Monthly performance reports
    monthlyPerformanceReport: true,

    // Research reports
    premiumResearchReports: true,

    // Calculator features - all features
    calculatorFeatures: {
      basic: true,
      advanced: true,
      projections: true,
      comparisons: true,
      taxOptimization: true,
    },

    // Other features
    cloudSync: true,
    emailAlerts: true,
    smsAlerts: true,
    advancedAnalytics: true,
    adFree: true,
    aiPortfolioAnalysis: true,
    backtestingAdvanced: true,

    // Advisor/Enterprise features
    whiteLabelReports: true,
    clientDashboard: true,
    complianceExports: true,
    customBranding: 'full' as const,
    apiAccess: true,
    teamAccess: true,
  },

  // Lifetime deal - same as premium but one-time payment
  lifetime: {
    // Portfolio limits - unlimited for self
    maxAssets: Infinity,
    maxClientPortfolios: 0,

    // Watchlist limits - unlimited
    maxWatchlistItems: Infinity,

    // Price alert limits - unlimited
    maxActiveAlerts: Infinity,

    // Data freshness - real-time
    priceDataDelay: 0,

    // Tax reports - full access
    canExportTaxReports: true,

    // Export formats - all formats available
    exportFormats: {
      csv: true,
      pdf: true,
      excel: true,
      taxSoftware: true,
    },

    // Monthly performance reports
    monthlyPerformanceReport: true,

    // Research reports
    premiumResearchReports: true,

    // Calculator features - all features
    calculatorFeatures: {
      basic: true,
      advanced: true,
      projections: true,
      comparisons: true,
      taxOptimization: true,
    },

    // Other features
    cloudSync: true,
    emailAlerts: true,
    smsAlerts: true,
    advancedAnalytics: true,
    adFree: true,
    aiPortfolioAnalysis: true,
    backtestingAdvanced: true,

    // Advisor features
    whiteLabelReports: false,
    clientDashboard: false,
    complianceExports: false,
    customBranding: false,
    apiAccess: false,
    teamAccess: false,
  },
} as const;

export type SubscriptionTier = keyof typeof TIER_LIMITS;
export type TierLimits = typeof TIER_LIMITS[SubscriptionTier];

/**
 * Check if subscription is still valid (not expired)
 */
function isSubscriptionActive(subscriptionExpiresAt?: string | null): boolean {
  if (!subscriptionExpiresAt) return true; // No expiry = active
  const expiresAt = new Date(subscriptionExpiresAt);
  return expiresAt > new Date();
}

/**
 * Get limits for a user's subscription tier
 */
export function getTierLimits(
  subscriptionStatus?: SubscriptionStatus,
  subscriptionExpiresAt?: string | null
): TierLimits {
  // Check if subscription is still active (lifetime never expires)
  if (subscriptionStatus !== 'lifetime' && !isSubscriptionActive(subscriptionExpiresAt)) {
    return TIER_LIMITS.free;
  }

  switch (subscriptionStatus) {
    case 'enterprise':
      return TIER_LIMITS.enterprise;
    case 'advisor':
      return TIER_LIMITS.advisor;
    case 'premium':
      return TIER_LIMITS.premium;
    case 'lifetime':
      return TIER_LIMITS.lifetime;
    case 'free':
    default:
      return TIER_LIMITS.free;
  }
}

/**
 * Check if user has advisor-level access or higher
 */
export function hasAdvisorAccess(
  subscriptionStatus?: SubscriptionStatus,
  subscriptionExpiresAt?: string | null
): boolean {
  if (!isSubscriptionActive(subscriptionExpiresAt)) return false;
  return subscriptionStatus === 'advisor' || subscriptionStatus === 'enterprise';
}

/**
 * Check if user has enterprise-level access
 */
export function hasEnterpriseAccess(
  subscriptionStatus?: SubscriptionStatus,
  subscriptionExpiresAt?: string | null
): boolean {
  if (!isSubscriptionActive(subscriptionExpiresAt)) return false;
  return subscriptionStatus === 'enterprise';
}

/**
 * Check if user can add more assets to portfolio
 */
export function canAddAsset(
  currentAssetCount: number,
  subscriptionStatus?: 'free' | 'premium',
  subscriptionExpiresAt?: string | null
): { allowed: boolean; limit: number; remaining: number } {
  const limits = getTierLimits(subscriptionStatus, subscriptionExpiresAt);
  const remaining = Math.max(0, limits.maxAssets - currentAssetCount);

  return {
    allowed: currentAssetCount < limits.maxAssets,
    limit: limits.maxAssets === Infinity ? -1 : limits.maxAssets,
    remaining: limits.maxAssets === Infinity ? -1 : remaining,
  };
}

/**
 * Check if user can create more price alerts
 */
export function canCreateAlert(
  currentActiveAlertCount: number,
  subscriptionStatus?: 'free' | 'premium',
  subscriptionExpiresAt?: string | null
): { allowed: boolean; limit: number; remaining: number } {
  const limits = getTierLimits(subscriptionStatus, subscriptionExpiresAt);
  const remaining = Math.max(0, limits.maxActiveAlerts - currentActiveAlertCount);

  return {
    allowed: currentActiveAlertCount < limits.maxActiveAlerts,
    limit: limits.maxActiveAlerts === Infinity ? -1 : limits.maxActiveAlerts,
    remaining: limits.maxActiveAlerts === Infinity ? -1 : remaining,
  };
}

/**
 * Get the data delay for a user's tier
 * Returns 0 for premium (real-time) or delay in ms for free tier
 */
export function getDataDelay(
  subscriptionStatus?: 'free' | 'premium',
  subscriptionExpiresAt?: string | null
): number {
  const limits = getTierLimits(subscriptionStatus, subscriptionExpiresAt);
  return limits.priceDataDelay;
}

/**
 * Check if a timestamp should be considered "delayed" for free users
 * This helps determine if we need to fetch fresh data or can use cached
 */
export function isDataDelayed(
  dataTimestamp: number,
  subscriptionStatus?: 'free' | 'premium',
  subscriptionExpiresAt?: string | null
): boolean {
  const delay = getDataDelay(subscriptionStatus, subscriptionExpiresAt);
  if (delay === 0) return false; // Premium users always get fresh data

  const now = Date.now();
  const dataAge = now - dataTimestamp;

  // Data is considered "delayed" if it's older than the delay period
  return dataAge > delay;
}

/**
 * Check if user can export tax reports
 */
export function canExportTaxReports(
  subscriptionStatus?: 'free' | 'premium',
  subscriptionExpiresAt?: string | null,
  hasTaxPackage?: boolean // One-time tax season purchase
): boolean {
  // Tax package purchase overrides subscription requirement
  if (hasTaxPackage) return true;

  const limits = getTierLimits(subscriptionStatus, subscriptionExpiresAt);
  return limits.canExportTaxReports;
}

/**
 * Check if user has cloud sync enabled
 */
export function hasCloudSync(
  subscriptionStatus?: 'free' | 'premium',
  subscriptionExpiresAt?: string | null
): boolean {
  const limits = getTierLimits(subscriptionStatus, subscriptionExpiresAt);
  return limits.cloudSync;
}

/**
 * Check if user can receive email alerts
 */
export function hasEmailAlerts(
  subscriptionStatus?: 'free' | 'premium',
  subscriptionExpiresAt?: string | null
): boolean {
  const limits = getTierLimits(subscriptionStatus, subscriptionExpiresAt);
  return limits.emailAlerts;
}

/**
 * Check if user has ad-free experience
 */
export function hasAdFree(
  subscriptionStatus?: 'free' | 'premium',
  subscriptionExpiresAt?: string | null
): boolean {
  const limits = getTierLimits(subscriptionStatus, subscriptionExpiresAt);
  return limits.adFree;
}

/**
 * Check if user has access to AI portfolio analysis
 */
export function hasAIPortfolioAnalysis(
  subscriptionStatus?: 'free' | 'premium',
  subscriptionExpiresAt?: string | null
): boolean {
  const limits = getTierLimits(subscriptionStatus, subscriptionExpiresAt);
  return limits.aiPortfolioAnalysis;
}

/**
 * Check if user has access to advanced backtesting
 */
export function hasAdvancedBacktesting(
  subscriptionStatus?: 'free' | 'premium',
  subscriptionExpiresAt?: string | null
): boolean {
  const limits = getTierLimits(subscriptionStatus, subscriptionExpiresAt);
  return limits.backtestingAdvanced;
}

/**
 * Get a human-readable description of the limit
 */
export function getLimitDescription(
  limitType: 'assets' | 'alerts',
  subscriptionStatus?: 'free' | 'premium',
  subscriptionExpiresAt?: string | null
): string {
  const limits = getTierLimits(subscriptionStatus, subscriptionExpiresAt);
  const isPremium = hasPremiumAccess(subscriptionStatus, subscriptionExpiresAt);

  if (isPremium) {
    return 'Unlimited';
  }

  switch (limitType) {
    case 'assets':
      return `${limits.maxAssets} assets`;
    case 'alerts':
      return `${limits.maxActiveAlerts} active alerts`;
    default:
      return 'Limited';
  }
}

/**
 * Tax Season Package configuration
 * One-time purchase available January through April
 */
export const TAX_PACKAGE = {
  id: 'tax-season-2025',
  name: 'Tax Season Report Package',
  description: 'Generate comprehensive crypto tax reports for the 2024 tax year',
  price: 29.99, // Base price
  premiumPrice: 49.99, // Enhanced version with CPA review
  currency: 'USD',
  availableMonths: [1, 2, 3, 4], // January - April
  taxYear: 2024,
  features: {
    basic: [
      'Complete transaction history export',
      'Capital gains/losses summary',
      'Cost basis calculations (FIFO, LIFO, HIFO)',
      'IRS Form 8949 compatible format',
      'CSV and PDF export',
      'Support for 50+ exchanges',
    ],
    premium: [
      'Everything in Basic, plus:',
      'TurboTax/H&R Block integration',
      'Staking rewards breakdown',
      'DeFi transaction categorization',
      'NFT transaction support',
      'Audit trail documentation',
      'Email support',
    ],
  },
  stripePriceId: {
    // These should be set up in Stripe dashboard as one-time payment products
    // Basic: $29.99 one-time
    // Premium: $49.99 one-time
    basic: import.meta.env.VITE_STRIPE_TAX_PACKAGE_BASIC || 'price_tax_basic_placeholder',
    premium: import.meta.env.VITE_STRIPE_TAX_PACKAGE_PREMIUM || 'price_tax_premium_placeholder',
  },
} as const;

/**
 * Check if tax season package is currently available
 */
export function isTaxSeasonActive(): boolean {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  return (TAX_PACKAGE.availableMonths as readonly number[]).includes(currentMonth);
}

/**
 * Format limit for display (handles infinity)
 */
export function formatLimit(limit: number): string {
  return limit === Infinity || limit === -1 ? 'Unlimited' : limit.toString();
}

// ==================== Watchlist Limits ====================

/**
 * Check if user can add more items to watchlist
 */
export function canAddToWatchlist(
  currentWatchlistCount: number,
  subscriptionStatus?: SubscriptionStatus,
  subscriptionExpiresAt?: string | null
): { allowed: boolean; limit: number; remaining: number } {
  const limits = getTierLimits(subscriptionStatus, subscriptionExpiresAt);
  const remaining = Math.max(0, limits.maxWatchlistItems - currentWatchlistCount);

  return {
    allowed: currentWatchlistCount < limits.maxWatchlistItems,
    limit: limits.maxWatchlistItems === Infinity ? -1 : limits.maxWatchlistItems,
    remaining: limits.maxWatchlistItems === Infinity ? -1 : remaining,
  };
}

/**
 * Get watchlist limit for a subscription tier
 */
export function getWatchlistLimit(
  subscriptionStatus?: SubscriptionStatus,
  subscriptionExpiresAt?: string | null
): number {
  const limits = getTierLimits(subscriptionStatus, subscriptionExpiresAt);
  return limits.maxWatchlistItems;
}

// ==================== Export Format Limits ====================

export type ExportFormat = 'csv' | 'pdf' | 'excel' | 'taxSoftware';

/**
 * Check if user can use a specific export format
 */
export function canUseExportFormat(
  format: ExportFormat,
  subscriptionStatus?: SubscriptionStatus,
  subscriptionExpiresAt?: string | null
): boolean {
  const limits = getTierLimits(subscriptionStatus, subscriptionExpiresAt);
  return limits.exportFormats[format];
}

/**
 * Get all available export formats for a user
 */
export function getAvailableExportFormats(
  subscriptionStatus?: SubscriptionStatus,
  subscriptionExpiresAt?: string | null
): ExportFormat[] {
  const limits = getTierLimits(subscriptionStatus, subscriptionExpiresAt);
  const formats: ExportFormat[] = [];

  if (limits.exportFormats.csv) formats.push('csv');
  if (limits.exportFormats.pdf) formats.push('pdf');
  if (limits.exportFormats.excel) formats.push('excel');
  if (limits.exportFormats.taxSoftware) formats.push('taxSoftware');

  return formats;
}

// ==================== Premium Features ====================

/**
 * Check if user has access to monthly performance reports
 */
export function hasMonthlyPerformanceReport(
  subscriptionStatus?: SubscriptionStatus,
  subscriptionExpiresAt?: string | null
): boolean {
  const limits = getTierLimits(subscriptionStatus, subscriptionExpiresAt);
  return limits.monthlyPerformanceReport;
}

/**
 * Check if user has access to premium research reports
 */
export function hasPremiumResearchReports(
  subscriptionStatus?: SubscriptionStatus,
  subscriptionExpiresAt?: string | null
): boolean {
  const limits = getTierLimits(subscriptionStatus, subscriptionExpiresAt);
  return limits.premiumResearchReports;
}

// ==================== Calculator Features ====================

export type CalculatorFeature = 'basic' | 'advanced' | 'projections' | 'comparisons' | 'taxOptimization';

/**
 * Check if user can access a specific calculator feature
 */
export function canUseCalculatorFeature(
  feature: CalculatorFeature,
  subscriptionStatus?: SubscriptionStatus,
  subscriptionExpiresAt?: string | null
): boolean {
  const limits = getTierLimits(subscriptionStatus, subscriptionExpiresAt);
  return limits.calculatorFeatures[feature];
}

/**
 * Get all available calculator features for a user
 */
export function getAvailableCalculatorFeatures(
  subscriptionStatus?: SubscriptionStatus,
  subscriptionExpiresAt?: string | null
): CalculatorFeature[] {
  const limits = getTierLimits(subscriptionStatus, subscriptionExpiresAt);
  const features: CalculatorFeature[] = [];

  if (limits.calculatorFeatures.basic) features.push('basic');
  if (limits.calculatorFeatures.advanced) features.push('advanced');
  if (limits.calculatorFeatures.projections) features.push('projections');
  if (limits.calculatorFeatures.comparisons) features.push('comparisons');
  if (limits.calculatorFeatures.taxOptimization) features.push('taxOptimization');

  return features;
}

/**
 * Check if user has lifetime access
 */
export function hasLifetimeAccess(
  subscriptionStatus?: SubscriptionStatus
): boolean {
  return subscriptionStatus === 'lifetime';
}

// ==================== Lifetime Deal Configuration ====================

export const LIFETIME_DEAL = {
  id: 'lifetime-premium',
  name: 'Lifetime Premium Access',
  description: 'One-time payment for lifetime access to all premium features',
  price: 299,
  originalPrice: 499, // Show savings
  currency: 'USD',
  features: [
    'Lifetime access to all Premium features',
    'Never pay a subscription again',
    'Ad-free experience forever',
    'Unlimited portfolio assets',
    'Unlimited watchlist items',
    'All export formats (PDF, Excel, Tax Software)',
    'Monthly performance reports',
    'Premium research reports',
    'Advanced calculator features',
    'Cloud sync & email alerts',
    'Priority support',
    'All future premium features included',
  ],
  stripePriceId: import.meta.env.VITE_STRIPE_PRICE_LIFETIME || 'price_lifetime_placeholder',
  limitedOffer: true,
  maxPurchases: 500, // Limited quantity
} as const;

// ==================== Premium Add-On Features ====================
// These are standalone subscriptions separate from the main tier system

/**
 * Influencer Verification Program
 * - Users pay $2.99/month for transparency access
 * - Influencers pay $49/month for verified badge
 */
export const INFLUENCER_VERIFICATION_PRICING = {
  user_transparency: {
    id: 'influencer-transparency',
    name: 'Influencer Transparency Access',
    description: 'See verified performance data for crypto influencers',
    price_monthly: 2.99,
    price_yearly: 29.99,
    currency: 'USD',
    features: [
      'View verified win rates and returns',
      'Compare claimed vs actual performance',
      'Access accuracy scores and trust ratings',
      'See on-chain verified trades',
      'Monthly performance reports',
    ],
    stripePriceId: {
      monthly: import.meta.env.VITE_STRIPE_INFLUENCER_TRANSPARENCY_MONTHLY || 'price_influencer_transparency_monthly',
      yearly: import.meta.env.VITE_STRIPE_INFLUENCER_TRANSPARENCY_YEARLY || 'price_influencer_transparency_yearly',
    },
  },
  influencer_badge: {
    id: 'influencer-verified-badge',
    name: 'Verified Influencer Badge',
    description: 'Get verified status and prove your track record',
    price_monthly: 49.00,
    currency: 'USD',
    features: [
      'Verified badge on profile',
      'Increased visibility in search',
      'Trust score display',
      'Wallet verification support',
      'Performance analytics dashboard',
      'Priority review for trade claims',
    ],
    stripePriceId: import.meta.env.VITE_STRIPE_INFLUENCER_BADGE || 'price_influencer_badge_monthly',
  },
} as const;

/**
 * NFT Portfolio Premium
 * $14.99/month add-on or bundled
 */
export const NFT_PORTFOLIO_PRICING = {
  id: 'nft-portfolio-premium',
  name: 'NFT Portfolio Premium',
  description: 'Advanced NFT tracking with floor price monitoring and rarity analytics',
  price_monthly: 14.99,
  price_yearly: 149.99,
  currency: 'USD',
  features: [
    'Track unlimited NFT holdings',
    'Real-time floor price monitoring',
    'Rarity analytics and rankings',
    'Floor price alerts',
    'Collection performance tracking',
    'Multi-wallet support (up to 5)',
    'Historical price charts',
    'P&L tracking with cost basis',
  ],
  limits: {
    max_wallets: 5,
    max_collections_tracked: 50,
    max_alerts: 20,
  },
  stripePriceId: {
    monthly: import.meta.env.VITE_STRIPE_NFT_PORTFOLIO_MONTHLY || 'price_nft_portfolio_monthly',
    yearly: import.meta.env.VITE_STRIPE_NFT_PORTFOLIO_YEARLY || 'price_nft_portfolio_yearly',
  },
} as const;

/**
 * Social Trading / Copy Portfolio
 * $9.99/month default, creators earn 20%
 */
export const SOCIAL_TRADING_PRICING = {
  id: 'social-trading',
  name: 'Copy Trading Subscription',
  description: 'Copy successful trader portfolios automatically',
  default_price: 9.99,
  creator_share_percent: 20,
  platform_share_percent: 80,
  currency: 'USD',
  min_copy_amount: 100,
  features: {
    follower: [
      'Follow unlimited portfolios for free',
      'See portfolio allocations',
      'Get trade notifications',
    ],
    copier: [
      'Auto-copy portfolio allocations',
      'Proportional or fixed amount copying',
      'Real-time trade mirroring',
      'Performance tracking',
      'Customizable copy settings',
    ],
    creator: [
      'Publish your portfolio',
      'Earn 20% of subscriber fees',
      'Performance analytics',
      'Follower insights',
      'Verified badge eligibility',
    ],
  },
  stripePriceId: import.meta.env.VITE_STRIPE_COPY_TRADING || 'price_copy_trading_base',
} as const;

/**
 * On-Chain Analytics
 * Free: Basic metrics
 * Pro: $29.99/month
 * Enterprise: Custom pricing
 */
export const ONCHAIN_ANALYTICS_PRICING = {
  tiers: {
    basic: {
      id: 'onchain-basic',
      name: 'On-Chain Analytics Basic',
      description: 'Essential on-chain metrics for free',
      price: 0,
      currency: 'USD',
      features: [
        'Active addresses',
        'Transaction count',
        'Transaction volume',
        'Daily data only',
        '30 days historical',
        '3 alerts max',
      ],
      limits: {
        metrics: ['active_addresses', 'transaction_count', 'transaction_volume'],
        aggregation_periods: ['daily'],
        historical_days: 30,
        max_alerts: 3,
        api_access: false,
        custom_dashboards: false,
        export_enabled: false,
      },
    },
    pro: {
      id: 'onchain-pro',
      name: 'On-Chain Analytics Pro',
      description: 'Full access to all on-chain metrics and alerts',
      price_monthly: 29.99,
      price_yearly: 299.99,
      currency: 'USD',
      features: [
        'All 20+ on-chain metrics',
        'Exchange flows analysis',
        'Miner metrics',
        'Valuation indicators (NVT, MVRV, SOPR)',
        'Holder behavior analytics',
        'Hourly/Daily/Weekly data',
        '365 days historical',
        '20 custom alerts',
        'Custom dashboards',
        'Data export (CSV/JSON)',
        'API access',
      ],
      limits: {
        metrics: 'all',
        aggregation_periods: ['hourly', 'daily', 'weekly', 'monthly'],
        historical_days: 365,
        max_alerts: 20,
        api_access: true,
        custom_dashboards: true,
        export_enabled: true,
      },
      stripePriceId: {
        monthly: import.meta.env.VITE_STRIPE_ONCHAIN_PRO_MONTHLY || 'price_onchain_pro_monthly',
        yearly: import.meta.env.VITE_STRIPE_ONCHAIN_PRO_YEARLY || 'price_onchain_pro_yearly',
      },
    },
    enterprise: {
      id: 'onchain-enterprise',
      name: 'On-Chain Analytics Enterprise',
      description: 'Enterprise-grade analytics with dedicated support',
      price: 'custom',
      currency: 'USD',
      features: [
        'Everything in Pro',
        '5 years historical data',
        '100 custom alerts',
        'Team access',
        'Dedicated account manager',
        'Custom metrics development',
        'Priority data feeds',
        'SLA guarantees',
      ],
      limits: {
        metrics: 'all',
        aggregation_periods: ['hourly', 'daily', 'weekly', 'monthly'],
        historical_days: 1825,
        max_alerts: 100,
        api_access: true,
        custom_dashboards: true,
        export_enabled: true,
        team_access: true,
      },
    },
  },
} as const;

/**
 * Lending Comparison (Free with Affiliate)
 * Affiliate commissions: $500-5000 per referred depositor
 */
export const LENDING_AFFILIATE_CONFIG = {
  id: 'lending-affiliate',
  name: 'Lending Platform Comparison',
  description: 'Compare lending rates across DeFi and CeFi platforms',
  pricing: 'free',
  revenue_model: 'affiliate',
  commission_range: {
    min: 500,
    max: 5000,
    currency: 'USD',
  },
  cookie_duration_days: 30,
} as const;

// ==================== Add-On Access Helpers ====================

/**
 * Check if user has NFT Portfolio Premium access
 */
export function hasNFTPortfolioPremium(
  nftSubscriptionStatus?: 'active' | 'inactive' | 'cancelled'
): boolean {
  return nftSubscriptionStatus === 'active';
}

/**
 * Check if user has On-Chain Analytics Pro access
 */
export function hasOnChainAnalyticsPro(
  onchainTier?: 'basic' | 'pro' | 'enterprise'
): boolean {
  return onchainTier === 'pro' || onchainTier === 'enterprise';
}

/**
 * Check if user has influencer transparency access
 */
export function hasInfluencerTransparencyAccess(
  transparencySubscriptionStatus?: 'active' | 'inactive' | 'cancelled'
): boolean {
  return transparencySubscriptionStatus === 'active';
}

/**
 * Check if user can copy trade a portfolio
 */
export function hasCopyTradingAccess(
  copySubscriptionStatus?: 'active' | 'paused' | 'cancelled'
): boolean {
  return copySubscriptionStatus === 'active';
}
