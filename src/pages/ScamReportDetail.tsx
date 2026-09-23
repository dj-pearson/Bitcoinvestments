import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Flag,
  MessageSquare,
  Bookmark,
  BookmarkCheck,
  Copy,
  Check,
  ChevronLeft,
  Globe,
  Wallet,
  FileCode,
  Mail,
  Link2,
  Send,
  Info,
} from 'lucide-react';
import { SEO, generateBreadcrumbSchema } from '../components/SEO';
import { ScamReportSkeleton } from '../components/LoadingSkeletons';
import { NotFound } from './NotFound';
import { useAuth } from '../contexts/AuthContext';
import { STATIC_MODE } from '../config/staticMode';
import { isSupabaseConfigured } from '../lib/supabase';
import { getScamReport, getScamReportComments, addScamReportComment } from '../services/scamDatabase';
import {
  voteOnScamReport,
  getUserVote,
  getVoteCounts,
  createDispute,
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
} from '../services/scamCommunity';
import { getScamTypeForReport } from '../data/scamTypes';
import {
  defangUrl,
  describeReportSource,
  formatDateUTC,
  isHttpUrl,
  isScamReportIndexable,
  truncate,
} from '../lib/scamSafety';
import type { ScamReportWithCommunity, ScamReportComment, VoteType } from '../types/admin-database';

const SITE_URL = 'https://bitcoinvestments.net';

type PageState =
  | { kind: 'loading' }
  | { kind: 'not-found' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; report: ScamReportWithCommunity };

function severityClass(severity: string) {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-200 dark:border-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200 border-orange-200 dark:border-orange-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700';
  }
}

export function ScamReportDetail() {
  const { id } = useParams<{ id: string }>();
  const dbEnabled = isSupabaseConfigured();

  if (!dbEnabled || !id) {
    // No database: there is no report to show. Render the real 404 (noindex).
    return <NotFound />;
  }

  return <ScamReportDetailLoaded key={id} id={id} />;
}

