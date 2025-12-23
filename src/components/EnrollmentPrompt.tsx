/**
 * EnrollmentPrompt Component
 *
 * Smart contextual prompt for premium enrollment based on user behavior
 * and usage thresholds. Supports multiple display variants.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  type EnrollmentRecommendation,
  getEnrollmentPlanDetails,
} from '../services/premiumEnrollment';
import { redirectToCheckout, isStripeConfigured, SUBSCRIPTION_TIERS } from '../services/stripe';
import { TAX_PACKAGE } from '../services/subscriptionLimits';

interface EnrollmentPromptProps {
  /** The recommendation to display */
  recommendation: EnrollmentRecommendation;
  /** Display variant */
  variant?: 'inline' | 'banner' | 'modal' | 'card' | 'floating';
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Callback when CTA clicked */
  onClick?: () => void;
  /** Callback when checkout starts */
  onCheckoutStart?: () => void;
  /** Additional class name */
  className?: string;
  /** Show comparison to current plan */
  showComparison?: boolean;
}

/**
 * Get icon for trigger type
 */
function getTriggerIcon(trigger: EnrollmentRecommendation['trigger']) {
  const icons: Record<string, React.ReactNode> = {
    asset_limit_warning: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    asset_limit_reached: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    alert_limit_warning: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    alert_limit_reached: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    data_delay_frustration: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    tax_season_available: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    tax_export_blocked: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    usage_milestone: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    default: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  };

  return icons[trigger] || icons.default;
}

/**
 * Get color scheme based on priority
 */
function getPriorityColors(priority: EnrollmentRecommendation['priority']) {
  switch (priority) {
    case 'critical':
      return {
        border: 'border-red-500/50',
        bg: 'bg-red-500/10',
        icon: 'text-red-500',
        button: 'bg-red-500 hover:bg-red-600',
        accent: 'from-red-500 to-orange-500',
      };
    case 'high':
      return {
        border: 'border-orange-500/50',
        bg: 'bg-orange-500/10',
        icon: 'text-orange-500',
        button: 'bg-orange-500 hover:bg-orange-600',
        accent: 'from-orange-500 to-yellow-500',
      };
    case 'medium':
      return {
        border: 'border-purple-500/50',
        bg: 'bg-purple-500/10',
        icon: 'text-purple-500',
        button: 'bg-purple-500 hover:bg-purple-600',
        accent: 'from-purple-500 to-pink-500',
      };
    case 'low':
    default:
      return {
        border: 'border-blue-500/50',
        bg: 'bg-blue-500/10',
        icon: 'text-blue-500',
        button: 'bg-blue-500 hover:bg-blue-600',
        accent: 'from-blue-500 to-cyan-500',
      };
  }
}

