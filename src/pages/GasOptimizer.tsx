/**
 * /gas-optimizer — live gas fees for Ethereum and major EVM chains
 * (via src/services/gasPrice.ts), Bitcoin fee rates (via /api/btc-fees),
 * correct per-action USD costs, and a plain-English fee explainer.
 *
 * The heading, summary, explainer and FAQ render from static content on the
 * first render; only the fee panels depend on network data, and background
 * refreshes keep the existing numbers on screen.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Fuel, RefreshCw, AlertTriangle, Info, Bitcoin } from 'lucide-react';
import { PageSEO } from '../components/PageSEO';
import { ExternalLink, FaqList, LastReviewed, RelatedLinks, type FaqItem } from '../components/ToolPageParts';
import { getAllGasPrices } from '../services/gasPrice';
import {
  TX_TYPES,
  TYPICAL_BTC_TX_VBYTES,
  btcFeeUsd,
  estimateCostNative,
  estimateCostUsd,
  fetchBtcFees,
  fetchBtcPrice,
  formatGwei,
  formatNative,
  formatUsd,
  hasTokenPrice,
  isGasDataAvailable,
  isRollup,
  type BtcFees,
} from '../services/gasOptimizer';
import type { ChainGasInfo } from '../types';

const LAST_REVIEWED = '2026-09-23';
const REFRESH_MS = 60_000;

/** Static list so the selector renders before any data arrives. */
const CHAINS: Array<{ chainId: number; name: string }> = [
  { chainId: 1, name: 'Ethereum' },
  { chainId: 42161, name: 'Arbitrum One' },
  { chainId: 8453, name: 'Base' },
  { chainId: 10, name: 'Optimism' },
  { chainId: 137, name: 'Polygon' },
  { chainId: 56, name: 'BNB Smart Chain' },
  { chainId: 43114, name: 'Avalanche C-Chain' },
];

const FAQS: FaqItem[] = [
  {
    question: 'What is gwei?',
    answer:
      'Gwei is a billionth of one ETH (10^-9 ETH). Gas prices are quoted in gwei per unit of gas. The fee for a transaction is the gas it uses multiplied by the gas price: a plain ETH transfer uses 21,000 gas, so at 1 gwei it costs 0.000021 ETH.',
  },
  {
    question: 'How does the Ethereum fee (EIP-1559) work?',
    answer:
      'Every block has a base fee that the protocol sets automatically and burns. It rises by up to 12.5% after a block that is more than half full and falls after a block that is less than half full. On top of that you add a priority fee (tip) for the validator. Your wallet sets a max fee; you pay base fee plus tip and any unused headroom is refunded.',
  },
  {
    question: 'Why are layer 2 fees so much lower?',
    answer:
      'Rollups such as Arbitrum, Optimism and Base execute transactions off Ethereum and post compressed batches back to it. Since the Dencun upgrade in March 2024 (EIP-4844) they post that data as cheap "blobs", which cut L2 fees sharply. An L2 fee has two parts: the L2 execution fee and an L1 data fee, and the data fee is usually the larger part.',
  },
  {
    question: 'Why might the L2 costs on this page look lower than my wallet quote?',
    answer:
      'The costs shown for Arbitrum, Optimism and Base are the L2 execution fee only, calculated from the live gas price. They leave out the L1 data fee, which depends on the transaction\'s size and on Ethereum blob prices at that moment. Your wallet includes both, so its quote will usually be higher.',
  },
  {
    question: 'When is the cheapest time to send an Ethereum transaction?',
    answer:
      'When the network is quiet. Fees spike during sharp market moves, popular token launches, mints and airdrops, and fall back when activity calms down. There is no reliable fixed "cheap hour" any more; check the live base fee before sending, and if it is not urgent, set a lower max fee and wait.',
  },
  {
    question: 'How are Bitcoin fees different?',
    answer:
      'Bitcoin fees are priced in satoshis per virtual byte (sat/vB) of transaction size, not per unit of computation. Miners pick the highest-paying transactions first, so the rate you need depends on how full the mempool is. A simple one-input, two-output SegWit payment is about 141 vB.',
  },
];

