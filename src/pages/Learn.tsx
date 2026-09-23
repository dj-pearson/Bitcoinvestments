import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Clock, BookOpen, ChevronRight, Target, Map as MapIcon, Sparkles } from 'lucide-react';
import { getPublishedArticles } from '../services/database';
import { Newsletter } from '../components/Newsletter';
import { getAllCourses } from '../data/courses';
import { getAllGuides, getGuide, BEGINNER_PATH, type GuideContent } from '../data/guides';
import { SEO, generateBreadcrumbSchema, generateFAQSchema } from '../components/SEO';
import { PAGE_METADATA } from '../lib/seo';
import type { Article } from '../types/database';

const SITE_URL = 'https://bitcoinvestments.net';

/**
 * Guide cards are derived straight from the guide registry so a card can only
 * exist if its guide does.
 */
const ALL_GUIDES = getAllGuides();
const COURSES = getAllCourses();

/** Category filters, derived so a filter can never render an empty list. */
const CATEGORIES = ['All', ...Array.from(new Set(ALL_GUIDES.map((g) => g.category)))];

const START_HERE: GuideContent[] = BEGINNER_PATH.map((id) => getGuide(id)).filter(
  (g): g is GuideContent => !!g
);
const START_HERE_MINUTES = START_HERE.reduce((sum, g) => sum + g.readTime, 0);

const LEARN_FAQS = [
  {
    question: 'Where should a complete beginner start?',
    answer:
      'Start with "What is Bitcoin?", then read the guides in the Start Here path in order: blockchain basics, wallets, how to buy, common mistakes and taxes. Or take the free six-module beginner course, which covers the same ground with learning objectives for each module.',
  },
  {
    question: 'Is crypto a good investment for beginners?',
    answer:
      'Crypto is a high-risk, volatile asset: Bitcoin has fallen more than 75% from its peak several times. It can have a place in a diversified plan, but only with money you will not need for years and after you have an emergency fund and no high-interest debt.',
  },
  {
    question: 'How much money do I need to start?',
    answer:
      'Very little. Most platforms let you buy a few dollars of bitcoin, and many beginners start with $25 to $100 to learn the process before deciding whether to invest more.',
  },
  {
    question: 'Are these guides and the course free?',
    answer:
      'Yes. Every guide, the beginner course, the glossary and the calculators are free to read and use without an account.',
  },
];

const WHATS_NEW = [
  {
    title: 'Spot Bitcoin and Ether ETFs',
    text: 'US spot Bitcoin ETFs launched in January 2024 and spot Ether ETFs in July 2024, so you can now get exposure in an ordinary brokerage account or IRA.',
    link: '/learn/what-is-bitcoin',
  },
  {
    title: 'The 2024 halving',
    text: 'In April 2024 the new-bitcoin reward per block fell from 6.25 to 3.125 BTC. The 20 millionth bitcoin was mined in March 2026.',
    link: '/learn/what-is-bitcoin',
  },
  {
    title: 'Form 1099-DA',
    text: 'US brokers now report your crypto sales to the IRS: gross proceeds for 2025, plus cost basis for coins bought from 2026.',
    link: '/learn/crypto-taxes-basics',
  },
  {
    title: 'US stablecoin law',
    text: 'The GENIUS Act (July 2025) set federal reserve and disclosure rules for payment stablecoins. Broader market-structure rules are still before Congress.',
    link: '/learn/defi-risks',
  },
];

