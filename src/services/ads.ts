/**
 * Ad Serving Service
 *
 * Handles fetching, displaying, and tracking advertisements
 */

import { getActiveAds, trackAdImpression, trackAdClick } from './database';
import type { Advertisement } from '../types/database';

// Track which ads have been shown to avoid repetition
const shownAdsCache = new Map<string, Set<string>>();

/**
 * Get an ad for a specific zone with smart rotation
 */
export async function getAdForZone(
  zone: 'banner' | 'sidebar' | 'native' | 'popup',
  pageUrl: string = window.location.pathname
): Promise<Advertisement | null> {
  // Fetch all active ads for this zone
  const ads = await getActiveAds(zone);

  if (ads.length === 0) {
    return null;
  }

  // Get cache key for this page and zone
  const cacheKey = `${pageUrl}-${zone}`;
  const shownAds = shownAdsCache.get(cacheKey) || new Set<string>();

  // Filter out ads we've already shown on this page
  const unshownAds = ads.filter(ad => !shownAds.has(ad.id));

  // If all ads have been shown, reset the cache for this zone
  let candidateAds = unshownAds.length > 0 ? unshownAds : ads;

  if (unshownAds.length === 0) {
    shownAdsCache.delete(cacheKey);
  }

  // Apply targeting if specified
  candidateAds = candidateAds.filter(ad => {
    if (!ad.targeting) return true;

    const targeting = ad.targeting as Record<string, any>;

    // Check page targeting
    if (targeting.pages) {
      const pages = targeting.pages as string[];
      if (!pages.some(page => pageUrl.includes(page))) {
        return false;
      }
    }

    // Check device targeting (desktop/mobile)
    if (targeting.device) {
      const isMobile = /Mobile|Android|iPhone/i.test(navigator.userAgent);
      if (targeting.device === 'mobile' && !isMobile) return false;
      if (targeting.device === 'desktop' && isMobile) return false;
    }

    return true;
  });

  if (candidateAds.length === 0) {
    return null;
  }

  // Select ad with weighted random based on remaining impressions
  // Ads with more budget get shown more often
  const selectedAd = selectWeightedRandom(candidateAds);

  // Mark as shown in cache
  shownAds.add(selectedAd.id);
  shownAdsCache.set(cacheKey, shownAds);

  return selectedAd;
}

/**
 * Select a random ad with weighting based on click-through rate
 * Ads with better performance get shown more often
 */
function selectWeightedRandom(ads: Advertisement[]): Advertisement {
  if (ads.length === 1) return ads[0];

  // Calculate CTR for each ad (with minimum to avoid zero weight)
  const weights = ads.map(ad => {
    const ctr = ad.impressions > 0 ? ad.clicks / ad.impressions : 0.01;
    return Math.max(ctr, 0.01); // Minimum 1% weight
  });

  // Calculate total weight
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  // Generate random number
  let random = Math.random() * totalWeight;

  // Select ad based on weight
  for (let i = 0; i < ads.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return ads[i];
    }
  }

  // Fallback (shouldn't reach here)
  return ads[0];
}

/**
 * Track ad impression (when ad is viewed)
 */
export async function recordAdImpression(adId: string): Promise<void> {
  // Track in database
  await trackAdImpression(adId);

  // Track locally to avoid duplicate counting
  const impressionKey = `ad_impression_${adId}`;
  const lastImpression = sessionStorage.getItem(impressionKey);
  const now = Date.now();

  // Only count one impression per ad per session (more accurate)
  if (!lastImpression || now - parseInt(lastImpression) > 60000) {
    sessionStorage.setItem(impressionKey, now.toString());
  }
}

/**
 * Track ad click (when ad is clicked)
 */
export async function recordAdClick(
  adId: string,
  targetUrl: string
): Promise<void> {
  // Track in database
  await trackAdClick(adId);

  // Track locally
  const clickKey = `ad_click_${adId}`;
  sessionStorage.setItem(clickKey, Date.now().toString());

  // Open ad URL
  window.open(targetUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Check if user should see ads (based on premium status)
 */
export function shouldShowAds(userPremiumStatus?: 'free' | 'premium'): boolean {
  // Premium users don't see ads
  if (userPremiumStatus === 'premium') {
    return false;
  }

  // Check if user has opted out via cookie consent
  try {
    const consent = localStorage.getItem('bitcoin_investments_cookie_consent');
    if (consent) {
      const prefs = JSON.parse(consent);
      // If user declined marketing cookies, don't show ads
      if (prefs.marketing === false) {
        return false;
      }
    }
  } catch (err) {
    console.error('Error checking cookie consent:', err);
  }

  return true;
}

/**
 * Get ad zones configuration
 */
export const AD_ZONES = {
  banner: {
    name: 'Banner',
    description: 'Top banner (728x90 or 970x90)',
    maxWidth: 970,
    maxHeight: 90,
  },
  sidebar: {
    name: 'Sidebar',
    description: 'Right sidebar (300x250 or 300x600)',
    maxWidth: 300,
    maxHeight: 600,
  },
  native: {
    name: 'Native',
    description: 'In-content native ads (flexible size)',
    maxWidth: 600,
    maxHeight: 400,
  },
  popup: {
    name: 'Popup/Modal',
    description: 'Popup or modal ads (550x480)',
    maxWidth: 550,
    maxHeight: 480,
  },
} as const;

/**
 * Clear shown ads cache (useful for testing or page navigation)
 */
export function clearAdCache(): void {
  shownAdsCache.clear();
}
