import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAuth } from '../../contexts/AuthContext';
import {
  saveConnectedWallet,
  getUserWallets,
  syncWalletTransactions,
} from '../../services/walletSync';
import type { SyncProgress } from '../../services/walletSync';
import { Download, RefreshCw, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';

interface ConnectedWallet {
  id: string;
  wallet_address: string;
  chain: string;
  wallet_label: string | null;
  wallet_type: string | null;
  added_at: string;
  last_synced_at: string | null;
}

export function TransactionImport() {
  const { address, chain } = useAccount();
  const { user } = useAuth();
  const [wallets, setWallets] = useState<ConnectedWallet[]>([]);
  const [syncProgress, setSyncProgress] = useState<Map<string, SyncProgress>>(new Map());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadWallets();
    }
  }, [user]);

  useEffect(() => {
    // Auto-save connected wallet
    if (user && address && chain) {
      saveCurrentWallet();
    }
  }, [user, address, chain]);

  async function loadWallets() {
    if (!user) return;
    const { data } = await getUserWallets(user.id);
    if (data) {
      setWallets(data as ConnectedWallet[]);
    }
  }

  async function saveCurrentWallet() {
    if (!user || !address || !chain) return;

    await saveConnectedWallet(
      user.id,
      address,
      chain.name.toLowerCase(),
      'metamask',
      `${chain.name} Wallet`
    );

    await loadWallets();
  }

  async function handleSync(wallet: ConnectedWallet) {
    if (!user) {
      setMessage({ type: 'error', text: 'Please log in to sync transactions' });
      return;
    }

    const walletKey = `${wallet.chain}-${wallet.wallet_address}`;
    setLoading(true);

    setSyncProgress(prev => new Map(prev).set(walletKey, {
      status: 'in_progress',
      imported: 0,
      total: 0,
    }));

    const result = await syncWalletTransactions(
      user.id,
      wallet.wallet_address,
      wallet.chain,
      undefined,
      (progress) => {
        setSyncProgress(prev => new Map(prev).set(walletKey, progress));
      }
    );

    setLoading(false);

    if (result.success) {
      setMessage({
        type: 'success',
        text: `Successfully imported ${result.imported} transactions`,
      });
      await loadWallets();
    } else {
      setMessage({
        type: 'error',
        text: result.error || 'Failed to sync transactions',
      });
      setSyncProgress(prev => {
        const newMap = new Map(prev);
        newMap.delete(walletKey);
        return newMap;
      });
    }

    // Clear message after 5 seconds
    setTimeout(() => setMessage(null), 5000);
  }

  function formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  }

  return (
    <div className="transaction-import p-6 bg-white dark:bg-gray-900 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Transaction History Import
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Import on-chain transactions for tax reporting and portfolio analysis
          </p>
        </div>
        <Download className="text-blue-600" size={32} />
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
          Please log in to import transaction history
        </div>
      )}

      {user && wallets.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Download size={48} className="mx-auto mb-4 opacity-50" />
          <p>No wallets connected yet</p>
          <p className="text-sm mt-2">Connect your wallet to start importing transactions</p>
        </div>
      )}

      {user && wallets.length > 0 && (
        <div className="space-y-4">
          {wallets.map((wallet) => {
            const walletKey = `${wallet.chain}-${wallet.wallet_address}`;
            const progress = syncProgress.get(walletKey);

            return (
              <div
                key={wallet.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-medium text-gray-900 dark:text-white">
                        {wallet.wallet_label || formatAddress(wallet.wallet_address)}
                      </div>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                        {wallet.chain}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {formatAddress(wallet.wallet_address)}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <Clock size={14} />
                      Last synced: {formatDate(wallet.last_synced_at)}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSync(wallet)}
                    disabled={loading || progress?.status === 'in_progress'}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    {progress?.status === 'in_progress' ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={18} />
                        Sync Transactions
                      </>
                    )}
                  </button>
                </div>

                {progress && progress.status === 'in_progress' && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        Importing transactions...
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {progress.imported} / {progress.total || '?'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: progress.total
                            ? `${(progress.imported / progress.total) * 100}%`
                            : '50%',
                        }}
                      />
                    </div>
                  </div>
                )}

                {progress && progress.status === 'completed' && (
                  <div className="mt-4 flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                    <CheckCircle size={16} />
                    Sync completed successfully
                  </div>
                )}

                {progress && progress.status === 'failed' && (
                  <div className="mt-4 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <XCircle size={16} />
                    {progress.error || 'Sync failed'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          How it works
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Connect your wallet to automatically save it to your account</li>
          <li>• Click "Sync Transactions" to import your on-chain transaction history</li>
          <li>• Transactions are fetched from Alchemy for accuracy and speed</li>
          <li>• Re-sync anytime to get the latest transactions</li>
          <li>• Supports Ethereum, Polygon, Arbitrum, Optimism, and Solana</li>
        </ul>
      </div>
    </div>
  );
}
