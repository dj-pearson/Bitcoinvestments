/**
 * Cloudflare Workers API: Create Stripe Checkout Session
 *
 * This function creates a Stripe Checkout session for premium subscriptions.
 * It's called from the frontend when a user clicks "Subscribe" on the pricing page.
 * Includes comprehensive input validation and sanitization.
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

interface Env {
  STRIPE_SECRET_KEY: string;
  VITE_STRIPE_PRICE_MONTHLY: string;
  VITE_STRIPE_PRICE_ANNUAL: string;
}

interface CheckoutRequest {
  priceId: string;
  userId: string;
  userEmail: string;
  successUrl?: string;
  cancelUrl?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Parse and validate request body
    const { data: body, error: parseError } = await parseAndValidateBody<CheckoutRequest>(
      context.request,
      ['priceId', 'userId', 'userEmail']
    );

    if (parseError || !body) {
      return jsonError(parseError || 'Invalid request body', 400);
    }

    const { priceId, userId, userEmail, successUrl, cancelUrl } = body;

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

    // Initialize Stripe
    const stripe = new Stripe(context.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });

    // Validate price ID (must be one of our configured prices)
    const validPriceIds = [
      context.env.VITE_STRIPE_PRICE_MONTHLY,
      context.env.VITE_STRIPE_PRICE_ANNUAL,
    ].filter(Boolean);

    const priceValidation = validateStripePriceId(priceId, validPriceIds);
    if (!priceValidation.isValid) {
      return jsonError(priceValidation.error || 'Invalid price ID', 400);
    }

    // Validate optional URLs if provided
    const requestOrigin = new URL(context.request.url).origin;

    let validatedSuccessUrl = `${requestOrigin}/profile?session_id={CHECKOUT_SESSION_ID}`;
    if (successUrl) {
      const successUrlValidation = validateUrl(successUrl, { requireHttps: true });
      if (!successUrlValidation.isValid) {
        return jsonError('Invalid success URL', 400);
      }
      validatedSuccessUrl = successUrl;
    }

    let validatedCancelUrl = `${requestOrigin}/pricing`;
    if (cancelUrl) {
      const cancelUrlValidation = validateUrl(cancelUrl, { requireHttps: true });
      if (!cancelUrlValidation.isValid) {
        return jsonError('Invalid cancel URL', 400);
      }
      validatedCancelUrl = cancelUrl;
    }

    // Create Checkout Session
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
      success_url: validatedSuccessUrl,
      cancel_url: validatedCancelUrl,
      metadata: {
        userId: userId,
      },
      subscription_data: {
        metadata: {
          userId: userId,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      tax_id_collection: {
        enabled: true,
      },
    });

    return jsonSuccess({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);

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
