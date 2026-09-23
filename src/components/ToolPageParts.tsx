/**
 * Small presentational pieces shared by the DeFi tool pages
 * (/lending, /defi-yield, /gas-optimizer). SSR-safe: no browser APIs.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { formatIsoDate } from '../lib/isoDate';

export function LastReviewed({ date, label = 'Last reviewed' }: { date: string; label?: string }) {
  return (
    <p className="text-sm text-gray-500 dark:text-gray-400">
      {label}: <time dateTime={date}>{formatIsoDate(date)}</time>
    </p>
  );
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function FaqList({ faqs, id = 'faq' }: { faqs: FaqItem[]; id?: string }) {
  return (
    <section aria-labelledby={`${id}-heading`} className="mt-12">
      <h2 id={`${id}-heading`} className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Frequently asked questions
      </h2>
      <div className="space-y-3">
        {faqs.map((f) => (
          <details
            key={f.question}
            className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            open
          >
            <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white">
              {f.question}
            </summary>
            <p className="mt-2 text-gray-700 dark:text-gray-300 leading-relaxed">{f.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function RelatedLinks({ links }: { links: Array<{ to: string; label: string; note?: string }> }) {
  return (
    <section aria-labelledby="related-heading" className="mt-12">
      <h2 id="related-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Related guides and tools
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {links.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className="block h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 transition"
            >
              <span className="font-semibold text-blue-600 dark:text-blue-400">{l.label}</span>
              {l.note && <span className="block text-sm text-gray-600 dark:text-gray-400 mt-1">{l.note}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Outbound link. Plain links get rel="noopener noreferrer"; pass `sponsored`
 * only for real affiliate/paid links so they carry rel="sponsored".
 */
export function ExternalLink({
  href,
  children,
  sponsored = false,
  className = 'text-blue-600 dark:text-blue-400 hover:underline',
}: {
  href: string;
  children: ReactNode;
  sponsored?: boolean;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel={sponsored ? 'sponsored noopener noreferrer' : 'noopener noreferrer'}
      className={className}
    >
      {children}
    </a>
  );
}
