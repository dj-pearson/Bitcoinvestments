/**
 * /multi-exchange
 *
 * Honest placeholder. Automatic exchange syncing does not exist on this site:
 * the previous page showed invented "connected" exchanges and balances, and
 * the underlying service asked for API secrets it could not store safely.
 *
 * The route is gated behind ComingSoon + noindex by the router. If it is ever
 * un-gated, this page renders only true statements: the feature is not
 * available, and here is how to track holdings across exchanges safely today.
 * See services/exchangeConnections.ts for the secure design required before
 * building the real feature.
 */

import { Link } from 'react-router-dom';
import { ArrowLeftRight } from 'lucide-react';
import { PageSEO } from '../components/PageSEO';
import { FaqSection, LastUpdated, Section, type FaqItem } from '../components/analytics/PageParts';

const LAST_UPDATED = '2026-09-23';

const FAQS: FaqItem[] = [
  {
    question: 'Can I connect my exchange accounts to Bitcoinvestments?',
    answer:
      'Not at the moment. Automatic exchange syncing is not available. You can record holdings by hand in the portfolio tracker on the dashboard.',
  },
  {
    question: 'Is it safe to give an app my exchange API key?',
    answer:
      'Only if the key is read-only, the app is reputable, and it stores keys encrypted on its servers. Never share a key that can trade or withdraw, restrict the key to the app\'s IP addresses if the exchange allows it, and delete keys you no longer use.',
  },
];

export default function MultiExchange() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <PageSEO pageKey="multiExchange" urlPath="/multi-exchange" faqs={FAQS} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <ArrowLeftRight className="h-8 w-8 text-blue-500 flex-shrink-0" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tracking Crypto Across Multiple Exchanges</h1>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Automatic exchange syncing is not available on Bitcoinvestments. You can track holdings from several
            exchanges today by entering them in our free portfolio tracker, and this page explains how to do it safely
            with read-only API keys or CSV exports if you use other tools.
          </p>
          <div className="mt-3">
            <LastUpdated date={LAST_UPDATED} />
          </div>
          <p className="mt-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
            >
              Open the portfolio tracker
            </Link>
          </p>
        </header>

        <Section id="options-heading" title="Three ways to see everything in one place">
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>Manual entry.</strong> Add each holding by hand and note which exchange or wallet it sits on. It
              takes a few minutes and shares nothing with anyone.
            </li>
            <li>
              <strong>CSV export and import.</strong> Most exchanges let you download your transaction history as a
              CSV file. Portfolio and crypto-tax tools can import these files without any access to your account.
            </li>
            <li>
              <strong>Read-only API keys.</strong> Some tools connect to exchanges automatically. Only do this with a
              key that can view balances and history and nothing else.
            </li>
          </ol>
        </Section>

        <Section id="keys-heading" title="API key safety checklist">
          <ul className="list-disc pl-5 space-y-2">
            <li>Create the key with read or view permissions only. Leave trading and withdrawals switched off.</li>
            <li>If the exchange supports it, restrict the key to the tool&apos;s published IP addresses.</li>
            <li>Use a separate key for each tool, so you can revoke one without affecting others.</li>
            <li>Never paste an API secret into a website you do not trust, a chat or an email.</li>
            <li>Review and delete old keys regularly in your exchange&apos;s API settings.</li>
          </ul>
        </Section>

        <FaqSection faqs={FAQS} />
      </div>
    </div>
  );
}
