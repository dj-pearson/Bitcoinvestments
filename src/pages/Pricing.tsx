import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  SUBSCRIPTION_TIERS,
  redirectToCheckout,
  formatPrice,
  calculateAnnualSavings,
  isStripeConfigured,
} from '../services/stripe';
import { TAX_PACKAGE, isTaxSeasonActive } from '../services/subscriptionLimits';

type ViewMode = 'individual' | 'business';

export function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('individual');
  const savings = calculateAnnualSavings();
  const stripeConfigured = isStripeConfigured();
  const taxSeasonActive = isTaxSeasonActive();

  const handleSubscribe = async (priceId: string | null, tierId: string) => {
    if (!priceId) {
      setError('This plan is not available for purchase yet.');
      return;
    }

    if (!user) {
      navigate('/login?redirect=/pricing');
      return;
    }

    if (!stripeConfigured) {
      setError('Payment system is not configured. Please contact support.');
      return;
    }

    setLoading(tierId);
    setError(null);

    const { error: checkoutError } = await redirectToCheckout(
      priceId,
      user.id,
      user.email || ''
    );

    if (checkoutError) {
      setError(checkoutError);
      setLoading(null);
    }
  };

  const handleTaxPackagePurchase = async (tier: 'basic' | 'premium') => {
    if (!user) {
      navigate('/login?redirect=/pricing');
      return;
    }

    if (!stripeConfigured) {
      setError('Payment system is not configured. Please contact support.');
      return;
    }

    setLoading(`tax-${tier}`);
    setError(null);

    try {
      const response = await fetch('/api/create-tax-package-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: TAX_PACKAGE.stripePriceId[tier],
          userId: user.id,
          userEmail: user.email,
          packageType: tier,
          taxYear: TAX_PACKAGE.taxYear,
        }),
      });

      if (!response.ok) throw new Error('Failed to create checkout session');

      const { url } = await response.json();
      if (url) window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setLoading(null);
    }
  };

  // Feature comparison data
  const featureComparison = [
    { feature: 'Live Crypto Prices', free: true, premium: true, advisor: true, enterprise: true },
    { feature: 'Educational Content', free: true, premium: true, advisor: true, enterprise: true },
    { feature: 'Basic Calculators', free: true, premium: true, advisor: true, enterprise: true },
    { feature: 'Portfolio Tracker', free: '10 assets', premium: 'Unlimited', advisor: 'Unlimited', enterprise: 'Unlimited' },
    { feature: 'Price Alerts', free: '3 alerts', premium: 'Unlimited', advisor: 'Unlimited', enterprise: 'Unlimited' },
    { feature: 'Price Data', free: '15-min delay', premium: 'Real-time', advisor: 'Real-time', enterprise: 'Real-time' },
    { feature: 'Ad-Free Experience', free: false, premium: true, advisor: true, enterprise: true },
    { feature: 'Cloud Portfolio Sync', free: false, premium: true, advisor: true, enterprise: true },
    { feature: 'Email Alerts', free: false, premium: true, advisor: true, enterprise: true },
    { feature: 'SMS Alerts', free: false, premium: true, advisor: true, enterprise: true },
    { feature: 'Advanced Analytics', free: false, premium: true, advisor: true, enterprise: true },
    { feature: 'AI Portfolio Analysis', free: false, premium: true, advisor: true, enterprise: true },
    { feature: 'Advanced Backtesting', free: false, premium: true, advisor: true, enterprise: true },
    { feature: 'Tax Report Export', free: false, premium: true, advisor: true, enterprise: true },
    { feature: 'Premium Research Reports', free: false, premium: true, advisor: true, enterprise: true },
    { feature: 'Priority Support', free: false, premium: true, advisor: true, enterprise: true },
    { feature: 'Client Portfolios', free: false, premium: false, advisor: '10 clients', enterprise: 'Unlimited' },
    { feature: 'White-Label Reports', free: false, premium: false, advisor: true, enterprise: true },
    { feature: 'Client Dashboard', free: false, premium: false, advisor: true, enterprise: true },
    { feature: 'Compliance Exports', free: false, premium: false, advisor: true, enterprise: true },
    { feature: 'Custom Branding', free: false, premium: false, advisor: 'Basic', enterprise: 'Full' },
    { feature: 'Team Access', free: false, premium: false, advisor: false, enterprise: true },
    { feature: 'API Access', free: false, premium: false, advisor: false, enterprise: true },
    { feature: 'SSO/Enhanced Security', free: false, premium: false, advisor: false, enterprise: true },
    { feature: 'Dedicated Account Manager', free: false, premium: false, advisor: false, enterprise: true },
  ];

  const renderFeatureValue = (value: boolean | string) => {
    if (value === true) {
      return (
        <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    if (value === false) {
      return (
        <svg className="w-5 h-5 text-gray-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }
    return <span className="text-sm text-gray-300">{value}</span>;
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
          From individual investors to enterprise wealth managers, we have a plan for everyone.
        </p>

        {/* View Mode Toggle */}
        <div className="inline-flex bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('individual')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'individual'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Individual
          </button>
          <button
            onClick={() => setViewMode('business')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'business'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Business
          </button>
        </div>

        {!stripeConfigured && (
          <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg max-w-2xl mx-auto">
            <p className="text-yellow-400">
              Payment system is being configured. Check back soon!
            </p>
          </div>
        )}
      </div>

      {/* Individual Plans */}
      {viewMode === 'individual' && (
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {/* Free Tier */}
          <div className="glass-card p-8 flex flex-col">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">{SUBSCRIPTION_TIERS.free.name}</h3>
              <div className="text-4xl font-bold mb-2">
                {formatPrice(SUBSCRIPTION_TIERS.free.price)}
              </div>
              <p className="text-gray-400">Forever free</p>
            </div>

            <div className="flex-1 mb-6">
              <h4 className="font-semibold mb-3">Features:</h4>
              <ul className="space-y-2">
                {SUBSCRIPTION_TIERS.free.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <h4 className="font-semibold mb-3 mt-6">Limitations:</h4>
              <ul className="space-y-2">
                {SUBSCRIPTION_TIERS.free.limitations.map((limitation, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-gray-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    <span className="text-sm text-gray-400">{limitation}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/signup"
              className="btn-secondary w-full text-center"
            >
              Get Started Free
            </Link>
          </div>

          {/* Monthly Tier */}
          <div className="glass-card p-8 flex flex-col border-2 border-purple-500/50">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">{SUBSCRIPTION_TIERS.monthly.name}</h3>
              <div className="text-4xl font-bold mb-2">
                {formatPrice(SUBSCRIPTION_TIERS.monthly.price)}
                <span className="text-lg text-gray-400">/month</span>
              </div>
              <p className="text-gray-400">Billed monthly</p>
            </div>

            <div className="flex-1 mb-6">
              <h4 className="font-semibold mb-3">Everything in Free, plus:</h4>
              <ul className="space-y-2">
                {SUBSCRIPTION_TIERS.monthly.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() =>
                handleSubscribe(
                  SUBSCRIPTION_TIERS.monthly.stripePriceId,
                  SUBSCRIPTION_TIERS.monthly.id
                )
              }
              disabled={loading === SUBSCRIPTION_TIERS.monthly.id || !stripeConfigured}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === SUBSCRIPTION_TIERS.monthly.id
                ? 'Loading...'
                : 'Subscribe Monthly'}
            </button>
          </div>

          {/* Annual Tier */}
          <div className="glass-card p-8 flex flex-col border-2 border-gold-500/50 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gold-500 to-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold">
              Most Popular
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">{SUBSCRIPTION_TIERS.annual.name}</h3>
              <div className="text-4xl font-bold mb-2">
                {formatPrice(SUBSCRIPTION_TIERS.annual.price)}
                <span className="text-lg text-gray-400">/year</span>
              </div>
              <p className="text-gray-400">
                {formatPrice(SUBSCRIPTION_TIERS.annual.monthlyEquivalent!)}/month • Save{' '}
                {formatPrice(savings.savings)} ({savings.savingsPercentage.toFixed(0)}% off)
              </p>
            </div>

            <div className="flex-1 mb-6">
              <h4 className="font-semibold mb-3">Everything in Monthly, plus:</h4>
              <ul className="space-y-2">
                {SUBSCRIPTION_TIERS.annual.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-gold-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() =>
                handleSubscribe(
                  SUBSCRIPTION_TIERS.annual.stripePriceId,
                  SUBSCRIPTION_TIERS.annual.id
                )
              }
              disabled={loading === SUBSCRIPTION_TIERS.annual.id || !stripeConfigured}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-gold-500 to-yellow-500 hover:from-gold-600 hover:to-yellow-600"
            >
              {loading === SUBSCRIPTION_TIERS.annual.id
                ? 'Loading...'
                : 'Subscribe Annual'}
            </button>
          </div>
        </div>
      )}

      {/* Business Plans */}
      {viewMode === 'business' && (
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Advisor Tier */}
          <div className="glass-card p-8 flex flex-col border-2 border-blue-500/50">
            <div className="mb-6">
              <div className="text-blue-400 text-sm font-medium mb-2">
                {SUBSCRIPTION_TIERS.advisor.targetAudience}
              </div>
              <h3 className="text-2xl font-bold mb-2">{SUBSCRIPTION_TIERS.advisor.name}</h3>
              <div className="text-4xl font-bold mb-2">
                {formatPrice(SUBSCRIPTION_TIERS.advisor.price)}
                <span className="text-lg text-gray-400">/month</span>
              </div>
              <p className="text-gray-400">Billed monthly</p>
            </div>

            <div className="flex-1 mb-6">
              <ul className="space-y-2">
                {SUBSCRIPTION_TIERS.advisor.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() =>
                handleSubscribe(
                  SUBSCRIPTION_TIERS.advisor.stripePriceId,
                  SUBSCRIPTION_TIERS.advisor.id
                )
              }
              disabled={loading === SUBSCRIPTION_TIERS.advisor.id || !stripeConfigured}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700"
            >
              {loading === SUBSCRIPTION_TIERS.advisor.id
                ? 'Loading...'
                : 'Start Advisor Plan'}
            </button>
          </div>

          {/* Enterprise Tier */}
          <div className="glass-card p-8 flex flex-col border-2 border-emerald-500/50 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-green-500 text-black px-4 py-1 rounded-full text-sm font-bold">
              Best Value
            </div>

            <div className="mb-6">
              <div className="text-emerald-400 text-sm font-medium mb-2">
                {SUBSCRIPTION_TIERS.enterprise.targetAudience}
              </div>
              <h3 className="text-2xl font-bold mb-2">{SUBSCRIPTION_TIERS.enterprise.name}</h3>
              <div className="text-4xl font-bold mb-2">
                {formatPrice(SUBSCRIPTION_TIERS.enterprise.price)}
                <span className="text-lg text-gray-400">/month</span>
              </div>
              <p className="text-gray-400">Billed monthly</p>
            </div>

            <div className="flex-1 mb-6">
              <ul className="space-y-2">
                {SUBSCRIPTION_TIERS.enterprise.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() =>
                handleSubscribe(
                  SUBSCRIPTION_TIERS.enterprise.stripePriceId,
                  SUBSCRIPTION_TIERS.enterprise.id
                )
              }
              disabled={loading === SUBSCRIPTION_TIERS.enterprise.id || !stripeConfigured}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
            >
              {loading === SUBSCRIPTION_TIERS.enterprise.id
                ? 'Loading...'
                : 'Start Enterprise Plan'}
            </button>
          </div>
        </div>
      )}

      {/* One-Time Purchases Section */}
      <div className="max-w-6xl mx-auto mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">One-Time Purchases</h2>
          <p className="text-gray-400">
            Get specific features without a subscription
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Tax Package Basic */}
          <div className={`glass-card p-8 flex flex-col ${!taxSeasonActive ? 'opacity-60' : ''}`}>
            <div className="mb-4">
              {taxSeasonActive ? (
                <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full mb-3">
                  Available Now
                </span>
              ) : (
                <span className="inline-block px-3 py-1 bg-gray-500/20 text-gray-400 text-xs font-medium rounded-full mb-3">
                  Available Jan - Apr
                </span>
              )}
              <h3 className="text-xl font-bold mb-2">Tax Report Package</h3>
              <div className="text-3xl font-bold mb-2">
                {formatPrice(TAX_PACKAGE.price)}
                <span className="text-sm text-gray-400 ml-2">one-time</span>
              </div>
              <p className="text-gray-400 text-sm">{TAX_PACKAGE.description}</p>
            </div>

            <div className="flex-1 mb-6">
              <ul className="space-y-2">
                {TAX_PACKAGE.features.basic.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleTaxPackagePurchase('basic')}
              disabled={loading === 'tax-basic' || !stripeConfigured || !taxSeasonActive}
              className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'tax-basic'
                ? 'Loading...'
                : taxSeasonActive
                ? 'Buy Tax Package'
                : 'Coming Soon'}
            </button>
          </div>

          {/* Tax Package Premium */}
          <div className={`glass-card p-8 flex flex-col border-2 border-purple-500/50 relative ${!taxSeasonActive ? 'opacity-60' : ''}`}>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-bold">
              Recommended
            </div>

            <div className="mb-4">
              {taxSeasonActive ? (
                <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full mb-3">
                  Available Now
                </span>
              ) : (
                <span className="inline-block px-3 py-1 bg-gray-500/20 text-gray-400 text-xs font-medium rounded-full mb-3">
                  Available Jan - Apr
                </span>
              )}
              <h3 className="text-xl font-bold mb-2">Tax Report Package Pro</h3>
              <div className="text-3xl font-bold mb-2">
                {formatPrice(TAX_PACKAGE.premiumPrice)}
                <span className="text-sm text-gray-400 ml-2">one-time</span>
              </div>
              <p className="text-gray-400 text-sm">Enhanced tax reporting with integrations</p>
            </div>

            <div className="flex-1 mb-6">
              <ul className="space-y-2">
                {TAX_PACKAGE.features.premium.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-purple-500 mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleTaxPackagePurchase('premium')}
              disabled={loading === 'tax-premium' || !stripeConfigured || !taxSeasonActive}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'tax-premium'
                ? 'Loading...'
                : taxSeasonActive
                ? 'Buy Pro Package'
                : 'Coming Soon'}
            </button>
          </div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-6xl mx-auto mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Compare All Features</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 px-4 font-medium text-gray-400">Feature</th>
                <th className="text-center py-4 px-4 font-medium text-gray-400">Free</th>
                <th className="text-center py-4 px-4 font-medium text-purple-400">Premium</th>
                <th className="text-center py-4 px-4 font-medium text-blue-400">Advisor</th>
                <th className="text-center py-4 px-4 font-medium text-emerald-400">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {featureComparison.map((row, index) => (
                <tr
                  key={index}
                  className={`border-b border-gray-800 ${
                    index % 2 === 0 ? 'bg-gray-900/30' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-sm">{row.feature}</td>
                  <td className="py-3 px-4 text-center">{renderFeatureValue(row.free)}</td>
                  <td className="py-3 px-4 text-center">{renderFeatureValue(row.premium)}</td>
                  <td className="py-3 px-4 text-center">{renderFeatureValue(row.advisor)}</td>
                  <td className="py-3 px-4 text-center">{renderFeatureValue(row.enterprise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto mt-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-2">Can I switch plans later?</h3>
            <p className="text-gray-400">
              Yes! You can upgrade, downgrade, or cancel your subscription at any time from your
              profile page. Changes take effect at the start of your next billing cycle.
            </p>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-400">
              We accept all major credit cards (Visa, Mastercard, American Express, Discover)
              through our secure payment processor, Stripe.
            </p>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-2">Is there a refund policy?</h3>
            <p className="text-gray-400">
              Yes, we offer a 30-day money-back guarantee. If you're not satisfied with your
              premium membership, contact us within 30 days for a full refund.
            </p>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-2">What happens if I cancel?</h3>
            <p className="text-gray-400">
              You'll retain premium access until the end of your current billing period, then
              automatically revert to the free tier. Your data and settings are preserved.
            </p>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-2">Can I buy features without subscribing?</h3>
            <p className="text-gray-400">
              Yes! We offer one-time purchases like the Tax Report Package that don't require a
              subscription. These are perfect if you only need specific features occasionally.
            </p>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-2">Do you offer discounts for students or nonprofits?</h3>
            <p className="text-gray-400">
              Yes! We offer 50% off annual plans for students and nonprofit organizations.
              Contact us with proof of eligibility to receive your discount code.
            </p>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-2">What's the difference between Advisor and Enterprise?</h3>
            <p className="text-gray-400">
              Advisor is designed for independent financial advisors with up to 10 clients.
              Enterprise is for larger firms needing unlimited clients, team access, API integration,
              and dedicated support with custom solutions.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto mt-16 text-center glass-card p-12">
        <h2 className="text-3xl font-bold mb-4">Ready to Level Up Your Crypto Journey?</h2>
        <p className="text-xl text-gray-400 mb-8">
          Join thousands of investors who trust Bitcoin Investments for crypto education and tools.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/signup" className="btn-secondary">
            Start Free
          </Link>
          <button
            onClick={() =>
              handleSubscribe(
                SUBSCRIPTION_TIERS.annual.stripePriceId,
                SUBSCRIPTION_TIERS.annual.id
              )
            }
            disabled={loading === SUBSCRIPTION_TIERS.annual.id || !stripeConfigured}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading === SUBSCRIPTION_TIERS.annual.id ? 'Loading...' : 'Go Premium'}
          </button>
          <Link to="/contact" className="btn-secondary">
            Contact Sales
          </Link>
        </div>
      </div>
    </div>
  );
}
