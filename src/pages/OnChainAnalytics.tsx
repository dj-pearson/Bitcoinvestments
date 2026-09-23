/**
 * /onchain-analytics
 *
 * Bitcoin on-chain metrics explained, with live values from free public
 * sources (mempool.space and Blockchain.com Charts) served through the
 * same-origin, edge-cached /api/onchain function.
 *
 * Static baseline: H1, summary, every metric's explanation and the FAQ render
 * on the first render. Live values fill in after load; a source that fails is
 * shown as unavailable. No synthetic or sample numbers are ever displayed.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Database, RefreshCw } from 'lucide-react';
import { PageSEO } from '../components/PageSEO';
import {
  ExternalLink,
  FaqSection,
  LastUpdated,
  NotAdviceNote,
  RelatedLinks,
  Section,
  Sparkline,
  type FaqItem,
} from '../components/analytics/PageParts';
import {
  fetchOnchainSnapshot,
  formatDateTime,
  formatHashrate,
  formatLargeNumber,
  satsToBtc,
  seriesChangePercent,
  type Metric,
  type OnchainSnapshot,
} from '../services/onchainPublic';

const LAST_UPDATED = '2026-09-23';

const FAQS: FaqItem[] = [
  {
    question: 'What is on-chain analysis?',
    answer:
      'On-chain analysis is reading data that is recorded publicly on a blockchain, such as transactions, fees, addresses and mining difficulty, to understand how a network is being used. For Bitcoin, anyone can verify this data by running a node or using a block explorer like mempool.space.',
  },
  {
    question: 'What does Bitcoin hashrate tell you?',
    answer:
      'Hashrate is the total computing power miners are pointing at Bitcoin, measured in hashes per second. A higher hashrate makes the network more expensive to attack and shows miners are investing in equipment. It is estimated from how fast blocks are found, so short-term readings are noisy, and it does not predict price.',
  },
  {
    question: 'Why do Bitcoin transaction fees change?',
    answer:
      'Blocks have limited space, so users bid for it with fees measured in satoshis per virtual byte (sat/vB). When many transactions are waiting in the mempool, the fee needed for fast confirmation rises; when the mempool is quiet, low-fee transactions confirm quickly.',
  },
  {
    question: 'Are active addresses the same as active users?',
    answer:
      'No. One person can control many addresses, and one address (for example an exchange wallet) can serve thousands of people. Address counts are a rough proxy for activity that can be inflated by batching, consolidations or spam, so trends over weeks matter more than any single day.',
  },
  {
    question: 'What is MVRV and why is it not shown live here?',
    answer:
      'MVRV compares Bitcoin\'s market value with its "realized value", which prices each coin at the time it last moved. Historically, very high readings have coincided with market tops and readings below 1 with deep bear markets. Calculating it needs full UTXO history, and the free sources this page uses do not provide it, so we explain it rather than show an approximation.',
  },
  {
    question: 'How often is this data updated?',
    answer:
      'The page fetches fresh data when you load it. Our server caches the combined result for about two minutes to avoid overloading the free public APIs. Each metric shows the time of its newest data point: fee and mempool figures are near-live, while daily transaction and address counts update once a day.',
  },
];

// ---------------------------------------------------------------------------
// Presentation helpers
// ---------------------------------------------------------------------------

function MetricCard({
  title,
  metric,
  render,
  explanation,
}: {
  title: string;
  metric: Metric<unknown> | undefined;
  render: () => ReactNode;
  explanation: { means: string; read: string; limits: string };
}) {
  return (
    <article className="bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <div className="mt-3 min-h-[5rem]">
        {metric === undefined ? (
          <div className="space-y-2 animate-pulse" aria-hidden="true">
            <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-56 bg-gray-100 dark:bg-gray-700/60 rounded" />
          </div>
        ) : metric.ok ? (
          <>
            {render()}
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              As of {formatDateTime(metric.asOf)} &middot; Source:{' '}
              <ExternalLink href={metric.sourceUrl}>{metric.source}</ExternalLink>
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Live value unavailable right now ({metric.source}: {metric.error}). We show nothing rather than an
            estimate.
          </p>
        )}
      </div>
      <dl className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2 text-sm text-gray-700 dark:text-gray-300">
        <div>
          <dt className="font-medium text-gray-900 dark:text-white">What it means</dt>
          <dd>{explanation.means}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-900 dark:text-white">How to read it</dt>
          <dd>{explanation.read}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-900 dark:text-white">Limits</dt>
          <dd>{explanation.limits}</dd>
        </div>
      </dl>
    </article>
  );
}

function BigValue({ children }: { children: ReactNode }) {
  return <p className="text-3xl font-bold text-gray-900 dark:text-white">{children}</p>;
}

function Change({ pct, label }: { pct: number | null; label: string }) {
  if (pct === null) return null;
  return (
    <span className={pct >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
      {pct >= 0 ? '+' : ''}
      {pct.toFixed(1)}% {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type LoadResult =
  | { status: 'error'; message: string }
  | { status: 'ready'; snapshot: OnchainSnapshot };
type LoadState = { status: 'loading' } | LoadResult;

export default function OnChainAnalytics() {
  // Each result is tagged with the request that produced it, so a retry shows
  // the loading state without a synchronous setState inside the effect.
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<{ key: number; value: LoadResult } | null>(null);
  const state: LoadState = result && result.key === reloadKey ? result.value : { status: 'loading' };

  useEffect(() => {
    const controller = new AbortController();
    fetchOnchainSnapshot(controller.signal)
      .then((snapshot) => setResult({ key: reloadKey, value: { status: 'ready', snapshot } }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setResult({
          key: reloadKey,
          value: { status: 'error', message: err instanceof Error ? err.message : 'Unknown error' },
        });
      });
    return () => controller.abort();
  }, [reloadKey]);

  const m = state.status === 'ready' ? state.snapshot.metrics : undefined;
  // While loading, cards show skeletons (metric undefined). On a total failure
  // each card shows the same "unavailable" note.
  const failed = (source: string): Metric<never> => ({
    ok: false,
    error: state.status === 'error' ? state.message : 'not loaded',
    source,
    sourceUrl: source === 'mempool.space' ? 'https://mempool.space' : 'https://www.blockchain.com/explorer/charts',
  });
  const pick = <T,>(metric: Metric<T> | undefined, source: string): Metric<T> | undefined =>
    state.status === 'error' ? failed(source) : metric;

  const hashrate = pick(m?.hashrate, 'mempool.space');
  const difficulty = pick(m?.difficulty, 'mempool.space');
  const fees = pick(m?.fees, 'mempool.space');
  const mempool = pick(m?.mempool, 'mempool.space');
  const blocks = pick(m?.blocks, 'mempool.space');
  const transactions = pick(m?.transactions, 'Blockchain.com Charts');
  const addresses = pick(m?.addresses, 'Blockchain.com Charts');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <PageSEO pageKey="onChainAnalytics" urlPath="/onchain-analytics" faqs={FAQS} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8 max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <Database className="h-8 w-8 text-blue-500 flex-shrink-0" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bitcoin On-Chain Metrics, Explained</h1>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            On-chain metrics are measurements taken straight from the Bitcoin blockchain: how much mining power
            secures it, what it costs to get a transaction confirmed, and how many transactions and addresses are
            active. This page shows live values from free public sources (mempool.space and Blockchain.com) and
            explains what each one tells you, and what it cannot.
          </p>
          <div className="mt-3">
            <LastUpdated date={LAST_UPDATED} label="Explanations last reviewed" />
          </div>
        </header>

        {state.status === 'error' && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3"
          >
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-300">Live on-chain data could not be loaded.</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                {state.message} The explanations below still apply, and you can check current values directly on{' '}
                <ExternalLink href="https://mempool.space">mempool.space</ExternalLink>.
              </p>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded bg-red-600 text-white hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Retry
              </button>
            </div>
          </div>
        )}

        <section aria-labelledby="network-heading" aria-busy={state.status === 'loading'}>
          <h2 id="network-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Network security and mining
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <MetricCard
              title="Hashrate"
              metric={hashrate}
              render={() =>
                hashrate?.ok && (
                  <>
                    <BigValue>{formatHashrate(hashrate.data.current)}</BigValue>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Daily average &middot; <Change pct={seriesChangePercent(hashrate.data.series, 30)} label="vs ~30 days earlier" />
                    </p>
                    <Sparkline points={hashrate.data.series} label="Bitcoin hashrate, daily average, last 3 months" />
                  </>
                )
              }
              explanation={{
                means:
                  'The combined computing power of all Bitcoin miners, in hashes per second (1 EH/s = 10^18 hashes per second).',
                read:
                  'A rising hashrate means more machines are mining, which makes rewriting the chain more expensive. A sharp drop can follow a price crash, an energy shock or a region banning mining.',
                limits:
                  'Nobody reports hashrate directly: it is estimated from how quickly blocks are found, so daily figures are noisy. Hashrate follows price and energy costs more than it leads them.',
              }}
            />
            <MetricCard
              title="Mining difficulty"
              metric={difficulty}
              render={() =>
                difficulty?.ok && (
                  <>
                    <BigValue>{formatLargeNumber(difficulty.data.current)}</BigValue>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      At block {difficulty.data.height.toLocaleString('en-US')}
                      {difficulty.data.estimatedChangePercent !== null && (
                        <>
                          {' '}&middot; next adjustment estimated at{' '}
                          {difficulty.data.estimatedChangePercent >= 0 ? '+' : ''}
                          {difficulty.data.estimatedChangePercent.toFixed(2)}%
                        </>
                      )}
                      {difficulty.data.remainingBlocks !== null && (
                        <> in {difficulty.data.remainingBlocks.toLocaleString('en-US')} blocks</>
                      )}
                      {difficulty.data.estimatedRetargetAt !== null && (
                        <> (around {formatDateTime(difficulty.data.estimatedRetargetAt)})</>
                      )}
                      .
                    </p>
                  </>
                )
              }
              explanation={{
                means:
                  'How hard it is to find a valid block. Every 2,016 blocks (about two weeks) Bitcoin resets difficulty so blocks keep arriving roughly every 10 minutes.',
                read:
                  'Difficulty rises when blocks came faster than 10 minutes on average (more hashrate joined) and falls when they came slower. The "next adjustment" figure is mempool.space\'s projection from the current epoch so far.',
                limits:
                  'It is backward-looking by design, and the projection changes block by block early in an epoch.',
              }}
            />
          </div>
        </section>

        <section aria-labelledby="fees-heading" className="mt-10">
          <h2 id="fees-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Fees and congestion
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <MetricCard
              title="Recommended fees"
              metric={fees}
              render={() =>
                fees?.ok && (
                  <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      ['Next block', fees.data.fastest],
                      ['~30 min', fees.data.halfHour],
                      ['~1 hour', fees.data.hour],
                      ['Economy', fees.data.economy],
                    ].map(([label, v]) => (
                      <div key={label as string} className="rounded-lg bg-gray-50 dark:bg-gray-900 p-2">
                        <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
                        <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                          {v === null ? 'n/a' : `${v} sat/vB`}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )
              }
              explanation={{
                means:
                  'The fee rate, in satoshis per virtual byte, that mempool.space estimates is needed to be confirmed within a given time. A typical simple transaction is roughly 140 vB, so 10 sat/vB is about 1,400 sats.',
                read:
                  'Low numbers mean block space is cheap right now. If you are not in a hurry, the economy rate is usually enough. Spikes often coincide with market volatility or popular token launches.',
                limits:
                  'These are estimates for the current mempool. They can change within minutes, and wallets calculate their own suggestions.',
              }}
            />
            <MetricCard
              title="Mempool backlog"
              metric={mempool}
              render={() =>
                mempool?.ok && (
                  <>
                    <BigValue>{mempool.data.count.toLocaleString('en-US')} txs</BigValue>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(mempool.data.vsize / 1e6).toFixed(1)} vMB waiting (about{' '}
                      {Math.ceil(mempool.data.vsize / 1e6).toLocaleString('en-US')} blocks&apos; worth)
                      {mempool.data.totalFeeSats !== null && (
                        <> &middot; {satsToBtc(mempool.data.totalFeeSats).toFixed(3)} BTC in pending fees</>
                      )}
                    </p>
                  </>
                )
              }
              explanation={{
                means:
                  'The mempool is the queue of valid transactions waiting to be included in a block. Each block holds about 1 million virtual bytes (1 vMB).',
                read:
                  'A backlog of many blocks\' worth means low-fee transactions may wait hours or days. An almost empty mempool means even minimum-fee transactions confirm quickly.',
                limits:
                  'Each node has its own mempool; this is mempool.space\'s view. Size alone does not show urgency: a big backlog of very low-fee transactions barely affects fast fees.',
              }}
            />
          </div>
        </section>

        <section aria-labelledby="activity-heading" className="mt-10">
          <h2 id="activity-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Network activity
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <MetricCard
              title="Confirmed transactions per day"
              metric={transactions}
              render={() =>
                transactions?.ok && (
                  <>
                    <BigValue>{transactions.data.latest.toLocaleString('en-US', { maximumFractionDigits: 0 })}</BigValue>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Latest day &middot; <Change pct={seriesChangePercent(transactions.data.series, 30)} label="vs 30 days earlier" />
                    </p>
                    <Sparkline points={transactions.data.series} label="Bitcoin confirmed transactions per day, last 90 days" className="text-green-600" />
                  </>
                )
              }
              explanation={{
                means: 'The number of transactions confirmed in blocks each day.',
                read:
                  'A sustained rise means more on-chain use. Compare weeks and months rather than single days, because weekends and fee spikes cause swings.',
                limits:
                  'One transaction can pay hundreds of people (exchange batching) or carry no economic transfer at all (inscriptions, consolidations). Counts measure activity, not adoption or value.',
              }}
            />
            <MetricCard
              title="Unique addresses used per day"
              metric={addresses}
              render={() =>
                addresses?.ok && (
                  <>
                    <BigValue>{addresses.data.latest.toLocaleString('en-US', { maximumFractionDigits: 0 })}</BigValue>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Latest day &middot; <Change pct={seriesChangePercent(addresses.data.series, 30)} label="vs 30 days earlier" />
                    </p>
                    <Sparkline points={addresses.data.series} label="Bitcoin unique addresses used per day, last 90 days" className="text-purple-600" />
                  </>
                )
              }
              explanation={{
                means: 'The number of distinct addresses that appeared in confirmed transactions that day (often called "active addresses").',
                read: 'A rough gauge of how many participants are transacting. Look at the trend across weeks.',
                limits:
                  'Addresses are not people. Good wallets use a fresh address for every payment, and a single exchange wallet can represent millions of users, so the count can move for reasons unrelated to adoption.',
              }}
            />
          </div>
        </section>

        <section aria-labelledby="blocks-heading" className="mt-10">
          <h2 id="blocks-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Latest blocks
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            {blocks === undefined ? (
              <div className="p-6 space-y-3 animate-pulse" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-5 bg-gray-100 dark:bg-gray-700 rounded" />
                ))}
              </div>
            ) : !blocks.ok ? (
              <p className="p-6 text-sm text-gray-600 dark:text-gray-400">
                Recent blocks are unavailable right now ({blocks.error}). See{' '}
                <ExternalLink href="https://mempool.space/blocks">mempool.space/blocks</ExternalLink>.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">Most recent Bitcoin blocks</caption>
                  <thead className="bg-gray-50 dark:bg-gray-900 text-left text-gray-600 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">Height</th>
                      <th scope="col" className="px-4 py-3 font-medium">Mined</th>
                      <th scope="col" className="px-4 py-3 font-medium text-right">Transactions</th>
                      <th scope="col" className="px-4 py-3 font-medium text-right">Median fee</th>
                      <th scope="col" className="px-4 py-3 font-medium text-right">Total fees</th>
                      <th scope="col" className="px-4 py-3 font-medium">Pool</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-800 dark:text-gray-200">
                    {blocks.data.slice(0, 8).map((b) => (
                      <tr key={b.id}>
                        <td className="px-4 py-3">
                          <ExternalLink href={`https://mempool.space/block/${b.id}`}>{b.height.toLocaleString('en-US')}</ExternalLink>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(b.timestamp)}</td>
                        <td className="px-4 py-3 text-right">{b.txCount.toLocaleString('en-US')}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {b.medianFeeRate === null ? 'n/a' : `${b.medianFeeRate.toFixed(1)} sat/vB`}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {b.totalFeesSats === null ? 'n/a' : `${satsToBtc(b.totalFeesSats).toFixed(4)} BTC`}
                        </td>
                        <td className="px-4 py-3">{b.pool ?? 'Unknown'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
                  Newest first &middot; Source: <ExternalLink href={blocks.sourceUrl}>{blocks.source}</ExternalLink>. Pool
                  names are mempool.space&apos;s identification from coinbase tags and payout addresses.
                </p>
              </div>
            )}
          </div>
        </section>

        <div className="max-w-3xl">
          <Section id="advanced-heading" title="Metrics you will see elsewhere (and why they are not live here)">
            <p>
              Paid analytics firms publish metrics built from the full history of every coin. They need a complete
              UTXO dataset, which the free sources used on this page do not provide, so we explain them instead of
              showing approximations.
            </p>
            <dl className="space-y-4">
              <div>
                <dt className="font-semibold text-gray-900 dark:text-white">MVRV ratio</dt>
                <dd>
                  Market value divided by realized value (each coin priced at the last time it moved). Above 1, the
                  average holder is in profit; historically, very high readings have come near cycle tops and readings
                  below 1 near bear-market lows. Thresholds shift from cycle to cycle.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-900 dark:text-white">Exchange inflows and outflows</dt>
                <dd>
                  Coins moving to exchanges are often read as potential selling and coins leaving as moving to
                  self-custody. The catch: exchange wallets must first be identified by clustering heuristics, and
                  internal reshuffles or custodian moves can look like large flows. Treat headlines about &quot;record
                  outflows&quot; with care.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-900 dark:text-white">SOPR (Spent Output Profit Ratio)</dt>
                <dd>
                  For coins moved on a given day, the price when they were spent divided by the price when they were
                  last received. Above 1 means coins moved at a profit on average.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-900 dark:text-white">NVT ratio</dt>
                <dd>
                  Network value divided by daily transaction value, a rough &quot;price-to-earnings&quot; for a
                  blockchain. Change outputs and exchange shuffling distort the transaction value it depends on.
                </dd>
              </div>
            </dl>
          </Section>

          <Section id="howto-heading" title="How to use on-chain data sensibly">
            <ul className="list-disc pl-5 space-y-2">
              <li>Look at trends over weeks or months. Single-day readings are noisy.</li>
              <li>
                Combine metrics. Rising fees with rising transaction counts means genuine demand for block space;
                rising fees alone may be one large event.
              </li>
              <li>
                No on-chain metric has reliably timed the market. They are better at describing network health than at
                predicting price.
              </li>
              <li>
                Verify it yourself. Everything above can be checked in a block explorer such as{' '}
                <ExternalLink href="https://mempool.space">mempool.space</ExternalLink>, or on your own node.
              </li>
            </ul>
          </Section>

          <div className="mt-8">
            <NotAdviceNote />
          </div>

          <FaqSection faqs={FAQS} />

          <RelatedLinks
            links={[
              { to: '/whale-tracking', title: 'Bitcoin whale tracking', description: 'What large transfers do and do not tell you.' },
              { to: '/trading-indicators', title: 'Trading indicators', description: 'RSI, MACD and Bollinger Bands on live prices.' },
              { to: '/learn/understanding-blockchain', title: 'Understanding blockchain', description: 'How blocks, mining and nodes work.' },
              { to: '/learn/what-is-bitcoin', title: 'What is Bitcoin?', description: 'The basics, in plain English.' },
              { to: '/gas-optimizer', title: 'Gas optimizer', description: 'Ethereum fee timing.' },
              { to: '/glossary', title: 'Crypto glossary', description: 'Plain-English definitions.' },
            ]}
          />
          <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
            Want to learn the fundamentals first? Start with our <Link to="/learn" className="text-blue-600 dark:text-blue-400 underline">free guides</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
