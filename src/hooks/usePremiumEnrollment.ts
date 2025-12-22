/**
 * usePremiumEnrollment Hook
 *
 * Tracks user usage metrics and provides smart enrollment recommendations
 * based on thresholds and user behavior patterns.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from './useSubscription';
import {
  evaluateEnrollmentTriggers,
  getTopRecommendation,
  getEnrollmentPlanDetails,
  getContextualEnrollmentMessage,
  shouldShowEnrollmentBanner,
  createEnrollmentEvent,
  type UserUsageMetrics,
  type EnrollmentRecommendation,
  type EnrollmentEvent,
  type EnrollmentTriggerType,
} from '../services/premiumEnrollment';
import { TIER_LIMITS, isTaxSeasonActive } from '../services/subscriptionLimits';

// Local storage keys for tracking
const STORAGE_KEYS = {
  USAGE_METRICS: 'premium_enrollment_metrics',
  LAST_DISMISSAL: 'premium_enrollment_last_dismissal',
  TAX_PROMPT_SEEN: 'premium_enrollment_tax_seen',
  EVENTS: 'premium_enrollment_events',
} as const;

/**
 * Extended metrics for storage
 */
interface StoredMetrics extends Partial<UserUsageMetrics> {
  lastActiveDate?: string;
}

/**
 * Get stored metrics from localStorage
 */
function getStoredMetrics(): StoredMetrics {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USAGE_METRICS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return {};
}

/**
 * Save metrics to localStorage
 */
function saveMetrics(metrics: Partial<UserUsageMetrics>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USAGE_METRICS, JSON.stringify(metrics));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get last dismissal date
 */
function getLastDismissal(): Date | undefined {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LAST_DISMISSAL);
    if (stored) {
      return new Date(stored);
    }
  } catch {
    // Ignore errors
  }
  return undefined;
}

/**
 * Save dismissal timestamp
 */
function saveDismissal(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_DISMISSAL, new Date().toISOString());
  } catch {
    // Ignore errors
  }
}

/**
 * Check if tax prompt has been seen
 */
function hasSeenTaxPrompt(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TAX_PROMPT_SEEN);
    if (stored) {
      const data = JSON.parse(stored);
      // Reset if new tax year
      const currentYear = new Date().getFullYear();
      return data.year === currentYear;
    }
  } catch {
    // Ignore errors
  }
  return false;
}

/**
 * Mark tax prompt as seen
 */
function markTaxPromptSeen(): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.TAX_PROMPT_SEEN,
      JSON.stringify({ year: new Date().getFullYear(), seen: true })
    );
  } catch {
    // Ignore errors
  }
}

/**
 * Store enrollment event for analytics
 */
function storeEvent(event: EnrollmentEvent): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.EVENTS);
    const events: EnrollmentEvent[] = stored ? JSON.parse(stored) : [];
    events.push(event);
    // Keep only last 50 events
    const trimmed = events.slice(-50);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(trimmed));
  } catch {
    // Ignore errors
  }
}

export interface UsePremiumEnrollmentOptions {
  /** Current page context for contextual messaging */
  context?: 'portfolio' | 'alerts' | 'prices' | 'tax' | 'analytics' | 'general';
  /** Current asset count (for portfolio pages) */
  assetCount?: number;
  /** Current alert count (for alerts pages) */
  alertCount?: number;
}

export interface UsePremiumEnrollmentResult {
  // State
  loading: boolean;
  isEligibleForUpgrade: boolean;

  // Recommendations
  recommendations: EnrollmentRecommendation[];
  topRecommendation: EnrollmentRecommendation | null;
  contextualMessage: string;

  // Banner control
  shouldShowBanner: boolean;
  bannerRecommendation: EnrollmentRecommendation | null;

  // Actions
  dismissRecommendation: (recommendation: EnrollmentRecommendation) => void;
  trackClick: (recommendation: EnrollmentRecommendation) => void;
  trackCheckoutStart: (recommendation: EnrollmentRecommendation) => void;
  trackCheckoutComplete: (recommendation: EnrollmentRecommendation) => void;
  trackCheckoutAbandon: (recommendation: EnrollmentRecommendation) => void;

  // Usage tracking
  trackPriceCheck: () => void;
  trackFeatureAttempt: (feature: 'tax' | 'analytics' | 'cloud') => void;

