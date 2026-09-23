import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  PriceChart,
  ComparisonChart,
  CHART_PERIODS,
  COMPARISON_COLORS,
  MAX_COMPARED_COINS,
  MarketDataStatus,
  type ChartPeriod,
} from '../components/charts';
import {
  searchCryptocurrencies,
  fetchTopCryptocurrencies,
  describeMarketError,
  type CoinSearchResult,
} from '../services/coingecko';
import { Search, Plus, TrendingUp, ArrowUpRight } from 'lucide-react';
import { SEO } from '../components/SEO';
import { FAQSection } from '../components/GEOContent';
import { RelatedPages } from '../components/InternalLinks';
import { PAGE_METADATA, generateToolSchema, generateFAQSchema } from '../lib/seo';
import { formatCryptoPrice, cn } from '../lib/utils';
import { fmtPct, fmtStaticDate } from '../lib/marketFormat';
import { COIN_PROFILES, isCuratedCoin } from '../data/coins';
import type { Cryptocurrency } from '../types';

const PAGE_REVIEWED = '2026-09-23';
const COIN_ID_RE = /^[a-z0-9][a-z0-9-]{0,99}$/;
const DEFAULT_COMPARE = ['bitcoin', 'ethereum'];

const CHARTS_FAQS = [
  {
    question: 'How do I compare cryptocurrency prices?',
    answer:
      'Switch to Comparison mode and add up to 8 coins with the search box. The default % change view starts every line at 0% at the beginning of the period, so you can see which coin performed better regardless of its price. The table under the chart lists each coin’s change, high, low and maximum drawdown.',
  },
  {
    question: 'What timeframes are available?',
    answer:
      '24 hours, 7 days, 14 days, 1 month, 3 months, 6 months and 1 year. CoinGecko returns roughly 5-minute data points for 24 hours, hourly points up to 90 days and daily points beyond that.',
  },
  {
    question: 'What is maximum drawdown?',
    answer:
      'The largest percentage fall from a peak to a later low within the chosen period. It shows how painful the worst stretch was for someone who bought at the top, which a simple start-to-end change hides.',
  },
  {
    question: 'Can I share or bookmark a chart?',
    answer:
      'Yes. The address bar updates with the coin, comparison list and period you pick (for example /charts?compare=bitcoin,ethereum&days=90), so the link opens the same view.',
  },
  {
    question: 'Where does the chart data come from?',
    answer:
      'Historical prices and volumes come from CoinGecko. Our server caches chart data for about 5 minutes, so the latest point can be a few minutes behind a live exchange.',
  },
];

