/**
 * Premium Enrollment Service
 *
 * Manages the premium member enrollment process with:
 * - Usage thresholds and level triggers
 * - Smart upgrade recommendations based on user behavior
 * - One-time purchase suggestions (e.g., tax compilations)
 * - Contextual enrollment prompts
 */

import { isTaxSeasonActive, TAX_PACKAGE } from './subscriptionLimits';
import { SUBSCRIPTION_TIERS } from './stripe';

/**
 * Enrollment trigger types
 */
export type EnrollmentTriggerType =
  | 'asset_limit_warning'      // Approaching asset limit
  | 'asset_limit_reached'      // Hit asset limit
  | 'alert_limit_warning'      // Approaching alert limit
  | 'alert_limit_reached'      // Hit alert limit
  | 'data_delay_frustration'   // User frequently viewing prices (wants real-time)
  | 'cloud_sync_needed'        // Multi-device usage detected
  | 'tax_season_available'     // Tax package available during season
  | 'tax_export_blocked'       // User tried to export without access
  | 'advanced_feature_blocked' // User tried to access premium feature
  | 'usage_milestone'          // Reached a usage milestone (engagement)
  | 'trial_ending'             // Trial period ending soon
  | 'special_offer'            // Limited time offer
  | 'advisor_upgrade'          // Premium user ready for advisor tier
  | 'enterprise_upgrade';      // Advisor ready for enterprise tier

/**
 * Enrollment recommendation
 */
export interface EnrollmentRecommendation {
  trigger: EnrollmentTriggerType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  recommendedPlan: 'premium' | 'annual' | 'advisor' | 'enterprise' | 'tax_package';
  title: string;
  message: string;
  benefits: string[];
  savingsMessage?: string;
  urgency?: string;
  oneTimePurchase?: boolean;
  dismissable: boolean;
  showAfterDismissHours?: number; // When to show again after dismissal
}

/**
 * User usage metrics for enrollment decisions
 */
export interface UserUsageMetrics {
  // Asset tracking
  currentAssetCount: number;
  maxAssets: number;
  assetsAddedThisMonth: number;

  // Price alerts
  currentAlertCount: number;
  maxAlerts: number;
  alertsTriggeredThisMonth: number;

  // Engagement
  priceChecksToday: number;
  priceChecksThisWeek: number;
  daysActiveThisMonth: number;
  sessionCount: number;

  // Feature attempts
  taxExportAttempts: number;
  advancedAnalyticsAttempts: number;
  cloudSyncAttempts: number;

  // Account info
  accountAgeDays: number;
  lastUpgradePromptDismissed?: Date;
  hasSeenTaxPrompt: boolean;
  referralCount: number;
}

/**
 * Enrollment trigger thresholds configuration
 */
export const ENROLLMENT_THRESHOLDS = {
  // Asset limits
  assetWarningPercent: 80,      // Show warning at 80% of limit (8/10 for free)
  assetCriticalPercent: 100,    // Critical at limit

  // Alert limits
  alertWarningPercent: 67,      // Show warning at 2/3 of limit (2/3 for free)
  alertCriticalPercent: 100,    // Critical at limit

  // Engagement thresholds for "power user" detection
  priceChecksPerDayForPowerUser: 10,
  priceChecksPerWeekForPowerUser: 50,
  daysActiveForEngagedUser: 15,
  sessionsForEngagedUser: 20,

  // Feature attempt thresholds
  featureAttemptsTrigger: 2,    // Show prompt after 2 blocked attempts

  // Account maturity for upgrade suggestions
  minAccountAgeDaysForUpgrade: 7,
  minAccountAgeDaysForAdvisor: 30,

  // Re-prompt timing (hours)
  lowPriorityDismissHours: 168,      // 1 week
  mediumPriorityDismissHours: 72,    // 3 days
  highPriorityDismissHours: 24,      // 1 day
  criticalPriorityDismissHours: 12,  // 12 hours
} as const;

/**
 * One-time purchase options
 */
