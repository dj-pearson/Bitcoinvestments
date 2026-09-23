/**
 * Small building blocks shared by the analytics and trading education pages
 * (/trading-indicators, /onchain-analytics, /whale-tracking, /social-trading,
 * /multi-exchange). Everything here renders deterministically from props, so
 * it is safe for server prerendering and hydration.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * "2026-09-23" -> "September 23, 2026". Parsed by hand rather than through
 * Date so the result never shifts a day with the viewer's time zone and is
 * identical on the server and in the browser.
 */
export function formatIsoDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}

export function LastUpdated({ date, label = 'Last updated' }: { date: string; label?: string }) {
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

/** Visible FAQ. Pass the same array to PageSEO's `faqs` so the schema matches. */
export function FaqSection({ faqs, title = 'Frequently asked questions' }: { faqs: FaqItem[]; title?: string }) {
  return (
    <section aria-labelledby="faq-heading" className="mt-12">
      <h2 id="faq-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {title}
      </h2>
      <dl className="space-y-4">
        {faqs.map((faq) => (
          <div key={faq.question} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
            <dt className="font-semibold text-gray-900 dark:text-white">{faq.question}</dt>
            <dd className="mt-2 text-gray-700 dark:text-gray-300 leading-relaxed">{faq.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Section({
  id,
  title,
  children,
  className = '',
}: {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={`mt-12 ${className}`}>
      <h2 id={id} className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {title}
      </h2>
      <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed">{children}</div>
    </section>
  );
}

export function NotAdviceNote({ children }: { children?: ReactNode }) {
  return (
    <p className="text-sm rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 p-4">
      {children ??
        'Educational content, not financial advice. Nothing on this page is a recommendation to buy or sell any asset.'}
    </p>
  );
}

export interface RelatedLink {
  to: string;
  title: string;
  description: string;
}

export function RelatedLinks({ links, title = 'Related guides and tools' }: { links: RelatedLink[]; title?: string }) {
  return (
    <section aria-labelledby="related-heading" className="mt-12">
      <h2 id="related-heading" className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        {title}
      </h2>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className="block h-full bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="font-semibold text-blue-600 dark:text-blue-400">{l.title}</span>
              <span className="block text-sm text-gray-600 dark:text-gray-400 mt-1">{l.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** External link that opens in a new tab with a visible cue for screen readers. */
export function ExternalLink({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-blue-600 dark:text-blue-400 underline hover:no-underline ${className}`}
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/**
 * Minimal line chart for a time series. Scales to its container width;
 * stroke width stays constant because of `vector-effect`.
 */
export function Sparkline({
  points,
  label,
  height = 64,
  className = 'text-blue-500',
}: {
  points: { t: number; v: number }[];
  label: string;
  height?: number;
  className?: string;
}) {
  if (points.length < 2) return null;
  const W = 300;
  const min = Math.min(...points.map((p) => p.v));
  const max = Math.max(...points.map((p) => p.v));
  const span = max - min || 1;
  const t0 = points[0].t;
  const tSpan = points[points.length - 1].t - t0 || 1;
  const d = points
    .map((p, i) => {
      const x = ((p.t - t0) / tSpan) * W;
      const y = height - ((p.v - min) / span) * (height - 4) - 2;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      className={`w-full ${className}`}
      style={{ height }}
      role="img"
      aria-label={label}
    >
      <path d={d} fill="none" stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
