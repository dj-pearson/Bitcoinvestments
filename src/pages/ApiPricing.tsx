/**
 * /developers/pricing (and, for now, /developers/docs)
 *
 * Describes only what functions/api/v1/* actually implements. Keys are issued
 * from /developers/portal, which needs accounts, so while STATIC_MODE is on
 * nobody can get a key and the page offers a waitlist instead of checkout.
 *
 * NEEDS-OWNER: the market endpoints re-serve CoinGecko data. Charging for that
 * data likely needs a paid CoinGecko plan that allows redistribution - confirm
 * CoinGecko's terms before selling API plans.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getApiTiers, type ApiTierDetails } from '../services/apiAccess';
import { isStripeConfigured, formatPrice } from '../services/stripe';
import { STATIC_MODE } from '../config/staticMode';
import { Newsletter } from '../components/Newsletter';
import { PageSEO } from '../components/PageSEO';

const LAST_REVIEWED_ISO = '2026-09-23';
const LAST_REVIEWED_LABEL = 'September 23, 2026';
const API_BASE = 'https://bitcoinvestments.net/api/v1';

// API tier Stripe price IDs. A tier is sold only when its ID is configured.
const API_STRIPE_PRICES: Record<string, string> = {
  starter: import.meta.env.VITE_STRIPE_API_STARTER || '',
  professional: import.meta.env.VITE_STRIPE_API_PROFESSIONAL || '',
  enterprise: import.meta.env.VITE_STRIPE_API_ENTERPRISE || '',
};

interface Endpoint {
  method: 'GET' | 'POST';
  path: string;
  summary: string;
  params: Array<{ name: string; description: string }>;
  access: string;
  response: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/market/prices',
    summary: 'Current price, 24-hour change, 24-hour volume and market cap for one or more coins.',
    params: [
      { name: 'symbols', description: 'Comma-separated tickers, up to 100 (default BTC,ETH). Common tickers such as BTC, ETH and SOL are mapped for you; anything else is treated as a CoinGecko coin ID.' },
      { name: 'currency', description: 'Quote currency (default USD).' },
    ],
    access: 'Any active key',
    response: `{
  "prices": {
    "BTC": { "price": <number>, "change24h": <number>, "volume24h": <number>, "marketCap": <number> }
  },
  "currency": "USD",
  "timestamp": "<ISO 8601 time of the request>"
}`,
  },
  {
    method: 'GET',
    path: '/market/historical',
    summary: 'Daily price history for one coin.',
    params: [
      { name: 'symbol', description: 'Ticker or CoinGecko coin ID (default BTC).' },
      { name: 'days', description: 'Days of history (default 30). Up to 365 on Professional; up to 3,650 on Enterprise.' },
      { name: 'currency', description: 'Quote currency (default USD).' },
      { name: 'interval', description: 'Passed to CoinGecko (default daily).' },
    ],
    access: 'Professional or Enterprise keys',
    response: `{
  "symbol": "BTC",
  "currency": "USD",
  "interval": "daily",
  "data": [ { "timestamp": "...", "close": <number>, "volume": <number>, "marketCap": <number>, ... } ],
  "dataPoints": <number>
}
// Only "close" is a real price. "open" repeats the close and "high"/"low" are
// placeholders (close +/- 0.1%), so don't use them as OHLC data.`,
  },
  {
    method: 'GET',
    path: '/portfolio',
    summary: "List the key owner's portfolios and their holdings (amount and average buy price).",
    params: [],
    access: 'Keys with the portfolio:read permission',
    response: `{ "portfolios": [ { "id": "...", "name": "...", "holdings": [ ... ] } ], "count": <number> }`,
  },
  {
    method: 'POST',
    path: '/portfolio',
    summary: 'Create a portfolio for the key owner. JSON body: { "name": string, "isDefault"?: boolean }.',
    params: [],
    access: 'Keys with the portfolio:write permission',
    response: `{ "portfolio": { "id": "...", "name": "...", "isDefault": false, "createdAt": "..." } }`,
  },
];

const API_FAQS = [
  {
    question: 'Can I get an API key today?',
    answer: STATIC_MODE
      ? 'Not yet. Keys are created from a developer portal that needs an account, and accounts are not open. Join the waitlist on this page to hear when they are.'
      : 'Yes. Sign in and create a key in the developer portal. Keys start with bv_live_ or bv_test_.',
  },
  {
    question: 'Where does the market data come from?',
    answer:
      'The market endpoints fetch prices from CoinGecko at request time and reshape the response. We do not run our own price feed.',
  },
  {
    question: 'How are rate limits enforced?',
    answer:
      'Each key has a per-minute and a per-day request limit. Every response carries X-RateLimit-Limit and X-RateLimit-Remaining headers, and going over a limit returns HTTP 429.',
  },
  {
    question: 'Is there a sandbox?',
    answer:
      'No. Keys starting with bv_test_ are accepted, but they call the same endpoints and data as live keys. There is no separate test environment.',
  },
];

function EndpointDocs() {
  return (
    <section aria-labelledby="endpoints-heading" className="max-w-4xl mx-auto mb-16">
      <h2 id="endpoints-heading" className="text-3xl font-bold mb-4">Endpoints</h2>
      <p className="text-gray-400 mb-2">
        Base URL: <code className="bg-gray-800 px-2 py-1 rounded">{API_BASE}</code>
      </p>
      <p className="text-gray-400 mb-8">
        Send your key as <code className="bg-gray-800 px-1 rounded">Authorization: Bearer &lt;key&gt;</code> or{' '}
        <code className="bg-gray-800 px-1 rounded">X-API-Key: &lt;key&gt;</code>. Errors are JSON:{' '}
        <code className="bg-gray-800 px-1 rounded">{'{ "error", "message", "code" }'}</code> with status 400, 401, 403,
        429 or 500.
      </p>
      <div className="space-y-6">
        {ENDPOINTS.map((ep) => (
          <article key={`${ep.method} ${ep.path}`} className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-2 font-mono">
              <span className={ep.method === 'GET' ? 'text-green-400' : 'text-blue-400'}>{ep.method}</span>{' '}
              /api/v1{ep.path}
            </h3>
            <p className="text-gray-300 mb-2">{ep.summary}</p>
            <p className="text-sm text-gray-400 mb-3">Access: {ep.access}</p>
            {ep.params.length > 0 && (
              <dl className="text-sm mb-3 space-y-1">
                {ep.params.map((p) => (
                  <div key={p.name} className="flex flex-col sm:flex-row sm:gap-2">
                    <dt className="font-mono text-purple-300 sm:w-24 flex-shrink-0">{p.name}</dt>
                    <dd className="text-gray-400">{p.description}</dd>
                  </div>
                ))}
              </dl>
            )}
            <pre className="bg-gray-900/60 p-4 rounded-lg overflow-x-auto text-xs text-gray-300">
              <code>{ep.response}</code>
            </pre>
          </article>
        ))}
      </div>
      <div className="glass-card p-6 mt-6">
        <h3 className="text-lg font-semibold mb-2">Example request</h3>
        <pre className="bg-gray-900/60 p-4 rounded-lg overflow-x-auto text-xs text-gray-300">
          <code>{`const res = await fetch('${API_BASE}/market/prices?symbols=BTC,ETH', {
  headers: { Authorization: 'Bearer bv_live_your_key_here' },
});
const { prices, timestamp } = await res.json();`}</code>
        </pre>
      </div>
    </section>
  );
}

function TierTable({
  tiers,
  onSubscribe,
  loading,
}: {
  tiers: ApiTierDetails[];
  onSubscribe?: (tier: ApiTierDetails) => void;
  loading: string | null;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">API tiers and limits</caption>
        <thead>
          <tr className="border-b border-gray-700 text-left text-gray-400">
            <th scope="col" className="py-3 pr-4">Tier</th>
            <th scope="col" className="py-3 pr-4">Price</th>
            <th scope="col" className="py-3 pr-4">Requests / minute</th>
            <th scope="col" className="py-3 pr-4">Requests / day</th>
            <th scope="col" className="py-3 pr-4">Historical endpoint</th>
            {onSubscribe && <th scope="col" className="py-3"><span className="sr-only">Action</span></th>}
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier) => {
            const sellable = tier.tier === 'free' || Boolean(API_STRIPE_PRICES[tier.tier]);
            return (
              <tr key={tier.tier} className="border-b border-gray-800">
                <th scope="row" className="py-3 pr-4 text-left font-semibold">{tier.name}</th>
                <td className="py-3 pr-4">{tier.priceMonthly === 0 ? 'Free' : `${formatPrice(tier.priceMonthly)}/month`}</td>
                <td className="py-3 pr-4">{tier.rateLimitPerMinute.toLocaleString('en-US')}</td>
                <td className="py-3 pr-4">{tier.rateLimitPerDay.toLocaleString('en-US')}</td>
                <td className="py-3 pr-4">
                  {tier.tier === 'enterprise' ? 'Up to 10 years' : tier.tier === 'professional' ? 'Up to 1 year' : 'No'}
                </td>
                {onSubscribe && (
                  <td className="py-3">
                    {sellable ? (
                      <button
                        type="button"
                        onClick={() => onSubscribe(tier)}
                        disabled={loading === tier.tier}
                        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                      >
                        {loading === tier.tier ? 'Loading…' : tier.tier === 'free' ? 'Get a key' : 'Subscribe'}
                      </button>
                    ) : (
                      <span className="text-gray-400">Not on sale</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ApiPricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
    const priceId = API_STRIPE_PRICES[tier.tier];
    if (!isStripeConfigured() || !priceId) {
      setError('This plan is not on sale yet.');
      return;
    }
    setLoading(tier.tier);
    setError(null);
    try {
      const response = await fetch('/api/create-api-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          userEmail: user.email || '',
          tier: tier.tier,
          billingCycle: 'monthly',
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

  return (
    <div className="container mx-auto px-4 py-12">
      <PageSEO pageKey="apiPricing" urlPath="/developers/pricing" faqs={API_FAQS} />

      <header className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Bitcoinvestments Developer API</h1>
        <p className="text-xl text-gray-300">
          A small REST API with three endpoints: current prices, daily price history and your own
          portfolios. Market data comes from CoinGecko.{' '}
          {STATIC_MODE
            ? 'API keys are not available yet; join the waitlist below to hear when they are.'
            : 'Create a key in the developer portal to get started.'}
        </p>
        <p className="text-sm text-gray-400 mt-4">
          Last reviewed: <time dateTime={LAST_REVIEWED_ISO}>{LAST_REVIEWED_LABEL}</time>
        </p>
      </header>

      {STATIC_MODE ? (
        <section aria-labelledby="api-waitlist-heading" className="max-w-4xl mx-auto mb-16 grid md:grid-cols-2 gap-8 items-start">
          <div className="glass-card p-8">
            <h2 id="api-waitlist-heading" className="text-2xl font-bold mb-3">Not open yet</h2>
            <p className="text-gray-400 mb-4">
              Keys are issued from the developer portal, which needs an account. Accounts are
              switched off for now, so there is no way to get a key or pay for a plan today.
            </p>
            <p className="text-gray-400">
              The endpoints are documented below so you can see what the API does. Tier prices and
              limits will be published when keys become available.
            </p>
          </div>
          <Newsletter
            source="api-waitlist"
            variant="card"
            heading="Join the API waitlist"
            description="We'll email you when API keys are available. You'll also get our weekly crypto email; unsubscribe at any time."
          />
        </section>
      ) : (
        <section aria-labelledby="tiers-heading" className="max-w-5xl mx-auto mb-16">
          <h2 id="tiers-heading" className="text-3xl font-bold mb-6">Tiers and limits</h2>
          {error && (
            <div role="alert" className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}
          <TierTable tiers={tiers} onSubscribe={handleSubscribe} loading={loading} />
        </section>
      )}

      <EndpointDocs />

      <section aria-labelledby="api-faq-heading" className="max-w-4xl mx-auto">
        <h2 id="api-faq-heading" className="text-3xl font-bold mb-8 text-center">API FAQ</h2>
        <div className="space-y-4">
          {API_FAQS.map((faq) => (
            <div key={faq.question} className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
              <p className="text-gray-400">{faq.answer}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-400 mt-8 text-center">
          API use is covered by our{' '}
          <Link to="/terms#api" className="text-purple-400 underline">
            Terms of Service
          </Link>
          . Questions:{' '}
          <a href="mailto:support@bitcoinvestments.net?subject=Bitcoinvestments%20API" className="text-purple-400 underline">
            support@bitcoinvestments.net
          </a>
        </p>
      </section>
    </div>
  );
}
