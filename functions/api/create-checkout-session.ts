/**
 * Cloudflare Workers API: Create Stripe Checkout Session
 *
 * This function creates a Stripe Checkout session for subscriptions and one-time purchases.
 * It's called from the frontend when a user clicks "Subscribe" or "Purchase" on the pricing page.
 *
 * Supports:
 * - Recurring subscriptions: monthly, annual, advisor, enterprise
 * - One-time purchases: lifetime deal
 *
 * SECURITY:
 * - Validates price ID against whitelist of configured prices
 * - Validates all input data
 * - Uses proper CORS with origin validation
 */

import Stripe from 'stripe';
import {
  parseAndValidateBody,
  validateEmail,
  validateUuid,
  validateStripePriceId,
  validateUrl,
  jsonError,
  jsonSuccess,
} from '../lib/validation';
import { getCorsHeaders, handleCorsPreflightRequest, ALLOWED_ORIGINS } from './_cors';

interface Env {
  STRIPE_SECRET_KEY: string;
  // Individual plan prices
  VITE_STRIPE_PRICE_MONTHLY: string;
  VITE_STRIPE_PRICE_ANNUAL: string;
  VITE_STRIPE_PRICE_LIFETIME: string;
  // Business plan prices
  VITE_STRIPE_PRICE_ADVISOR: string;
  VITE_STRIPE_PRICE_ENTERPRISE: string;
}

interface CheckoutRequest {
  priceId: string;
  userId: string;
  userEmail: string;
  successUrl?: string;
  cancelUrl?: string;
  mode?: 'subscription' | 'payment';
  metadata?: Record<string, string>;
}

/**
 * Build a map of valid price IDs with their checkout modes
 */
function buildValidPricesMap(env: Env): Record<string, { mode: 'subscription' | 'payment'; productType?: string }> {
  const map: Record<string, { mode: 'subscription' | 'payment'; productType?: string }> = {};

  // Subscription prices
  if (env.VITE_STRIPE_PRICE_MONTHLY) {
    map[env.VITE_STRIPE_PRICE_MONTHLY] = { mode: 'subscription' };
  }
  if (env.VITE_STRIPE_PRICE_ANNUAL) {
    map[env.VITE_STRIPE_PRICE_ANNUAL] = { mode: 'subscription' };
  }
  if (env.VITE_STRIPE_PRICE_ADVISOR) {
    map[env.VITE_STRIPE_PRICE_ADVISOR] = { mode: 'subscription' };
  }
  if (env.VITE_STRIPE_PRICE_ENTERPRISE) {
    map[env.VITE_STRIPE_PRICE_ENTERPRISE] = { mode: 'subscription' };
  }

  // One-time payment prices
  if (env.VITE_STRIPE_PRICE_LIFETIME) {
    map[env.VITE_STRIPE_PRICE_LIFETIME] = { mode: 'payment', productType: 'lifetime' };
  }

  return map;
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
      ['priceId', 'userId', 'userEmail']
    );

    if (parseError || !body) {
      return addCorsHeaders(jsonError(parseError || 'Invalid request body', 400));
    }

    const { priceId, userId, userEmail, successUrl, cancelUrl, mode: requestedMode, metadata } = body;

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

    // Build valid prices map
    const validPricesMap = buildValidPricesMap(context.env);
    const validPriceIds = Object.keys(validPricesMap);

    // Validate price ID (must be one of our configured prices)
    const priceValidation = validateStripePriceId(priceId, validPriceIds);
    if (!priceValidation.isValid) {
      return addCorsHeaders(jsonError(priceValidation.error || 'Invalid price ID', 400));
    }

    // Get the checkout mode for this price
    const priceConfig = validPricesMap[priceId];
    const checkoutMode = requestedMode || priceConfig.mode;

    // Initialize Stripe
    const stripe = new Stripe(context.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });

    // SECURITY: Validate origin for redirect URLs
    const requestOrigin = context.request.headers.get('Origin');
    const origin = requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)
      ? requestOrigin
      : ALLOWED_ORIGINS[0];

    // Validate optional URLs if provided
    let validatedSuccessUrl = `${origin}/profile?session_id={CHECKOUT_SESSION_ID}`;
    if (successUrl) {
      const successUrlValidation = validateUrl(successUrl, { requireHttps: true });
      if (!successUrlValidation.isValid) {
        return addCorsHeaders(jsonError('Invalid success URL', 400));
      }
      validatedSuccessUrl = successUrl;
    }

    let validatedCancelUrl = `${origin}/pricing`;
    if (cancelUrl) {
      const cancelUrlValidation = validateUrl(cancelUrl, { requireHttps: true });
      if (!cancelUrlValidation.isValid) {
        return addCorsHeaders(jsonError('Invalid cancel URL', 400));
      }
      validatedCancelUrl = cancelUrl;
    }

    // Build session metadata
    const sessionMetadata: Record<string, string> = {
      userId: userId,
      ...metadata,
    };

    // Add product type for one-time purchases
    if (priceConfig.productType) {
      sessionMetadata.productType = priceConfig.productType;
      sessionMetadata.type = priceConfig.productType;
    }

    // Create base session config
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer_email: userEmail.trim().toLowerCase(),
      client_reference_id: userId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: checkoutMode,
      success_url: validatedSuccessUrl,
      cancel_url: validatedCancelUrl,
      metadata: sessionMetadata,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      tax_id_collection: {
        enabled: true,
      },
    };

    // Add subscription-specific options for recurring purchases
    if (checkoutMode === 'subscription') {
      sessionConfig.subscription_data = {
        metadata: {
          userId: userId,
        },
      };
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    return addCorsHeaders(jsonSuccess({
      sessionId: session.id,
      url: session.url,
    }));
  } catch (error) {
    console.error('Error creating checkout session:', error);

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
