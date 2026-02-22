import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Activity,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { PriceChart } from '../components/charts';
import { SEO } from '../components/SEO';
import { getCryptocurrencyById } from '../services/coingecko';
import type { Cryptocurrency } from '../types';

export function CoinDetail() {
  const { id } = useParams<{ id: string }>();
  const [coin, setCoin] = useState<Cryptocurrency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function fetchCoin() {
      setLoading(true);
      setError(null);
      try {
        const data = await getCryptocurrencyById(id!);
        setCoin(data);
      } catch {
        setError('Failed to load cryptocurrency data.');
      } finally {
        setLoading(false);
      }
    }
    fetchCoin();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-white/5 rounded" />
          <div className="h-12 w-96 bg-white/5 rounded" />
          <div className="h-[350px] bg-white/5 rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !coin) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="glass-card p-12 text-center">
          <p className="text-gray-400 text-lg mb-4">{error || 'Cryptocurrency not found.'}</p>
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-brand-primary hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const priceChangePositive = coin.price_change_percentage_24h >= 0;

  return (
    <>
      <SEO
        title={`${coin.name} (${coin.symbol.toUpperCase()}) Price, Chart & Stats`}
        description={`Live ${coin.name} price: $${coin.current_price.toLocaleString()}. View real-time ${coin.symbol.toUpperCase()} price chart, market cap, volume, and key statistics.`}
        keywords={[
          coin.name,
          coin.symbol.toUpperCase(),
          `${coin.name} price`,
          `${coin.symbol.toUpperCase()} price chart`,
          'cryptocurrency',
        ]}
      />
      <div className="container mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-white">{coin.name}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <img src={coin.image} alt={coin.name} className="w-12 h-12 rounded-full" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-bold text-white">{coin.name}</h1>
                <span className="text-gray-400 text-lg uppercase bg-white/5 px-2 py-1 rounded">{coin.symbol}</span>
                <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">Rank #{coin.market_cap_rank}</span>
              </div>
            </div>
          </div>

          <div className="md:ml-auto text-left md:text-right">
            <p className="text-3xl md:text-4xl font-bold text-white">
              ${coin.current_price.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: coin.current_price < 1 ? 6 : 2,
              })}
            </p>
            <div className={cn(
              'inline-flex items-center gap-1 text-lg font-medium mt-1',
              priceChangePositive ? 'text-green-400' : 'text-red-400'
            )}>
              {priceChangePositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              {priceChangePositive ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%
              <span className="text-sm text-gray-500 ml-1">(24h)</span>
            </div>
          </div>
        </div>

        {/* Price Chart */}
        <div className="glass-card p-6 mb-8">
          <PriceChart
            cryptocurrencyId={coin.id}
            cryptocurrencyName={coin.name}
            days={30}
            height={350}
            showVolume={true}
          />
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-400">Market Cap</p>
            </div>
            <p className="text-lg font-bold text-white">
              ${(coin.market_cap / 1e9).toFixed(2)}B
            </p>
            <p className={cn('text-xs', coin.market_cap_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400')}>
              {coin.market_cap_change_percentage_24h >= 0 ? '+' : ''}{coin.market_cap_change_percentage_24h.toFixed(2)}%
            </p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-400">24h Volume</p>
            </div>
            <p className="text-lg font-bold text-white">
              ${(coin.total_volume / 1e9).toFixed(2)}B
            </p>
            <p className="text-xs text-gray-500">
              Vol/MCap: {((coin.total_volume / coin.market_cap) * 100).toFixed(2)}%
            </p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <p className="text-xs text-gray-400">24h High</p>
            </div>
            <p className="text-lg font-bold text-white">
              ${coin.high_24h.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: coin.high_24h < 1 ? 6 : 2,
              })}
            </p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <p className="text-xs text-gray-400">24h Low</p>
            </div>
            <p className="text-lg font-bold text-white">
              ${coin.low_24h.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: coin.low_24h < 1 ? 6 : 2,
              })}
            </p>
          </div>
        </div>

        {/* Supply & ATH Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Supply Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400 text-sm">Circulating Supply</span>
                <span className="text-white font-medium text-sm">
                  {coin.circulating_supply.toLocaleString()} {coin.symbol.toUpperCase()}
                </span>
              </div>
              {coin.total_supply && (
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400 text-sm">Total Supply</span>
                  <span className="text-white font-medium text-sm">
                    {coin.total_supply.toLocaleString()} {coin.symbol.toUpperCase()}
                  </span>
                </div>
              )}
              {coin.max_supply && (
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400 text-sm">Max Supply</span>
                  <span className="text-white font-medium text-sm">
                    {coin.max_supply.toLocaleString()} {coin.symbol.toUpperCase()}
                  </span>
                </div>
              )}
              {coin.max_supply && (
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Supply Progress</span>
                    <span>{((coin.circulating_supply / coin.max_supply) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-primary rounded-full transition-all"
                      style={{ width: `${Math.min((coin.circulating_supply / coin.max_supply) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {coin.fully_diluted_valuation && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-400 text-sm">Fully Diluted Valuation</span>
                  <span className="text-white font-medium text-sm">
                    ${(coin.fully_diluted_valuation / 1e9).toFixed(2)}B
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">All-Time Records</h3>
            <div className="space-y-4">
              <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <p className="text-xs text-green-400 font-medium">All-Time High</p>
                </div>
                <p className="text-xl font-bold text-white mb-1">
                  ${coin.ath.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: coin.ath < 1 ? 6 : 2 })}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-red-400">{coin.ath_change_percentage.toFixed(2)}%</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(coin.ath_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <p className="text-xs text-red-400 font-medium">All-Time Low</p>
                </div>
                <p className="text-xl font-bold text-white mb-1">
                  ${coin.atl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: coin.atl < 1 ? 6 : 2 })}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-green-400">+{coin.atl_change_percentage.toFixed(2)}%</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(coin.atl_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Links */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4">Tools & Resources</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              to="/calculators"
              className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-brand-primary" />
                <div>
                  <p className="text-white font-medium text-sm">DCA Calculator</p>
                  <p className="text-xs text-gray-400">Plan your {coin.symbol.toUpperCase()} investment</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-primary transition-colors" />
            </Link>

            <Link
              to="/compare"
              className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-white font-medium text-sm">Compare Exchanges</p>
                  <p className="text-xs text-gray-400">Find the best place to buy</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-primary transition-colors" />
            </Link>

            <Link
              to="/learn"
              className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-white font-medium text-sm">Learn More</p>
                  <p className="text-xs text-gray-400">Crypto guides & education</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-primary transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
