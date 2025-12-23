import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  AlertTriangle,
  Shield,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Flag,
  MessageSquare,
  Bookmark,
  BookmarkCheck,
  Copy,
  Check,
  ChevronLeft,
  Clock,
  Users,
  DollarSign,
  Globe,
  Wallet,
  FileCode,
  Mail,
  Phone,
  Twitter,
  Send,
  AlertCircle,
} from 'lucide-react';
import { SEO, generateScamReportSchema, generateBreadcrumbSchema } from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';
import { getScamReport, getScamReportComments, addScamReportComment } from '../services/scamDatabase';
import {
  voteOnScamReport,
  getUserVote,
  getVoteCounts,
  createDispute,
  getDisputesForReport,
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
} from '../services/scamCommunity';
import type { ScamReportWithCommunity, ScamReportComment, VoteType } from '../types/admin-database';

export function ScamReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [report, setReport] = useState<ScamReportWithCommunity | null>(null);
  const [comments, setComments] = useState<(ScamReportComment & { user: { email: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [userVote, setUserVote] = useState<VoteType | null>(null);
  const [voteCounts, setVoteCounts] = useState({ upvotes: 0, downvotes: 0, trustScore: 50 });
  const [inWatchlist, setInWatchlist] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeEvidence, setDisputeEvidence] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'disputes'>('details');

  useEffect(() => {
    if (id) {
      loadReport();
      loadComments();
    }
  }, [id]);

  useEffect(() => {
    if (id && user) {
      loadUserInteractions();
    }
  }, [id, user]);

  async function loadReport() {
    setLoading(true);
    const { report: rep } = await getScamReport(id!);
    setReport(rep as ScamReportWithCommunity);
    if (rep) {
      const counts = await getVoteCounts(id!);
      setVoteCounts(counts);
    }
    setLoading(false);
  }

  async function loadComments() {
    const { comments: cmts } = await getScamReportComments(id!);
    setComments(cmts);
  }

  async function loadUserInteractions() {
    if (!user) return;

    const [voteResult, watchlistResult] = await Promise.all([
      getUserVote(id!, user.id),
      isInWatchlist(user.id, id!),
    ]);

    setUserVote(voteResult.vote?.vote_type || null);
    setInWatchlist(watchlistResult.inWatchlist);
  }

  async function handleVote(voteType: VoteType) {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(`/scam/${id}`));
      return;
    }

    const result = await voteOnScamReport(id!, user.id, voteType);
    if (result.success) {
      if (result.action === 'removed') {
        setUserVote(null);
      } else {
        setUserVote(voteType);
      }
      const counts = await getVoteCounts(id!);
      setVoteCounts(counts);
    }
  }

  async function handleWatchlist() {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(`/scam/${id}`));
      return;
    }

    if (inWatchlist) {
      await removeFromWatchlist(user.id, id!);
      setInWatchlist(false);
    } else {
      await addToWatchlist({ user_id: user.id, scam_report_id: id! });
      setInWatchlist(true);
    }
  }

  async function handleSubmitComment() {
    if (!user || !newComment.trim()) return;

    setSubmittingComment(true);
    const { error } = await addScamReportComment({
      scam_report_id: id!,
      user_id: user.id,
      comment: newComment.trim(),
    });

    if (!error) {
      setNewComment('');
      loadComments();
    }
    setSubmittingComment(false);
  }

  async function handleSubmitDispute() {
    if (!user || !disputeReason.trim()) return;

    setSubmittingDispute(true);
    const evidenceLinks = disputeEvidence
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const { error } = await createDispute({
      scam_report_id: id!,
      user_id: user.id,
      reason: disputeReason.trim(),
      evidence_links: evidenceLinks.length > 0 ? evidenceLinks : undefined,
    });

    if (!error) {
      setShowDisputeForm(false);
      setDisputeReason('');
      setDisputeEvidence('');
    }
    setSubmittingDispute(false);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2000);
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-200 dark:border-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200 border-orange-200 dark:border-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200 dark:border-green-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }

  function getTrustScoreColor(score: number) {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Report Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The scam report you're looking for doesn't exist.</p>
          <Link to="/scam-database" className="text-orange-600 hover:underline">
            Back to Scam Database
          </Link>
        </div>
      </div>
    );
  }

  // Generate SEO schema for this specific scam report
  const seoSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      generateScamReportSchema({
        id: report.id,
        title: report.title,
        description: report.description,
        scamType: report.scam_type,
        severity: report.severity,
        website: report.website_url,
        createdAt: report.created_at,
        victimsCount: report.victims_count,
        estimatedLoss: report.estimated_loss_usd,
      }),
      generateBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Scam Database', url: '/scam-database' },
        { name: report.title, url: `/scam/${report.id}` },
      ]),
    ],
  };

  // Create SEO-friendly description
  const seoDescription = `${report.severity.toUpperCase()} severity ${report.scam_type.replace(/_/g, ' ')} scam alert: ${report.description.slice(0, 120)}${report.description.length > 120 ? '...' : ''} ${report.victims_count > 0 ? `${report.victims_count} victims reported.` : ''} ${report.estimated_loss_usd ? `Est. $${report.estimated_loss_usd.toLocaleString()} lost.` : ''}`.trim();

  return (
    <>
      <SEO
        title={`${report.title} - Crypto Scam Alert`}
        description={seoDescription}
        keywords={[
          'crypto scam',
          'cryptocurrency fraud',
          report.scam_type.replace(/_/g, ' '),
          `${report.severity} severity scam`,
          report.blockchain || 'blockchain scam',
          report.token_symbol ? `$${report.token_symbol} scam` : 'token scam',
          'scam warning',
          'crypto security alert',
        ].filter(Boolean) as string[]}
        type="article"
        schema={seoSchema}
      />
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to="/scam-database"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Scam Database
        </Link>

        {/* Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
          {/* Warning Banner */}
          <div className={`p-4 ${getSeverityColor(report.severity)} border-b flex items-center gap-3`}>
            <AlertTriangle className="w-6 h-6" />
            <div>
              <span className="font-semibold uppercase">{report.severity} SEVERITY</span>
              <span className="mx-2">-</span>
              <span>{report.scam_type.replace('_', ' ').toUpperCase()} SCAM</span>
            </div>
          </div>

          {/* Main Header */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {report.title}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {report.blockchain && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                      {report.blockchain}
                    </span>
                  )}
                  {report.token_symbol && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">
                      ${report.token_symbol}
                    </span>
                  )}
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                    {report.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <Shield className="w-12 h-12 text-red-500" />
            </div>

            {/* Voting and Actions */}
            <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4 mt-4">
              <div className="flex items-center gap-4">
                {/* Upvote */}
                <button
                  onClick={() => handleVote('upvote')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    userVote === 'upvote'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                  }`}
                >
                  <ThumbsUp className="w-5 h-5" />
                  <span className="font-medium">{voteCounts.upvotes}</span>
                </button>

                {/* Downvote */}
                <button
                  onClick={() => handleVote('downvote')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    userVote === 'downvote'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30'
                  }`}
                >
                  <ThumbsDown className="w-5 h-5" />
                  <span className="font-medium">{voteCounts.downvotes}</span>
                </button>

                {/* Trust Score */}
                <div className={`font-semibold ${getTrustScoreColor(voteCounts.trustScore)}`}>
                  {Math.round(voteCounts.trustScore)}% Trust
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Watchlist */}
                <button
                  onClick={handleWatchlist}
                  className={`p-2 rounded-lg transition-colors ${
                    inWatchlist
                      ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-orange-50'
                  }`}
                  title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                >
                  {inWatchlist ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                </button>

                {/* Dispute */}
                <button
                  onClick={() => setShowDisputeForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/30 transition-colors"
                >
                  <Flag className="w-5 h-5" />
                  Dispute
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'details', label: 'Details', icon: AlertCircle },
            { id: 'comments', label: `Comments (${comments.length})`, icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-orange-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Description */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Description</h2>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{report.description}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {report.victims_count > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
                  <Users className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {report.victims_count.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Reported Victims</div>
                </div>
              )}
              {report.estimated_loss_usd && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
                  <DollarSign className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${report.estimated_loss_usd.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Estimated Loss</div>
                </div>
              )}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
                <Clock className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {new Date(report.created_at).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">First Reported</div>
              </div>
              {report.dispute_count > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
                  <Flag className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {report.dispute_count}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Disputes</div>
                </div>
              )}
            </div>

            {/* Red Flags */}
            {report.red_flags && report.red_flags.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Red Flags
                </h2>
                <ul className="space-y-2">
                  {report.red_flags.map((flag, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span className="text-gray-600 dark:text-gray-400">{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Associated Data */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Associated Data</h2>
              <div className="space-y-4">
                {/* Website */}
                {report.website_url && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Website</div>
                      <a
                        href={report.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                      >
                        {report.website_url}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Contract Address */}
                {report.contract_address && (
                  <div className="flex items-start gap-3">
                    <FileCode className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Contract Address</div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono break-all">
                          {report.contract_address}
                        </code>
                        <button
                          onClick={() => copyToClipboard(report.contract_address!)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          {copiedAddress === report.contract_address ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Wallet Addresses */}
                {report.wallet_addresses && report.wallet_addresses.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Wallet className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Known Scam Addresses ({report.wallet_addresses.length})
                      </div>
                      <div className="space-y-2">
                        {report.wallet_addresses.map((addr, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono break-all">
                              {addr}
                            </code>
                            <button
                              onClick={() => copyToClipboard(addr)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex-shrink-0"
                            >
                              {copiedAddress === addr ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Addresses */}
                {report.email_addresses && report.email_addresses.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Associated Emails</div>
                      <div className="space-y-1">
                        {report.email_addresses.map((email, index) => (
                          <div key={index} className="text-gray-600 dark:text-gray-400">{email}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Social Media */}
                {report.social_media_links && Object.keys(report.social_media_links).length > 0 && (
                  <div className="flex items-start gap-3">
                    <Twitter className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Social Media</div>
                      <div className="space-y-1">
                        {Object.entries(report.social_media_links).map(([platform, url]) => (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                          >
                            {platform}: {url}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Evidence Links */}
            {report.evidence_links && report.evidence_links.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Evidence & References</h2>
                <ul className="space-y-2">
                  {report.evidence_links.map((link, index) => (
                    <li key={index}>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                      >
                        {link}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="space-y-6">
            {/* Add Comment */}
            {user ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add a Comment</h3>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your experience or information about this scam..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || submittingComment}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg font-medium flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {submittingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">Sign in to add a comment</p>
                <Link
                  to={`/login?redirect=${encodeURIComponent(`/scam/${id}`)}`}
                  className="text-orange-600 dark:text-orange-400 hover:underline"
                >
                  Sign In
                </Link>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to share information!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                          <span className="text-orange-600 dark:text-orange-400 font-medium">
                            {comment.user?.email?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {comment.user?.email?.split('@')[0] || 'Anonymous'}
                          </span>
                          {comment.is_admin && (
                            <span className="ml-2 px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">{comment.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Dispute Modal */}
        {showDisputeForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDisputeForm(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Flag className="w-6 h-6 text-yellow-500" />
                Dispute This Report
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                If you believe this report is inaccurate or the project is legitimate, you can submit a dispute for review.
              </p>

              {user ? (
                <form onSubmit={(e) => { e.preventDefault(); handleSubmitDispute(); }}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reason for Dispute *
                    </label>
                    <textarea
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      placeholder="Explain why you believe this report is incorrect..."
                      rows={4}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Evidence Links (one per line)
                    </label>
                    <textarea
                      value={disputeEvidence}
                      onChange={(e) => setDisputeEvidence(e.target.value)}
                      placeholder="https://example.com/proof&#10;https://another-source.com"
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none font-mono text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDisputeForm(false)}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!disputeReason.trim() || submittingDispute}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white rounded-lg font-medium"
                    >
                      {submittingDispute ? 'Submitting...' : 'Submit Dispute'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Please sign in to submit a dispute</p>
                  <Link
                    to={`/login?redirect=${encodeURIComponent(`/scam/${id}`)}`}
                    className="text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
