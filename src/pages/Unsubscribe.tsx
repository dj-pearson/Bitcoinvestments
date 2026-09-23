/**
 * /unsubscribe?email=...&token=...
 *
 * Target of the unsubscribe link in newsletter emails
 * (functions/api/send-newsletter.ts). The token is the subscriber's random
 * unsubscribe_token; the unsubscribe_newsletter() database function
 * (supabase/migrations/20260923000400_newsletter_unsubscribe.sql) only acts when
 * email and token match, and is idempotent.
 *
 * The visitor confirms with a button rather than being unsubscribed on page
 * load, so link scanners and prefetchers in mail clients can't unsubscribe
 * people by accident.
 */

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MailX, CheckCircle, AlertCircle } from 'lucide-react';
import { SEO } from '../components/SEO';
import { unsubscribeFromNewsletter, isNewsletterAvailable } from '../services/database';

type State = 'idle' | 'working' | 'done' | 'invalid' | 'manual' | 'error';

const SUPPORT_EMAIL = 'support@bitcoinvestments.net';

export function Unsubscribe() {
  const [params] = useSearchParams();
  const email = params.get('email') ?? '';
  const token = params.get('token') ?? '';
  const hasLink = Boolean(email && token);
  const [state, setState] = useState<State>(() =>
    !hasLink ? 'manual' : isNewsletterAvailable() ? 'idle' : 'manual'
  );

  const handleConfirm = async () => {
    setState('working');
    const result = await unsubscribeFromNewsletter(email, token);
    if (result.success) setState('done');
    else if (result.code === 'invalid_link') setState('invalid');
    else if (result.code === 'not_deployed' || result.code === 'unavailable') setState('manual');
    else setState('error');
  };

  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Unsubscribe')}&body=${encodeURIComponent(
    `Please remove ${email || '[your email address]'} from the Bitcoinvestments newsletter.`
  )}`;

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12">
      <SEO
        title="Unsubscribe"
        description="Stop receiving the Bitcoinvestments newsletter. Confirm with one click, or email us and we will remove your address by hand."
        noindex
      />
      <div className="max-w-lg mx-auto px-4 text-center">
        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20">
          <MailX className="w-8 h-8 text-orange-400" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Unsubscribe from our newsletter</h1>

        <div role="status" aria-live="polite">
          {state === 'done' && (
            <div className="p-4 bg-green-900/30 border border-green-700/50 rounded-lg text-green-300 flex items-start gap-2 text-left">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p>
                Done. <strong>{email}</strong> won&apos;t get any more newsletters from us. If an
                email was already on its way it may still arrive.
              </p>
            </div>
          )}

          {state === 'invalid' && (
            <div className="p-4 bg-amber-900/30 border border-amber-700/50 rounded-lg text-amber-200 text-left flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p>
                This unsubscribe link doesn&apos;t match our records. It may have been copied
                incompletely. Use the link from a recent email, or{' '}
                <a href={mailto} className="underline">
                  email us
                </a>{' '}
                and we&apos;ll remove you by hand.
              </p>
            </div>
          )}

          {state === 'error' && (
            <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-left flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p>
                Something went wrong and you have not been unsubscribed yet. Please try again, or{' '}
                <a href={mailto} className="underline">
                  email us
                </a>{' '}
                and we&apos;ll remove you by hand.
              </p>
            </div>
          )}
        </div>

        {(state === 'idle' || state === 'working' || state === 'error') && (
          <>
            <p className="text-gray-300 my-6">
              Stop sending the Bitcoinvestments newsletter to <strong className="text-white">{email}</strong>?
            </p>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={state === 'working'}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors"
            >
              {state === 'working' ? 'Unsubscribing…' : 'Yes, unsubscribe me'}
            </button>
          </>
        )}

        {state === 'manual' && (
          <div className="text-gray-300 space-y-4 text-left">
            <p>
              {hasLink
                ? "One-click unsubscribe isn't working right now."
                : 'To unsubscribe, use the link at the bottom of any newsletter email.'}{' '}
              You can also email{' '}
              <a href={mailto} className="text-orange-400 underline">
                {SUPPORT_EMAIL}
              </a>{' '}
              with the subject &ldquo;Unsubscribe&rdquo; from the address you signed up with, and
              we&apos;ll remove it by hand.
            </p>
          </div>
        )}

        <p className="mt-8 text-sm text-gray-400">
          <Link to="/" className="text-orange-400 hover:text-orange-300 underline">
            Back to the homepage
          </Link>{' '}
          ·{' '}
          <Link to="/privacy" className="text-orange-400 hover:text-orange-300 underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Unsubscribe;
