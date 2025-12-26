import { useState, useEffect } from 'react';
import {
  Link2,
  Plus,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  ExternalLink,
  X,
  Lock,
  Wallet,
  ArrowRightLeft,
} from 'lucide-react';
import {
  getConnections,
  connectExchangeWithApiKey,
  syncConnection,
  disconnectExchange,
  getAllBalances,
  getAggregatedPortfolio,
  EXCHANGES,
  type Exchange,
  type ExchangeConnection,
  type ExchangeBalance,
} from '../services/exchangeConnections';

interface ExchangeConnectionsProps {
  userId: string;
  isPremium?: boolean;
}

export function ExchangeConnections({ userId, isPremium }: ExchangeConnectionsProps) {
  const [connections, setConnections] = useState<ExchangeConnection[]>([]);
  const [balances, setBalances] = useState<ExchangeBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncingConnection, setSyncingConnection] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<{
    totalValue: number;
    byExchange: { exchange: Exchange; value: number; assets: number }[];
    byAsset: { asset: string; total: number; value: number; exchanges: string[] }[];
  } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const [connectionsResult, portfolioResult] = await Promise.all([
      getConnections(userId),
      getAggregatedPortfolio(userId),
    ]);

    if (!connectionsResult.error) {
      setConnections(connectionsResult.connections);
    }
    setPortfolio(portfolioResult);

    const balancesResult = await getAllBalances(userId);
    if (!balancesResult.error) {
      setBalances(balancesResult.balances);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleSync = async (connectionId: string) => {
    setSyncingConnection(connectionId);
    await syncConnection(connectionId, userId);
    await loadData();
    setSyncingConnection(null);
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this exchange?')) {
      return;
    }
    await disconnectExchange(connectionId, userId);
    await loadData();
  };

  const handleConnectionSuccess = async () => {
    setShowAddModal(false);
    await loadData();
  };

  if (!isPremium) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center">
        <Lock className="h-16 w-16 text-purple-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Premium Feature</h2>
        <p className="text-slate-400 mb-6 max-w-md mx-auto">
          Connect your exchange accounts to automatically sync your portfolio.
          Upgrade to Premium to unlock this feature.
        </p>
        <button className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
          Upgrade to Premium
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Link2 className="h-7 w-7 text-purple-400" />
              Exchange Connections
            </h1>
            <p className="text-slate-400 mt-1">
              Connect your exchanges to auto-sync your portfolio
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Connect Exchange
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      {portfolio && portfolio.totalValue > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Wallet className="h-5 w-5" />
              <span>Total Value</span>
            </div>
            <div className="text-3xl font-bold text-white">
              ${portfolio.totalValue.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Link2 className="h-5 w-5" />
              <span>Connected Exchanges</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {connections.filter((c) => c.status === 'active').length}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <ArrowRightLeft className="h-5 w-5" />
              <span>Unique Assets</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {portfolio.byAsset.length}
            </div>
          </div>
        </div>
      )}

      {/* Connected Exchanges */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Connected Exchanges</h2>
        </div>

        {connections.length === 0 ? (
          <div className="p-8 text-center">
            <Link2 className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Exchanges Connected</h3>
            <p className="text-slate-400 mb-4">
              Connect your first exchange to start auto-syncing your portfolio
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              Connect Exchange
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {connections.map((connection) => (
              <ConnectionRow
                key={connection.id}
                connection={connection}
                balances={balances.filter((b) => b.connectionId === connection.id)}
                isSyncing={syncingConnection === connection.id}
                onSync={() => handleSync(connection.id)}
                onDisconnect={() => handleDisconnect(connection.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Aggregated Balances */}
      {portfolio && portfolio.byAsset.length > 0 && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Aggregated Holdings</h2>
          </div>
          <div className="divide-y divide-slate-700">
            {portfolio.byAsset.map((asset) => (
              <div key={asset.asset} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">{asset.asset}</div>
                  <div className="text-sm text-slate-400">
                    {asset.exchanges.length} exchange{asset.exchanges.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-white">
                    {asset.total.toLocaleString()} {asset.asset}
                  </div>
                  <div className="text-sm text-slate-400">
                    ${asset.value.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Exchange Modal */}
      {showAddModal && (
        <AddExchangeModal
          userId={userId}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleConnectionSuccess}
        />
      )}
    </div>
  );
}

// Connection Row Component
function ConnectionRow({
  connection,
  balances,
  isSyncing,
  onSync,
  onDisconnect,
}: {
  connection: ExchangeConnection;
  balances: ExchangeBalance[];
  isSyncing: boolean;
  onSync: () => void;
  onDisconnect: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const exchange = EXCHANGES[connection.exchangeId];
  const totalValue = balances.reduce((sum, b) => sum + b.usdValue, 0);

  const getStatusIcon = () => {
    switch (connection.status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'syncing':
        return <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case 'expired':
        return <Clock className="h-5 w-5 text-yellow-400" />;
    }
  };

  return (
    <div>
      <div className="p-4 flex items-center gap-4">
        {/* Exchange Logo */}
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
          {exchange?.logo ? (
            <img src={exchange.logo} alt={exchange.name} className="w-8 h-8" />
          ) : (
            <Link2 className="h-6 w-6 text-slate-400" />
          )}
        </div>

        {/* Connection Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{connection.exchangeName}</span>
            {getStatusIcon()}
          </div>
          <div className="text-sm text-slate-400">
            {connection.lastSyncAt
              ? `Last synced ${new Date(connection.lastSyncAt).toLocaleString()}`
              : 'Never synced'}
          </div>
          {connection.lastError && (
            <div className="text-sm text-red-400">{connection.lastError}</div>
          )}
        </div>

        {/* Value */}
        <div className="text-right">
          <div className="font-medium text-white">${totalValue.toLocaleString()}</div>
          <div className="text-sm text-slate-400">{balances.length} assets</div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            {isExpanded ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onDisconnect}
            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Expanded Balances */}
      {isExpanded && balances.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-400">
                  <th className="pb-2">Asset</th>
                  <th className="pb-2 text-right">Available</th>
                  <th className="pb-2 text-right">Locked</th>
                  <th className="pb-2 text-right">Total</th>
                  <th className="pb-2 text-right">Value</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((balance) => (
                  <tr key={balance.asset} className="text-sm">
                    <td className="py-2">
                      <span className="font-medium text-white">{balance.asset}</span>
                    </td>
                    <td className="py-2 text-right text-slate-300">
                      {balance.free.toLocaleString()}
                    </td>
                    <td className="py-2 text-right text-slate-400">
                      {balance.locked > 0 ? balance.locked.toLocaleString() : '-'}
                    </td>
                    <td className="py-2 text-right text-white">
                      {balance.total.toLocaleString()}
                    </td>
                    <td className="py-2 text-right text-white">
                      ${balance.usdValue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Add Exchange Modal
function AddExchangeModal({
  userId,
  onClose,
  onSuccess,
}: {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [showSecrets, setShowSecrets] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supportedExchanges = Object.values(EXCHANGES).filter((e) => e.isSupported);
  const comingSoonExchanges = Object.values(EXCHANGES).filter((e) => e.comingSoon);

  const handleConnect = async () => {
    if (!selectedExchange) return;

    setIsConnecting(true);
    setError(null);

    const result = await connectExchangeWithApiKey(
      userId,
      selectedExchange.id,
      apiKey,
      apiSecret,
      passphrase || undefined
    );

    if (result.error) {
      setError(result.error);
      setIsConnecting(false);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            {selectedExchange ? `Connect ${selectedExchange.name}` : 'Connect Exchange'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {!selectedExchange ? (
            <>
              {/* Exchange Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-400 uppercase mb-3">
                  Supported Exchanges
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {supportedExchanges.map((exchange) => (
                    <button
                      key={exchange.id}
                      onClick={() => setSelectedExchange(exchange)}
                      className="p-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-purple-500/50 transition-all text-left"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {exchange.logo && (
                          <img
                            src={exchange.logo}
                            alt={exchange.name}
                            className="w-8 h-8 rounded"
                          />
                        )}
                        <span className="font-medium text-white">{exchange.name}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {exchange.authType === 'oauth' ? 'OAuth' : 'API Key'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {comingSoonExchanges.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 uppercase mb-3">
                    Coming Soon
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {comingSoonExchanges.map((exchange) => (
                      <div
                        key={exchange.id}
                        className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl opacity-50"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          {exchange.logo && (
                            <img
                              src={exchange.logo}
                              alt={exchange.name}
                              className="w-8 h-8 rounded"
                            />
                          )}
                          <span className="font-medium text-white">{exchange.name}</span>
                        </div>
                        <div className="text-xs text-slate-400">Coming Soon</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* API Key Form */}
              <button
                onClick={() => setSelectedExchange(null)}
                className="text-sm text-slate-400 hover:text-white mb-4"
              >
                ← Back to exchange list
              </button>

              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-white mb-2">Instructions</h4>
                <ol className="text-sm text-slate-400 list-decimal list-inside space-y-1">
                  <li>
                    Go to{' '}
                    <a
                      href={selectedExchange.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300"
                    >
                      {selectedExchange.name}
                      <ExternalLink className="inline h-3 w-3 ml-1" />
                    </a>
                  </li>
                  <li>Navigate to API Management / API Keys</li>
                  <li>Create a new API key with read-only permissions</li>
                  <li>Copy the API Key and Secret here</li>
                </ol>
                <div className="mt-3 text-xs text-slate-500">
                  Required permissions: {selectedExchange.permissions.join(', ')}
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4 text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    API Key
                  </label>
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    API Secret
                  </label>
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    placeholder="Enter your API secret"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500"
                  />
                </div>

                {selectedExchange.id === 'kucoin' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Passphrase
                    </label>
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Enter your API passphrase"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 text-sm text-slate-400">
                  <input
                    type="checkbox"
                    checked={showSecrets}
                    onChange={(e) => setShowSecrets(e.target.checked)}
                    className="rounded border-slate-600"
                  />
                  Show secrets
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConnect}
                  disabled={!apiKey || !apiSecret || isConnecting}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
