/**
 * Cloudflare Workers API: Create API Tier Checkout Session
 *
 * This function creates a Stripe Checkout session for developer API subscriptions.
 *
 * SECURITY:
 * - Uses environment variables for all price IDs (not hardcoded)
 * - Validates tier and billing cycle against allowed values
 * - Uses proper CORS with origin validation
 * - Sanitizes all input data
 */

import Stripe from 'stripe';
import {
  parseAndValidateBody,
  validateEmail,
  validateUuid,
  validateStripePriceId,
  jsonError,
  jsonSuccess,
} from '../lib/validation';
import { getCorsHeaders, handleCorsPreflightRequest, ALLOWED_ORIGINS } from './_cors';

interface Env {
  STRIPE_SECRET_KEY: string;
  VITE_STRIPE_API_STARTER_MONTHLY: string;
  VITE_STRIPE_API_STARTER_YEARLY: string;
  VITE_STRIPE_API_PROFESSIONAL_MONTHLY: string;
  VITE_STRIPE_API_PROFESSIONAL_YEARLY: string;
}

interface CheckoutRequest {
  userId: string;
  userEmail: string;
  tier: string;
  billingCycle: 'monthly' | 'yearly';
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  // Get CORS headers for this request
  const corsHeaders = getCorsHeaders(context.request);

  // Helper to add CORS headers to responses
  const addCorsHeaders = (response: Response): Response => {
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };

  try {
    // Parse and validate request body
    const { data: body, error: parseError } = await parseAndValidateBody<CheckoutRequest>(
      context.request,
      ['userId', 'userEmail', 'tier', 'billingCycle']
    );

    if (parseError || !body) {
      return addCorsHeaders(jsonError(parseError || 'Invalid request body', 400));
    }

    const { userId, userEmail, tier, billingCycle } = body;

    // Validate user email
    const emailValidation = validateEmail(userEmail);
    if (!emailValidation.isValid) {
      return addCorsHeaders(jsonError(emailValidation.error || 'Invalid email', 400));
    }

    // Validate user ID (should be a UUID)
    const userIdValidation = validateUuid(userId, 'User ID');
    if (!userIdValidation.isValid) {
      return addCorsHeaders(jsonError(userIdValidation.error || 'Invalid user ID', 400));
    }

    // Validate tier
    const validTiers = ['starter', 'professional', 'enterprise'];
    if (!validTiers.includes(tier)) {
      return addCorsHeaders(jsonError('Invalid API tier', 400));
    }

    // Validate billing cycle
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return addCorsHeaders(jsonError('Invalid billing cycle. Must be "monthly" or "yearly"', 400));
    }

    // For enterprise tier, redirect to contact sales
    if (tier === 'enterprise') {
      const requestOrigin = context.request.headers.get('Origin');
      const origin = requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)
        ? requestOrigin
        : ALLOWED_ORIGINS[0];

      return addCorsHeaders(jsonSuccess({
        sessionId: null,
        url: `${origin}/contact?plan=enterprise-api`,
        isContactSales: true,
      }));
    }

    // Build price ID map from environment variables
    const apiTierPrices: Record<string, { monthly: string; yearly: string }> = {
      starter: {
        monthly: context.env.VITE_STRIPE_API_STARTER_MONTHLY || '',
        yearly: context.env.VITE_STRIPE_API_STARTER_YEARLY || '',
      },
      professional: {
        monthly: context.env.VITE_STRIPE_API_PROFESSIONAL_MONTHLY || '',
        yearly: context.env.VITE_STRIPE_API_PROFESSIONAL_YEARLY || '',
      },
    };

    // Get the correct price ID based on tier and billing cycle
    const tierPrices = apiTierPrices[tier];
    if (!tierPrices) {
      return addCorsHeaders(jsonError('Invalid tier', 400));
    }

    const priceId = billingCycle === 'yearly' ? tierPrices.yearly : tierPrices.monthly;

    // Validate that we have a price ID configured for this tier/cycle
    if (!priceId || !priceId.startsWith('price_')) {
      return addCorsHeaders(jsonError(`Price not configured for ${tier} ${billingCycle} plan`, 500));
    }

    // Initialize Stripe
    const stripe = new Stripe(context.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });

    // SECURITY: Validate origin for redirect URLs
    const requestOrigin = context.request.headers.get('Origin');
    const origin = requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)
      ? requestOrigin
      : ALLOWED_ORIGINS[0];

    const successUrl = `${origin}/developers/portal?session_id={CHECKOUT_SESSION_ID}&api_tier=${tier}`;
    const cancelUrl = `${origin}/developers/pricing`;

    // Create Checkout Session for API subscription
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail.trim().toLowerCase(),
      client_reference_id: userId,
      line_items: [
        {
          price: priceId,
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
      tax_id_collection: {
        enabled: true,
      },
    });

    return addCorsHeaders(jsonSuccess({
      sessionId: session.id,
      url: session.url,
    }));
  } catch (error) {
    console.error('Error creating API checkout session:', error);

    return addCorsHeaders(jsonError(
      error instanceof Error ? error.message : 'Failed to create checkout session',
      500
    ));
  }
};

// Handle CORS preflight
export const onRequestOptions: PagesFunction = async (context) => {
  return handleCorsPreflightRequest(context.request);
};
