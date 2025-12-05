/**
 * Subscription Limits Service
 *
 * Centralized configuration and validation for freemium feature limits.
 * Free users have limited access, premium users get unlimited features.
 */

import { hasPremiumAccess } from './stripe';

/**
 * Feature limits configuration for each tier
 */
export const TIER_LIMITS = {
  free: {
    // Portfolio limits
    maxAssets: 10,

    // Price alert limits
    maxActiveAlerts: 3,

    // Data freshness (in milliseconds)
    // Free tier gets 15-minute delayed data
    priceDataDelay: 15 * 60 * 1000, // 15 minutes

    // Tax reports - free users can preview but not export
    canExportTaxReports: false,

    // Other features
    cloudSync: false,
    emailAlerts: false,
    smsAlerts: false,
    advancedAnalytics: false,
  },
  premium: {
    // Portfolio limits - unlimited
    maxAssets: Infinity,

    // Price alert limits - unlimited
    maxActiveAlerts: Infinity,

    // Data freshness - real-time (5 min cache for API efficiency)
    priceDataDelay: 0, // Real-time

    // Tax reports - full access
    canExportTaxReports: true,

    // Other features
    cloudSync: true,
    emailAlerts: true,
    smsAlerts: true,
    advancedAnalytics: true,
  },
} as const;

export type SubscriptionTier = keyof typeof TIER_LIMITS;
export type TierLimits = typeof TIER_LIMITS[SubscriptionTier];

/**
 * Get limits for a user's subscription tier
 */
export function getTierLimits(
  subscriptionStatus?: 'free' | 'premium',
  subscriptionExpiresAt?: string | null
): TierLimits {
  const isPremium = hasPremiumAccess(subscriptionStatus, subscriptionExpiresAt);
  return isPremium ? TIER_LIMITS.premium : TIER_LIMITS.free;
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
  return TAX_PACKAGE.availableMonths.includes(currentMonth);
}

/**
 * Format limit for display (handles infinity)
 */
export function formatLimit(limit: number): string {
  return limit === Infinity || limit === -1 ? 'Unlimited' : limit.toString();
}
