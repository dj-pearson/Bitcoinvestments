/**
 * Cloudflare Pages Function: Stripe webhook
 *
 * Applies Stripe events to Supabase:
 * - checkout.session.completed      new subscription or one-time purchase
 * - customer.subscription.updated   plan change, renewal, past_due, reactivation
 * - customer.subscription.deleted   cancellation took effect
 * - invoice.payment_succeeded       renewal paid
 * - invoice.payment_failed          renewal failed (access kept while Stripe retries)
 *
 * WHAT WAS BOUGHT IS DECIDED BY THE STRIPE PRICE ID, never by metadata. Every
 * price the site sells is configured in the environment below and mapped to a
 * product here. Session metadata is only used for facts the price cannot carry
 * and that our own checkout endpoints set server-side (the tax year of a tax
 * package). An unrecognised price is logged and left alone rather than guessed
 * at, so a misconfigured price can never grant, or strip, a plan.
 *
 * Columns and enum values written here are created by
 * supabase/migrations/20260923000300_reconcile_schema.sql:
 *   users.subscription_status  free | premium | advisor | enterprise | lifetime
 *   users.subscription_tier, stripe_customer_id, stripe_subscription_id,
 *   lifetime_purchase_date, lifetime_purchase_amount, payment_failed_at
 *   api_subscriptions.stripe_customer_id, status
 * API plans live in api_subscriptions (and the tier of the user's API keys);
 * they never change users.subscription_status.
 */

import Stripe from 'stripe';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  VITE_SUPABASE_URL?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  // Individual plans
  VITE_STRIPE_PRICE_MONTHLY?: string;
  VITE_STRIPE_PRICE_ANNUAL?: string;
  VITE_STRIPE_PRICE_LIFETIME?: string;
  // Business plans
  VITE_STRIPE_PRICE_ADVISOR?: string;
  VITE_STRIPE_PRICE_ENTERPRISE?: string;
  // Tax packages (one-time)
  VITE_STRIPE_TAX_PACKAGE_BASIC?: string;
  VITE_STRIPE_TAX_PACKAGE_PREMIUM?: string;
  // API plans
  VITE_STRIPE_API_STARTER_MONTHLY?: string;
  VITE_STRIPE_API_STARTER_YEARLY?: string;
  VITE_STRIPE_API_PROFESSIONAL_MONTHLY?: string;
  VITE_STRIPE_API_PROFESSIONAL_YEARLY?: string;
}

type PlanStatus = 'premium' | 'advisor' | 'enterprise';

type Product =
  | { kind: 'plan'; status: PlanStatus; tier: 'monthly' | 'annual' | 'advisor' | 'enterprise' }
  | { kind: 'api'; tier: 'starter' | 'professional' }
  | { kind: 'lifetime' }
  | { kind: 'tax'; packageType: 'basic' | 'premium' };

type Db = SupabaseClient;

/** Price id -> product, built only from server-side configuration. */
function buildPriceMap(env: Env): Map<string, Product> {
  const map = new Map<string, Product>();
  const add = (priceId: string | undefined, product: Product) => {
    if (priceId && priceId.startsWith('price_')) map.set(priceId, product);
  };
  add(env.VITE_STRIPE_PRICE_MONTHLY, { kind: 'plan', status: 'premium', tier: 'monthly' });
  add(env.VITE_STRIPE_PRICE_ANNUAL, { kind: 'plan', status: 'premium', tier: 'annual' });
  add(env.VITE_STRIPE_PRICE_ADVISOR, { kind: 'plan', status: 'advisor', tier: 'advisor' });
  add(env.VITE_STRIPE_PRICE_ENTERPRISE, { kind: 'plan', status: 'enterprise', tier: 'enterprise' });
  add(env.VITE_STRIPE_PRICE_LIFETIME, { kind: 'lifetime' });
  add(env.VITE_STRIPE_TAX_PACKAGE_BASIC, { kind: 'tax', packageType: 'basic' });
  add(env.VITE_STRIPE_TAX_PACKAGE_PREMIUM, { kind: 'tax', packageType: 'premium' });
  add(env.VITE_STRIPE_API_STARTER_MONTHLY, { kind: 'api', tier: 'starter' });
  add(env.VITE_STRIPE_API_STARTER_YEARLY, { kind: 'api', tier: 'starter' });
  add(env.VITE_STRIPE_API_PROFESSIONAL_MONTHLY, { kind: 'api', tier: 'professional' });
  add(env.VITE_STRIPE_API_PROFESSIONAL_YEARLY, { kind: 'api', tier: 'professional' });
  return map;
}

