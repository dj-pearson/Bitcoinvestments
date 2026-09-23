/**
 * /defi-yield — DeFi yields (live from DefiLlama via /api/yields) plus an
 * inline impermanent-loss calculator and a plain-English explainer.
 *
 * The heading, summary, explainer, calculator and FAQ render from static
 * content on the first render; only the pool table depends on the fetch.
 */

import { useEffect, useMemo, useState } from 'react';
import { Percent, AlertTriangle, RefreshCw, Calculator } from 'lucide-react';
import { PageSEO } from '../components/PageSEO';
import {
  ExternalLink,
  FaqList,
  LastReviewed,
  RelatedLinks,
  type FaqItem,
} from '../components/ToolPageParts';
import { formatIsoDate } from '../lib/isoDate';
import {
  fetchYields,
  calculateImpermanentLoss,
  estimateImpermanentLoss,
  formatApy,
  formatAsOf,
  formatUsdCompact,
  IL_REFERENCE_MOVES,
  PROTOCOL_SITES,
  YIELD_CATEGORY_LABELS,
  type YieldCategory,
  type YieldsResponse,
} from '../services/defiYield';

const LAST_REVIEWED = '2026-09-23';

const FAQS: FaqItem[] = [
  {
    question: 'Where do the yields on this page come from?',
    answer:
      'From DefiLlama\'s free yields dataset. Our server fetches it, keeps well-known protocols on major chains with at least $10 million in deposits and major-asset or stablecoin pools, and caches the result for about an hour. The time of the snapshot is shown above the table. We do not edit or estimate any figure.',
  },
  {
    question: 'What is the difference between base APY and reward APY?',
    answer:
      'Base APY is paid by the activity itself: interest from borrowers in a lending market, or trading fees in a liquidity pool. Reward APY is extra yield paid in incentive tokens, which can stop at any time and whose value falls if the token price falls. A yield that is mostly rewards is less durable than one that is mostly base.',
  },
  {
    question: 'Why are some DeFi APYs so high?',
    answer:
      'High APYs usually come from token emissions (the protocol paying you in its own token), from compensating you for risk such as impermanent loss, depeg or smart-contract risk, or from a short burst of borrowing demand. Very high numbers are rarely sustainable; compare the current APY with the 30-day average in the table.',
  },
  {
    question: 'What is impermanent loss?',
    answer:
      'When you provide two assets to a 50/50 liquidity pool and their prices move apart, the pool rebalances so you end up with more of the asset that fell and less of the one that rose. Compared with simply holding the two assets, you are worse off. At a 2x price move the gap is about 5.7%; at 5x it is about 25.5%. Trading fees can offset it, which the calculator on this page lets you test.',
  },
  {
    question: 'Is APY the same as APR?',
    answer:
      'No. APR is the simple annual rate; APY assumes the earnings are reinvested (compounded). DefiLlama reports APY. For low rates the difference is small; for high, frequently compounded rates APY can be noticeably larger than APR.',
  },
  {
    question: 'Is DeFi yield safe?',
    answer:
      'No yield is risk-free. DeFi adds smart-contract bugs, oracle failures, governance attacks, stablecoin depegs and, for pools, impermanent loss. Deposits are not insured by any government scheme. Large, long-running, audited protocols reduce but do not remove these risks.',
  },
];

const CATEGORY_FILTERS: Array<{ id: 'all' | YieldCategory; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'lending', label: 'Lending' },
  { id: 'liquid-staking', label: 'Liquid staking' },
  { id: 'savings', label: 'Savings rates' },
  { id: 'dex', label: 'DEX liquidity' },
  { id: 'yield', label: 'Yield vaults' },
];

type SortKey = 'tvl' | 'apy';

