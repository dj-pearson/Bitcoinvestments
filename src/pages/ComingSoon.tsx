import { Link } from 'react-router-dom';
import { Clock, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { SEO } from '../components/SEO';
import { Newsletter } from '../components/Newsletter';
import { FEATURES, type FeatureKey } from '../config/features';

interface ComingSoonProps {
  /** Which gated feature this page stands in for. */
  feature?: FeatureKey;
  /**
   * 'not-open' (default): accounts are switched off on this deployment.
   * 'unavailable': accounts are on but the database is down or out of date.
   */
  reason?: 'not-open' | 'unavailable';
}

const GENERIC = {
  title: 'Coming Soon',
  description:
    'This part of Bitcoinvestments needs an account, and accounts are not open yet. The guides, calculators and comparisons all work without one.',
  heading: 'This feature is not open yet',
  summary:
    'This page needs an account, and accounts are not open yet. The guides, calculators and comparisons on this site all work without one.',
  plans: [] as string[],
  alternatives: [
    { to: '/learn', label: 'Read the beginner guides' },
    { to: '/calculators', label: 'Use the calculators' },
    { to: '/compare', label: 'Compare exchanges and wallets' },
  ],
};

/**
 * Stand-in for a feature that needs an account or the database. Always
 * noindexed (it is a placeholder, not content), says what the feature will do,
 * points at the parts of the site that already help, and offers a waitlist.
 */
export function ComingSoon({ feature, reason = 'not-open' }: ComingSoonProps) {
  const info = feature ? FEATURES[feature] : GENERIC;
  const unavailable = reason === 'unavailable';

  const heading = unavailable ? 'Temporarily unavailable' : info.heading;
  const summary = unavailable
    ? 'This feature relies on our database, which is not responding right now or is being updated. Please try again in a few minutes; nothing you saved has been lost.'
    : info.summary;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <SEO title={info.title} description={info.description} noindex />
      <div className="max-w-2xl w-full">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center mx-auto mb-6">
            {unavailable ? (
              <AlertTriangle className="w-8 h-8 text-brand-primary" aria-hidden="true" />
            ) : (
              <Clock className="w-8 h-8 text-brand-primary" aria-hidden="true" />
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{heading}</h1>
          <p className="text-lg text-gray-300 mb-8 max-w-xl mx-auto">{summary}</p>
        </div>

        {!unavailable && info.plans.length > 0 && (
          <section className="glass-card p-6 rounded-2xl border border-white/10 mb-6" aria-labelledby="coming-soon-plans">
            <h2 id="coming-soon-plans" className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
              What it will do
            </h2>
            <ul className="space-y-2">
              {info.plans.map((plan) => (
                <li key={plan} className="flex items-start gap-2 text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-brand-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{plan}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!unavailable && (
          <section className="mb-6" aria-labelledby="coming-soon-waitlist">
            <h2 id="coming-soon-waitlist" className="text-lg font-semibold text-white mb-2">
              Hear when it opens
            </h2>
            <p className="text-sm text-gray-400 mb-3">
              Join the free newsletter and we will announce it there when it opens.
            </p>
            <Newsletter variant="inline" source={`waitlist-${feature ?? 'accounts'}`} />
          </section>
        )}

        <section className="glass-card p-6 rounded-2xl border border-white/10 mb-8" aria-labelledby="coming-soon-alternatives">
          <h2 id="coming-soon-alternatives" className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Available now
          </h2>
          <ul className="space-y-2">
            {info.alternatives.map((alt) => (
              <li key={alt.to}>
                <Link
                  to={alt.to}
                  className="inline-flex items-center gap-2 text-brand-accent hover:text-white transition-colors"
                >
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  {alt.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ComingSoon;
