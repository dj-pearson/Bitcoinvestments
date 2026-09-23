/**
 * How to report a crypto scam: a static, public guide.
 *
 * Intended to render at /report-scam while accounts are disabled (STATIC_MODE),
 * in place of the account-only community report form.
 */

import { Link } from 'react-router-dom';
import { AlertTriangle, CheckSquare, ExternalLink, Flag, Info, ShieldAlert } from 'lucide-react';
import { PageSEO } from '../components/PageSEO';
import { generateBreadcrumbSchema, generateHowToSchema } from '../components/SEO';
import {
  EVIDENCE_CHECKLIST,
  IC3_STATS,
  REPORTING_CHANNELS,
  REPORT_SCAM_FAQ,
  SCAM_GUIDANCE_LAST_VERIFIED,
  type ReportingChannel,
} from '../data/scamGuidance';
import { formatDateUTC } from '../lib/scamSafety';

const PAGE_PATH = '/report-scam';

const REPORT_STEPS: { name: string; text: string }[] = [
  {
    name: 'Stop sending money',
    text: 'Do not pay any "tax", "fee" or "deposit" to unlock a withdrawal. Stop replying to the scammer, but do not delete the conversation.',
  },
  {
    name: 'Secure what you still have',
    text: 'If you shared a seed phrase or signed a suspicious approval, move remaining funds to a new wallet with a new recovery phrase and revoke token approvals. Change passwords and switch exchange logins to an authenticator app or security key.',
  },
  {
    name: 'Collect the evidence',
    text: 'Save transaction IDs, the wallet addresses involved, the website or app name, screenshots and all messages, plus a short timeline of what happened.',
  },
  {
    name: 'Report to the FBI at ic3.gov',
    text: 'File a complaint with the FBI Internet Crime Complaint Center. Include every transaction ID and address. People aged 60 or older can get help filing from the National Elder Fraud Hotline at 833-372-8311.',
  },
  {
    name: 'Report to the FTC',
    text: 'File a report at ReportFraud.ftc.gov. It is shared with law enforcement agencies across the country.',
  },
  {
    name: 'Tell the exchanges involved',
    text: 'Contact the support team of the exchange you sent from, and of the receiving exchange if you know it. They can sometimes freeze funds still in an account they control.',
  },
  {
    name: 'Report investment fraud to regulators',
    text: 'If the scam involved an investment, token sale or trading platform, send a tip to the SEC (sec.gov/tcr) or CFTC (cftc.gov/complaint) and contact your state securities regulator.',
  },
  {
    name: 'Warn others',
    text: 'Optionally add the scam address or website to Chainabuse so other people checking it see a warning. This does not replace an official report.',
  },
  {
    name: 'Ignore recovery offers',
    text: 'Expect messages offering to recover your crypto for a fee, sometimes from people claiming to be the FBI, IC3 or a law firm. These are scams. Government agencies do not charge to recover funds.',
  },
];

