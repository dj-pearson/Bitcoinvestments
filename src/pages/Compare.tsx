import { useRef, type KeyboardEvent } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Building2, Wallet as WalletIcon, ArrowRight, Check, X, Shield } from 'lucide-react';
import {
  exchanges,
  getExchangeById,
  getExchangesSortedBy,
  getBestExchangeFor,
  estimateBuyCost,
  EXCHANGES_LAST_VERIFIED,
  LEGACY_EXCHANGE_IDS,
  ORDER_BOOK_SPREAD_ASSUMPTION,
  type ExchangeUseCase,
} from '../data/exchanges';
import {
  wallets,
  getWalletById,
  getBestWalletFor,
  WALLETS_LAST_VERIFIED,
  type WalletUseCase,
} from '../data/wallets';
import { cn } from '../lib/utils';
import { PageSEO } from '../components/PageSEO';
import { generateBreadcrumbSchema } from '../components/SEO';
import { AffiliateDisclosureBanner, SponsoredBadge, OutboundLink } from '../components/AffiliateDisclosure';
import { FaqSection, VerifiedDate, type FaqItem } from '../components/compare/CompareBlocks';
import { itemListSchema } from '../components/compare/schema';
import { formatIsoDate, formatMonthYear, pct, usd } from '../components/compare/compareUtils';
import { ExchangeDetail } from '../components/compare/ExchangeDetail';
import { WalletDetail } from '../components/compare/WalletDetail';
import { NotFound } from './NotFound';
import type { Exchange, Wallet } from '../types';

type CompareTab = 'exchanges' | 'wallets';
type ExchangeSort = 'score' | 'cost1000' | 'cost100' | 'fees';
type WalletFilter = 'all' | 'hardware' | 'software' | 'mobile';

const EXCHANGE_SORTS: { value: ExchangeSort; label: string }[] = [
  { value: 'score', label: 'Our editorial score (high to low)' },
  { value: 'cost1000', label: 'Cost of a $1,000 buy (low to high)' },
  { value: 'cost100', label: 'Cost of a $100 buy (low to high)' },
  { value: 'fees', label: 'Taker fee (low to high)' },
];
const WALLET_FILTERS: WalletFilter[] = ['all', 'hardware', 'software', 'mobile'];

const LAST_VERIFIED =
  EXCHANGES_LAST_VERIFIED > WALLETS_LAST_VERIFIED ? EXCHANGES_LAST_VERIFIED : WALLETS_LAST_VERIFIED;

function parseTab(value: string | null | undefined): CompareTab | null {
  if (value === 'wallets' || value === 'wallet') return 'wallets';
  if (value === 'exchanges' || value === 'exchange') return 'exchanges';
  return null;
}

/**
 * Routes:
 *   /compare                      listing (?tab=wallets|exchanges, legacy ?type=)
 *   /compare/wallets|exchanges    listing with that tab (needs the `compare/:type` route)
 *   /compare/exchange/:id         exchange review
 *   /compare/wallet/:id           wallet review
 * Unknown types or ids render <NotFound/> (noindex).
 */
export function Compare() {
  const { type, id } = useParams<{ type?: string; id?: string }>();

  if (type && id) {
    if (type === 'exchange') {
      const merged = LEGACY_EXCHANGE_IDS[id];
      if (merged) return <Navigate to={`/compare/exchange/${merged}`} replace />;
      const exchange = getExchangeById(id);
      return exchange ? <ExchangeDetail key={exchange.id} exchange={exchange} /> : <NotFound />;
    }
    if (type === 'wallet') {
      const wallet = getWalletById(id);
      return wallet ? <WalletDetail key={wallet.id} wallet={wallet} /> : <NotFound />;
    }
    return <NotFound />;
  }

  if (type) {
    const pathTab = parseTab(type);
    return pathTab ? <CompareListing pathTab={pathTab} /> : <NotFound />;
  }

  return <CompareListing />;
}

