/**
 * Newsletter Component
 *
 * Accessible newsletter subscription form with multiple variants.
 *
 * WCAG 2.1 Success Criteria:
 * - 1.3.5 Identify Input Purpose (Level AA) - autocomplete attribute
 * - 3.3.1 Error Identification (Level A) - clear error messages
 * - 4.1.3 Status Messages (Level AA) - live region announcements
 */

import { useState, useId } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { subscribeToNewsletter } from '../services/database';

interface NewsletterProps {
  source?: string;
  variant?: 'inline' | 'card' | 'footer';
}

export function Newsletter({ source = 'website', variant = 'card' }: NewsletterProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const inputId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    const result = await subscribeToNewsletter(email, source);

    if (result.success) {
      setStatus('success');
      setMessage('Thanks for subscribing! Check your email for confirmation.');
      setEmail('');
    } else {
      setStatus('error');
      setMessage(result.error || 'Something went wrong. Please try again.');
    }
  };

  if (variant === 'footer') {
    return (
      <div>
        <h4 className="text-white font-semibold mb-4">Stay Updated</h4>
        <p className="text-gray-400 text-sm mb-4" id={`${inputId}-footer-desc`}>
          Get weekly crypto insights and market updates.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <label htmlFor={`${inputId}-footer`} className="sr-only">
            Email address for newsletter
          </label>
          <input
            type="email"
            id={`${inputId}-footer`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            required
            autoComplete="email"
            aria-describedby={`${inputId}-footer-desc`}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            aria-busy={status === 'loading'}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {status === 'loading' ? '...' : 'Join'}
          </button>
        </form>
        {status === 'success' && (
          <div className="mt-3 p-3 bg-green-900/30 border border-green-700/50 rounded-lg flex items-center gap-2" role="status" aria-live="polite">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" aria-hidden="true" />
            <p className="text-green-400 text-sm">{message}</p>
          </div>
        )}
        {status === 'error' && (
          <div className="mt-3 p-3 bg-red-900/30 border border-red-700/50 rounded-lg flex items-center gap-2" role="alert" aria-live="assertive">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" aria-hidden="true" />
            <p className="text-red-400 text-sm">{message}</p>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-lg p-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor={`${inputId}-inline`} className="sr-only">
              Email address for newsletter subscription
            </label>
            <input
              type="email"
              id={`${inputId}-inline`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email for crypto updates"
              required
              autoComplete="email"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            aria-busy={status === 'loading'}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe Free'}
          </button>
        </form>
        {status === 'success' && (
          <div className="mt-3 p-3 bg-green-900/30 border border-green-700/50 rounded-lg flex items-center gap-2" role="status" aria-live="polite">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" aria-hidden="true" />
            <p className="text-green-400 text-sm font-medium">{message}</p>
          </div>
        )}
        {status === 'error' && (
          <div className="mt-3 p-3 bg-red-900/30 border border-red-700/50 rounded-lg flex items-center gap-2" role="alert" aria-live="assertive">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" aria-hidden="true" />
            <p className="text-red-400 text-sm font-medium">{message}</p>
          </div>
        )}
      </div>
    );
  }

  // Card variant (default)
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Weekly Crypto Insights</h3>
        <p className="text-gray-400 text-sm" id={`${inputId}-card-desc`}>
          Join 10,000+ investors getting our free weekly market analysis,
          beginner tips, and exclusive deals.
        </p>
      </div>

      {status === 'success' ? (
        <div className="text-center py-4" role="status" aria-live="polite">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-400 font-medium">{message}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor={`${inputId}-card`} className="sr-only">
              Email address for newsletter subscription
            </label>
            <input
              type="email"
              id={`${inputId}-card`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              autoComplete="email"
              aria-describedby={`${inputId}-card-desc`}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            aria-busy={status === 'loading'}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-semibold rounded-lg transition-colors"
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe for Free'}
          </button>
          {status === 'error' && (
            <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg flex items-center gap-2" role="alert" aria-live="assertive">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" aria-hidden="true" />
              <p className="text-red-400 text-sm">{message}</p>
            </div>
          )}
          <p className="text-gray-500 text-xs text-center">
            No spam, unsubscribe anytime. We respect your privacy.
          </p>
        </form>
      )}
    </div>
  );
}
