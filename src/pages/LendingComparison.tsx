import React, { useState } from 'react';
import {
  DEMO_LENDING_PLATFORMS,
  DEMO_LENDING_RATES,
  trackAffiliateClick,
} from '../services/lendingComparison';
import type { LendingPlatform } from '../types/monetization';

const LendingComparison: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState('USDC');
  const [selectedType, setSelectedType] = useState<'all' | 'cefi' | 'defi'>('all');
  const [platforms] = useState<LendingPlatform[]>(DEMO_LENDING_PLATFORMS);

  const popularAssets = ['USDC', 'ETH', 'BTC', 'DAI', 'USDT'];

  const handleAffiliateClick = async (platform: LendingPlatform) => {
    // Track click
    try {
      await trackAffiliateClick(
        platform.id,
        platform.website_url,
        `session-${Date.now()}`,
        undefined,
        { source: 'lending_comparison', medium: 'web' }
      );
    } catch (e) {
      console.error('Failed to track click:', e);
    }

    // Open platform
    window.open(platform.website_url, '_blank');
  };

  const getPlatformTypeColor = (type: string) => {
    switch (type) {
      case 'defi': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'cefi': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getTrustScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-400';
    if (score >= 9) return 'text-green-400';
    if (score >= 7) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Crypto Lending Rate Comparison</h1>
          <p className="text-gray-400">
            Compare lending and borrowing rates across DeFi and CeFi platforms
          </p>
        </div>

        {/* Affiliate Banner */}
        <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/50 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2 text-green-400">Earn While You Learn</h2>
              <p className="text-gray-300">
                Sign up through our links and get exclusive bonuses. We earn a commission at no extra cost to you.
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Potential bonuses up to</div>
              <div className="text-2xl font-bold text-green-400">$5,000</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          {/* Asset Filter */}
          <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-1">
            {popularAssets.map((asset) => (
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

          {/* Platform Type Filter */}
          <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-4 py-2 rounded-md transition ${
                selectedType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedType('defi')}
              className={`px-4 py-2 rounded-md transition ${
                selectedType === 'defi'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              DeFi
            </button>
            <button
              onClick={() => setSelectedType('cefi')}
              className={`px-4 py-2 rounded-md transition ${
                selectedType === 'cefi'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              CeFi
            </button>
          </div>
        </div>

        {/* Best Rates Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-green-500/30">
            <h3 className="text-lg font-semibold mb-4 text-green-400">Best Lending Rate ({selectedAsset})</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-green-400">8.00% APY</div>
                <div className="text-gray-400 mt-1">Nexo</div>
              </div>
              <button
                onClick={() => handleAffiliateClick(platforms[2])}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Start Earning
              </button>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-blue-500/30">
            <h3 className="text-lg font-semibold mb-4 text-blue-400">Cheapest Borrowing Rate ({selectedAsset})</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-400">5.50% APY</div>
                <div className="text-gray-400 mt-1">Compound V3</div>
              </div>
              <button
                onClick={() => handleAffiliateClick(platforms[1])}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Borrow Now
              </button>
            </div>
          </div>
        </div>

        {/* Rates Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-xl font-semibold">All Rates for {selectedAsset}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-4 text-gray-400 font-medium">Platform</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Type</th>
                  <th className="text-right p-4 text-gray-400 font-medium">Lending APY</th>
                  <th className="text-right p-4 text-gray-400 font-medium">Borrowing APY</th>
                  <th className="text-right p-4 text-gray-400 font-medium">Utilization</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Trust Score</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {platforms
                  .filter((p) => selectedType === 'all' || p.platform_type === selectedType)
                  .map((platform) => {
                    const rate = DEMO_LENDING_RATES.find(
                      (r) => r.platform_id === platform.id && r.asset_symbol === selectedAsset
                    );
                    if (!rate) return null;

                    return (
                      <tr key={platform.id} className="border-t border-gray-700 hover:bg-gray-750">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold">
                              {platform.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium">{platform.name}</div>
                              {platform.is_insured && (
                                <span className="text-xs text-green-400">Insured</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded border ${getPlatformTypeColor(platform.platform_type)}`}>
                            {platform.platform_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-green-400 font-semibold">{rate.lending_apy}%</span>
                          {rate.lending_apy_rewards && rate.lending_apy_rewards > 0 && (
                            <div className="text-xs text-gray-500">
                              +{rate.lending_apy_rewards}% rewards
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-red-400 font-semibold">{rate.borrowing_apy}%</span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500"
                                style={{ width: `${rate.utilization_rate}%` }}
                              />
                            </div>
                            <span className="text-gray-400">{rate.utilization_rate}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`font-semibold ${getTrustScoreColor(platform.trust_score)}`}>
                            {platform.trust_score}/10
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleAffiliateClick(platform)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition"
                          >
                            Go to {platform.name}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Platform Cards */}
        <h3 className="text-xl font-semibold mb-4">Featured Platforms</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {platforms.map((platform) => (
            <div key={platform.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold">
                    {platform.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold">{platform.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded border ${getPlatformTypeColor(platform.platform_type)}`}>
                      {platform.platform_type.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className={`text-xl font-bold ${getTrustScoreColor(platform.trust_score)}`}>
                  {platform.trust_score}
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-4">{platform.description}</p>

              <div className="space-y-2 mb-4">
                {platform.is_insured && (
                  <div className="flex items-center text-sm text-green-400">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Insurance Coverage
                  </div>
                )}
                {platform.security_audit_url && (
                  <div className="flex items-center text-sm text-blue-400">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Security Audited
                  </div>
                )}
                <div className="text-sm text-gray-400">
                  Supported: {platform.supported_chains.join(', ')}
                </div>
              </div>

              <button
                onClick={() => handleAffiliateClick(platform)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
              >
                Visit {platform.name}
              </button>

              {platform.affiliate_cpa_amount && (
                <div className="mt-3 text-center text-sm text-green-400">
                  Earn up to ${platform.affiliate_cpa_amount} bonus
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="bg-gray-800 rounded-lg p-6 text-sm text-gray-400">
          <h4 className="font-semibold text-white mb-2">Disclaimer</h4>
          <p>
            The information provided is for educational purposes only and should not be considered financial advice.
            Cryptocurrency lending involves significant risks, including the potential loss of principal.
            Always do your own research and consider your risk tolerance before using any lending platform.
            We may earn affiliate commissions when you sign up through our links at no additional cost to you.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LendingComparison;
