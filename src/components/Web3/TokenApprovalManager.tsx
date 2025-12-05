import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAuth } from '../../contexts/AuthContext';
import {
  getTokenApprovals,
  revokeTokenApproval,
  markApprovalAsRevoked,
} from '../../services/tokenApprovals';
import { Shield, AlertTriangle, XCircle, Loader, ExternalLink } from 'lucide-react';

interface TokenApproval {
  id: string;
  token_address: string;
  token_name: string | null;
  token_symbol: string | null;
  spender_address: string;
  spender_name: string | null;
  allowance: string | null;
  is_unlimited: boolean;
  chain: string;
  risk_level: 'low' | 'medium' | 'high' | 'unknown';
  approved_at: string | null;
  last_checked_at: string;
}

export function TokenApprovalManager() {
  const { address, chain } = useAccount();
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<TokenApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [revokingIds, setRevokingIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user && address) {
      loadApprovals();
    }
  }, [user, address]);

  async function loadApprovals() {
    if (!user) return;
    setLoading(true);

    const { data, error } = await getTokenApprovals(user.id, address);

    if (data) {
      setApprovals(data);
    } else if (error) {
      setMessage({ type: 'error', text: error });
    }

    setLoading(false);
  }

  async function handleRevoke(approval: TokenApproval) {
    if (!user) return;

    setRevokingIds(prev => new Set(prev).add(approval.id));

    const result = await revokeTokenApproval(
      approval.token_address,
      approval.spender_address,
      approval.chain
    );

    if (result.success && result.txHash) {
      await markApprovalAsRevoked(approval.id, result.txHash);
      setMessage({
        type: 'success',
        text: `Successfully revoked approval for ${approval.token_symbol}`,
      });
      await loadApprovals();
    } else {
      setMessage({
        type: 'error',
        text: result.error || 'Failed to revoke approval',
      });
    }

    setRevokingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(approval.id);
      return newSet;
    });

    setTimeout(() => setMessage(null), 5000);
  }

  function getRiskColor(level: string) {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  }

  function formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function getExplorerUrl(address: string, chain: string): string {
    const explorers: Record<string, string> = {
      ethereum: `https://etherscan.io/address/${address}`,
      polygon: `https://polygonscan.com/address/${address}`,
      arbitrum: `https://arbiscan.io/address/${address}`,
      optimism: `https://optimistic.etherscan.io/address/${address}`,
    };
    return explorers[chain.toLowerCase()] || '#';
  }

  return (
    <div className="token-approval-manager p-6 bg-white dark:bg-gray-900 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="text-blue-600" size={32} />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Token Approval Manager
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View and revoke token approvals for your connected wallet
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {!user && (
        <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg mb-4">
          Please log in to manage token approvals
        </div>
      )}

      {!address && user && (
        <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg mb-4">
          Please connect your wallet to view approvals
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-blue-600" size={48} />
        </div>
      )}

      {!loading && user && address && approvals.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Shield size={48} className="mx-auto mb-4 opacity-50" />
          <p>No token approvals found</p>
          <p className="text-sm mt-2">
            This is good! It means you haven't given any contracts permission to spend your tokens.
          </p>
        </div>
      )}

      {!loading && user && address && approvals.length > 0 && (
        <div className="space-y-4">
          {approvals.map((approval) => {
            const isRevoking = revokingIds.has(approval.id);

            return (
              <div
                key={approval.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-lg font-medium text-gray-900 dark:text-white">
                        {approval.token_name || 'Unknown Token'} ({approval.token_symbol || '???'})
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getRiskColor(
                          approval.risk_level
                        )}`}
                      >
                        {approval.risk_level.toUpperCase()} RISK
                      </span>
                      {approval.is_unlimited && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded flex items-center gap-1">
                          <AlertTriangle size={12} />
                          UNLIMITED
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <span>Spender:</span>
                        <span className="font-mono">
                          {approval.spender_name || formatAddress(approval.spender_address)}
                        </span>
                        <a
                          href={getExplorerUrl(approval.spender_address, approval.chain)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Chain:</span>
                        <span className="capitalize">{approval.chain}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevoke(approval)}
                    disabled={isRevoking}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    {isRevoking ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        Revoking...
                      </>
                    ) : (
                      <>
                        <XCircle size={18} />
                        Revoke
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          About Token Approvals
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Token approvals allow smart contracts to spend your tokens</li>
          <li>• Unlimited approvals can be risky if the contract is compromised</li>
          <li>• Regularly review and revoke unnecessary approvals</li>
          <li>• Revoking an approval requires a gas fee</li>
          <li>• You'll need to re-approve to use the protocol again</li>
        </ul>
      </div>
    </div>
  );
}
