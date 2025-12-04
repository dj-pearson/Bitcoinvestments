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

export function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const savings = calculateAnnualSavings();
  const stripeConfigured = isStripeConfigured();

  const handleSubscribe = async (priceId: string, tierId: string) => {
    if (!user) {
      // Redirect to login if not authenticated
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

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Start with our free tier and upgrade anytime for premium features,
          ad-free experience, and priority support.
        </p>
        {!stripeConfigured && (
          <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg max-w-2xl mx-auto">
            <p className="text-yellow-400">
              Payment system is being configured. Check back soon!
            </p>
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
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
          {/* Popular Badge */}
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
            <h3 className="text-xl font-semibold mb-2">Do you offer discounts for students or nonprofits?</h3>
            <p className="text-gray-400">
              Yes! We offer 50% off annual plans for students and nonprofit organizations.
              Contact us with proof of eligibility to receive your discount code.
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
        <div className="flex justify-center gap-4">
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
        </div>
      </div>
    </div>
  );
}
