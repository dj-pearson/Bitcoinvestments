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
 */
export const SUBSCRIPTION_TIERS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'forever',
    stripePriceId: null,
    features: [
      'Access to all educational content',
      'Basic calculators (DCA, Tax, Fees, Staking)',
      'Live crypto prices and news',
      'Portfolio tracker (local storage)',
      'Platform comparisons',
      'Community access',
    ],
    limitations: [
      'Ads displayed',
      'Basic portfolio features',
      'No priority support',
    ],
  },
  monthly: {
    id: 'monthly',
    name: 'Premium Monthly',
    price: 9.99,
    interval: 'month',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_MONTHLY || 'price_monthly_placeholder',
    features: [
      '✨ Everything in Free, plus:',
      '🚫 Ad-free experience',
      '💾 Cloud portfolio sync',
      '🔔 Email price alerts',
      '📊 Advanced analytics',
      '📈 Premium market insights',
      '⚡ Priority support',
      '🎁 Exclusive deals from partners',
      '📚 Premium research reports',
    ],
    popular: false,
  },
  annual: {
    id: 'annual',
    name: 'Premium Annual',
    price: 99.99,
    interval: 'year',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_ANNUAL || 'price_annual_placeholder',
    savings: '17% off',
    monthlyEquivalent: 8.33,
    features: [
      '✨ Everything in Premium Monthly, plus:',
      '💰 Save $20/year (17% off)',
      '🎓 Exclusive annual webinars',
      '📖 Year-end crypto tax guide',
      '🏆 VIP community badge',
      '🎯 Personalized portfolio review',
    ],
    popular: true,
  },
} as const;

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
 */
export async function createCustomerPortalSession(
  customerId: string,
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
        returnUrl,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create portal session');
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
 */
export function hasPremiumAccess(
  subscriptionStatus?: 'free' | 'premium',
  subscriptionExpiresAt?: string | null
): boolean {
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
