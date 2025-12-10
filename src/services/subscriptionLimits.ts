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

    // Price alert limits
    maxActiveAlerts: 3,

    // Data freshness (in milliseconds)
    // Free tier gets 15-minute delayed data
    priceDataDelay: 15 * 60 * 1000, // 15 minutes

    // Historical data limits - Free users see 30-day price history
    historicalDataDays: 30,
    fullHistoricalAccess: false,

    // Tax reports - free users can preview but not export
    canExportTaxReports: false,

    // Other features
    cloudSync: false,
    emailAlerts: false,
    smsAlerts: false,
    advancedAnalytics: false,
    adFree: false,
    aiPortfolioAnalysis: false,
    backtestingAdvanced: false,

    // Dashboard customization
    customDashboard: false,
    maxDashboards: 1,

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

    // Price alert limits - unlimited
    maxActiveAlerts: Infinity,

    // Data freshness - real-time (5 min cache for API efficiency)
    priceDataDelay: 0, // Real-time

    // Historical data - Full access to all historical charts and data
    historicalDataDays: Infinity,
    fullHistoricalAccess: true,

    // Tax reports - full access
    canExportTaxReports: true,

    // Other features
    cloudSync: true,
    emailAlerts: true,
    smsAlerts: true,
    advancedAnalytics: true,
    adFree: true,
    aiPortfolioAnalysis: true,
    backtestingAdvanced: true,

    // Dashboard customization
    customDashboard: true,
    maxDashboards: 5,

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

    // Price alert limits - unlimited
    maxActiveAlerts: Infinity,

    // Data freshness - real-time
    priceDataDelay: 0,

    // Historical data - Full access
    historicalDataDays: Infinity,
    fullHistoricalAccess: true,

    // Tax reports - full access
    canExportTaxReports: true,

    // Other features
    cloudSync: true,
    emailAlerts: true,
    smsAlerts: true,
    advancedAnalytics: true,
    adFree: true,
    aiPortfolioAnalysis: true,
    backtestingAdvanced: true,

    // Dashboard customization
    customDashboard: true,
    maxDashboards: 10,

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

    // Price alert limits - unlimited
    maxActiveAlerts: Infinity,

    // Data freshness - real-time
    priceDataDelay: 0,

    // Historical data - Full access
    historicalDataDays: Infinity,
    fullHistoricalAccess: true,

    // Tax reports - full access
    canExportTaxReports: true,

    // Other features
    cloudSync: true,
    emailAlerts: true,
    smsAlerts: true,
    advancedAnalytics: true,
    adFree: true,
    aiPortfolioAnalysis: true,
    backtestingAdvanced: true,

    // Dashboard customization
    customDashboard: true,
    maxDashboards: Infinity,

    // Advisor/Enterprise features
    whiteLabelReports: true,
    clientDashboard: true,
    complianceExports: true,
    customBranding: 'full' as const,
    apiAccess: true,
    teamAccess: true,
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
  // Check if subscription is still active
  if (!isSubscriptionActive(subscriptionExpiresAt)) {
    return TIER_LIMITS.free;
  }

  switch (subscriptionStatus) {
    case 'enterprise':
      return TIER_LIMITS.enterprise;
    case 'advisor':
      return TIER_LIMITS.advisor;
    case 'premium':
      return TIER_LIMITS.premium;
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

/**
 * Historical Data Paywall Configuration
 * Free users see 30-day price history, premium unlocks full historical charts
 */
export const HISTORICAL_DATA_CONFIG = {
  free: {
    maxDays: 30,
    allowedTimeframes: ['24h', '7d', '30d'] as const,
    description: 'Access 30-day price history',
  },
  premium: {
    maxDays: Infinity,
    allowedTimeframes: ['24h', '7d', '30d', '90d', '1y', '5y', 'max'] as const,
    description: 'Access full historical data (years of history)',
  },
} as const;

export type HistoricalTimeframe = '24h' | '7d' | '30d' | '90d' | '1y' | '5y' | 'max';

/**
 * Check if user has full historical data access
 */
export function hasFullHistoricalAccess(
  subscriptionStatus?: SubscriptionStatus,
  subscriptionExpiresAt?: string | null
): boolean {
  const limits = getTierLimits(subscriptionStatus, subscriptionExpiresAt);
  return limits.fullHistoricalAccess;
}

/**
 * Get maximum historical data days for user's tier
 */
export function getMaxHistoricalDays(
  subscriptionStatus?: SubscriptionStatus,
  subscriptionExpiresAt?: string | null
): number {
  const limits = getTierLimits(subscriptionStatus, subscriptionExpiresAt);
  return limits.historicalDataDays;
}

/**
 * Check if user can access a specific historical timeframe
 */
export function canAccessTimeframe(
  timeframe: HistoricalTimeframe,
  subscriptionStatus?: SubscriptionStatus,
  subscriptionExpiresAt?: string | null
): boolean {
  const hasFullAccess = hasFullHistoricalAccess(subscriptionStatus, subscriptionExpiresAt);

  if (hasFullAccess) return true;

  const freeTimeframes = HISTORICAL_DATA_CONFIG.free.allowedTimeframes;
  return (freeTimeframes as readonly string[]).includes(timeframe);
}

/**
 * Get allowed timeframes for user's tier
 */
export function getAllowedTimeframes(
  subscriptionStatus?: SubscriptionStatus,
  subscriptionExpiresAt?: string | null
): readonly HistoricalTimeframe[] {
  const hasFullAccess = hasFullHistoricalAccess(subscriptionStatus, subscriptionExpiresAt);

  if (hasFullAccess) {
    return HISTORICAL_DATA_CONFIG.premium.allowedTimeframes;
  }

  return HISTORICAL_DATA_CONFIG.free.allowedTimeframes;
}

/**
 * Convert timeframe to days for API calls
 */
export function timeframeToDays(timeframe: HistoricalTimeframe): number {
  switch (timeframe) {
    case '24h':
      return 1;
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 90;
    case '1y':
      return 365;
    case '5y':
      return 1825;
    case 'max':
      return 3650; // ~10 years
    default:
      return 30;
  }
}

/**
 * Get timeframe label for display
 */
export function getTimeframeLabel(timeframe: HistoricalTimeframe): string {
  switch (timeframe) {
    case '24h':
      return '24 Hours';
    case '7d':
      return '7 Days';
    case '30d':
      return '30 Days';
    case '90d':
      return '90 Days';
    case '1y':
      return '1 Year';
    case '5y':
      return '5 Years';
    case 'max':
      return 'All Time';
    default:
      return timeframe;
  }
}

/**
 * Check if user can customize dashboard
 */
export function canCustomizeDashboard(
  subscriptionStatus?: SubscriptionStatus,
  subscriptionExpiresAt?: string | null
): boolean {
  const limits = getTierLimits(subscriptionStatus, subscriptionExpiresAt);
  return limits.customDashboard;
}

/**
 * Get maximum dashboards for user's tier
 */
export function getMaxDashboards(
  subscriptionStatus?: SubscriptionStatus,
  subscriptionExpiresAt?: string | null
): number {
  const limits = getTierLimits(subscriptionStatus, subscriptionExpiresAt);
  return limits.maxDashboards;
}
