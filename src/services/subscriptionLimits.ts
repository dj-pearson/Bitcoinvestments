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
