import { CalendarCheck, ExternalLink } from 'lucide-react';
import type { FactSource } from '../../types';
import { formatIsoDate } from './compareUtils';

export interface FaqItem {
  question: string;
  answer: string;
}

/** Visible FAQ. Pair it with FAQPage JSON-LD built from the same array. */
export function FaqSection({ id = 'faq', title = 'Frequently asked questions', faqs }: {
  id?: string;
  title?: string;
  faqs: FaqItem[];
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className="glass-card p-6">
      <h2 id={`${id}-heading`} className="text-2xl font-bold text-white mb-4">{title}</h2>
      <div className="space-y-5">
        {faqs.map(faq => (
          <div key={faq.question}>
            <h3 className="font-semibold text-white mb-1">{faq.question}</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{faq.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** "Last verified" label. `date` is an ISO date from the data files. */
export function VerifiedDate({ date, className = '' }: { date: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-gray-400 ${className}`}>
      <CalendarCheck className="w-3.5 h-3.5" aria-hidden="true" />
      Last verified <time dateTime={date}>{formatIsoDate(date)}</time>
    </span>
  );
}

/** List of public sources for the facts on a page. */
export function SourcesList({ sources, date }: { sources: FactSource[]; date: string }) {
  return (
    <section aria-labelledby="sources-heading" className="glass-card p-6">
      <h2 id="sources-heading" className="text-xl font-bold text-white mb-2">Sources</h2>
      <p className="text-sm text-gray-400 mb-3">
        Facts on this page were checked on <time dateTime={date}>{formatIsoDate(date)}</time> against these
        public pages. Fees and product lineups change often; always confirm on the provider&apos;s own site.
      </p>
      <ul className="space-y-1.5">
        {sources.map(source => (
          <li key={source.url}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-orange-400 hover:text-orange-300 underline"
            >
              {source.label}
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Two-column head-to-head table. Rows that differ are highlighted. */
export function HeadToHeadTable({ names, rows, caption }: {
  names: [string, string];
  rows: { label: string; values: [string, string]; differs: boolean }[];
  caption: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-white/10">
            <th scope="col" className="py-2 pr-4 text-gray-400 font-medium w-1/4">Feature</th>
            <th scope="col" className="py-2 pr-4 text-white font-semibold">{names[0]}</th>
            <th scope="col" className="py-2 text-white font-semibold">{names[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.label} className={`border-b border-white/5 ${row.differs ? 'bg-white/[0.03]' : ''}`}>
              <th scope="row" className="py-2 pr-4 text-gray-400 font-normal align-top">{row.label}</th>
              <td className="py-2 pr-4 text-gray-200 align-top">{row.values[0]}</td>
              <td className="py-2 text-gray-200 align-top">{row.values[1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
