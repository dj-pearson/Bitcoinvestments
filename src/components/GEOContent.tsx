/**
 * GEO Content Components
 *
 * Reusable components that structure content for optimal AI search citation.
 * Implements Generative Engine Optimization (GEO) best practices:
 * - Direct answer blocks (first 40-60 words)
 * - Question-based headings
 * - Fact density markers
 * - Source attribution
 * - Structured Q&A pairs
 * - Content freshness signals
 */

import React from 'react';

// ============================================
// Direct Answer Block
// ============================================

interface DirectAnswerProps {
  /** The primary question this content answers */
  question: string;
  /** Direct, concise answer (40-60 words ideal) */
  answer: string;
  /** The primary entity this page is about */
  entity?: string;
  /** Additional context paragraph */
  context?: string;
  children?: React.ReactNode;
}

/**
 * DirectAnswer component
 *
 * Places a direct answer at the top of the page for AI extraction.
 * The first 40-60 words should directly answer the page's primary question.
 *
 * @example
 * ```tsx
 * <DirectAnswer
 *   question="What is Dollar Cost Averaging?"
 *   answer="Dollar Cost Averaging (DCA) is an investment strategy where you invest a fixed amount at regular intervals, regardless of the asset's price. This approach reduces volatility impact and removes the need to time the market."
 *   entity="Dollar Cost Averaging"
 * />
 * ```
 */
export function DirectAnswer({
  question,
  answer,
  entity,
  context,
  children,
}: DirectAnswerProps) {
  return (
    <section aria-labelledby="direct-answer-heading" className="mb-8">
      <h1 id="direct-answer-heading" className="text-3xl font-bold mb-4">
        {question}
      </h1>
      <p className="text-lg leading-relaxed text-gray-200 mb-4">
        {entity && <strong>{entity}</strong>}
        {entity ? ` — ${answer}` : answer}
      </p>
      {context && (
        <p className="text-gray-400 leading-relaxed">{context}</p>
      )}
      {children}
    </section>
  );
}

// ============================================
// Question Section
// ============================================

interface QuestionSectionProps {
  /** Question phrased as users would ask AI */
  question: string;
  /** Heading level (defaults to h2) */
  level?: 'h2' | 'h3' | 'h4';
  children: React.ReactNode;
}

/**
 * QuestionSection component
 *
 * Wraps content in a question-based heading for AI citation.
 * Headings should be phrased as natural language questions.
 *
 * @example
 * ```tsx
 * <QuestionSection question="How does Dollar Cost Averaging work?">
 *   <p>DCA works by spreading your investment...</p>
 * </QuestionSection>
 * ```
 */
export function QuestionSection({
  question,
  level = 'h2',
  children,
}: QuestionSectionProps) {
  const HeadingTag = level;

  return (
    <section className="mb-8">
      <HeadingTag className={`font-bold mb-4 ${level === 'h2' ? 'text-2xl' : level === 'h3' ? 'text-xl' : 'text-lg'}`}>
        {question}
      </HeadingTag>
      {children}
    </section>
  );
}

// ============================================
// Fact Callout
// ============================================

interface FactCalloutProps {
  /** The statistic or data point */
  fact: string;
  /** Source attribution */
  source?: string;
  /** Source URL for live citation */
  sourceUrl?: string;
}

/**
 * FactCallout component
 *
 * Highlights a statistic or data point with source attribution.
 * AI engines reward content with authoritative citations every 150-200 words.
 *
 * @example
 * ```tsx
 * <FactCallout
 *   fact="Bitcoin's market cap exceeded $1 trillion in 2024."
 *   source="CoinGecko"
 *   sourceUrl="https://coingecko.com"
 * />
 * ```
 */
export function FactCallout({ fact, source, sourceUrl }: FactCalloutProps) {
  return (
    <aside className="border-l-4 border-orange-500 pl-4 py-2 my-4 bg-orange-500/5 rounded-r">
      <p className="text-gray-200 font-medium">{fact}</p>
      {source && (
        <p className="text-sm text-gray-400 mt-1">
          Source:{' '}
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:underline"
            >
              {source}
            </a>
          ) : (
            <span>{source}</span>
          )}
        </p>
      )}
    </aside>
  );
}

// ============================================
// Q&A Pair
// ============================================

interface QAPairProps {
  question: string;
  answer: string;
}

/**
 * QAPair component
 *
 * Renders a single Q&A pair in a format optimized for AI extraction.
 * Keep answers under 300 characters for best AI citation.
 */
export function QAPair({ question, answer }: QAPairProps) {
  return (
    <div className="mb-4">
      <dt className="font-semibold text-gray-100 mb-1">{question}</dt>
      <dd className="text-gray-300 pl-4">{answer}</dd>
    </div>
  );
}

// ============================================
// FAQ Section
// ============================================

interface FAQSectionProps {
  title?: string;
  faqs: Array<{ question: string; answer: string }>;
}

/**
 * FAQSection component
 *
 * Renders a structured FAQ section with Q&A pairs.
 * Pairs with generateGEOFAQSchema() for JSON-LD markup.
 *
 * @example
 * ```tsx
 * <FAQSection
 *   faqs={[
 *     { question: 'What is Bitcoin?', answer: 'Bitcoin is...' },
 *     { question: 'How do I buy Bitcoin?', answer: 'You can buy...' },
 *   ]}
 * />
 * ```
 */
export function FAQSection({ title = 'Frequently Asked Questions', faqs }: FAQSectionProps) {
  return (
    <section className="mt-12 mb-8" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="text-2xl font-bold mb-6">
        {title}
      </h2>
      <dl className="space-y-4">
        {faqs.map((faq, index) => (
          <QAPair key={index} question={faq.question} answer={faq.answer} />
        ))}
      </dl>
    </section>
  );
}

// ============================================
// Last Updated
// ============================================

interface LastUpdatedProps {
  date: string;
  /** Optional label override */
  label?: string;
}

/**
 * LastUpdated component
 *
 * Displays a visible "last updated" date for content freshness signals.
 * AI engines heavily weight recency — visible dates improve citation likelihood.
 */
export function LastUpdated({ date, label = 'Last updated' }: LastUpdatedProps) {
  return (
    <time
      dateTime={date}
      className="text-sm text-gray-500 block mb-4"
    >
      {label}: {new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
    </time>
  );
}

// ============================================
// Comparison Table
// ============================================

interface ComparisonTableProps {
  headers: string[];
  rows: Array<{
    name: string;
    values: (string | React.ReactNode)[];
  }>;
  caption?: string;
}

/**
 * ComparisonTable component
 *
 * Renders a structured comparison table optimized for AI extraction.
 * AI engines favor tabular comparison data for citation.
 */
export function ComparisonTable({
  headers,
  rows,
  caption,
}: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto my-6">
      <table className="w-full border-collapse">
        {caption && (
          <caption className="text-left text-lg font-semibold mb-2 text-gray-200">
            {caption}
          </caption>
        )}
        <thead>
          <tr className="border-b border-gray-700">
            {headers.map((header, index) => (
              <th
                key={index}
                className="text-left px-4 py-3 text-gray-300 font-medium"
                scope="col"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-800">
              <th scope="row" className="text-left px-4 py-3 text-gray-100 font-medium">
                {row.name}
              </th>
              {row.values.map((value, colIndex) => (
                <td key={colIndex} className="px-4 py-3 text-gray-300">
                  {value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default {
  DirectAnswer,
  QuestionSection,
  FactCallout,
  QAPair,
  FAQSection,
  LastUpdated,
  ComparisonTable,
};