function buildListingFaqs(): FaqItem[] {
  const cheapest = getExchangesSortedBy('buy_cost_1000', 'asc')[0];
  const priciest = getExchangesSortedBy('buy_cost_1000', 'desc')[0];
  const cheapCost = estimateBuyCost(cheapest, 1000);
  const priceyCost = estimateBuyCost(priciest, 1000);
  return [
    {
      question: 'What is the cheapest way to buy bitcoin?',
      answer: `In our ${formatMonthYear(EXCHANGES_LAST_VERIFIED)} model, a $1,000 market buy costs about ${usd(cheapCost.total)} on ${cheapest.name} and about ${usd(priceyCost.total)} on ${priciest.name}, once trading fees and spreads are included. Order-book exchanges with limit orders are usually cheapest; "commission-free" apps charge through the spread. Withdrawal network fees are extra everywhere.`,
    },
    {
      question: 'Which crypto exchange is best for beginners?',
      answer:
        'Coinbase is the simplest first purchase for most US beginners because it shows the full cost before you confirm. It is not the cheapest: once you are comfortable, a limit order on Coinbase Advanced or Kraken Pro costs less.',
    },
    {
      question: 'What is the difference between a hardware wallet and a software wallet?',
      answer:
        'A hardware wallet is a small device that keeps your private keys offline and signs transactions on its own screen, so malware on your computer cannot take your keys. A software wallet is an app on an internet-connected phone or computer: free and convenient, but more exposed. Many people use both: a software wallet for small amounts and a hardware wallet for savings.',
    },
    {
      question: 'Are these fees up to date?',
      answer: `Every entry shows the date we last checked it (most recently ${formatIsoDate(LAST_VERIFIED)}) and links to the official fee page. Exchanges change fees often: Kraken changed its schedule on 2026-07-09 and Coinbase Advanced on 2026-09-16. Always confirm on the provider's site before you trade.`,
    },
    {
      question: 'Do sponsorships or affiliate links change the order?',
      answer:
        'No. Entries marked "Sponsored" are paid placements, but they appear wherever your chosen sort puts them and are not numbered as rankings. Our editorial score comes from the published methodology below, and affiliate links (where configured) do not change it.',
    },
    {
      question: 'Does Coinbase Pro still exist?',
      answer:
        'No. Coinbase Pro closed in 2023 and was replaced by Coinbase Advanced, which is part of the normal Coinbase account. We cover it on our Coinbase page.',
    },
    {
      question: 'Is the Trezor Model T discontinued?',
      answer:
        'Yes. Trezor removed the Model T and Model One from its shop on 2026-01-08. Both still receive security updates. The Trezor Safe 3, Safe 5 and Safe 7 are the current models.',
    },
  ];
}

