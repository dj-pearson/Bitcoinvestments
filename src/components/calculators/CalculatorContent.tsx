/**
 * Static, SSR-safe content blocks shared by the calculator pages: visible FAQ
 * (the same Q&As feed the FAQPage JSON-LD), "how it's calculated" steps, related
 * links and a last-updated line. Nothing here touches browser APIs.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { formatIsoDate, type FaqItem, type HowToStep } from './calculatorSchema';

export function FaqSection({ faqs, title = 'Frequently asked questions', id = 'faq' }: { faqs: FaqItem[]; title?: string; id?: string }) {
  return (
    <section aria-labelledby={`${id}-heading`} className="glass-card p-6 md:p-8">
      <h2 id={`${id}-heading`} className="text-2xl font-bold text-white mb-6">{title}</h2>
      <div className="space-y-6">
        {faqs.map((f) => (
          <div key={f.question}>
            <h3 className="font-semibold text-white mb-2">{f.question}</h3>
            <p className="text-gray-400 leading-relaxed">{f.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HowItWorks({
  title,
  intro,
  steps,
  children,
  id = 'how-it-works',
}: {
  title: string;
  intro?: ReactNode;
  steps: HowToStep[];
  children?: ReactNode;
  id?: string;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className="glass-card p-6 md:p-8">
      <h2 id={`${id}-heading`} className="text-2xl font-bold text-white mb-4">{title}</h2>
      {intro && <div className="text-gray-400 mb-6 leading-relaxed">{intro}</div>}
      <ol className="space-y-4 list-decimal list-inside marker:text-brand-primary">
        {steps.map((s) => (
          <li key={s.name} className="text-gray-300">
            <span className="font-semibold text-white">{s.name}.</span> {s.text}
          </li>
        ))}
      </ol>
      {children && <div className="mt-6 text-gray-400 leading-relaxed space-y-3">{children}</div>}
    </section>
  );
}

export function RelatedLinks({ links, title = 'Related tools and guides' }: { links: { to: string; label: string; description: string }[]; title?: string }) {
  return (
    <nav aria-label={title} className="glass-card p-6 md:p-8">
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      <ul className="grid sm:grid-cols-2 gap-3">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="flex items-start gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <ArrowRight className="w-4 h-4 text-brand-primary mt-1 flex-shrink-0" aria-hidden="true" />
              <span>
                <span className="block font-medium text-white">{l.label}</span>
                <span className="block text-sm text-gray-400">{l.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function LastUpdated({ date, children }: { date: string; children?: ReactNode }) {
  return (
    <p className="text-sm text-gray-500">
      Last updated <time dateTime={date}>{formatIsoDate(date)}</time>
      {children}
    </p>
  );
}
