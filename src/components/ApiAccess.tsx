import { useState, useEffect } from 'react';
import {
  getApiKeys,
  createApiKey,
  revokeApiKey,
  getApiEndpoints,
  getApiUsageStats,
  getApiTiers,
  API_PERMISSIONS,
} from '../services/apiAccess';
import type {
  ApiKey,
  ApiEndpoint,
  ApiUsageStats,
  ApiTierDetails,
  EndpointCategory
} from '../services/apiAccess';

type TabType = 'keys' | 'docs' | 'usage' | 'pricing';

export const ApiAccess: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('keys');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [usageStats, setUsageStats] = useState<ApiUsageStats | null>(null);
  const [tiers, setTiers] = useState<ApiTierDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newSecretKey, setNewSecretKey] = useState<string>('');
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<EndpointCategory | 'all'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [keysData, endpointsData, tiersData] = await Promise.all([
      getApiKeys('demo-user'),
      getApiEndpoints(),
      Promise.resolve(getApiTiers())
    ]);
    setApiKeys(keysData);
    setEndpoints(endpointsData);
    setTiers(tiersData);

    if (keysData.length > 0) {
      const stats = await getApiUsageStats(keysData[0].id);
      setUsageStats(stats);
    }
    setLoading(false);
  };

  const handleCreateKey = async (name: string, permissions: string[]) => {
    const result = await createApiKey('demo-user', name, permissions);
    if (result) {
      setNewSecretKey(result.secretKey);
      setShowCreateModal(false);
      setShowKeyModal(true);
      loadData();
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      await revokeApiKey(keyId);
      loadData();
    }
  };

  const filteredEndpoints = categoryFilter === 'all'
    ? endpoints
    : endpoints.filter(e => e.category === categoryFilter);

  const categories: EndpointCategory[] = ['portfolio', 'market', 'trading', 'analytics', 'social', 'account'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          API Access
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Build powerful crypto applications with our comprehensive API
        </p>
      </div>

      {/* Quick Start Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Get Started in Minutes</h2>
            <p className="text-blue-100 mb-4">
              Create an API key and start building your crypto application today
            </p>
            <code className="bg-white/20 px-3 py-1 rounded text-sm">
              curl -H "Authorization: Bearer YOUR_API_KEY" https://api.bitcoinvestments.com/v1/portfolio
            </code>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Create API Key
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'keys', label: 'API Keys', icon: '🔑' },
            { id: 'docs', label: 'Documentation', icon: '📚' },
            { id: 'usage', label: 'Usage & Analytics', icon: '📊' },
            { id: 'pricing', label: 'Pricing', icon: '💎' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'keys' && (
        <ApiKeysTab
          apiKeys={apiKeys}
          onCreateKey={() => setShowCreateModal(true)}
          onRevokeKey={handleRevokeKey}
        />
      )}

      {activeTab === 'docs' && (
        <DocumentationTab
          endpoints={filteredEndpoints}
          categories={categories}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          selectedEndpoint={selectedEndpoint}
          setSelectedEndpoint={setSelectedEndpoint}
        />
      )}

      {activeTab === 'usage' && (
        <UsageTab
          stats={usageStats}
          apiKeys={apiKeys}
        />
      )}

      {activeTab === 'pricing' && (
        <PricingTab tiers={tiers} />
      )}

      {/* Create Key Modal */}
      {showCreateModal && (
        <CreateKeyModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateKey}
        />
      )}

      {/* Show Secret Key Modal */}
      {showKeyModal && (
        <SecretKeyModal
          secretKey={newSecretKey}
          onClose={() => {
            setShowKeyModal(false);
            setNewSecretKey('');
          }}
        />
      )}
    </div>
  );
};

