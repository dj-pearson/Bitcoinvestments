/**
 * UpgradePrompt Component
 *
 * Reusable component for showing upgrade prompts when users hit free tier limits.
 * Can be displayed inline, as a modal, or as a banner.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';

interface UpgradePromptProps {
  /** Type of limit reached */
  limitType: 'assets' | 'alerts' | 'tax-reports' | 'data-delay' | 'cloud-sync' | 'general';
  /** Current count (for assets/alerts) */
  currentCount?: number;
  /** Maximum allowed (for assets/alerts) */
  maxCount?: number;
  /** Display variant */
  variant?: 'inline' | 'modal' | 'banner';
  /** Optional callback when dismissed */
  onDismiss?: () => void;
  /** Optional callback when upgrade clicked */
  onUpgrade?: () => void;
  /** Custom title */
  title?: string;
  /** Custom description */
  description?: string;
  /** Class name for styling */
  className?: string;
}

const limitMessages = {
  assets: {
    title: 'Portfolio Asset Limit Reached',
    description: 'Free users can track up to 10 assets. Upgrade to Premium for unlimited portfolio tracking.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  alerts: {
    title: 'Price Alert Limit Reached',
    description: 'Free users can have up to 3 active price alerts. Upgrade to Premium for unlimited alerts with email notifications.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  'tax-reports': {
    title: 'Tax Report Export',
    description: 'Export comprehensive tax reports for easy filing. Get your crypto tax documents ready for tax season.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  'data-delay': {
    title: 'Real-Time Data',
    description: 'Free users see 15-minute delayed prices. Upgrade to Premium for real-time market data.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  'cloud-sync': {
    title: 'Cloud Portfolio Sync',
    description: 'Your portfolio is stored locally. Upgrade to Premium to sync across devices and never lose your data.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    ),
  },
  general: {
    title: 'Upgrade to Premium',
    description: 'Unlock unlimited features, real-time data, and priority support with Premium.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
};

export function UpgradePrompt({
  limitType,
  currentCount,
  maxCount,
  variant = 'inline',
  onDismiss,
  onUpgrade,
  title,
  description,
  className = '',
}: UpgradePromptProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const message = limitMessages[limitType];
  const displayTitle = title || message.title;
  const displayDescription = description || message.description;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (variant === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className={`bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700 ${className}`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-500">
              {message.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">{displayTitle}</h3>
              <p className="text-gray-400 text-sm mb-4">{displayDescription}</p>

              {currentCount !== undefined && maxCount !== undefined && (
                <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Current usage</span>
                    <span className="text-white font-medium">{currentCount} / {maxCount}</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (currentCount / maxCount) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Link
                  to="/pricing"
                  onClick={onUpgrade}
                  className="flex-1 py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg text-center transition-colors"
                >
                  Upgrade to Premium
                </Link>
                <button
                  onClick={handleDismiss}
                  className="py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-orange-500">{message.icon}</div>
            <div>
              <p className="text-white font-medium">{displayTitle}</p>
              <p className="text-gray-400 text-sm">{displayDescription}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/pricing"
              onClick={onUpgrade}
              className="py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg whitespace-nowrap transition-colors"
            >
              Upgrade
            </Link>
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className="p-2 text-gray-400 hover:text-white transition-colors"
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

  // Inline variant (default)
  return (
    <div className={`bg-gray-700/50 border border-gray-600 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center text-orange-500">
          {message.icon}
        </div>
        <div className="flex-1">
          <h4 className="text-white font-medium mb-1">{displayTitle}</h4>
          <p className="text-gray-400 text-sm mb-3">{displayDescription}</p>

          {currentCount !== undefined && maxCount !== undefined && (
            <p className="text-sm text-gray-400 mb-3">
              You're using <span className="text-white font-medium">{currentCount}</span> of{' '}
              <span className="text-white font-medium">{maxCount}</span> available.
            </p>
          )}

          <Link
            to="/pricing"
            onClick={onUpgrade}
            className="inline-block py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Upgrade to Premium
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Data delay indicator for free users
 */
export function DataDelayIndicator({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm text-yellow-500 ${className}`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>15-min delayed</span>
      <Link to="/pricing" className="text-orange-500 hover:text-orange-400 underline">
        Get real-time
      </Link>
    </div>
  );
}

/**
 * Premium badge component
 */
export function PremiumBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs font-semibold rounded-full ${className}`}>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      Premium
    </span>
  );
}

/**
 * Limit counter component
 */
export function LimitCounter({
  current,
  max,
  label,
  className = '',
}: {
  current: number;
  max: number;
  label: string;
  className?: string;
}) {
  const percentage = (current / max) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= max;

  return (
    <div className={`text-sm ${className}`}>
      <div className="flex justify-between mb-1">
        <span className="text-gray-400">{label}</span>
        <span className={`font-medium ${isAtLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-white'}`}>
          {current} / {max}
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${
            isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  );
}