function ScamReportDetailLoaded({ id }: { id: string }) {
  const { user } = useAuth();
  const accountsEnabled = !STATIC_MODE;

  const [state, setState] = useState<PageState>({ kind: 'loading' });
  const [comments, setComments] = useState<ScamReportComment[]>([]);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<VoteType | null>(null);
  const [voteCounts, setVoteCounts] = useState({ upvotes: 0, downvotes: 0 });
  const [inWatchlist, setInWatchlist] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeEvidence, setDisputeEvidence] = useState('');
  const [disputeStatus, setDisputeStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const closeDispute = useCallback(() => setShowDisputeForm(false), []);

  const loadComments = useCallback(async () => {
    const { comments: rows, error } = await getScamReportComments(id);
    setComments(rows);
    setCommentsError(error);
  }, [id]);

  useEffect(() => {
    // Keyed by id in the parent, so each report starts in the loading state.
    let cancelled = false;
    (async () => {
      const { report, error, notFound } = await getScamReport(id);
      if (cancelled) return;
      if (notFound || (!report && !error)) {
        setState({ kind: 'not-found' });
        return;
      }
      if (!report) {
        setState({ kind: 'error', message: error || 'Unknown error' });
        return;
      }
      const full = report as ScamReportWithCommunity;
      setState({ kind: 'ready', report: full });
      setVoteCounts({ upvotes: full.upvotes || 0, downvotes: full.downvotes || 0 });
      loadComments();
    })();
    return () => {
      cancelled = true;
    };
  }, [id, loadComments]);

  useEffect(() => {
    if (!user || !accountsEnabled) return;
    let cancelled = false;
    Promise.all([getUserVote(id, user.id), isInWatchlist(user.id, id)]).then(([voteResult, watchResult]) => {
      if (cancelled) return;
      setUserVote(voteResult.vote?.vote_type || null);
      setInWatchlist(watchResult.inWatchlist);
    });
    return () => {
      cancelled = true;
    };
  }, [id, user, accountsEnabled]);

  async function handleVote(voteType: VoteType) {
    if (!user) return;
    const result = await voteOnScamReport(id, user.id, voteType);
    if (!result.success) {
      setActionMessage(`Your vote was not saved: ${result.error}`);
      return;
    }
    setActionMessage(null);
    setUserVote(result.action === 'removed' ? null : voteType);
    const counts = await getVoteCounts(id);
    if (!counts.error) setVoteCounts({ upvotes: counts.upvotes, downvotes: counts.downvotes });
  }

  async function handleWatchlist() {
    if (!user) return;
    const result = inWatchlist
      ? await removeFromWatchlist(user.id, id)
      : await addToWatchlist({ user_id: user.id, scam_report_id: id });
    if (result.error) {
      setActionMessage(`Watchlist not updated: ${result.error}`);
      return;
    }
    setActionMessage(null);
    setInWatchlist(!inWatchlist);
  }

  async function handleSubmitComment() {
    if (!user || !newComment.trim()) return;
    setSubmittingComment(true);
    const { error } = await addScamReportComment({
      scam_report_id: id,
      user_id: user.id,
      comment: newComment.trim(),
    });
    setSubmittingComment(false);
    if (error) {
      setActionMessage(`Your comment was not posted: ${error}`);
      return;
    }
    setNewComment('');
    setActionMessage(null);
    loadComments();
  }

  async function handleSubmitDispute() {
    if (!user || !disputeReason.trim()) return;
    const evidenceLinks = disputeEvidence
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const invalid = evidenceLinks.find((l) => !isHttpUrl(l));
    if (invalid) {
      setDisputeStatus({ ok: false, message: 'Evidence links must start with http:// or https://.' });
      return;
    }

    setSubmittingDispute(true);
    const { error } = await createDispute({
      scam_report_id: id,
      user_id: user.id,
      reason: disputeReason.trim(),
      evidence_links: evidenceLinks.length > 0 ? evidenceLinks : undefined,
    });
    setSubmittingDispute(false);

    if (error) {
      setDisputeStatus({ ok: false, message: error });
      return;
    }
    setDisputeStatus({ ok: true, message: 'Dispute submitted. A moderator will review it.' });
    setDisputeReason('');
    setDisputeEvidence('');
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedValue(text);
      setTimeout(() => setCopiedValue(null), 2000);
    } catch {
      setActionMessage('Could not copy to the clipboard. Select the text and copy it manually.');
    }
  }

  if (state.kind === 'not-found') {
    return <NotFound />;
  }

  if (state.kind === 'loading') {
    return (
      <>
        <SEO title="Community Scam Report" description="Loading community scam report." noindex />
        <ScamReportSkeleton />
      </>
    );
  }

  if (state.kind === 'error') {
    return (
      <>
        <SEO title="Community Scam Report" description="This community scam report could not be loaded." noindex />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16">
          <div className="max-w-xl mx-auto px-4 text-center" role="alert">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">We couldn&apos;t load this report</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Please try again later.</p>
            <Link to="/scam-database" className="text-orange-600 hover:underline">
              Back to the scam checker
            </Link>
          </div>
        </div>
      </>
    );
  }

  const report = state.report;
  const indexable = isScamReportIndexable(report);
  const typeExplainer = getScamTypeForReport(report.scam_type);
  const typeLabel = report.scam_type.replace(/_/g, ' ');
  const pageUrl = `${SITE_URL}/scam/${report.id}`;
  const emailCount = report.email_addresses?.length || 0;
  const evidenceLinks = report.evidence_links || [];

  const seoTitle = `${truncate(report.title, 26)} – Scam Report`;
  const seoDescription = truncate(
    `Community report (${typeLabel}): ${report.description.replace(/\s+/g, ' ')}`,
    155
  );

  const seoSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': pageUrl,
        url: pageUrl,
        name: report.title,
        description: seoDescription,
        datePublished: report.created_at,
        dateModified: report.updated_at || report.created_at,
        about: { '@type': 'Thing', name: `Reported ${typeLabel} scam` },
        isPartOf: { '@type': 'WebSite', name: 'Bitcoinvestments', url: SITE_URL },
      },
      generateBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Crypto Scam Checker', url: '/scam-database' },
        { name: truncate(report.title, 60), url: `/scam/${report.id}` },
      ]),
    ],
  };

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        noindex={!indexable}
        modifiedTime={report.updated_at || undefined}
        schema={seoSchema}
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/scam-database"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 mb-6"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            Back to the scam checker
          </Link>

          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
            <div className={`p-4 border-b flex items-center gap-3 ${severityClass(report.severity)}`}>
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
              <span className="font-semibold capitalize">
                {report.severity} severity · {typeLabel}
              </span>
            </div>
            <div className="p-6">
              <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Community report</p>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{report.title}</h1>
              <div className="flex flex-wrap gap-2">
                {report.blockchain && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                    {report.blockchain}
                  </span>
                )}
                {report.token_symbol && (
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">
                    {report.token_symbol}
                  </span>
                )}
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 capitalize">
                  {report.status === 'verified' ? 'Reviewed by a moderator' : `Status: ${report.status}`}
                </span>
              </div>

              {/* Disclaimer and provenance */}
              <div className="mt-5 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-900 dark:text-amber-100">
                <p className="font-medium flex items-center gap-2">
                  <Info className="w-4 h-4" aria-hidden="true" />
                  This is a community report, not a legal finding.
                </p>
                <p className="mt-1">
                  It contains allegations submitted by a user. A moderator reviewed it before publication, but
                  Bitcoinvestments has not independently established the facts. If you are named in this report
                  and believe it is wrong, you can dispute it.
                  {/* NEEDS-OWNER: takedown/dispute contact and legal wording */}
                </p>
                <dl className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                  <div>
                    <dt className="inline font-medium">Source: </dt>
                    <dd className="inline">{describeReportSource(report.source)}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium">First submitted: </dt>
                    <dd className="inline">
                      <time dateTime={report.created_at}>{formatDateUTC(report.created_at)}</time>
                    </dd>
                  </div>
                  {report.verified_at && (
                    <div>
                      <dt className="inline font-medium">Reviewed: </dt>
                      <dd className="inline">
                        <time dateTime={report.verified_at}>{formatDateUTC(report.verified_at)}</time>
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="inline font-medium">Evidence links: </dt>
                    <dd className="inline">{evidenceLinks.length}</dd>
                  </div>
                </dl>
              </div>

              {/* Community actions (accounts only) */}
              {accountsEnabled && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-700 pt-4 mt-5">
                  {user ? (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-pressed={userVote === 'upvote'}
                        aria-label={`Agree this is a scam (${voteCounts.upvotes})`}
                        onClick={() => handleVote('upvote')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                          userVote === 'upvote'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <ThumbsUp className="w-5 h-5" aria-hidden="true" />
                        <span className="font-medium">{voteCounts.upvotes}</span>
                      </button>
                      <button
                        type="button"
                        aria-pressed={userVote === 'downvote'}
                        aria-label={`Disagree (${voteCounts.downvotes})`}
                        onClick={() => handleVote('downvote')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                          userVote === 'downvote'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <ThumbsDown className="w-5 h-5" aria-hidden="true" />
                        <span className="font-medium">{voteCounts.downvotes}</span>
                      </button>
                      <button
                        type="button"
                        aria-pressed={inWatchlist}
                        aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                        onClick={handleWatchlist}
                        className={`p-2 rounded-lg ${
                          inWatchlist
                            ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {inWatchlist ? <BookmarkCheck className="w-5 h-5" aria-hidden="true" /> : <Bookmark className="w-5 h-5" aria-hidden="true" />}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <Link to={`/login?redirect=${encodeURIComponent(`/scam/${id}`)}`} className="text-orange-600 hover:underline">
                        Sign in
                      </Link>{' '}
                      to vote, comment or dispute this report.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setDisputeStatus(null);
                      setShowDisputeForm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
                  >
                    <Flag className="w-5 h-5" aria-hidden="true" />
                    Dispute this report
                  </button>
                </div>
              )}
              {actionMessage && (
                <p role="alert" className="mt-3 text-sm text-amber-700 dark:text-amber-300">
                  {actionMessage}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Description */}
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" aria-labelledby="desc-heading">
              <h2 id="desc-heading" className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                What the reporter says happened
              </h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{report.description}</p>
              {(report.victims_count > 0 || report.estimated_loss_usd) && (
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Reporter&apos;s estimate:
                  {report.victims_count > 0 && ` ${report.victims_count.toLocaleString('en-US')} people affected`}
                  {report.victims_count > 0 && report.estimated_loss_usd ? ',' : ''}
                  {report.estimated_loss_usd ? ` $${Number(report.estimated_loss_usd).toLocaleString('en-US')} lost` : ''}
                  . Not independently verified.
                </p>
              )}
            </section>

            {report.red_flags && report.red_flags.length > 0 && (
              <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" aria-labelledby="flags-heading">
                <h2 id="flags-heading" className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" aria-hidden="true" />
                  Red flags noted by the reporter
                </h2>
                <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                  {report.red_flags.map((flag, index) => (
                    <li key={index}>{flag}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Associated data: all inert text */}
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" aria-labelledby="data-heading">
              <h2 id="data-heading" className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Reported addresses and websites
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Web addresses are shown &quot;defanged&quot; (hxxps://example[.]com) so they cannot be clicked by accident. Do
                not visit them.
              </p>
              <div className="space-y-4">
                {report.website_url && (
                  <DataRow icon={<Globe className="w-5 h-5 text-gray-400" aria-hidden="true" />} label="Website">
                    <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono break-all">
                      {defangUrl(report.website_url)}
                    </code>
                  </DataRow>
                )}

                {report.contract_address && (
                  <DataRow icon={<FileCode className="w-5 h-5 text-gray-400" aria-hidden="true" />} label="Contract address">
                    <AddressWithCopy value={report.contract_address} copied={copiedValue} onCopy={copyToClipboard} />
                  </DataRow>
                )}

                {report.wallet_addresses && report.wallet_addresses.length > 0 && (
                  <DataRow
                    icon={<Wallet className="w-5 h-5 text-gray-400" aria-hidden="true" />}
                    label={`Reported wallet addresses (${report.wallet_addresses.length})`}
                  >
                    <div className="space-y-2">
                      {report.wallet_addresses.map((addr) => (
                        <AddressWithCopy key={addr} value={addr} copied={copiedValue} onCopy={copyToClipboard} />
                      ))}
                    </div>
                  </DataRow>
                )}

                {emailCount > 0 && (
                  <DataRow icon={<Mail className="w-5 h-5 text-gray-400" aria-hidden="true" />} label="Email addresses">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {emailCount} email address{emailCount === 1 ? ' was' : 'es were'} included in this report. They are
                      withheld from public view for privacy.
                    </p>
                  </DataRow>
                )}

                {report.social_media_links && Object.keys(report.social_media_links).length > 0 && (
                  <DataRow icon={<Link2 className="w-5 h-5 text-gray-400" aria-hidden="true" />} label="Social media">
                    <ul className="space-y-1">
                      {Object.entries(report.social_media_links).map(([platform, url]) => (
                        <li key={platform} className="text-sm text-gray-700 dark:text-gray-300 break-all">
                          <span className="font-medium capitalize">{platform}:</span>{' '}
                          <code className="font-mono">{defangUrl(String(url))}</code>
                        </li>
                      ))}
                    </ul>
                  </DataRow>
                )}

                {!report.website_url &&
                  !report.contract_address &&
                  !(report.wallet_addresses && report.wallet_addresses.length) &&
                  !emailCount && <p className="text-sm text-gray-500 dark:text-gray-400">No addresses or websites were reported.</p>}
              </div>
            </section>

            {evidenceLinks.length > 0 && (
              <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" aria-labelledby="evidence-heading">
                <h2 id="evidence-heading" className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Evidence cited by the reporter
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Links are shown as text. Copy one into your browser only if you trust the destination.
                </p>
                <ul className="space-y-2">
                  {evidenceLinks.map((link, index) => (
                    <li key={index}>
                      <code className="text-sm font-mono break-all text-gray-700 dark:text-gray-300">{defangUrl(link)}</code>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* What to do */}
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" aria-labelledby="todo-heading">
              <h2 id="todo-heading" className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                If you interacted with this
              </h2>
              <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                <li>Do not send more money, including any fee to unlock a withdrawal.</li>
                <li>If you connected a wallet or shared a seed phrase, move funds to a new wallet and revoke approvals.</li>
                <li>Save transaction IDs and messages, then report to the FBI (ic3.gov), the FTC and your exchange.</li>
              </ul>
              <p className="mt-3 text-sm">
                <Link to="/report-scam" className="text-orange-600 dark:text-orange-400 hover:underline">
                  How to report a crypto scam
                </Link>
                {typeExplainer && (
                  <>
                    {' · '}
                    <Link to={`/scam-database#${typeExplainer.slug}`} className="text-orange-600 dark:text-orange-400 hover:underline">
                      How {typeExplainer.name.replace(/ \(.*\)$/, '').toLowerCase()} works
                    </Link>
                  </>
                )}
              </p>
            </section>

            {/* Comments */}
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6" aria-labelledby="comments-heading">
              <h2 id="comments-heading" className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" aria-hidden="true" />
                Comments ({comments.length})
              </h2>

              {accountsEnabled && user && (
                <div className="mb-6">
                  <label htmlFor="new-comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Add a comment
                  </label>
                  <textarea
                    id="new-comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    maxLength={5000}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || submittingComment}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg font-medium flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" aria-hidden="true" />
                      {submittingComment ? 'Posting…' : 'Post comment'}
                    </button>
                  </div>
                </div>
              )}

              {commentsError ? (
                <p className="text-sm text-amber-700 dark:text-amber-300">Comments could not be loaded.</p>
              ) : comments.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No comments yet.</p>
              ) : (
                <ul className="space-y-4">
                  {comments.map((comment) => (
                    <li key={comment.id} className="border-t border-gray-100 dark:border-gray-700 pt-4 first:border-0 first:pt-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {comment.is_admin ? 'Moderator' : 'Community member'}
                        </span>
                        <time dateTime={comment.created_at} className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDateUTC(comment.created_at)}
                        </time>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.comment}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {showDisputeForm && (
            <DisputeDialog
              onClose={closeDispute}
              signedIn={!!user}
              loginHref={`/login?redirect=${encodeURIComponent(`/scam/${id}`)}`}
              reason={disputeReason}
              setReason={setDisputeReason}
              evidence={disputeEvidence}
              setEvidence={setDisputeEvidence}
              submitting={submittingDispute}
              status={disputeStatus}
              onSubmit={handleSubmitDispute}
            />
          )}
        </div>
      </div>
    </>
  );
}

function DataRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</div>
        {children}
      </div>
    </div>
  );
}

function AddressWithCopy({
  value,
  copied,
  onCopy,
}: {
  value: string;
  copied: string | null;
  onCopy: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono break-all">{value}</code>
      <button
        type="button"
        onClick={() => onCopy(value)}
        aria-label={`Copy address ${value}`}
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex-shrink-0"
      >
        {copied === value ? (
          <Check className="w-4 h-4 text-green-500" aria-hidden="true" />
        ) : (
          <Copy className="w-4 h-4 text-gray-400" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

function DisputeDialog({
  onClose,
  signedIn,
  loginHref,
  reason,
  setReason,
  evidence,
  setEvidence,
  submitting,
  status,
  onSubmit,
}: {
  onClose: () => void;
  signedIn: boolean;
  loginHref: string;
  reason: string;
  setReason: (v: string) => void;
  evidence: string;
  setEvidence: (v: string) => void;
  submitting: boolean;
  status: { ok: boolean; message: string } | null;
  onSubmit: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const node = dialogRef.current;
    const focusable = () =>
      node
        ? Array.from(
            node.querySelectorAll<HTMLElement>('button, a[href], textarea, input, select, [tabindex]:not([tabindex="-1"])')
          ).filter((el) => !el.hasAttribute('disabled'))
        : [];
    focusable()[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Tab') {
        const items = focusable();
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispute-title"
        className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dispute-title" className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Flag className="w-6 h-6 text-yellow-500" aria-hidden="true" />
          Dispute this report
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          If this report is inaccurate, explain why and link any evidence. A moderator will review it.
        </p>

        {status && (
          <p
            role={status.ok ? 'status' : 'alert'}
            className={`mb-4 text-sm ${status.ok ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}
          >
            {status.message}
          </p>
        )}

        {signedIn ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            <label htmlFor="dispute-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for dispute (required)
            </label>
            <textarea
              id="dispute-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
              maxLength={5000}
              className="w-full mb-4 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
            <label htmlFor="dispute-evidence" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Evidence links (one per line, https://…)
            </label>
            <textarea
              id="dispute-evidence"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              rows={3}
              className="w-full mb-6 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none font-mono text-sm"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={!reason.trim() || submitting}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white rounded-lg font-medium"
              >
                {submitting ? 'Submitting…' : 'Submit dispute'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex justify-between items-center">
            <Link to={loginHref} className="text-orange-600 dark:text-orange-400 hover:underline">
              Sign in to submit a dispute
            </Link>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
