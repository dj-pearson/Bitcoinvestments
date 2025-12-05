/**
 * Cloudflare Pages Function: Create Tax Package Checkout Session
 *
 * Creates a Stripe checkout session for one-time tax package purchases.
 */

import Stripe from 'stripe';

interface Env {
  STRIPE_SECRET_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
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

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const body: RequestBody = await request.json();
    const { priceId, userId, userEmail, packageType, taxYear } = body;

    if (!priceId || !userId || !packageType || !taxYear) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers }
      );
    }

    // Check if Stripe is configured
    if (!env.STRIPE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Stripe is not configured' }),
        { status: 500, headers }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    // Get the origin for redirect URLs
    const origin = request.headers.get('Origin') || 'https://bitcoinvestments.com';

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
      customer_email: userEmail,
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
    });

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Error creating tax package checkout session:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to create checkout session',
      }),
      { status: 500, headers }
    );
  }
};
