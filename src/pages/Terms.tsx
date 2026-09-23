import { Link, useLocation } from 'react-router-dom';

import { PageSEO } from '../components/PageSEO';
import { Disclaimer } from './Disclaimer';

// Fixed date these terms were last updated. Update when the content changes;
// do not render a live clock, which would misrepresent the last-updated date.
const LAST_UPDATED_ISO = '2026-09-23';
const LAST_UPDATED_LABEL = 'September 23, 2026';

/** Visible placeholder for facts only the owner can supply. */
function OwnerPlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-1 rounded bg-amber-500/15 text-amber-200 border border-amber-500/30">
      [{children}]
    </span>
  );
}

export function Terms() {
  const location = useLocation();

  // App.tsx routes /disclaimer here too; it gets its own page and SEO.
  if (location.pathname === '/disclaimer') {
    return <Disclaimer />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <PageSEO pageKey="terms" urlPath="/terms" />
      <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
      <p className="text-xl text-gray-300 mb-2">
        These terms cover your use of bitcoinvestments.net. In short: the content is free general
        education, not financial advice; use it lawfully; and we are not responsible for your
        investment decisions. Accounts, paid plans and the developer API are not available yet.
      </p>
      <p className="text-gray-400 text-lg mb-8">
        Last updated: <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED_LABEL}</time>
      </p>

      <div className="prose prose-invert max-w-none space-y-8">
        <section>
          <h2>Who we are</h2>
          <p>
            Bitcoinvestments (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is operated by{' '}
            {/* NEEDS-OWNER: legal entity name, registered address and company number. */}
            <OwnerPlaceholder>legal entity name and registered address to be added</OwnerPlaceholder>.
            Contact: <a href="mailto:legal@bitcoinvestments.net">legal@bitcoinvestments.net</a>.
          </p>
        </section>

        <section>
          <h2>Agreement to these terms</h2>
          <p>
            By using the website you agree to these terms. If you don&apos;t agree, please don&apos;t
            use the site.
          </p>
        </section>

        <section>
          <h2>What is available today</h2>
          <p>
            The guides, calculators, comparisons, market pages and scam database are free and need
            no account. Accounts, paid plans (Premium) and developer API keys are not currently
            available. The sections below on accounts, subscriptions and the API apply once those
            features open.
          </p>
        </section>

        <section>
          <h2>Using our content</h2>
          <p>You may read, use and share links to our content for personal, non-commercial purposes. You may not:</p>
          <ul>
            <li>republish or sell substantial parts of our content without permission;</li>
            <li>remove copyright or attribution notices;</li>
            <li>
              access the site with automated tools in a way that harms its performance or
              circumvents rate limits (search engines and normal link previews are fine);
            </li>
            <li>use the site to break the law, spread malware or attempt unauthorised access.</li>
          </ul>
          <p>
            Short quotations with a link back to the source page are welcome. Data access for
            software is offered only through our developer API, under the API terms below.
          </p>
        </section>

        <section>
          <h2>Education, not advice</h2>
          <p>
            Our content and tools are general information and do not take your circumstances into
            account. They are not financial, investment, tax or legal advice. Read our{' '}
            <Link to="/disclaimer" className="text-orange-500 hover:text-orange-400">
              Disclaimer
            </Link>{' '}
            before relying on anything here.
          </p>
        </section>

        <section id="accounts">
          <h2>Accounts (when available)</h2>
          <p>If you create an account, you agree to:</p>
          <ul>
            <li>give accurate information and keep it up to date;</li>
            <li>keep your login details secure and tell us about unauthorised use;</li>
            <li>be responsible for activity under your account.</li>
          </ul>
          <p>
            We may suspend or close accounts that break these terms. You can close your account at
            any time.
          </p>
        </section>

        <section id="subscriptions">
          <h2>Subscriptions and payments (when available)</h2>
          <p>
            Paid plans are not on sale. When they are, these terms will apply alongside the price
            and plan details shown at checkout:
          </p>
          <ul>
            <li>Payments are processed by Stripe. We don&apos;t store your full card details.</li>
            <li>
              Monthly and annual subscriptions renew automatically at the end of each period until
              you cancel.
            </li>
            <li>
              You can cancel at any time from the billing portal in your profile. You keep paid
              features until the end of the period you have paid for.
            </li>
            <li>
              Refunds:{' '}
              {/* NEEDS-OWNER: refund policy (window, pro-rating, lifetime and one-off purchases). */}
              <OwnerPlaceholder>refund policy to be confirmed before paid plans launch</OwnerPlaceholder>.
              This does not affect any rights you have under consumer law where you live, such as
              a statutory cancellation period.
            </li>
            <li>
              We will tell existing subscribers by email before a price change takes effect, and
              you can cancel before it applies.
            </li>
          </ul>
        </section>

        <section id="api">
          <h2>Developer API (when available)</h2>
          <p>
            API keys are not being issued yet. Once they are, use of the API at{' '}
            <code>/api/v1</code> is subject to these terms and the following:
          </p>
          <ul>
            <li>Keep your keys secret; you are responsible for requests made with them.</li>
            <li>Stay within your plan&apos;s rate limits. We may throttle or revoke keys that are abused.</li>
            <li>
              Market data comes from third parties, chiefly CoinGecko, and may be delayed,
              incomplete or wrong. Their terms may limit how you can use or redistribute it.
              {/* NEEDS-OWNER: confirm CoinGecko's terms permit re-serving its data under a paid API plan. */}
            </li>
            <li>The API is provided &ldquo;as is&rdquo;, without a service-level guarantee unless a written agreement says otherwise.</li>
          </ul>
        </section>

        <section>
          <h2>Third-party links</h2>
          <p>
            We link to exchanges, wallets and other services, some through affiliate links (see
            the{' '}
            <Link to="/disclaimer#affiliate-disclosure" className="text-orange-500 hover:text-orange-400">
              affiliate disclosure
            </Link>
            ). We don&apos;t control those services and are not responsible for their content,
            security or terms.
          </p>
        </section>

        <section>
          <h2>Intellectual property</h2>
          <p>
            The content, design and software of this website belong to us or our licensors.
            Trademarks of other companies belong to their owners and are used only to identify
            their products.
          </p>
        </section>

        <section>
          <h2>Limitation of liability</h2>
          <p>
            To the extent the law allows, we are not liable for investment losses, lost profits,
            data loss or indirect losses arising from your use of the site, its content or its
            tools. Nothing in these terms limits liability that cannot be limited by law.
          </p>
        </section>

        <section>
          <h2>Changes to these terms</h2>
          <p>
            We may update these terms. We will post the new version here and change the date at
            the top. If you have a paid plan, we will email you before a material change affects it.
          </p>
        </section>

        <section>
          <h2>Governing law</h2>
          <p>
            These terms are governed by the laws of{' '}
            {/* NEEDS-OWNER: governing law and courts. */}
            <OwnerPlaceholder>jurisdiction to be confirmed</OwnerPlaceholder>. If you are a consumer,
            you also keep the protections of the law where you live.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Questions about these terms:{' '}
            <a href="mailto:legal@bitcoinvestments.net">legal@bitcoinvestments.net</a>.
          </p>
        </section>

        <nav aria-label="Legal pages" className="mt-12 pt-8 border-t border-gray-700 flex flex-wrap gap-4 not-prose">
          <Link to="/" className="text-orange-500 hover:text-orange-400">
            &larr; Home
          </Link>
          <Link to="/privacy" className="text-orange-500 hover:text-orange-400">
            Privacy Policy
          </Link>
          <Link to="/disclaimer" className="text-orange-500 hover:text-orange-400">
            Disclaimer
          </Link>
          <Link to="/about" className="text-orange-500 hover:text-orange-400">
            About us
          </Link>
        </nav>
      </div>
    </div>
  );
}
