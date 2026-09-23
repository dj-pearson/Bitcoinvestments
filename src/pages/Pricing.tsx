import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, BookOpen, Calculator, BarChart3, ShieldCheck, TrendingUp, Wallet } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  SUBSCRIPTION_TIERS,
  redirectToCheckout,
  redirectToLifetimeCheckout,
  formatPrice,
  calculateAnnualSavings,
  calculateLifetimeSavings,
  isStripeConfigured,
  isPlanPurchasable,
  type SubscriptionTierId,
} from '../services/stripe';
import { TAX_PACKAGE, isTaxSeasonActive } from '../services/subscriptionLimits';
import { STATIC_MODE } from '../config/staticMode';
import { Newsletter } from '../components/Newsletter';
import { PageSEO } from '../components/PageSEO';

/** Date the copy on this page was last checked against what the site offers. */
const LAST_REVIEWED_ISO = '2026-09-23';
const LAST_REVIEWED_LABEL = 'September 23, 2026';

const FREE_TODAY = [
  { icon: BookOpen, label: 'Guides, the beginner course and the glossary', to: '/learn' },
  { icon: Calculator, label: 'DCA, fee, tax, staking, retirement and backtesting calculators', to: '/calculators' },
  { icon: BarChart3, label: 'Exchange and wallet comparisons', to: '/compare' },
  { icon: ShieldCheck, label: 'Scam database search', to: '/scam-database' },
  { icon: TrendingUp, label: 'Market dashboard with current prices', to: '/dashboard' },
  { icon: Wallet, label: 'Portfolio tracker on the dashboard (saved in your browser)', to: '/dashboard' },
] as const;

const STATIC_FAQS = [
  {
    question: 'Is Bitcoinvestments free?',
    answer:
      'Yes. Every guide, calculator, comparison and the scam database is free and needs no account. Nothing on the site is behind a paywall today.',
  },
  {
    question: 'Can I buy Premium now?',
    answer:
      'No. Accounts and paid plans are not open yet, so there is nothing to buy. Join the email list on this page and we will tell you when that changes.',
  },
  {
    question: 'When will Premium launch?',
    answer:
      'We have not set a date. We would rather announce it when it is ready than promise a date we might miss.',
  },
  {
    question: 'How does the site make money while everything is free?',
    answer:
      'Some links to exchanges and wallets are affiliate links: the provider may pay us a commission if you sign up, at no extra cost to you. These links and any sponsored content are labelled.',
  },
];

const LIVE_FAQS = [
  {
    question: 'Can I cancel?',
    answer:
      'Yes. You can cancel a subscription from the billing portal linked in your profile. You keep Premium until the end of the period you have paid for; it does not renew after that.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'Payments are processed by Stripe. The methods offered (cards and, in some countries, wallets) are shown at checkout.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Refunds are handled under our Terms of Service. Contact support@bitcoinvestments.net if something went wrong with a payment.',
  },
  {
    question: 'Is the free plan still free?',
    answer: 'Yes. Guides, calculators, comparisons and the scam database do not need a paid plan.',
  },
];

function FeatureList({ items, color = 'text-green-500' }: { items: readonly string[]; color?: string }) {
  return (
    <ul className="space-y-2">
      {items.map((feature) => (
        <li key={feature} className="flex items-start">
          <Check className={`w-5 h-5 ${color} mr-2 flex-shrink-0 mt-0.5`} aria-hidden="true" />
          <span className="text-sm">{feature}</span>
        </li>
      ))}
    </ul>
  );
}

function FaqList({ faqs }: { faqs: ReadonlyArray<{ question: string; answer: string }> }) {
  return (
    <div className="space-y-4">
      {faqs.map((faq) => (
        <div key={faq.question} className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
          <p className="text-gray-400">{faq.answer}</p>
        </div>
      ))}
    </div>
  );
}