export const ONE_TIME_PURCHASES = {
  taxPackageBasic: {
    id: 'tax-package-basic',
    name: 'Tax Report Package',
    description: 'Generate comprehensive crypto tax reports for the current tax year',
    price: TAX_PACKAGE.price,
    stripePriceId: TAX_PACKAGE.stripePriceId.basic,
    features: TAX_PACKAGE.features.basic,
    availability: {
      type: 'seasonal' as const,
      months: [1, 2, 3, 4], // January - April
    },
  },
  taxPackagePremium: {
    id: 'tax-package-premium',
    name: 'Tax Report Package Pro',
    description: 'Enhanced tax reporting with integrations and support',
    price: TAX_PACKAGE.premiumPrice,
    stripePriceId: TAX_PACKAGE.stripePriceId.premium,
    features: TAX_PACKAGE.features.premium,
    availability: {
      type: 'seasonal' as const,
      months: [1, 2, 3, 4],
    },
  },
} as const;

/**
 * Calculate usage percentage for a limit
 */
function calculateUsagePercent(current: number, max: number): number {
  if (max === Infinity || max <= 0) return 0;
  return Math.min(100, (current / max) * 100);
}

/**
 * Check if enough time has passed since last dismissal
 */
function canShowAfterDismissal(
  lastDismissed: Date | undefined,
  hoursToWait: number
): boolean {
  if (!lastDismissed) return true;
  const hoursSinceDismissal = (Date.now() - lastDismissed.getTime()) / (1000 * 60 * 60);
  return hoursSinceDismissal >= hoursToWait;
}

/**
 * Evaluate enrollment triggers based on user metrics
 */
