/**
 * Cloudflare Workers API: Stripe Webhook Handler
 *
 * This function listens for Stripe webhook events and updates subscription
 * status in Supabase. It handles:
 * - checkout.session.completed (new subscription or one-time purchase)
 * - customer.subscription.updated (plan changes, renewals)
 * - customer.subscription.deleted (cancellation)
 * - invoice.payment_succeeded (successful payment)
 * - invoice.payment_failed (failed payment)
 *
 * Supported purchase types:
 * - Recurring subscriptions: monthly, annual, advisor, enterprise
 * - One-time purchases: lifetime, tax packages
 * - API subscriptions: starter, professional
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  VITE_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  // Individual plan price IDs
  VITE_STRIPE_PRICE_MONTHLY: string;
  VITE_STRIPE_PRICE_ANNUAL: string;
  VITE_STRIPE_PRICE_LIFETIME: string;
  // Business plan price IDs
  VITE_STRIPE_PRICE_ADVISOR: string;
  VITE_STRIPE_PRICE_ENTERPRISE: string;
  // Tax package price IDs
  VITE_STRIPE_TAX_PACKAGE_BASIC: string;
  VITE_STRIPE_TAX_PACKAGE_PREMIUM: string;
  // API tier price IDs
  VITE_STRIPE_API_STARTER_MONTHLY: string;
  VITE_STRIPE_API_STARTER_YEARLY: string;
  VITE_STRIPE_API_PROFESSIONAL_MONTHLY: string;
  VITE_STRIPE_API_PROFESSIONAL_YEARLY: string;
}

/**
 * Map of price IDs to subscription tiers
 * Built dynamically from environment variables
 */
function buildPriceToTierMap(env: Env): Record<string, { status: string; tier: string }> {
  const map: Record<string, { status: string; tier: string }> = {};

  // Individual plans
  if (env.VITE_STRIPE_PRICE_MONTHLY) {
    map[env.VITE_STRIPE_PRICE_MONTHLY] = { status: 'premium', tier: 'monthly' };
  }
  if (env.VITE_STRIPE_PRICE_ANNUAL) {
    map[env.VITE_STRIPE_PRICE_ANNUAL] = { status: 'premium', tier: 'annual' };
  }

  // Business plans
  if (env.VITE_STRIPE_PRICE_ADVISOR) {
    map[env.VITE_STRIPE_PRICE_ADVISOR] = { status: 'advisor', tier: 'advisor' };
  }
  if (env.VITE_STRIPE_PRICE_ENTERPRISE) {
    map[env.VITE_STRIPE_PRICE_ENTERPRISE] = { status: 'enterprise', tier: 'enterprise' };
  }

  // API tiers (stored separately)
  if (env.VITE_STRIPE_API_STARTER_MONTHLY) {
    map[env.VITE_STRIPE_API_STARTER_MONTHLY] = { status: 'api', tier: 'api_starter' };
  }
  if (env.VITE_STRIPE_API_STARTER_YEARLY) {
    map[env.VITE_STRIPE_API_STARTER_YEARLY] = { status: 'api', tier: 'api_starter' };
  }
  if (env.VITE_STRIPE_API_PROFESSIONAL_MONTHLY) {
    map[env.VITE_STRIPE_API_PROFESSIONAL_MONTHLY] = { status: 'api', tier: 'api_professional' };
  }
  if (env.VITE_STRIPE_API_PROFESSIONAL_YEARLY) {
    map[env.VITE_STRIPE_API_PROFESSIONAL_YEARLY] = { status: 'api', tier: 'api_professional' };
  }

  return map;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Get the raw request body
    const body = await context.request.text();
    const signature = context.request.headers.get('stripe-signature');

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(context.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });

    // Verify webhook signature - critical for security
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        context.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase with service role (bypass RLS for admin operations)
    const supabase = createClient(
      context.env.VITE_SUPABASE_URL,
      context.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Build price to tier mapping
    const priceToTierMap = buildPriceToTierMap(context.env);

    // Handle the event

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session, stripe, supabase, context.env, priceToTierMap);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription, supabase, priceToTierMap);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription, supabase);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice, stripe, supabase, priceToTierMap);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice, supabase);
        break;
      }

      default:
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Webhook processing failed'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

/**
 * Handle successful checkout
 * Routes to appropriate handler based on checkout mode and product type
 */
async function handleCheckoutComplete(
  session: Stripe.Checkout.Session,
  stripe: Stripe,
  supabase: ReturnType<typeof createClient>,
  env: Env,
  priceToTierMap: Record<string, { status: string; tier: string }>
) {
  const userId = session.client_reference_id;
  const customerId = session.customer as string;
  const productType = session.metadata?.productType;
  const subscriptionType = session.metadata?.subscriptionType;

  if (!userId) {
    console.error('Missing userId in checkout session');
    return;
  }

  // Handle one-time payments
  if (session.mode === 'payment') {
    if (productType === 'tax_report_package') {
      await handleTaxPackagePurchase(session, supabase);
    } else if (productType === 'lifetime' || session.metadata?.type === 'lifetime') {
      await handleLifetimePurchase(session, supabase, customerId);
    } else {
    }
    return;
  }

  // Handle subscription purchases
  if (session.mode === 'subscription') {
    const subscriptionId = session.subscription as string;

    if (!subscriptionId) {
      console.error('Missing subscriptionId in subscription checkout session');
      return;
    }

    // Handle API subscriptions separately
    if (subscriptionType === 'api') {
      await handleApiSubscription(session, stripe, supabase);
      return;
    }

    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0].price.id;

    // Determine tier from price ID
    const tierInfo = priceToTierMap[priceId] || { status: 'premium', tier: 'unknown' };

    // Update user in Supabase
    const { error } = await supabase
      .from('users')
      .update({
        subscription_status: tierInfo.status,
        subscription_tier: tierInfo.tier,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user subscription:', error);
      throw error;
    }

  }
}

