import { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  ExternalLink,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  fetchTokenApprovals,
  calculateApprovalSummary,
  generateRevokeData,
  markApprovalRevoked,
  getRiskLevelStyles,
  type TokenApproval,
  type ApprovalSummary,
} from '../services/tokenApprovalManager';

interface TokenApprovalManagerProps {
  walletAddress: string;
  chain?: string;
  onRevoke?: (approval: TokenApproval, txHash: string) => void;
}

export function TokenApprovalManager({
  walletAddress,
  chain = 'ethereum',
  onRevoke,
}: TokenApprovalManagerProps) {
  const [approvals, setApprovals] = useState<TokenApproval[]>([]);
  const [summary, setSummary] = useState<ApprovalSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedApproval, setExpandedApproval] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'high-risk' | 'unlimited'>('all');

  // Fetch approvals on mount
  useEffect(() => {
    loadApprovals();
  }, [walletAddress, chain]);

  const loadApprovals = async () => {
    setIsLoading(true);
    setError(null);

    const result = await fetchTokenApprovals(walletAddress, chain);

    if (result.error) {
      setError(result.error);
    } else {
      setApprovals(result.approvals);
      setSummary(calculateApprovalSummary(result.approvals));
    }

    setIsLoading(false);
  };

  const handleRevoke = async (approval: TokenApproval) => {
    if (!window.ethereum) {
      alert('Please connect a wallet to revoke approvals');
      return;
    }

    setRevokingId(approval.id);

    try {
      const txData = generateRevokeData(approval.tokenAddress, approval.spenderAddress);

      // Request transaction from wallet
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: walletAddress,
            to: txData.to,
            data: txData.data,
          },
        ],
      });

      // Mark as revoked in database
      await markApprovalRevoked(approval.id, txHash);

      // Update local state
      setApprovals((prev) => prev.filter((a) => a.id !== approval.id));
      setSummary((prev) =>
        prev ? calculateApprovalSummary(approvals.filter((a) => a.id !== approval.id)) : null
      );

      onRevoke?.(approval, txHash);
    } catch (err) {
      console.error('Error revoking approval:', err);
      alert(err instanceof Error ? err.message : 'Failed to revoke approval');
    } finally {
      setRevokingId(null);
    }
  };

  // Filter approvals
  const filteredApprovals = approvals.filter((approval) => {
    if (filter === 'high-risk') {
      return approval.riskLevel === 'high' || approval.riskLevel === 'critical';
    }
    if (filter === 'unlimited') {
      return approval.isUnlimited;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-400">{error}</p>
        <button
          onClick={loadApprovals}
          className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard
            label="Total Approvals"
            value={summary.totalApprovals}
            icon={<Shield className="h-5 w-5" />}
          />
          <SummaryCard
            label="Unlimited"
            value={summary.unlimitedApprovals}
            icon={<AlertTriangle className="h-5 w-5" />}
            highlight={summary.unlimitedApprovals > 0 ? 'warning' : undefined}
          />
          <SummaryCard
            label="High Risk"
            value={summary.highRiskApprovals}
            icon={<AlertTriangle className="h-5 w-5" />}
            highlight={summary.highRiskApprovals > 0 ? 'danger' : undefined}
          />
          <SummaryCard
            label="Risk Score"
            value={`${summary.riskScore}/100`}
            icon={<Shield className="h-5 w-5" />}
            highlight={
              summary.riskScore > 60
                ? 'danger'
                : summary.riskScore > 30
                ? 'warning'
                : 'success'
            }
          />
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-orange-500 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          All ({approvals.length})
        </button>
        <button
          onClick={() => setFilter('high-risk')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'high-risk'
              ? 'bg-red-500 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          High Risk ({approvals.filter((a) => a.riskLevel === 'high' || a.riskLevel === 'critical').length})
        </button>
        <button
          onClick={() => setFilter('unlimited')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'unlimited'
              ? 'bg-yellow-500 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Unlimited ({approvals.filter((a) => a.isUnlimited).length})
        </button>
        <button
          onClick={loadApprovals}
          className="ml-auto p-2 text-slate-400 hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Approvals List */}
      {filteredApprovals.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {filter === 'all' ? 'No Token Approvals Found' : 'No Matching Approvals'}
          </h3>
          <p className="text-slate-400">
            {filter === 'all'
              ? "Great! You don't have any token approvals to manage."
              : 'No approvals match the current filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApprovals.map((approval) => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              isExpanded={expandedApproval === approval.id}
              isRevoking={revokingId === approval.id}
              onToggle={() =>
                setExpandedApproval(expandedApproval === approval.id ? null : approval.id)
              }
              onRevoke={() => handleRevoke(approval)}
            />
          ))}
        </div>
      )}

      {/* Info Note */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-300">
          <p className="font-medium mb-1">Why Manage Token Approvals?</p>
          <p className="text-blue-400">
            Token approvals allow smart contracts to spend your tokens. Unlimited approvals or
            approvals to unknown contracts can be exploited if the contract is compromised.
            Regularly review and revoke unnecessary approvals.
          </p>
        </div>
      </div>
    </div>
  );
}

// Summary Card Component
function SummaryCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  highlight?: 'success' | 'warning' | 'danger';
}) {
  const colors = {
    success: 'text-green-400',
    warning: 'text-yellow-400',
    danger: 'text-red-400',
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${highlight ? colors[highlight] : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}

// Approval Card Component
function ApprovalCard({
  approval,
  isExpanded,
  isRevoking,
  onToggle,
  onRevoke,
}: {
  approval: TokenApproval;
  isExpanded: boolean;
  isRevoking: boolean;
  onToggle: () => void;
  onRevoke: () => void;
}) {
  const riskStyles = getRiskLevelStyles(approval.riskLevel);

  return (
    <div
      className={`bg-slate-800/50 border rounded-xl overflow-hidden transition-colors ${
        approval.riskLevel === 'critical'
          ? 'border-red-500/50'
          : approval.riskLevel === 'high'
          ? 'border-orange-500/50'
          : 'border-slate-700'
      }`}
    >
      {/* Header */}
      <div
        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
        onClick={onToggle}
      >
        {/* Token Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {approval.tokenLogo && (
              <img
                src={approval.tokenLogo}
                alt={approval.tokenSymbol}
                className="w-6 h-6 rounded-full"
              />
            )}
            <span className="font-medium text-white">{approval.tokenSymbol}</span>
            <span className="text-slate-500 text-sm truncate">{approval.tokenName}</span>
          </div>
          <div className="text-sm text-slate-400">
            Approved to:{' '}
            <span className="text-slate-300">
              {approval.spenderName || `${approval.spenderAddress.slice(0, 8)}...${approval.spenderAddress.slice(-6)}`}
            </span>
          </div>
        </div>

        {/* Allowance */}
        <div className="text-right">
          <div
            className={`text-sm font-medium ${
              approval.isUnlimited ? 'text-yellow-400' : 'text-white'
            }`}
          >
            {approval.allowanceFormatted}
          </div>
          <div
            className={`text-xs px-2 py-0.5 rounded-full inline-block ${riskStyles.bg} ${riskStyles.text}`}
          >
            {approval.riskLevel.toUpperCase()}
          </div>
        </div>

        {/* Expand Icon */}
        <div className="text-slate-400">
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-700 pt-4">
          {/* Risk Reasons */}
          {approval.riskReasons.length > 0 && (
            <div className={`p-3 rounded-lg ${riskStyles.bg}`}>
              <div className={`text-sm font-medium ${riskStyles.text} mb-2`}>Risk Factors:</div>
              <ul className="space-y-1">
                {approval.riskReasons.map((reason, index) => (
                  <li key={index} className={`text-sm ${riskStyles.text} flex items-center gap-2`}>
                    <AlertTriangle className="h-3 w-3" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-slate-500 mb-1">Token Address</div>
              <a
                href={`https://etherscan.io/token/${approval.tokenAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                {approval.tokenAddress.slice(0, 10)}...{approval.tokenAddress.slice(-8)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div>
              <div className="text-slate-500 mb-1">Spender Address</div>
              <a
                href={`https://etherscan.io/address/${approval.spenderAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                {approval.spenderAddress.slice(0, 10)}...{approval.spenderAddress.slice(-8)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            {approval.approvalTxHash && (
              <div>
                <div className="text-slate-500 mb-1">Approval Transaction</div>
                <a
                  href={`https://etherscan.io/tx/${approval.approvalTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  View on Etherscan
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            {approval.approvedAt && (
              <div>
                <div className="text-slate-500 mb-1">Approved At</div>
                <div className="text-slate-300">
                  {new Date(approval.approvedAt).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>

          {/* Revoke Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRevoke();
            }}
            disabled={isRevoking}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRevoking ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Revoking...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Revoke Approval
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// Add ethereum type to window
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<string>;
    };
  }
}
