import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getSponsorByUserId,
  getSponsorCampaigns,
  getAllNativeAds,
  getSponsoredArticles,
  getCampaignAnalytics,
  type Sponsor,
  type SponsoredCampaign,
  type NativeAd,
  type SponsoredArticle,
  type CampaignAnalytics,
} from '../services/sponsoredContent';
import { formatPrice } from '../services/stripe';

type TabId = 'overview' | 'campaigns' | 'content' | 'analytics' | 'billing';

export function AdvertiserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [campaigns, setCampaigns] = useState<SponsoredCampaign[]>([]);
  const [nativeAds, setNativeAds] = useState<NativeAd[]>([]);
  const [articles, setArticles] = useState<SponsoredArticle[]>([]);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/advertiser');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const sponsorData = await getSponsorByUserId(user.id);
      setSponsor(sponsorData);

      if (sponsorData) {
        const [campaignsData, adsData, articlesData] = await Promise.all([
          getSponsorCampaigns(sponsorData.id),
          getAllNativeAds(sponsorData.id),
          getSponsoredArticles({ limit: 20 }),
        ]);
        setCampaigns(campaignsData);
        setNativeAds(adsData);
        setArticles(articlesData);

        if (campaignsData.length > 0) {
          setSelectedCampaign(campaignsData[0].id);
          const analyticsData = await getCampaignAnalytics(campaignsData[0].id);
          setAnalytics(analyticsData);
        }
      }
    } catch (error) {
      console.error('Error loading advertiser data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignSelect = async (campaignId: string) => {
    setSelectedCampaign(campaignId);
    const analyticsData = await getCampaignAnalytics(campaignId);
    setAnalytics(analyticsData);
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
    },
    {
      id: 'campaigns',
      label: 'Campaigns',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      id: 'content',
      label: 'Content',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
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

  // Show signup prompt if not a sponsor
  if (!sponsor) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-4">Become an Advertiser</h1>
          <p className="text-gray-400 text-lg mb-8">
            Reach thousands of crypto investors and traders through native advertising
            and sponsored content on Bitcoin Investments.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="glass-card p-6">
              <div className="text-3xl font-bold text-purple-400 mb-2">100K+</div>
              <p className="text-gray-400">Monthly Visitors</p>
            </div>
            <div className="glass-card p-6">
              <div className="text-3xl font-bold text-green-400 mb-2">2.5%</div>
              <p className="text-gray-400">Average CTR</p>
            </div>
            <div className="glass-card p-6">
              <div className="text-3xl font-bold text-blue-400 mb-2">High Intent</div>
              <p className="text-gray-400">Crypto Audience</p>
            </div>
          </div>

          <div className="glass-card p-8 text-left mb-8">
            <h2 className="text-xl font-bold mb-4">Advertising Options</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Sponsored Articles</h3>
                  <p className="text-sm text-gray-400">Native content marketing that educates while promoting your brand</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Native Ads</h3>
                  <p className="text-sm text-gray-400">In-feed ads that blend naturally with content</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Newsletter Sponsorship</h3>
                  <p className="text-sm text-gray-400">Reach our email subscribers directly</p>
                </div>
              </div>
            </div>
          </div>

          <Link to="/contact?subject=advertising" className="btn-primary">
            Contact Us to Get Started
          </Link>
        </div>
      </div>
    );
  }

  const totalImpressions = nativeAds.reduce((sum, ad) => sum + ad.impressions, 0);
  const totalClicks = nativeAds.reduce((sum, ad) => sum + ad.clicks, 0);
  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {sponsor.logoUrl && (
              <img src={sponsor.logoUrl} alt={sponsor.name} className="w-12 h-12 rounded-lg" />
            )}
            <div>
              <h1 className="text-2xl font-bold">{sponsor.name}</h1>
              <p className="text-gray-400 text-sm">Advertiser Dashboard</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm ${
            sponsor.status === 'approved' ? 'bg-green-500/20 text-green-400' :
            sponsor.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {sponsor.status}
          </span>
          <button className="btn-primary">
            Create Campaign
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-4">
          <p className="text-gray-400 text-sm mb-1">Total Impressions</p>
          <p className="text-2xl font-bold">{totalImpressions.toLocaleString()}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-gray-400 text-sm mb-1">Total Clicks</p>
          <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-gray-400 text-sm mb-1">CTR</p>
          <p className="text-2xl font-bold">
            {totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0}%
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-gray-400 text-sm mb-1">Budget Spent</p>
          <p className="text-2xl font-bold">
            {formatPrice(totalSpent)} / {formatPrice(totalBudget)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Active Campaigns */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4">Active Campaigns</h2>
            {campaigns.filter(c => c.status === 'active').length === 0 ? (
              <p className="text-gray-400">No active campaigns</p>
            ) : (
              <div className="space-y-4">
                {campaigns.filter(c => c.status === 'active').slice(0, 5).map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div>
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-sm text-gray-400 capitalize">{campaign.campaignType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{formatPrice(campaign.spent)} / {formatPrice(campaign.budget)}</p>
                      <div className="w-20 h-1.5 bg-gray-700 rounded-full mt-1">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Performance Chart Placeholder */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-4">Performance (Last 7 Days)</h2>
            {analytics && (
              <div className="flex items-end gap-1 h-40">
                {analytics.byDay.slice(-7).map((day, index) => {
                  const maxImpressions = Math.max(...analytics.byDay.slice(-7).map(d => d.impressions));
                  const height = maxImpressions > 0 ? (day.impressions / maxImpressions) * 100 : 0;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-purple-500/50 hover:bg-purple-500 transition-colors rounded-t cursor-pointer"
                        style={{ height: `${height}%` }}
                        title={`${day.date}: ${day.impressions.toLocaleString()} impressions`}
                      />
                      <span className="text-xs text-gray-500 mt-2">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Content */}
          <div className="glass-card p-6 md:col-span-2">
            <h2 className="text-lg font-bold mb-4">Your Content</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {nativeAds.slice(0, 3).map((ad) => (
                <div key={ad.id} className="p-4 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      ad.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {ad.status}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">{ad.placement}</span>
                  </div>
                  <p className="font-medium text-sm mb-2 line-clamp-2">{ad.headline}</p>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{ad.impressions.toLocaleString()} impr.</span>
                    <span>{ad.clicks.toLocaleString()} clicks</span>
                    <span>{((ad.clicks / (ad.impressions || 1)) * 100).toFixed(1)}% CTR</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Your Campaigns</h2>
            <button className="btn-primary">
              New Campaign
            </button>
          </div>

          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="glass-card p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{campaign.name}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        campaign.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        campaign.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                        campaign.status === 'draft' ? 'bg-gray-500/20 text-gray-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {campaign.status}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">{campaign.campaignType}</span>
                    </div>
                    {campaign.description && (
                      <p className="text-gray-400 text-sm mb-4">{campaign.description}</p>
                    )}
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="text-gray-400">Budget:</span>
                        <span className="ml-2 font-medium">{formatPrice(campaign.budget)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Spent:</span>
                        <span className="ml-2 font-medium">{formatPrice(campaign.spent)}</span>
                      </div>
                      {campaign.startDate && (
                        <div>
                          <span className="text-gray-400">Dates:</span>
                          <span className="ml-2">
                            {new Date(campaign.startDate).toLocaleDateString()} -
                            {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Ongoing'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCampaignSelect(campaign.id)}
                      className="btn-secondary"
                    >
                      View Analytics
                    </button>
                    <button className="btn-secondary">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Your Content</h2>
            <div className="flex gap-2">
              <button className="btn-secondary">
                New Native Ad
              </button>
              <button className="btn-primary">
                New Sponsored Article
              </button>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-4">Native Ads</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {nativeAds.map((ad) => (
              <div key={ad.id} className="glass-card p-4">
                {ad.imageUrl && (
                  <img src={ad.imageUrl} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />
                )}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 text-xs rounded ${
                    ad.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {ad.status}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">{ad.placement}</span>
                </div>
                <h4 className="font-medium mb-1">{ad.headline}</h4>
                <p className="text-sm text-gray-400 line-clamp-2 mb-3">{ad.description}</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{ad.impressions.toLocaleString()} impressions</span>
                  <span>{ad.clicks.toLocaleString()} clicks</span>
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-semibold mb-4">Sponsored Articles</h3>
          <div className="space-y-4">
            {articles.map((article) => (
              <div key={article.id} className="glass-card p-4 flex gap-4">
                {article.featuredImage && (
                  <img src={article.featuredImage} alt="" className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      article.status === 'published' ? 'bg-green-500/20 text-green-400' :
                      article.status === 'draft' ? 'bg-gray-500/20 text-gray-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {article.status}
                    </span>
                    {article.category && (
                      <span className="text-xs text-gray-500 capitalize">{article.category}</span>
                    )}
                  </div>
                  <h4 className="font-medium mb-1">{article.title}</h4>
                  <p className="text-sm text-gray-400 line-clamp-1">{article.excerpt}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>{article.viewCount.toLocaleString()} views</span>
                    <span>{article.clickCount.toLocaleString()} CTA clicks</span>
                    <span>{article.shareCount.toLocaleString()} shares</span>
                  </div>
                </div>
                <button className="btn-secondary self-start">
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-xl font-bold">Analytics</h2>
            <select
              value={selectedCampaign || ''}
              onChange={(e) => handleCampaignSelect(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2"
            >
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card p-4">
              <p className="text-gray-400 text-sm mb-1">Impressions</p>
              <p className="text-2xl font-bold">{analytics.impressions.toLocaleString()}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-gray-400 text-sm mb-1">Clicks</p>
              <p className="text-2xl font-bold">{analytics.clicks.toLocaleString()}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-gray-400 text-sm mb-1">CTR</p>
              <p className="text-2xl font-bold text-green-400">{analytics.ctr}%</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-gray-400 text-sm mb-1">Unique Users</p>
              <p className="text-2xl font-bold">{analytics.uniqueUsers.toLocaleString()}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Daily Performance */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Daily Performance</h3>
              <div className="flex items-end gap-1 h-48">
                {analytics.byDay.map((day) => {
                  const maxImpressions = Math.max(...analytics.byDay.map(d => d.impressions));
                  const height = maxImpressions > 0 ? (day.impressions / maxImpressions) * 100 : 0;
                  return (
                    <div
                      key={day.date}
                      className="flex-1 bg-purple-500/50 hover:bg-purple-500 transition-colors rounded-t cursor-pointer group relative"
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {day.date}: {day.impressions.toLocaleString()} imp, {day.clicks} clicks
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Device Breakdown */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Device Breakdown</h3>
              <div className="space-y-4">
                {Object.entries(analytics.byDevice).map(([device, percentage]) => (
                  <div key={device}>
                    <div className="flex justify-between mb-1">
                      <span className="capitalize">{device}</span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="max-w-3xl">
          <h2 className="text-xl font-bold mb-6">Billing & Invoices</h2>

          <div className="glass-card p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Account Summary</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Spent (All Time)</p>
                <p className="text-2xl font-bold">{formatPrice(sponsor.totalSpent)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-green-400">{formatPrice(totalBudget - totalSpent)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Active Budget</p>
                <p className="text-2xl font-bold">{formatPrice(totalBudget)}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recent Invoices</h3>
              <button className="text-purple-400 hover:text-purple-300 text-sm">
                View All
              </button>
            </div>
            <p className="text-gray-400 text-center py-8">No invoices yet</p>
          </div>
        </div>
      )}
    </div>
  );
}
