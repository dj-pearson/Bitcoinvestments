/**
 * /about - who runs the site, editorial policy, how we make money,
 * corrections, and contact. Everything here is a statement of how the site
 * works today; do not add claims (team size, credentials, audience numbers)
 * that the owner has not supplied.
 */

import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { PAGE_METADATA, SEO_CONFIG } from '../lib/seo';

const LAST_UPDATED_ISO = '2026-09-23';
const LAST_UPDATED_LABEL = 'September 23, 2026';
const SUPPORT_EMAIL = 'support@bitcoinvestments.net';

// NEEDS-OWNER: add the people behind the site (names, roles, relevant
// experience, links) and, for tax content, the reviewer. Until then the page
// says author profiles are coming rather than inventing them.
const TEAM: Array<{ name: string; role: string; bio: string }> = [];

export function About() {
  const meta = PAGE_METADATA.about;
  const url = `${SEO_CONFIG.siteUrl}/about`;

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      '@id': `${url}#webpage`,
      url,
      name: meta.title,
      description: meta.description,
      dateModified: LAST_UPDATED_ISO,
      isPartOf: { '@id': `${SEO_CONFIG.siteUrl}/#website` },
      mainEntity: { '@id': `${SEO_CONFIG.siteUrl}/#organization` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${SEO_CONFIG.siteUrl}/#organization`,
      name: SEO_CONFIG.siteName,
      url: SEO_CONFIG.siteUrl,
      logo: `${SEO_CONFIG.siteUrl}/logo.png`,
      contactPoint: {
        '@type': 'ContactPoint',
        email: SUPPORT_EMAIL,
        contactType: 'customer support',
      },
      publishingPrinciples: url,
      correctionsPolicy: `${url}#corrections`,
      ethicsPolicy: `${url}#editorial-policy`,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO title={meta.title} description={meta.description} keywords={meta.keywords} modifiedTime={LAST_UPDATED_ISO} schema={schema} />

      <h1 className="text-4xl font-bold text-white mb-4">About Bitcoinvestments</h1>
      <p className="text-xl text-gray-300 mb-2">
        Bitcoinvestments is a free, independent website that teaches beginners how to invest in
        Bitcoin and other cryptocurrencies safely. We publish guides, calculators, exchange and
        wallet comparisons and a scam database. We are not a bank, broker, exchange or financial
        adviser, and nothing we publish is personal financial advice.
      </p>
      <p className="text-sm text-gray-400 mb-10">
        Last updated: <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED_LABEL}</time>
      </p>

      <div className="prose prose-invert max-w-none space-y-10">
        <section aria-labelledby="who-heading">
          <h2 id="who-heading">Who we are</h2>
          <p>
            We started Bitcoinvestments for people who want to understand crypto before they put
            money into it: what it is, how to buy and store it, what it costs, and how people lose
            money to mistakes and scams.
          </p>
          {TEAM.length > 0 ? (
            <ul>
              {TEAM.map((person) => (
                <li key={person.name}>
                  <strong>{person.name}</strong>, {person.role}. {person.bio}
                </li>
              ))}
            </ul>
          ) : (
            <p>Author profiles are coming soon.</p>
          )}
          <p>
            We will never ask you to send us cryptocurrency, share a seed phrase or install
            software. Anyone claiming to be us who does is a scammer.
          </p>
        </section>

        <section aria-labelledby="editorial-heading" id="editorial-policy">
          <h2 id="editorial-heading">Editorial policy</h2>
          <ul>
            <li>
              <strong>Education, not advice.</strong> We explain how things work and what the risks
              are. We don&apos;t tell you what to buy or when, and we don&apos;t publish price
              predictions or trading signals.
            </li>
            <li>
              <strong>Primary sources for facts that change.</strong> Fees, rules, tax thresholds and
              product details are checked against the provider&apos;s or regulator&apos;s own pages,
              and pages with such facts show when they were last checked.
            </li>
            <li>
              <strong>No invented numbers.</strong> We don&apos;t publish made-up ratings, reviews,
              testimonials, user counts or returns. If we don&apos;t have real data, we say so.
            </li>
            <li>
              <strong>Dates on pages.</strong> Guides and tools show a &ldquo;last updated&rdquo; or
              &ldquo;last reviewed&rdquo; date so you can judge how current they are.
            </li>
            <li>
              <strong>AI tools.</strong> We may use AI tools to help research or draft articles. We
              are responsible for everything we publish, whoever or whatever drafted it.
              {/* NEEDS-OWNER: describe the human review step for AI-assisted drafts. */}
            </li>
          </ul>
        </section>

        <section aria-labelledby="money-heading" id="how-we-make-money">
          <h2 id="money-heading">How we make money</h2>
          <p>Everything on the site is free to read and use. We pay for it in these ways:</p>
          <ul>
            <li>
              <strong>Affiliate links.</strong> Some links to exchanges, wallets and other services
              are affiliate links. If you sign up or buy through one, the provider may pay us a
              commission. It doesn&apos;t change the price you pay. See our{' '}
              <Link to="/disclaimer#affiliate-disclosure">affiliate disclosure</Link>.
            </li>
            <li>
              <strong>Sponsored content.</strong> Companies sometimes pay to publish an article or
              placement. Sponsored content is labelled as sponsored and says who paid for it.
            </li>
            <li>
              <strong>Premium (planned).</strong> We plan to offer optional paid features for people
              with accounts. They are not on sale yet; see <Link to="/pricing">pricing</Link>.
            </li>
          </ul>
          <p>
            Payment doesn&apos;t buy a better review. Sponsored or affiliate status never decides the
            order of our comparisons, and we cover the downsides of products we link to.
          </p>
        </section>

        <section aria-labelledby="corrections-heading" id="corrections">
          <h2 id="corrections-heading">Corrections</h2>
          <p>
            If you find a mistake, email{' '}
            <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Correction')}`}>{SUPPORT_EMAIL}</a>{' '}
            with the page address and what is wrong. We check every report. When we fix a factual
            error that could have affected a reader&apos;s decision, we update the page&apos;s date
            and say what changed.
          </p>
        </section>

        <section aria-labelledby="risk-heading">
          <h2 id="risk-heading">Not financial advice</h2>
          <p>
            Crypto prices can fall sharply and you can lose all the money you put in. Our content is
            general and doesn&apos;t consider your circumstances. Read our full{' '}
            <Link to="/disclaimer">disclaimer</Link>, and consider speaking to a regulated
            financial adviser before investing.
          </p>
        </section>

        <section aria-labelledby="contact-heading">
          <h2 id="contact-heading">Contact</h2>
          <ul>
            <li>
              General questions and corrections:{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            </li>
            <li>
              Privacy requests: <a href="mailto:privacy@bitcoinvestments.net">privacy@bitcoinvestments.net</a>
            </li>
            <li>
              Accessibility problems:{' '}
              <a href="mailto:accessibility@bitcoinvestments.net">accessibility@bitcoinvestments.net</a>
            </li>
          </ul>
          <p>
            Related: <Link to="/privacy">Privacy Policy</Link> · <Link to="/terms">Terms of Service</Link> ·{' '}
            <Link to="/accessibility">Accessibility statement</Link>
          </p>
        </section>
      </div>
    </div>
  );
}

export default About;
