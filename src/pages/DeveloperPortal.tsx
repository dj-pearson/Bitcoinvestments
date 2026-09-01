import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getApiKeys,
  createApiKey,
  revokeApiKey,
  getApiEndpoints,
  getApiUsageStats,
  getTierDetails,
  API_PERMISSIONS,
  getPermissionLabel,
  type ApiKey,
  type ApiEndpoint,
  type ApiUsageStats,
  type ApiTier,
} from '../services/apiAccess';

import { PageSEO } from '../components/PageSEO';
type TabId = 'keys' | 'docs' | 'usage' | 'settings';

export function DeveloperPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('keys');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [usageStats, setUsageStats] = useState<ApiUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['portfolio:read', 'market:read']);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentUserTier, setCurrentUserTier] = useState<ApiTier>('free');

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/developers/portal');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [keys, docs] = await Promise.all([
        getApiKeys(user.id),
        getApiEndpoints(),
      ]);
      setApiKeys(keys);
      setEndpoints(docs);

      if (keys.length > 0) {
        const stats = await getApiUsageStats(keys[0].id);
        setUsageStats(stats);
        setCurrentUserTier(keys[0].tier);
      }
    } catch (error) {
      console.error('Error loading developer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!user || !newKeyName.trim()) return;

    const result = await createApiKey(user.id, newKeyName, newKeyPermissions);
    if (result) {
      setCreatedKey(result.secretKey);
      setApiKeys([result.key, ...apiKeys]);
      setNewKeyName('');
      setNewKeyPermissions(['portfolio:read', 'market:read']);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    const success = await revokeApiKey(keyId);
    if (success) {
      setApiKeys(apiKeys.map(key =>
        key.id === keyId ? { ...key, status: 'revoked' } : key
      ));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const tierDetails = getTierDetails(currentUserTier);

  const categories = ['all', ...new Set(endpoints.map(e => e.category))];
  const filteredEndpoints = selectedCategory === 'all'
    ? endpoints
    : endpoints.filter(e => e.category === selectedCategory);

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    {
      id: 'keys',
      label: 'API Keys',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
    },
    {
      id: 'docs',
      label: 'API Reference',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'usage',
      label: 'Usage',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageSEO pageKey="developerPortal" urlPath="/developers/portal" />
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Developer Portal</h1>
          <p className="text-gray-400">
            Manage your API keys, view documentation, and monitor usage.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-gray-800 rounded-lg">
            <span className="text-gray-400 text-sm">Current Plan:</span>
            <span className="ml-2 font-semibold capitalize">{tierDetails?.name || 'Free'}</span>
          </div>
          <Link to="/developers/pricing" className="btn-primary">
            Upgrade Plan
          </Link>
        </div>
      </div>

      {/* Tier Usage Summary */}
      {tierDetails && (
        <div className="glass-card p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">API Keys</p>
              <p className="text-2xl font-bold">
                {apiKeys.filter(k => k.status === 'active').length}
                <span className="text-gray-500 text-lg">
                  /{tierDetails.maxKeys === -1 ? '∞' : tierDetails.maxKeys}
                </span>
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Requests Today</p>
              <p className="text-2xl font-bold">
                {apiKeys.reduce((sum, k) => sum + k.requestsToday, 0).toLocaleString()}
                <span className="text-gray-500 text-lg">
                  /{tierDetails.rateLimitPerDay.toLocaleString()}
                </span>
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Rate Limit</p>
              <p className="text-2xl font-bold">{tierDetails.rateLimitPerMinute}/min</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Support Level</p>
              <p className="text-2xl font-bold">{tierDetails.supportLevel}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'text-purple-400 border-purple-400'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* API Keys Tab */}
      {activeTab === 'keys' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Your API Keys</h2>
            <button
              onClick={() => setShowNewKeyModal(true)}
              className="btn-primary"
              disabled={tierDetails && apiKeys.filter(k => k.status === 'active').length >= tierDetails.maxKeys && tierDetails.maxKeys !== -1}
            >
              Create New Key
            </button>
          </div>

          {apiKeys.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <h3 className="text-xl font-semibold mb-2">No API Keys Yet</h3>
              <p className="text-gray-400 mb-6">Create your first API key to start building.</p>
              <button onClick={() => setShowNewKeyModal(true)} className="btn-primary">
                Create Your First Key
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div key={key.id} className="glass-card p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{key.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          key.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : key.status === 'revoked'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {key.status}
                        </span>
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full capitalize">
                          {key.tier}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <code className="bg-gray-800 px-3 py-1 rounded text-sm font-mono">
                          {key.keyPrefix}...
                        </code>
                        <button
                          onClick={() => copyToClipboard(key.keyPrefix)}
                          className="text-gray-400 hover:text-white"
                          title="Copy key prefix"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {key.permissions.map((perm) => (
                          <span key={perm} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                            {getPermissionLabel(perm)}
                          </span>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Requests Today:</span>
                          <span className="ml-2 font-medium">{key.requestsToday.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">This Month:</span>
                          <span className="ml-2 font-medium">{key.requestsThisMonth.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Last Used:</span>
                          <span className="ml-2 font-medium">
                            {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Created:</span>
                          <span className="ml-2 font-medium">
                            {new Date(key.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col gap-2">
                      {key.status === 'active' && (
                        <button
                          onClick={() => handleRevokeKey(key.id)}
                          className="btn-secondary text-red-400 border-red-400 hover:bg-red-400/10"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* API Reference Tab */}
      {activeTab === 'docs' && (
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold">API Reference</h2>

            <div className="flex gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    selectedCategory === cat
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredEndpoints.map((endpoint) => (
              <div key={endpoint.id} className="glass-card p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded text-sm font-mono font-bold ${
                      endpoint.method === 'GET' ? 'bg-green-500/20 text-green-400' :
                      endpoint.method === 'POST' ? 'bg-blue-500/20 text-blue-400' :
                      endpoint.method === 'PUT' ? 'bg-yellow-500/20 text-yellow-400' :
                      endpoint.method === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {endpoint.method}
                    </span>
                    <code className="text-lg font-mono">{endpoint.path}</code>
                    {endpoint.isDeprecated && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                        Deprecated
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Required tier:</span>
                    <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded capitalize">
                      {endpoint.requiredTier}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-2">{endpoint.name}</h3>
                <p className="text-gray-400 mb-4">{endpoint.description}</p>

                {endpoint.requiredPermissions.length > 0 && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-400 mr-2">Required permissions:</span>
                    {endpoint.requiredPermissions.map((perm) => (
                      <span key={perm} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded mr-2">
                        {perm}
                      </span>
                    ))}
                  </div>
                )}

                <details className="mt-4">
                  <summary className="cursor-pointer text-purple-400 hover:text-purple-300">
                    View Example
                  </summary>
                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Request</h4>
                      <pre className="bg-gray-900/50 p-4 rounded-lg overflow-x-auto text-sm">
                        <code className="text-gray-300">
                          {JSON.stringify(endpoint.exampleRequest, null, 2)}
                        </code>
                      </pre>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Response</h4>
                      <pre className="bg-gray-900/50 p-4 rounded-lg overflow-x-auto text-sm">
                        <code className="text-gray-300">
                          {JSON.stringify(endpoint.exampleResponse, null, 2)}
                        </code>
                      </pre>
                    </div>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Tab */}
      {activeTab === 'usage' && usageStats && (
        <div>
          <h2 className="text-xl font-bold mb-6">API Usage Statistics</h2>

          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="glass-card p-6">
              <p className="text-gray-400 text-sm mb-1">Total Requests</p>
              <p className="text-3xl font-bold">{usageStats.totalRequests.toLocaleString()}</p>
            </div>
            <div className="glass-card p-6">
              <p className="text-gray-400 text-sm mb-1">Success Rate</p>
              <p className="text-3xl font-bold text-green-400">
                {((usageStats.successfulRequests / usageStats.totalRequests) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="glass-card p-6">
              <p className="text-gray-400 text-sm mb-1">Failed Requests</p>
              <p className="text-3xl font-bold text-red-400">{usageStats.failedRequests.toLocaleString()}</p>
            </div>
            <div className="glass-card p-6">
              <p className="text-gray-400 text-sm mb-1">Avg Response Time</p>
              <p className="text-3xl font-bold">{usageStats.averageResponseTime}ms</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Requests by Endpoint</h3>
              <div className="space-y-3">
                {Object.entries(usageStats.requestsByEndpoint)
                  .sort(([, a], [, b]) => b - a)
                  .map(([endpoint, count]) => (
                    <div key={endpoint} className="flex justify-between items-center">
                      <code className="text-sm text-gray-300">{endpoint}</code>
                      <span className="font-medium">{count.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Errors by Type</h3>
              <div className="space-y-3">
                {Object.entries(usageStats.errorsByType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([code, count]) => (
                    <div key={code} className="flex justify-between items-center">
                      <span className={`px-2 py-1 rounded text-sm ${
                        code.startsWith('4') ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {code}
                      </span>
                      <span className="font-medium">{count.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="glass-card p-6 mt-8">
            <h3 className="text-lg font-semibold mb-4">Daily Request Volume (Last 30 Days)</h3>
            <div className="flex items-end gap-1 h-40">
            {usageStats.requestsByDay.map((day) => {
              const maxCount = Math.max(...usageStats.requestsByDay.map(d => d.count));
              const height = (day.count / maxCount) * 100;
              return (
                <div
                  key={day.date}
                  className="flex-1 bg-purple-500/50 hover:bg-purple-500 transition-colors rounded-t cursor-pointer group relative"
                  style={{ height: `${height}%` }}
                  title={`${day.date}: ${day.count.toLocaleString()} requests`}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {day.count.toLocaleString()}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl">
          <h2 className="text-xl font-bold mb-6">API Settings</h2>

          <div className="glass-card p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Current Plan</h3>
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div>
                <p className="font-medium capitalize">{tierDetails?.name} Plan</p>
                <p className="text-sm text-gray-400">{tierDetails?.description}</p>
              </div>
              <Link to="/developers/pricing" className="btn-primary">
                Upgrade
              </Link>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">Webhook Settings</h3>
            <p className="text-gray-400 mb-4">
              Configure webhooks to receive real-time notifications for events.
            </p>
            {tierDetails?.webhooks ? (
              <button className="btn-secondary">
                Configure Webhooks
              </button>
            ) : (
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <p className="text-gray-400">
                  Webhooks are available on Professional and Enterprise plans.
                </p>
                <Link to="/developers/pricing" className="text-purple-400 hover:underline text-sm">
                  Upgrade to enable webhooks
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Key Modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-8 max-w-md w-full">
            {createdKey ? (
              <>
                <h3 className="text-xl font-bold mb-4">API Key Created</h3>
                <div className="bg-yellow-500/20 border border-yellow-500/30 p-4 rounded-lg mb-6">
                  <p className="text-yellow-400 text-sm mb-2">
                    Copy this key now. You won't be able to see it again!
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-900 px-3 py-2 rounded text-sm font-mono break-all">
                      {createdKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(createdKey)}
                      className="btn-primary px-3 py-2"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCreatedKey(null);
                    setShowNewKeyModal(false);
                  }}
                  className="btn-primary w-full"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-6">Create New API Key</h3>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Key Name</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production Key, Development Key"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Permissions</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {Object.entries(API_PERMISSIONS).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.includes(key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewKeyPermissions([...newKeyPermissions, key]);
                            } else {
                              setNewKeyPermissions(newKeyPermissions.filter(p => p !== key));
                            }
                          }}
                          className="rounded bg-gray-800 border-gray-700"
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowNewKeyModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateKey}
                    disabled={!newKeyName.trim() || newKeyPermissions.length === 0}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    Create Key
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