type LoadState = 'loading' | 'ready' | 'error';

function useVisibleInterval(callback: () => void, ms: number) {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  }, [callback]);
  useEffect(() => {
    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') saved.current();
    }, ms);
    return () => clearInterval(id);
  }, [ms]);
}

function formatClock(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function EvmFees() {
  const [chains, setChains] = useState<ChainGasInfo[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(1);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const load = useCallback(
    () =>
      getAllGasPrices()
        .then((data) => {
          if (data.some(isGasDataAvailable)) {
            setChains(data);
            setState('ready');
            setUpdatedAt(new Date().toISOString());
          } else {
            // Keep previous numbers if we had them; otherwise say it failed.
            setState((prev) => (prev === 'ready' ? prev : 'error'));
          }
        })
        .catch((err: unknown) => {
          if (import.meta.env.DEV) console.debug('Gas fetch failed', err);
          setState((prev) => (prev === 'ready' ? prev : 'error'));
        })
        .finally(() => setRefreshing(false)),
    []
  );

  useEffect(() => {
    void load();
  }, [load]);
  useVisibleInterval(() => void load(), REFRESH_MS);

  const current = chains.find((c) => c.chainId === selected);
  const currentLive = isGasDataAvailable(current) ? current : undefined;
  const rollup = isRollup(selected);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div role="group" aria-label="Chain" className="flex flex-wrap gap-2">
          {CHAINS.map((c) => (
            <button
              key={c.chainId}
              type="button"
              aria-pressed={selected === c.chainId}
              onClick={() => setSelected(c.chainId)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                selected === c.chainId
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            void load();
          }}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4" aria-live="polite">
        {state === 'loading' && 'Loading live gas prices…'}
        {state === 'error' &&
          'Live gas prices are unavailable right now. Check a block explorer such as Etherscan, or try again shortly.'}
        {state === 'ready' && updatedAt &&
          `Gas prices from public RPC nodes; USD prices from CoinGecko. Updated ${formatClock(updatedAt)}, refreshes every minute while this tab is open.`}
      </p>

      {state === 'ready' && !currentLive && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg p-4 mb-4 text-gray-800 dark:text-gray-200">
          Data for this chain could not be fetched right now.
        </div>
      )}

      {state === 'loading' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {currentLive && (
        <>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Low', value: currentLive.gasPrice.low, note: 'may wait longer' },
              { label: 'Average', value: currentLive.gasPrice.average, note: 'typical' },
              { label: 'High', value: currentLive.gasPrice.high, note: 'faster inclusion' },
              { label: 'Base fee', value: currentLive.gasPrice.baseFee, note: 'burned, set by protocol' },
            ].map((t) => (
              <div key={t.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <dt className="text-sm text-gray-600 dark:text-gray-400">{t.label}</dt>
                <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatGwei(t.value)} <span className="text-sm font-normal text-gray-500">gwei</span>
                </dd>
                <dd className="text-xs text-gray-500 dark:text-gray-400">{t.note}</dd>
              </div>
            ))}
          </dl>

          {rollup && (
            <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4 text-sm text-gray-800 dark:text-gray-200">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" aria-hidden="true" />
              <span>
                {currentLive.chainName} is a rollup. The costs below are the L2 execution fee only and exclude the
                L1 data fee, which is usually the larger part of the total. Expect your wallet quote to be higher.
              </span>
            </div>
          )}

          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <caption className="text-left text-sm text-gray-600 dark:text-gray-400 p-3">
                Estimated cost on {currentLive.chainName} at the average gas price
              </caption>
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
                <tr>
                  <th scope="col" className="text-left p-3 font-medium">Action</th>
                  <th scope="col" className="text-right p-3 font-medium">Typical gas</th>
                  <th scope="col" className="text-right p-3 font-medium">Cost ({currentLive.symbol})</th>
                  <th scope="col" className="text-right p-3 font-medium">Cost (USD)</th>
                </tr>
              </thead>
              <tbody className="text-gray-800 dark:text-gray-200">
                {TX_TYPES.map((t) => (
                  <tr key={t.id} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="p-3">{t.label}</td>
                    <td className="p-3 text-right">{t.gas.toLocaleString('en-US')}</td>
                    <td className="p-3 text-right">
                      {formatNative(estimateCostNative(currentLive.gasPrice.average, t.gas), currentLive.symbol)}
                    </td>
                    <td className="p-3 text-right font-semibold">
                      {formatUsd(estimateCostUsd(currentLive.gasPrice.average, t.gas, currentLive.nativeTokenPrice))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Gas amounts are typical figures; the real amount depends on the contract. Cost = gas × gas price ×{' '}
            {currentLive.symbol} price.
            {!hasTokenPrice(currentLive) && ' The USD price feed is unavailable, so only native-coin costs are shown.'}
          </p>
        </>
      )}

      {chains.some(isGasDataAvailable) && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">All chains side by side</h3>
          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <caption className="sr-only">Average gas price and cost per action on each chain</caption>
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
                <tr>
                  <th scope="col" className="text-left p-3 font-medium">Chain</th>
                  <th scope="col" className="text-right p-3 font-medium">Avg gas (gwei)</th>
                  <th scope="col" className="text-right p-3 font-medium">Send native coin</th>
                  <th scope="col" className="text-right p-3 font-medium">Token transfer</th>
                  <th scope="col" className="text-right p-3 font-medium">DEX swap</th>
                </tr>
              </thead>
              <tbody className="text-gray-800 dark:text-gray-200">
                {CHAINS.map((c) => {
                  const info = chains.find((x) => x.chainId === c.chainId);
                  if (!isGasDataAvailable(info)) {
                    return (
                      <tr key={c.chainId} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="p-3">{c.name}</td>
                        <td colSpan={4} className="p-3 text-right text-gray-500">Unavailable right now</td>
                      </tr>
                    );
                  }
                  const cost = (gas: number) => formatUsd(estimateCostUsd(info.gasPrice.average, gas, info.nativeTokenPrice));
                  return (
                    <tr key={c.chainId} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="p-3">
                        {info.chainName}
                        {isRollup(c.chainId) && <span className="text-xs text-gray-500"> *</span>}
                      </td>
                      <td className="p-3 text-right">{formatGwei(info.gasPrice.average)}</td>
                      <td className="p-3 text-right">{cost(21_000)}</td>
                      <td className="p-3 text-right">{cost(65_000)}</td>
                      <td className="p-3 text-right">{cost(150_000)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            * Rollup: execution fee only; the L1 data fee is not included.
          </p>
        </div>
      )}
    </div>
  );
}

function BitcoinFees() {
  const [fees, setFees] = useState<BtcFees | null>(null);
  const [btcPrice, setBtcPrice] = useState<number | null>(null);
  const [state, setState] = useState<LoadState>('loading');

  const load = useCallback(
    () =>
      Promise.all([fetchBtcFees(), fetchBtcPrice()])
        .then(([f, p]) => {
          setFees(f);
          if (p !== null) setBtcPrice(p);
          setState('ready');
        })
        .catch((err: unknown) => {
          if (import.meta.env.DEV) console.debug('BTC fee fetch failed', err);
          setState((prev) => (prev === 'ready' ? prev : 'error'));
        }),
    []
  );

  useEffect(() => {
    void load();
  }, [load]);
  useVisibleInterval(() => void load(), REFRESH_MS);

  if (state === 'error') {
    return (
      <p className="text-gray-700 dark:text-gray-300">
        Bitcoin fee rates are unavailable right now. You can check them on{' '}
        <ExternalLink href="https://mempool.space">mempool.space</ExternalLink>.
      </p>
    );
  }
  if (!fees) {
    return <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" aria-label="Loading Bitcoin fees" />;
  }

  const tiers = [
    { label: 'Next block', rate: fees.fastestFee },
    { label: 'About 30 minutes', rate: fees.halfHourFee },
    { label: 'About 1 hour', rate: fees.hourFee },
    { label: 'Economy (no rush)', rate: fees.economyFee },
  ];

  return (
    <div>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {tiers.map((t) => (
          <div key={t.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <dt className="text-sm text-gray-600 dark:text-gray-400">{t.label}</dt>
            <dd className="text-2xl font-bold text-gray-900 dark:text-white">
              {t.rate} <span className="text-sm font-normal text-gray-500">sat/vB</span>
            </dd>
            <dd className="text-xs text-gray-500 dark:text-gray-400">
              Typical payment: {(t.rate * TYPICAL_BTC_TX_VBYTES).toLocaleString('en-US')} sats
              {btcPrice !== null && ` (${formatUsd(btcFeeUsd(t.rate, TYPICAL_BTC_TX_VBYTES, btcPrice))})`}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Source: <ExternalLink href="https://mempool.space">mempool.space</ExternalLink> recommended fees, updated{' '}
        {formatClock(fees.asOf)}. "Typical payment" assumes a {TYPICAL_BTC_TX_VBYTES} vB one-input, two-output
        SegWit transaction.
      </p>
    </div>
  );
}

export default function GasOptimizerPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <PageSEO pageKey="gasOptimizer" urlPath="/gas-optimizer" isTool toolName="Gas Fee Tracker" faqs={FAQS} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Fuel className="h-8 w-8 text-orange-500" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gas Fee Tracker: Ethereum, L2s and Bitcoin
            </h1>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-4xl mb-3">
            A transaction fee is the gas it uses times the gas price. This page shows live gas prices for Ethereum and
            six other EVM chains, what common actions cost in dollars at that price, and current Bitcoin fee rates.
            Layer 2 rollups are usually far cheaper than Ethereum mainnet, but the figures here leave out their L1
            data fee.
          </p>
          <LastReviewed date={LAST_REVIEWED} label="Explainer last reviewed" />
        </header>

        <section aria-labelledby="live-heading" className="mb-12">
          <h2 id="live-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Live EVM gas prices and costs
          </h2>
          <EvmFees />
        </section>

        <section aria-labelledby="btc-heading" className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Bitcoin className="w-6 h-6 text-orange-500" aria-hidden="true" />
            <h2 id="btc-heading" className="text-2xl font-bold text-gray-900 dark:text-white">
              Bitcoin network fees
            </h2>
          </div>
          <BitcoinFees />
        </section>

        <section aria-labelledby="eip1559-heading" className="mb-12">
          <h2 id="eip1559-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            How Ethereum fees work (EIP-1559)
          </h2>
          <div className="prose dark:prose-invert max-w-4xl text-gray-700 dark:text-gray-300 space-y-3">
            <p>
              Since the London upgrade in August 2021, every Ethereum fee has two parts. The <strong>base fee</strong>{' '}
              is set by the protocol for each block and burned. It moves automatically: up to 12.5% higher after a
              block that is more than half full, lower after a block that is less than half full. The{' '}
              <strong>priority fee</strong> (tip) goes to the validator and decides who gets in first when blocks are
              busy.
            </p>
            <p>
              Your wallet sends a <strong>max fee</strong> and a <strong>max priority fee</strong>. You pay the current
              base fee plus your tip, never more than the max, and the difference is not charged. The total cost is
              gas used × (base fee + tip). A plain ETH transfer always uses 21,000 gas; contract interactions use more.
            </p>
            <p className="text-sm">
              Worked example: at a 2 gwei base fee plus a 0.1 gwei tip, a token swap using 150,000 gas costs 150,000 ×
              2.1 gwei = 315,000 gwei = 0.000315 ETH. Multiply by the ETH price for dollars.
            </p>
          </div>
        </section>

        <section aria-labelledby="when-heading" className="mb-12">
          <h2 id="when-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            When to transact and how to pay less
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 max-w-4xl">
            <li>
              <strong>Check the base fee right before sending.</strong> Fees jump during sharp price moves, hyped token
              launches, mints and airdrops, then fall back. Older advice about a fixed "cheap hour" no longer holds
              reliably, so look at the live number instead.
            </li>
            <li>
              <strong>If it is not urgent, set a lower max fee and wait.</strong> The transaction stays pending until the
              base fee drops below your cap.
            </li>
            <li>
              <strong>Use a layer 2 for small or frequent transactions.</strong> Swaps and transfers on Arbitrum,
              Optimism or Base usually cost a small fraction of mainnet.
            </li>
            <li>
              <strong>Batch and avoid needless approvals.</strong> Each approval is a separate transaction; unlimited
              approvals save gas but carry security risk if the contract is compromised.
            </li>
            <li>
              <strong>Failed transactions still cost gas.</strong> Double-check slippage and balances before
              confirming.
            </li>
          </ul>
        </section>

        <section aria-labelledby="l2-heading" className="mb-12">
          <h2 id="l2-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Layer 1 vs layer 2 fees after Dencun
          </h2>
          <div className="text-gray-700 dark:text-gray-300 max-w-4xl space-y-3 mb-4">
            <p>
              Rollups run transactions on their own chain and post compressed batches to Ethereum. Their fee is{' '}
              <strong>L2 execution fee + L1 data fee</strong>. The Dencun upgrade (March 13, 2024) added blob space
              (EIP-4844) for this data, which is priced separately from normal gas and made rollup fees much cheaper.
              The L1 data fee is still usually the largest part of an L2 fee and rises when blob demand rises.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <caption className="sr-only">Comparison of fee models</caption>
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400">
                <tr>
                  <th scope="col" className="text-left p-3 font-medium">Network</th>
                  <th scope="col" className="text-left p-3 font-medium">Fee paid in</th>
                  <th scope="col" className="text-left p-3 font-medium">What the fee covers</th>
                  <th scope="col" className="text-left p-3 font-medium">Security</th>
                </tr>
              </thead>
              <tbody className="text-gray-800 dark:text-gray-200">
                <tr className="border-t border-gray-100 dark:border-gray-700">
                  <td className="p-3">Ethereum mainnet</td>
                  <td className="p-3">ETH</td>
                  <td className="p-3">Execution (base fee burned + tip)</td>
                  <td className="p-3">Ethereum itself</td>
                </tr>
                <tr className="border-t border-gray-100 dark:border-gray-700">
                  <td className="p-3">Arbitrum, Optimism, Base (rollups)</td>
                  <td className="p-3">ETH</td>
                  <td className="p-3">L2 execution + L1 data (blobs)</td>
                  <td className="p-3">Settles to Ethereum</td>
                </tr>
                <tr className="border-t border-gray-100 dark:border-gray-700">
                  <td className="p-3">Polygon PoS, BNB Chain, Avalanche C-Chain</td>
                  <td className="p-3">POL, BNB, AVAX</td>
                  <td className="p-3">Execution on their own chain</td>
                  <td className="p-3">Their own validator sets</td>
                </tr>
                <tr className="border-t border-gray-100 dark:border-gray-700">
                  <td className="p-3">Bitcoin</td>
                  <td className="p-3">BTC (sats)</td>
                  <td className="p-3">Block space by size (sat/vB)</td>
                  <td className="p-3">Bitcoin proof of work</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>
            Estimates only. Your wallet's quote is what you will actually pay. Gas alerts and fee predictions are not
            offered here.
          </span>
        </div>

        <FaqList faqs={FAQS} />

        <RelatedLinks
          links={[
            { to: '/learn/defi-basics', label: 'DeFi basics', note: 'What you are paying gas for' },
            { to: '/defi-yield', label: 'DeFi yields', note: 'Current rates and an impermanent loss calculator' },
            { to: '/lending', label: 'Crypto lending rates', note: 'DeFi vs CeFi lending' },
            { to: '/calculators', label: 'Crypto calculators', note: 'Fees, DCA, taxes and more' },
            { to: '/learn/crypto-wallets-explained', label: 'Crypto wallets explained', note: 'How wallets sign and send' },
          ]}
        />
      </div>
    </div>
  );
}
