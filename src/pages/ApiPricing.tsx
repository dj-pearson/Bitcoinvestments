import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getApiTiers, type ApiTierDetails } from '../services/apiAccess';
import { isStripeConfigured, formatPrice } from '../services/stripe';

import { PageSEO } from '../components/PageSEO';
// API tier Stripe price IDs
const API_STRIPE_PRICES = {
  starter: import.meta.env.VITE_STRIPE_API_STARTER || 'price_api_starter_placeholder',
  professional: import.meta.env.VITE_STRIPE_API_PROFESSIONAL || 'price_api_professional_placeholder',
  enterprise: import.meta.env.VITE_STRIPE_API_ENTERPRISE || 'price_api_enterprise_placeholder',
};

export function ApiPricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const stripeConfigured = isStripeConfigured();

  const tiers = getApiTiers();

  const handleSubscribe = async (tier: ApiTierDetails) => {
    if (tier.tier === 'free') {
      navigate('/developers/portal');
      return;
    }

    if (!user) {
      navigate('/login?redirect=/developers/pricing');
      return;
    }

    if (!stripeConfigured) {
      setError('Payment system is not configured. Please contact support.');
      return;
    }

    setLoading(tier.tier);
    setError(null);

    try {
      const priceId = API_STRIPE_PRICES[tier.tier as keyof typeof API_STRIPE_PRICES];

      const response = await fetch('/api/create-api-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          userEmail: user.email,
          tier: tier.tier,
          billingCycle,
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

  const getPrice = (tier: ApiTierDetails) => {
    if (billingCycle === 'yearly') {
      return tier.priceYearly / 12;
    }
    return tier.priceMonthly;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'gray';
      case 'starter': return 'blue';
      case 'professional': return 'purple';
      case 'enterprise': return 'emerald';
      default: return 'gray';
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <PageSEO pageKey="apiPricing" urlPath="/developers/pricing" />
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full mb-6">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <span className="text-purple-300 text-sm font-medium">Developer API</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Build with Our API
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
          Access real-time crypto data, portfolio management, and analytics through our powerful REST API.
          Perfect for developers, traders, and fintech applications.
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex bg-gray-800 rounded-lg p-1 mb-8">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors relative ${
              billingCycle === 'yearly'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Yearly
            <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-black text-xs font-bold rounded-full">
              -17%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
        {tiers.map((tier) => {
          const color = getTierColor(tier.tier);
          const isPopular = tier.tier === 'professional';

          return (
            <div
              key={tier.tier}
              className={`glass-card p-8 flex flex-col relative ${
                isPopular ? `border-2 border-${color}-500/50` : ''
              }`}
            >
              {isPopular && (
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 bg-${color}-500 text-white px-4 py-1 rounded-full text-sm font-bold`}>
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{tier.description}</p>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">
                    {formatPrice(getPrice(tier))}
                  </span>
                  {tier.priceMonthly > 0 && (
                    <span className="text-gray-400">/month</span>
                  )}
                </div>

                {billingCycle === 'yearly' && tier.priceYearly > 0 && (
                  <p className="text-sm text-green-400 mt-1">
                    Billed {formatPrice(tier.priceYearly)}/year
                  </p>
                )}
              </div>

              {/* Rate Limits */}
              <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Requests/min</span>
                  <span className="font-semibold">{tier.rateLimitPerMinute.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Requests/day</span>
                  <span className="font-semibold">{tier.rateLimitPerDay.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">API Keys</span>
                  <span className="font-semibold">{tier.maxKeys === -1 ? 'Unlimited' : tier.maxKeys}</span>
                </div>
              </div>

              {/* Features */}
              <div className="flex-1 mb-6">
                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className={`w-5 h-5 text-${color}-500 mr-2 flex-shrink-0 mt-0.5`}
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

                {/* Additional Details */}
                <div className="mt-4 pt-4 border-t border-gray-700 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={tier.realtimeData ? 'text-green-400' : 'text-gray-500'}>
                      {tier.realtimeData ? '✓' : '✗'}
                    </span>
                    <span className="text-gray-400">Real-time data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={tier.webhooks ? 'text-green-400' : 'text-gray-500'}>
                      {tier.webhooks ? '✓' : '✗'}
                    </span>
                    <span className="text-gray-400">Webhooks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Historical data:</span>
                    <span>{tier.historicalData}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Support:</span>
                    <span>{tier.supportLevel}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSubscribe(tier)}
                disabled={loading === tier.tier || (!stripeConfigured && tier.tier !== 'free')}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  tier.tier === 'free'
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : isPopular
                    ? `bg-${color}-500 hover:bg-${color}-600 text-white`
                    : `border border-${color}-500 text-${color}-400 hover:bg-${color}-500/10`
                }`}
              >
                {loading === tier.tier
                  ? 'Loading...'
                  : tier.tier === 'free'
                  ? 'Get Started Free'
                  : tier.tier === 'enterprise'
                  ? 'Contact Sales'
                  : 'Subscribe'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* API Features Section */}
      <div className="max-w-6xl mx-auto mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center">API Capabilities</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="glass-card p-6">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Market Data</h3>
            <p className="text-gray-400">
              Real-time and historical price data for 10,000+ cryptocurrencies.
              OHLCV data, market caps, volumes, and more.
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Portfolio Management</h3>
            <p className="text-gray-400">
              Create, read, update, and delete portfolios. Track holdings,
              transactions, and calculate performance metrics.
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Analytics</h3>
            <p className="text-gray-400">
              Advanced analytics including performance metrics, risk analysis,
              portfolio correlations, and AI-powered insights.
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Webhooks</h3>
            <p className="text-gray-400">
              Receive real-time notifications for price alerts, portfolio changes,
              and market events via webhooks.
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Tax Reports</h3>
            <p className="text-gray-400">
              Generate tax reports with capital gains calculations,
              cost basis tracking, and IRS-compatible exports.
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Multi-User</h3>
            <p className="text-gray-400">
              Manage multiple client portfolios, team access, and
              white-label solutions for enterprise applications.
            </p>
          </div>
        </div>
      </div>

      {/* Code Example */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Quick Start</h2>

        <div className="glass-card p-6 overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="ml-4 text-gray-400 text-sm">Example Request</span>
          </div>

          <pre className="bg-gray-900/50 p-4 rounded-lg overflow-x-auto text-sm">
            <code className="text-gray-300">
{`// Get current Bitcoin price
const response = await fetch('https://api.bitcoinvestments.net/v1/market/prices?symbols=BTC,ETH', {
  headers: {
    'Authorization': 'Bearer bv_live_your_api_key_here',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
// {
//   "prices": {
//     "BTC": { "price": 65000, "change24h": 2.5, "volume24h": 25000000000 },
//     "ETH": { "price": 2450, "change24h": -1.2, "volume24h": 12000000000 }
//   },
//   "timestamp": "2024-12-22T10:00:00Z"
// }`}
            </code>
          </pre>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto mt-16">
        <h2 className="text-3xl font-bold mb-8 text-center">API FAQ</h2>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-2">How do I get an API key?</h3>
            <p className="text-gray-400">
              Sign up for a free account and visit the{' '}
              <Link to="/developers/portal" className="text-purple-400 hover:underline">
                Developer Portal
              </Link>
              {' '}to generate your API keys. Free tier keys are available immediately.
            </p>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-2">What's the rate limit?</h3>
            <p className="text-gray-400">
              Rate limits vary by tier. Free tier allows 10 requests/minute and 100/day.
              Professional tier allows 100 requests/minute and 10,000/day. Enterprise
              has custom limits based on your needs.
            </p>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-2">Is there a sandbox environment?</h3>
            <p className="text-gray-400">
              Yes! Use test API keys (prefixed with <code className="bg-gray-800 px-2 py-1 rounded">bv_test_</code>)
              to test your integration without affecting production data or rate limits.
            </p>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-2">Can I upgrade or downgrade my plan?</h3>
            <p className="text-gray-400">
              Yes, you can change your plan at any time from the Developer Portal.
              Upgrades take effect immediately; downgrades apply at the end of your billing cycle.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto mt-16 text-center glass-card p-12">
        <h2 className="text-3xl font-bold mb-4">Ready to Build?</h2>
        <p className="text-xl text-gray-400 mb-8">
          Get started with our API in minutes. Free tier available with no credit card required.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/developers/portal" className="btn-primary">
            Get API Key
          </Link>
          <Link to="/developers/docs" className="btn-secondary">
            View Documentation
          </Link>
          <a
            href="mailto:sales@bitcoinvestments.net?subject=Bitcoinvestments%20API%20enquiry"
            className="btn-secondary"
          >
            Contact Sales
          </a>
        </div>
      </div>
    </div>
  );
}
