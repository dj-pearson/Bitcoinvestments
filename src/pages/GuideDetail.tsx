import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, BookOpen, ChevronRight, Wrench, CalendarCheck } from 'lucide-react';
import {
  getGuide,
  getRelatedGuides,
  formatGuideDate,
} from '../data/guides';
import { Newsletter } from '../components/Newsletter';
import { MarkdownContent } from '../components/MarkdownContent';
import { ShareButton } from '../components/ShareButton';
import { NotFound } from './NotFound';
import {
  SEO,
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateHowToSchema,
} from '../components/SEO';

const SITE_URL = 'https://bitcoinvestments.net';
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export function GuideDetail() {
  const { guideId } = useParams<{ guideId: string }>();
  const guide = guideId ? getGuide(guideId) : undefined;

  // Unknown slug: a real "not found" (noindex), never a redirect to /learn.
  if (!guide) {
    return <NotFound />;
  }

  const guideUrl = `${SITE_URL}/learn/${guide.id}`;
  const related = getRelatedGuides(guide);

  const schema: Record<string, unknown>[] = [
    generateArticleSchema({
      title: guide.title,
      description: guide.description,
      url: guideUrl,
      image: OG_IMAGE,
      author: 'Bitcoinvestments editorial team',
      publishedDate: guide.datePublished,
      modifiedDate: guide.dateModified,
    }),
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Learn', url: '/learn' },
      { name: guide.title, url: `/learn/${guide.id}` },
    ]),
  ];
  if (guide.faqs && guide.faqs.length > 0) {
    schema.push(generateFAQSchema(guide.faqs));
  }
  if (guide.howToSteps && guide.howToSteps.length > 0) {
    schema.push(
      generateHowToSchema({
        name: guide.title,
        description: guide.description,
        steps: guide.howToSteps,
        image: OG_IMAGE,
      })
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <SEO
        title={guide.seoTitle ?? guide.title}
        description={guide.description}
        keywords={[guide.category, 'crypto guide', 'cryptocurrency education']}
        type="article"
        image={OG_IMAGE}
        author="Bitcoinvestments editorial team"
        publishedTime={guide.datePublished}
        modifiedTime={guide.dateModified}
        section={guide.category}
        blufSummary={guide.summary}
        contentCategory={guide.category}
        schema={schema}
      />
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 to-brand-dark border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            to="/learn"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-orange-500 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Learning Center
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-orange-500/20 text-orange-500 text-sm font-medium rounded-full">
              {guide.category}
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" aria-hidden="true" />
              {guide.readTime} min read
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{guide.title}</h1>

          {/* Answer-first summary */}
          <p className="text-xl text-gray-300 mb-4">{guide.summary}</p>

          {/* Byline + dates */}
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-400 mb-6">
            <CalendarCheck className="w-4 h-4" aria-hidden="true" />
            <span>By {guide.author}</span>
            <span aria-hidden="true">·</span>
            <span>
              Updated <time dateTime={guide.dateModified}>{formatGuideDate(guide.dateModified)}</time>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              First published <time dateTime={guide.datePublished}>{formatGuideDate(guide.datePublished)}</time>
            </span>
          </p>

          <div className="flex gap-3">
            <ShareButton title={guide.title} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <article className="max-w-none">
          <MarkdownContent content={guide.content} />
        </article>

        {/* Visible FAQ (mirrors the FAQPage schema) */}
        {guide.faqs && guide.faqs.length > 0 && (
          <section className="mt-12" aria-labelledby="guide-faq">
            <h2 id="guide-faq" className="text-2xl font-bold text-white mb-6 border-b border-gray-800 pb-2">
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              {guide.faqs.map((faq) => (
                <div key={faq.question}>
                  <h3 className="text-lg font-semibold text-white mb-2">{faq.question}</h3>
                  <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="mt-10 text-sm text-gray-500 border-t border-gray-800 pt-6">
          Educational content only, not financial, tax or legal advice. Facts were checked on{' '}
          {formatGuideDate(guide.dateModified)}; crypto products, fees and rules change often, so
          confirm anything important with the provider or a qualified professional.
        </p>

        {/* Tools that put the guide into practice */}
        {guide.relatedTools && guide.relatedTools.length > 0 && (
          <section className="mt-12" aria-labelledby="guide-tools">
            <h2 id="guide-tools" className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Wrench className="w-6 h-6 text-orange-500" aria-hidden="true" />
              Put it into practice
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {guide.relatedTools.map((tool) => (
                <Link
                  key={tool.url}
                  to={tool.url}
                  className="flex items-center justify-between gap-3 bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-orange-500/50 transition-colors group"
                >
                  <div>
                    <span className="font-semibold text-white group-hover:text-orange-500 transition-colors">
                      {tool.label}
                    </span>
                    {tool.description && (
                      <span className="block text-sm text-gray-400 mt-1">{tool.description}</span>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related guides */}
        {related.length > 0 && (
          <section className="mt-12" aria-labelledby="guide-related">
            <h2 id="guide-related" className="text-2xl font-bold text-white mb-6">
              Continue learning
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {related.map((g) => (
                <Link
                  key={g.id}
                  to={`/learn/${g.id}`}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-orange-500/50 transition-colors group"
                >
                  <span className="text-3xl" aria-hidden="true">{g.icon}</span>
                  <span className="block text-xs font-medium text-orange-500 uppercase tracking-wide mt-3">
                    {g.category}
                  </span>
                  <h3 className="font-semibold text-white mt-1 group-hover:text-orange-500 transition-colors">
                    {g.title}
                  </h3>
                  <p className="text-sm text-gray-400 mt-2">{g.readTime} min read</p>
                </Link>
              ))}
            </div>
            <p className="mt-6 text-sm text-gray-400">
              Looking up a term? Try the{' '}
              <Link to="/glossary" className="text-orange-500 hover:text-orange-400 underline">
                crypto glossary
              </Link>{' '}
              or browse{' '}
              <Link to="/learn" className="text-orange-500 hover:text-orange-400 underline">
                all guides
              </Link>
              .
            </p>
          </section>
        )}

        {/* Newsletter CTA */}
        <div className="mt-12 p-8 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl border border-orange-500/20">
          <div className="text-center mb-6">
            <BookOpen className="w-12 h-12 text-orange-500 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-white mb-2">Get new guides by email</h2>
            <p className="text-gray-400">
              We email when guides are added or materially updated. Unsubscribe any time.
            </p>
          </div>
          <Newsletter source={`guide-${guide.id}`} variant="inline" />
        </div>
      </div>
    </div>
  );
}
