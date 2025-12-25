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
    tier: 'free' as const,
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
    tier: 'premium' as const,
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
    tier: 'premium' as const,
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
  advisor: {
    id: 'advisor',
    name: 'Advisor',
    price: 49,
    interval: 'month',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_ADVISOR || 'price_advisor_placeholder',
    tier: 'advisor' as const,
    targetAudience: 'Financial advisors & small teams',
    features: [
      '✨ Everything in Premium, plus:',
      '👥 Up to 10 client portfolios',
      '📄 White-label PDF reports',
      '📊 Client dashboard',
      '🔐 Compliance-ready exports',
      '📧 Client email reports',
      '🎨 Custom branding (basic)',
      '📞 Priority phone support',
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
    targetAudience: 'Wealth managers & institutions',
    features: [
      '✨ Everything in Advisor, plus:',
      '👥 Unlimited client portfolios',
      '🏢 Multi-user team access',
      '📄 Fully custom white-label reports',
      '📊 Advanced compliance features',
      '🔗 API access',
      '🎨 Full custom branding',
      '👤 Dedicated account manager',
      '📈 Bulk import/export',
      '🔒 Enhanced security (SSO)',
    ],
    popular: true,
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime Premium',
    price: 299,
    originalPrice: 499,
    interval: 'lifetime',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_LIFETIME || 'price_lifetime_placeholder',
    tier: 'lifetime' as const,
    isOneTime: true,
    limitedOffer: true,
    maxPurchases: 500,
    savings: '40% off',
    features: [
      '⭐ Lifetime access to ALL Premium features',
      '💰 One-time payment - never pay again',
      '🚫 Ad-free experience forever',
      '💾 Unlimited cloud portfolio sync',
      '📊 Unlimited watchlist items',
      '📈 Premium research reports',
      '📄 All export formats (PDF, Excel, Tax)',
      '🔔 Unlimited price alerts',
      '📧 Monthly performance reports',
      '🧮 Advanced calculator features',
      '⚡ Priority support',
      '🎁 All future premium features included',
    ],
    popular: false,
    badge: 'Best Value',
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
 * Calculate lifetime deal savings
 */
export function calculateLifetimeSavings(): {
  lifetimePrice: number;
  originalPrice: number;
  savings: number;
  savingsPercentage: number;
  yearsToBreakEven: number;
  monthlyEquivalentCost: number;
} {
  const lifetimePrice = SUBSCRIPTION_TIERS.lifetime.price;
  const originalPrice = SUBSCRIPTION_TIERS.lifetime.originalPrice;
  const annualPrice = SUBSCRIPTION_TIERS.annual.price;

  // Calculate break-even compared to annual subscription
  const yearsToBreakEven = lifetimePrice / annualPrice;

  // If user stays for 5 years, what's the monthly equivalent cost
  const monthlyEquivalentCost = lifetimePrice / (5 * 12);

  // Savings vs original price
  const savings = originalPrice - lifetimePrice;
  const savingsPercentage = (savings / originalPrice) * 100;

  return {
    lifetimePrice,
    originalPrice,
    savings,
    savingsPercentage,
    yearsToBreakEven: Math.round(yearsToBreakEven * 10) / 10,
    monthlyEquivalentCost: Math.round(monthlyEquivalentCost * 100) / 100,
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
        mode: 'payment', // One-time payment instead of subscription
        metadata: {
          type: 'lifetime',
          tier: 'lifetime',
        },
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
