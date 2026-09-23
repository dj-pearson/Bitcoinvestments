import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowRight,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn, formatCompactCurrency, formatCryptoPrice } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { FearGreedGauge, FearGreedCompact } from '../components/FearGreedIndex';
import { PortfolioTracker } from '../components/PortfolioTracker';
import { PriceChart, MarketDataStatus } from '../components/charts';
import { GasPriceTracker } from '../components/GasPriceTracker';
import { SEO } from '../components/SEO';
import { FAQSection } from '../components/GEOContent';
import { RelatedPages } from '../components/InternalLinks';
import { PAGE_METADATA, generateFAQSchema, generateItemListSchema } from '../lib/seo';
import { DashboardStatsSkeleton, TrendingListSkeleton } from '../components/LoadingSkeletons';
import {
  fetchTopCryptocurrencies,
  fetchGlobalMarketData,
  fetchTrendingCryptocurrencies,
  describeMarketError,
  type GlobalMarketData,
  type TrendingCoin,
} from '../services/coingecko';
import { COIN_PROFILES } from '../data/coins';
import { fmtPct, fmtNumber, fmtStaticDate, isNum } from '../lib/marketFormat';
import type { Cryptocurrency } from '../types';

/** Date the static copy on this page was last reviewed. */
const PAGE_REVIEWED = '2026-09-23';
const TOP_N = 100;
const PAGE_SIZE = 25;

const DASHBOARD_FAQS = [
  {
    question: 'Where do these crypto prices come from?',
    answer:
      'All prices, market caps and volumes come from CoinGecko, which aggregates trading data from hundreds of exchanges. The time under the table shows when the data was fetched.',
  },
  {
    question: 'How current are the prices on this page?',
    answer:
      'Usually a few minutes old. Our server caches CoinGecko responses for 2 to 5 minutes and your browser reuses them for up to 2 minutes, so prices can lag a live exchange. The page does not stream prices; press Refresh to fetch again. If CoinGecko is unavailable we show the last data we have, clearly marked with its time.',
  },
  {
    question: 'What is market capitalization?',
    answer:
      'Market cap is the current price multiplied by the circulating supply. It is the usual way to rank cryptocurrencies by size, but it says nothing about how much money actually flowed in or how easily you could sell.',
  },
  {
    question: 'What is Bitcoin dominance?',
    answer:
      'Bitcoin’s market cap as a share of the total crypto market cap. A rising figure usually means money is moving toward Bitcoin relative to other coins.',
  },
  {
    question: 'What does the Fear & Greed Index measure?',
    answer:
      'It is a 0–100 sentiment score published by alternative.me, built from volatility, momentum, volume, social media and Bitcoin dominance. It describes market mood; it is not a buy or sell signal.',
  },
  {
    question: 'Is the portfolio tracker private?',
    answer:
      'Yes. Holdings you enter are saved only in this browser’s local storage and are not sent to our servers; only the coin ids are sent to fetch prices. Clearing your browser data deletes them, so use Export to keep a CSV backup.',
  },
];

