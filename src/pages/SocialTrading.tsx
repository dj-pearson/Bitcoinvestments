/**
 * /social-trading
 *
 * "Copy trading explained": an educational guide to how crypto copy trading
 * works, where it is offered, what it costs and why leaderboards mislead.
 *
 * This page previously showed invented traders, returns and platform stats
 * to sell a subscription that did not exist. It now contains no traders, no
 * performance figures and no upsell. Platform availability facts carry a
 * visible "last verified" date and link to the platform's own pages.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
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

const LAST_UPDATED = '2026-09-23';
const PLATFORMS_LAST_VERIFIED = '2026-09-23';

const FAQS: FaqItem[] = [
  {
    question: 'What is crypto copy trading?',
    answer:
      'Copy trading lets you link part of your account to another trader so their trades are automatically repeated in your account, scaled to the amount you allocate. You keep ownership of your funds on the platform, but you give up control over individual trades, and you take the same losses the trader takes.',
  },
  {
    question: 'Is copy trading legal in the US?',
    answer:
      'It can be, when it is offered by a platform licensed to serve US customers. eToro began rolling out its CopyTrader feature to US users in October 2025, in eligible states only. Most large offshore exchanges that offer crypto copy trading, such as Bybit and Bitget, do not accept US residents, and using a VPN to get around that breaks their terms and puts your funds at risk.',
  },
  {
    question: 'Is copy trading profitable?',
    answer:
      'For some people, some of the time. Leaderboards show the traders who happened to do well recently, not those who will do well next, and your results will usually lag the trader\'s because of fees, slippage and joining after their best run. Many copiers lose money, especially when the strategies use leverage.',
  },
  {
    question: 'What fees does copy trading have?',
    answer:
      'Common costs are trading fees or spreads on every copied trade, a profit share paid to the trader on some platforms, funding fees on leveraged positions, and slippage because your orders fill after the trader\'s. Check the fee page of the specific platform before you start.',
  },
  {
    question: 'How do I choose a trader to copy?',
    answer:
      'Look for a long track record (years, not weeks) that includes a bear market, a maximum drawdown you could live through, low or no leverage, a strategy you understand, and a trader who has personal money at stake. Be wary of very high recent returns, which usually mean very high risk.',
  },
  {
    question: 'Does Bitcoinvestments offer copy trading?',
    answer:
      'No. We do not offer copy trading, signals or a trader marketplace, and we do not recommend any individual trader. This page is an independent guide.',
  },
];

const PLATFORMS: { name: string; offering: string; us: string; link: { href: string; label: string } }[] = [
  {
    name: 'eToro',
    offering: 'CopyTrader: copy other users\' portfolios across stocks, ETFs and crypto.',
    us: 'Rolling out to US users since October 2025, in eligible states only; US users can copy other US users. eToro says its crypto service (eToro USA LLC) is not available in NY, NV, HI, Puerto Rico or the US Virgin Islands.',
    link: { href: 'https://www.etoro.com/en-us/copytrader/', label: 'eToro US CopyTrader page' },
  },
  {
    name: 'Offshore crypto exchanges (for example Bybit, Bitget, and the global Binance and OKX platforms)',
    offering: 'Exchange-native copy trading, often of leveraged futures strategies, with profit sharing for lead traders.',
    us: 'Their terms exclude US residents. Accessing them through a VPN breaches those terms and can lead to frozen accounts, with no US regulator to turn to.',
    link: { href: 'https://www.coindesk.com/business/2024/11/19/bybit-bitget-okx-vpn-geofencing-kyc-binance', label: 'CoinDesk on offshore exchange geofencing' },
  },
  {
    name: 'US-licensed crypto exchanges (for example Coinbase, Kraken, Binance.US, OKX US)',
    offering: 'Spot buying and selling, sometimes recurring buys.',
    us: 'State availability varies for some of them. These are primarily spot platforms; check each platform\'s current product list before assuming a copy feature exists.',
    link: { href: '/compare', label: 'Compare exchanges' },
  },
];

const RISKS: { title: string; body: string }[] = [
  {
    title: 'Survivorship bias',
    body: 'Leaderboards rank the traders who survived and did well recently. The ones who blew up have disappeared from the list, so the list makes trading look easier than it is.',
  },
  {
    title: 'Leverage and liquidation',
    body: 'Many crypto copy-trading strategies use futures with leverage. A move of a few percent against a 20x position can wipe out the whole allocation, and you inherit that risk automatically.',
  },
  {
    title: 'Drawdowns you cannot sit through',
    body: 'A trader with +200% over a year may have been down 60% along the way. Many copiers stop copying near the bottom, locking in the loss and missing the recovery.',
  },
  {
    title: 'Execution lag and slippage',
    body: 'Your order fills after the trader\'s, often at a worse price. For fast strategies and small coins, that gap can erase the edge completely.',
  },
  {
    title: 'Strategy drift',
    body: 'The trader can change style, add leverage or start trading coins they never traded before, and your money follows them.',
  },
  {
    title: 'Incentives',
    body: 'Lead traders are often paid a share of copiers\' profits or rewarded for attracting followers. That encourages short bursts of high returns, not durable risk management.',
  },
  {
    title: 'Platform and counterparty risk',
    body: 'Your funds sit on the platform. If it fails, freezes withdrawals or is offshore and unregulated, you may not get them back.',
  },
  {
    title: 'Scams dressed as copy trading',
    body: 'Telegram "signal" groups, fake trading apps and romance scams often use copy trading as the hook. If someone you met online shows you screenshots of profits and a platform you have not heard of, walk away.',
  },
];

const CHECKLIST = [
  'How long is the track record, and does it include a crash or a bear market?',
  'What was the largest peak-to-trough loss (maximum drawdown)? Could I stay invested through twice that?',
  'Does the trader use leverage? How much, and on what?',
  'How many trades a week? High frequency means more fees and more slippage for me.',
  'Is the record verified by the platform from real account data, or self-reported?',
  'How is the trader paid, and does that reward risk-taking?',
  'What does the platform charge me, in total, per trade and per year?',
  'Which legal entity am I dealing with, and is it registered where I live?',
  'Can I set a stop-loss on the whole copy allocation?',
  'Is this money I can afford to lose entirely?',
];

function SurvivorshipDemo() {
  const [traders, setTraders] = useState(1000);
  const [rounds, setRounds] = useState(5);
  const expected = traders / 2 ** rounds;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Worked example: luck on a leaderboard</h3>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        Imagine traders with no skill at all, each with a 50/50 chance of a winning month. How many will show a
        perfect winning streak purely by chance?
      </p>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="st-traders" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Number of traders
          </label>
          <input
            id="st-traders"
            type="number"
            min={1}
            max={1000000}
            value={traders}
            onChange={(e) => setTraders(Math.max(1, Math.min(1000000, Number(e.target.value) || 1)))}
            className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="st-rounds" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Winning months in a row
          </label>
          <input
            id="st-rounds"
            type="number"
            min={1}
            max={24}
            value={rounds}
            onChange={(e) => setRounds(Math.max(1, Math.min(24, Number(e.target.value) || 1)))}
            className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white"
          />
        </div>
      </div>
      <p className="text-gray-900 dark:text-white" aria-live="polite">
        Expected number with a perfect {rounds}-month streak by luck alone:{' '}
        <strong>{expected >= 10 ? Math.round(expected).toLocaleString('en-US') : expected.toFixed(2)}</strong>{' '}
        (that is {traders.toLocaleString('en-US')} &divide; 2<sup>{rounds}</sup>).
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
        With 1,000 traders and 5 months, about 31 have a flawless record without any skill. A platform with tens of
        thousands of lead traders will always have an impressive-looking top 10.
      </p>
    </div>
  );
}

export default function SocialTrading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <PageSEO pageKey="socialTrading" urlPath="/social-trading" faqs={FAQS} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Users className="h-8 w-8 text-purple-500 flex-shrink-0" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Copy Trading Crypto, Explained: How It Works and the Real Risks
            </h1>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Copy trading automatically repeats another trader&apos;s trades in your account, in proportion to the money
            you allocate. It is legal in the US only through platforms licensed to offer it, and it does not remove
            risk: you inherit the trader&apos;s losses and leverage, pay extra fees, and usually choose from
            leaderboards that reward luck. This guide explains how it works, where it is offered, what it costs and
            what to check first.
          </p>
          <div className="mt-3">
            <LastUpdated date={LAST_UPDATED} />
          </div>
        </header>

        <NotAdviceNote>
          Bitcoinvestments does not offer copy trading or signals and does not recommend any trader or platform. This
          guide is educational, not financial advice.
        </NotAdviceNote>

        <Section id="how-heading" title="How copy trading works">
          <ol className="list-decimal pl-5 space-y-2">
            <li>You open an account with a platform that offers copy trading and deposit funds.</li>
            <li>
              You browse a list of &quot;lead traders&quot; with their past returns, risk scores and number of copiers.
            </li>
            <li>
              You allocate an amount to one trader. When they open or close a position, the platform places the same
              trade for you, scaled to your allocation. If they put 10% of their account into a trade, 10% of your
              allocation goes in too.
            </li>
            <li>
              You can usually stop copying at any time and set a stop-loss on the whole allocation. Open positions may
              be closed at market price when you stop.
            </li>
          </ol>
          <p>
            <strong>Social trading</strong> is the broader idea: sharing trades and portfolios publicly so others can
            follow along. <strong>Copy trading</strong> is the automated version. Related but different are
            paid &quot;signal&quot; groups (someone tells you what to trade and you place the order yourself) and
            copying on-chain &quot;smart money&quot; wallets, both of which carry extra scam and execution risk.
          </p>
        </Section>

        <Section id="where-heading" title="Where copy trading is offered, and US availability">
          <p className="text-sm">
            Availability changes often. Last verified: <time dateTime={PLATFORMS_LAST_VERIFIED}>September 23, 2026</time>.
            Always confirm on the platform&apos;s own site for your state.
          </p>
          <div className="space-y-4">
            {PLATFORMS.map((p) => (
              <article key={p.name} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white">{p.name}</h3>
                <dl className="mt-2 space-y-2 text-sm">
                  <div>
                    <dt className="font-medium text-gray-900 dark:text-white">What they offer</dt>
                    <dd>{p.offering}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-900 dark:text-white">For US residents</dt>
                    <dd>{p.us}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-sm">
                  {p.link.href.startsWith('/') ? (
                    <Link to={p.link.href} className="text-blue-600 dark:text-blue-400 underline">
                      {p.link.label}
                    </Link>
                  ) : (
                    <ExternalLink href={p.link.href}>{p.link.label}</ExternalLink>
                  )}
                </p>
              </article>
            ))}
          </div>
          <p>
            <strong>Who regulates it?</strong> There is no US law specific to &quot;copy trading&quot;. Which rules
            apply depends on what is being copied (stocks, spot crypto or crypto derivatives) and how the lead trader
            is paid. Before you deposit, find the legal entity named in the platform&apos;s terms and look it up:{' '}
            <ExternalLink href="https://brokercheck.finra.org">FINRA BrokerCheck</ExternalLink> for broker-dealers,{' '}
            <ExternalLink href="https://www.nfa.futures.org/BasicNet/">NFA BASIC</ExternalLink> for futures firms, and
            your state&apos;s financial regulator for money-transmitter licences. The CFTC has also warned the public
            about{' '}
            <ExternalLink href="https://www.cftc.gov/LearnAndProtect/AdvisoriesAndArticles/CustomerAdvisory_SocialMedia_Metals.html">
              trading on social-media hype
            </ExternalLink>
            .
          </p>
        </Section>

        <Section id="cost-heading" title="What it really costs">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Trading fees or spreads</strong> on every copied trade. An active trader making 50 trades a
              month multiplies those costs.
            </li>
            <li>
              <strong>Profit share.</strong> On many exchange copy-trading products the lead trader takes a percentage
              of your profits. The rate varies by platform and by trader, so check the exact figure first.
            </li>
            <li>
              <strong>Funding fees</strong> on leveraged perpetual futures, charged every few hours while positions
              are open.
            </li>
            <li>
              <strong>Slippage</strong>, because your orders fill after the trader&apos;s.
            </li>
            <li>
              <strong>Taxes.</strong> In the US every copied crypto sale can be a taxable event, so an active strategy
              can create hundreds of short-term gains and losses to report. See our{' '}
              <Link to="/learn/crypto-taxes-basics" className="text-blue-600 dark:text-blue-400 underline">
                crypto tax basics
              </Link>
              .
            </li>
          </ul>
        </Section>

        <Section id="risk-heading" title="The risks, plainly">
          <dl className="grid sm:grid-cols-2 gap-4">
            {RISKS.map((r) => (
              <div key={r.title} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <dt className="font-semibold text-gray-900 dark:text-white">{r.title}</dt>
                <dd className="mt-1 text-sm">{r.body}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <div className="mt-8">
          <SurvivorshipDemo />
        </div>

        <Section id="checklist-heading" title="Questions to ask before copying anyone">
          <ol className="list-decimal pl-5 space-y-2">
            {CHECKLIST.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
        </Section>

        <Section id="alt-heading" title="Alternatives worth considering">
          <p>
            If the appeal of copy trading is &quot;I do not have time to research&quot;, simpler approaches often fit
            better: buying a fixed amount on a schedule (
            <Link to="/learn/dca-strategies" className="text-blue-600 dark:text-blue-400 underline">
              dollar-cost averaging
            </Link>
            ), holding a small allocation you rebalance once or twice a year (
            <Link to="/learn/portfolio-rebalancing" className="text-blue-600 dark:text-blue-400 underline">
              rebalancing guide
            </Link>
            ), or learning enough to make your own decisions.
          </p>
        </Section>

        <FaqSection faqs={FAQS} />

        <RelatedLinks
          links={[
            { to: '/learn/risk-management', title: 'Risk management', description: 'Position sizing and drawdowns.' },
            { to: '/scam-database', title: 'Scam database', description: 'Fake trading platforms and signal groups.' },
            { to: '/compare', title: 'Compare exchanges', description: 'US-available platforms side by side.' },
            { to: '/backtesting', title: 'Backtesting tool', description: 'See how a simple strategy held up.' },
            { to: '/trading-indicators', title: 'Trading indicators', description: 'What RSI and MACD actually measure.' },
            { to: '/learn/common-crypto-mistakes', title: 'Common crypto mistakes', description: 'Chasing returns and other traps.' },
          ]}
        />
      </div>
    </div>
  );
}
