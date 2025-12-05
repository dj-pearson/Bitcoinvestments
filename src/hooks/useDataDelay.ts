/**
 * useDataDelay Hook
 *
 * Initializes and manages the data delay based on user subscription.
 * Free users get 15-minute delayed data, premium users get real-time.
 */

import { useEffect, useState } from 'react';
import { getCurrentUser, getUserProfile } from '../services/auth';
import { setDataDelay, isDataDelayed, getDataDelayMs } from '../services/coingecko';
import { getDataDelay as getDelayFromLimits } from '../services/subscriptionLimits';
import { hasPremiumAccess } from '../services/stripe';

export interface DataDelayState {
  /** Whether data is currently delayed */
  isDelayed: boolean;
  /** Delay in milliseconds */
  delayMs: number;
  /** Human-readable delay string */
  delayText: string;
  /** Whether the user has premium access */
  isPremium: boolean;
  /** Loading state */
  loading: boolean;
}

/**
 * Hook to initialize and track data delay status
 * Should be used at the app root to set up data delay based on user subscription
 */
export function useDataDelay(): DataDelayState {
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [delayMs, setDelayMs] = useState(0);

  useEffect(() => {
    async function initDataDelay() {
      setLoading(true);

      try {
        const user = await getCurrentUser();

        if (user) {
          const profile = await getUserProfile(user.id);
          const premium = hasPremiumAccess(
            profile?.subscription_status,
            profile?.subscription_expires_at
          );
          setIsPremium(premium);

          // Get delay from subscription limits service
          const delay = getDelayFromLimits(
            profile?.subscription_status,
            profile?.subscription_expires_at
          );

          // Set the delay in the coingecko service
          setDataDelay(delay);
          setDelayMs(delay);
        } else {
          // Not logged in = free tier = delayed data
          const freeDelay = getDelayFromLimits('free', null);
          setDataDelay(freeDelay);
          setDelayMs(freeDelay);
          setIsPremium(false);
        }
      } catch (error) {
        console.error('Error initializing data delay:', error);
        // Default to free tier delay on error
        const freeDelay = getDelayFromLimits('free', null);
        setDataDelay(freeDelay);
        setDelayMs(freeDelay);
      } finally {
        setLoading(false);
      }
    }

    initDataDelay();
  }, []);

  // Format the delay text
  const delayText = delayMs > 0 ? `${Math.round(delayMs / 60000)}-min delayed` : 'Real-time';

  return {
    isDelayed: isDataDelayed(),
    delayMs,
    delayText,
    isPremium,
    loading,
  };
}

/**
 * Get the current data delay status synchronously
 * (only accurate after useDataDelay has initialized)
 */
export function getCurrentDataDelayStatus(): { isDelayed: boolean; delayMs: number } {
  return {
    isDelayed: isDataDelayed(),
    delayMs: getDataDelayMs(),
  };
}