export function evaluateEnrollmentTriggers(
  metrics: UserUsageMetrics,
  currentTier: 'free' | 'premium' | 'advisor' | 'enterprise'
): EnrollmentRecommendation[] {
  const recommendations: EnrollmentRecommendation[] = [];
  const thresholds = ENROLLMENT_THRESHOLDS;

  // Skip if already at enterprise level
  if (currentTier === 'enterprise') {
    return recommendations;
  }

  // FREE TIER TRIGGERS
  if (currentTier === 'free') {
    // Asset limit triggers
    const assetPercent = calculateUsagePercent(metrics.currentAssetCount, metrics.maxAssets);

    if (assetPercent >= thresholds.assetCriticalPercent) {
      recommendations.push({
        trigger: 'asset_limit_reached',
        priority: 'critical',
        recommendedPlan: 'annual',
        title: 'Portfolio Limit Reached',
        message: `You've reached the maximum of ${metrics.maxAssets} assets. Upgrade to track unlimited crypto assets.`,
        benefits: [
          'Unlimited portfolio assets',
          'Real-time price data',
          'Cloud sync across devices',
          'Priority support',
        ],
        savingsMessage: 'Save 17% with annual billing',
        dismissable: true,
        showAfterDismissHours: thresholds.criticalPriorityDismissHours,
      });
    } else if (assetPercent >= thresholds.assetWarningPercent) {
      recommendations.push({
        trigger: 'asset_limit_warning',
        priority: 'high',
        recommendedPlan: 'premium',
        title: 'Approaching Portfolio Limit',
        message: `You're using ${metrics.currentAssetCount} of ${metrics.maxAssets} asset slots. Consider upgrading for unlimited tracking.`,
        benefits: [
          'Unlimited portfolio assets',
          'Real-time price updates',
          'Email price alerts',
        ],
        dismissable: true,
        showAfterDismissHours: thresholds.highPriorityDismissHours,
      });
    }

    // Alert limit triggers
    const alertPercent = calculateUsagePercent(metrics.currentAlertCount, metrics.maxAlerts);

    if (alertPercent >= thresholds.alertCriticalPercent) {
      recommendations.push({
        trigger: 'alert_limit_reached',
        priority: 'high',
        recommendedPlan: 'premium',
        title: 'Alert Limit Reached',
        message: `You've used all ${metrics.maxAlerts} price alerts. Upgrade for unlimited alerts with email notifications.`,
        benefits: [
          'Unlimited price alerts',
          'Email & SMS notifications',
          'Advanced alert conditions',
        ],
        dismissable: true,
        showAfterDismissHours: thresholds.highPriorityDismissHours,
      });
    } else if (alertPercent >= thresholds.alertWarningPercent) {
      recommendations.push({
        trigger: 'alert_limit_warning',
        priority: 'medium',
        recommendedPlan: 'premium',
        title: 'Running Low on Alerts',
        message: `You're using ${metrics.currentAlertCount} of ${metrics.maxAlerts} alerts. Premium gives you unlimited alerts.`,
        benefits: [
          'Unlimited price alerts',
          'Never miss a price movement',
        ],
        dismissable: true,
        showAfterDismissHours: thresholds.mediumPriorityDismissHours,
      });
    }

    // Power user detection (frequent price checking = wants real-time data)
    if (
      metrics.priceChecksToday >= thresholds.priceChecksPerDayForPowerUser ||
      metrics.priceChecksThisWeek >= thresholds.priceChecksPerWeekForPowerUser
    ) {
      recommendations.push({
        trigger: 'data_delay_frustration',
        priority: 'medium',
        recommendedPlan: 'premium',
        title: 'Get Real-Time Data',
        message: "You're checking prices frequently! Upgrade for real-time data instead of 15-minute delays.",
        benefits: [
          'Real-time price updates',
          'Instant price alerts',
          'Live portfolio valuation',
        ],
        dismissable: true,
        showAfterDismissHours: thresholds.mediumPriorityDismissHours,
      });
    }

    // Engagement milestone
    if (
      metrics.daysActiveThisMonth >= thresholds.daysActiveForEngagedUser &&
      metrics.accountAgeDays >= thresholds.minAccountAgeDaysForUpgrade
    ) {
      recommendations.push({
        trigger: 'usage_milestone',
        priority: 'low',
        recommendedPlan: 'annual',
        title: "You're a Power User!",
        message: `You've been active for ${metrics.daysActiveThisMonth} days this month. Unlock the full experience with Premium.`,
        benefits: [
          'All premium features',
          'Best value with annual plan',
          '30-day money-back guarantee',
        ],
        savingsMessage: 'Save $20/year with annual billing',
        dismissable: true,
        showAfterDismissHours: thresholds.lowPriorityDismissHours,
      });
    }

    // Tax export blocked
    if (metrics.taxExportAttempts >= thresholds.featureAttemptsTrigger) {
      if (isTaxSeasonActive()) {
        recommendations.push({
          trigger: 'tax_export_blocked',
          priority: 'high',
          recommendedPlan: 'tax_package',
          title: 'Tax Reports Available',
          message: 'Generate your crypto tax reports now! Available as a one-time purchase or with Premium.',
          benefits: [
            'Complete transaction history',
            'Capital gains calculations',
            'IRS Form 8949 format',
            'Support for 50+ exchanges',
          ],
          oneTimePurchase: true,
          dismissable: true,
          showAfterDismissHours: thresholds.highPriorityDismissHours,
        });
      } else {
        recommendations.push({
          trigger: 'tax_export_blocked',
          priority: 'medium',
          recommendedPlan: 'premium',
          title: 'Tax Export Feature',
          message: 'Premium members can export tax reports anytime. Upgrade for year-round access.',
          benefits: [
            'Tax report exports',
            'Plus all premium features',
            'Cloud sync your data',
          ],
          dismissable: true,
          showAfterDismissHours: thresholds.mediumPriorityDismissHours,
        });
      }
    }

    // Advanced feature blocked attempts
    if (
      metrics.advancedAnalyticsAttempts >= thresholds.featureAttemptsTrigger ||
      metrics.cloudSyncAttempts >= thresholds.featureAttemptsTrigger
    ) {
      recommendations.push({
        trigger: 'advanced_feature_blocked',
        priority: 'medium',
        recommendedPlan: 'premium',
        title: 'Unlock Advanced Features',
        message: 'Get access to advanced analytics, cloud sync, and AI portfolio analysis.',
        benefits: [
          'Advanced portfolio analytics',
          'AI-powered insights',
          'Cloud sync across devices',
          'Priority support',
        ],
        dismissable: true,
        showAfterDismissHours: thresholds.mediumPriorityDismissHours,
      });
    }
  }

  // PREMIUM TIER TRIGGERS (upgrade to Advisor)
  if (currentTier === 'premium') {
    if (
      metrics.accountAgeDays >= thresholds.minAccountAgeDaysForAdvisor &&
      metrics.daysActiveThisMonth >= thresholds.daysActiveForEngagedUser
    ) {
      recommendations.push({
        trigger: 'advisor_upgrade',
        priority: 'low',
        recommendedPlan: 'advisor',
        title: 'Manage Client Portfolios',
        message: 'Are you a financial advisor? Upgrade to manage up to 10 client portfolios.',
        benefits: [
          'Manage 10 client portfolios',
          'White-label PDF reports',
          'Client dashboard',
          'Compliance-ready exports',
        ],
        dismissable: true,
        showAfterDismissHours: thresholds.lowPriorityDismissHours,
      });
    }
  }

  // ADVISOR TIER TRIGGERS (upgrade to Enterprise)
  if (currentTier === 'advisor') {
    recommendations.push({
      trigger: 'enterprise_upgrade',
      priority: 'low',
      recommendedPlan: 'enterprise',
      title: 'Scale Your Practice',
      message: 'Need more than 10 clients? Upgrade to Enterprise for unlimited clients and API access.',
      benefits: [
        'Unlimited client portfolios',
        'Full API access',
        'Team collaboration',
        'Dedicated account manager',
      ],
      dismissable: true,
      showAfterDismissHours: thresholds.lowPriorityDismissHours,
    });
  }

  // TAX SEASON TRIGGERS (all free users during tax season)
  if (currentTier === 'free' && isTaxSeasonActive() && !metrics.hasSeenTaxPrompt) {
    recommendations.push({
      trigger: 'tax_season_available',
      priority: 'medium',
      recommendedPlan: 'tax_package',
      title: 'Tax Season is Here!',
      message: 'Get your crypto tax reports ready. Available as a one-time purchase.',
      benefits: [
        'Complete transaction history',
        'Capital gains/losses summary',
        'IRS Form 8949 format',
        'TurboTax integration (Pro)',
      ],
      urgency: 'Available until April 30th',
      oneTimePurchase: true,
      dismissable: true,
      showAfterDismissHours: thresholds.mediumPriorityDismissHours,
    });
  }

  // Filter based on dismissal timing
  return recommendations.filter((rec) =>
    canShowAfterDismissal(
      metrics.lastUpgradePromptDismissed,
      rec.showAfterDismissHours || thresholds.lowPriorityDismissHours
    )
  );
}