function CompareListing({ pathTab }: { pathTab?: CompareTab }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const tab: CompareTab =
    pathTab ?? parseTab(searchParams.get('tab') ?? searchParams.get('type')) ?? 'exchanges';

  const sortParam = searchParams.get('sort') as ExchangeSort | null;
  const sort: ExchangeSort = EXCHANGE_SORTS.some(s => s.value === sortParam)
    ? (sortParam as ExchangeSort)
    : searchParams.get('filter') === 'fees'
      ? 'cost1000'
      : 'score';

  const walletParam = searchParams.get('wallet') as WalletFilter | null;
  const walletFilter: WalletFilter = walletParam && WALLET_FILTERS.includes(walletParam) ? walletParam : 'all';

  const updateParams = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    next.delete('type'); // legacy alias of `tab`
    next.delete('filter'); // legacy, folded into `sort`
    if (sort !== 'score' && !next.has('sort')) next.set('sort', sort);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    if (pathTab && !('tab' in changes)) next.set('tab', pathTab);
    if (pathTab) {
      navigate({ pathname: '/compare', search: `?${next.toString()}` }, { replace: true });
    } else {
      setSearchParams(next, { replace: true });
    }
  };

  const selectTab = (next: CompareTab) => updateParams({ tab: next });

  const tabRefs = useRef<Record<CompareTab, HTMLButtonElement | null>>({ exchanges: null, wallets: null });
  const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const next: CompareTab = tab === 'exchanges' ? 'wallets' : 'exchanges';
    selectTab(next);
    tabRefs.current[next]?.focus();
  };

  const faqs = buildListingFaqs();

  const schema = [
    itemListSchema(
      'Crypto exchanges compared',
      getExchangesSortedBy('trust_score', 'desc').map(e => ({ name: e.name, path: `/compare/exchange/${e.id}` }))
    ),
    itemListSchema(
      'Crypto wallets compared',
      wallets.map(w => ({ name: w.name, path: `/compare/wallet/${w.id}` }))
    ),
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Compare', url: '/compare' },
    ]),
  ];

  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      <PageSEO pageKey="compare" urlPath="/compare" faqs={faqs} customSchema={schema} />

      <header className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Best Crypto Exchanges &amp; Wallets <span className="text-gradient">Compared (2026)</span>
        </h1>
        <p className="text-gray-300 text-lg">
          For most US beginners, Coinbase is the easiest first buy, but it is not the cheapest: a
          limit order on an order-book exchange usually costs a fraction as much. For savings, move
          coins to a hardware wallet; the Trezor Safe 3 is our best-value pick. Below are the real
          costs of a $100 and $1,000 buy, current wallet lineups and how we score them.
        </p>
        <div className="mt-3">
          <VerifiedDate date={LAST_VERIFIED} />
        </div>
      </header>

      <BestForSummary />

      <AffiliateDisclosureBanner variant="prominent" />

      <section aria-label="Comparison tables">
        <div role="tablist" aria-label="Compare exchanges or wallets" className="flex justify-center gap-4 mb-8">
          {(['exchanges', 'wallets'] as const).map(t => (
            <button
              key={t}
              type="button"
              role="tab"
              id={`tab-${t}`}
              ref={el => { tabRefs.current[t] = el; }}
              aria-selected={tab === t}
              aria-controls={`panel-${t}`}
              tabIndex={tab === t ? 0 : -1}
              onClick={() => selectTab(t)}
              onKeyDown={onTabKeyDown}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all',
                tab === t ? 'bg-brand-primary text-white' : 'glass hover:bg-white/10 text-gray-300'
              )}
            >
              {t === 'exchanges' ? <Building2 className="w-5 h-5" aria-hidden="true" /> : <WalletIcon className="w-5 h-5" aria-hidden="true" />}
              {t === 'exchanges' ? 'Exchanges' : 'Wallets'}
            </button>
          ))}
        </div>

        {/* Both panels stay in the DOM (inactive one hidden) so crawlers and prerendering see all content. */}
        <div role="tabpanel" id="panel-exchanges" aria-labelledby="tab-exchanges" hidden={tab !== 'exchanges'}>
          <ExchangePanel sort={sort} onSortChange={value => updateParams({ sort: value === 'score' ? null : value })} />
        </div>
        <div role="tabpanel" id="panel-wallets" aria-labelledby="tab-wallets" hidden={tab !== 'wallets'}>
          <WalletPanel filter={walletFilter} onFilterChange={value => updateParams({ wallet: value === 'all' ? null : value })} />
        </div>
      </section>

      <FeeExamples />

      <Methodology />

      <FaqSection faqs={faqs} />

      <section aria-labelledby="related-heading" className="glass-card p-6">
        <h2 id="related-heading" className="text-xl font-bold text-white mb-3">Related guides and tools</h2>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm">
          <li><Link className="text-orange-400 hover:text-orange-300 underline" to="/hardware-wallet">Hardware wallet comparison: Ledger vs Trezor</Link></li>
          <li><Link className="text-orange-400 hover:text-orange-300 underline" to="/learn/crypto-wallets-explained">Crypto wallets explained</Link></li>
          <li><Link className="text-orange-400 hover:text-orange-300 underline" to="/learn/how-to-buy-crypto">How to buy crypto safely</Link></li>
          <li><Link className="text-orange-400 hover:text-orange-300 underline" to="/calculators">Fee and DCA calculators</Link></li>
          <li><Link className="text-orange-400 hover:text-orange-300 underline" to="/scam-database">Check a platform in the scam database</Link></li>
        </ul>
      </section>
    </div>
  );
}

