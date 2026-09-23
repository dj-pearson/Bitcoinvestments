/**
 * /disclaimer - risk disclaimer and affiliate disclosure.
 *
 * Rendered by Terms.tsx when the path is /disclaimer (App.tsx routes both
 * paths to <Terms />), and exported so the route can point here directly.
 */

import { Link } from 'react-router-dom';
import { PageSEO } from '../components/PageSEO';

const LAST_UPDATED_ISO = '2026-09-23';
const LAST_UPDATED_LABEL = 'September 23, 2026';

export function Disclaimer() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <PageSEO pageKey="disclaimer" urlPath="/disclaimer" />
      <h1 className="text-4xl font-bold text-white mb-4">Disclaimer &amp; Affiliate Disclosure</h1>
      <p className="text-xl text-gray-300 mb-2">
        Bitcoinvestments publishes general education about cryptocurrency. It is not financial,
        investment, tax or legal advice. Crypto is high risk and you can lose everything you put
        in. Some of our links earn us a commission, and we label them.
      </p>
      <p className="text-gray-400 mb-8">
        Last updated: <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED_LABEL}</time>
      </p>

      <div className="prose prose-invert max-w-none space-y-8">
        <section>
          <h2>Not financial advice</h2>
          <p>
            Our guides, calculators, comparisons and emails are for general information. They
            don&apos;t take your finances, goals or tax position into account, and they are not a
            recommendation to buy, sell or hold any asset. We are not a regulated financial
            adviser, broker or exchange.
          </p>
        </section>

        <section>
          <h2>Investment risks</h2>
          <ul>
            <li>Crypto prices can move sharply in hours; falls of more than 50% have happened many times.</li>
            <li>You can lose some or all of the money you invest.</li>
            <li>Past performance, including any backtest or projection on this site, does not predict future results.</li>
            <li>Crypto is often not covered by deposit insurance or investor compensation schemes, and rules differ by country.</li>
            <li>Exchanges and lending platforms can fail, freeze withdrawals or be hacked.</li>
            <li>Lost keys or seed phrases usually mean lost funds, with no way to recover them.</li>
            <li>Tax treatment varies by country and can be complex.</li>
          </ul>
        </section>

        <section>
          <h2>Calculators and data</h2>
          <p>
            Calculators give estimates based on the inputs and assumptions shown on each tool.
            Prices, fees and market data come from third parties (such as CoinGecko and
            alternative.me), can be delayed or wrong, and may be unavailable. Check figures with the
            provider before acting on them.
          </p>
        </section>

        <section>
          <h2>Do your own research</h2>
          <ul>
            <li>Read the provider&apos;s own terms, fees and risk warnings.</li>
            <li>Check that a platform is allowed to serve customers where you live.</li>
            <li>Consider your finances and how much loss you can bear.</li>
            <li>Consider speaking to a regulated financial, tax or legal professional.</li>
            <li>Never invest money you can&apos;t afford to lose.</li>
          </ul>
        </section>

        <section id="affiliate-disclosure">
          <h2>Affiliate disclosure</h2>
          <p>
            Some links on this site are affiliate links. If you click one and sign up or buy, the
            company may pay us a commission. You don&apos;t pay more because of it. This is one of
            the ways we keep the site free (see{' '}
            <Link to="/about#how-we-make-money">how we make money</Link>).
          </p>
          <p>
            Pages that contain affiliate links carry a disclosure. A commission never decides the
            order of our comparisons, and we describe the downsides of products we link to.
          </p>
        </section>

        <section id="sponsored-content">
          <h2>Sponsored content</h2>
          <p>
            When a company pays for an article or placement, it is labelled as sponsored and says
            who paid for it. Sponsored content is the sponsor&apos;s message, not our
            recommendation.
          </p>
        </section>

        <section>
          <h2>Third-party websites</h2>
          <p>
            We link to exchanges, wallets, news sites and other services we don&apos;t control. We
            are not responsible for their content, availability, security or privacy practices, and
            a link is not an endorsement.
          </p>
        </section>

        <section>
          <h2>No guarantees</h2>
          <p>
            We work to keep content accurate and current, but we can&apos;t guarantee that
            everything is complete, correct or up to date, or that the site will always be
            available. If you spot a mistake, please{' '}
            <Link to="/about#corrections">tell us</Link>.
          </p>
        </section>

        <section>
          <h2>Limitation of liability</h2>
          <p>
            To the extent the law allows, Bitcoinvestments and its owners and contributors are not
            liable for losses arising from your use of this site or reliance on its content. Nothing
            here limits liability that cannot be limited by law. Our{' '}
            <Link to="/terms">Terms of Service</Link> set out the full terms.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Questions about this page:{' '}
            <a href="mailto:legal@bitcoinvestments.net">legal@bitcoinvestments.net</a>.
          </p>
        </section>

        <nav aria-label="Legal pages" className="mt-12 pt-8 border-t border-gray-700 flex flex-wrap gap-4 not-prose">
          <Link to="/" className="text-orange-500 hover:text-orange-400">&larr; Home</Link>
          <Link to="/terms" className="text-orange-500 hover:text-orange-400">Terms of Service</Link>
          <Link to="/privacy" className="text-orange-500 hover:text-orange-400">Privacy Policy</Link>
          <Link to="/about" className="text-orange-500 hover:text-orange-400">About us</Link>
        </nav>
      </div>
    </div>
  );
}

export default Disclaimer;
