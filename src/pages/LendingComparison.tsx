/**
 * /lending — CeFi vs DeFi crypto lending, with live DeFi supply/borrow rates
 * from DefiLlama (via /api/yields), the 2022 CeFi collapse lessons, a
 * liquidation calculator, and dated notes on CeFi platforms.
 *
 * Everything except the rate table renders from static data on the first
 * render.
 */

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Landmark, RefreshCw, ShieldAlert } from 'lucide-react';
import { PageSEO } from '../components/PageSEO';
import {
  ExternalLink,
  FaqList,
  LastReviewed,
  RelatedLinks,
} from '../components/ToolPageParts';
import { formatIsoDate } from '../lib/isoDate';
import {
  CEFI_COLLAPSES,
  CEFI_LESSONS,
  CEFI_PLATFORMS,
  DEFI_LENDING_PROTOCOLS,
  LENDING_FAQS,
  LENDING_LAST_REVIEWED,
  STABLECOINS,
} from '../data/lendingPlatforms';
import {
  fetchYields,
  formatApy,
  formatAsOf,
  formatUsdCompact,
  type YieldsResponse,
} from '../services/defiYield';
import {
  LENDING_ASSET_GROUPS,
  borrowApy,
  calculateLiquidation,
  protocolNameForSlug,
  protocolUrlForSlug,
  selectLendingPools,
  utilizationPercent,
} from '../services/lendingComparison';

const card = 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg';

