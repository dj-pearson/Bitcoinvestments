import { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Gift,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Filter,
  DollarSign,
  Percent,
  Shield,
  Coins,
} from 'lucide-react';
import {
  fetchDeFiPositions,
  calculateDeFiSummary,
  getClaimableRewards,
  formatPositionType,
  getRiskColor,
  getHealthColor,
  PROTOCOLS,
  POSITION_TYPE_LABELS,
  type DeFiPosition,
  type DeFiPortfolioSummary,
  type PositionType,
} from '../services/defiProtocols';

interface DeFiPortfolioProps {
  walletAddress: string;
  defaultChain?: string;
}

export function DeFiPortfolio({ walletAddress, defaultChain = 'ethereum' }: DeFiPortfolioProps) {
  const [positions, setPositions] = useState<DeFiPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState(defaultChain);
  const [filterType, setFilterType] = useState<PositionType | 'all'>('all');
  const [expandedPositions, setExpandedPositions] = useState<Set<string>>(new Set());

  // Calculate summary
  const summary = useMemo(() => calculateDeFiSummary(positions), [positions]);
  const claimableRewards = useMemo(() => getClaimableRewards(positions), [positions]);

  // Filter positions
  const filteredPositions = useMemo(() => {
    if (filterType === 'all') return positions;
    return positions.filter((p) => p.type === filterType);
  }, [positions, filterType]);

  useEffect(() => {
    loadPositions();
  }, [walletAddress, selectedChain]);

  const loadPositions = async () => {
    setIsLoading(true);
    setError(null);

    const result = await fetchDeFiPositions(walletAddress, [selectedChain]);

    if (result.error) {
      setError(result.error);
    } else {
      setPositions(result.positions);
    }

    setIsLoading(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPositions();
    setIsRefreshing(false);
  };

  const toggleExpanded = (id: string) => {
    setExpandedPositions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 text-orange-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Failed to Load DeFi Positions</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={loadPositions}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Total Value"
          value={`$${summary.totalValue.toLocaleString()}`}
          highlight
        />
        <SummaryCard
          icon={<Percent className="h-5 w-5" />}
          label="Avg. APY"
          value={`${summary.averageApy.toFixed(2)}%`}
          color={summary.averageApy > 0 ? 'text-green-400' : undefined}
        />
        <SummaryCard
          icon={<Gift className="h-5 w-5" />}
          label="Claimable Rewards"
          value={`$${summary.totalRewards.toFixed(2)}`}
          color="text-purple-400"
        />
        <SummaryCard
          icon={<Shield className="h-5 w-5" />}
          label="Risk Score"
          value={`${summary.riskScore}/100`}
          customColor={getRiskColor(summary.riskScore)}
        />
      </div>

      {/* Claimable Rewards Banner */}
      {claimableRewards.length > 0 && (
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="h-5 w-5 text-purple-400" />
              <div>
                <div className="font-medium text-white">
                  {claimableRewards.length} Rewards Available
                </div>
                <div className="text-sm text-slate-400">
                  ${summary.totalRewards.toFixed(2)} in claimable rewards
                </div>
              </div>
            </div>
            <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
              Claim All
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Chain Selector */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="ethereum">Ethereum</option>
              <option value="polygon">Polygon</option>
              <option value="arbitrum">Arbitrum</option>
              <option value="optimism">Optimism</option>
              <option value="base">Base</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filterType === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            {Object.entries(POSITION_TYPE_LABELS).map(([type, label]) => (
              <button
                key={type}
                onClick={() => setFilterType(type as PositionType)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filterType === type
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Positions List */}
      {filteredPositions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center">
          <Layers className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No DeFi Positions</h3>
          <p className="text-slate-400">
            No positions found on {selectedChain}
            {filterType !== 'all' && ` for ${formatPositionType(filterType)}`}.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPositions.map((position) => (
            <PositionCard
              key={position.id}
              position={position}
              isExpanded={expandedPositions.has(position.id)}
              onToggle={() => toggleExpanded(position.id)}
            />
          ))}
        </div>
      )}

      {/* Protocol Distribution */}
      {summary.byProtocol.length > 0 && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Protocol Distribution</h3>
          <div className="space-y-3">
            {summary.byProtocol.map(({ protocol, value, positions: count }) => (
              <div key={protocol.id} className="flex items-center gap-4">
                <img
                  src={protocol.logo}
                  alt={protocol.name}
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://via.placeholder.com/32?text=' + protocol.name[0];
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">{protocol.name}</span>
                    <span className="text-white">${value.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${(value / summary.totalValue) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-slate-500 w-20 text-right">
                  {count} position{count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Summary Card Component
function SummaryCard({
  icon,
  label,
  value,
  highlight,
  color,
  customColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
  color?: string;
  customColor?: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div
        className={`text-2xl font-bold ${highlight ? 'text-orange-400' : color || 'text-white'}`}
        style={customColor ? { color: customColor } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

// Position Card Component
function PositionCard({
  position,
  isExpanded,
  onToggle,
}: {
  position: DeFiPosition;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasRewards = position.rewards && position.rewards.length > 0;
  const totalRewardsValue = position.rewards?.reduce((sum, r) => sum + r.token.value, 0) || 0;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div
        onClick={onToggle}
        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
      >
        {/* Protocol Logo */}
        <img
          src={position.protocol.logo}
          alt={position.protocol.name}
          className="w-10 h-10 rounded-full"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://via.placeholder.com/40?text=' + position.protocol.name[0];
          }}
        />

        {/* Position Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{position.protocol.name}</span>
            <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded">
              {formatPositionType(position.type)}
            </span>
          </div>
          <div className="text-sm text-slate-400">
            {position.tokens.map((t) => t.symbol).join(' / ')}
          </div>
        </div>

        {/* APY */}
        {position.apy !== undefined && (
          <div className="text-right">
            <div className="text-sm text-slate-400">APY</div>
            <div
              className={`font-medium ${position.apy >= 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {position.apy >= 0 ? '+' : ''}{position.apy.toFixed(2)}%
            </div>
          </div>
        )}

        {/* Health Factor (for lending) */}
        {position.health !== undefined && (
          <div className="text-right">
            <div className="text-sm text-slate-400">Health</div>
            <div className="font-medium" style={{ color: getHealthColor(position.health) }}>
              {position.health.toFixed(2)}
            </div>
          </div>
        )}

        {/* Value */}
        <div className="text-right min-w-[100px]">
          <div className="font-bold text-white">${position.value.usd.toLocaleString()}</div>
          {hasRewards && (
            <div className="text-sm text-purple-400">
              +${totalRewardsValue.toFixed(2)} rewards
            </div>
          )}
        </div>

        {/* Expand Icon */}
        <div className="text-slate-400">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-700 p-4 space-y-4">
          {/* Token Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-2">Assets</h4>
            <div className="space-y-2">
              {position.tokens.map((token, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {token.logo ? (
                      <img
                        src={token.logo}
                        alt={token.symbol}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400">
                        {token.symbol[0]}
                      </div>
                    )}
                    <span className="text-white">{token.symbol}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white">{token.amount.toLocaleString()}</div>
                    <div className="text-sm text-slate-400">${token.value.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rewards */}
          {hasRewards && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Pending Rewards</h4>
              <div className="space-y-2">
                {position.rewards!.map((reward, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-purple-400" />
                      <span className="text-white">{reward.token.symbol}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white">{reward.pending.toLocaleString()}</div>
                      <div className="text-sm text-slate-400">
                        ${reward.token.value.toFixed(2)}
                      </div>
                    </div>
                    {reward.claimable && (
                      <button className="px-3 py-1 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                        Claim
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <a
              href={position.protocol.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:text-white transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Open in {position.protocol.name}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