/**
 * Handle lifetime deal one-time purchase
 */
async function handleLifetimePurchase(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createClient>,
  customerId: string
) {
  const userId = session.client_reference_id;
  const amountTotal = session.amount_total ? session.amount_total / 100 : 0;

  if (!userId) {
    console.error('Missing userId in lifetime purchase');
    return;
  }

  // Update user with lifetime status (no expiration)
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'lifetime',
      subscription_tier: 'lifetime',
      stripe_customer_id: customerId,
      stripe_subscription_id: null, // No recurring subscription
      subscription_expires_at: null, // Never expires
      lifetime_purchase_date: new Date().toISOString(),
      lifetime_purchase_amount: amountTotal,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user for lifetime purchase:', error);
    throw error;
  }

}

/**
 * Handle API subscription checkout
 */
async function handleApiSubscription(
  session: Stripe.Checkout.Session,
  stripe: Stripe,
  supabase: ReturnType<typeof createClient>
) {
  const userId = session.client_reference_id;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const apiTier = session.metadata?.apiTier || 'starter';

  if (!userId || !subscriptionId) {
    console.error('Missing userId or subscriptionId in API subscription');
    return;
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Update or insert API subscription record
  const { error } = await supabase
    .from('api_subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      api_tier: apiTier,
      status: 'active',
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('Error updating API subscription:', error);
    throw error;
  }

}

/**
 * Handle subscription updates (renewals, plan changes)
 */
async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createClient>,
  priceToTierMap: Record<string, { status: string; tier: string }>
) {
  const customerId = subscription.customer as string;
  const status = subscription.status;
  const priceId = subscription.items.data[0].price.id;
  const subscriptionType = subscription.metadata?.subscriptionType;

  // Handle API subscription updates separately
  if (subscriptionType === 'api') {
    const isActive = status === 'active' || status === 'trialing';
    const { error } = await supabase
      .from('api_subscriptions')
      .update({
        status: isActive ? 'active' : 'inactive',
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error updating API subscription:', error);
      throw error;
    }

    return;
  }

  // Determine tier from price ID
  const tierInfo = priceToTierMap[priceId] || { status: 'free', tier: 'free' };

  // Determine subscription status based on Stripe status
  const isActive = status === 'active' || status === 'trialing';
  const subscriptionStatus = isActive ? tierInfo.status : 'free';
  const subscriptionTier = isActive ? tierInfo.tier : 'free';

  // Update user
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: subscriptionStatus,
      subscription_tier: subscriptionTier,
      subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }

}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCanceled(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createClient>
) {
  const customerId = subscription.customer as string;
  const subscriptionType = subscription.metadata?.subscriptionType;

  // Handle API subscription cancellation
  if (subscriptionType === 'api') {
    const { error } = await supabase
      .from('api_subscriptions')
      .update({
        status: 'canceled',
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error canceling API subscription:', error);
      throw error;
    }

    return;
  }

  // Keep premium access until period end, then revert to free
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'free',
      subscription_tier: 'free',
      subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }

}

/**
 * Handle successful payment (renewal)
 */
async function handlePaymentSucceeded(
  invoice: Stripe.Invoice,
  stripe: Stripe,
  supabase: ReturnType<typeof createClient>,
  priceToTierMap: Record<string, { status: string; tier: string }>
) {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    return; // Not a subscription invoice
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0].price.id;
  const subscriptionType = subscription.metadata?.subscriptionType;

  // Handle API subscription payment
  if (subscriptionType === 'api') {
    const { error } = await supabase
      .from('api_subscriptions')
      .update({
        status: 'active',
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (error) {
      console.error('Error updating API subscription payment:', error);
      throw error;
    }

    return;
  }

  // Determine tier from price ID
  const tierInfo = priceToTierMap[priceId] || { status: 'premium', tier: 'unknown' };

  // Update subscription expiry
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: tierInfo.status,
      subscription_tier: tierInfo.tier,
      subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Error updating payment success:', error);
    throw error;
  }

}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: ReturnType<typeof createClient>
) {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  // Log the failure - Stripe will automatically retry

  // Optionally update a payment_failed flag in the database
  // to show a warning to the user in the UI
  if (subscriptionId) {
    const { error } = await supabase
      .from('users')
      .update({
        payment_failed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_customer_id', customerId);

    if (error) {
      console.error('Error recording payment failure:', error);
    }
  }

  // Note: We don't immediately revoke access - Stripe will retry
  // After final failure, Stripe will send subscription.deleted event
}

/**
 * Handle tax package one-time purchase
 */
async function handleTaxPackagePurchase(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createClient>
) {
  const userId = session.client_reference_id;
  const packageType = session.metadata?.packageType as 'basic' | 'premium';
  const taxYear = parseInt(session.metadata?.taxYear || new Date().getFullYear().toString());
  const amountTotal = session.amount_total ? session.amount_total / 100 : 0;

  if (!userId || !packageType) {
    console.error('Missing userId or packageType in tax package checkout');
    return;
  }

  // Insert tax report purchase record
  const { error } = await supabase
    .from('tax_report_purchases')
    .insert({
      user_id: userId,
      package_type: packageType,
      tax_year: taxYear,
      price_paid: amountTotal,
      currency: session.currency?.toUpperCase() || 'USD',
      stripe_payment_intent_id: session.payment_intent as string,
      stripe_checkout_session_id: session.id,
      status: 'completed',
      purchased_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error creating tax report purchase record:', error);
    throw error;
  }

}