export function Dashboard() {
  const [cryptos, setCryptos] = useState<Cryptocurrency[]>([]);
  const [marketsMeta, setMarketsMeta] = useState<{ fetchedAt: number; stale: boolean } | null>(null);
  const [marketsError, setMarketsError] = useState<string | null>(null);
  const [globalData, setGlobalData] = useState<GlobalMarketData | null>(null);
  const [trending, setTrending] = useState<TrendingCoin[]>([]);
  const [trendingFailed, setTrendingFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async (force = false) => {
    setLoading(true);
    const [marketsResult, globalResult, trendingResult] = await Promise.allSettled([
      fetchTopCryptocurrencies(TOP_N, 1, 'usd', { force }),
      fetchGlobalMarketData({ force }),
      fetchTrendingCryptocurrencies({ force }),
    ]);

    if (marketsResult.status === 'fulfilled') {
      setCryptos(marketsResult.value.data);
      setMarketsMeta({ fetchedAt: marketsResult.value.fetchedAt, stale: marketsResult.value.stale });
      setMarketsError(null);
    } else {
      setMarketsError(describeMarketError(marketsResult.reason));
    }

    if (globalResult.status === 'fulfilled') setGlobalData(globalResult.value.data);

    if (trendingResult.status === 'fulfilled') {
      setTrending(trendingResult.value.data.slice(0, 5));
      setTrendingFailed(false);
    } else {
      setTrendingFailed(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredCryptos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return cryptos;
    return cryptos.filter(
      (crypto) => crypto.name.toLowerCase().includes(q) || crypto.symbol.toLowerCase().includes(q)
    );
  }, [cryptos, searchQuery]);

  const pageCount = Math.max(1, Math.ceil(filteredCryptos.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleCryptos = filteredCryptos.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const btcDominance = globalData?.market_cap_percentage?.btc;
  const marketCapChange = globalData?.market_cap_change_percentage_24h_usd;

  const meta = PAGE_METADATA.dashboard;
  const dashboardSchema = useMemo(
    () => [
      generateItemListSchema({
        name: 'Cryptocurrency guides',
        description: 'Plain-English profiles with live prices for major cryptocurrencies.',
        items: COIN_PROFILES.map((coin, i) => ({ name: coin.name, url: `/coin/${coin.id}`, position: i + 1 })),
      }),
      generateFAQSchema(DASHBOARD_FAQS),
    ],
    []
  );

  return (
    <>
      <SEO
        title={meta.title}
        description={meta.description}
        keywords={meta.keywords}
        url="https://bitcoinvestments.net/dashboard"
        schema={dashboardSchema}
      />
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Crypto Prices Today</h1>
            <p className="text-gray-300 leading-relaxed">
              Prices, 24-hour change and market cap for the 100 largest cryptocurrencies, with data from CoinGecko
              that is usually a few minutes old. Select any coin for its chart, key facts and, for major coins, a
              plain-English profile.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Page content last reviewed {fmtStaticDate(PAGE_REVIEWED)}. Not investment advice.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => fetchData(true)}
            loading={loading}
            icon={!loading ? <RefreshCw className="w-4 h-4" /> : undefined}
          >
            Refresh
          </Button>
        </div>

        {/* Global Stats */}
        <section aria-label="Market statistics" className="mb-8">
          {loading && !globalData ? (
            <DashboardStatsSkeleton />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4">
                <p className="text-xs text-gray-400 mb-1">Total Market Cap</p>
                <p className="text-xl font-bold text-white">
                  {formatCompactCurrency(globalData?.total_market_cap?.usd)}
                </p>
                {isNum(marketCapChange) && (
                  <div className={cn('flex items-center gap-1 text-sm', marketCapChange >= 0 ? 'text-green-400' : 'text-red-400')}>
                    {marketCapChange >= 0 ? <TrendingUp className="w-4 h-4" aria-hidden="true" /> : <TrendingDown className="w-4 h-4" aria-hidden="true" />}
                    {fmtPct(marketCapChange)} <span className="text-gray-500 text-xs">24h</span>
                  </div>
                )}
              </div>

              <FearGreedCompact className="col-span-1" />

              <div className="glass-card p-4">
                <p className="text-xs text-gray-400 mb-1">BTC Dominance</p>
                <p className="text-xl font-bold text-white">{fmtPct(btcDominance, { sign: false, digits: 1 })}</p>
              </div>

              <div className="glass-card p-4">
                <p className="text-xs text-gray-400 mb-1">Coins tracked by CoinGecko</p>
                <p className="text-xl font-bold text-white">{fmtNumber(globalData?.active_cryptocurrencies)}</p>
              </div>
            </div>
          )}
        </section>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Price Table */}
          <div className="lg:col-span-2">
            <section className="glass-card p-6" aria-labelledby="top-coins-heading">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h2 id="top-coins-heading" className="text-xl font-bold text-white">
                  Top 100 cryptocurrencies by market cap
                </h2>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
                  <label htmlFor="coin-filter" className="sr-only">Filter coins by name or symbol</label>
                  <input
                    id="coin-filter"
                    type="search"
                    placeholder="Filter by name or symbol"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <MarketDataStatus
                className="mb-4"
                fetchedAt={cryptos.length ? marketsMeta?.fetchedAt : null}
                stale={marketsMeta?.stale || (!!marketsError && cryptos.length > 0)}
                error={marketsError}
                onRetry={() => fetchData(true)}
                retrying={loading}
              />

              {loading && cryptos.length === 0 ? (
                <div className="space-y-4" aria-busy="true">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : cryptos.length === 0 ? null : filteredCryptos.length === 0 ? (
                <p className="text-gray-400 text-sm py-6 text-center" role="status">
                  No coin in the top 100 matches “{searchQuery}”. Try the{' '}
                  <Link to="/charts" className="text-brand-primary hover:underline">chart search</Link>, which covers every coin on CoinGecko.
                </p>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <ul className="md:hidden space-y-3">
                    {visibleCryptos.map((crypto) => (
                      <li key={crypto.id}>
                        <Link
                          to={`/coin/${crypto.id}`}
                          className="block bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500 w-6">#{crypto.market_cap_rank ?? '—'}</span>
                              <img src={crypto.image} alt="" className="w-8 h-8 rounded-full" loading="lazy" />
                              <div>
                                <p className="font-medium text-white text-sm">{crypto.name}</p>
                                <p className="text-xs text-gray-400 uppercase">{crypto.symbol}</p>
                              </div>
                            </div>
                            <ChangeBadge value={crypto.price_change_percentage_24h} />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-500">Price</p>
                              <p className="font-semibold text-white">{formatCryptoPrice(crypto.current_price)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Market Cap</p>
                              <p className="text-sm text-gray-300">{formatCompactCurrency(crypto.market_cap)}</p>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <caption className="sr-only">
                        Top cryptocurrencies by market cap, page {currentPage} of {pageCount}
                      </caption>
                      <thead>
                        <tr className="border-b border-white/10">
                          <th scope="col" className="text-left py-3 px-2 text-gray-400 font-medium text-sm">#</th>
                          <th scope="col" className="text-left py-3 px-2 text-gray-400 font-medium text-sm">Name</th>
                          <th scope="col" className="text-right py-3 px-2 text-gray-400 font-medium text-sm">Price</th>
                          <th scope="col" className="text-right py-3 px-2 text-gray-400 font-medium text-sm">24h</th>
                          <th scope="col" className="text-right py-3 px-2 text-gray-400 font-medium text-sm">Market Cap</th>
                          <th scope="col" className="text-right py-3 px-2 text-gray-400 font-medium text-sm hidden lg:table-cell">Volume (24h)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleCryptos.map((crypto) => (
                          <tr key={crypto.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="py-3 px-2 text-gray-400">{crypto.market_cap_rank ?? '—'}</td>
                            <td className="py-3 px-2">
                              <Link to={`/coin/${crypto.id}`} className="flex items-center gap-2 group">
                                <img src={crypto.image} alt="" className="w-6 h-6 rounded-full" loading="lazy" />
                                <span>
                                  <span className="block font-medium text-white group-hover:text-brand-primary">{crypto.name}</span>
                                  <span className="block text-xs text-gray-400 uppercase">{crypto.symbol}</span>
                                </span>
                              </Link>
                            </td>
                            <td className="py-3 px-2 text-right font-medium text-white">{formatCryptoPrice(crypto.current_price)}</td>
                            <td className="py-3 px-2 text-right">
                              <ChangeBadge value={crypto.price_change_percentage_24h} plain />
                            </td>
                            <td className="py-3 px-2 text-right text-gray-300">{formatCompactCurrency(crypto.market_cap)}</td>
                            <td className="py-3 px-2 text-right text-gray-400 hidden lg:table-cell">{formatCompactCurrency(crypto.total_volume)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {pageCount > 1 && (
                    <nav className="mt-6 flex items-center justify-between gap-2" aria-label="Price table pages">
                      <button
                        type="button"
                        onClick={() => setPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white disabled:opacity-40"
                      >
                        <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Previous
                      </button>
                      <div className="flex gap-1">
                        {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setPage(n)}
                            aria-current={n === currentPage ? 'page' : undefined}
                            aria-label={`Page ${n}, coins ${(n - 1) * PAGE_SIZE + 1} to ${Math.min(n * PAGE_SIZE, filteredCryptos.length)}`}
                            className={cn(
                              'w-9 h-9 rounded-lg text-sm',
                              n === currentPage ? 'bg-brand-primary text-white' : 'bg-white/5 hover:bg-white/10 text-gray-300'
                            )}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setPage(Math.min(pageCount, currentPage + 1))}
                        disabled={currentPage === pageCount}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white disabled:opacity-40"
                      >
                        Next <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </nav>
                  )}
                </>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <FearGreedGauge historyDays={7} />

            <GasPriceTracker variant="compact" />

            {loading && trending.length === 0 ? (
              <TrendingListSkeleton items={5} />
            ) : (
              <section className="glass-card p-6" aria-labelledby="trending-heading">
                <h2 id="trending-heading" className="text-lg font-bold text-white mb-1">Trending on CoinGecko</h2>
                <p className="text-xs text-gray-500 mb-4">Most-searched coins on CoinGecko, not a recommendation.</p>
                {trendingFailed && trending.length === 0 ? (
                  <p className="text-sm text-gray-400">Trending data is unavailable right now.</p>
                ) : (
                  <ol className="space-y-2">
                    {trending.map((coin, index) => (
                      <li key={coin.id}>
                        <Link
                          to={`/coin/${coin.id}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <span className="text-gray-400 w-4">{index + 1}</span>
                          <img src={coin.thumb} alt="" className="w-6 h-6 rounded-full" loading="lazy" />
                          <span className="flex-grow">
                            <span className="block font-medium text-white text-sm">{coin.name}</span>
                            <span className="block text-xs text-gray-400 uppercase">{coin.symbol}</span>
                          </span>
                          {coin.market_cap_rank ? (
                            <span className="text-xs text-gray-400">Rank #{coin.market_cap_rank}</span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            )}

            <section className="glass-card p-6" aria-labelledby="tools-heading">
              <h2 id="tools-heading" className="text-lg font-bold text-white mb-4">Tools</h2>
              <div className="space-y-2">
                <Link
                  to="/calculators"
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-brand-primary" aria-hidden="true" />
                    <span className="text-white">DCA Calculator</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
                </Link>
                <Link
                  to="/charts"
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-green-400" aria-hidden="true" />
                    <span className="text-white">Compare coins on a chart</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
                </Link>
                <Link
                  to="/compare"
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-400" aria-hidden="true" />
                    <span className="text-white">Compare Exchanges</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
                </Link>
              </div>
            </section>
          </div>
        </div>

        {/* Bitcoin chart */}
        <section className="mt-8" aria-labelledby="btc-chart-heading">
          <h2 id="btc-chart-heading" className="text-xl font-bold text-white mb-4">Bitcoin price chart</h2>
          <PriceChart cryptocurrencyId="bitcoin" days={7} height={300} showVolume={false} />
        </section>

        {/* Portfolio Tracker */}
        <section className="mt-8" aria-labelledby="portfolio-heading">
          <h2 id="portfolio-heading" className="text-xl font-bold text-white mb-4">Your portfolio</h2>
          <PortfolioTracker variant="full" />
        </section>

        {/* How to read */}
        <section className="mt-12 glass-card p-6" aria-labelledby="how-to-read-heading">
          <h2 id="how-to-read-heading" className="text-xl font-bold text-white mb-4">How to read the price table</h2>
          <dl className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-semibold text-white">Price</dt>
              <dd className="text-gray-300">A volume-weighted average across exchanges in US dollars. The price on your exchange may differ slightly.</dd>
            </div>
            <div>
              <dt className="font-semibold text-white">24h</dt>
              <dd className="text-gray-300">Percentage change over the last 24 hours, not since midnight.</dd>
            </div>
            <div>
              <dt className="font-semibold text-white">Market cap</dt>
              <dd className="text-gray-300">Price × circulating supply. Used to rank coins by size.</dd>
            </div>
            <div>
              <dt className="font-semibold text-white">Volume (24h)</dt>
              <dd className="text-gray-300">Value traded in the last 24 hours. Low volume relative to market cap means prices can move sharply on small trades.</dd>
            </div>
          </dl>
        </section>

        {/* Coin guides (static, crawlable) */}
        <section className="mt-8" aria-labelledby="coin-guides-heading">
          <h2 id="coin-guides-heading" className="text-xl font-bold text-white mb-2">Coin guides</h2>
          <p className="text-sm text-gray-400 mb-4">
            Plain-English profiles with launch date, supply rules, main risks and FAQs, alongside live prices.
          </p>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {COIN_PROFILES.map((coin) => (
              <li key={coin.id}>
                <Link
                  to={`/coin/${coin.id}`}
                  className="block h-full p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <span className="block font-medium text-white">
                    {coin.name} <span className="text-gray-400 text-xs">{coin.symbol}</span>
                  </span>
                  <span className="block text-xs text-gray-400">{coin.category}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <FAQSection title="Crypto prices: frequently asked questions" faqs={DASHBOARD_FAQS} />

        <div className="mt-12">
          <RelatedPages currentPath="/dashboard" title="Explore More Tools" />
        </div>
      </div>
    </>
  );
}

function ChangeBadge({ value, plain = false }: { value: number | null | undefined; plain?: boolean }) {
  if (!isNum(value)) {
    return <span className="text-sm text-gray-500">—</span>;
  }
  const up = value >= 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm font-medium',
        up ? 'text-green-400' : 'text-red-400',
        !plain && 'px-2 py-1 rounded',
        !plain && (up ? 'bg-green-500/10' : 'bg-red-500/10')
      )}
    >
      {up ? <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" /> : <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />}
      {fmtPct(value)}
    </span>
  );
}
