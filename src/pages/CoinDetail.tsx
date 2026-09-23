import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Activity,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { cn, formatCompactCurrency } from '../lib/utils';
import { PriceChart, MarketDataStatus } from '../components/charts';
import { SEO } from '../components/SEO';
import { FAQSection } from '../components/GEOContent';
import { NotFound } from './NotFound';
import {
  fetchCoinMarket,
  describeMarketError,
  CoinGeckoError,
} from '../services/coingecko';
import { getCoinProfile, type CoinProfile } from '../data/coins';
import { generateBreadcrumbSchema, generateFAQSchema, SEO_CONFIG } from '../lib/seo';
import {
  fmtPct,
  fmtRatioPct,
  fmtNumber,
  fmtUsd,
  fmtDate,
  fmtStaticDate,
  isNum,
} from '../lib/marketFormat';
import type { Cryptocurrency } from '../types';

const COIN_ID_RE = /^[a-z0-9][a-z0-9-]{0,99}$/;
/** Base title budget: SEO.tsx appends " | Bitcoinvestments" (19 chars). */
const MAX_TITLE = 41;

function titleFromId(id: string): string {
  return id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function coinLabel(name: string, symbol: string): string {
  return !symbol || name.toUpperCase() === symbol ? name : `${name} (${symbol})`;
}

function coinPageTitle(name: string, symbol: string, curated: boolean): string {
  const label = coinLabel(name, symbol);
  const candidates = [
    ...(curated ? [`${label} Price, Chart & Guide`] : []),
    `${label} Price & Chart`,
    `${name} Price & Chart`,
    `${name} Price`,
  ];
  return candidates.find((t) => t.length <= MAX_TITLE) ?? name.slice(0, MAX_TITLE);
}

function coinPageDescription(name: string, symbol: string, curated: boolean): string {
  const label = coinLabel(name, symbol);
  return curated
    ? `${label} price, chart and market cap, plus a plain-English guide to what it is, how its supply works, its key risks and common questions.`
    : `${label} price, 24h change, market cap, supply and all-time high and low, with a price chart. Market data from CoinGecko.`;
}

export function CoinDetail() {
  const { id: rawId = '' } = useParams<{ id: string }>();
  const id = rawId.toLowerCase();
  const validId = COIN_ID_RE.test(id);
  const profile = getCoinProfile(id);

  const [coin, setCoin] = useState<Cryptocurrency | null>(null);
  const [meta, setMeta] = useState<{ fetchedAt: number; stale: boolean } | null>(null);
  const [error, setError] = useState<CoinGeckoError | Error | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (force = false) => {
    if (!validId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCoinMarket(id, 'usd', { force });
      setCoin(result.data);
      setMeta({ fetchedAt: result.fetchedAt, stale: result.stale });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [id, validId]);

  useEffect(() => {
    setCoin(null);
    setMeta(null);
    load();
  }, [load]);

  const name = profile?.name ?? coin?.name ?? titleFromId(id);
  const symbol = (profile?.symbol ?? coin?.symbol ?? '').toUpperCase();
  const pageUrl = `${SEO_CONFIG.siteUrl}/coin/${id}`;

  const schema = useMemo(() => {
    if (!profile) return undefined;
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'Thing',
        '@id': `${pageUrl}#coin`,
        name: profile.name,
        alternateName: profile.symbol,
        description: profile.summary,
        url: pageUrl,
        sameAs: [profile.website],
      },
      generateFAQSchema(profile.faqs),
      generateBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Crypto prices', url: '/dashboard' },
        { name: profile.name, url: `/coin/${profile.id}` },
      ]),
    ];
  }, [profile, pageUrl]);

  const notFound =
    !validId || (!profile && error instanceof CoinGeckoError && error.kind === 'not_found');
  if (notFound) {
    return <NotFound />;
  }

  const errorMessage = error ? describeMarketError(error) : null;
  const priceChange = coin?.price_change_percentage_24h;

  return (
    <>
      <SEO
        title={coinPageTitle(name, symbol, !!profile)}
        description={coinPageDescription(name, symbol, !!profile)}
        keywords={[name, symbol, `${name} price`, `${symbol} price chart`, `what is ${name}`].filter(Boolean)}
        url={pageUrl}
        noindex={!profile}
        schema={schema}
      />
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start gap-4 mb-6">
          <div className="flex items-center gap-4">
            {coin?.image ? (
              <img src={coin.image} alt="" className="w-12 h-12 rounded-full" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/5" aria-hidden="true" />
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {name} {symbol && <span className="text-gray-400 text-2xl">({symbol})</span>}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {profile && (
                  <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">{profile.category}</span>
                )}
                {isNum(coin?.market_cap_rank) && (
                  <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">
                    Market cap rank #{coin.market_cap_rank}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="md:ml-auto text-left md:text-right min-h-[4rem]" aria-live="polite">
            {coin ? (
              <>
                <p className="text-3xl md:text-4xl font-bold text-white">{fmtUsd(coin.current_price)}</p>
                {isNum(priceChange) ? (
                  <div
                    className={cn(
                      'inline-flex items-center gap-1 text-lg font-medium mt-1',
                      priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                    )}
                  >
                    {priceChange >= 0 ? <TrendingUp className="w-5 h-5" aria-hidden="true" /> : <TrendingDown className="w-5 h-5" aria-hidden="true" />}
                    {fmtPct(priceChange)}
                    <span className="text-sm text-gray-500 ml-1">(24h)</span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">24h change unavailable</p>
                )}
              </>
            ) : loading ? (
              <div className="space-y-2 md:items-end flex flex-col" aria-busy="true">
                <div className="h-9 w-40 bg-white/5 rounded animate-pulse" />
                <div className="h-5 w-24 bg-white/5 rounded animate-pulse" />
              </div>
            ) : null}
          </div>
        </div>

        {/* Answer-first summary */}
        <div className="max-w-3xl mb-6">
          {profile ? (
            <>
              <p className="text-lg text-gray-200 leading-relaxed">{profile.summary}</p>
              <p className="text-xs text-gray-500 mt-2">
                Profile last verified {fmtStaticDate(profile.lastVerified)}. Live figures from CoinGecko. Not investment advice.
              </p>
            </>
          ) : (
            <p className="text-gray-300 leading-relaxed">
              Live market data for {name} from CoinGecko. We have not written a guide for this coin, so read the
              project&apos;s own documentation and our{' '}
              <Link to="/learn/risk-management" className="text-brand-primary hover:underline">risk guide</Link>{' '}
              before buying. Smaller coins are often far more volatile and easier to manipulate.
            </p>
          )}
        </div>

        <MarketDataStatus
          className="mb-6"
          fetchedAt={coin ? meta?.fetchedAt : null}
          stale={meta?.stale}
          error={
            errorMessage
              ? profile
                ? `Live ${name} market data is unavailable right now. ${errorMessage}`
                : errorMessage
              : null
          }
          onRetry={() => load(true)}
          retrying={loading}
        />

        {/* Price Chart */}
        <section className="mb-8" aria-labelledby="chart-heading">
          <h2 id="chart-heading" className="text-xl font-bold text-white mb-4">{name} price chart</h2>
          <PriceChart cryptocurrencyId={id} days={30} height={350} showVolume={true} />
        </section>

        {/* Key Stats */}
        {coin && (
          <section className="mb-8" aria-labelledby="stats-heading">
            <h2 id="stats-heading" className="text-xl font-bold text-white mb-4">{name} market stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  <p className="text-xs text-gray-400">Market Cap</p>
                </div>
                <p className="text-lg font-bold text-white">{formatCompactCurrency(coin.market_cap)}</p>
                {isNum(coin.market_cap_change_percentage_24h) && (
                  <p className={cn('text-xs', coin.market_cap_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400')}>
                    {fmtPct(coin.market_cap_change_percentage_24h)} 24h
                  </p>
                )}
              </div>

              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  <p className="text-xs text-gray-400">24h Volume</p>
                </div>
                <p className="text-lg font-bold text-white">{formatCompactCurrency(coin.total_volume)}</p>
                <p className="text-xs text-gray-500">Vol/MCap: {fmtRatioPct(coin.total_volume, coin.market_cap)}</p>
              </div>

              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" aria-hidden="true" />
                  <p className="text-xs text-gray-400">24h High</p>
                </div>
                <p className="text-lg font-bold text-white">{fmtUsd(coin.high_24h)}</p>
              </div>

              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-400" aria-hidden="true" />
                  <p className="text-xs text-gray-400">24h Low</p>
                </div>
                <p className="text-lg font-bold text-white">{fmtUsd(coin.low_24h)}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-4">Supply</h3>
                <SupplyTable coin={coin} symbol={symbol} />
              </div>

              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-4">All-time high and low</h3>
                <div className="space-y-4">
                  <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-4">
                    <p className="text-xs text-green-400 font-medium mb-1">All-time high</p>
                    <p className="text-xl font-bold text-white mb-1">{fmtUsd(coin.ath)}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-300">{fmtPct(coin.ath_change_percentage)} from ATH</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" aria-hidden="true" /> {fmtDate(coin.ath_date)}
                      </p>
                    </div>
                  </div>
                  <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-4">
                    <p className="text-xs text-red-400 font-medium mb-1">All-time low</p>
                    <p className="text-xl font-bold text-white mb-1">{fmtUsd(coin.atl)}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-300">{fmtPct(coin.atl_change_percentage)} from ATL</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" aria-hidden="true" /> {fmtDate(coin.atl_date)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {profile && <ProfileSections profile={profile} />}

        {/* Quick Action Links */}
        <section className="glass-card p-6 mt-8" aria-labelledby="tools-heading">
          <h2 id="tools-heading" className="text-lg font-bold text-white mb-4">Tools & resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ToolLink to="/calculators" icon={<DollarSign className="w-5 h-5 text-brand-primary" aria-hidden="true" />} title="DCA Calculator" subtitle="Model regular purchases" />
            <ToolLink
              to={`/charts?compare=${id === 'bitcoin' ? 'bitcoin,ethereum' : `bitcoin,${id}`}&days=365`}
              icon={<BarChart3 className="w-5 h-5 text-green-400" aria-hidden="true" />}
              title={id === 'bitcoin' ? 'Bitcoin vs Ethereum' : `${name} vs Bitcoin`}
              subtitle="1-year performance comparison"
            />
            <ToolLink to="/compare" icon={<Activity className="w-5 h-5 text-purple-400" aria-hidden="true" />} title="Compare Exchanges" subtitle="Fees and features side by side" />
          </div>
        </section>
      </div>
    </>
  );
}

function SupplyTable({ coin, symbol }: { coin: Cryptocurrency; symbol: string }) {
  const progress =
    isNum(coin.circulating_supply) && isNum(coin.max_supply) && coin.max_supply > 0
      ? (coin.circulating_supply / coin.max_supply) * 100
      : null;
  return (
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between py-2 border-b border-white/5">
        <dt className="text-gray-400">Circulating supply</dt>
        <dd className="text-white font-medium">{fmtNumber(coin.circulating_supply)} {symbol}</dd>
      </div>
      <div className="flex justify-between py-2 border-b border-white/5">
        <dt className="text-gray-400">Total supply</dt>
        <dd className="text-white font-medium">{isNum(coin.total_supply) ? `${fmtNumber(coin.total_supply)} ${symbol}` : '—'}</dd>
      </div>
      <div className="flex justify-between py-2 border-b border-white/5">
        <dt className="text-gray-400">Max supply</dt>
        <dd className="text-white font-medium">{isNum(coin.max_supply) ? `${fmtNumber(coin.max_supply)} ${symbol}` : 'No fixed maximum reported'}</dd>
      </div>
      {progress !== null && (
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <dt>Share of max supply in circulation</dt>
            <dd>{progress.toFixed(1)}%</dd>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden" aria-hidden="true">
            <div className="h-full bg-brand-primary rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        </div>
      )}
      <div className="flex justify-between py-2">
        <dt className="text-gray-400">Fully diluted valuation</dt>
        <dd className="text-white font-medium">{formatCompactCurrency(coin.fully_diluted_valuation)}</dd>
      </div>
    </dl>
  );
}

function ProfileSections({ profile }: { profile: CoinProfile }) {
  return (
    <>
      <section className="glass-card p-6 mb-8" aria-labelledby="what-is-heading">
        <h2 id="what-is-heading" className="text-xl font-bold text-white mb-4">What is {profile.name}?</h2>
        <div className="space-y-3 text-gray-300 leading-relaxed max-w-3xl">
          {profile.description.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        <h3 className="text-lg font-bold text-white mt-6 mb-3">Key facts</h3>
        <table className="w-full text-sm max-w-3xl">
          <tbody>
            {[
              ['Ticker', profile.symbol],
              ['Type', profile.category],
              ['Launched', profile.launched],
              ['Consensus', profile.consensus],
              ['Supply', profile.supply],
            ].map(([label, value]) => (
              <tr key={label} className="border-b border-white/5">
                <th scope="row" className="text-left text-gray-400 font-normal py-2 pr-4 align-top w-32">{label}</th>
                <td className="text-white py-2">{value}</td>
              </tr>
            ))}
            <tr>
              <th scope="row" className="text-left text-gray-400 font-normal py-2 pr-4 align-top">Official site</th>
              <td className="py-2">
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-brand-primary hover:underline"
                >
                  {profile.website.replace(/^https?:\/\//, '')}
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <section className="glass-card p-6" aria-labelledby="uses-heading">
          <h2 id="uses-heading" className="text-lg font-bold text-white mb-3">What {profile.symbol} is used for</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-300">
            {profile.useCases.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </section>
        <section className="glass-card p-6" aria-labelledby="risks-heading">
          <h2 id="risks-heading" className="text-lg font-bold text-white mb-3">Main risks</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-300">
            {profile.risks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mb-8" aria-labelledby="guides-heading">
        <h2 id="guides-heading" className="text-lg font-bold text-white mb-3">Related guides</h2>
        <ul className="flex flex-wrap gap-2">
          {profile.related.map((r) => (
            <li key={r.path}>
              <Link to={r.path} className="inline-block px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white">
                {r.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <FAQSection title={`${profile.name}: frequently asked questions`} faqs={profile.faqs} />
    </>
  );
}

function ToolLink({ to, icon, title, subtitle }: { to: string; icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
    >
      <span className="flex items-center gap-3">
        {icon}
        <span>
          <span className="block text-white font-medium text-sm">{title}</span>
          <span className="block text-xs text-gray-400">{subtitle}</span>
        </span>
      </span>
      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-primary transition-colors" aria-hidden="true" />
    </Link>
  );
}
