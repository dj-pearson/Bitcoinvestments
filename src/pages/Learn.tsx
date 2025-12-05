import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Clock, BookOpen, ChevronRight, Target } from 'lucide-react';
import { getPublishedArticles } from '../services/database';
import { Newsletter } from '../components/Newsletter';
import { getAllCourses } from '../data/courses';
import type { Article } from '../types/database';

// Static beginner guides (can be moved to database later)
const BEGINNER_GUIDES = [
  {
    id: 'what-is-bitcoin',
    title: 'What is Bitcoin? A Beginner\'s Guide',
    description: 'Learn the basics of Bitcoin, how it works, and why it matters for the future of money.',
    category: 'Basics',
    readTime: 8,
    icon: '₿',
  },
  {
    id: 'how-to-buy-crypto',
    title: 'How to Buy Your First Cryptocurrency',
    description: 'Step-by-step guide to purchasing Bitcoin and other cryptocurrencies safely.',
    category: 'Getting Started',
    readTime: 10,
    icon: '🛒',
  },
  {
    id: 'crypto-wallets-explained',
    title: 'Crypto Wallets Explained',
    description: 'Understanding hot wallets, cold wallets, and how to keep your crypto secure.',
    category: 'Security',
    readTime: 12,
    icon: '🔐',
  },
  {
    id: 'understanding-blockchain',
    title: 'Understanding Blockchain Technology',
    description: 'The technology behind cryptocurrencies and why it\'s revolutionary.',
    category: 'Basics',
    readTime: 15,
    icon: '⛓️',
  },
  {
    id: 'crypto-taxes-basics',
    title: 'Cryptocurrency Taxes: What You Need to Know',
    description: 'A beginner-friendly guide to crypto tax obligations in the US.',
    category: 'Taxes',
    readTime: 10,
    icon: '📊',
  },
  {
    id: 'common-crypto-mistakes',
    title: '10 Common Crypto Mistakes to Avoid',
    description: 'Learn from others\' mistakes and protect your investment.',
    category: 'Tips',
    readTime: 7,
    icon: '⚠️',
  },
  // Advanced Trading Strategies
  {
    id: 'dca-strategies',
    title: 'Advanced DCA Strategies',
    description: 'Master sophisticated DCA variations including value averaging and dynamic strategies.',
    category: 'Trading',
    readTime: 15,
    icon: '📈',
  },
  {
    id: 'portfolio-rebalancing',
    title: 'Crypto Portfolio Rebalancing',
    description: 'Learn when and how to rebalance your portfolio for optimal allocation.',
    category: 'Trading',
    readTime: 14,
    icon: '⚖️',
  },
  {
    id: 'risk-management',
    title: 'Crypto Risk Management',
    description: 'Position sizing, stop-losses, and portfolio protection strategies.',
    category: 'Trading',
    readTime: 16,
    icon: '🛡️',
  },
  // DeFi Explained Series
  {
    id: 'defi-basics',
    title: 'DeFi Explained: Understanding DeFi',
    description: 'A comprehensive introduction to decentralized finance protocols and how they work.',
    category: 'DeFi',
    readTime: 18,
    icon: '🏦',
  },
  {
    id: 'yield-farming',
    title: 'Yield Farming Guide',
    description: 'Learn yield farming strategies, liquidity provision, and how to maximize returns.',
    category: 'DeFi',
    readTime: 20,
    icon: '🌾',
  },
  {
    id: 'defi-risks',
    title: 'DeFi Risks Explained',
    description: 'Smart contract risks, rug pulls, and how to protect yourself in DeFi.',
    category: 'DeFi',
    readTime: 17,
    icon: '⚠️',
  },
];

const CATEGORIES = ['All', 'Basics', 'Getting Started', 'Security', 'Trading', 'DeFi', 'Taxes', 'Tips'];

