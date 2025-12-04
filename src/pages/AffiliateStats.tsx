import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  MousePointerClick,
  Target,
  Calendar,
  ExternalLink,
  BarChart3,
} from 'lucide-react';
import { getAffiliateStatsDb } from '../services/database';
import { supabase } from '../lib/supabase';

interface Stats {
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalRevenue: number;
}

interface Click {
  id: string;
  affiliate_id: string;
  platform_type: string;
  platform_name: string;
  source_page: string;
  clicked_at: string;
  converted: boolean;
  conversion_value: number | null;
}

interface PlatformStats {
  platform_name: string;
  clicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
}

export function AffiliateStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentClicks, setRecentClicks] = useState<Click[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats[]>([]);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  async function loadStats() {
    setLoading(true);

    // Calculate date range
    const now = new Date();
    let startDate: string | undefined;

    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const start = new Date(now);
      start.setDate(start.getDate() - days);
      startDate = start.toISOString();
    }

    // Get aggregate stats
    const aggregateStats = await getAffiliateStatsDb(startDate, now.toISOString());
    if (aggregateStats) {
      setStats(aggregateStats);
    }

    // Get recent clicks
    let clicksQuery = supabase
      .from('affiliate_clicks')
      .select('*')
      .order('clicked_at', { ascending: false })
      .limit(50);

    if (startDate) {
      clicksQuery = clicksQuery.gte('clicked_at', startDate);
    }

    const { data: clicks } = await clicksQuery;

    if (clicks) {
      setRecentClicks(clicks);

      // Calculate per-platform stats
      const platformMap = new Map<string, PlatformStats>();

      clicks.forEach(click => {
        const existing = platformMap.get(click.platform_name) || {
          platform_name: click.platform_name,
          clicks: 0,
          conversions: 0,
          revenue: 0,
          conversionRate: 0,
        };

        existing.clicks++;
        if (click.converted) {
          existing.conversions++;
          existing.revenue += click.conversion_value || 0;
        }

        platformMap.set(click.platform_name, existing);
      });

      const platformStatsArray = Array.from(platformMap.values()).map(p => ({
        ...p,
        conversionRate: p.clicks > 0 ? (p.conversions / p.clicks) * 100 : 0,
      }));

      platformStatsArray.sort((a, b) => b.clicks - a.clicks);
      setPlatformStats(platformStatsArray);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Affiliate Analytics</h1>
          <p className="text-gray-400">
            Track your referral performance and earnings
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex gap-2 mt-4 md:mt-0">
          {[
            { value: '7d' as const, label: '7 Days' },
            { value: '30d' as const, label: '30 Days' },
            { value: '90d' as const, label: '90 Days' },
            { value: 'all' as const, label: 'All Time' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setDateRange(value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateRange === value
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <MousePointerClick className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {stats.totalClicks.toLocaleString()}
            </p>
            <p className="text-sm text-gray-400">Total Clicks</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Target className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {stats.totalConversions.toLocaleString()}
            </p>
            <p className="text-sm text-gray-400">Conversions</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              {stats.conversionRate.toFixed(2)}%
            </p>
            <p className="text-sm text-gray-400">Conversion Rate</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-orange-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">
              ${stats.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-400">Estimated Revenue</p>
          </div>
        </div>
      )}

      {/* Platform Breakdown */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-orange-500" />
          <h2 className="text-xl font-bold text-white">Platform Performance</h2>
        </div>

        {platformStats.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">
              No affiliate data yet. Share your referral links to start tracking!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                    Platform
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Clicks
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Conversions
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Rate
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {platformStats.map((platform) => (
                  <tr key={platform.platform_name} className="border-b border-gray-700/50">
                    <td className="py-3 px-4">
                      <span className="text-white font-medium">{platform.platform_name}</span>
                    </td>
                    <td className="text-right py-3 px-4 text-white">
                      {platform.clicks.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 text-white">
                      {platform.conversions.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          platform.conversionRate >= 2
                            ? 'bg-green-500/20 text-green-400'
                            : platform.conversionRate >= 1
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        {platform.conversionRate.toFixed(2)}%
                      </span>
                    </td>
                    <td className="text-right py-3 px-4 text-white font-medium">
                      ${platform.revenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-6 h-6 text-orange-500" />
          <h2 className="text-xl font-bold text-white">Recent Activity</h2>
        </div>

        {recentClicks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentClicks.slice(0, 20).map((click) => (
              <div
                key={click.id}
                className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      click.converted ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                  />
                  <div>
                    <p className="text-white font-medium">{click.platform_name}</p>
                    <p className="text-xs text-gray-400">
                      From: {click.source_page}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {click.converted && (
                    <p className="text-green-400 text-sm font-medium mb-1">
                      Converted ${click.conversion_value?.toFixed(2)}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {new Date(click.clicked_at).toLocaleDateString()} at{' '}
                    {new Date(click.clicked_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Get Started Section (if no data) */}
      {recentClicks.length === 0 && (
        <div className="mt-8 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl p-8 border border-orange-500/20">
          <div className="text-center">
            <ExternalLink className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              Start Earning with Affiliate Links
            </h3>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              Share platform recommendations throughout your site. Your affiliate links are
              automatically tracked, and conversions are monitored.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/compare"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
              >
                View Platforms
              </Link>
              <a
                href="https://github.com/yourusername/bitcoin-investments#affiliate-setup"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
              >
                Setup Guide
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
