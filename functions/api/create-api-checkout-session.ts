/**
 * Cloudflare Workers API: Create API Tier Checkout Session
 *
 * This function creates a Stripe Checkout session for developer API subscriptions.
 */

import Stripe from 'stripe';
import {
  parseAndValidateBody,
  validateEmail,
  validateUuid,
  jsonError,
  jsonSuccess,
} from '../lib/validation';

interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_API_STARTER: string;
  STRIPE_API_PROFESSIONAL: string;
  STRIPE_API_ENTERPRISE: string;
}

interface CheckoutRequest {
  priceId: string;
  userId: string;
  userEmail: string;
  tier: string;
  billingCycle: 'monthly' | 'yearly';
}

const API_TIER_PRICES: Record<string, { monthly: string; yearly: string }> = {
  starter: {
    monthly: 'price_api_starter_monthly',
    yearly: 'price_api_starter_yearly',
  },
  professional: {
    monthly: 'price_api_professional_monthly',
    yearly: 'price_api_professional_yearly',
  },
  enterprise: {
    monthly: 'price_api_enterprise_monthly',
    yearly: 'price_api_enterprise_yearly',
  },
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Parse and validate request body
    const { data: body, error: parseError } = await parseAndValidateBody<CheckoutRequest>(
      context.request,
      ['priceId', 'userId', 'userEmail', 'tier', 'billingCycle']
    );

    if (parseError || !body) {
      return jsonError(parseError || 'Invalid request body', 400);
    }

    const { priceId, userId, userEmail, tier, billingCycle } = body;

    // Validate user email
    const emailValidation = validateEmail(userEmail);
    if (!emailValidation.isValid) {
      return jsonError(emailValidation.error || 'Invalid email', 400);
    }

    // Validate user ID (should be a UUID)
    const userIdValidation = validateUuid(userId, 'User ID');
    if (!userIdValidation.isValid) {
      return jsonError(userIdValidation.error || 'Invalid user ID', 400);
    }

    // Validate tier
    const validTiers = ['starter', 'professional', 'enterprise'];
    if (!validTiers.includes(tier)) {
      return jsonError('Invalid API tier', 400);
    }

    // Initialize Stripe
    const stripe = new Stripe(context.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });

    // Get the correct price ID based on tier and billing cycle
    const tierPrices = API_TIER_PRICES[tier];
    const actualPriceId = billingCycle === 'yearly' ? tierPrices.yearly : tierPrices.monthly;

    // For enterprise tier, redirect to contact sales
    if (tier === 'enterprise') {
      const requestOrigin = new URL(context.request.url).origin;
      return jsonSuccess({
        sessionId: null,
        url: `${requestOrigin}/contact?plan=enterprise-api`,
        isContactSales: true,
      });
    }

    const requestOrigin = new URL(context.request.url).origin;
    const successUrl = `${requestOrigin}/developers/portal?session_id={CHECKOUT_SESSION_ID}&api_tier=${tier}`;
    const cancelUrl = `${requestOrigin}/developers/pricing`;

    // Create Checkout Session for API subscription
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail.trim().toLowerCase(),
      client_reference_id: userId,
      line_items: [
        {
          price: actualPriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId,
        subscriptionType: 'api',
        apiTier: tier,
        billingCycle: billingCycle,
      },
      subscription_data: {
        metadata: {
          userId: userId,
          subscriptionType: 'api',
          apiTier: tier,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    return jsonSuccess({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating API checkout session:', error);

    return jsonError(
      error instanceof Error ? error.message : 'Failed to create checkout session',
      500
    );
  }
};

// Handle CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
