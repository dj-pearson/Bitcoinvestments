import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  DEMO_PUBLISHED_PORTFOLIOS,
  SOCIAL_TRADING_CONFIG,
} from '../services/socialTrading';
import type { PublishedPortfolio } from '../types/monetization';

import { PageSEO } from '../components/PageSEO';
const SocialTrading: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'discover' | 'following' | 'my-portfolios'>('discover');
  const [sortBy, setSortBy] = useState<'copiers' | 'returns' | 'followers'>('copiers');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [portfolios] = useState<Partial<PublishedPortfolio>[]>(DEMO_PUBLISHED_PORTFOLIOS);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Partial<PublishedPortfolio> | null>(null);

  const getRiskLevelColor = (risk: string | null) => {
    switch (risk) {
      case 'conservative': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'moderate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'aggressive': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'degen': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getTradingStyleIcon = (style: string | null) => {
    switch (style) {
      case 'hodl': return '💎';
      case 'day_trading': return '⚡';
      case 'swing_trading': return '📈';
      case 'dca': return '🔄';
      case 'yield_farming': return '🌾';
      default: return '📊';
    }
  };

  const getReturnColor = (returnPercent: number | null) => {
    if (!returnPercent) return 'text-gray-400';
    if (returnPercent >= 100) return 'text-green-400';
    if (returnPercent >= 50) return 'text-emerald-400';
    if (returnPercent >= 0) return 'text-yellow-400';
    return 'text-red-400';
  };

  const filteredPortfolios = portfolios.filter((p) => {
    if (riskFilter !== 'all' && p.risk_level !== riskFilter) return false;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'copiers': return (b.copiers_count || 0) - (a.copiers_count || 0);
      case 'returns': return (b.total_return_percent || 0) - (a.total_return_percent || 0);
      case 'followers': return (b.followers_count || 0) - (a.followers_count || 0);
      default: return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <PageSEO pageKey="socialTrading" urlPath="/social-trading" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Social Trading</h1>
          <p className="text-gray-400">
            Follow top traders and copy their portfolio allocations
          </p>
        </div>

        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-400">1,250+</div>
            <div className="text-gray-400 text-sm mt-1">Published Portfolios</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-400">$2.5M+</div>
            <div className="text-gray-400 text-sm mt-1">Assets Under Copy</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-400">8,500+</div>
            <div className="text-gray-400 text-sm mt-1">Active Copiers</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400">145%</div>
            <div className="text-gray-400 text-sm mt-1">Avg Top 10 Return</div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">How Copy Trading Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold flex-shrink-0">1</div>
              <div>
                <h3 className="font-semibold mb-1">Find a Trader</h3>
                <p className="text-gray-400 text-sm">Browse portfolios by performance, risk level, and trading style</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold flex-shrink-0">2</div>
              <div>
                <h3 className="font-semibold mb-1">Subscribe to Copy</h3>
                <p className="text-gray-400 text-sm">Pay ${SOCIAL_TRADING_CONFIG.default_subscription_price}/month to mirror their allocations</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center font-bold flex-shrink-0">3</div>
              <div>
                <h3 className="font-semibold mb-1">Auto-Copy Trades</h3>
                <p className="text-gray-400 text-sm">When they trade, you trade. Same allocations, same strategy.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('discover')}
            className={`pb-4 px-4 font-medium transition ${
              activeTab === 'discover'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`pb-4 px-4 font-medium transition ${
              activeTab === 'following'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Following
          </button>
          {user && (
            <button
              onClick={() => setActiveTab('my-portfolios')}
              className={`pb-4 px-4 font-medium transition ${
                activeTab === 'my-portfolios'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              My Portfolios
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setSortBy('copiers')}
              className={`px-4 py-2 rounded-md transition text-sm ${
                sortBy === 'copiers'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Most Copied
            </button>
            <button
              onClick={() => setSortBy('returns')}
              className={`px-4 py-2 rounded-md transition text-sm ${
                sortBy === 'returns'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Best Returns
            </button>
            <button
              onClick={() => setSortBy('followers')}
              className={`px-4 py-2 rounded-md transition text-sm ${
                sortBy === 'followers'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Most Popular
            </button>
          </div>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700"
          >
            <option value="all">All Risk Levels</option>
            <option value="conservative">Conservative</option>
            <option value="moderate">Moderate</option>
            <option value="aggressive">Aggressive</option>
            <option value="degen">Degen</option>
          </select>
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {filteredPortfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              onClick={() => setSelectedPortfolio(portfolio)}
              className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-750 transition border border-gray-700 hover:border-blue-500"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl">
                    {getTradingStyleIcon(portfolio.trading_style || null)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{portfolio.name}</h3>
                      {portfolio.is_verified && (
                        <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded border ${getRiskLevelColor(portfolio.risk_level || null)}`}>
                        {portfolio.risk_level?.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">{portfolio.specialization}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getReturnColor(portfolio.total_return_percent || null)}`}>
                    +{portfolio.total_return_percent}%
                  </div>
                  <div className="text-xs text-gray-500">All-time return</div>
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{portfolio.description}</p>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-900 rounded p-3 text-center">
                  <div className="text-lg font-semibold">{portfolio.copiers_count}</div>
                  <div className="text-xs text-gray-500">Copiers</div>
                </div>
                <div className="bg-gray-900 rounded p-3 text-center">
                  <div className="text-lg font-semibold">{portfolio.win_rate}%</div>
                  <div className="text-xs text-gray-500">Win Rate</div>
                </div>
                <div className="bg-gray-900 rounded p-3 text-center">
                  <div className="text-lg font-semibold text-red-400">-{portfolio.max_drawdown_percent}%</div>
                  <div className="text-xs text-gray-500">Max DD</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>{portfolio.followers_count?.toLocaleString()} followers</span>
                  <span>{portfolio.views_count?.toLocaleString()} views</span>
                </div>
                <div className="text-right">
                  {portfolio.is_free ? (
                    <span className="text-green-400 font-medium">Free</span>
                  ) : (
                    <span className="text-white font-medium">${portfolio.subscription_price}/mo</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Become a Creator */}
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Share Your Portfolio & Earn</h2>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Publish your portfolio and earn {SOCIAL_TRADING_CONFIG.creator_share_percent}% of every subscription.
            Build your following and turn your trading skills into passive income.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition">
              Publish My Portfolio
            </button>
            <button className="border border-gray-600 hover:border-gray-500 text-white px-8 py-3 rounded-lg font-semibold transition">
              Learn More
            </button>
          </div>
          <div className="mt-6 text-sm text-gray-500">
            You earn ${(SOCIAL_TRADING_CONFIG.default_subscription_price * SOCIAL_TRADING_CONFIG.creator_share_percent / 100).toFixed(2)} per subscriber per month
          </div>
        </div>

        {/* Selected Portfolio Modal */}
        {selectedPortfolio && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-gray-800 rounded-lg w-full max-w-[calc(100vw-1rem)] sm:max-w-xl md:max-w-3xl max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl sm:text-3xl">
                    {getTradingStyleIcon(selectedPortfolio.trading_style || null)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg sm:text-xl font-bold">{selectedPortfolio.name}</h2>
                      {selectedPortfolio.is_verified && (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center flex-wrap gap-1 sm:space-x-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded border ${getRiskLevelColor(selectedPortfolio.risk_level || null)}`}>
                        {selectedPortfolio.risk_level?.toUpperCase()}
                      </span>
                      <span className="text-gray-400 text-sm">{selectedPortfolio.trading_style}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPortfolio(null)}
                  className="text-gray-400 hover:text-white text-2xl p-2 touch-target-sm"
                >
                  &times;
                </button>
              </div>

              <div className="p-4 sm:p-6">
                <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">{selectedPortfolio.description}</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-gray-900 rounded-lg p-3 sm:p-4 text-center">
                    <div className={`text-lg sm:text-2xl font-bold ${getReturnColor(selectedPortfolio.total_return_percent || null)}`}>
                      +{selectedPortfolio.total_return_percent}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Total Return</div>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-3 sm:p-4 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-blue-400">{selectedPortfolio.win_rate}%</div>
                    <div className="text-xs text-gray-500 mt-1">Win Rate</div>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-3 sm:p-4 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-yellow-400">{selectedPortfolio.sharpe_ratio}</div>
                    <div className="text-xs text-gray-500 mt-1">Sharpe Ratio</div>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-3 sm:p-4 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-red-400">-{selectedPortfolio.max_drawdown_percent}%</div>
                    <div className="text-xs text-gray-500 mt-1">Max Drawdown</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-semibold mb-3">Performance Chart</h3>
                    <div className="bg-gray-900 rounded-lg h-48 flex items-center justify-center text-gray-500">
                      [Performance Chart Placeholder]
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Current Allocation</h3>
                    <div className="bg-gray-900 rounded-lg h-48 flex items-center justify-center text-gray-500">
                      [Pie Chart Placeholder]
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-400">Subscription Price</div>
                    <div className="text-2xl font-bold">
                      {selectedPortfolio.is_free ? 'Free' : `$${selectedPortfolio.subscription_price}/month`}
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button className="border border-gray-600 hover:border-gray-500 text-white px-6 py-3 rounded-lg font-medium transition">
                      Follow
                    </button>
                    {!selectedPortfolio.is_free && (
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition">
                        Subscribe & Copy
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialTrading;
