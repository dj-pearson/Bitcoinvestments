/**
 * Stripe Payment Service
 *
 * Handles subscription management, checkout, and payment processing
 * for premium memberships.
 *
 * Setup required:
 * 1. Sign up at https://stripe.com
 * 2. Get API keys from dashboard
 * 3. Add VITE_STRIPE_PUBLISHABLE_KEY to .env
 * 4. Create products and prices in Stripe dashboard
 */

import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get Stripe instance (singleton pattern)
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    if (!STRIPE_PUBLISHABLE_KEY) {
      console.warn('Stripe not configured. Set VITE_STRIPE_PUBLISHABLE_KEY in .env');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return Boolean(STRIPE_PUBLISHABLE_KEY);
}

/**
 * Subscription tiers configuration
 *
 * Feature lists name only things the code actually gates for paid tiers
 * (see TIER_LIMITS in subscriptionLimits.ts and the pages that read it). Do
 * not add features here until they exist - these strings are shown to buyers.
 * NEEDS-OWNER: confirm the final Premium feature list and prices before launch.
 */
export const SUBSCRIPTION_TIERS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'forever',
    stripePriceId: null,
    tier: 'free' as const,
    features: [
      'All guides, the beginner course and the glossary',
      'All calculators (DCA, fees, tax, staking, retirement, backtesting)',
      'Exchange and wallet comparisons',
      'Scam database search',
      'Market dashboard with current prices',
      'Portfolio tracker saved in your browser',
    ],
  },
  monthly: {
    id: 'monthly',
    name: 'Premium Monthly',
    price: 9.99,
    interval: 'month',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_MONTHLY || 'price_monthly_placeholder',
    tier: 'premium' as const,
    features: [
      'Portfolio saved to your account',
      'Unlimited portfolio assets (free accounts: 10)',
      'Unlimited price alerts (free accounts: 3)',
      'Tax report exports',
    ],
    popular: false,
  },
  annual: {
    id: 'annual',
    name: 'Premium Annual',
    price: 99.99,
    interval: 'year',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_ANNUAL || 'price_annual_placeholder',
    tier: 'premium' as const,
    monthlyEquivalent: 8.33,
    features: [
      'Everything in Premium Monthly',
      'Billed once a year for a lower effective monthly price',
    ],
    popular: true,
  },
  advisor: {
    id: 'advisor',
    name: 'Advisor',
    price: 49,
    interval: 'month',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_ADVISOR || 'price_advisor_placeholder',
    tier: 'advisor' as const,
    targetAudience: 'Financial advisers',
    features: [
      'Everything in Premium',
      'Advisor dashboard with up to 10 client portfolios',
    ],
    popular: false,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    interval: 'month',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE || 'price_enterprise_placeholder',
    tier: 'enterprise' as const,
    targetAudience: 'Firms managing many clients',
    features: [
      'Everything in Advisor',
      'Unlimited client portfolios',
    ],
    popular: false,
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime Premium',
    price: 299,
    interval: 'lifetime',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_LIFETIME || 'price_lifetime_placeholder',
    tier: 'lifetime' as const,
    isOneTime: true,
    features: [
      'Everything in Premium Monthly',
      'One payment instead of a subscription',
    ],
    popular: false,
  },
} as const;

/**
 * A plan can be sold only when its Stripe price ID is configured for this
 * build. Placeholder IDs mean "not set up" and must never reach checkout.
 */
export function isPlanPurchasable(tierId: SubscriptionTierId): boolean {
  const priceId = SUBSCRIPTION_TIERS[tierId].stripePriceId;
  return Boolean(priceId) && !String(priceId).endsWith('_placeholder');
}

export type SubscriptionTierId = keyof typeof SUBSCRIPTION_TIERS;

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(
  priceId: string,
  userId: string,
  userEmail: string,
  successUrl: string = window.location.origin + '/profile?session_id={CHECKOUT_SESSION_ID}',
  cancelUrl: string = window.location.origin + '/pricing'
): Promise<{ sessionId: string | null; url: string | null; error: string | null }> {
  try {
    // Call your backend API to create checkout session
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userId,
        userEmail,
        successUrl,
        cancelUrl,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { sessionId, url } = await response.json();
    return { sessionId, url, error: null };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      sessionId: null,
      url: null,
      error: error instanceof Error ? error.message : 'Failed to start checkout',
    };
  }
}

/**
 * Redirect to Stripe Checkout
 */
export async function redirectToCheckout(
  priceId: string,
  userId: string,
  userEmail: string
): Promise<{ error: string | null }> {
  // Check if Stripe is configured
  if (!isStripeConfigured()) {
    return { error: 'Stripe is not configured' };
  }

  // Create checkout session
  const { url, error } = await createCheckoutSession(priceId, userId, userEmail);

  if (error || !url) {
    return { error: error || 'Failed to create checkout session' };
  }

  // Redirect to Stripe Checkout URL
  window.location.href = url;
  return { error: null };
}

/**
 * Create customer portal session (for managing subscription)
 *
 * SECURITY: Requires both customerId and userId for backend validation
 * to ensure the requesting user owns the customer ID.
 */
export async function createCustomerPortalSession(
  customerId: string,
  userId: string,
  returnUrl: string = window.location.origin + '/profile'
): Promise<{ url: string | null; error: string | null }> {
  try {
    const response = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        userId,
        returnUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create portal session');
    }

    const { url } = await response.json();
    return { url, error: null };
  } catch (error) {
    console.error('Error creating portal session:', error);
    return {
      url: null,
      error: error instanceof Error ? error.message : 'Failed to open customer portal',
    };
  }
}

