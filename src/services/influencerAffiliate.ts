/**
 * Influencer Affiliate Program Service
 *
 * Allows crypto YouTubers, bloggers, and content creators to earn commission
 * by referring new users to the platform.
 *
 * Revenue Share: 20-30% of subscription revenue from referred users
 * Cookie Duration: 60 days
 */

export interface InfluencerProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  platform: 'youtube' | 'twitter' | 'blog' | 'podcast' | 'instagram' | 'tiktok' | 'other';
  platform_url: string;
  followers_count?: number;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  tier: 'standard' | 'premium' | 'elite';
  commission_rate: number; // 20-30%
  affiliate_code: string;
  created_at: string;
  approved_at?: string;
  total_referrals: number;
  total_conversions: number;
  total_earnings: number;
  pending_payout: number;
  payout_method?: 'paypal' | 'bank' | 'crypto';
  payout_details?: string;
}

export interface ReferralTracking {
  id: string;
  influencer_id: string;
  referred_user_id?: string;
  session_id: string;
  landing_page: string;
  source_url?: string;
  clicked_at: string;
  signed_up_at?: string;
  converted_at?: string;
  subscription_type?: 'monthly' | 'annual' | 'advisor' | 'enterprise';
  commission_amount?: number;
  commission_status: 'pending' | 'approved' | 'paid' | 'rejected';
}

export interface PayoutRequest {
  id: string;
  influencer_id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  payout_method: 'paypal' | 'bank' | 'crypto';
  payout_details: string;
  requested_at: string;
  processed_at?: string;
  transaction_id?: string;
}

// Commission tiers based on performance
export const INFLUENCER_TIERS = {
  standard: {
    name: 'Standard',
    commission_rate: 0.20, // 20%
    min_referrals: 0,
    benefits: [
      '20% revenue share',
      'Basic analytics dashboard',
      'Monthly payouts (min $50)',
      'Custom affiliate link',
    ],
  },
  premium: {
    name: 'Premium',
    commission_rate: 0.25, // 25%
    min_referrals: 25,
    benefits: [
      '25% revenue share',
      'Advanced analytics',
      'Bi-weekly payouts (min $25)',
      'Custom promo codes',
      'Priority support',
    ],
  },
  elite: {
    name: 'Elite',
    commission_rate: 0.30, // 30%
    min_referrals: 100,
    benefits: [
      '30% revenue share',
      'Real-time analytics',
      'Weekly payouts (no minimum)',
      'Dedicated account manager',
      'Co-branded content opportunities',
      'Early access to features',
    ],
  },
} as const;

// Subscription values for commission calculation
export const SUBSCRIPTION_VALUES = {
  monthly: 9.99,
  annual: 99.99 / 12, // Monthly equivalent
  advisor: 49,
  enterprise: 99,
} as const;

// Cookie duration in days
export const AFFILIATE_COOKIE_DURATION = 60;

const INFLUENCER_STORAGE_KEY = 'bitcoin_investments_influencer_ref';

/**
 * Generate unique affiliate code
 */
