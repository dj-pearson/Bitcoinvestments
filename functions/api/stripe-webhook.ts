/**
 * Cloudflare Workers API: Stripe Webhook Handler
 *
 * This function listens for Stripe webhook events and updates subscription
 * status in Supabase. It handles:
 * - checkout.session.completed (new subscription)
 * - customer.subscription.updated (plan changes, renewals)
 * - customer.subscription.deleted (cancellation)
 * - invoice.payment_succeeded (successful payment)
 * - invoice.payment_failed (failed payment)
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  VITE_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string; // Service role key for admin operations
  VITE_STRIPE_PRICE_MONTHLY: string;
  VITE_STRIPE_PRICE_ANNUAL: string;
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

    // Verify webhook signature
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

    // Initialize Supabase with service role (bypass RLS)
    const supabase = createClient(
      context.env.VITE_SUPABASE_URL,
      context.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Handle the event
    console.log(`Received event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session, stripe, supabase, context.env);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription, supabase, context.env);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription, supabase);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice, stripe, supabase, context.env);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice, supabase);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
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
 * Handle successful checkout (new subscription)
 */
async function handleCheckoutComplete(
  session: Stripe.Checkout.Session,
  stripe: Stripe,
  supabase: any,
  env: Env
) {
  const userId = session.client_reference_id;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId || !subscriptionId) {
    console.error('Missing userId or subscriptionId in checkout session');
    return;
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0].price.id;

  // Determine tier
  let tier = 'free';
  if (priceId === env.VITE_STRIPE_PRICE_MONTHLY) {
    tier = 'monthly';
  } else if (priceId === env.VITE_STRIPE_PRICE_ANNUAL) {
    tier = 'annual';
  }

  // Update user in Supabase
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'premium',
      subscription_tier: tier,
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

  console.log(`✅ Subscription created for user ${userId}: ${tier}`);
}

/**
 * Handle subscription updates (renewals, plan changes)
 */
async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription,
  supabase: any,
  env: Env
) {
  const customerId = subscription.customer as string;
  const status = subscription.status;
  const priceId = subscription.items.data[0].price.id;

  // Determine tier
  let tier = 'free';
  if (priceId === env.VITE_STRIPE_PRICE_MONTHLY) {
    tier = 'monthly';
  } else if (priceId === env.VITE_STRIPE_PRICE_ANNUAL) {
    tier = 'annual';
  }

  // Determine subscription status
  const subscriptionStatus = status === 'active' || status === 'trialing' ? 'premium' : 'free';

  // Update user
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: subscriptionStatus,
      subscription_tier: tier,
      subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }

  console.log(`✅ Subscription updated for customer ${customerId}: ${subscriptionStatus}`);
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCanceled(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const customerId = subscription.customer as string;

  // Keep premium access until period end
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

  console.log(`✅ Subscription canceled for customer ${customerId}`);
}

/**
 * Handle successful payment (renewal)
 */
async function handlePaymentSucceeded(
  invoice: Stripe.Invoice,
  stripe: Stripe,
  supabase: any,
  env: Env
) {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    return; // Not a subscription invoice
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0].price.id;

  // Determine tier
  let tier = 'free';
  if (priceId === env.VITE_STRIPE_PRICE_MONTHLY) {
    tier = 'monthly';
  } else if (priceId === env.VITE_STRIPE_PRICE_ANNUAL) {
    tier = 'annual';
  }

  // Update subscription expiry
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'premium',
      subscription_tier: tier,
      subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId);

  if (error) {
    console.error('Error updating payment success:', error);
    throw error;
  }

  console.log(`✅ Payment succeeded for customer ${customerId}`);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: any
) {
  const customerId = invoice.customer as string;

  // Mark subscription as potentially at risk
  // Don't immediately revoke access - Stripe will retry
  console.log(`⚠️ Payment failed for customer ${customerId}`);

  // You could send an email alert here
  // For now, just log it - Stripe will handle retries
}
