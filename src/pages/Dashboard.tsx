import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowRight,
  RefreshCw,
  Search,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { FearGreedGauge, FearGreedCompact } from '../components/FearGreedIndex';
import { PortfolioTracker } from '../components/PortfolioTracker';
import { PriceChart } from '../components/charts';
import { GasPriceTracker } from '../components/GasPriceTracker';
import {
  getCachedTopCryptocurrencies,
  getGlobalMarketData,
  getTrendingCryptocurrencies,
} from '../services/coingecko';
import type { Cryptocurrency } from '../types';

export function Dashboard() {
  const [cryptos, setCryptos] = useState<Cryptocurrency[]>([]);
  const [globalData, setGlobalData] = useState<{
    total_market_cap: Record<string, number>;
    market_cap_change_percentage_24h_usd: number;
  } | null>(null);
  const [trending, setTrending] = useState<{
    id: string;
    name: string;
    symbol: string;
    thumb: string;
    market_cap_rank: number;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [cryptoData, global, trendingData] = await Promise.all([
        getCachedTopCryptocurrencies(20),
        getGlobalMarketData(),
        getTrendingCryptocurrencies(),
      ]);
      setCryptos(cryptoData);
      setGlobalData(global);
      setTrending(trendingData.slice(0, 5));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredCryptos = cryptos.filter(
    (crypto) =>
      crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Market Dashboard</h1>
          <p className="text-gray-400">Real-time cryptocurrency market data</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg glass hover:bg-white/10 text-gray-300 transition-colors"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Global Stats */}
      {globalData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-4">
            <p className="text-xs text-gray-400 mb-1">Total Market Cap</p>
            <p className="text-xl font-bold text-white">
              ${(globalData.total_market_cap.usd / 1e12).toFixed(2)}T
            </p>
            <div className={cn(
              'flex items-center gap-1 text-sm',
              globalData.market_cap_change_percentage_24h_usd >= 0
                ? 'text-green-400'
                : 'text-red-400'
            )}>
              {globalData.market_cap_change_percentage_24h_usd >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {globalData.market_cap_change_percentage_24h_usd.toFixed(2)}%
            </div>
          </div>

          <FearGreedCompact className="col-span-1" />

          <div className="glass-card p-4">
            <p className="text-xs text-gray-400 mb-1">BTC Dominance</p>
            <p className="text-xl font-bold text-white">
              {filteredCryptos[0]?.market_cap && globalData.total_market_cap.usd
                ? ((filteredCryptos[0].market_cap / globalData.total_market_cap.usd) * 100).toFixed(1)
                : '--'}%
            </p>
          </div>

          <div className="glass-card p-4">
            <p className="text-xs text-gray-400 mb-1">Active Cryptos</p>
            <p className="text-xl font-bold text-white">
              {cryptos.length > 0 ? '10,000+' : '--'}
            </p>
          </div>
        </div>
      )}

      {/* Featured Chart - Bitcoin */}
      <div className="mb-8">
        <PriceChart
          cryptocurrencyId="bitcoin"
          cryptocurrencyName="Bitcoin"
          days={7}
          height={300}
          showVolume={false}
        />
      </div>

      {/* Portfolio Tracker */}
      <div className="mb-8">
        <PortfolioTracker variant="full" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Price Table */}
        <div className="lg:col-span-2">
          <div className="glass-card p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-bold text-white">Top Cryptocurrencies</h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-2 text-gray-400 font-medium text-sm">#</th>
                      <th className="text-left py-3 px-2 text-gray-400 font-medium text-sm">Name</th>
                      <th className="text-right py-3 px-2 text-gray-400 font-medium text-sm">Price</th>
                      <th className="text-right py-3 px-2 text-gray-400 font-medium text-sm">24h</th>
                      <th className="text-right py-3 px-2 text-gray-400 font-medium text-sm hidden md:table-cell">Market Cap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCryptos.map((crypto) => (
                      <tr
                        key={crypto.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <td className="py-4 px-2 text-gray-400">{crypto.market_cap_rank}</td>
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={crypto.image}
                              alt={crypto.name}
                              className="w-6 h-6 rounded-full"
                            />
                            <div>
                              <p className="font-medium text-white">{crypto.name}</p>
                              <p className="text-xs text-gray-400 uppercase">{crypto.symbol}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-2 text-right font-medium text-white">
                          ${crypto.current_price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: crypto.current_price < 1 ? 6 : 2,
                          })}
                        </td>
                        <td className={cn(
                          'py-4 px-2 text-right font-medium',
                          crypto.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'
                        )}>
                          <div className="flex items-center justify-end gap-1">
                            {crypto.price_change_percentage_24h >= 0 ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
                          </div>
                        </td>
                        <td className="py-4 px-2 text-right text-gray-300 hidden md:table-cell">
                          ${(crypto.market_cap / 1e9).toFixed(2)}B
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link
                to="/prices"
                className="inline-flex items-center gap-2 text-brand-primary hover:underline"
              >
                View all prices <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Fear & Greed */}
          <FearGreedGauge historyDays={7} />

          {/* Gas Price Tracker */}
          <GasPriceTracker variant="compact" />

          {/* Trending */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Trending</h3>
            <div className="space-y-3">
              {trending.map((coin, index) => (
                <div
                  key={coin.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="text-gray-400 w-4">{index + 1}</span>
                  <img
                    src={coin.thumb}
                    alt={coin.name}
                    className="w-6 h-6 rounded-full"
                  />
                  <div className="flex-grow">
                    <p className="font-medium text-white text-sm">{coin.name}</p>
                    <p className="text-xs text-gray-400 uppercase">{coin.symbol}</p>
                  </div>
                  <span className="text-xs text-gray-400">#{coin.market_cap_rank}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                to="/calculators"
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-brand-primary" />
                  <span className="text-white">DCA Calculator</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                to="/compare"
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-white">Compare Exchanges</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