function titleFromId(id: string): string {
  return id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseDays(value: string | null): ChartPeriod {
  const n = Number(value);
  return (CHART_PERIODS.find((p) => p.value === n)?.value ?? 30) as ChartPeriod;
}

function parseIds(value: string | null): string[] {
  if (!value) return [];
  const ids = value.split(',').map((s) => s.trim().toLowerCase()).filter((s) => COIN_ID_RE.test(s));
  return [...new Set(ids)].slice(0, MAX_COMPARED_COINS);
}

type CoinName = { name: string; symbol: string };

export function Charts() {
  const [searchParams, setSearchParams] = useSearchParams();

  const coinParam = searchParams.get('coin')?.toLowerCase() ?? '';
  const selectedId = COIN_ID_RE.test(coinParam) ? coinParam : 'bitcoin';
  const comparisonMode = searchParams.has('compare');
  const compareRaw = searchParams.get('compare');
  const compareParam = useMemo(() => parseIds(compareRaw), [compareRaw]);
  const comparedIds = comparisonMode ? compareParam : DEFAULT_COMPARE;
  const days = parseDays(searchParams.get('days'));

  // Names we know for ids (curated profiles, top coins, search results).
  const [knownNames, setKnownNames] = useState<Record<string, CoinName>>(() =>
    Object.fromEntries(COIN_PROFILES.map((p) => [p.id, { name: p.name, symbol: p.symbol }]))
  );
  const nameFor = useCallback(
    (id: string): CoinName => knownNames[id] ?? { name: titleFromId(id), symbol: id.slice(0, 5).toUpperCase() },
    [knownNames]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CoinSearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [limitNotice, setLimitNotice] = useState(false);

  const [popularCryptos, setPopularCryptos] = useState<Cryptocurrency[]>([]);
  const [popularMeta, setPopularMeta] = useState<{ fetchedAt: number; stale: boolean } | null>(null);
  const [popularError, setPopularError] = useState<string | null>(null);
  const [popularLoading, setPopularLoading] = useState(true);

  const updateParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams);
      mutate(next);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const loadPopular = useCallback(async (force = false) => {
    setPopularLoading(true);
    try {
      const result = await fetchTopCryptocurrencies(10, 1, 'usd', { force });
      setPopularCryptos(result.data);
      setPopularMeta({ fetchedAt: result.fetchedAt, stale: result.stale });
      setPopularError(null);
      setKnownNames((prev) => ({
        ...prev,
        ...Object.fromEntries(result.data.map((c) => [c.id, { name: c.name, symbol: c.symbol.toUpperCase() }])),
      }));
    } catch (error) {
      setPopularError(describeMarketError(error));
    } finally {
      setPopularLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPopular();
  }, [loadPopular]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      setSearchError(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchCryptocurrencies(q);
        if (cancelled) return;
        setSearchResults(results.slice(0, 8));
        setSearchError(null);
        setShowResults(true);
      } catch (error) {
        if (cancelled) return;
        setSearchResults([]);
        setSearchError(describeMarketError(error));
        setShowResults(true);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  function selectCrypto(crypto: { id: string; name: string; symbol: string }) {
    setKnownNames((prev) => ({ ...prev, [crypto.id]: { name: crypto.name, symbol: crypto.symbol.toUpperCase() } }));
    if (comparisonMode) {
      if (!comparedIds.includes(crypto.id)) {
        if (comparedIds.length >= MAX_COMPARED_COINS) {
          setLimitNotice(true);
        } else {
          setLimitNotice(false);
          updateParams((p) => p.set('compare', [...comparedIds, crypto.id].join(',')));
        }
      }
    } else {
      updateParams((p) => p.set('coin', crypto.id));
    }
    setSearchQuery('');
    setShowResults(false);
  }

  function removeCrypto(id: string) {
    setLimitNotice(false);
    updateParams((p) => p.set('compare', comparedIds.filter((c) => c !== id).join(',')));
  }

  function setMode(compare: boolean) {
    updateParams((p) => {
      if (compare) {
        const initial = selectedId === 'bitcoin' ? DEFAULT_COMPARE : ['bitcoin', selectedId];
        p.set('compare', (compareParam.length ? compareParam : initial).join(','));
      } else {
        p.delete('compare');
      }
    });
  }

  function setDays(value: ChartPeriod) {
    updateParams((p) => p.set('days', String(value)));
  }

  // Colours are assigned by position so they stay stable as coins are added.
  const comparedCryptos = useMemo(
    () =>
      comparedIds.map((id, i) => ({
        id,
        ...nameFor(id),
        color: COMPARISON_COLORS[i % COMPARISON_COLORS.length],
      })),
    [comparedIds, nameFor]
  );

  const selected = nameFor(selectedId);

  const meta = PAGE_METADATA.charts;
  const chartsSchema = useMemo(
    () => [
      generateToolSchema({
        name: 'Cryptocurrency Price Charts',
        description: meta.description,
        url: '/charts',
      }),
      generateFAQSchema(CHARTS_FAQS),
    ],
    [meta.description]
  );

  return (
    <>
      <SEO
        title={meta.title}
        description={meta.description}
        keywords={meta.keywords}
        url="https://bitcoinvestments.net/charts"
        schema={chartsSchema}
      />
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Crypto Price Charts</h1>
          <p className="text-gray-300 leading-relaxed">
            Interactive price charts for any coin on CoinGecko, from 24 hours to 1 year. Use Comparison mode to put up
            to 8 coins on one chart and see which performed better over the same period, including each coin’s biggest
            drop from its peak.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Page content last reviewed {fmtStaticDate(PAGE_REVIEWED)}. Charts show past prices only and are not a forecast.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6" role="group" aria-label="Chart mode">
          <button
            type="button"
            onClick={() => setMode(false)}
            aria-pressed={!comparisonMode}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !comparisonMode ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Single Chart
          </button>
          <button
            type="button"
            onClick={() => setMode(true)}
            aria-pressed={comparisonMode}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              comparisonMode ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Comparison Mode
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <label htmlFor="chart-coin-search" className="block text-sm text-gray-400 mb-2">
            {comparisonMode
              ? `Add a coin to the comparison (${comparedIds.length} of ${MAX_COMPARED_COINS})`
              : 'Search for a coin to chart'}
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
            <input
              id="chart-coin-search"
              type="search"
              placeholder="Search cryptocurrencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setShowResults(false);
              }}
              aria-controls="chart-search-results"
              aria-expanded={showResults}
              autoComplete="off"
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
            />
            {comparisonMode && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 hidden sm:block" aria-hidden="true">
                <Plus className="w-4 h-4 inline mr-1" />
                Add to comparison
              </div>
            )}
          </div>
          <p className="sr-only" aria-live="polite">
            {searching ? 'Searching' : showResults ? `${searchResults.length} results` : ''}
          </p>
          {limitNotice && (
            <p className="text-sm text-amber-300 mt-2" role="status">
              You can compare up to {MAX_COMPARED_COINS} coins. Remove one to add another.
            </p>
          )}

          {/* Search Results Dropdown */}
          {showResults && (
            <div
              id="chart-search-results"
              className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-10 overflow-hidden"
            >
              {searchError ? (
                <p className="px-4 py-3 text-sm text-red-300" role="alert">{searchError}</p>
              ) : searchResults.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400">No coins found for “{searchQuery}”.</p>
              ) : (
                <ul>
                  {searchResults.map((result) => (
                    <li key={result.id}>
                      <button
                        type="button"
                        onClick={() => selectCrypto({ id: result.id, name: result.name, symbol: result.symbol })}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700/50 focus:bg-gray-700/50 transition-colors"
                      >
                        <img src={result.thumb} alt="" className="w-6 h-6 rounded-full" />
                        <span className="text-left">
                          <span className="block font-medium text-white">{result.name}</span>
                          <span className="block text-xs text-gray-400 uppercase">{result.symbol}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="sr-only">{comparisonMode ? 'Comparison chart' : `${selected.name} chart`}</h2>
            {comparisonMode ? (
              <ComparisonChart
                cryptocurrencies={comparedCryptos}
                days={days}
                onPeriodChange={setDays}
                height={450}
                onRemoveCrypto={removeCrypto}
              />
            ) : (
              <>
                <PriceChart
                  cryptocurrencyId={selectedId}
                  cryptocurrencyName={`${selected.name} (${selected.symbol})`}
                  days={days}
                  onPeriodChange={setDays}
                  height={450}
                  showVolume={true}
                />
                <p className="text-sm text-gray-400 mt-3">
                  {isCuratedCoin(selectedId) ? (
                    <>
                      Read our{' '}
                      <Link to={`/coin/${selectedId}`} className="text-brand-primary hover:underline">
                        {selected.name} guide and key stats
                      </Link>
                      .
                    </>
                  ) : (
                    <Link to={`/coin/${selectedId}`} className="text-brand-primary hover:underline">
                      {selected.name} market stats
                    </Link>
                  )}
                </p>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <section className="glass-card p-6" aria-labelledby="popular-heading">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-orange-500" aria-hidden="true" />
                <h2 id="popular-heading" className="text-lg font-bold text-white">Largest coins</h2>
              </div>
              <MarketDataStatus
                className="mb-3"
                fetchedAt={popularCryptos.length ? popularMeta?.fetchedAt : null}
                stale={popularMeta?.stale}
                error={popularError}
                onRetry={() => loadPopular(true)}
                retrying={popularLoading}
              />
              {popularLoading && popularCryptos.length === 0 ? (
                <div className="space-y-2" aria-busy="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <ul className="space-y-2">
                  {popularCryptos.map((crypto) => {
                    const active = comparisonMode ? comparedIds.includes(crypto.id) : selectedId === crypto.id;
                    return (
                      <li key={crypto.id} className="flex items-stretch gap-1">
                        <button
                          type="button"
                          onClick={() => selectCrypto({ id: crypto.id, name: crypto.name, symbol: crypto.symbol })}
                          aria-pressed={active}
                          aria-label={`${comparisonMode ? 'Add' : 'Chart'} ${crypto.name}`}
                          className={cn(
                            'flex-1 flex items-center justify-between p-3 rounded-lg transition-colors',
                            active ? 'bg-orange-500/20 border border-orange-500' : 'bg-gray-800/50 hover:bg-gray-700/50'
                          )}
                        >
                          <span className="flex items-center gap-3">
                            <img src={crypto.image} alt="" className="w-8 h-8 rounded-full" />
                            <span className="text-left">
                              <span className="block font-medium text-white text-sm">{crypto.name}</span>
                              <span className="block text-xs text-gray-400 uppercase">{crypto.symbol}</span>
                            </span>
                          </span>
                          <span className="text-right">
                            <span className="block font-medium text-white text-sm">{formatCryptoPrice(crypto.current_price)}</span>
                            <span
                              className={`block text-xs ${
                                (crypto.price_change_percentage_24h ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                              }`}
                            >
                              {fmtPct(crypto.price_change_percentage_24h)}
                            </span>
                          </span>
                        </button>
                        <Link
                          to={`/coin/${crypto.id}`}
                          className="flex items-center px-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white"
                          aria-label={`${crypto.name} profile and stats`}
                        >
                          <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>

        <section className="mt-12 glass-card p-6" aria-labelledby="read-charts-heading">
          <h2 id="read-charts-heading" className="text-xl font-bold text-white mb-4">How to read these charts</h2>
          <ul className="space-y-3 text-sm text-gray-300 list-disc pl-5">
            <li>
              <strong className="text-white">Line colour (single chart):</strong> green when the price is higher at the end of
              the period than at the start, red when it is lower.
            </li>
            <li>
              <strong className="text-white">% change view (comparison):</strong> each line shows how far a coin has moved from
              its own starting price, so a $0.10 coin and a $60,000 coin can be compared fairly.
            </li>
            <li>
              <strong className="text-white">Volume bars:</strong> the value traded over the previous 24 hours at each point.
              Price moves on low volume are easier to reverse.
            </li>
            <li>
              <strong className="text-white">Max drawdown:</strong> the worst peak-to-trough fall inside the period, a quick
              measure of how rough the ride was.
            </li>
          </ul>
          <p className="text-sm text-gray-400 mt-4">
            Want to see how regular buying would have worked over the same period? Try the{' '}
            <Link to="/calculators" className="text-brand-primary hover:underline">DCA calculator</Link> or browse{' '}
            <Link to="/dashboard" className="text-brand-primary hover:underline">today’s top 100 prices</Link>.
          </p>
        </section>

        <FAQSection title="Crypto charts: frequently asked questions" faqs={CHARTS_FAQS} />

        <div className="mt-12">
          <RelatedPages currentPath="/charts" title="More Analysis Tools" />
        </div>
      </div>
    </>
  );
}