/**
 * Get subscription tier by ID
 */
export function getSubscriptionTier(tierId: SubscriptionTierId) {
  return SUBSCRIPTION_TIERS[tierId];
}

/**
 * Get subscription tier by Stripe price ID
 */
export function getSubscriptionTierByPriceId(priceId: string): SubscriptionTierId | null {
  for (const [key, tier] of Object.entries(SUBSCRIPTION_TIERS)) {
    if (tier.stripePriceId === priceId) {
      return key as SubscriptionTierId;
    }
  }
  return null;
}

/**
 * Check if user has premium access
 * Includes both recurring premium subscribers and lifetime members
 */
export function hasPremiumAccess(
  subscriptionStatus?: 'free' | 'premium' | 'lifetime' | 'advisor' | 'enterprise',
  subscriptionExpiresAt?: string | null
): boolean {
  // Lifetime members always have access (no expiration)
  if (subscriptionStatus === 'lifetime') {
    return true;
  }

  // Advisor and Enterprise also have premium access
  if (subscriptionStatus === 'advisor' || subscriptionStatus === 'enterprise') {
    // Check if subscription is still active
    if (subscriptionExpiresAt) {
      const expiresAt = new Date(subscriptionExpiresAt);
      const now = new Date();
      return expiresAt > now;
    }
    return true;
  }

  if (subscriptionStatus !== 'premium') {
    return false;
  }

  // Check if subscription is still active (not expired)
  if (subscriptionExpiresAt) {
    const expiresAt = new Date(subscriptionExpiresAt);
    const now = new Date();
    return expiresAt > now;
  }

  // If no expiry date, assume active
  return true;
}

/**
 * Check if user has lifetime access
 */
export function hasLifetimeAccess(
  subscriptionStatus?: 'free' | 'premium' | 'lifetime' | 'advisor' | 'enterprise'
): boolean {
  return subscriptionStatus === 'lifetime';
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/**
 * Calculate savings for annual plan
 */
export function calculateAnnualSavings(): {
  monthlyCost: number;
  annualCost: number;
  savings: number;
  savingsPercentage: number;
} {
  const monthlyCost = SUBSCRIPTION_TIERS.monthly.price * 12;
  const annualCost = SUBSCRIPTION_TIERS.annual.price;
  const savings = monthlyCost - annualCost;
  const savingsPercentage = (savings / monthlyCost) * 100;

  return {
    monthlyCost,
    annualCost,
    savings,
    savingsPercentage,
  };
}

/**
 * Lifetime price compared with the annual plan.
 */
export function calculateLifetimeSavings(): {
  lifetimePrice: number;
  yearsToBreakEven: number;
} {
  const lifetimePrice = SUBSCRIPTION_TIERS.lifetime.price;
  const annualPrice = SUBSCRIPTION_TIERS.annual.price;

  return {
    lifetimePrice,
    yearsToBreakEven: Math.round((lifetimePrice / annualPrice) * 10) / 10,
  };
}

/**
 * Create checkout session for lifetime deal (one-time payment)
 */
export async function createLifetimeCheckoutSession(
  userId: string,
  userEmail: string,
  successUrl: string = window.location.origin + '/profile?session_id={CHECKOUT_SESSION_ID}&lifetime=true',
  cancelUrl: string = window.location.origin + '/pricing'
): Promise<{ sessionId: string | null; url: string | null; error: string | null }> {
  const priceId = SUBSCRIPTION_TIERS.lifetime.stripePriceId;

  if (!priceId || priceId === 'price_lifetime_placeholder') {
    return {
      sessionId: null,
      url: null,
      error: 'Lifetime deal is not configured. Please contact support.',
    };
  }

  try {
    // Call backend API to create one-time checkout session
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userId,
        userEmail,
        successUrl,
        cancelUrl,
        // The server derives mode ('payment') and product type from the price ID.
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { sessionId, url } = await response.json();
    return { sessionId, url, error: null };
  } catch (error) {
    console.error('Error creating lifetime checkout session:', error);
    return {
      sessionId: null,
      url: null,
      error: error instanceof Error ? error.message : 'Failed to start checkout',
    };
  }
}

/**
 * Redirect to lifetime checkout
 */
export async function redirectToLifetimeCheckout(
  userId: string,
  userEmail: string
): Promise<{ error: string | null }> {
  if (!isStripeConfigured()) {
    return { error: 'Stripe is not configured' };
  }

  const { url, error } = await createLifetimeCheckoutSession(userId, userEmail);

  if (error || !url) {
    return { error: error || 'Failed to create checkout session' };
  }

  window.location.href = url;
  return { error: null };
}

/**
 * Get all available subscription plans for display
 */
export function getDisplayPlans(): {
  individual: typeof SUBSCRIPTION_TIERS[keyof Pick<typeof SUBSCRIPTION_TIERS, 'free' | 'monthly' | 'annual' | 'lifetime'>][];
  professional: typeof SUBSCRIPTION_TIERS[keyof Pick<typeof SUBSCRIPTION_TIERS, 'advisor' | 'enterprise'>][];
} {
  return {
    individual: [
      SUBSCRIPTION_TIERS.free,
      SUBSCRIPTION_TIERS.monthly,
      SUBSCRIPTION_TIERS.annual,
      SUBSCRIPTION_TIERS.lifetime,
    ],
    professional: [
      SUBSCRIPTION_TIERS.advisor,
      SUBSCRIPTION_TIERS.enterprise,
    ],
  };
}