function YieldTable() {
  const [data, setData] = useState<YieldsResponse | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [category, setCategory] = useState<'all' | YieldCategory>('all');
  const [chain, setChain] = useState('all');
  const [stableOnly, setStableOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('tvl');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchYields(controller.signal)
      .then((res) => {
        setData(res);
        setStatus('ready');
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (import.meta.env.DEV) console.debug('Yield fetch failed', err);
        setStatus('error');
      });
    return () => controller.abort();
  }, [reloadKey]);

  const chains = useMemo(
    () => (data ? Array.from(new Set(data.pools.map((p) => p.chain))).sort() : []),
    [data]
  );
  const categoriesWithData = useMemo(
    () => new Set(data ? data.pools.map((p) => p.category) : []),
    [data]
  );

  const rows = useMemo(() => {
    if (!data) return [];
    return data.pools
      .filter((p) => category === 'all' || p.category === category)
      .filter((p) => chain === 'all' || p.chain === chain)
      .filter((p) => !stableOnly || p.stablecoin)
      .sort((a, b) => (sort === 'tvl' ? b.tvlUsd - a.tvlUsd : b.apy - a.apy))
      .slice(0, 60);
  }, [data, category, chain, stableOnly, sort]);

  if (status === 'error') {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-gray-800 dark:text-gray-200 space-y-2">
            <p className="font-semibold">Live yield data is unavailable right now.</p>
            <p>
              Rather than show estimates, we show nothing. You can check current rates directly on{' '}
              <ExternalLink href="https://defillama.com/yields">DefiLlama Yields</ExternalLink>. As a
              rough guide from our last review ({formatIsoDate(LAST_REVIEWED)}): ETH liquid-staking yields track
              Ethereum's staking reward rate and have sat in the low single digits; stablecoin supply
              rates on the largest lending markets are usually in the low-to-mid single digits in
              calm markets and jump when borrowing demand spikes; anything far above that is almost
              always paid in reward tokens or compensates you for extra risk.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatus('loading');
                setReloadKey((k) => k + 1);
              }}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" /> Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div role="group" aria-label="Pool type" className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.filter((c) => c.id === 'all' || !data || categoriesWithData.has(c.id)).map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={category === c.id}
              onClick={() => setCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                category === c.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div>
          <label htmlFor="yield-chain" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Chain
          </label>
          <select
            id="yield-chain"
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">All chains</option>
            {chains.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="yield-sort" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Sort by
          </label>
          <select
            id="yield-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="tvl">Deposits (TVL)</option>
            <option value="apy">APY</option>
          </select>
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={stableOnly}
            onChange={(e) => setStableOnly(e.target.checked)}
            className="rounded"
          />
          Stablecoin pools only
        </label>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3" aria-live="polite">
        {status === 'loading' && !data && 'Loading current yields…'}
        {data && (
          <>
            Source:{' '}
            <ExternalLink href={data.sourceUrl}>{data.source}</ExternalLink>, as of{' '}
            {formatAsOf(data.asOf)}. Showing {rows.length} of {data.pools.length} curated pools.
          </>
        )}
      </p>

      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <caption className="sr-only">DeFi pool yields from DefiLlama</caption>
          <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
            <tr>
              <th scope="col" className="text-left p-3 font-medium">Pool</th>
              <th scope="col" className="text-left p-3 font-medium">Protocol</th>
              <th scope="col" className="text-left p-3 font-medium">Chain</th>
              <th scope="col" className="text-right p-3 font-medium">APY</th>
              <th scope="col" className="text-right p-3 font-medium">Base / reward</th>
              <th scope="col" className="text-right p-3 font-medium">30-day avg</th>
              <th scope="col" className="text-right p-3 font-medium">TVL</th>
              <th scope="col" className="text-center p-3 font-medium">IL risk</th>
            </tr>
          </thead>
          <tbody>
            {status === 'loading' && !data &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                  <td colSpan={8} className="p-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </td>
                </tr>
              ))}
            {data && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-600 dark:text-gray-400">
                  No pools match these filters.
                </td>
              </tr>
            )}
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="p-3">
                  <ExternalLink href={p.url} className="font-medium text-gray-900 dark:text-white hover:underline">
                    {p.symbol}
                  </ExternalLink>
                  {p.poolMeta && <div className="text-xs text-gray-500 dark:text-gray-400">{p.poolMeta}</div>}
                  <div className="text-xs text-gray-500 dark:text-gray-400">{YIELD_CATEGORY_LABELS[p.category]}</div>
                </td>
                <td className="p-3 text-gray-800 dark:text-gray-200">
                  {PROTOCOL_SITES[p.project] ? (
                    <ExternalLink href={PROTOCOL_SITES[p.project]} className="hover:underline">
                      {p.projectName}
                    </ExternalLink>
                  ) : (
                    p.projectName
                  )}
                </td>
                <td className="p-3 text-gray-800 dark:text-gray-200">{p.chain}</td>
                <td className="p-3 text-right font-semibold text-green-700 dark:text-green-400">{formatApy(p.apy)}</td>
                <td className="p-3 text-right text-gray-700 dark:text-gray-300">
                  {formatApy(p.apyBase)} / {formatApy(p.apyReward)}
                </td>
                <td className="p-3 text-right text-gray-700 dark:text-gray-300">{formatApy(p.apyMean30d)}</td>
                <td className="p-3 text-right text-gray-700 dark:text-gray-300">{formatUsdCompact(p.tvlUsd)}</td>
                <td className="p-3 text-center text-gray-700 dark:text-gray-300">{p.ilRisk ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Pool names link to DefiLlama's page for that pool. "IL risk" is DefiLlama's flag for pools exposed to
        impermanent loss. Rates are variable and change every block; this is not a recommendation.
      </p>
    </div>
  );
}

