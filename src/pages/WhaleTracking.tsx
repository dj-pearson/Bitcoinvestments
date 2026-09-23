/**
 * /whale-tracking
 *
 * Honest educational page: what crypto "whale tracking" is, how to do it
 * yourself with free tools, and what large transfers do and do not signal.
 * Includes a live list of the largest transactions in the most recent Bitcoin
 * blocks, read from mempool.space through /api/onchain/large-transactions.
 *
 * No transaction, wallet, balance or entity name on this page is invented.
 * We do not label addresses with owners: attribution is guesswork that needs
 * sources we cannot verify.
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Waves } from 'lucide-react';
import { PageSEO } from '../components/PageSEO';
import {
  ExternalLink,
  FaqSection,
  LastUpdated,
  NotAdviceNote,
  RelatedLinks,
  Section,
  type FaqItem,
} from '../components/analytics/PageParts';
import {
  fetchLargeTransactions,
  formatDateTime,
  satsToBtc,
  type LargeTransactionsSnapshot,
} from '../services/onchainPublic';

const LAST_UPDATED = '2026-09-23';

const FAQS: FaqItem[] = [
  {
    question: 'What is a crypto whale?',
    answer:
      'A whale is an address or entity holding enough of a coin to move its market. There is no official threshold; for Bitcoin, 1,000 BTC or more is a common rule of thumb. Many of the largest Bitcoin addresses belong to exchanges, custodians and funds holding coins for many customers, not to single individuals.',
  },
  {
    question: 'How can I track Bitcoin whales for free?',
    answer:
      'Use a block explorer such as mempool.space to look up large transactions and addresses, since all Bitcoin transactions are public. Free services like Whale Alert post large transfers, and analytics sites such as Arkham attach entity labels to addresses. Treat any label as a claim by that provider rather than a fact.',
  },
  {
    question: 'Does a whale sending Bitcoin to an exchange mean they will sell?',
    answer:
      'Not necessarily. Moving coins to an exchange makes selling possible, but it is also used for collateral, market making, OTC settlement, custody changes and internal wallet reshuffles. Many "exchange inflow" alerts turn out to be the exchange moving its own coins.',
  },
  {
    question: 'Why is the "largest transaction" amount not the amount that changed hands?',
    answer:
      'A Bitcoin transaction spends whole coins and sends the leftover back as change, often to a new address controlled by the sender. The total output value therefore includes that change. The amount that actually moved between different owners is usually smaller and cannot be known for certain from the chain alone.',
  },
  {
    question: 'Can whale tracking predict the price?',
    answer:
      'There is no reliable evidence that it can. Large transfers are visible to everyone at the same time, their purpose is usually unknown, and much whale activity happens off-chain inside exchanges or through OTC desks. It is useful context, not a trading signal.',
  },
  {
    question: 'Does this page offer whale alerts?',
    answer:
      'No. We show the largest transactions in the latest blocks and explain how to read them. We do not send alerts or label who owns an address.',
  },
];

const SIGNALS: { move: string; oftenRead: string; caveat: string }[] = [
  {
    move: 'Large transfer into an exchange wallet',
    oftenRead: 'Whale preparing to sell',
    caveat: 'Could be collateral, market-making inventory, OTC settlement, or the exchange moving its own funds between wallets.',
  },
  {
    move: 'Large transfer out of an exchange',
    oftenRead: 'Whale moving to long-term self-custody (bullish)',
    caveat: 'Could be a custodian, ETF or fund settling, or an exchange rotating cold wallets. It does not tell you anyone bought.',
  },
  {
    move: 'Very old coins moving for the first time in years',
    oftenRead: 'Early holder cashing out',
    caveat: 'Often a security upgrade (moving to a new wallet type), an estate or inheritance transfer, or consolidation, with no sale at all.',
  },
  {
    move: 'Huge transaction between unknown addresses',
    oftenRead: 'Something big is happening',
    caveat: 'Usually wallet maintenance: consolidating many small outputs, or a custodian batching withdrawals. Most of the amount may be change.',
  },
  {
    move: 'A known entity\'s address balance changes',
    oftenRead: 'That company or fund bought or sold',
    caveat: 'Entity labels come from heuristics and are sometimes wrong; public companies disclose holdings in filings, which are the authoritative source.',
  },
];

function shortTxid(txid: string): string {
  return `${txid.slice(0, 8)}…${txid.slice(-6)}`;
}

type LoadResult =
  | { status: 'error'; message: string }
  | { status: 'ready'; snapshot: LargeTransactionsSnapshot };
type LoadState = { status: 'loading' } | LoadResult;

export default function WhaleTrackingPage() {
  // Each result is tagged with the request that produced it, so a retry shows
  // the loading state without a synchronous setState inside the effect.
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<{ key: number; value: LoadResult } | null>(null);
  const state: LoadState = result && result.key === reloadKey ? result.value : { status: 'loading' };

  useEffect(() => {
    const controller = new AbortController();
    fetchLargeTransactions(controller.signal)
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

  const txResult = state.status === 'ready' ? state.snapshot.result : null;
  const errorMessage = state.status === 'error' ? state.message : txResult && !txResult.ok ? txResult.error : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <PageSEO pageKey="whaleTracking" urlPath="/whale-tracking" faqs={FAQS} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8 max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <Waves className="h-8 w-8 text-blue-500 flex-shrink-0" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Bitcoin Whale Tracking: How It Works and What It Signals
            </h1>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Whale tracking means watching the blockchain for very large transfers, which anyone can do because every
            Bitcoin transaction is public. It is useful context but a weak trading signal: most big transfers are
            exchanges, custodians and funds moving their own coins, and the purpose of a transfer is almost never
            visible on-chain. Below are the largest transactions in the latest blocks and a guide to reading them.
          </p>
          <div className="mt-3">
            <LastUpdated date={LAST_UPDATED} label="Guide last reviewed" />
          </div>
        </header>

        <section aria-labelledby="live-heading" aria-busy={state.status === 'loading'}>
          <h2 id="live-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Largest transactions in the latest Bitcoin blocks
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-3xl">
            Ranked by total output value, which <strong>includes change sent back to the sender</strong>, so the amount
            that changed owners is usually smaller. We do not label who sent or received these coins.
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            {state.status === 'loading' && (
              <div className="p-6 space-y-3 animate-pulse" role="status">
                <span className="sr-only">Loading recent transactions</span>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-5 bg-gray-100 dark:bg-gray-700 rounded" />
                ))}
              </div>
            )}

            {errorMessage && (
              <div role="alert" className="p-6 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Live transactions are unavailable right now.</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {errorMessage} You can browse recent blocks directly on{' '}
                    <ExternalLink href="https://mempool.space/blocks">mempool.space</ExternalLink>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setReloadKey((k) => k + 1)}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Retry
                  </button>
                </div>
              </div>
            )}

            {txResult?.ok && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">
                    Largest Bitcoin transactions by total output value in blocks{' '}
                    {txResult.data.blocksScanned.join(', ')}
                  </caption>
                  <thead className="bg-gray-50 dark:bg-gray-900 text-left text-gray-600 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">Transaction</th>
                      <th scope="col" className="px-4 py-3 font-medium text-right">Total output</th>
                      <th scope="col" className="px-4 py-3 font-medium text-right">Fee</th>
                      <th scope="col" className="px-4 py-3 font-medium">Block</th>
                      <th scope="col" className="px-4 py-3 font-medium">Mined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-800 dark:text-gray-200">
                    {txResult.data.transactions.map((tx) => (
                      <tr key={tx.txid}>
                        <td className="px-4 py-3 font-mono">
                          <ExternalLink href={`https://mempool.space/tx/${tx.txid}`}>{shortTxid(tx.txid)}</ExternalLink>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap font-semibold">
                          {satsToBtc(tx.outputValueSats).toLocaleString('en-US', { maximumFractionDigits: 2 })} BTC
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {tx.feeSats.toLocaleString('en-US')} sats
                        </td>
                        <td className="px-4 py-3">{tx.blockHeight.toLocaleString('en-US')}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(tx.blockTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
                  Blocks {txResult.data.blocksScanned.map((h) => h.toLocaleString('en-US')).join(', ')} &middot; as of{' '}
                  {formatDateTime(txResult.asOf)} &middot; Source:{' '}
                  <ExternalLink href={txResult.sourceUrl}>{txResult.source}</ExternalLink>. Click a transaction to see its
                  inputs and outputs.
                </p>
              </div>
            )}
          </div>
        </section>

        <div className="max-w-3xl">
          <Section id="what-heading" title="What is a whale?">
            <p>
              &quot;Whale&quot; is informal slang for a holder big enough to move the market. There is no official
              cut-off. For Bitcoin, 1,000 BTC or more is a common rule of thumb; some analysts use 100 BTC or 10,000
              BTC instead.
            </p>
            <p>
              Addresses are not people. The addresses with the biggest balances mostly belong to exchanges, custodians
              and funds that hold coins for thousands of customers. A single individual, meanwhile, can spread coins
              across hundreds of addresses. That is why &quot;number of whale addresses&quot; statistics need care.
            </p>
          </Section>

          <Section id="howto-heading" title="How to track whales yourself (free)">
            <ol className="list-decimal pl-5 space-y-3">
              <li>
                <strong>Use a block explorer.</strong>{' '}
                <ExternalLink href="https://mempool.space">mempool.space</ExternalLink> shows every Bitcoin block,
                transaction and address. Open a large transaction to see its inputs (where the coins came from) and
                outputs (where they went, including change). For Ethereum, use{' '}
                <ExternalLink href="https://etherscan.io">Etherscan</ExternalLink>.
              </li>
              <li>
                <strong>Watch an address.</strong> Paste an address into the explorer to see its balance and history.
                Some explorers and wallets let you subscribe to an address and get notified when it moves.
              </li>
              <li>
                <strong>Use labelled analytics carefully.</strong> Services such as{' '}
                <ExternalLink href="https://intel.arkm.com">Arkham</ExternalLink> attach entity names to addresses, and{' '}
                <ExternalLink href="https://whale-alert.io">Whale Alert</ExternalLink> publishes large transfers as they
                happen. Their labels come from their own heuristics and can be wrong or out of date.
              </li>
              <li>
                <strong>Go to primary disclosures for companies and funds.</strong> Public companies report Bitcoin
                holdings in their filings (search{' '}
                <ExternalLink href="https://www.sec.gov/edgar/search/">SEC EDGAR</ExternalLink>), and spot Bitcoin ETF
                issuers publish their holdings on their own websites. These are more reliable than address guesses.
              </li>
            </ol>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We have no affiliation with the services named above and are not paid to mention them.
            </p>
          </Section>

          <Section id="signals-heading" title="What whale moves do and do not signal">
            <p>
              Large transfers are public the moment they confirm, so everyone sees them at once, and the reason behind
              them is almost never visible. Here is how common moves are read, and why that reading is often wrong.
            </p>
          </Section>
        </div>

        <div className="mt-4 overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <table className="w-full text-sm">
            <caption className="sr-only">Common whale moves, how they are often interpreted, and caveats</caption>
            <thead className="bg-gray-50 dark:bg-gray-900 text-left text-gray-600 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">On-chain move</th>
                <th scope="col" className="px-4 py-3 font-medium">Often read as</th>
                <th scope="col" className="px-4 py-3 font-medium">What it might actually be</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-800 dark:text-gray-200 align-top">
              {SIGNALS.map((s) => (
                <tr key={s.move}>
                  <th scope="row" className="px-4 py-3 font-medium text-left">{s.move}</th>
                  <td className="px-4 py-3">{s.oftenRead}</td>
                  <td className="px-4 py-3">{s.caveat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="max-w-3xl">
          <Section id="limits-heading" title="Blind spots">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Off-chain trading.</strong> Trades inside an exchange or through OTC desks change who owns coins
                without any on-chain transaction.
              </li>
              <li>
                <strong>Change outputs.</strong> A &quot;10,000 BTC transaction&quot; may move only a small fraction to
                someone else.
              </li>
              <li>
                <strong>Privacy techniques.</strong> CoinJoin and similar methods deliberately break the link between
                inputs and outputs.
              </li>
              <li>
                <strong>Timing.</strong> By the time a transfer is on social media, it is already public; any edge is
                gone.
              </li>
            </ul>
          </Section>

          <div className="mt-8">
            <NotAdviceNote />
          </div>

          <FaqSection faqs={FAQS} />

          <RelatedLinks
            links={[
              { to: '/onchain-analytics', title: 'Bitcoin on-chain metrics', description: 'Hashrate, fees, mempool and activity, explained.' },
              { to: '/scam-database', title: 'Scam database', description: 'Fake "whale signal" groups are a common scam.' },
              { to: '/trading-indicators', title: 'Trading indicators', description: 'RSI, MACD and Bollinger Bands on live prices.' },
              { to: '/learn/crypto-wallets-explained', title: 'Crypto wallets explained', description: 'Addresses, keys and change outputs.' },
              { to: '/learn/risk-management', title: 'Risk management', description: 'Why no single signal should drive a trade.' },
              { to: '/glossary', title: 'Crypto glossary', description: 'Plain-English definitions.' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
