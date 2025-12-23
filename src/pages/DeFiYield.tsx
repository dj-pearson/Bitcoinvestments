/**
 * DeFi Yield Aggregator Page
 *
 * Compare yield farming opportunities across protocols.
 * Show APY, risks, and impermanent loss calculations.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  Search,
  ChevronRight,
  Check,
  Calculator,
  BarChart3,
  Info,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  SUPPORTED_DEFI_CHAINS,
  DEFI_YIELD_PRICING,
  getProtocols,
  getPools,
  getYieldOpportunities,
  estimateImpermanentLoss,
  IL_REFERENCE_TABLE,
  getRiskColor,
  formatApy,
  formatTvl,
  getPoolTypeLabel,
  getAffiliateUrl,
  trackAffiliateClick,
} from '../services/defiYield';
import type { DeFiPool, DeFiProtocol, YieldOpportunity, DeFiProtocolType, DeFiRiskLevel } from '../types/premiumFeatures';

export default function DeFiYieldPage() {
  const { user } = useAuth();
  const [isPremium] = useState(false);
  const [pools, setPools] = useState<DeFiPool[]>([]);
  const [opportunities, setOpportunities] = useState<YieldOpportunity[]>([]);
  const [protocols] = useState(getProtocols());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<DeFiProtocolType | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<DeFiRiskLevel | null>(null);
  const [minApy] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showILCalculator, setShowILCalculator] = useState(false);
  const [selectedPool, setSelectedPool] = useState<DeFiPool | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedChain, selectedType, selectedRisk, minApy]);

  async function loadData() {
    setIsLoading(true);
    try {
      const poolData = await getPools({
        chain: selectedChain || undefined,
        poolType: selectedType || undefined,
        maxRisk: selectedRisk || undefined,
        minApy: minApy > 0 ? minApy : undefined,
        limit: isPremium ? undefined : 30,
      });
      setPools(poolData);

      const opps = await getYieldOpportunities({
        chain: selectedChain || undefined,
        riskTolerance: selectedRisk || undefined,
        limit: 10,
      });
      setOpportunities(opps);
    } catch (err) {
      console.error('Failed to load DeFi data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredPools = pools.filter(pool => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      pool.pool_name.toLowerCase().includes(query) ||
      pool.protocol_name.toLowerCase().includes(query) ||
      pool.token_a_symbol.toLowerCase().includes(query) ||
      (pool.token_b_symbol && pool.token_b_symbol.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              DeFi Yield Aggregator
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Compare yield farming opportunities across protocols. Find the best APY with risk-adjusted rankings.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Protocols Tracked</span>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{protocols.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Total Pools</span>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{pools.length}+</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Highest APY</span>
            <p className="text-2xl font-bold text-green-500">{formatApy(Math.max(...pools.map(p => p.apy_total), 0))}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Total TVL Tracked</span>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatTvl(protocols.reduce((sum, p) => sum + (p.tvl || 0), 0))}
            </p>
          </div>
        </div>

        {/* Top Opportunities */}
        {opportunities.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Top Opportunities</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {opportunities.slice(0, 6).map((opp) => (
                <div
                  key={opp.pool.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{opp.pool.pool_name}</p>
                      <p className="text-sm text-gray-500">{opp.protocol.name}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      opp.pool.risk_level === 'low' ? 'bg-green-100 text-green-700' :
                      opp.pool.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      opp.pool.risk_level === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {opp.pool.risk_level}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-bold text-green-500">{formatApy(opp.pool.apy_total)}</span>
                    <span className="text-gray-500 text-sm">APY</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <span className="capitalize">{opp.pool.chain}</span>
                    <span>•</span>
                    <span>{getPoolTypeLabel(opp.pool.pool_type)}</span>
                    <span>•</span>
                    <span>{formatTvl(opp.pool.tvl)}</span>
                  </div>

                  {opp.pros.length > 0 && (
                    <div className="space-y-1 mb-4">
                      {opp.pros.slice(0, 2).map((pro, j) => (
                        <p key={j} className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="h-3 w-3" /> {pro}
                        </p>
                      ))}
                    </div>
                  )}

                  <a
                    href={getAffiliateUrl(opp.protocol.id) || opp.protocol.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackAffiliateClick(user?.id || null, opp.protocol.id, opp.pool.id)}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    View on {opp.protocol.name}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search pools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Chain Filter */}
            <select
              value={selectedChain || ''}
              onChange={(e) => setSelectedChain(e.target.value || null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Chains</option>
              {SUPPORTED_DEFI_CHAINS.map(chain => (
                <option key={chain.id} value={chain.id}>{chain.name}</option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType || ''}
              onChange={(e) => setSelectedType(e.target.value as DeFiProtocolType || null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="lending">Lending</option>
              <option value="amm">Liquidity Pools</option>
              <option value="liquid_staking">Liquid Staking</option>
              <option value="vault">Vaults</option>
              <option value="yield_farm">Yield Farms</option>
            </select>

            {/* Risk Filter */}
            <select
              value={selectedRisk || ''}
              onChange={(e) => setSelectedRisk(e.target.value as DeFiRiskLevel || null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>

            {/* IL Calculator Button */}
            <button
              onClick={() => setShowILCalculator(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50"
            >
              <Calculator className="h-5 w-5" />
              IL Calculator
            </button>
          </div>
        </div>

        {/* Pools Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600 dark:text-gray-400">Pool</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600 dark:text-gray-400">Chain</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600 dark:text-gray-400">Type</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-gray-600 dark:text-gray-400">APY</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-gray-600 dark:text-gray-400">TVL</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-gray-600 dark:text-gray-400">Risk</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-gray-600 dark:text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredPools.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center text-gray-500">
                      No pools found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredPools.map(pool => (
                    <tr
                      key={pool.id}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{pool.pool_name}</p>
                          <p className="text-sm text-gray-500">{pool.protocol_name}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{pool.chain}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{getPoolTypeLabel(pool.pool_type)}</span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div>
                          <p className="font-bold text-green-500">{formatApy(pool.apy_total)}</p>
                          {pool.apy_reward > 0 && (
                            <p className="text-xs text-gray-500">
                              {formatApy(pool.apy_base)} base + {formatApy(pool.apy_reward)} rewards
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-gray-900 dark:text-white">{formatTvl(pool.tvl)}</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          pool.risk_level === 'low' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          pool.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          pool.risk_level === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {pool.risk_level}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedPool(pool)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Premium Upsell */}
        {!isPremium && (
          <div className="mt-8 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-8 text-white">
            <div className="flex items-start gap-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-3">Unlock Full DeFi Insights</h2>
                <p className="text-green-100 mb-4">
                  Get access to all pools, portfolio tracking, alerts, and advanced analytics.
                </p>
                <ul className="grid md:grid-cols-2 gap-2 mb-6">
                  {DEFI_YIELD_PRICING.premium.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-green-700 rounded-lg font-semibold hover:bg-green-50"
                >
                  Upgrade for ${DEFI_YIELD_PRICING.premium.price_monthly}/mo
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </div>
              <BarChart3 className="h-20 w-20 text-white/20 hidden md:block" />
            </div>
          </div>
        )}

        {/* IL Calculator Modal */}
        {showILCalculator && (
          <ImpermanentLossCalculator onClose={() => setShowILCalculator(false)} />
        )}

        {/* Pool Details Modal */}
        {selectedPool && (
          <PoolDetailsModal
            pool={selectedPool}
            protocol={protocols.find(p => p.id === selectedPool.protocol_id)!}
            onClose={() => setSelectedPool(null)}
            userId={user?.id}
          />
        )}
      </div>
    </div>
  );
}

// Impermanent Loss Calculator Modal
function ImpermanentLossCalculator({ onClose }: { onClose: () => void }) {
  const [priceChange, setPriceChange] = useState(50);
  const il = estimateImpermanentLoss(priceChange);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-6 w-6 text-purple-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Impermanent Loss Calculator</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Price Change: {priceChange > 0 ? '+' : ''}{priceChange}%
            </label>
            <input
              type="range"
              min="-90"
              max="500"
              value={priceChange}
              onChange={(e) => setPriceChange(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>-90%</span>
              <span>0%</span>
              <span>+500%</span>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 mb-6">
            <p className="text-center text-gray-600 dark:text-gray-400 mb-2">Impermanent Loss</p>
            <p className="text-center text-4xl font-bold text-purple-600 dark:text-purple-400">
              {il.toFixed(2)}%
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              Impermanent loss occurs when the price ratio of your pooled tokens changes. The greater the divergence, the greater the loss.
            </p>
          </div>

          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">IL Reference Table</h4>
          <div className="grid grid-cols-2 gap-2">
            {IL_REFERENCE_TABLE.map(({ priceChange: pc, il: ilVal }) => (
              <div
                key={pc}
                className="flex justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm"
              >
                <span className="text-gray-600 dark:text-gray-400">{pc}% change</span>
                <span className="font-medium text-gray-900 dark:text-white">{ilVal}% IL</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Pool Details Modal
function PoolDetailsModal({
  pool,
  protocol,
  onClose,
  userId,
}: {
  pool: DeFiPool;
  protocol: DeFiProtocol;
  onClose: () => void;
  userId?: string;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{pool.pool_name}</h2>
              <p className="text-gray-500">{protocol.name} on {pool.chain}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* APY Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total APY</p>
              <p className="text-2xl font-bold text-green-500">{formatApy(pool.apy_total)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Base APY</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatApy(pool.apy_base)}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Reward APY</p>
              <p className="text-2xl font-bold text-blue-500">{formatApy(pool.apy_reward)}</p>
            </div>
          </div>

          {/* Pool Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Pool Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">TVL</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatTvl(pool.tvl)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Type</span>
                  <span className="font-medium text-gray-900 dark:text-white">{getPoolTypeLabel(pool.pool_type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Risk Level</span>
                  <span className={`font-medium capitalize ${getRiskColor(pool.risk_level)}`}>{pool.risk_level}</span>
                </div>
                {pool.withdrawal_fee && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Withdrawal Fee</span>
                    <span className="font-medium text-gray-900 dark:text-white">{pool.withdrawal_fee}%</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Protocol Info</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Security Score</span>
                  <span className="font-medium text-gray-900 dark:text-white">{protocol.security_score}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Audited</span>
                  <span className={`font-medium ${protocol.is_audited ? 'text-green-500' : 'text-red-500'}`}>
                    {protocol.is_audited ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Protocol TVL</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatTvl(protocol.tvl || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reward Tokens */}
          {pool.reward_tokens.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Reward Tokens</h4>
              <div className="flex flex-wrap gap-2">
                {pool.reward_tokens.map(token => (
                  <span key={token} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                    {token}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* IL Risk */}
          {pool.impermanent_loss_risk !== null && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Impermanent Loss Risk</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  This pool has a {pool.impermanent_loss_risk.toFixed(0)}% IL risk score. Consider the potential for impermanent loss before providing liquidity.
                </p>
              </div>
            </div>
          )}

          {/* CTA */}
          <a
            href={getAffiliateUrl(protocol.id) || protocol.website_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackAffiliateClick(userId || null, protocol.id, pool.id)}
            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Open on {protocol.name}
            <ExternalLink className="h-5 w-5" />
          </a>
        </div>
      </div>
    </div>
  );
}