const EXCHANGE_PICKS: { useCase: ExchangeUseCase; label: string }[] = [
  { useCase: 'beginner', label: 'Best for beginners' },
  { useCase: 'low_fees', label: 'Lowest cost ($1,000 buy)' },
  { useCase: 'security', label: 'Best security record' },
  { useCase: 'staking', label: 'Best for staking' },
  { useCase: 'stocks_and_crypto', label: 'Stocks and crypto in one app' },
];
const WALLET_PICKS: { useCase: WalletUseCase; label: string }[] = [
  { useCase: 'hardware_budget', label: 'Best-value hardware wallet' },
  { useCase: 'hardware_open_source', label: 'Best open-source touchscreen' },
  { useCase: 'hardware_mobile', label: 'Best hardware wallet for phones' },
  { useCase: 'beginner', label: 'Easiest software wallet' },
  { useCase: 'defi', label: 'Best for Ethereum DeFi' },
  { useCase: 'bitcoin', label: 'Best Bitcoin-only mobile wallet' },
];

function BestForSummary() {
  return (
    <section aria-labelledby="picks-heading" className="glass-card p-6">
      <h2 id="picks-heading" className="text-2xl font-bold text-white mb-1">Our picks at a glance</h2>
      <p className="text-sm text-gray-400 mb-5">
        Editorial picks from the data below, checked {formatIsoDate(LAST_VERIFIED)}. Sponsorship does not affect them.
      </p>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-orange-400" aria-hidden="true" /> Exchanges
          </h3>
          <ul className="space-y-3">
            {EXCHANGE_PICKS.map(({ useCase, label }) => {
              const pick = getBestExchangeFor(useCase);
              if (!pick) return null;
              return (
                <li key={useCase} className="text-sm">
                  <span className="text-gray-400">{label}: </span>
                  <Link to={`/compare/exchange/${pick.exchange.id}`} className="font-semibold text-orange-400 hover:text-orange-300 underline">
                    {pick.exchange.name}
                  </Link>
                  <span className="block text-gray-300">{pick.reason}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <WalletIcon className="w-4 h-4 text-orange-400" aria-hidden="true" /> Wallets
          </h3>
          <ul className="space-y-3">
            {WALLET_PICKS.map(({ useCase, label }) => {
              const pick = getBestWalletFor(useCase);
              if (!pick) return null;
              return (
                <li key={useCase} className="text-sm">
                  <span className="text-gray-400">{label}: </span>
                  <Link to={`/compare/wallet/${pick.wallet.id}`} className="font-semibold text-orange-400 hover:text-orange-300 underline">
                    {pick.wallet.name}
                  </Link>
                  <span className="block text-gray-300">{pick.reason}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

function sortExchanges(sort: ExchangeSort): Exchange[] {
  switch (sort) {
    case 'cost1000':
      return getExchangesSortedBy('buy_cost_1000', 'asc');
    case 'cost100':
      return getExchangesSortedBy('buy_cost_100', 'asc');
    case 'fees':
      return getExchangesSortedBy('fees', 'asc');
    case 'score':
    default:
      return getExchangesSortedBy('trust_score', 'desc');
  }
}

function ExchangePanel({ sort, onSortChange }: { sort: ExchangeSort; onSortChange: (s: ExchangeSort) => void }) {
  // The reader's sort is the only ordering. Sponsored entries are never moved.
  const sorted = sortExchanges(sort);
  // Positions count only non-sponsored entries: paid placements are never numbered.
  const ranks = new Map<string, number>();
  for (const e of sorted) {
    if (!e.sponsored?.is_sponsored) ranks.set(e.id, ranks.size + 1);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Crypto exchanges compared</h2>
          <p className="text-sm text-gray-400">{exchanges.length} US-available exchanges. Numbers show position in your chosen sort.</p>
        </div>
        <label className="flex flex-col text-sm text-gray-400 gap-1">
          Sort exchanges by
          <select
            value={sort}
            onChange={e => onSortChange(e.target.value as ExchangeSort)}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
          >
            {EXCHANGE_SORTS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      <ol className="grid gap-6">
        {sorted.map(exchange => {
          const sponsored = Boolean(exchange.sponsored?.is_sponsored);
          const rank = ranks.get(exchange.id);
          const cost1000 = estimateBuyCost(exchange, 1000);
          return (
            <li key={exchange.id} className={cn('glass-card p-6', sponsored && 'ring-1 ring-purple-500/40')}>
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex items-center gap-4">
                  {sponsored ? (
                    <SponsoredBadge />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold"
                      aria-label={`Position ${rank}`}
                    >
                      {rank}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-white">{exchange.name}</h3>
                    <p className="text-sm text-gray-400">{exchange.country} · Est. {exchange.year_established}</p>
                  </div>
                </div>

                <dl className="flex flex-wrap gap-6 lg:ml-auto">
                  <div className="text-center">
                    <dt className="text-xs text-gray-400">Our editorial score</dt>
                    <dd className="flex items-center gap-1 justify-center text-xl font-bold text-white">
                      <Shield className="w-4 h-4 text-green-400" aria-hidden="true" />
                      {exchange.trust_score}/10
                    </dd>
                  </div>
                  <div className="text-center">
                    <dt className="text-xs text-gray-400">Taker fee</dt>
                    <dd className="text-xl font-bold text-white">{pct(exchange.fees.taker_fee)}</dd>
                  </div>
                  <div className="text-center">
                    <dt className="text-xs text-gray-400">$1,000 buy costs</dt>
                    <dd className="text-xl font-bold text-white">{usd(cost1000.total)}</dd>
                  </div>
                  <div className="text-center">
                    <dt className="text-xs text-gray-400">Assets</dt>
                    <dd className="text-sm font-semibold text-white max-w-[9rem]">{exchange.assets_label}</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-sm text-gray-300 mb-3">
                  <span className="text-gray-400">Best for: </span>{exchange.best_for}
                </p>
                <ul className="flex flex-wrap gap-2 mb-4" aria-label="Features">
                  {exchange.features.staking && <li className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs">Staking</li>}
                  {exchange.features.margin_trading && <li className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs">Margin</li>}
                  {exchange.features.futures_trading && <li className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs">Futures</li>}
                  {exchange.features.debit_card && <li className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs">Debit card</li>}
                  {exchange.features.earn_program && <li className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-xs">Rewards/Earn</li>}
                  {exchange.mobile_app && <li className="px-3 py-1 rounded-full bg-gray-500/20 text-gray-300 text-xs">Mobile app</li>}
                </ul>

                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <VerifiedDate date={exchange.last_verified} />
                  <div className="flex flex-wrap items-center gap-3">
                    <OutboundLink
                      partnerId={exchange.affiliate_partner_id}
                      officialUrl={exchange.url}
                      name={exchange.name}
                      type="exchange"
                      className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 text-sm"
                    >
                      Visit {exchange.name}
                    </OutboundLink>
                    <Link
                      to={`/compare/exchange/${exchange.id}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white text-sm font-medium transition-colors"
                    >
                      {exchange.name} review <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function walletTypeClass(type: Wallet['type']) {
  return type === 'hardware'
    ? 'bg-orange-500/20 text-orange-300'
    : type === 'software'
      ? 'bg-blue-500/20 text-blue-300'
      : 'bg-green-500/20 text-green-300';
}

function WalletPanel({ filter, onFilterChange }: { filter: WalletFilter; onFilterChange: (f: WalletFilter) => void }) {
  const filtered = wallets
    .filter(w => filter === 'all' || w.type === filter)
    // Current products first; discontinued ones stay listed for owners.
    .sort((a, b) => Number(a.status === 'discontinued') - Number(b.status === 'discontinued'));

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Crypto wallets compared</h2>
        <p className="text-sm text-gray-400">
          Hardware prices are US list prices. For a full Ledger vs Trezor spec table see our{' '}
          <Link to="/hardware-wallet" className="text-orange-400 hover:text-orange-300 underline">hardware wallet comparison</Link>.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filter wallets by type">
        {WALLET_FILTERS.map(type => (
          <button
            key={type}
            type="button"
            aria-pressed={filter === type}
            onClick={() => onFilterChange(type)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              filter === type ? 'bg-brand-primary text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
            )}
          >
            {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(wallet => (
          <li key={wallet.id} className={cn('glass-card p-6 flex flex-col', wallet.status === 'discontinued' && 'opacity-80')}>
            <div className="flex items-start justify-between mb-3 gap-2">
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className={cn('px-2 py-1 rounded text-xs font-medium', walletTypeClass(wallet.type))}>
                    {wallet.type.toUpperCase()}
                  </span>
                  {wallet.status === 'discontinued' && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-300">DISCONTINUED</span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white">{wallet.name}</h3>
              </div>
              {wallet.price ? (
                <span className="text-right">
                  <span className="block text-lg font-bold text-brand-primary">${wallet.price}</span>
                  <span className="block text-[11px] text-gray-500">{wallet.status === 'discontinued' ? 'last list price' : 'list price'}</span>
                </span>
              ) : (
                <span className="text-sm text-green-400">Free</span>
              )}
            </div>

            <p className="text-gray-400 text-sm mb-4 flex-grow">{wallet.best_for}</p>

            <dl className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div>
                <dt className="text-xs text-gray-400">Assets</dt>
                <dd className="text-white">{wallet.assets_label}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">Ease of use (editorial)</dt>
                <dd className="text-white">{wallet.ease_of_use}/10</dd>
              </div>
            </dl>

            <ul className="flex flex-wrap gap-3 mb-4 text-xs text-gray-300" aria-label="Security">
              <li className="flex items-center gap-1">
                {wallet.security_features.open_source ? <Check className="w-3 h-3 text-green-400" aria-hidden="true" /> : <X className="w-3 h-3 text-red-400" aria-hidden="true" />}
                {wallet.security_features.open_source ? 'Open source' : 'Closed source'}
              </li>
              {wallet.type === 'hardware' && (
                <li className="flex items-center gap-1">
                  {wallet.security_features.secure_element ? <Check className="w-3 h-3 text-green-400" aria-hidden="true" /> : <X className="w-3 h-3 text-red-400" aria-hidden="true" />}
                  {wallet.security_features.secure_element ? 'Secure element' : 'No secure element'}
                </li>
              )}
            </ul>

            <VerifiedDate date={wallet.last_verified} className="mb-4" />

            <div className="flex flex-wrap items-center gap-2 mt-auto pt-4 border-t border-white/10">
              <Link
                to={`/compare/wallet/${wallet.id}`}
                className="flex-1 text-center py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white text-sm font-medium transition-colors"
              >
                {wallet.name} review
              </Link>
              <OutboundLink
                partnerId={wallet.affiliate_partner_id}
                officialUrl={wallet.url}
                name={wallet.name}
                type="wallet"
                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 text-sm"
              >
                Official site
              </OutboundLink>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeeExamples() {
  const rows = getExchangesSortedBy('buy_cost_1000', 'asc');
  return (
    <section aria-labelledby="fee-examples-heading" className="glass-card p-6">
      <h2 id="fee-examples-heading" className="text-2xl font-bold text-white mb-2">
        What a $100 and a $1,000 bitcoin buy really cost
      </h2>
      <p className="text-sm text-gray-300 mb-4">
        Worked examples for a market buy of BTC with USD, including the trading fee <em>and</em> the
        spread (the gap between the price you pay and the market price). &quot;Commission-free&quot;
        apps are not free: their cost is in the spread. Withdrawal network fees are extra on every
        platform.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <caption className="sr-only">Modelled cost of buying $100 and $1,000 of bitcoin on each exchange</caption>
          <thead>
            <tr className="border-b border-white/10 text-gray-400">
              <th scope="col" className="py-2 pr-4 font-medium">Exchange</th>
              <th scope="col" className="py-2 pr-4 font-medium">How the buy is priced</th>
              <th scope="col" className="py-2 pr-4 font-medium">Fee</th>
              <th scope="col" className="py-2 pr-4 font-medium">Spread</th>
              <th scope="col" className="py-2 pr-4 font-medium">$100 buy</th>
              <th scope="col" className="py-2 font-medium">$1,000 buy</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(exchange => {
              const c100 = estimateBuyCost(exchange, 100);
              const c1000 = estimateBuyCost(exchange, 1000);
              return (
                <tr key={exchange.id} className="border-b border-white/5 align-top">
                  <th scope="row" className="py-2 pr-4 text-white font-semibold">
                    <Link to={`/compare/exchange/${exchange.id}`} className="hover:text-orange-300 underline">{exchange.name}</Link>
                  </th>
                  <td className="py-2 pr-4 text-gray-300">{exchange.buy_cost.label}</td>
                  <td className="py-2 pr-4 text-gray-300">
                    {pct(exchange.buy_cost.fee_pct)}
                    {exchange.buy_cost.flat_fee && ` + $${exchange.buy_cost.flat_fee.amount} under $${exchange.buy_cost.flat_fee.below}`}
                  </td>
                  <td className="py-2 pr-4 text-gray-300">~{pct(exchange.buy_cost.spread_pct)}</td>
                  <td className="py-2 pr-4 text-white">{usd(c100.total)}</td>
                  <td className="py-2 text-white">{usd(c1000.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="mt-4 space-y-1 text-xs text-gray-400 list-disc pl-5">
        <li>
          Order-book exchanges (Kraken Pro, Binance.US, Gemini ActiveTrader, Crypto.com Exchange) use the
          entry-tier taker fee plus an assumed {pct(ORDER_BOOK_SPREAD_ASSUMPTION)} spread for a BTC/USD
          market order. A limit order pays the lower maker fee and usually no spread.
        </li>
        <li>Spread-based apps (Coinbase simple buy, Robinhood, Uphold) use the typical spreads publicly reported in 2026; the real spread moves with the market.</li>
        <li>Figures checked {formatIsoDate(EXCHANGES_LAST_VERIFIED)}. Each exchange review links to the official fee page; confirm there before trading.</li>
      </ul>
    </section>
  );
}

function Methodology() {
  const rows = getExchangesSortedBy('trust_score', 'desc');
  return (
    <section aria-labelledby="methodology-heading" className="glass-card p-6">
      <h2 id="methodology-heading" className="text-2xl font-bold text-white mb-2">How we score exchanges</h2>
      <p className="text-sm text-gray-300 mb-3">
        &quot;Our editorial score&quot; is a judgement by our editors, not a user rating, out of 10:
      </p>
      <ul className="text-sm text-gray-300 space-y-1 list-disc pl-5 mb-4">
        <li><strong className="text-white">Regulation (0–3):</strong> licences, public listing and disclosures, enforcement history.</li>
        <li><strong className="text-white">Security (0–3):</strong> hacks, breaches and how customers were treated afterwards.</li>
        <li><strong className="text-white">Transparency (0–2):</strong> proof of reserves, audited or public financials.</li>
        <li><strong className="text-white">Cost clarity (0–2):</strong> published fees versus costs hidden in spreads.</li>
      </ul>
      <p className="text-sm text-gray-300 mb-4">
        Sponsorship and affiliate relationships do not change scores or the order of any sort. We do not
        show star ratings or review counts until readers have actually submitted reviews.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <caption className="sr-only">Editorial score breakdown per exchange</caption>
          <thead>
            <tr className="border-b border-white/10 text-gray-400">
              <th scope="col" className="py-2 pr-4 font-medium">Exchange</th>
              <th scope="col" className="py-2 pr-4 font-medium">Regulation</th>
              <th scope="col" className="py-2 pr-4 font-medium">Security</th>
              <th scope="col" className="py-2 pr-4 font-medium">Transparency</th>
              <th scope="col" className="py-2 pr-4 font-medium">Cost clarity</th>
              <th scope="col" className="py-2 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(e => (
              <tr key={e.id} className="border-b border-white/5">
                <th scope="row" className="py-2 pr-4 text-white font-semibold">{e.name}</th>
                <td className="py-2 pr-4 text-gray-300">{e.editorial.regulation}/3</td>
                <td className="py-2 pr-4 text-gray-300">{e.editorial.security}/3</td>
                <td className="py-2 pr-4 text-gray-300">{e.editorial.transparency}/2</td>
                <td className="py-2 pr-4 text-gray-300">{e.editorial.costs}/2</td>
                <td className="py-2 text-white font-semibold">{e.trust_score}/10</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
