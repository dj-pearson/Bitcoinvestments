import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock, Gift, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { type InfluencerApplication, validateApplication } from '../services/influencerAffiliate';
import { db, isSupabaseConfigured } from '../lib/supabase';
import { usePageTitle } from '../hooks/usePageTitle';

/**
 * Creator affiliate programme: application form and application status.
 *
 * Applications are stored in public.affiliate_applications (one per account,
 * see supabase/migrations/20260923000300_reconcile_schema.sql) and reviewed by
 * an admin. There is no approved-affiliate dashboard yet: the previous version
 * showed a hard-coded "CryptoCreator" account with invented referrals and
 * earnings to every visitor, and logged applications to the console instead of
 * saving them.
 */

interface StoredApplication {
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewer_notes: string | null;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'none' }
  | { status: 'found'; application: StoredApplication }
  | { status: 'error'; message: string };

const inputClass =
  'w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary';

export function InfluencerDashboard() {
  usePageTitle('Creator Affiliate Program');
  const { user, profile } = useAuth();
  const [loadState, setLoadState] = useState<LoadState>(() =>
    user && isSupabaseConfigured() ? { status: 'loading' } : { status: 'none' }
  );
  const [showApplication, setShowApplication] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState<InfluencerApplication>({
    name: '',
    email: profile?.email || user?.email || '',
    platform: 'youtube',
    platform_url: '',
    followers_count: 0,
    content_description: '',
    why_join: '',
    agreed_to_terms: false,
  });
  const [applicationErrors, setApplicationErrors] = useState<string[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !isSupabaseConfigured()) return;
    let cancelled = false;
    db.from('affiliate_applications')
      .select('status, created_at, reviewer_notes')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Error loading affiliate application:', error);
          setLoadState({ status: 'error', message: 'We could not check your application status. Please reload the page.' });
        } else if (data) {
          setLoadState({ status: 'found', application: data as StoredApplication });
        } else {
          setLoadState({ status: 'none' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Dialog: Escape closes it and focus moves into it when it opens.
  useEffect(() => {
    if (!showApplication) return;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowApplication(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showApplication]);

  const handleApplicationSubmit = async () => {
    const errors = validateApplication(application);
    setApplicationErrors(errors);
    if (errors.length > 0 || !user) return;

    if (!isSupabaseConfigured()) {
      setApplicationErrors(['Applications cannot be submitted right now. Please try again later.']);
      return;
    }

    setSubmitting(true);
    const { error } = await db.from('affiliate_applications').insert({
      user_id: user.id,
      name: application.name.trim(),
      email: application.email.trim(),
      platform: application.platform,
      platform_url: application.platform_url.trim(),
      followers_count: application.followers_count,
      content_description: application.content_description.trim(),
      why_join: application.why_join.trim() || null,
      agreed_to_terms: application.agreed_to_terms,
    });
    setSubmitting(false);

    if (error) {
      console.error('Error submitting affiliate application:', error);
      setApplicationErrors([
        error.code === '23505'
          ? 'You have already applied. Your application status is shown on this page.'
          : 'Your application could not be saved. Please try again.',
      ]);
      return;
    }

    setShowApplication(false);
    setLoadState({
      status: 'found',
      application: { status: 'pending', created_at: new Date().toISOString(), reviewer_notes: null },
    });
  };

  if (loadState.status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-gray-400" aria-busy="true">
        Checking your application…
      </div>
    );
  }

  if (loadState.status === 'found') {
    const { application: app } = loadState;
    const view = {
      pending: {
        icon: <Clock className="w-10 h-10 text-yellow-400" aria-hidden="true" />,
        title: 'Application received',
        text: 'Thank you for applying. We review every application and will reply by email to the address you gave.',
      },
      approved: {
        icon: <CheckCircle className="w-10 h-10 text-green-400" aria-hidden="true" />,
        title: 'Application approved',
        text: 'Your application has been approved. We will contact you by email with your referral link and terms.',
      },
      rejected: {
        icon: <XCircle className="w-10 h-10 text-red-400" aria-hidden="true" />,
        title: 'Application not accepted',
        text: 'We are not able to accept your application at the moment.',
      },
    }[app.status];

    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">{view.icon}</div>
          <h1 className="text-2xl font-bold text-white mb-4">{view.title}</h1>
          <p className="text-gray-400 mb-2">{view.text}</p>
          <p className="text-sm text-gray-500 mb-8">
            Submitted {new Date(app.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
          </p>
          {app.reviewer_notes && app.status !== 'pending' && (
            <p className="text-sm text-gray-300 bg-white/5 rounded-lg p-4 mb-8 text-left">{app.reviewer_notes}</p>
          )}
          <Link
            to="/"
            className="inline-block px-6 py-3 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white font-medium transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/20 text-brand-primary text-sm font-medium mb-6">
          <Gift className="w-4 h-4" aria-hidden="true" />
          For creators and publishers
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Creator Affiliate Program</h1>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-4">
          Apply to refer your audience to Bitcoinvestments. Applications are reviewed by hand; if yours is approved
          we will email you a personal referral link and the commission terms.
        </p>
        {/* NEEDS-OWNER: commission rates, payout thresholds and schedule. The
            previous page advertised 20-30% tiers and analytics features that do
            not exist; publish real terms here once they are decided. */}
        <p className="text-sm text-gray-500 max-w-2xl mx-auto mb-8">
          Commission rates and payout terms are agreed individually on approval.
        </p>
        {loadState.status === 'error' ? (
          <p className="text-red-400" role="alert">{loadState.message}</p>
        ) : (
          <button
            type="button"
            onClick={() => setShowApplication(true)}
            className="px-8 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold rounded-xl transition-colors"
          >
            Apply now
          </button>
        )}
      </div>

      <div className="glass-card p-8">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">How it works</h2>
        <ol className="grid md:grid-cols-3 gap-6">
          {[
            ['Apply', 'Tell us about your channel or publication and your audience.'],
            ['Review', 'We review each application by hand and reply by email.'],
            ['Share', 'Approved creators get a personal referral link and written terms.'],
          ].map(([title, text], i) => (
            <li key={title} className="text-center">
              <div className="w-12 h-12 rounded-full bg-brand-primary/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-brand-primary font-bold">{i + 1}</span>
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-400">{text}</p>
            </li>
          ))}
        </ol>
      </div>

      {showApplication && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="affiliate-apply-title"
            tabIndex={-1}
            className="glass-card p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto focus:outline-none"
          >
            <h2 id="affiliate-apply-title" className="text-2xl font-bold text-white mb-6">
              Apply to the affiliate program
            </h2>

            {applicationErrors.length > 0 && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30" role="alert">
                <ul className="space-y-1">
                  {applicationErrors.map((error) => (
                    <li key={error} className="text-sm text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" aria-hidden="true" />
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void handleApplicationSubmit();
              }}
            >
              <div>
                <label htmlFor="aff-name" className="block text-sm text-gray-400 mb-2">Your name *</label>
                <input
                  id="aff-name"
                  type="text"
                  value={application.name}
                  onChange={(e) => setApplication({ ...application, name: e.target.value })}
                  className={inputClass}
                  autoComplete="name"
                />
              </div>

              <div>
                <label htmlFor="aff-email" className="block text-sm text-gray-400 mb-2">Email *</label>
                <input
                  id="aff-email"
                  type="email"
                  value={application.email}
                  onChange={(e) => setApplication({ ...application, email: e.target.value })}
                  className={inputClass}
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="aff-platform" className="block text-sm text-gray-400 mb-2">Platform *</label>
                <select
                  id="aff-platform"
                  value={application.platform}
                  onChange={(e) => setApplication({ ...application, platform: e.target.value as InfluencerApplication['platform'] })}
                  className={inputClass}
                >
                  <option value="youtube">YouTube</option>
                  <option value="twitter">Twitter/X</option>
                  <option value="blog">Blog/Website</option>
                  <option value="podcast">Podcast</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="aff-url" className="block text-sm text-gray-400 mb-2">Channel or site URL *</label>
                <input
                  id="aff-url"
                  type="url"
                  value={application.platform_url}
                  onChange={(e) => setApplication({ ...application, platform_url: e.target.value })}
                  className={inputClass}
                  placeholder="https://"
                />
              </div>

              <div>
                <label htmlFor="aff-followers" className="block text-sm text-gray-400 mb-2">Followers or subscribers *</label>
                <input
                  id="aff-followers"
                  type="number"
                  value={application.followers_count || ''}
                  onChange={(e) => setApplication({ ...application, followers_count: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                  min={100}
                />
              </div>

              <div>
                <label htmlFor="aff-content" className="block text-sm text-gray-400 mb-2">Describe your content *</label>
                <textarea
                  id="aff-content"
                  value={application.content_description}
                  onChange={(e) => setApplication({ ...application, content_description: e.target.value })}
                  className={inputClass}
                  rows={3}
                />
              </div>

              <div>
                <label htmlFor="aff-why" className="block text-sm text-gray-400 mb-2">Why do you want to join?</label>
                <textarea
                  id="aff-why"
                  value={application.why_join}
                  onChange={(e) => setApplication({ ...application, why_join: e.target.value })}
                  className={inputClass}
                  rows={2}
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={application.agreed_to_terms}
                  onChange={(e) => setApplication({ ...application, agreed_to_terms: e.target.checked })}
                  className="mt-1"
                />
                <span className="text-sm text-gray-400">
                  I agree to the <Link to="/terms" className="text-brand-primary hover:underline">Terms of Service</Link>{' '}
                  and understand my application will be reviewed by hand.
                </span>
              </label>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowApplication(false)}
                  className="flex-1 py-3 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting…' : 'Submit application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