// API Keys Tab
const ApiKeysTab: React.FC<{
  apiKeys: ApiKey[];
  onCreateKey: () => void;
  onRevokeKey: (id: string) => void;
}> = ({ apiKeys, onCreateKey, onRevokeKey }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your API Keys</h2>
      <button
        onClick={onCreateKey}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        + Create New Key
      </button>
    </div>

    {apiKeys.length === 0 ? (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">🔑</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No API Keys Yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Create your first API key to start building
        </p>
        <button
          onClick={onCreateKey}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create API Key
        </button>
      </div>
    ) : (
      <div className="space-y-4">
        {apiKeys.map(key => (
          <div
            key={key.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{key.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    key.status === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {key.status}
                  </span>
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                    {key.tier}
                  </span>
                </div>
                <code className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {key.keyPrefix}...
                </code>
              </div>
              <button
                onClick={() => onRevokeKey(key.id)}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
                disabled={key.status !== 'active'}
              >
                Revoke
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Requests Today</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {key.requestsToday.toLocaleString()} / {key.rateLimitPerDay.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">This Month</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {key.requestsThisMonth.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Rate Limit</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {key.rateLimitPerMinute}/min
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Last Used</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Permissions</p>
              <div className="flex flex-wrap gap-2">
                {key.permissions.map(perm => (
                  <span
                    key={perm}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Documentation Tab
const DocumentationTab: React.FC<{
  endpoints: ApiEndpoint[];
  categories: EndpointCategory[];
  categoryFilter: EndpointCategory | 'all';
  setCategoryFilter: (cat: EndpointCategory | 'all') => void;
  selectedEndpoint: ApiEndpoint | null;
  setSelectedEndpoint: (ep: ApiEndpoint | null) => void;
}> = ({ endpoints, categories, categoryFilter, setCategoryFilter, selectedEndpoint, setSelectedEndpoint }) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Sidebar */}
    <div className="lg:col-span-1">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Endpoints</h3>

        {/* Category Filter */}
        <div className="mb-4">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as EndpointCategory | 'all')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Endpoint List */}
        <div className="space-y-2">
          {endpoints.map(endpoint => (
            <button
              key={endpoint.id}
              onClick={() => setSelectedEndpoint(endpoint)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedEndpoint?.id === endpoint.id
                  ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  endpoint.method === 'GET' ? 'bg-green-100 text-green-700' :
                  endpoint.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                  endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {endpoint.method}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{endpoint.requiredTier}</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{endpoint.name}</p>
              <code className="text-xs text-gray-500 dark:text-gray-400">{endpoint.path}</code>
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* Main Content */}
    <div className="lg:col-span-2">
      {selectedEndpoint ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              selectedEndpoint.method === 'GET' ? 'bg-green-100 text-green-700' :
              selectedEndpoint.method === 'POST' ? 'bg-blue-100 text-blue-700' :
              selectedEndpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {selectedEndpoint.method}
            </span>
            <code className="text-lg font-mono text-gray-900 dark:text-white">{selectedEndpoint.path}</code>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {selectedEndpoint.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{selectedEndpoint.description}</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Required Tier</p>
              <p className="font-medium text-gray-900 dark:text-white capitalize">{selectedEndpoint.requiredTier}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Rate Limit Multiplier</p>
              <p className="font-medium text-gray-900 dark:text-white">{selectedEndpoint.rateLimitMultiplier}x</p>
            </div>
          </div>

          {/* Example Request */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Example Request</h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`curl -X ${selectedEndpoint.method} \\
  'https://api.bitcoinvestments.com${selectedEndpoint.path}' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json'`}
            </pre>
          </div>

          {/* Example Response */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Example Response</h3>
            <pre className="bg-gray-900 text-blue-400 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(selectedEndpoint.exampleResponse, null, 2)}
            </pre>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Select an Endpoint
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Choose an endpoint from the sidebar to view its documentation
          </p>
        </div>
      )}
    </div>
  </div>
);

// Usage Tab
const UsageTab: React.FC<{
  stats: ApiUsageStats | null;
  apiKeys: ApiKey[];
}> = ({ stats, apiKeys }) => {
  if (!stats) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">No usage data available</p>
      </div>
    );
  }

  const successRate = ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Requests</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalRequests.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Success Rate</p>
          <p className="text-2xl font-bold text-green-600">{successRate}%</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Response Time</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.averageResponseTime}ms
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Failed Requests</p>
          <p className="text-2xl font-bold text-red-600">{stats.failedRequests.toLocaleString()}</p>
        </div>
      </div>

      {/* Requests by Endpoint */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Requests by Endpoint</h3>
        <div className="space-y-3">
          {Object.entries(stats.requestsByEndpoint)
            .sort(([, a], [, b]) => b - a)
            .map(([endpoint, count]) => (
              <div key={endpoint} className="flex items-center">
                <code className="text-sm text-gray-600 dark:text-gray-400 w-48 truncate">{endpoint}</code>
                <div className="flex-1 mx-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(count / stats.totalRequests) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white w-20 text-right">
                  {count.toLocaleString()}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Error Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Error Distribution</h3>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(stats.errorsByType).map(([code, count]) => (
            <div key={code} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold text-red-500">{count}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {code === '400' ? 'Bad Request' :
                 code === '401' ? 'Unauthorized' :
                 code === '429' ? 'Rate Limited' : `Error ${code}`}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Pricing Tab
const PricingTab: React.FC<{ tiers: ApiTierDetails[] }> = ({ tiers }) => (
  <div className="space-y-6">
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Choose Your Plan
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Scale your application with our flexible pricing tiers
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {tiers.map(tier => (
        <div
          key={tier.tier}
          className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-6 ${
            tier.tier === 'professional'
              ? 'border-blue-500 ring-2 ring-blue-500/20'
              : 'border-gray-200 dark:border-gray-700'
          }`}
        >
          {tier.tier === 'professional' && (
            <span className="inline-block px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full mb-4">
              Most Popular
            </span>
          )}

          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{tier.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-4">{tier.description}</p>

          <div className="mb-6">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              ${tier.priceMonthly}
            </span>
            <span className="text-gray-600 dark:text-gray-400">/month</span>
          </div>

          <button
            className={`w-full py-2 rounded-lg font-semibold transition-colors ${
              tier.tier === 'professional'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {tier.tier === 'free' ? 'Get Started' : 'Upgrade'}
          </button>

          <div className="mt-6 space-y-3">
            <div className="flex items-center text-sm">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-gray-600 dark:text-gray-400">
                {tier.rateLimitPerMinute} requests/min
              </span>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-gray-600 dark:text-gray-400">
                {tier.rateLimitPerDay.toLocaleString()} requests/day
              </span>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-gray-600 dark:text-gray-400">
                {tier.maxKeys === -1 ? 'Unlimited' : tier.maxKeys} API keys
              </span>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-green-500 mr-2">✓</span>
              <span className="text-gray-600 dark:text-gray-400">
                {tier.historicalData} historical data
              </span>
            </div>
            {tier.webhooks && (
              <div className="flex items-center text-sm">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-600 dark:text-gray-400">Webhooks</span>
              </div>
            )}
            {tier.realtimeData && (
              <div className="flex items-center text-sm">
                <span className="text-green-500 mr-2">✓</span>
                <span className="text-gray-600 dark:text-gray-400">Real-time data</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Create Key Modal
const CreateKeyModal: React.FC<{
  onClose: () => void;
  onCreate: (name: string, permissions: string[]) => void;
}> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['portfolio:read', 'market:read']);

  const togglePermission = (perm: string) => {
    setSelectedPermissions(prev =>
      prev.includes(perm)
        ? prev.filter(p => p !== perm)
        : [...prev, perm]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Create API Key
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Key Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Production Key"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Permissions
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(API_PERMISSIONS).map(([perm, label]) => (
              <label
                key={perm}
                className="flex items-center p-2 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(perm)}
                  onChange={() => togglePermission(perm)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(name, selectedPermissions)}
            disabled={!name.trim() || selectedPermissions.length === 0}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Key
          </button>
        </div>
      </div>
    </div>
  );
};

// Secret Key Modal
const SecretKeyModal: React.FC<{
  secretKey: string;
  onClose: () => void;
}> = ({ secretKey, onClose }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔑</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            API Key Created!
          </h2>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Important:</strong> Copy your secret key now. You won't be able to see it again!
          </p>
        </div>

        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <code className="text-sm text-gray-800 dark:text-gray-200 break-all">
            {secretKey}
          </code>
        </div>

        <div className="flex gap-3">
          <button
            onClick={copyToClipboard}
            className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {copied ? '✓ Copied!' : 'Copy Key'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiAccess;
