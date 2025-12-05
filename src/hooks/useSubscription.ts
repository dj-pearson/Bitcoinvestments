/**
 * useSubscription Hook
 *
 * Provides subscription status and tier limits throughout the app.
 * Caches user subscription data and provides helper methods for feature gating.
 */

import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser, getUserProfile } from '../services/auth';
import {
  getTierLimits,
  canAddAsset,
  canCreateAlert,
  getDataDelay,
  canExportTaxReports,
  hasCloudSync,
  hasEmailAlerts,
  isTaxSeasonActive,
  TIER_LIMITS,
  TAX_PACKAGE,
} from '../services/subscriptionLimits';
import { hasPremiumAccess } from '../services/stripe';
import type { TierLimits } from '../services/subscriptionLimits';

export interface SubscriptionState {
  // Loading state
  loading: boolean;

  // User info
  userId: string | null;
  isAuthenticated: boolean;

  // Subscription status
  subscriptionStatus: 'free' | 'premium';
  subscriptionExpiresAt: string | null;
  isPremium: boolean;

  // Tier limits
  limits: TierLimits;

  // Helper functions
  canAddAsset: (currentCount: number) => { allowed: boolean; limit: number; remaining: number };
  canCreateAlert: (currentCount: number) => { allowed: boolean; limit: number; remaining: number };
  canExportTaxReports: (hasTaxPackage?: boolean) => boolean;
  hasCloudSync: () => boolean;
  hasEmailAlerts: () => boolean;
  getDataDelay: () => number;

  // Tax package
  isTaxSeasonActive: boolean;
  taxPackage: typeof TAX_PACKAGE;

  // Refresh function
  refresh: () => Promise<void>;
}

/**
 * Hook to access subscription status and limits
 */
export function useSubscription(): SubscriptionState {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'premium'>('free');
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState<string | null>(null);

  const loadSubscriptionData = useCallback(async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();

      if (user) {
        setUserId(user.id);
        const profile = await getUserProfile(user.id);

        if (profile) {
          setSubscriptionStatus(profile.subscription_status || 'free');
          setSubscriptionExpiresAt(profile.subscription_expires_at || null);
        }
      } else {
        setUserId(null);
        setSubscriptionStatus('free');
        setSubscriptionExpiresAt(null);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptionData();
  }, [loadSubscriptionData]);

  const isPremium = hasPremiumAccess(subscriptionStatus, subscriptionExpiresAt);
  const limits = getTierLimits(subscriptionStatus, subscriptionExpiresAt);

  return {
    loading,
    userId,
    isAuthenticated: !!userId,
    subscriptionStatus,
    subscriptionExpiresAt,
    isPremium,
    limits,

    // Helper functions bound to current subscription state
    canAddAsset: (currentCount: number) =>
      canAddAsset(currentCount, subscriptionStatus, subscriptionExpiresAt),

    canCreateAlert: (currentCount: number) =>
      canCreateAlert(currentCount, subscriptionStatus, subscriptionExpiresAt),

    canExportTaxReports: (hasTaxPackage?: boolean) =>
      canExportTaxReports(subscriptionStatus, subscriptionExpiresAt, hasTaxPackage),

    hasCloudSync: () => hasCloudSync(subscriptionStatus, subscriptionExpiresAt),

    hasEmailAlerts: () => hasEmailAlerts(subscriptionStatus, subscriptionExpiresAt),

    getDataDelay: () => getDataDelay(subscriptionStatus, subscriptionExpiresAt),

    // Tax package info
    isTaxSeasonActive: isTaxSeasonActive(),
    taxPackage: TAX_PACKAGE,

    // Refresh function
    refresh: loadSubscriptionData,
  };
}

/**
 * Get static tier limits (for non-hook contexts)
 */
export function getFreeTierLimits() {
  return TIER_LIMITS.free;
}

export function getPremiumTierLimits() {
  return TIER_LIMITS.premium;
}
