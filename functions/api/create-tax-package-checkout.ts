/**
 * Cloudflare Pages Function: Create Tax Package Checkout Session
 *
 * Creates a Stripe checkout session for one-time tax package purchases.
 *
 * SECURITY:
 * - Validates priceId against whitelist of configured tax package prices
 * - Validates packageType matches the priceId
 * - Sanitizes all input data
 * - Uses secure origin validation for redirects
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
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  VITE_STRIPE_TAX_PACKAGE_BASIC: string;
  VITE_STRIPE_TAX_PACKAGE_PREMIUM: string;
}

interface RequestBody {
  priceId: string;
  userId: string;
  userEmail?: string;
  packageType: 'basic' | 'premium';
  taxYear: number;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Get CORS headers for this request
  const corsHeaders = getCorsHeaders(request);

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
    const { data: body, error: parseError } = await parseAndValidateBody<RequestBody>(
      request,
      ['priceId', 'userId', 'packageType', 'taxYear']
    );

    if (parseError || !body) {
      return addCorsHeaders(jsonError(parseError || 'Invalid request body', 400));
    }

    const { priceId, userId, userEmail, packageType, taxYear } = body;

    // Validate userId (must be a UUID)
    const userIdValidation = validateUuid(userId, 'User ID');
    if (!userIdValidation.isValid) {
      return addCorsHeaders(jsonError(userIdValidation.error || 'Invalid user ID', 400));
    }

    // Validate packageType
    if (!['basic', 'premium'].includes(packageType)) {
      return addCorsHeaders(jsonError('Invalid package type. Must be "basic" or "premium"', 400));
    }

    // Validate taxYear (must be a reasonable year)
    const currentYear = new Date().getFullYear();
    if (typeof taxYear !== 'number' || taxYear < 2020 || taxYear > currentYear + 1) {
      return addCorsHeaders(jsonError('Invalid tax year', 400));
    }

    // Validate email if provided
    if (userEmail) {
      const emailValidation = validateEmail(userEmail);
      if (!emailValidation.isValid) {
        return addCorsHeaders(jsonError(emailValidation.error || 'Invalid email', 400));
      }
    }

    // Check if Stripe is configured
    if (!env.STRIPE_SECRET_KEY) {
      return addCorsHeaders(jsonError('Stripe is not configured', 500));
    }

    // Build list of valid tax package price IDs
    const validPriceIds: string[] = [];
    const priceToPackageMap: Record<string, 'basic' | 'premium'> = {};

    if (env.VITE_STRIPE_TAX_PACKAGE_BASIC) {
      validPriceIds.push(env.VITE_STRIPE_TAX_PACKAGE_BASIC);
      priceToPackageMap[env.VITE_STRIPE_TAX_PACKAGE_BASIC] = 'basic';
    }
    if (env.VITE_STRIPE_TAX_PACKAGE_PREMIUM) {
      validPriceIds.push(env.VITE_STRIPE_TAX_PACKAGE_PREMIUM);
      priceToPackageMap[env.VITE_STRIPE_TAX_PACKAGE_PREMIUM] = 'premium';
    }

    // Validate priceId against whitelist
    const priceValidation = validateStripePriceId(priceId, validPriceIds);
    if (!priceValidation.isValid) {
      return addCorsHeaders(jsonError(priceValidation.error || 'Invalid price ID', 400));
    }

    // SECURITY: Verify packageType matches the priceId to prevent price manipulation
    const expectedPackageType = priceToPackageMap[priceId];
    if (expectedPackageType && expectedPackageType !== packageType) {
      console.error(`Security: Price ID ${priceId} is for ${expectedPackageType} but ${packageType} was requested`);
      return addCorsHeaders(jsonError('Package type does not match price ID', 400));
    }

    // Initialize Stripe with consistent API version
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });

    // SECURITY: Validate origin against allowed list to prevent open redirect attacks
    const requestOrigin = request.headers.get('Origin');
    const origin = requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)
      ? requestOrigin
      : ALLOWED_ORIGINS[0];

    // Create Stripe checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // One-time payment, not subscription
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: userEmail?.trim().toLowerCase(),
      client_reference_id: userId,
      metadata: {
        userId,
        packageType,
        taxYear: String(taxYear),
        productType: 'tax_report_package',
      },
      success_url: `${origin}/profile?tax_purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?tab=tax`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    return addCorsHeaders(jsonSuccess({
      sessionId: session.id,
      url: session.url,
    }));
  } catch (error) {
    console.error('Error creating tax package checkout session:', error);

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