/**
 * Get the highest priority recommendation
 */
export function getTopRecommendation(
  recommendations: EnrollmentRecommendation[]
): EnrollmentRecommendation | null {
  if (recommendations.length === 0) return null;

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...recommendations].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return sorted[0];
}

/**
 * Get plan details for enrollment
 */
export function getEnrollmentPlanDetails(plan: EnrollmentRecommendation['recommendedPlan']) {
  switch (plan) {
    case 'premium':
      return {
        ...SUBSCRIPTION_TIERS.monthly,
        ctaText: 'Start Premium',
        priceDisplay: '$9.99/month',
      };
    case 'annual':
      return {
        ...SUBSCRIPTION_TIERS.annual,
        ctaText: 'Start Annual (Best Value)',
        priceDisplay: '$99.99/year',
        savings: 'Save 17%',
      };
    case 'advisor':
      return {
        ...SUBSCRIPTION_TIERS.advisor,
        ctaText: 'Start Advisor Plan',
        priceDisplay: '$49/month',
      };
    case 'enterprise':
      return {
        ...SUBSCRIPTION_TIERS.enterprise,
        ctaText: 'Start Enterprise',
        priceDisplay: '$99/month',
      };
    case 'tax_package':
      return {
        ...ONE_TIME_PURCHASES.taxPackageBasic,
        ctaText: 'Get Tax Package',
        priceDisplay: '$29.99 one-time',
        isOneTime: true,
      };
    default:
      return null;
  }
}

