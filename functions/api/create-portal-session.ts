/**
 * Cloudflare Workers API: Create Stripe Customer Portal Session
 *
 * This function creates a Stripe Customer Portal session for subscription management.
 * It's called from the profile page when a user clicks "Manage Subscription".
 *
 * SECURITY: Validates that the requesting user owns the Stripe customer ID
 * by checking against the Supabase database.
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import {
  parseAndValidateBody,
  validateUuid,
  validateUrl,
  jsonError,
  jsonSuccess,
} from '../lib/validation';
import { getCorsHeaders, handleCorsPreflightRequest } from './_cors';

interface Env {
  STRIPE_SECRET_KEY: string;
  VITE_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface PortalRequest {
  customerId: string;
  userId: string;
  returnUrl?: string;
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
    const { data: body, error: parseError } = await parseAndValidateBody<PortalRequest>(
      context.request,
      ['customerId', 'userId']
    );

    if (parseError || !body) {
      return addCorsHeaders(jsonError(parseError || 'Invalid request body', 400));
    }

    const { customerId, userId, returnUrl } = body;

    // Validate customerId format (Stripe customer IDs start with 'cus_')
    if (!customerId.startsWith('cus_') || customerId.length < 10) {
      return addCorsHeaders(jsonError('Invalid customer ID format', 400));
    }

    // Validate userId (must be a UUID)
    const userIdValidation = validateUuid(userId, 'User ID');
    if (!userIdValidation.isValid) {
      return addCorsHeaders(jsonError(userIdValidation.error || 'Invalid user ID', 400));
    }

    // SECURITY: Verify the user owns this Stripe customer ID
    const supabase = createClient(
      context.env.VITE_SUPABASE_URL,
      context.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user:', userError);
      return addCorsHeaders(jsonError('User not found', 404));
    }

    // Verify the customer ID belongs to this user
    if (userData.stripe_customer_id !== customerId) {
      console.error(`Security: User ${userId} attempted to access customer ${customerId} but owns ${userData.stripe_customer_id}`);
      return addCorsHeaders(jsonError('Unauthorized: Customer ID does not belong to this user', 403));
    }

    // Initialize Stripe
    const stripe = new Stripe(context.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });

    // Validate optional return URL if provided
    const requestOrigin = new URL(context.request.url).origin;
    let validatedReturnUrl = `${requestOrigin}/profile`;

    if (returnUrl) {
      const urlValidation = validateUrl(returnUrl, { requireHttps: true });
      if (!urlValidation.isValid) {
        return addCorsHeaders(jsonError('Invalid return URL', 400));
      }
      validatedReturnUrl = returnUrl;
    }

    // Create Customer Portal Session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: validatedReturnUrl,
    });

    return addCorsHeaders(jsonSuccess({ url: session.url }));
  } catch (error) {
    console.error('Error creating portal session:', error);

    return addCorsHeaders(jsonError(
      error instanceof Error ? error.message : 'Failed to create portal session',
      500
    ));
  }
};

// Handle CORS preflight
export const onRequestOptions: PagesFunction = async (context) => {
  return handleCorsPreflightRequest(context.request);
};