const nowIso = () => new Date().toISOString();

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
}

/**
 * Period end of a subscription as an ISO string. The field moved from the
 * subscription to its items in newer Stripe API versions; read either.
 */
function periodEndIso(subscription: Stripe.Subscription): string | null {
  const loose = subscription as unknown as {
    current_period_end?: number;
    items?: { data?: Array<{ current_period_end?: number }> };
  };
  const seconds = loose.current_period_end ?? loose.items?.data?.[0]?.current_period_end;
  return typeof seconds === 'number' ? new Date(seconds * 1000).toISOString() : null;
}

function periodStartIso(subscription: Stripe.Subscription): string | null {
  const loose = subscription as unknown as {
    current_period_start?: number;
    items?: { data?: Array<{ current_period_start?: number }> };
  };
  const seconds = loose.current_period_start ?? loose.items?.data?.[0]?.current_period_start;
  return typeof seconds === 'number' ? new Date(seconds * 1000).toISOString() : null;
}

/** Subscription id of an invoice, for old and new Stripe API shapes. */
function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const loose = invoice as unknown as {
    subscription?: string | { id: string } | null;
    parent?: { subscription_details?: { subscription?: string | { id: string } | null } | null } | null;
  };
  return idOf(loose.subscription ?? loose.parent?.subscription_details?.subscription ?? null);
}

function subscriptionPriceId(subscription: Stripe.Subscription): string | null {
  return subscription.items?.data?.[0]?.price?.id ?? null;
}

/** Access continues while Stripe is still collecting (past_due retries). */
function subscriptionGrantsAccess(status: Stripe.Subscription.Status): boolean {
  return status === 'active' || status === 'trialing' || status === 'past_due';
}

function apiStatusFor(status: Stripe.Subscription.Status): 'active' | 'past_due' | 'inactive' | 'canceled' {
  if (status === 'active' || status === 'trialing') return 'active';
  if (status === 'past_due') return 'past_due';
  if (status === 'canceled') return 'canceled';
  return 'inactive';
}

async function expectOk(
  label: string,
  result: PromiseLike<{ error: { message: string; code?: string } | null }>
): Promise<void> {
  const { error } = await result;
  if (error) {
    console.error(`${label}:`, error);
    throw new Error(`${label}: ${error.message}`);
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env } = context;
  try {
    const body = await context.request.text();
    const signature = context.request.headers.get('stripe-signature');
    if (!signature) {
      return json({ error: 'Missing stripe-signature header' }, 400);
    }

    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia' as Stripe.LatestApiVersion,
    });

    // constructEventAsync, not constructEvent: on workerd the SDK's crypto
    // provider is SubtleCrypto, whose synchronous HMAC path always throws, so the
    // synchronous call rejected every delivery as a bad signature.
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return json({ error: 'Invalid signature' }, 400);
    }

    const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
    if (!supabaseUrl || !env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Stripe webhook: Supabase is not configured; event', event.id, 'not applied');
      // 500 so Stripe retries once the configuration is fixed.
      return json({ error: 'Database not configured' }, 500);
    }
    const supabase = createClient(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY);
    const prices = buildPriceMap(env);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session, stripe, supabase, prices);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription, supabase, prices, false);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription, supabase, prices, true);
        break;
      case 'invoice.payment_succeeded': {
        const subscriptionId = invoiceSubscriptionId(event.data.object as Stripe.Invoice);
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await handleSubscriptionChange(subscription, supabase, prices, false, { clearPaymentFailure: true });
        }
        break;
      }
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, supabase);
        break;
      default:
        break;
    }

    return json({ received: true }, 200);
  } catch (error) {
    console.error('Error processing webhook:', error);
    return json({ error: error instanceof Error ? error.message : 'Webhook processing failed' }, 500);
  }
};

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** The first configured product among the session's line items. */
async function productForSession(
  session: Stripe.Checkout.Session,
  stripe: Stripe,
  prices: Map<string, Product>
): Promise<{ product: Product; priceId: string } | null> {
  const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
  for (const item of items.data) {
    const priceId = item.price?.id;
    const product = priceId ? prices.get(priceId) : undefined;
    if (priceId && product) return { product, priceId };
  }
  return null;
}

