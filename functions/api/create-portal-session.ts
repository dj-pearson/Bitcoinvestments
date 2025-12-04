/**
 * Cloudflare Workers API: Create Stripe Customer Portal Session
 *
 * This function creates a Stripe Customer Portal session for subscription management.
 * It's called from the profile page when a user clicks "Manage Subscription".
 */

import Stripe from 'stripe';

interface Env {
  STRIPE_SECRET_KEY: string;
}

interface PortalRequest {
  customerId: string;
  returnUrl?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Parse request body
    const body = await context.request.json() as PortalRequest;
    const { customerId, returnUrl } = body;

    // Validate required fields
    if (!customerId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: customerId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(context.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });

    // Create Customer Portal Session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${new URL(context.request.url).origin}/profile`,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // Adjust for production
        }
      }
    );
  } catch (error) {
    console.error('Error creating portal session:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to create portal session'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
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