function DeFiRates() {
  const [data, setData] = useState<YieldsResponse | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [groupId, setGroupId] = useState(LENDING_ASSET_GROUPS[0].id);
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
        if (import.meta.env.DEV) console.debug('Lending rates fetch failed', err);
        setStatus('error');
      });
    return () => controller.abort();
  }, [reloadKey]);

  const group = LENDING_ASSET_GROUPS.find((g) => g.id === groupId) ?? LENDING_ASSET_GROUPS[0];
  const rows = useMemo(() => (data ? selectLendingPools(data.pools, group) : []), [data, group]);
  const anyBorrow = rows.some((r) => borrowApy(r) !== null);

  return (
    <div>
      <div role="group" aria-label="Asset" className="flex flex-wrap gap-2 mb-4">
        {LENDING_ASSET_GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            aria-pressed={groupId === g.id}
            onClick={() => setGroupId(g.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              groupId === g.id
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {status === 'error' ? (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-5 text-gray-800 dark:text-gray-200 space-y-2">
          <p className="font-semibold">Live lending rates are unavailable right now.</p>
          <p>
            We would rather show nothing than a stale or estimated number. Current rates are published on each
            protocol's app and on{' '}
            <ExternalLink href="https://defillama.com/yields?category=Lending">DefiLlama</ExternalLink>. In calm markets,
            stablecoin supply rates on the largest markets have usually been in the low-to-mid single digits (as of
            our last review, {formatIsoDate(LENDING_LAST_REVIEWED)}), rising sharply when borrowing demand spikes.
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
      ) : (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3" aria-live="polite">
            {!data && 'Loading current lending rates…'}
            {data && (
              <>
                Source: <ExternalLink href={data.sourceUrl}>{data.source}</ExternalLink>, as of {formatAsOf(data.asOf)}.
                Largest {group.label} supply markets first.
              </>
            )}
          </p>
          <div className={`overflow-x-auto ${card}`}>
            <table className="w-full text-sm">
              <caption className="sr-only">DeFi lending rates for {group.label}</caption>
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
                <tr>
                  <th scope="col" className="text-left p-3 font-medium">Protocol</th>
                  <th scope="col" className="text-left p-3 font-medium">Chain / market</th>
                  <th scope="col" className="text-right p-3 font-medium">Supply APY</th>
                  <th scope="col" className="text-right p-3 font-medium">of which rewards</th>
                  {anyBorrow && <th scope="col" className="text-right p-3 font-medium">Borrow APY</th>}
                  {anyBorrow && <th scope="col" className="text-right p-3 font-medium">Utilization</th>}
                  <th scope="col" className="text-right p-3 font-medium">Supplied (TVL)</th>
                  <th scope="col" className="text-right p-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="text-gray-800 dark:text-gray-200">
                {!data &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                      <td colSpan={8} className="p-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))}
                {data && rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-gray-600 dark:text-gray-400">
                      No {group.label} markets in the current snapshot met our filters (tracked protocols, at least $10M
                      supplied).
                    </td>
                  </tr>
                )}
                {rows.map((p) => {
                  const util = utilizationPercent(p);
                  const site = protocolUrlForSlug(p.project);
                  return (
                    <tr key={p.id} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="p-3 font-medium">
                        {site ? (
                          <ExternalLink href={site} className="text-gray-900 dark:text-white hover:underline">
                            {protocolNameForSlug(p.project) ?? p.projectName}
                          </ExternalLink>
                        ) : (
                          p.projectName
                        )}
                      </td>
                      <td className="p-3">
                        {p.chain}
                        {p.poolMeta && <div className="text-xs text-gray-500 dark:text-gray-400">{p.poolMeta}</div>}
                        {p.symbol !== group.symbols[0] && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{p.symbol}</div>
                        )}
                      </td>
                      <td className="p-3 text-right font-semibold text-green-700 dark:text-green-400">{formatApy(p.apy)}</td>
                      <td className="p-3 text-right">{p.apyReward ? formatApy(p.apyReward) : '0.00%'}</td>
                      {anyBorrow && <td className="p-3 text-right">{formatApy(borrowApy(p))}</td>}
                      {anyBorrow && <td className="p-3 text-right">{util === null ? 'n/a' : `${util.toFixed(0)}%`}</td>}
                      <td className="p-3 text-right">{formatUsdCompact(p.tvlUsd)}</td>
                      <td className="p-3 text-right">
                        <ExternalLink href={p.url}>DefiLlama</ExternalLink>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Variable rates that change every block. Supply APY includes reward-token incentives where shown; those can
            end at any time. Morpho rows are curated vaults whose risk depends on the curator. Not a recommendation.
          </p>
        </>
      )}
    </div>
  );
}

function LiquidationCalculator() {
  const [collateral, setCollateral] = useState(10000);
  const [debt, setDebt] = useState(4000);
  const [threshold, setThreshold] = useState(80);
  const result = calculateLiquidation(collateral, debt, threshold);

  const input =
    'w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className={`${card} p-5 space-y-4`}>
        <div>
          <label htmlFor="liq-collateral" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Collateral value (USD)
          </label>
          <input id="liq-collateral" type="number" min={0} value={collateral} className={input}
            onChange={(e) => setCollateral(Math.max(0, Number(e.target.value) || 0))} />
        </div>
        <div>
          <label htmlFor="liq-debt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Amount borrowed (USD, stablecoin)
          </label>
          <input id="liq-debt" type="number" min={0} value={debt} className={input}
            onChange={(e) => setDebt(Math.max(0, Number(e.target.value) || 0))} />
        </div>
        <div>
          <label htmlFor="liq-threshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Liquidation threshold (%)
          </label>
          <input id="liq-threshold" type="number" min={1} max={99} value={threshold} className={input}
            onChange={(e) => setThreshold(Math.min(99, Math.max(1, Number(e.target.value) || 0)))} />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Each market publishes its own threshold per collateral asset; check it in the protocol's app.
          </p>
        </div>
      </div>
      <div className={`${card} p-5`} aria-live="polite">
        {result ? (
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-600 dark:text-gray-400">Loan-to-value</dt>
              <dd className="text-2xl font-bold text-gray-900 dark:text-white">{result.ltvPercent.toFixed(1)}%</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 dark:text-gray-400">Health factor</dt>
              <dd className={`text-2xl font-bold ${result.healthFactor < 1.2 ? 'text-red-600 dark:text-red-400' : result.healthFactor < 1.5 ? 'text-amber-600 dark:text-amber-400' : 'text-green-700 dark:text-green-400'}`}>
                {result.healthFactor.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 dark:text-gray-400">Collateral price drop before liquidation</dt>
              <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                {result.healthFactor <= 1 ? 'Liquidatable now' : `${result.dropToLiquidationPercent.toFixed(1)}%`}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">Enter a collateral value and a borrowed amount.</p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Health factor = collateral × liquidation threshold ÷ debt. Below 1.0 the position can be liquidated. Interest
          accrues on the debt over time, which slowly lowers the health factor.
        </p>
      </div>
    </div>
  );
}

export default function LendingComparison() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <PageSEO
        pageKey="lending"
        urlPath="/lending"
        isTool
        toolName="Crypto Lending Rate Comparison"
        faqs={LENDING_FAQS}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Landmark className="h-8 w-8 text-blue-600" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Crypto Lending Rates: CeFi vs DeFi</h1>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-4xl mb-3">
            DeFi lending protocols such as Aave and Compound pay variable, market-set rates from borrowers, and every
            loan is visible on-chain. CeFi lenders are companies that set their own rates and lend your coins out on
            terms you cannot see. Celsius, Voyager, BlockFi and Genesis froze withdrawals in 2022 and then filed for
            bankruptcy, and none of those deposits were FDIC insured. Below are current DeFi rates from DefiLlama and what to check
            before lending anywhere.
          </p>
          <LastReviewed date={LENDING_LAST_REVIEWED} />
        </header>

        <section aria-labelledby="rates-heading" className="mb-12">
          <h2 id="rates-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Current DeFi lending rates
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-4xl">
            Supply rates on {DEFI_LENDING_PROTOCOLS.map((p) => p.name).join(', ')} markets with at least $10 million
            supplied. The supply APY is what depositors earn; the borrow APY is what borrowers pay.
          </p>
          <DeFiRates />
        </section>

        <section aria-labelledby="cefi-defi-heading" className="mb-12">
          <h2 id="cefi-defi-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            CeFi vs DeFi lending at a glance
          </h2>
          <div className="overflow-x-auto">
            <table className={`w-full text-sm ${card}`}>
              <caption className="sr-only">Comparison of centralized and decentralized crypto lending</caption>
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
                <tr>
                  <th scope="col" className="text-left p-3 font-medium"></th>
                  <th scope="col" className="text-left p-3 font-medium">CeFi (company)</th>
                  <th scope="col" className="text-left p-3 font-medium">DeFi (smart contract)</th>
                </tr>
              </thead>
              <tbody className="text-gray-800 dark:text-gray-200">
                {[
                  ['Who holds your coins', 'The company', 'A public smart contract; you keep your own wallet'],
                  ['Who sets the rate', 'The company, often tiered by loyalty or token holdings', 'Supply and demand, via a utilization curve'],
                  ['Where the money goes', 'Lent to borrowers the company chooses; usually not disclosed', 'Over-collateralized loans visible on-chain'],
                  ['Main risk', 'Company failure, withdrawal freezes, mismanagement', 'Smart-contract bugs, oracle failures, bad debt'],
                  ['If it fails', 'Bankruptcy court; you are an unsecured creditor', 'Losses fall on depositors of the affected market'],
                  ['Government deposit insurance', 'None', 'None'],
                  ['Account needed', 'Yes, with identity checks', 'No, just a self-custody wallet'],
                ].map(([k, c, d]) => (
                  <tr key={k} className="border-t border-gray-100 dark:border-gray-700">
                    <th scope="row" className="text-left p-3 font-medium">{k}</th>
                    <td className="p-3">{c}</td>
                    <td className="p-3">{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="collapse-heading" className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-6 h-6 text-red-600" aria-hidden="true" />
            <h2 id="collapse-heading" className="text-2xl font-bold text-gray-900 dark:text-white">
              What the 2022 CeFi lender collapses taught us
            </h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-4xl">
            Four of the biggest crypto lenders failed within about seven months. Each advertised steady yields, each
            froze withdrawals first, and each left customers waiting in bankruptcy court.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {CEFI_COLLAPSES.map((c) => (
              <article key={c.name} className={`${card} p-5`}>
                <h3 className="font-semibold text-gray-900 dark:text-white">{c.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Froze withdrawals {c.froze}; filed for bankruptcy {c.bankruptcy}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{c.summary}</p>
              </article>
            ))}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Lessons</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CEFI_LESSONS.map((l) => (
              <li key={l.title} className={`${card} p-4`}>
                <p className="font-semibold text-gray-900 dark:text-white mb-1">{l.title}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{l.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="protocols-heading" className="mb-12">
          <h2 id="protocols-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            The DeFi lending protocols we track
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEFI_LENDING_PROTOCOLS.map((p) => (
              <article key={p.name} className={`${card} p-5`}>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  <ExternalLink href={p.url} className="hover:underline">{p.name}</ExternalLink>
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">{p.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="cefi-heading" className="mb-12">
          <h2 id="cefi-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            CeFi lenders still operating
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-4xl">
            We list only facts we can date and source. CeFi rates are set by the company and usually depend on loyalty
            tiers, so we do not quote them.
          </p>
          {CEFI_PLATFORMS.map((p) => (
            <article key={p.name} className={`${card} p-5 mb-4`}>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                <ExternalLink href={p.url} className="hover:underline">{p.name}</ExternalLink>
              </h3>
              <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1 mb-3">
                {p.facts.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <p className="text-sm text-gray-700 dark:text-gray-300"><strong>US availability:</strong> {p.usAvailability}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Rates:</strong> {p.rates}</p>
            </article>
          ))}
        </section>

        <section aria-labelledby="borrow-heading" className="mb-12">
          <h2 id="borrow-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Borrowing: LTV, health factor and liquidation
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-4xl">
            Crypto loans are over-collateralized: you deposit more than you borrow. If the collateral's value falls far
            enough, the loan is liquidated and you lose part of the collateral plus a penalty. Try your own numbers:
          </p>
          <LiquidationCalculator />
        </section>

        <section aria-labelledby="stable-heading" className="mb-12">
          <h2 id="stable-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Which stablecoins people lend
          </h2>
          <ul className="space-y-2">
            {STABLECOINS.map((s) => (
              <li key={s.symbol} className={`${card} p-4 text-sm text-gray-700 dark:text-gray-300`}>
                <strong className="text-gray-900 dark:text-white">{s.symbol}</strong>
                {s.status === 'legacy' && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700">legacy, not recommended</span>
                )}
                <span className="block mt-1">{s.note}</span>
              </li>
            ))}
          </ul>
        </section>

        <FaqList faqs={LENDING_FAQS} />

        <RelatedLinks
          links={[
            { to: '/learn/defi-basics', label: 'DeFi basics', note: 'How lending protocols work' },
            { to: '/learn/defi-risks', label: 'DeFi risks', note: 'Smart-contract, oracle and depeg risk' },
            { to: '/defi-yield', label: 'DeFi yields', note: 'Staking, savings and liquidity-pool rates' },
            { to: '/staking-calculator', label: 'Staking calculator', note: 'Project staking rewards' },
            { to: '/gas-optimizer', label: 'Gas fee tracker', note: 'What a deposit or withdrawal costs' },
          ]}
        />

        <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 mt-10">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <p>
            Educational information only, not financial advice. Crypto lending can lose you some or all of your
            principal. Links on this page are plain links; we do not earn a commission from them.
          </p>
        </div>
      </div>
    </div>
  );
}