async function handleCheckoutComplete(
  session: Stripe.Checkout.Session,
  stripe: Stripe,
  supabase: Db,
  prices: Map<string, Product>
) {
  const userId = session.client_reference_id;
  const customerId = idOf(session.customer);
  if (!userId) {
    console.error('checkout.session.completed without client_reference_id:', session.id);
    return;
  }

  const match = await productForSession(session, stripe, prices);
  if (!match) {
    // The customer has paid for something this deployment does not sell (or a
    // price env var is missing). Surface it; do not guess.
    console.error('Checkout completed for an unconfigured price; nothing applied. Session:', session.id);
    return;
  }
  const { product } = match;

  switch (product.kind) {
    case 'lifetime': {
      if (session.mode !== 'payment') {
        console.error('Lifetime price used in a non-payment checkout; ignored. Session:', session.id);
        return;
      }
      await updateUserRow(supabase, userId, 'Lifetime purchase', {
        subscription_status: 'lifetime',
        subscription_tier: 'lifetime',
        stripe_customer_id: customerId,
        stripe_subscription_id: null,
        subscription_expires_at: null,
        lifetime_purchase_date: nowIso(),
        lifetime_purchase_amount: session.amount_total != null ? session.amount_total / 100 : null,
        payment_failed_at: null,
        updated_at: nowIso(),
      });
      return;
    }

    case 'tax': {
      // The tax year is chosen by the buyer and validated server-side by
      // create-tax-package-checkout; it is the one fact the price cannot carry.
      const taxYear = Number.parseInt(session.metadata?.taxYear ?? '', 10);
      if (!Number.isInteger(taxYear)) {
        console.error('Tax package checkout without a valid taxYear; nothing applied. Session:', session.id);
        return;
      }
      const paymentIntentId = idOf(session.payment_intent as string | { id: string } | null);
      // Upsert on the payment intent so a redelivered event is a no-op instead
      // of a unique-constraint failure that Stripe would retry forever.
      await expectOk(
        'Recording tax package purchase',
        supabase.from('tax_report_purchases').upsert(
          {
            user_id: userId,
            package_type: product.packageType,
            tax_year: taxYear,
            price_paid: session.amount_total != null ? session.amount_total / 100 : 0,
            currency: (session.currency || 'usd').toUpperCase(),
            stripe_payment_intent_id: paymentIntentId,
            stripe_checkout_session_id: session.id,
            status: 'completed',
            purchased_at: nowIso(),
          },
          { onConflict: 'stripe_payment_intent_id', ignoreDuplicates: true }
        )
      );
      return;
    }

    case 'plan':
    case 'api': {
      const subscriptionId = idOf(session.subscription);
      if (session.mode !== 'subscription' || !subscriptionId) {
        console.error('Subscription price without a subscription; ignored. Session:', session.id);
        return;
      }
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      if (product.kind === 'api') {
        await applyApiSubscription(supabase, userId, customerId, subscription, product.tier);
      } else {
        await updateUserRow(supabase, userId, 'New subscription', {
          subscription_status: product.status,
          subscription_tier: product.tier,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_expires_at: periodEndIso(subscription),
          payment_failed_at: null,
          updated_at: nowIso(),
        });
      }
      return;
    }
  }
}

/**
 * Update one user's row and fail loudly if it does not exist. A missing
 * profile row means the signup trigger did not run; throwing makes Stripe
 * retry the event after the row has been backfilled.
 */
