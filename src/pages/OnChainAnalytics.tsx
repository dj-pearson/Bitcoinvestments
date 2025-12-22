import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  generateDemoMetrics,
  ONCHAIN_ANALYTICS_CONFIG,
  FREE_METRICS,
  DEMO_DASHBOARD_WIDGETS,
} from '../services/onchainAnalytics';
import { ON_CHAIN_METRIC_CATEGORIES } from '../types/monetization';
import type { OnChainMetric, OnChainMetricType, OnChainTier } from '../types/monetization';

const OnChainAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [selectedMetric, setSelectedMetric] = useState<OnChainMetricType>('active_addresses');
  const [timeframe, setTimeframe] = useState('30d');
  const [userTier, setUserTier] = useState<OnChainTier>('basic');
  const [metrics, setMetrics] = useState<OnChainMetric[]>([]);

  useEffect(() => {
    // Load demo metrics
    const demoData = generateDemoMetrics(selectedAsset, selectedMetric, 30);
    setMetrics(demoData);
  }, [selectedAsset, selectedMetric]);

  const isMetricLocked = (metricType: OnChainMetricType) => {
    return userTier === 'basic' && !FREE_METRICS.includes(metricType);
  };

  const getMetricDisplayName = (metricType: OnChainMetricType): string => {
    const names: Record<OnChainMetricType, string> = {
      active_addresses: 'Active Addresses',
      transaction_count: 'Transaction Count',
      transaction_volume: 'Transaction Volume',
      exchange_inflow: 'Exchange Inflow',
      exchange_outflow: 'Exchange Outflow',
      exchange_netflow: 'Exchange Net Flow',
      miner_revenue: 'Miner Revenue',
      miner_outflow: 'Miner Outflow',
      hash_rate: 'Hash Rate',
      difficulty: 'Mining Difficulty',
      block_size: 'Block Size',
      fees: 'Transaction Fees',
      nvt_ratio: 'NVT Ratio',
      mvrv_ratio: 'MVRV Ratio',
      sopr: 'SOPR',
      realized_cap: 'Realized Cap',
      thermocap: 'Thermocap',
      supply_held_1y_plus: 'Supply Held 1Y+',
      whale_transactions: 'Whale Transactions',
      large_transactions: 'Large Transactions',
      stablecoin_supply: 'Stablecoin Supply',
      defi_tvl: 'DeFi TVL',
    };
    return names[metricType] || metricType;
  };

  const formatMetricValue = (value: number, metricType: OnChainMetricType): string => {
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    if (value < 10) return value.toFixed(2);
    return value.toLocaleString();
  };

  const getChangeColor = (change: number | null) => {
    if (!change) return 'text-gray-400';
    return change >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const latestMetric = metrics[0];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">On-Chain Analytics</h1>
          <p className="text-gray-400">
            Advanced blockchain metrics: network activity, exchange flows, and valuation indicators
          </p>
        </div>

        {/* Upgrade Banner */}
        {userTier === 'basic' && (
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">Upgrade to Pro Analytics</h2>
                <p className="text-gray-300">
                  Get access to all {Object.keys(FREE_METRICS).length + 15}+ metrics, hourly data, custom dashboards, and alerts
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-400">$29.99/mo</div>
                <button className="mt-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition">
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Asset Selection */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-1">
            {['BTC', 'ETH', 'SOL', 'DOGE'].map((asset) => (
              <button
                key={asset}
                onClick={() => setSelectedAsset(asset)}
                className={`px-4 py-2 rounded-md transition ${
                  selectedAsset === asset
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {asset}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-1">
            {['24h', '7d', '30d', '90d', '1y'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-2 rounded-md transition text-sm ${
                  timeframe === tf
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {['active_addresses', 'transaction_volume', 'exchange_netflow', 'nvt_ratio'].map((metric) => {
            const metricType = metric as OnChainMetricType;
            const locked = isMetricLocked(metricType);
            const demoMetric = generateDemoMetrics(selectedAsset, metricType, 1)[0];

            return (
              <div key={metric} className={`bg-gray-800 rounded-lg p-4 ${locked ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">{getMetricDisplayName(metricType)}</span>
                  {locked && (
                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">PRO</span>
                  )}
                </div>
                {locked ? (
                  <div className="text-2xl font-bold text-gray-500">***</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {formatMetricValue(demoMetric?.value || 0, metricType)}
                    </div>
                    <div className={`text-sm ${getChangeColor(demoMetric?.change_24h || null)}`}>
                      {(demoMetric?.change_24h || 0) >= 0 ? '+' : ''}
                      {(demoMetric?.change_24h || 0).toFixed(2)}% (24h)
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Metric Categories Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-4">Metrics</h3>
              <div className="space-y-4">
                {ON_CHAIN_METRIC_CATEGORIES.map((category) => (
                  <div key={category.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">{category.name}</span>
                      {category.tier_required !== 'basic' && (
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                          {category.tier_required.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {category.metrics.map((metric) => {
                        const locked = isMetricLocked(metric);
                        return (
                          <button
                            key={metric}
                            onClick={() => !locked && setSelectedMetric(metric)}
                            disabled={locked}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                              selectedMetric === metric
                                ? 'bg-blue-600 text-white'
                                : locked
                                ? 'text-gray-500 cursor-not-allowed'
                                : 'text-gray-300 hover:bg-gray-700'
                            }`}
                          >
                            {getMetricDisplayName(metric)}
                            {locked && ' 🔒'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Chart Area */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold">{getMetricDisplayName(selectedMetric)}</h3>
                  <p className="text-gray-400 text-sm">
                    {selectedAsset} - Last {timeframe}
                  </p>
                </div>
                {latestMetric && (
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {formatMetricValue(latestMetric.value, selectedMetric)}
                    </div>
                    <div className={`text-sm ${getChangeColor(latestMetric.change_24h)}`}>
                      {(latestMetric.change_24h || 0) >= 0 ? '+' : ''}
                      {(latestMetric.change_24h || 0).toFixed(2)}%
                    </div>
                  </div>
                )}
              </div>

              {/* Chart Placeholder */}
              <div className="h-80 bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  <p>Chart visualization would appear here</p>
                  <p className="text-sm mt-2">Showing {metrics.length} data points</p>
                </div>
              </div>
            </div>

            {/* Historical Data Table */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h3 className="font-semibold">Historical Data</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="text-left p-4 text-gray-400 font-medium">Date</th>
                      <th className="text-right p-4 text-gray-400 font-medium">Value</th>
                      <th className="text-right p-4 text-gray-400 font-medium">24h Change</th>
                      <th className="text-right p-4 text-gray-400 font-medium">7d Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.slice(0, 10).map((metric, index) => (
                      <tr key={metric.id} className="border-t border-gray-700">
                        <td className="p-4 text-gray-300">
                          {new Date(metric.timestamp).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right font-medium">
                          {formatMetricValue(metric.value, selectedMetric)}
                        </td>
                        <td className={`p-4 text-right ${getChangeColor(metric.change_24h)}`}>
                          {(metric.change_24h || 0) >= 0 ? '+' : ''}
                          {(metric.change_24h || 0).toFixed(2)}%
                        </td>
                        <td className={`p-4 text-right ${getChangeColor(metric.change_7d)}`}>
                          {(metric.change_7d || 0) >= 0 ? '+' : ''}
                          {(metric.change_7d || 0).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Pro Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-4">🔔</div>
            <h3 className="text-lg font-semibold mb-2">Custom Alerts</h3>
            <p className="text-gray-400 text-sm mb-4">
              Get notified when metrics cross your thresholds. Up to 20 alerts with Pro.
            </p>
            {userTier === 'basic' && (
              <span className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full">PRO FEATURE</span>
            )}
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">Custom Dashboards</h3>
            <p className="text-gray-400 text-sm mb-4">
              Build personalized dashboards with the metrics that matter to you.
            </p>
            {userTier === 'basic' && (
              <span className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full">PRO FEATURE</span>
            )}
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-4">📥</div>
            <h3 className="text-lg font-semibold mb-2">Data Export</h3>
            <p className="text-gray-400 text-sm mb-4">
              Export historical data in CSV or JSON format for your own analysis.
            </p>
            {userTier === 'basic' && (
              <span className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full">PRO FEATURE</span>
            )}
          </div>
        </div>

        {/* Data Sources */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Data Sources</h3>
          <p className="text-gray-400 text-sm mb-4">
            Our on-chain data is aggregated from industry-leading providers to ensure accuracy and reliability.
          </p>
          <div className="flex flex-wrap gap-4">
            <span className="px-4 py-2 bg-gray-700 rounded-lg text-sm">Glassnode</span>
            <span className="px-4 py-2 bg-gray-700 rounded-lg text-sm">Santiment</span>
            <span className="px-4 py-2 bg-gray-700 rounded-lg text-sm">IntoTheBlock</span>
            <span className="px-4 py-2 bg-gray-700 rounded-lg text-sm">CryptoQuant</span>
            <span className="px-4 py-2 bg-gray-700 rounded-lg text-sm">Blockchain.com</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnChainAnalytics;