export function Learn() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    let cancelled = false;
    async function loadArticles() {
      try {
        const publishedArticles = await getPublishedArticles(undefined, 6);
        if (!cancelled) setArticles(publishedArticles);
      } catch (err) {
        // The guides above are the static baseline; articles are an optional
        // extra, so a failure hides the section rather than blocking the page.
        console.error('Learn: failed to load articles', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadArticles();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredGuides =
    selectedCategory === 'All'
      ? ALL_GUIDES
      : ALL_GUIDES.filter((g) => g.category === selectedCategory);

  const meta = PAGE_METADATA.learn;

  const schema: Record<string, unknown>[] = [
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Learn', url: '/learn' },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Learn Crypto Investing',
      description: meta.description,
      url: `${SITE_URL}/learn`,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: COURSES.length + ALL_GUIDES.length,
        itemListElement: [
          ...COURSES.map((c) => ({ name: c.title, url: `${SITE_URL}/course/${c.id}` })),
          ...ALL_GUIDES.map((g) => ({ name: g.title, url: `${SITE_URL}/learn/${g.id}` })),
        ].map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          url: item.url,
        })),
      },
    },
    generateFAQSchema(LEARN_FAQS),
  ];

  return (
    <>
      <SEO
        title={meta.title}
        description={meta.description}
        keywords={meta.keywords}
        url={`${SITE_URL}/learn`}
        blufSummary="Bitcoinvestments offers free, plain-English guides and a six-module beginner course covering Bitcoin, wallets, buying safely, taxes, DCA, risk management and DeFi."
        contentCategory="Education"
        schema={schema}
      />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Learn Crypto Investing</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Free, plain-English guides and a six-module beginner course that take you from
            &ldquo;what is Bitcoin?&rdquo; to buying, storing and paying tax on crypto safely. New
            here? Follow the Start Here path below, about {START_HERE_MINUTES} minutes of reading in
            total.
          </p>
          <p className="text-sm text-gray-500 mt-3">
            Educational content only, not financial advice. Guides show the date they were last
            updated.
          </p>
        </div>

        {/* Start here */}
        <section className="mb-12" aria-labelledby="start-here">
          <h2 id="start-here" className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <MapIcon className="w-7 h-7 text-orange-500" aria-hidden="true" />
            Start here: the beginner path
          </h2>
          <p className="text-gray-400 mb-6">
            Six guides, in order. Each one builds on the last.
          </p>
          <ol className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {START_HERE.map((guide, index) => (
              <li key={guide.id}>
                <Link
                  to={`/learn/${guide.id}`}
                  className="flex items-start gap-4 h-full bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-orange-500/50 transition-colors group"
                >
                  <span className="w-9 h-9 flex-shrink-0 rounded-full bg-orange-500/20 text-orange-500 font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block font-semibold text-white group-hover:text-orange-500 transition-colors">
                      {guide.title}
                    </span>
                    <span className="block text-xs text-gray-500 mt-1">{guide.readTime} min read</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <p className="text-sm text-gray-400 mt-4">
            Stuck on a term? The{' '}
            <Link to="/glossary" className="text-orange-500 hover:text-orange-400 underline">
              crypto glossary
            </Link>{' '}
            defines it in a sentence or two.
          </p>
        </section>

        {/* Featured Courses Section */}
        <section className="mb-12" aria-labelledby="courses">
          <h2 id="courses" className="text-2xl font-bold text-white flex items-center gap-3 mb-6">
            <GraduationCap className="w-7 h-7 text-orange-500" aria-hidden="true" />
            Free course
          </h2>
          <div className="grid gap-6">
            {COURSES.map((course) => (
              <Link
                key={course.id}
                to={`/course/${course.id}`}
                className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl p-6 border border-orange-500/30 hover:border-orange-500/60 transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="text-6xl" aria-hidden="true">
                    {course.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-green-500/20 text-green-500 text-xs font-medium rounded-full">
                        {course.difficulty}
                      </span>
                      <span className="flex items-center gap-2 text-sm text-gray-400">
                        <Clock className="w-4 h-4" aria-hidden="true" />
                        {Math.round(course.totalDuration / 60)} hours
                      </span>
                      <span className="flex items-center gap-2 text-sm text-gray-400">
                        <BookOpen className="w-4 h-4" aria-hidden="true" />
                        {course.modules.length} modules
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-orange-500 transition-colors mb-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-400 mb-4">{course.description}</p>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1">
                      {course.outcomes.slice(0, 3).map((outcome) => (
                        <li key={outcome} className="flex items-center gap-1 text-xs text-gray-500">
                          <Target className="w-3 h-3 text-green-500" aria-hidden="true" />
                          {outcome}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 group-hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors">
                      View course
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* All guides */}
        <section className="mb-12" aria-labelledby="all-guides">
          <h2 id="all-guides" className="text-2xl font-bold text-white mb-4">
            {selectedCategory === 'All' ? 'All guides' : `${selectedCategory} guides`}
          </h2>
          <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filter guides by category">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={selectedCategory === category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuides.map((guide) => (
              <Link
                key={guide.id}
                to={`/learn/${guide.id}`}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-orange-500/50 transition-colors group"
              >
                <div className="text-4xl mb-4" aria-hidden="true">
                  {guide.icon}
                </div>
                <span className="text-xs font-medium text-orange-500 uppercase tracking-wide">
                  {guide.category}
                </span>
                <h3 className="text-lg font-semibold text-white mt-2 group-hover:text-orange-500 transition-colors">
                  {guide.title}
                </h3>
                <p className="text-gray-400 text-sm mt-2 mb-4">{guide.description}</p>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-4 h-4 mr-1" aria-hidden="true" />
                  {guide.readTime} min read
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* What changed recently */}
        <section className="mb-12" aria-labelledby="whats-new">
          <h2 id="whats-new" className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-orange-500" aria-hidden="true" />
            What changed in 2024–2026
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {WHATS_NEW.map((item) => (
              <div key={item.title} className="bg-gray-800/60 rounded-xl p-5 border border-gray-700">
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-300 mb-3">{item.text}</p>
                <Link to={item.link} className="text-sm text-orange-500 hover:text-orange-400 underline">
                  Read more
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Published Articles (database, optional) */}
        {(loading || articles.length > 0) && (
          <section className="mb-12" aria-labelledby="latest-articles" aria-busy={loading}>
            <h2 id="latest-articles" className="text-2xl font-bold text-white mb-6">
              Latest articles
            </h2>
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse">
                    <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                    <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/blog/${article.slug}`}
                    className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-orange-500/50 transition-colors group"
                  >
                    {article.featured_image && (
                      <img src={article.featured_image} alt="" className="w-full h-40 object-cover" loading="lazy" />
                    )}
                    <div className="p-6">
                      <span className="text-xs font-medium text-orange-500 uppercase tracking-wide">
                        {article.category}
                      </span>
                      <h3 className="text-lg font-semibold text-white mt-2 group-hover:text-orange-500 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-gray-400 text-sm mt-2 line-clamp-2">{article.excerpt}</p>
                      {article.read_time_minutes ? (
                        <p className="mt-4 text-xs text-gray-500">{article.read_time_minutes} min read</p>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* FAQ */}
        <section className="mb-12" aria-labelledby="learn-faq">
          <h2 id="learn-faq" className="text-2xl font-bold text-white mb-6">
            Frequently asked questions
          </h2>
          <div className="space-y-6 max-w-3xl">
            {LEARN_FAQS.map((faq) => (
              <div key={faq.question}>
                <h3 className="text-lg font-semibold text-white mb-2">{faq.question}</h3>
                <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Tools */}
        <section className="mb-12" aria-labelledby="tools">
          <h2 id="tools" className="text-2xl font-bold text-white mb-6">
            Tools to practise with
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { to: '/calculators', title: 'DCA calculator', text: 'Model a recurring purchase' },
              { to: '/compare', title: 'Compare exchanges', text: 'Fees and features side by side' },
              { to: '/compare?tab=wallets', title: 'Compare wallets', text: 'Hot and cold wallets' },
              { to: '/scam-database', title: 'Scam database', text: 'Check before you send money' },
            ].map((tool) => (
              <Link
                key={tool.to}
                to={tool.to}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-orange-500/50 transition-colors text-center"
              >
                <h3 className="font-semibold text-white">{tool.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{tool.text}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section>
          <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl p-8 border border-orange-500/20">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Get new guides by email</h2>
              <p className="text-gray-400 mb-6">
                We email when guides are added or materially updated. No spam; unsubscribe any time.
              </p>
              <Newsletter source="learn-page" variant="inline" />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
