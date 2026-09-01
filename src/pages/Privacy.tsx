import { Link } from 'react-router-dom';
import { reopenConsentBanner } from '@/lib/consent';

import { PageSEO } from '../components/PageSEO';
// Fixed date the policy was last substantively reviewed/updated. Update this
// value whenever the policy changes — do not render a live clock, which would
// misrepresent the policy as always "just updated".
const LAST_UPDATED = 'July 23, 2026';

export function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <PageSEO pageKey="privacy" urlPath="/privacy" />
      <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>

      <div className="prose prose-invert max-w-none space-y-8">
        <p className="text-gray-300 text-lg">Last updated: {LAST_UPDATED}</p>

        <section>
          <h2>Introduction</h2>
          <p>
            Bitcoinvestments ("we," "our," or "us") is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your
            information when you visit our website and use our services, and describes the rights
            you have over your personal data under the EU/UK General Data Protection Regulation
            (GDPR), the California Consumer Privacy Act as amended by the CPRA (CCPA/CPRA), and
            other applicable privacy laws.
          </p>
        </section>

        <section>
          <h2>Data Controller</h2>
          <p>
            Bitcoinvestments is the data controller responsible for your personal data. If you
            have any questions about this policy or wish to exercise your rights, you can contact
            our privacy team at{' '}
            <a href="mailto:privacy@bitcoinvestments.net">privacy@bitcoinvestments.net</a>. A
            postal address for our registered business is available on request.
          </p>
        </section>

        <section>
          <h2>Information We Collect</h2>
          <h3>Personal Information You Provide</h3>
          <p>We may collect personal information that you voluntarily provide, including:</p>
          <ul>
            <li>Email address (when you sign up, subscribe to our newsletter, or contact us)</li>
            <li>Account credentials and profile preferences</li>
            <li>Portfolio and watchlist data you choose to track</li>
            <li>Payment-related information processed by our payment provider (we do not store full card numbers)</li>
            <li>Content you submit, such as scam reports or support requests</li>
          </ul>

          <h3>Information Collected Automatically</h3>
          <p>When you visit our website, we (or our processors) may automatically collect:</p>
          <ul>
            <li>Browser type and version, and operating system</li>
            <li>Pages visited, referring URLs, and time spent (analytics)</li>
            <li>IP address (anonymized where possible)</li>
            <li>Device and interaction data via cookies and similar technologies (see Cookies below)</li>
          </ul>
        </section>

        <section>
          <h2>How We Use Your Information and Our Legal Bases</h2>
          <p>
            Under the GDPR we must have a lawful basis for each purpose for which we process your
            personal data. Those bases are set out below:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th scope="col" className="py-2 pr-4 text-white">Purpose</th>
                  <th scope="col" className="py-2 text-white">Legal basis (GDPR Art. 6)</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-gray-800">
                  <td className="py-2 pr-4">Provide and maintain your account and the core service</td>
                  <td className="py-2">Performance of a contract</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2 pr-4">Send newsletters and marketing emails</td>
                  <td className="py-2">Consent (withdrawable at any time)</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2 pr-4">Analytics and advertising cookies</td>
                  <td className="py-2">Consent</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2 pr-4">Improve and secure our website, prevent fraud and abuse</td>
                  <td className="py-2">Legitimate interests</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Comply with legal, tax, and accounting obligations</td>
                  <td className="py-2">Legal obligation</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="cookies">
          <h2>Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar technologies to operate our website and, with your consent,
            to measure traffic and support advertising. When you first visit, a consent banner lets
            you accept or reject non-essential cookies. Analytics and marketing technologies are not
            activated until you opt in. You can change or withdraw your choice at any time using the{' '}
            <button
              type="button"
              onClick={reopenConsentBanner}
              className="text-orange-500 hover:text-orange-400 underline"
            >
              Cookie Preferences
            </button>{' '}
            control (also available in the site footer).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th scope="col" className="py-2 pr-4 text-white">Category</th>
                  <th scope="col" className="py-2 pr-4 text-white">Examples / Providers</th>
                  <th scope="col" className="py-2 text-white">Purpose</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-gray-800">
                  <td className="py-2 pr-4">Strictly necessary</td>
                  <td className="py-2 pr-4">Authentication/session (Supabase), consent storage</td>
                  <td className="py-2">Required for the site to function; always on</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-2 pr-4">Analytics</td>
                  <td className="py-2 pr-4">Google Analytics (GA4), Plausible Analytics</td>
                  <td className="py-2">Understand aggregate site usage; set only with consent</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Marketing</td>
                  <td className="py-2 pr-4">Advertising / sponsored-content measurement</td>
                  <td className="py-2">Measure ad performance; set only with consent</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Google Analytics is operated under Google Consent Mode, which means no analytics cookies
            or identifiers are stored until you grant consent. You can also control cookies through
            your browser settings.
          </p>
        </section>

        <section>
          <h2>Third-Party Services and Processors</h2>
          <p>We use trusted third-party service providers who process data on our behalf, including:</p>
          <ul>
            <li>Analytics providers (Google Analytics, Plausible)</li>
            <li>Payment processors (for premium features)</li>
            <li>Email service providers (for newsletters and transactional email)</li>
            <li>Authentication and database hosting (Supabase)</li>
            <li>Content delivery and hosting infrastructure (Cloudflare)</li>
          </ul>
          <p>We do not sell your personal information.</p>
        </section>

        <section>
          <h2>International Data Transfers</h2>
          <p>
            Some of our service providers (for example Google, Supabase, Cloudflare, and our payment
            processor) are based in, or store data in, the United States and other countries outside
            the European Economic Area and the United Kingdom. Where personal data is transferred
            outside the EEA/UK, we rely on appropriate safeguards such as the European Commission's
            Standard Contractual Clauses (and the UK International Data Transfer Addendum) to ensure
            your data receives an equivalent level of protection.
          </p>
        </section>

        <section>
          <h2>Data Retention</h2>
          <p>
            We retain personal data only for as long as necessary for the purposes described in this
            policy:
          </p>
          <ul>
            <li>Account data — for the life of your account and up to 12 months after deletion or account closure</li>
            <li>Newsletter subscriptions — until you unsubscribe, plus a short suppression-list period</li>
            <li>Analytics data — retained in aggregated/pseudonymized form (typically up to 14 months)</li>
            <li>Transaction and billing records — as required by applicable tax and accounting law (typically up to 7 years)</li>
          </ul>
          <p>
            When personal data is no longer needed, we delete or anonymize it.
          </p>
        </section>

        <section>
          <h2>Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal
            information. However, no method of transmission over the Internet is 100% secure, and we
            cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2>Your Rights (GDPR / UK GDPR)</h2>
          <p>If you are in the EEA or the UK, you have the right to:</p>
          <ul>
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate or incomplete information</li>
            <li>Request erasure of your personal information ("right to be forgotten")</li>
            <li>Restrict or object to certain processing, including direct marketing</li>
            <li>Data portability — receive your data in a structured, machine-readable format</li>
            <li>Withdraw consent at any time, without affecting prior lawful processing</li>
          </ul>
          <p>
            To exercise these rights, contact us at{' '}
            <a href="mailto:privacy@bitcoinvestments.net">privacy@bitcoinvestments.net</a>. We will
            respond within the timeframes required by law.
          </p>
          <p>
            <strong>Right to complain:</strong> You also have the right to lodge a complaint with a
            data protection supervisory authority. In the UK this is the Information Commissioner's
            Office (ico.org.uk); in the EEA it is the authority in your country of residence.
          </p>
        </section>

        <section id="ccpa">
          <h2>California Privacy Rights (CCPA / CPRA)</h2>
          <p>
            If you are a California resident, you have the right to:
          </p>
          <ul>
            <li>Know what categories of personal information we collect, use, and disclose</li>
            <li>Request access to and deletion of your personal information</li>
            <li>Correct inaccurate personal information</li>
            <li>Opt out of the "sale" or "sharing" of personal information</li>
            <li>Not be discriminated against for exercising your privacy rights</li>
          </ul>
          <p>
            <strong>Do Not Sell or Share My Personal Information:</strong> We do not sell your
            personal information, and we do not share it for cross-context behavioral advertising in
            exchange for money. Where you decline marketing cookies via our consent banner, we treat
            that as an opt-out of any "sharing." We also honor the Global Privacy Control (GPC)
            browser signal where technically feasible. To make a California privacy request, email{' '}
            <a href="mailto:privacy@bitcoinvestments.net">privacy@bitcoinvestments.net</a>.
          </p>
        </section>

        <section>
          <h2>Children's Privacy</h2>
          <p>
            Our services are not intended for individuals under the age of 18. We do not knowingly
            collect personal information from children.
          </p>
        </section>

        <section>
          <h2>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material
            changes by posting the new policy on this page and updating the "Last updated" date
            above.
          </p>
        </section>

        <section>
          <h2>Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or our data practices, please contact us
            at <a href="mailto:privacy@bitcoinvestments.net">privacy@bitcoinvestments.net</a>.
          </p>
        </section>

        <div className="mt-12 pt-8 border-t border-gray-700 flex flex-wrap gap-4">
          <Link to="/" className="text-orange-500 hover:text-orange-400">
            &larr; Back to Home
          </Link>
          <span className="text-gray-500">|</span>
          <Link to="/terms" className="text-orange-500 hover:text-orange-400">
            Terms of Service
          </Link>
          <span className="text-gray-500">|</span>
          <Link to="/disclaimer" className="text-orange-500 hover:text-orange-400">
            Disclaimer
          </Link>
          <span className="text-gray-500">|</span>
          <button
            type="button"
            onClick={reopenConsentBanner}
            className="text-orange-500 hover:text-orange-400"
          >
            Cookie Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
