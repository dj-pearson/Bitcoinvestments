/**
 * Cloudflare Workers API: Create Stripe Checkout Session
 *
 * This function creates a Stripe Checkout session for premium subscriptions.
 * It's called from the frontend when a user clicks "Subscribe" on the pricing page.
 */

import Stripe from 'stripe';

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
    // Parse request body
    const body = await context.request.json() as CheckoutRequest;
    const { priceId, userId, userEmail, successUrl, cancelUrl } = body;

    // Validate required fields
    if (!priceId || !userId || !userEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: priceId, userId, userEmail' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(context.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });

    // Validate price ID (must be one of our configured prices)
    const validPriceIds = [
      context.env.VITE_STRIPE_PRICE_MONTHLY,
      context.env.VITE_STRIPE_PRICE_ANNUAL,
    ];

    if (!validPriceIds.includes(priceId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid price ID' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      client_reference_id: userId, // Used to link subscription to user
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${new URL(context.request.url).origin}/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${new URL(context.request.url).origin}/pricing`,
      metadata: {
        userId: userId,
      },
      subscription_data: {
        metadata: {
          userId: userId,
        },
      },
      allow_promotion_codes: true, // Allow discount codes
      billing_address_collection: 'auto',
      tax_id_collection: {
        enabled: true, // Collect tax IDs for business customers
      },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // Adjust for production
        }
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to create checkout session'
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
