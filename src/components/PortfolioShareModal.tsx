import { useState, useEffect } from 'react';
import {
  Share2,
  X,
  Copy,
  Check,
  Eye,
  EyeOff,
  Lock,
  Calendar,
  Code,
  BarChart3,
  DollarSign,
  TrendingUp,
  FileText,
  RefreshCw,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import {
  createPortfolioShare,
  getPortfolioShare,
  updatePortfolioShare,
  deletePortfolioShare,
  generateEmbedCode,
  type SharedPortfolio,
  type CreateShareParams,
} from '../services/portfolioSharing';

interface PortfolioShareModalProps {
  portfolioId: string;
  portfolioName: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PortfolioShareModal({
  portfolioId,
  portfolioName,
  userId,
  isOpen,
  onClose,
}: PortfolioShareModalProps) {
  const [share, setShare] = useState<SharedPortfolio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'link' | 'embed' | null>(null);
  const [showEmbedCode, setShowEmbedCode] = useState(false);

  // Form state
  const [showAmounts, setShowAmounts] = useState(false);
  const [showCostBasis, setShowCostBasis] = useState(false);
  const [showProfitLoss, setShowProfitLoss] = useState(true);
  const [showTransactions, setShowTransactions] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(undefined);
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Load existing share
  useEffect(() => {
    if (isOpen) {
      loadShare();
    }
  }, [isOpen, portfolioId]);

  const loadShare = async () => {
    setIsLoading(true);
    setError(null);

    const result = await getPortfolioShare(portfolioId);

    if (result.error) {
      setError(result.error);
    } else if (result.share) {
      setShare(result.share);
      setShowAmounts(result.share.show_amounts);
      setShowCostBasis(result.share.show_cost_basis);
      setShowProfitLoss(result.share.show_profit_loss);
      setShowTransactions(result.share.show_transactions);
      setTitle(result.share.title || '');
      setDescription(result.share.description || '');
    }

    setIsLoading(false);
  };

  const handleCreateShare = async () => {
    setIsSaving(true);
    setError(null);

    const params: CreateShareParams = {
      portfolioId,
      userId,
      showAmounts,
      showCostBasis,
      showProfitLoss,
      showTransactions,
      expiresInDays,
      password: password || undefined,
      title: title || portfolioName,
      description: description || undefined,
    };

    const result = await createPortfolioShare(params);

    if (result.error) {
      setError(result.error);
    } else if (result.share) {
      setShare(result.share);
    }

    setIsSaving(false);
  };

  const handleUpdateShare = async () => {
    if (!share) return;

    setIsSaving(true);
    setError(null);

    const result = await updatePortfolioShare(share.id, {
      showAmounts,
      showCostBasis,
      showProfitLoss,
      showTransactions,
      expiresInDays,
      password: password || undefined,
      title: title || portfolioName,
      description: description || undefined,
    });

    if (result.error) {
      setError(result.error);
    } else {
      await loadShare();
    }

    setIsSaving(false);
  };

  const handleDeleteShare = async () => {
    if (!share) return;

    if (!confirm('Are you sure you want to delete this share link? This cannot be undone.')) {
      return;
    }

    setIsSaving(true);
    setError(null);

    const result = await deletePortfolioShare(share.id);

    if (result.error) {
      setError(result.error);
    } else {
      setShare(null);
      setPassword('');
    }

    setIsSaving(false);
  };

  const copyToClipboard = async (text: string, type: 'link' | 'embed') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getFullShareUrl = () => {
    if (!share) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}${share.share_url}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Share2 className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Share Portfolio</h2>
              <p className="text-sm text-slate-400">{portfolioName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 text-orange-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-center">
              {error}
            </div>
          ) : share ? (
            <>
              {/* Share Link */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Share Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={getFullShareUrl()}
                    readOnly
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(getFullShareUrl(), 'link')}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                  >
                    {copied === 'link' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <a
                    href={getFullShareUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="text-sm text-slate-400">Views</div>
                  <div className="text-2xl font-bold text-white">{share.view_count}</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                  <div className="text-sm text-slate-400">Created</div>
                  <div className="text-lg font-medium text-white">
                    {new Date(share.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3">Privacy Settings</h3>
                <div className="space-y-3">
                  <PrivacyToggle
                    icon={<DollarSign className="h-4 w-4" />}
                    label="Show amounts"
                    description="Display actual values in your currency"
                    checked={showAmounts}
                    onChange={setShowAmounts}
                  />
                  <PrivacyToggle
                    icon={<BarChart3 className="h-4 w-4" />}
                    label="Show cost basis"
                    description="Display purchase prices"
                    checked={showCostBasis}
                    onChange={setShowCostBasis}
                  />
                  <PrivacyToggle
                    icon={<TrendingUp className="h-4 w-4" />}
                    label="Show profit/loss"
                    description="Display gains and losses"
                    checked={showProfitLoss}
                    onChange={setShowProfitLoss}
                  />
                  <PrivacyToggle
                    icon={<FileText className="h-4 w-4" />}
                    label="Show transactions"
                    description="Display transaction history"
                    checked={showTransactions}
                    onChange={setShowTransactions}
                  />
                </div>
              </div>

              {/* Embed Code */}
              <div>
                <button
                  onClick={() => setShowEmbedCode(!showEmbedCode)}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <Code className="h-4 w-4" />
                  {showEmbedCode ? 'Hide' : 'Show'} Embed Code
                </button>
                {showEmbedCode && (
                  <div className="mt-3">
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                      <pre className="text-xs text-slate-300 whitespace-pre-wrap break-all">
                        {generateEmbedCode(share.share_code)}
                      </pre>
                    </div>
                    <button
                      onClick={() => copyToClipboard(generateEmbedCode(share.share_code), 'embed')}
                      className="mt-2 text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1"
                    >
                      {copied === 'embed' ? (
                        <>
                          <Check className="h-3 w-3" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Copy embed code
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <button
                  onClick={handleUpdateShare}
                  disabled={isSaving}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Update Settings'}
                </button>
                <button
                  onClick={handleDeleteShare}
                  disabled={isSaving}
                  className="px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Create New Share */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Share Title (optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={portfolioName}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell viewers about your portfolio strategy..."
                    rows={2}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 resize-none"
                  />
                </div>

                {/* Privacy Settings */}
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-3">What to show</h3>
                  <div className="space-y-3">
                    <PrivacyToggle
                      icon={<DollarSign className="h-4 w-4" />}
                      label="Show amounts"
                      description="Display actual values"
                      checked={showAmounts}
                      onChange={setShowAmounts}
                    />
                    <PrivacyToggle
                      icon={<TrendingUp className="h-4 w-4" />}
                      label="Show profit/loss"
                      description="Display gains and losses"
                      checked={showProfitLoss}
                      onChange={setShowProfitLoss}
                    />
                  </div>
                </div>

                {/* Security Options */}
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Security</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Lock className="h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password protect (optional)"
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <select
                        value={expiresInDays || ''}
                        onChange={(e) =>
                          setExpiresInDays(e.target.value ? Number(e.target.value) : undefined)
                        }
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
                      >
                        <option value="">Never expires</option>
                        <option value="1">Expires in 1 day</option>
                        <option value="7">Expires in 7 days</option>
                        <option value="30">Expires in 30 days</option>
                        <option value="90">Expires in 90 days</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateShare}
                disabled={isSaving}
                className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Share2 className="h-5 w-5" />
                )}
                {isSaving ? 'Creating...' : 'Create Share Link'}
              </button>

              <p className="text-xs text-slate-500 text-center">
                Only percentages will be shown by default. You can adjust privacy settings anytime.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Privacy Toggle Component
function PrivacyToggle({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
      <div className="text-slate-400">{icon}</div>
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-slate-500">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-orange-500' : 'bg-slate-600'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </label>
  );
}