/** Static mode: nothing is for sale, so say so and offer the waitlist. */
function PricingStatic() {
  return (
    <div className="container mx-auto px-4 py-12">
      <PageSEO pageKey="pricing" urlPath="/pricing" faqs={STATIC_FAQS} />
      <header className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Pricing: everything is free today</h1>
        <p className="text-xl text-gray-300">
          Every guide, calculator and comparison on Bitcoinvestments, and the scam database, is
          free and needs no account. Premium, with a saved portfolio and more alerts, is not open
          yet. Join the waitlist and we&apos;ll email you when it is.
        </p>
        <p className="text-sm text-gray-400 mt-4">
          Last reviewed: <time dateTime={LAST_REVIEWED_ISO}>{LAST_REVIEWED_LABEL}</time>
        </p>
      </header>

      <section aria-labelledby="free-today-heading" className="max-w-4xl mx-auto mb-12">
        <h2 id="free-today-heading" className="text-2xl font-bold mb-6">Free today, no account needed</h2>
        <ul className="grid sm:grid-cols-2 gap-4">
          {FREE_TODAY.map(({ icon: Icon, label, to }) => (
            <li key={label}>
              <Link
                to={to}
                className="flex items-center gap-3 p-4 glass-card hover:bg-white/10 transition-colors"
              >
                <Icon className="w-5 h-5 text-green-400 flex-shrink-0" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="premium-heading" className="max-w-4xl mx-auto mb-12 grid md:grid-cols-2 gap-8 items-start">
        <div className="glass-card p-8">
          <p className="inline-block px-3 py-1 bg-gray-500/20 text-gray-300 text-xs font-medium rounded-full mb-3">
            Not open yet
          </p>
          <h2 id="premium-heading" className="text-2xl font-bold mb-2">Premium (planned)</h2>
          <p className="text-gray-400 mb-4">
            Premium needs an account, and accounts are switched off while we finish building them.
            This is what we are building it to include:
          </p>
          <FeatureList items={SUBSCRIPTION_TIERS.monthly.features} color="text-gray-400" />
          {/* NEEDS-OWNER: confirm launch prices before showing them as final. */}
          <p className="text-sm text-gray-400 mt-6">
            Planned price: {formatPrice(SUBSCRIPTION_TIERS.monthly.price)}/month or{' '}
            {formatPrice(SUBSCRIPTION_TIERS.annual.price)}/year. This may change before launch, and
            nobody is charged until you choose a plan at checkout.
          </p>
        </div>
        <Newsletter
          source="pricing-waitlist"
          variant="card"
          heading="Join the Premium waitlist"
          description="We'll email you when accounts and Premium open. You'll also get our weekly plain-English crypto email; unsubscribe at any time."
        />
      </section>

      <section aria-labelledby="pricing-faq-heading" className="max-w-4xl mx-auto">
        <h2 id="pricing-faq-heading" className="text-3xl font-bold mb-8 text-center">Frequently asked questions</h2>
        <FaqList faqs={STATIC_FAQS} />
        <p className="text-sm text-gray-400 mt-8 text-center">
          More about{' '}
          <Link to="/about" className="text-orange-400 underline">
            who we are and how we make money
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

/** Accounts on: sell only plans whose Stripe price is configured. */
function PricingLive() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Derived from the clock in an effect so server and client first renders match.
  const [taxYear, setTaxYear] = useState<number | null>(null);
  const [taxSeasonActive, setTaxSeasonActive] = useState(false);
  const stripeConfigured = isStripeConfigured();
  const savings = calculateAnnualSavings();
  const lifetime = calculateLifetimeSavings();

  useEffect(() => {
    setTaxYear(new Date().getFullYear() - 1);
    setTaxSeasonActive(isTaxSeasonActive());
  }, []);

  const taxPackageOnSale =
    taxSeasonActive &&
    taxYear !== null &&
    !TAX_PACKAGE.stripePriceId.basic.endsWith('_placeholder');

  const plans = (['monthly', 'annual', 'lifetime', 'advisor', 'enterprise'] as const).filter((id) =>
    isPlanPurchasable(id)
  );

  const requireUser = () => {
    if (!user) {
      navigate('/login?redirect=/pricing');
      return false;
    }
    if (!stripeConfigured) {
      setError('Payments are not set up yet. Please try again later.');
      return false;
    }
    return true;
  };

  const handleSubscribe = async (tierId: SubscriptionTierId) => {
    if (!requireUser() || !user) return;
    setLoading(tierId);
    setError(null);
    const { error: checkoutError } =
      tierId === 'lifetime'
        ? await redirectToLifetimeCheckout(user.id, user.email || '')
        : await redirectToCheckout(
            SUBSCRIPTION_TIERS[tierId].stripePriceId as string,
            user.id,
            user.email || ''
          );
    if (checkoutError) {
      setError(checkoutError);
      setLoading(null);
    }
  };

  const handleTaxPackagePurchase = async () => {
    if (!requireUser() || !user || taxYear === null) return;
    setLoading('tax');
    setError(null);
    try {
      const response = await fetch('/api/create-tax-package-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: TAX_PACKAGE.stripePriceId.basic,
          userId: user.id,
          userEmail: user.email || '',
          packageType: 'basic',
          taxYear,
        }),
      });
      if (!response.ok) throw new Error('Could not start checkout');
      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout');
    } finally {
      setLoading(null);
    }
  };

  const priceLabel = (id: (typeof plans)[number]) => {
    const tier = SUBSCRIPTION_TIERS[id];
    if (id === 'lifetime') return { price: formatPrice(tier.price), note: 'One-time payment' };
    if (id === 'annual')
      return {
        price: `${formatPrice(tier.price)}/year`,
        note: `Saves ${formatPrice(savings.savings)} a year compared with monthly billing`,
      };
    return { price: `${formatPrice(tier.price)}/month`, note: 'Billed monthly, cancel any time' };
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <PageSEO pageKey="pricing" urlPath="/pricing" faqs={LIVE_FAQS} />
      <header className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Pricing &amp; Plans</h1>
        <p className="text-xl text-gray-300">
          Guides, calculators, comparisons and the scam database are free. Premium adds a portfolio
          saved to your account, unlimited alerts and tax exports.
        </p>
        <p className="text-sm text-gray-400 mt-4">
          Last reviewed: <time dateTime={LAST_REVIEWED_ISO}>{LAST_REVIEWED_LABEL}</time>
        </p>
      </header>

      {error && (
        <div role="alert" className="max-w-2xl mx-auto mb-8 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <section aria-labelledby="plans-heading" className="max-w-6xl mx-auto mb-16">
        <h2 id="plans-heading" className="sr-only">Plans</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-card p-8 flex flex-col">
            <h3 className="text-2xl font-bold mb-2">{SUBSCRIPTION_TIERS.free.name}</h3>
            <div className="text-4xl font-bold mb-6">{formatPrice(0)}</div>
            <div className="flex-1 mb-6">
              <FeatureList items={SUBSCRIPTION_TIERS.free.features} />
            </div>
            <Link to="/signup" className="btn-secondary w-full text-center">
              Create a free account
            </Link>
          </div>

          {plans.map((id) => {
            const tier = SUBSCRIPTION_TIERS[id];
            const { price, note } = priceLabel(id);
            return (
              <div key={id} className="glass-card p-8 flex flex-col border-2 border-purple-500/40">
                {'targetAudience' in tier && (
                  <p className="text-blue-400 text-sm font-medium mb-2">{tier.targetAudience}</p>
                )}
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <div className="text-3xl font-bold mb-1">{price}</div>
                <p className="text-gray-400 text-sm mb-6">
                  {note}
                  {id === 'lifetime' && ` · costs the same as ${lifetime.yearsToBreakEven} years of the annual plan`}
                </p>
                <div className="flex-1 mb-6">
                  <FeatureList items={tier.features} color="text-purple-400" />
                </div>
                <button
                  type="button"
                  onClick={() => handleSubscribe(id)}
                  disabled={loading === id || !stripeConfigured}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === id ? 'Loading…' : `Choose ${tier.name}`}
                </button>
              </div>
            );
          })}
        </div>
        {plans.length === 0 && (
          <p className="text-center text-gray-400 mt-8">Paid plans are not on sale yet.</p>
        )}
      </section>

      {taxPackageOnSale && (
        <section aria-labelledby="tax-package-heading" className="max-w-2xl mx-auto mb-16 glass-card p-8">
          <h2 id="tax-package-heading" className="text-2xl font-bold mb-2">Tax report package</h2>
          <p className="text-3xl font-bold mb-2">
            {formatPrice(TAX_PACKAGE.price)} <span className="text-sm text-gray-400">one-time</span>
          </p>
          <p className="text-gray-400 mb-6">
            Exports of your capital gains and losses for the {taxYear} tax year, calculated from the
            transactions in your portfolio. See{' '}
            <Link to="/tax-reports" className="text-orange-400 underline">
              tax reports
            </Link>{' '}
            for what is included. It is not tax advice.
          </p>
          <button
            type="button"
            onClick={handleTaxPackagePurchase}
            disabled={loading === 'tax' || !stripeConfigured}
            className="btn-secondary w-full disabled:opacity-50"
          >
            {loading === 'tax' ? 'Loading…' : `Buy the ${taxYear} tax package`}
          </button>
        </section>
      )}

      <section aria-labelledby="pricing-faq-heading" className="max-w-4xl mx-auto">
        <h2 id="pricing-faq-heading" className="text-3xl font-bold mb-8 text-center">Frequently asked questions</h2>
        <FaqList faqs={LIVE_FAQS} />
        <p className="text-sm text-gray-400 mt-8 text-center">
          Billing, cancellation and refunds are covered in our{' '}
          <Link to="/terms#subscriptions" className="text-orange-400 underline">
            Terms of Service
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

export function Pricing() {
  return STATIC_MODE ? <PricingStatic /> : <PricingLive />;
}