function ChannelList({ channels }: { channels: ReportingChannel[] }) {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {channels.map((c) => (
        <li key={c.name} className="p-4 rounded-lg bg-white dark:bg-gray-800 shadow">
          <a
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-1"
          >
            {c.name}
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{c.description}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            <strong>Use when:</strong> {c.when}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function HowToReportScam() {
  const howToSchema = generateHowToSchema({
    name: 'How to report a crypto scam',
    description:
      'Steps to take after a cryptocurrency scam: stop payments, secure your wallet, collect evidence and report to the FBI IC3, FTC, regulators and exchanges.',
    steps: REPORT_STEPS,
  });
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Crypto Scam Checker', url: '/scam-database' },
    { name: 'How to Report a Crypto Scam', url: PAGE_PATH },
  ]);

  const us = REPORTING_CHANNELS.filter((c) => c.region === 'US');
  const intl = REPORTING_CHANNELS.filter((c) => c.region === 'International');
  const industry = REPORTING_CHANNELS.filter((c) => c.region === 'Industry');

  return (
    <>
      <PageSEO
        pageKey="reportScam"
        urlPath={PAGE_PATH}
        faqs={REPORT_SCAM_FAQ}
        customSchema={[howToSchema, breadcrumbSchema]}
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Link to="/scam-database" className="hover:text-orange-600">
              Crypto Scam Checker
            </Link>{' '}
            / <span aria-current="page">How to report a scam</span>
          </nav>

          <header className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Flag className="w-9 h-9 text-orange-600 dark:text-orange-400" aria-hidden="true" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">How to Report a Crypto Scam</h1>
            </div>
            <p className="text-lg text-gray-700 dark:text-gray-300">
              In the U.S., report a crypto scam to the FBI at ic3.gov and to the FTC at ReportFraud.ftc.gov, tell the
              exchanges involved as quickly as possible, and send investment-fraud tips to the SEC or CFTC. Keep every
              transaction ID and message, and never pay anyone who offers to recover your crypto.
            </p>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Last verified: <time dateTime={SCAM_GUIDANCE_LAST_VERIFIED}>{formatDateUTC(SCAM_GUIDANCE_LAST_VERIFIED)}</time>{' '}
              · Sources: FBI IC3, FTC, SEC, CFTC
            </p>
          </header>

          {/* Recovery-scam warning up front */}
          <aside
            aria-labelledby="recovery-warning"
            className="mb-8 p-5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          >
            <h2 id="recovery-warning" className="text-lg font-semibold text-red-900 dark:text-red-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" aria-hidden="true" />
              Beware of recovery scams
            </h2>
            <p className="mt-2 text-red-900 dark:text-red-100">
              Scam victims are targeted again by fake &quot;recovery&quot; services, fictitious law firms and people
              impersonating FBI or IC3 staff. The IC3 recorded {IC3_STATS.recoveryScamComplaints} recovery-scam
              complaints in {IC3_STATS.year} with {IC3_STATS.recoveryScamLosses} in losses. The IC3 does not charge
              to recover funds and does not refer victims to paid recovery companies.
            </p>
            <p className="mt-2 text-sm">
              <a
                href="https://www.ic3.gov/PSA/2025/PSA250813"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-red-800 dark:text-red-200"
              >
                FBI warning: fictitious law firms targeting crypto scam victims
              </a>
              {' · '}
              <a
                href="https://www.ic3.gov/PSA/2026/PSA260720"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-red-800 dark:text-red-200"
              >
                FBI warning: scammers impersonating the IC3
              </a>
            </p>
          </aside>

          {/* Steps */}
          <section aria-labelledby="steps-heading" className="mb-10">
            <h2 id="steps-heading" className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Step by step: what to do after a crypto scam
            </h2>
            <ol className="space-y-4">
              {REPORT_STEPS.map((step, i) => (
                <li key={step.name} className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 text-white font-semibold flex items-center justify-center"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{step.name}</h3>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Evidence */}
          <section aria-labelledby="evidence-heading" className="mb-10 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 id="evidence-heading" className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-orange-500" aria-hidden="true" />
              Evidence to keep
            </h2>
            <ul className="space-y-2">
              {EVIDENCE_CHECKLIST.map((item) => (
                <li key={item} className="flex gap-2 text-gray-700 dark:text-gray-300">
                  <span className="text-orange-500" aria-hidden="true">
                    •
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              A transaction ID (hash) is the long string your wallet or exchange shows for each transfer. Investigators
              use it to trace where the funds went.
            </p>
          </section>

          {/* Where to report */}
          <section aria-labelledby="where-heading" className="mb-10">
            <h2 id="where-heading" className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Where to report
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You can and should file with more than one agency. Each report reaches different investigators.
            </p>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">United States</h3>
            <ChannelList channels={us} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">Outside the U.S.</h3>
            <ChannelList channels={intl} />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Elsewhere, contact your national police fraud unit or financial regulator.
            </p>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">Warn other users</h3>
            <ChannelList channels={industry} />
          </section>

          {/* Community form status */}
          <section aria-labelledby="community-form-heading" className="mb-10 p-5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <h2 id="community-form-heading" className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <Info className="w-5 h-5" aria-hidden="true" />
              Submitting a report to Bitcoinvestments
            </h2>
            <p className="mt-2 text-blue-900 dark:text-blue-100">
              Our community report form needs an account, and accounts are coming soon. A report here would warn
              other readers but is not a law-enforcement report, so file with the agencies above first.
            </p>
          </section>

          {/* FAQ */}
          <section aria-labelledby="faq-heading" className="mb-10">
            <h2 id="faq-heading" className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {REPORT_SCAM_FAQ.map((f) => (
                <details key={f.question} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <summary className="font-medium text-gray-900 dark:text-white cursor-pointer">{f.question}</summary>
                  <p className="mt-2 text-gray-700 dark:text-gray-300">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section aria-labelledby="next-heading" className="p-5 rounded-lg bg-white dark:bg-gray-800 shadow">
            <h2 id="next-heading" className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" aria-hidden="true" />
              Learn the patterns
            </h2>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              See how pig butchering, fake platforms, wallet drainers, address poisoning and other scams work in our{' '}
              <Link to="/scam-database#scam-types" className="text-orange-600 dark:text-orange-400 hover:underline">
                guide to common crypto scam types
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </>
  );
}

export default HowToReportScam;