export function Learn() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    async function loadArticles() {
      const publishedArticles = await getPublishedArticles(undefined, 20);
      setArticles(publishedArticles);
      setLoading(false);
    }
    loadArticles();
  }, []);

  const filteredGuides =
    selectedCategory === 'All'
      ? BEGINNER_GUIDES
      : BEGINNER_GUIDES.filter((g) => g.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Learn Crypto Investing
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          From complete beginner to confident investor. Our guides make crypto simple.
        </p>
      </div>

      {/* Featured Courses Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <GraduationCap className="w-7 h-7 text-orange-500" />
            Featured Courses
          </h2>
        </div>
        <div className="grid md:grid-cols-1 lg:grid-cols-1 gap-6">
          {getAllCourses().map((course) => (
            <Link
              key={course.id}
              to={`/course/${course.id}`}
              className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl p-6 border border-orange-500/30 hover:border-orange-500/60 transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="text-6xl">{course.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-green-500/20 text-green-500 text-xs font-medium rounded-full">
                      {course.difficulty}
                    </span>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      {Math.round(course.totalDuration / 60)} hours
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <BookOpen className="w-4 h-4" />
                      {course.moduleCount} modules
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-orange-500 transition-colors mb-2">
                    {course.title}
                  </h3>
                  <p className="text-gray-400 mb-4">{course.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {course.outcomes.slice(0, 3).map((outcome, index) => (
                      <div key={index} className="flex items-center gap-1 text-xs text-gray-500">
                        <Target className="w-3 h-3 text-green-500" />
                        {outcome}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors">
                    Start Course
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {CATEGORIES.map((category) => (
          <button
            key={category}
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

      {/* Guides Grid */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">
          {selectedCategory === 'All' ? 'All Guides' : `${selectedCategory} Guides`}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuides.map((guide) => (
            <Link
              key={guide.id}
              to={`/learn/${guide.id}`}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-orange-500/50 transition-colors group"
            >
              <div className="text-4xl mb-4">{guide.icon}</div>
              <span className="text-xs font-medium text-orange-500 uppercase tracking-wide">
                {guide.category}
              </span>
              <h3 className="text-lg font-semibold text-white mt-2 group-hover:text-orange-500 transition-colors">
                {guide.title}
              </h3>
              <p className="text-gray-400 text-sm mt-2 mb-4">{guide.description}</p>
              <div className="flex items-center text-xs text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {guide.readTime} min read
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="mb-12">
        <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl p-8 border border-orange-500/20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Get Weekly Crypto Insights
            </h2>
            <p className="text-gray-400 mb-6">
              Join 10,000+ investors learning crypto the smart way. No spam, just value.
            </p>
            <Newsletter source="learn-page" variant="inline" />
          </div>
        </div>
      </section>

      {/* Published Articles */}
      {articles.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Latest Articles</h2>
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-xl p-6 animate-pulse">
                  <div className="h-40 bg-gray-700 rounded-lg mb-4"></div>
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
                  to={`/article/${article.slug}`}
                  className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-orange-500/50 transition-colors group"
                >
                  {article.featured_image && (
                    <img
                      src={article.featured_image}
                      alt=""
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <span className="text-xs font-medium text-orange-500 uppercase tracking-wide">
                      {article.category}
                    </span>
                    <h3 className="text-lg font-semibold text-white mt-2 group-hover:text-orange-500 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                      <span>{article.read_time_minutes} min read</span>
                      <span>{article.view_count.toLocaleString()} views</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Quick Tools */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Investment Tools</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/calculators"
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-orange-500/50 transition-colors text-center"
          >
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white">DCA Calculator</h3>
            <p className="text-sm text-gray-400 mt-1">Plan your investment strategy</p>
          </Link>

          <Link
            to="/compare"
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-orange-500/50 transition-colors text-center"
          >
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <h3 className="font-semibold text-white">Compare Exchanges</h3>
            <p className="text-sm text-gray-400 mt-1">Find the best platform for you</p>
          </Link>

          <Link
            to="/dashboard"
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-orange-500/50 transition-colors text-center"
          >
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white">Market Dashboard</h3>
            <p className="text-sm text-gray-400 mt-1">Live prices & trends</p>
          </Link>

          <Link
            to="/compare?type=wallets"
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-orange-500/50 transition-colors text-center"
          >
            <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white">Wallet Guide</h3>
            <p className="text-sm text-gray-400 mt-1">Secure your crypto</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