function ImpermanentLossCalculator() {
  const [deposit, setDeposit] = useState(10000);
  const [priceChange, setPriceChange] = useState(50);
  const [fees, setFees] = useState(0);

  const result = calculateImpermanentLoss(deposit, priceChange, fees);
  const usd = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 space-y-4">
        <div>
          <label htmlFor="il-deposit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Deposit (USD, split 50/50)
          </label>
          <input
            id="il-deposit"
            type="number"
            min={0}
            value={deposit}
            onChange={(e) => setDeposit(Math.max(0, Number(e.target.value) || 0))}
            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="il-change" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Price change of one asset vs the other: {priceChange > 0 ? '+' : ''}
            {priceChange}%
          </label>
          <input
            id="il-change"
            type="range"
            min={-90}
            max={500}
            step={5}
            value={priceChange}
            onChange={(e) => setPriceChange(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="il-fees" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Trading fees earned over the period (USD, optional)
          </label>
          <input
            id="il-fees"
            type="number"
            min={0}
            value={fees}
            onChange={(e) => setFees(Math.max(0, Number(e.target.value) || 0))}
            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5" aria-live="polite">
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-600 dark:text-gray-400">Impermanent loss</dt>
            <dd className="text-2xl font-bold text-red-600 dark:text-red-400">{result.ilPercent.toFixed(2)}%</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600 dark:text-gray-400">Loss vs holding</dt>
            <dd className="text-2xl font-bold text-gray-900 dark:text-white">{usd(result.ilUsd)}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600 dark:text-gray-400">If you had just held</dt>
            <dd className="text-lg font-semibold text-gray-900 dark:text-white">{usd(result.hodlValue)}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-600 dark:text-gray-400">Value in the pool</dt>
            <dd className="text-lg font-semibold text-gray-900 dark:text-white">{usd(result.lpValue)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-sm text-gray-600 dark:text-gray-400">Pool + fees vs holding</dt>
            <dd className={`text-lg font-semibold ${result.netVsHodl >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {result.netVsHodl >= 0 ? '+' : ''}
              {usd(result.netVsHodl)}
            </dd>
          </div>
        </dl>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
          To break even with holding, fees need to cover about {result.breakevenFeePercent.toFixed(2)}% of your deposit.
          Assumes a standard 50/50 constant-product pool (Uniswap V2 style). Concentrated-liquidity positions
          (Uniswap V3/V4) earn more fees in range but suffer larger impermanent loss.
        </p>
      </div>

      <div className="lg:col-span-2 overflow-x-auto">
        <table className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <caption className="text-left text-sm text-gray-600 dark:text-gray-400 p-3">
            Impermanent loss by price move (50/50 pool, before fees)
          </caption>
          <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
            <tr>
              <th scope="col" className="text-left p-3 font-medium">Price move</th>
              {IL_REFERENCE_MOVES.map((m) => (
                <th key={m} scope="col" className="text-right p-3 font-medium">
                  {m > 0 ? '+' : ''}
                  {m}%
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-100 dark:border-gray-700">
              <th scope="row" className="text-left p-3 font-medium text-gray-800 dark:text-gray-200">Loss vs holding</th>
              {IL_REFERENCE_MOVES.map((m) => (
                <td key={m} className="text-right p-3 text-gray-800 dark:text-gray-200">
                  {estimateImpermanentLoss(m).toFixed(1)}%
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DeFiYieldPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <PageSEO
        pageKey="defiYield"
        urlPath="/defi-yield"
        isTool
        toolName="DeFi Yield Explorer and Impermanent Loss Calculator"
        faqs={FAQS}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Percent className="h-8 w-8 text-green-600" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              DeFi Yields and Impermanent Loss Calculator
            </h1>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-4xl mb-3">
            DeFi yields come from three places: interest paid by borrowers, trading fees paid by swappers, and
            reward tokens paid by protocols. The table below shows current rates for major assets on
            well-established protocols, sourced from DefiLlama; the calculator shows how much impermanent loss
            can eat into liquidity-pool returns.
          </p>
          <LastReviewed date={LAST_REVIEWED} />
        </header>

        <section aria-labelledby="yields-heading" className="mb-12">
          <h2 id="yields-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Current yields on major DeFi protocols
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-4xl">
            Curated to long-running lending markets, liquid-staking tokens, savings rates and DEX pools on
            Ethereum, the main Ethereum layer 2s, and a few other large chains, with at least $10 million
            deposited. Pools DefiLlama flags as statistical outliers are excluded.
          </p>
          <YieldTable />
        </section>

        <section aria-labelledby="why-heading" className="mb-12">
          <h2 id="why-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Where the yield comes from, and why some APYs are high
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Borrower interest (lending)</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Lenders earn what borrowers pay, minus a protocol cut. Rates follow a utilization curve: when most
                of a pool is borrowed, rates rise steeply to attract deposits. That is why stablecoin rates can
                jump for days during a bull market and fall back afterwards.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Trading fees (liquidity pools)</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Liquidity providers earn the swap fee on every trade (for example 0.05%, 0.3% or 1% on Uniswap,
                depending on the pool's fee tier). The fee is income for LPs, not a cost. The catch is impermanent
                loss when prices move, covered below.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Reward tokens (incentives)</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Protocols often pay extra in their own token to attract deposits. This is the "reward APY". It is
                paid in a volatile token, can be switched off by governance, and is the usual reason a pool shows
                a double-digit APY.
              </p>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <caption className="text-left text-sm text-gray-600 dark:text-gray-400 p-3">
                Main risks by strategy (qualitative)
              </caption>
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
                <tr>
                  <th scope="col" className="text-left p-3 font-medium">Strategy</th>
                  <th scope="col" className="text-left p-3 font-medium">Main risks</th>
                  <th scope="col" className="text-left p-3 font-medium">Impermanent loss</th>
                </tr>
              </thead>
              <tbody className="text-gray-800 dark:text-gray-200">
                <tr className="border-t border-gray-100 dark:border-gray-700">
                  <td className="p-3">Stablecoin lending</td>
                  <td className="p-3">Smart-contract bug, stablecoin depeg, bad debt from failed liquidations</td>
                  <td className="p-3">None</td>
                </tr>
                <tr className="border-t border-gray-100 dark:border-gray-700">
                  <td className="p-3">ETH liquid staking</td>
                  <td className="p-3">ETH price, validator slashing, token trading below ETH during stress</td>
                  <td className="p-3">None</td>
                </tr>
                <tr className="border-t border-gray-100 dark:border-gray-700">
                  <td className="p-3">Stablecoin-stablecoin pool</td>
                  <td className="p-3">Contract risk, one stablecoin depegging (you end up holding it)</td>
                  <td className="p-3">Low while pegs hold</td>
                </tr>
                <tr className="border-t border-gray-100 dark:border-gray-700">
                  <td className="p-3">Volatile pair pool (e.g. ETH-USDC)</td>
                  <td className="p-3">Price risk of the volatile asset, contract risk</td>
                  <td className="p-3">Yes, grows with the price move</td>
                </tr>
                <tr className="border-t border-gray-100 dark:border-gray-700">
                  <td className="p-3">Incentive farms / vaults</td>
                  <td className="p-3">Reward token price, several stacked contracts, incentives ending</td>
                  <td className="p-3">Depends on the underlying pool</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="il-heading" className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-6 h-6 text-blue-600" aria-hidden="true" />
            <h2 id="il-heading" className="text-2xl font-bold text-gray-900 dark:text-white">
              Impermanent loss calculator
            </h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-4xl">
            Impermanent loss is how much less a 50/50 liquidity position is worth than simply holding the same
            two assets, after their prices move apart. It depends only on the size of the move, not its
            direction, and becomes permanent when you withdraw.
          </p>
          <ImpermanentLossCalculator />
        </section>

        <FaqList faqs={FAQS} />

        <RelatedLinks
          links={[
            { to: '/learn/yield-farming', label: 'Yield farming guide', note: 'How farms and vaults work' },
            { to: '/learn/defi-risks', label: 'DeFi risks', note: 'What can go wrong and how to limit it' },
            { to: '/learn/defi-basics', label: 'DeFi basics', note: 'Start here if DeFi is new to you' },
            { to: '/lending', label: 'Crypto lending rates', note: 'DeFi vs CeFi lending, and what failed in 2022' },
            { to: '/staking-calculator', label: 'Staking calculator', note: 'Project staking rewards' },
            { to: '/gas-optimizer', label: 'Gas fee tracker', note: 'What a DeFi transaction costs right now' },
          ]}
        />

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-10">
          Educational information only, not financial advice. Links to protocols are plain links; we do not earn a
          commission from them. Yields are variable and past rates do not predict future ones.
        </p>
      </div>
    </div>
  );
}