export function generateAffiliateCode(name: string): string {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${cleanName}${randomSuffix}`;
}

/**
 * Track affiliate click from influencer link
 */
export function trackInfluencerClick(
  affiliateCode: string,
  landingPage: string = window.location.pathname
): void {
  if (typeof window === 'undefined') return;

  const clickData = {
    affiliate_code: affiliateCode,
    session_id: getOrCreateSessionId(),
    landing_page: landingPage,
    source_url: document.referrer || undefined,
    clicked_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + AFFILIATE_COOKIE_DURATION * 24 * 60 * 60 * 1000).toISOString(),
  };

  // Store in localStorage for persistence
  localStorage.setItem(INFLUENCER_STORAGE_KEY, JSON.stringify(clickData));

  // Also set a cookie for cross-domain tracking
  document.cookie = `inf_ref=${affiliateCode}; max-age=${AFFILIATE_COOKIE_DURATION * 24 * 60 * 60}; path=/; SameSite=Lax`;

  // In production, also send to server
  sendClickToServer(clickData);
}

/**
 * Get current referral attribution
 */
export function getAffiliateAttribution(): { affiliateCode: string; sessionId: string } | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(INFLUENCER_STORAGE_KEY);
  if (!stored) return null;

  try {
    const data = JSON.parse(stored);

    // Check if attribution has expired
    if (new Date(data.expires_at) < new Date()) {
      localStorage.removeItem(INFLUENCER_STORAGE_KEY);
      return null;
    }

    return {
      affiliateCode: data.affiliate_code,
      sessionId: data.session_id,
    };
  } catch {
    return null;
  }
}

/**
 * Clear affiliate attribution (after conversion)
 */
export function clearAffiliateAttribution(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(INFLUENCER_STORAGE_KEY);
  document.cookie = 'inf_ref=; max-age=0; path=/';
}

/**
 * Calculate commission for a subscription
 */
export function calculateCommission(
  subscriptionType: keyof typeof SUBSCRIPTION_VALUES,
  commissionRate: number
): number {
  const subscriptionValue = SUBSCRIPTION_VALUES[subscriptionType];
  return Number((subscriptionValue * commissionRate).toFixed(2));
}

/**
 * Get tier based on referral count
 */
export function getTierForReferrals(totalReferrals: number): keyof typeof INFLUENCER_TIERS {
  if (totalReferrals >= INFLUENCER_TIERS.elite.min_referrals) {
    return 'elite';
  }
  if (totalReferrals >= INFLUENCER_TIERS.premium.min_referrals) {
    return 'premium';
  }
  return 'standard';
}

/**
 * Generate affiliate link
 */
export function generateAffiliateLink(affiliateCode: string, campaign?: string): string {
  const baseUrl = window.location.origin;
  const params = new URLSearchParams({ ref: affiliateCode });
  if (campaign) {
    params.set('utm_campaign', campaign);
  }
  params.set('utm_source', 'influencer');
  params.set('utm_medium', 'affiliate');
  return `${baseUrl}/?${params.toString()}`;
}

/**
 * Parse affiliate code from URL
 */
export function parseAffiliateCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  return params.get('ref') || null;
}

// Helper functions
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem('inf_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('inf_session_id', sessionId);
  }
  return sessionId;
}

async function sendClickToServer(clickData: Record<string, unknown>): Promise<void> {
  // In production, this would send to your API
  console.log('Influencer affiliate click tracked:', clickData);
  // await supabase.from('influencer_referrals').insert(clickData);
}

/**
 * Application form data
 */
export interface InfluencerApplication {
  name: string;
  email: string;
  platform: InfluencerProfile['platform'];
  platform_url: string;
  followers_count: number;
  content_description: string;
  why_join: string;
  agreed_to_terms: boolean;
}

/**
 * Validate influencer application
 */
export function validateApplication(app: InfluencerApplication): string[] {
  const errors: string[] = [];

  if (!app.name || app.name.length < 2) {
    errors.push('Name is required');
  }

  if (!app.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(app.email)) {
    errors.push('Valid email is required');
  }

  if (!app.platform_url || !app.platform_url.startsWith('http')) {
    errors.push('Valid platform URL is required');
  }

  if (app.followers_count < 100) {
    errors.push('Minimum 100 followers required');
  }

  if (!app.content_description || app.content_description.length < 50) {
    errors.push('Please provide more details about your content (min 50 characters)');
  }

  if (!app.agreed_to_terms) {
    errors.push('You must agree to the terms and conditions');
  }

  return errors;
}

/**
 * Format earnings for display
 */
export function formatEarnings(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Get conversion rate
 */
export function getConversionRate(referrals: number, conversions: number): string {
  if (referrals === 0) return '0%';
  return `${((conversions / referrals) * 100).toFixed(1)}%`;
}