async function updateUserRow(supabase: Db, userId: string, label: string, values: Record<string, unknown>) {
  const { data, error } = await supabase.from('users').update(values).eq('id', userId).select('id');
  if (error) {
    console.error(`${label}:`, error);
    throw new Error(`${label}: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new Error(`${label}: no public.users row for ${userId}`);
  }
}

async function applyApiSubscription(
  supabase: Db,
  userId: string,
  customerId: string | null,
  subscription: Stripe.Subscription,
  tier: 'starter' | 'professional'
) {
  const status = apiStatusFor(subscription.status);
  const effectiveTier = status === 'active' || status === 'past_due' ? tier : 'free';

  await expectOk(
    'Updating API subscription',
    supabase.from('api_subscriptions').upsert(
      {
        user_id: userId,
        tier: effectiveTier,
        status,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        current_period_start: periodStartIso(subscription),
        current_period_end: periodEndIso(subscription),
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        updated_at: nowIso(),
      },
      { onConflict: 'user_id' }
    )
  );

  // Rate limits follow the key's tier (trigger_update_api_key_limits).
  await expectOk(
    'Updating API key tier',
    supabase
      .from('api_keys')
      .update({ tier: effectiveTier, updated_at: nowIso() })
      .eq('user_id', userId)
      .eq('status', 'active')
  );
}

async function handleSubscriptionChange(
  subscription: Stripe.Subscription,
  supabase: Db,
  prices: Map<string, Product>,
  deleted: boolean,
  options: { clearPaymentFailure?: boolean } = {}
) {
  const priceId = subscriptionPriceId(subscription);
  const product = priceId ? prices.get(priceId) : undefined;
  const customerId = idOf(subscription.customer);

  if (!product || (product.kind !== 'plan' && product.kind !== 'api')) {
    console.error('Subscription event for an unconfigured price; nothing changed.', subscription.id, priceId);
    return;
  }

  if (product.kind === 'api') {
    // Resolve the owner from our own record of this subscription.
    const { data: row, error } = await supabase
      .from('api_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();
    if (error) throw new Error(`Looking up API subscription: ${error.message}`);
    const userId = (row as { user_id?: string } | null)?.user_id ?? subscription.metadata?.userId;
    if (!userId) {
      console.error('API subscription event for an unknown subscription:', subscription.id);
      return;
    }
    const effective = deleted ? ({ ...subscription, status: 'canceled' } as Stripe.Subscription) : subscription;
    await applyApiSubscription(supabase, userId, customerId, effective, product.tier);
    return;
  }

  const grantsAccess = !deleted && subscriptionGrantsAccess(subscription.status);
  const values: Record<string, unknown> = grantsAccess
    ? {
        subscription_status: product.status,
        subscription_tier: product.tier,
        stripe_subscription_id: subscription.id,
        subscription_expires_at: periodEndIso(subscription),
        updated_at: nowIso(),
      }
    : {
        subscription_status: 'free',
        subscription_tier: 'free',
        stripe_subscription_id: null,
        subscription_expires_at: periodEndIso(subscription),
        updated_at: nowIso(),
      };
  if (customerId) values.stripe_customer_id = customerId;
  if (options.clearPaymentFailure) values.payment_failed_at = null;

  // Granting: target the owner. The checkout endpoint puts the user id in
  // subscription metadata server-side, which also covers an event that
  // arrives before checkout.session.completed; otherwise match on the
  // subscription id recorded at checkout.
  // Revoking: only the row still pointing at THIS subscription, so an old
  // subscription winding down cannot downgrade someone who has since bought a
  // new one. Lifetime members are never touched either way.
  const ownerId = subscription.metadata?.userId;
  let query = supabase.from('users').update(values).neq('subscription_status', 'lifetime');
  query = grantsAccess && ownerId ? query.eq('id', ownerId) : query.eq('stripe_subscription_id', subscription.id);
  const { data, error } = await query.select('id');
  if (error) {
    console.error('Updating subscription:', error);
    throw new Error(`Updating subscription: ${error.message}`);
  }
  if (!data || data.length === 0) {
    // Normal when the event arrives before checkout.session.completed, or for a
    // lifetime member; checkout completion writes the full state.
    console.warn('Subscription event matched no user row:', subscription.id);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice, supabase: Db) {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return;
  // Access is kept while Stripe retries; after the final failure Stripe sends
  // customer.subscription.deleted (or updated to unpaid), which downgrades.
  const { error } = await supabase
    .from('users')
    .update({ payment_failed_at: nowIso(), updated_at: nowIso() })
    .eq('stripe_subscription_id', subscriptionId);
  if (error) console.error('Error recording payment failure:', error);
}
