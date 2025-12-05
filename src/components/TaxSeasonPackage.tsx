/**
 * TaxSeasonPackage Component
 *
 * Displays and manages the Tax Season Report Package - a one-time purchase
 * available January through April that allows users to generate tax reports.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { hasTaxReportPurchase, getTaxReportPackageType } from '../services/database';
import { TAX_PACKAGE, isTaxSeasonActive } from '../services/subscriptionLimits';
import { formatPrice } from '../services/stripe';

interface TaxSeasonPackageProps {
  className?: string;
  variant?: 'card' | 'banner' | 'inline';
}

export function TaxSeasonPackage({
  className = '',
  variant = 'card',
}: TaxSeasonPackageProps) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [packageType, setPackageType] = useState<'basic' | 'premium' | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<'basic' | 'premium'>('basic');

  const isActive = isTaxSeasonActive();

  useEffect(() => {
    async function loadData() {
      const user = await getCurrentUser();
      if (user) {
        setUserId(user.id);

        // Check if user already purchased
        const purchased = await hasTaxReportPurchase(user.id, TAX_PACKAGE.taxYear);
        setHasPurchased(purchased);

        if (purchased) {
          const type = await getTaxReportPackageType(user.id, TAX_PACKAGE.taxYear);
          setPackageType(type);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // Don't show if not tax season and not purchased
  if (!isActive && !hasPurchased) {
    return null;
  }

  const handlePurchase = async (type: 'basic' | 'premium') => {
    if (!userId) {
      // Redirect to login
      window.location.href = '/login?redirect=/pricing&package=tax';
      return;
    }

    // Create checkout session for one-time payment
    try {
      const priceId = type === 'basic'
        ? TAX_PACKAGE.stripePriceId.basic
        : TAX_PACKAGE.stripePriceId.premium;

      const response = await fetch('/api/create-tax-package-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          userId,
          packageType: type,
          taxYear: TAX_PACKAGE.taxYear,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        console.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-800 rounded-xl p-6 border border-gray-700 animate-pulse ${className}`}>
        <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  // Banner variant - simple promotional banner
  if (variant === 'banner') {
    if (hasPurchased) return null;

    return (
      <div className={`bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">Tax Season Package Available</p>
              <p className="text-gray-400 text-sm">
                Generate your {TAX_PACKAGE.taxYear} crypto tax reports from {formatPrice(TAX_PACKAGE.price)}
              </p>
            </div>
          </div>
          <Link
            to="/pricing?tab=tax"
            className="py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg whitespace-nowrap transition-colors"
          >
            Learn More
          </Link>
        </div>
      </div>
    );
  }

  // Card variant - full feature card
  return (
    <div className={`bg-gray-800 rounded-xl border border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
        <div className="flex items-center gap-3 mb-2">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div>
            <h3 className="text-xl font-bold text-white">{TAX_PACKAGE.name}</h3>
            <p className="text-blue-200 text-sm">For Tax Year {TAX_PACKAGE.taxYear}</p>
          </div>
        </div>
        <p className="text-blue-100">{TAX_PACKAGE.description}</p>
      </div>

      {/* Content */}
      <div className="p-6">
        {hasPurchased ? (
          // Already purchased - show access
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="text-white font-semibold text-lg mb-2">
              {packageType === 'premium' ? 'Premium' : 'Basic'} Package Purchased
            </h4>
            <p className="text-gray-400 mb-6">
              You have access to generate your {TAX_PACKAGE.taxYear} tax reports.
            </p>
            <Link
              to="/calculators/tax"
              className="inline-block py-3 px-6 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
            >
              Generate Tax Report
            </Link>
          </div>
        ) : (
          // Purchase options
          <>
            {/* Package selector */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setSelectedPackage('basic')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  selectedPackage === 'basic'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="text-left">
                  <p className="text-white font-semibold">Basic</p>
                  <p className="text-2xl font-bold text-white">{formatPrice(TAX_PACKAGE.price)}</p>
                  <p className="text-gray-400 text-sm">One-time payment</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedPackage('premium')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all relative ${
                  selectedPackage === 'premium'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-purple-500 text-white text-xs font-semibold rounded-full">
                  Popular
                </span>
                <div className="text-left">
                  <p className="text-white font-semibold">Premium</p>
                  <p className="text-2xl font-bold text-white">{formatPrice(TAX_PACKAGE.premiumPrice)}</p>
                  <p className="text-gray-400 text-sm">One-time payment</p>
                </div>
              </button>
            </div>

            {/* Features list */}
            <div className="mb-6">
              <h4 className="text-white font-medium mb-3">
                {selectedPackage === 'premium' ? 'Premium' : 'Basic'} Features:
              </h4>
              <ul className="space-y-2">
                {(selectedPackage === 'premium'
                  ? TAX_PACKAGE.features.premium
                  : TAX_PACKAGE.features.basic
                ).map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-300 text-sm">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Purchase button */}
            <button
              onClick={() => handlePurchase(selectedPackage)}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-colors"
            >
              {userId ? 'Purchase Package' : 'Sign In to Purchase'}
            </button>

            <p className="text-center text-gray-500 text-xs mt-4">
              Secure payment via Stripe. Available until April 30th.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Tax season countdown/status indicator
 */
export function TaxSeasonStatus({ className = '' }: { className?: string }) {
  const isActive = isTaxSeasonActive();
  const currentMonth = new Date().getMonth() + 1;

  if (!isActive) {
    // Show when tax season will start
    const monthsUntil = currentMonth > 4 ? 12 - currentMonth + 1 : 1 - currentMonth;
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-400 ${className}`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>Tax season starts in {monthsUntil} month{monthsUntil !== 1 ? 's' : ''}</span>
      </div>
    );
  }

  // Show remaining time in tax season
  const monthsRemaining = 4 - currentMonth + 1;
  return (
    <div className={`flex items-center gap-2 text-sm text-green-400 ${className}`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Tax season ends in {monthsRemaining} month{monthsRemaining !== 1 ? 's' : ''}</span>
    </div>
  );
}
