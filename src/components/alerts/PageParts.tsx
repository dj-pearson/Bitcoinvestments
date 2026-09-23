/**
 * Small presentational pieces shared by the alert and automation tool pages
 * (/rebalancing-alerts, /dca-automation, /alert-bundles,
 * /influencer-verification). All of them render from props only, so they are
 * safe to prerender.
 */

import type { ReactNode } from 'react';

import type { FaqItem } from './schema';

/** Visible FAQ. Pass the same array to <PageSEO faqs> so the schema matches. */
export function FaqSection({ items, heading = 'Frequently asked questions' }: { items: FaqItem[]; heading?: string }) {
  return (
    <section aria-labelledby="faq-heading" className="mt-12">
      <h2 id="faq-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {heading}
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <details
            key={item.question}
            className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <summary className="cursor-pointer font-semibold text-gray-900 dark:text-white list-none flex justify-between gap-4">
              <span>{item.question}</span>
              <span aria-hidden="true" className="text-gray-400 group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="mt-3 text-gray-700 dark:text-gray-300 leading-relaxed">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/** "Last updated" line. `date` is an ISO date (YYYY-MM-DD) from source, never computed at render. */
export function LastUpdated({ date, label = 'Last updated' }: { date: string; label?: string }) {
  const [y, m, d] = date.split('-').map(Number);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const text = y && m && d ? `${months[m - 1]} ${d}, ${y}` : date;
  return (
    <p className="text-sm text-gray-500 dark:text-gray-400">
      {label}: <time dateTime={date}>{text}</time>
    </p>
  );
}

/** Neutral callout box. */
export function Callout({
  title,
  children,
  tone = 'info',
}: {
  title?: string;
  children: ReactNode;
  tone?: 'info' | 'warning';
}) {
  const styles =
    tone === 'warning'
      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100'
      : 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-100';
  return (
    <div className={`border rounded-lg p-4 text-sm leading-relaxed ${styles}`}>
      {title && <p className="font-semibold mb-1">{title}</p>}
      <div>{children}</div>
    </div>
  );
}
