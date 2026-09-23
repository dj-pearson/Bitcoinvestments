import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { subscribeToNewsletter, isNewsletterAvailable } from '../services/database';

interface NewsletterProps {
  source?: string;
  variant?: 'inline' | 'card' | 'footer';
  /** Override the card heading (e.g. for a waitlist). */
  heading?: string;
  /** Override the card description. */
  description?: string;
}

type Status = 'idle' | 'loading' | 'success' | 'info' | 'error';

// NEEDS-OWNER: confirm the newsletter cadence ("weekly") and content before launch.
const DEFAULT_HEADING = 'The weekly crypto email';
const DEFAULT_DESCRIPTION =
  'One short email a week: what moved in crypto and why, one idea explained in plain English, and any new guides. No trading tips, no hype.';

const UNAVAILABLE_TEXT =
  "Email sign-up is temporarily unavailable. Please check back soon.";

function PrivacyNote({ prefix = '' }: { prefix?: string }) {
  return (
    <>
      {prefix}By subscribing you agree to our{' '}
      <Link to="/privacy" className="text-orange-500 hover:text-orange-400 underline">
        Privacy Policy
      </Link>
      . You can unsubscribe at any time.
    </>
  );
}

function StatusMessage({ status, message, compact }: { status: Status; message: string; compact?: boolean }) {
  if (status !== 'success' && status !== 'info' && status !== 'error') return null;
  const styles = {
    success: 'bg-green-900/30 border-green-700/50 text-green-400',
    info: 'bg-blue-900/30 border-blue-700/50 text-blue-300',
    error: 'bg-red-900/30 border-red-700/50 text-red-400',
  }[status];
  const Icon = status === 'success' ? CheckCircle : status === 'info' ? Info : AlertCircle;
  return (
    <div className={`mt-3 p-3 border rounded-lg flex items-center gap-2 ${styles}`}>
      <Icon className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} flex-shrink-0`} aria-hidden="true" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function Newsletter({
  source = 'website',
  variant = 'card',
  heading = DEFAULT_HEADING,
  description = DEFAULT_DESCRIPTION,
}: NewsletterProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const inputId = useId();
  const available = isNewsletterAvailable();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    const result = await subscribeToNewsletter(email, source);

    if (result.success) {
      setStatus('success');
      setMessage("You're subscribed. Look out for our next email.");
      setEmail('');
      return;
    }

    if (result.code === 'already_subscribed') {
      setStatus('info');
      setMessage(
        "You're already on the list with that address. If you unsubscribed earlier and want back in, email support@bitcoinvestments.net."
      );
      return;
    }

    setStatus('error');
    setMessage(result.error);
  };

  // Live region so the result is announced after submit.
  const statusRegion = (compact?: boolean) => (
    <div role="status" aria-live="polite">
      <StatusMessage status={status} message={message} compact={compact} />
    </div>
  );

  if (variant === 'footer') {
    return (
      <div>
        <h4 className="text-white font-semibold mb-4">Stay Updated</h4>
        {!available ? (
          <p className="text-gray-400 text-sm">{UNAVAILABLE_TEXT}</p>
        ) : (
          <>
            <p className="text-gray-400 text-sm mb-4">A short weekly email of plain-English crypto explainers.</p>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <label htmlFor={inputId} className="sr-only">
                Email address
              </label>
              <input
                id={inputId}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                required
                className="flex-1 min-w-0 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {status === 'loading' ? 'Joining…' : 'Join'}
              </button>
            </form>
            <p className="text-gray-400 text-xs mt-2">
              <PrivacyNote />
            </p>
            {statusRegion(true)}
          </>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-lg p-4">
        {!available ? (
          <p className="text-gray-300 text-sm">{UNAVAILABLE_TEXT}</p>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label htmlFor={inputId} className="sr-only">
                  Email address
                </label>
                <input
                  id={inputId}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email for the weekly crypto email"
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
              >
                {status === 'loading' ? 'Subscribing…' : 'Subscribe Free'}
              </button>
            </form>
            <p className="text-gray-400 text-xs mt-3">
              <PrivacyNote />
            </p>
            {statusRegion()}
          </>
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
        <h3 className="text-xl font-bold text-white mb-2">{heading}</h3>
        <p className="text-gray-400 text-sm">{available ? description : UNAVAILABLE_TEXT}</p>
      </div>

      {available &&
        (status === 'success' ? (
          <div className="text-center py-4" role="status" aria-live="polite">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-500" aria-hidden="true" />
            </div>
            <p className="text-green-400 font-medium">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label htmlFor={inputId} className="sr-only">
              Email address
            </label>
            <input
              id={inputId}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-semibold rounded-lg transition-colors"
            >
              {status === 'loading' ? 'Subscribing…' : 'Subscribe for Free'}
            </button>
            {statusRegion()}
            <p className="text-gray-400 text-xs text-center">
              <PrivacyNote prefix="No spam. " />
            </p>
          </form>
        ))}
    </div>
  );
}