  // Plan details helper
  getPlanDetails: (plan: EnrollmentRecommendation['recommendedPlan']) => ReturnType<typeof getEnrollmentPlanDetails>;

  // Tax season
  isTaxSeasonActive: boolean;
  markTaxPromptSeen: () => void;
}

/**
 * Hook for managing premium enrollment prompts and tracking
 */
export function usePremiumEnrollment(
  options: UsePremiumEnrollmentOptions = {}
): UsePremiumEnrollmentResult {
  const { context = 'general', assetCount, alertCount } = options;
  const { user } = useAuth();
  const {
    subscriptionStatus,
    isPremium,
    limits,
    loading: subscriptionLoading,
  } = useSubscription();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<UserUsageMetrics>(() => ({
    currentAssetCount: assetCount ?? 0,
    maxAssets: TIER_LIMITS.free.maxAssets,
    assetsAddedThisMonth: 0,
    currentAlertCount: alertCount ?? 0,
    maxAlerts: TIER_LIMITS.free.maxActiveAlerts,
    alertsTriggeredThisMonth: 0,
    priceChecksToday: 0,
    priceChecksThisWeek: 0,
    daysActiveThisMonth: 1,
    sessionCount: 1,
    taxExportAttempts: 0,
    advancedAnalyticsAttempts: 0,
    cloudSyncAttempts: 0,
    accountAgeDays: 0,
    lastUpgradePromptDismissed: getLastDismissal(),
    hasSeenTaxPrompt: hasSeenTaxPrompt(),
    referralCount: 0,
  }));

  // Load stored metrics on mount
  useEffect(() => {
    const stored = getStoredMetrics();
    const today = new Date().toDateString();

    setMetrics((prev) => {
      const updated = {
        ...prev,
        ...stored,
        currentAssetCount: assetCount ?? stored.currentAssetCount ?? prev.currentAssetCount,
        currentAlertCount: alertCount ?? stored.currentAlertCount ?? prev.currentAlertCount,
        maxAssets: limits.maxAssets,
        maxAlerts: limits.maxActiveAlerts,
        lastUpgradePromptDismissed: getLastDismissal(),
        hasSeenTaxPrompt: hasSeenTaxPrompt(),
      };

      // Reset daily counters if new day
      if (stored.lastActiveDate !== today) {
        updated.priceChecksToday = 0;
      }

      // Track session
      updated.sessionCount = (stored.sessionCount ?? 0) + 1;

      return updated;
    });

    setLoading(false);
  }, [assetCount, alertCount, limits]);

  // Update metrics when asset/alert counts change
  useEffect(() => {
    if (assetCount !== undefined) {
      setMetrics((prev) => ({ ...prev, currentAssetCount: assetCount }));
    }
  }, [assetCount]);

  useEffect(() => {
    if (alertCount !== undefined) {
      setMetrics((prev) => ({ ...prev, currentAlertCount: alertCount }));
    }
  }, [alertCount]);

  // Calculate account age
  useEffect(() => {
    if (user?.created_at) {
      const createdDate = new Date(user.created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setMetrics((prev) => ({ ...prev, accountAgeDays: diffDays }));
    }
  }, [user?.created_at]);

  // Determine current tier
  const currentTier = useMemo((): 'free' | 'premium' | 'advisor' | 'enterprise' => {
    // Cast to string for comparison since SubscriptionStatus may be more restrictive
    const status = subscriptionStatus as string;
    if (status === 'advisor') return 'advisor';
    if (status === 'enterprise') return 'enterprise';
    if (isPremium) return 'premium';
    return 'free';
  }, [subscriptionStatus, isPremium]);

  // Evaluate recommendations
  const recommendations = useMemo(() => {
    if (subscriptionLoading || loading) return [];
    return evaluateEnrollmentTriggers(metrics, currentTier);
  }, [metrics, currentTier, subscriptionLoading, loading]);

  const topRecommendation = useMemo(
    () => getTopRecommendation(recommendations),
    [recommendations]
  );

  // Contextual message
  const contextualMessage = useMemo(
    () => getContextualEnrollmentMessage(context, currentTier),
    [context, currentTier]
  );

  // Banner control
  const shouldShowBanner = useMemo(
    () => shouldShowEnrollmentBanner(metrics, currentTier, context),
    [metrics, currentTier, context]
  );

  const bannerRecommendation = useMemo(() => {
    if (!shouldShowBanner) return null;
    // Find recommendation matching the context
    const contextTriggers: Record<string, EnrollmentTriggerType[]> = {
      portfolio: ['asset_limit_warning', 'asset_limit_reached'],
      alerts: ['alert_limit_warning', 'alert_limit_reached'],
      prices: ['data_delay_frustration'],
      tax: ['tax_season_available', 'tax_export_blocked'],
      analytics: ['advanced_feature_blocked'],
    };

    const triggers = contextTriggers[context] || [];
    return (
      recommendations.find((r) => triggers.includes(r.trigger)) ||
      topRecommendation
    );
  }, [shouldShowBanner, context, recommendations, topRecommendation]);

  // Actions
  const dismissRecommendation = useCallback(
    (recommendation: EnrollmentRecommendation) => {
      saveDismissal();
      setMetrics((prev) => ({
        ...prev,
        lastUpgradePromptDismissed: new Date(),
      }));

      // Track event
      const event = createEnrollmentEvent('prompt_dismissed', recommendation, context);
      storeEvent(event);

      // If it's a tax prompt, mark as seen
      if (recommendation.trigger === 'tax_season_available') {
        markTaxPromptSeen();
        setMetrics((prev) => ({ ...prev, hasSeenTaxPrompt: true }));
      }
    },
    [context]
  );

  const trackClick = useCallback(
    (recommendation: EnrollmentRecommendation) => {
      const event = createEnrollmentEvent('prompt_clicked', recommendation, context);
      storeEvent(event);
    },
    [context]
  );

  const trackCheckoutStart = useCallback(
    (recommendation: EnrollmentRecommendation) => {
      const event = createEnrollmentEvent('checkout_started', recommendation, context);
      storeEvent(event);
    },
    [context]
  );

  const trackCheckoutComplete = useCallback(
    (recommendation: EnrollmentRecommendation) => {
      const event = createEnrollmentEvent('checkout_completed', recommendation, context);
      storeEvent(event);
    },
    [context]
  );

  const trackCheckoutAbandon = useCallback(
    (recommendation: EnrollmentRecommendation) => {
      const event = createEnrollmentEvent('checkout_abandoned', recommendation, context);
      storeEvent(event);
    },
    [context]
  );

  // Usage tracking
  const trackPriceCheck = useCallback(() => {
    setMetrics((prev) => {
      const updated = {
        ...prev,
        priceChecksToday: prev.priceChecksToday + 1,
        priceChecksThisWeek: prev.priceChecksThisWeek + 1,
        lastActiveDate: new Date().toDateString(),
      };
      saveMetrics(updated);
      return updated;
    });
  }, []);

  const trackFeatureAttempt = useCallback((feature: 'tax' | 'analytics' | 'cloud') => {
    setMetrics((prev) => {
      const key =
        feature === 'tax'
          ? 'taxExportAttempts'
          : feature === 'analytics'
          ? 'advancedAnalyticsAttempts'
          : 'cloudSyncAttempts';

      const updated = {
        ...prev,
        [key]: prev[key] + 1,
      };
      saveMetrics(updated);
      return updated;
    });
  }, []);

  const getPlanDetails = useCallback(
    (plan: EnrollmentRecommendation['recommendedPlan']) => getEnrollmentPlanDetails(plan),
    []
  );

  const handleMarkTaxPromptSeen = useCallback(() => {
    markTaxPromptSeen();
    setMetrics((prev) => ({ ...prev, hasSeenTaxPrompt: true }));
  }, []);

  return {
    loading: loading || subscriptionLoading,
    isEligibleForUpgrade: currentTier !== 'enterprise',

    recommendations,
    topRecommendation,
    contextualMessage,

    shouldShowBanner,
    bannerRecommendation,

    dismissRecommendation,
    trackClick,
    trackCheckoutStart,
    trackCheckoutComplete,
    trackCheckoutAbandon,

    trackPriceCheck,
    trackFeatureAttempt,

    getPlanDetails,

    isTaxSeasonActive: isTaxSeasonActive(),
    markTaxPromptSeen: handleMarkTaxPromptSeen,
  };
}

/**
 * Simple hook to just check if user should see upgrade prompt
 */
export function useShouldShowUpgrade(): boolean {
  const { isPremium, loading } = useSubscription();

  if (loading) return false;
  return !isPremium;
}