/**
 * Calculate potential savings message
 */
export function calculateSavingsMessage(
  currentPlan: 'free' | 'premium' | 'advisor' | 'enterprise',
  targetPlan: 'premium' | 'annual' | 'advisor' | 'enterprise'
): string | null {
  if (currentPlan === 'free' && targetPlan === 'annual') {
    const monthlyCost = SUBSCRIPTION_TIERS.monthly.price * 12;
    const annualCost = SUBSCRIPTION_TIERS.annual.price;
    const savings = monthlyCost - annualCost;
    return `Save $${savings.toFixed(0)}/year with annual billing`;
  }
  return null;
}

/**
 * Get contextual enrollment message based on where user is in the app
 */
export function getContextualEnrollmentMessage(
  context: 'portfolio' | 'alerts' | 'prices' | 'tax' | 'analytics' | 'general',
  currentTier: 'free' | 'premium' | 'advisor' | 'enterprise'
): string {
  if (currentTier !== 'free') return '';

  const messages: Record<string, string> = {
    portfolio: 'Upgrade to track unlimited assets and sync across all your devices.',
    alerts: 'Get unlimited price alerts with email and SMS notifications.',
    prices: 'Upgrade for real-time prices instead of 15-minute delayed data.',
    tax: 'Premium members can export tax reports anytime. Or get the Tax Package.',
    analytics: 'Unlock advanced analytics and AI-powered portfolio insights.',
    general: 'Upgrade to Premium for the full Bitcoin Investments experience.',
  };

  return messages[context] || messages.general;
}

/**
 * Track enrollment event for analytics
 */
export interface EnrollmentEvent {
  eventType:
    | 'prompt_shown'
    | 'prompt_dismissed'
    | 'prompt_clicked'
    | 'checkout_started'
    | 'checkout_completed'
    | 'checkout_abandoned';
  trigger: EnrollmentTriggerType;
  recommendedPlan: string;
  timestamp: Date;
  context?: string;
}

/**
 * Create an enrollment event for tracking
 */
export function createEnrollmentEvent(
  eventType: EnrollmentEvent['eventType'],
  recommendation: EnrollmentRecommendation,
  context?: string
): EnrollmentEvent {
  return {
    eventType,
    trigger: recommendation.trigger,
    recommendedPlan: recommendation.recommendedPlan,
    timestamp: new Date(),
    context,
  };
}

/**
 * Determine if user should see enrollment banner on page load
 */
export function shouldShowEnrollmentBanner(
  metrics: UserUsageMetrics,
  currentTier: 'free' | 'premium' | 'advisor' | 'enterprise',
  pageContext: 'portfolio' | 'alerts' | 'prices' | 'tax' | 'analytics' | 'general'
): boolean {
  // Don't show banners to paying customers on general pages
  if (currentTier !== 'free' && pageContext === 'general') {
    return false;
  }

  // Always show tax banner during tax season on tax page for free users
  if (pageContext === 'tax' && currentTier === 'free' && isTaxSeasonActive()) {
    return true;
  }

  // Show banner if user is at or near limits
  if (pageContext === 'portfolio') {
    const assetPercent = calculateUsagePercent(metrics.currentAssetCount, metrics.maxAssets);
    return assetPercent >= ENROLLMENT_THRESHOLDS.assetWarningPercent;
  }

  if (pageContext === 'alerts') {
    const alertPercent = calculateUsagePercent(metrics.currentAlertCount, metrics.maxAlerts);
    return alertPercent >= ENROLLMENT_THRESHOLDS.alertWarningPercent;
  }

  // Show on price page if user is a power user
  if (pageContext === 'prices') {
    return metrics.priceChecksToday >= ENROLLMENT_THRESHOLDS.priceChecksPerDayForPowerUser;
  }

  return false;
}
