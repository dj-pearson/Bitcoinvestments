import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getVerifiedInfluencers,
  getTopInfluencersByAccuracy,
  getTrendingInfluencers,
  hasTransparencyAccess,
  DEMO_INFLUENCERS,
  DEMO_TRADE_CLAIMS,
} from '../services/influencerVerification';
import type { VerifiedInfluencer, InfluencerTradeClaim } from '../types/monetization';

const InfluencerVerification: React.FC = () => {
  const { user } = useAuth();
  const [influencers, setInfluencers] = useState<Partial<VerifiedInfluencer>[]>(DEMO_INFLUENCERS);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Partial<VerifiedInfluencer> | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'accuracy' | 'trending'>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      hasTransparencyAccess(user.id).then(setHasAccess).catch(console.error);
    }
  }, [user]);

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'elite': return 'bg-yellow-500 text-black';
      case 'professional': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getAccuracyColor = (accuracy: number | null) => {
    if (!accuracy) return 'text-gray-400';
    if (accuracy >= 85) return 'text-green-400';
    if (accuracy >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Influencer Verification Program</h1>
          <p className="text-gray-400">
            Verify crypto influencers' actual portfolio performance vs their claims
          </p>
        </div>

        {/* Subscription Banner */}
        {!hasAccess && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">Unlock Full Transparency</h2>
                <p className="text-blue-100">
                  See verified trade performance, accuracy scores, and real returns for just $2.99/month
                </p>
              </div>
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                Subscribe Now
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-4 px-4 font-medium transition ${
              activeTab === 'all'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Verified
          </button>
          <button
            onClick={() => setActiveTab('accuracy')}
            className={`pb-4 px-4 font-medium transition ${
              activeTab === 'accuracy'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Most Accurate
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`pb-4 px-4 font-medium transition ${
              activeTab === 'trending'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Trending
          </button>
        </div>

        {/* Influencer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {influencers.map((influencer) => (
            <div
              key={influencer.id}
              onClick={() => setSelectedInfluencer(influencer)}
              className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-750 transition border border-gray-700 hover:border-blue-500"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-lg font-bold">
                    {influencer.display_name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{influencer.display_name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getTierBadgeColor(influencer.verification_tier || 'standard')}`}>
                      {influencer.verification_tier?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Trust Score</div>
                  <div className="text-xl font-bold text-green-400">{influencer.trust_score}</div>
                </div>
              </div>

              <p className="text-gray-400 text-sm mb-4">{influencer.bio}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-900 rounded p-3">
                  <div className="text-xs text-gray-500 mb-1">Claimed Win Rate</div>
                  <div className="font-semibold">{influencer.claimed_win_rate}%</div>
                </div>
                <div className="bg-gray-900 rounded p-3">
                  <div className="text-xs text-gray-500 mb-1">Verified Win Rate</div>
                  <div className={`font-semibold ${hasAccess ? getAccuracyColor(influencer.verified_win_rate || null) : ''}`}>
                    {hasAccess ? `${influencer.verified_win_rate}%` : '***'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 rounded p-3">
                  <div className="text-xs text-gray-500 mb-1">Claimed Return</div>
                  <div className="font-semibold text-green-400">+{influencer.claimed_total_return}%</div>
                </div>
                <div className="bg-gray-900 rounded p-3">
                  <div className="text-xs text-gray-500 mb-1">Verified Return</div>
                  <div className={`font-semibold ${hasAccess ? 'text-yellow-400' : ''}`}>
                    {hasAccess ? `+${influencer.verified_total_return}%` : '***'}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-400">
                    <span className="text-white font-medium">{influencer.followers_count?.toLocaleString()}</span> followers
                  </span>
                  {influencer.twitter_handle && (
                    <span className="text-blue-400">@{influencer.twitter_handle}</span>
                  )}
                </div>
                <div className={`font-medium ${getAccuracyColor(influencer.accuracy_score || null)}`}>
                  {hasAccess ? `${influencer.accuracy_score}% accurate` : 'Unlock to see'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Become an Influencer */}
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Are You a Crypto Influencer?</h2>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Get verified and prove your track record. Verified influencers get a badge, increased visibility,
            and build trust with their audience. Only $49/month.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition">
            Apply for Verification
          </button>
        </div>

        {/* Selected Influencer Modal */}
        {selectedInfluencer && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl font-bold">
                    {selectedInfluencer.display_name?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedInfluencer.display_name}</h2>
                    <span className={`text-xs px-2 py-1 rounded-full ${getTierBadgeColor(selectedInfluencer.verification_tier || 'standard')}`}>
                      {selectedInfluencer.verification_tier?.toUpperCase()} VERIFIED
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInfluencer(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="p-6">
                <p className="text-gray-400 mb-6">{selectedInfluencer.bio}</p>

                <h3 className="font-semibold mb-4">Performance Comparison</h3>
                <div className="space-y-4 mb-6">
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Win Rate</span>
                      <div className="flex space-x-4">
                        <span>Claimed: {selectedInfluencer.claimed_win_rate}%</span>
                        <span className={hasAccess ? 'text-yellow-400' : ''}>
                          Verified: {hasAccess ? `${selectedInfluencer.verified_win_rate}%` : '***'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Return</span>
                      <div className="flex space-x-4">
                        <span className="text-green-400">Claimed: +{selectedInfluencer.claimed_total_return}%</span>
                        <span className={hasAccess ? 'text-yellow-400' : ''}>
                          Verified: {hasAccess ? `+${selectedInfluencer.verified_total_return}%` : '***'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold mb-4">Recent Trade Claims</h3>
                <div className="space-y-3">
                  {DEMO_TRADE_CLAIMS.map((claim) => (
                    <div key={claim.id} className="bg-gray-900 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{claim.asset_symbol} {claim.claim_type?.toUpperCase()}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          claim.verification_status === 'verified'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {claim.verification_status?.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Claimed Return: </span>
                          <span className="text-green-400">+{claim.claimed_return_percent}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Verified Return: </span>
                          <span className={hasAccess ? 'text-yellow-400' : ''}>
                            {hasAccess ? `+${claim.verified_return_percent}%` : '***'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {!hasAccess && (
                  <div className="mt-6 p-4 bg-blue-600/20 border border-blue-500 rounded-lg text-center">
                    <p className="text-blue-400 mb-3">Subscribe to see verified performance data</p>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium">
                      Unlock for $2.99/month
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfluencerVerification;