export function EnrollmentPrompt({
  recommendation,
  variant = 'inline',
  onDismiss,
  onClick,
  onCheckoutStart,
  className = '',
  showComparison: _showComparison = false,
}: EnrollmentPromptProps) {
  // showComparison is reserved for future use
  void _showComparison;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const planDetails = getEnrollmentPlanDetails(recommendation.recommendedPlan);
  const colors = getPriorityColors(recommendation.priority);
  const stripeConfigured = isStripeConfigured();

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const handleUpgrade = async () => {
    onClick?.();

    if (!user) {
      navigate('/login?redirect=/pricing');
      return;
    }

    if (!stripeConfigured) {
      navigate('/pricing');
      return;
    }

    // Handle one-time purchases differently
    if (recommendation.oneTimePurchase) {
      navigate('/pricing');
      return;
    }

    // Get the right price ID
    let priceId: string | null = null;
    switch (recommendation.recommendedPlan) {
      case 'premium':
        priceId = SUBSCRIPTION_TIERS.monthly.stripePriceId;
        break;
      case 'annual':
        priceId = SUBSCRIPTION_TIERS.annual.stripePriceId;
        break;
      case 'advisor':
        priceId = SUBSCRIPTION_TIERS.advisor.stripePriceId;
        break;
      case 'enterprise':
        priceId = SUBSCRIPTION_TIERS.enterprise.stripePriceId;
        break;
      default:
        navigate('/pricing');
        return;
    }

    if (!priceId) {
      navigate('/pricing');
      return;
    }

    setLoading(true);
    onCheckoutStart?.();

    const { error } = await redirectToCheckout(priceId, user.id, user.email || '');

    if (error) {
      console.error('Checkout error:', error);
      navigate('/pricing');
    }
    setLoading(false);
  };

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className={`${colors.bg} border ${colors.border} rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-10 h-10 ${colors.bg} rounded-full flex items-center justify-center ${colors.icon}`}>
            {getTriggerIcon(recommendation.trigger)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium mb-1">{recommendation.title}</h4>
            <p className="text-gray-400 text-sm mb-3">{recommendation.message}</p>

            {recommendation.benefits.length > 0 && (
              <ul className="text-sm text-gray-300 mb-3 space-y-1">
                {recommendation.benefits.slice(0, 3).map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <svg className={`w-4 h-4 ${colors.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className={`py-2 px-4 ${colors.button} text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50`}
              >
                {loading ? 'Loading...' : planDetails?.ctaText || 'Upgrade Now'}
              </button>
              {recommendation.dismissable && (
                <button
                  onClick={handleDismiss}
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Maybe Later
                </button>
              )}
            </div>

            {recommendation.savingsMessage && (
              <p className="text-green-400 text-xs mt-2">{recommendation.savingsMessage}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Banner variant
  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r ${colors.accent} p-4 ${className}`}>
        <div className="container mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="text-white">{getTriggerIcon(recommendation.trigger)}</div>
            <div>
              <p className="text-white font-medium">{recommendation.title}</p>
              <p className="text-white/80 text-sm">{recommendation.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="py-2 px-4 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : planDetails?.ctaText || 'Upgrade'}
            </button>
            {recommendation.dismissable && onDismiss && (
              <button
                onClick={handleDismiss}
                className="p-2 text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <div className={`glass-card border ${colors.border} overflow-hidden ${className}`}>
        <div className={`bg-gradient-to-r ${colors.accent} p-4`}>
          <div className="flex items-center gap-3">
            <div className="text-white">{getTriggerIcon(recommendation.trigger)}</div>
            <h3 className="text-white font-bold text-lg">{recommendation.title}</h3>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-300 mb-4">{recommendation.message}</p>

          {recommendation.benefits.length > 0 && (
            <ul className="space-y-2 mb-6">
              {recommendation.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <svg className={`w-5 h-5 ${colors.icon} flex-shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-300">{benefit}</span>
                </li>
              ))}
            </ul>
          )}

          {planDetails && (
            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-baseline justify-between">
                <span className="text-gray-400">Price</span>
                <span className="text-white font-bold">
                  {planDetails.priceDisplay || `$${planDetails.price}`}
                </span>
              </div>
              {recommendation.savingsMessage && (
                <p className="text-green-400 text-sm mt-1">{recommendation.savingsMessage}</p>
              )}
            </div>
          )}

          {recommendation.urgency && (
            <div className="mb-4 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-400 text-sm text-center">
              {recommendation.urgency}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className={`flex-1 py-3 ${colors.button} text-white font-medium rounded-lg transition-colors disabled:opacity-50`}
            >
              {loading ? 'Loading...' : planDetails?.ctaText || 'Get Started'}
            </button>
            {recommendation.dismissable && (
              <button
                onClick={handleDismiss}
                className="py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Later
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Modal variant
  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className={`bg-gray-800 rounded-xl max-w-md w-full border ${colors.border} overflow-hidden ${className}`}>
          <div className={`bg-gradient-to-r ${colors.accent} p-6`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white">
                {getTriggerIcon(recommendation.trigger)}
              </div>
              <div>
                <h3 className="text-white font-bold text-xl">{recommendation.title}</h3>
                {recommendation.urgency && (
                  <p className="text-white/80 text-sm">{recommendation.urgency}</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            <p className="text-gray-300 mb-6">{recommendation.message}</p>

            {recommendation.benefits.length > 0 && (
              <div className="mb-6">
                <h4 className="text-white font-medium mb-3">What you'll get:</h4>
                <ul className="space-y-2">
                  {recommendation.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <svg className={`w-5 h-5 ${colors.icon} flex-shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {planDetails && (
              <div className="mb-6 p-4 bg-gray-700/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-white">
                  {planDetails.priceDisplay || `$${planDetails.price}`}
                </p>
                {recommendation.savingsMessage && (
                  <p className="text-green-400 text-sm mt-1">{recommendation.savingsMessage}</p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className={`flex-1 py-3 bg-gradient-to-r ${colors.accent} text-white font-medium rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50`}
              >
                {loading ? 'Loading...' : planDetails?.ctaText || 'Upgrade Now'}
              </button>
              {recommendation.dismissable && (
                <button
                  onClick={handleDismiss}
                  className="py-3 px-6 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                  Not Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Floating variant (bottom-right corner)
  if (variant === 'floating') {
    return (
      <div className={`fixed bottom-4 right-4 z-40 max-w-sm animate-slide-up ${className}`}>
        <div className={`glass-card border ${colors.border} p-4 shadow-2xl`}>
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-r ${colors.accent} rounded-full flex items-center justify-center text-white`}>
              {getTriggerIcon(recommendation.trigger)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-white font-medium">{recommendation.title}</h4>
                {recommendation.dismissable && (
                  <button
                    onClick={handleDismiss}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-gray-400 text-sm mt-1 mb-3">{recommendation.message}</p>
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className={`w-full py-2 bg-gradient-to-r ${colors.accent} text-white text-sm font-medium rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50`}
              >
                {loading ? 'Loading...' : planDetails?.ctaText || 'Upgrade'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Tax Season Banner Component
 */
export function TaxSeasonBanner({
  onDismiss,
  className = '',
}: {
  onDismiss?: () => void;
  className?: string;
}) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className={`bg-gradient-to-r from-green-600 to-emerald-600 p-4 ${className}`}>
      <div className="container mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div>
            <p className="text-white font-medium">Tax Season is Here!</p>
            <p className="text-white/80 text-sm">
              Get your crypto tax reports ready. Starts at ${TAX_PACKAGE.price}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/pricing"
            className="py-2 px-4 bg-white text-green-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            Get Tax Package
          </Link>
          {onDismiss && (
            <button
              onClick={handleDismiss}
              className="p-2 text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Add slide-up animation to global styles if not already present
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
`;
if (!document.querySelector('[data-enrollment-styles]')) {
  style.setAttribute('data-enrollment-styles', 'true');
  document.head.appendChild(style);
}
