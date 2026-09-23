/**
 * Blog listing: /blog and /blog/category/:category
 *
 * Renders from the build-time snapshot (src/content/blog/snapshot.json) on the
 * first render, so the heading, summary, SEO tags and any saved posts are
 * present without JavaScript or a database. Live Supabase results are merged
 * in afterwards (see useBlogIndex). Filtering, search and pagination all run
 * on the merged list in the browser.
 */

import { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Tag,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calculator,
  BookA,
  Scale,
  ShieldAlert,
} from 'lucide-react';
import { BlogPostCard } from '../components/blog/BlogPostCard';
import { useBlogIndex } from '../components/blog/useBlogData';
import { buildCollectionSchema, formatDate } from '../components/blog/blogUtils';
import { filterPosts } from '../services/blog';
import { resolveCategory } from '../content/blog';
import { Newsletter } from '../components/Newsletter';
import { SEO, generateBreadcrumbSchema } from '../components/SEO';
import { PAGE_METADATA } from '../lib/seo';
import { NotFound } from './NotFound';

const PAGE_SIZE = 12;
/** When the hub copy on this page was last reviewed. */
const PAGE_REVIEWED = '2026-09-23';

/** Evergreen, static sections of the site that always exist. */
const EVERGREEN_LINKS = [
  {
    to: '/learn',
    label: 'Beginner guides',
    text: 'Step-by-step guides: what Bitcoin is, buying safely, wallets, DCA and DeFi risks.',
    icon: BookOpen,
  },
  {
    to: '/glossary',
    label: 'Crypto glossary',
    text: 'Plain-English definitions of the terms you will meet in crypto news.',
    icon: BookA,
  },
  {
    to: '/calculators',
    label: 'Calculators',
    text: 'DCA, fee, staking and tax calculators that run in your browser.',
    icon: Calculator,
  },
  {
    to: '/compare',
    label: 'Compare platforms',
    text: 'Side-by-side comparisons of exchanges and wallets.',
    icon: Scale,
  },
  {
    to: '/scam-database',
    label: 'Scam database',
    text: 'Common crypto scams, warning signs and what to do if you are targeted.',
    icon: ShieldAlert,
  },
];

function pageWindow(current: number, total: number): Array<number | 'gap'> {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: Array<number | 'gap'> = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap');
    out.push(p);
  });
  return out;
}

function clampDescription(text: string): string {
  if (text.length <= 160) return text;
  return `${text.slice(0, 157).replace(/\s+\S*$/, '')}...`;
}

export function Blog() {
  const { category: categoryParam } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tagParam = searchParams.get('tag') || undefined;
  const searchParam = searchParams.get('q') || undefined;
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const [searchQuery, setSearchQuery] = useState(searchParam || '');

  const { index, live } = useBlogIndex();
  const { posts: allPosts, categories } = index;

  const categorySlug = categoryParam?.toLowerCase();
  const knownCategory = categorySlug
    ? categories.find((c) => c.slug.toLowerCase() === categorySlug)
    : undefined;
  // Only call a category unknown once we have an authoritative category list.
  const categoryListSettled = live !== 'loading' && categories.length > 0;
  if (categorySlug && !knownCategory && categoryListSettled) {
    return <NotFound />;
  }
  const currentCategory = categorySlug
    ? knownCategory
      ? { slug: knownCategory.slug, name: knownCategory.name, description: knownCategory.description }
      : { ...resolveCategory(categorySlug, []), description: null }
    : null;

  const filtered = filterPosts(allPosts, { category: categorySlug, tag: tagParam, search: searchParam });
  const isUnfiltered = !categorySlug && !tagParam && !searchParam;
  const featuredPost = isUnfiltered && filtered.length > 1 ? filtered[0] : null;
  const gridPosts = featuredPost ? filtered.slice(1) : filtered;
  const totalPages = Math.max(1, Math.ceil(gridPosts.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number.isFinite(rawPage) ? rawPage : 1), totalPages);
  const pagePosts = gridPosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const showFeatured = featuredPost && page === 1;

  const tagCounts = new Map<string, number>();
  allPosts.forEach((p) => p.tags.forEach((t) => tagCounts.set(t, (tagCounts.get(t) || 0) + 1)));
  const popularTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 20)
    .map(([t]) => t);

  const newest = allPosts[0];
  const lastUpdated = newest ? newest.published_at || newest.updated_at : PAGE_REVIEWED;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setSearchParams(q ? { q } : {});
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    if (newPage <= 1) params.delete('page');
    else params.set('page', String(newPage));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ---- SEO ----
  const base = PAGE_METADATA.blog;
  const path = currentCategory ? `/blog/category/${currentCategory.slug}` : '/blog';
  const seoTitle = currentCategory ? `${currentCategory.name} Articles & Analysis` : base.title;
  const seoDescription = currentCategory
    ? clampDescription(
        `${currentCategory.name} articles from Bitcoinvestments${
          currentCategory.description ? `: ${currentCategory.description.replace(/\.$/, '')}` : ''
        }. Plain-English analysis for everyday crypto investors${
          currentCategory.description ? '' : ', with links to our free guides and calculators'
        }.`
      )
    : base.description;
  const h1 = currentCategory
    ? `${currentCategory.name} Articles`
    : 'Bitcoinvestments Blog: Crypto News, Analysis & Guides';
  // Thin or duplicate listings stay out of the index.
  const noindex = Boolean(searchParam || tagParam) || filtered.length === 0;

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
    ...(currentCategory ? [{ name: currentCategory.name, url: path }] : []),
  ];

  return (
    <div className="min-h-screen py-12">
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={base.keywords}
        url={`https://bitcoinvestments.net${path}`}
        noindex={noindex}
        blufSummary={seoDescription}
        schema={[
          buildCollectionSchema({
            name: h1,
            description: seoDescription,
            path,
            posts: filtered.slice(0, 30),
          }),
          generateBreadcrumbSchema(breadcrumbs),
        ]}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{h1}</h1>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto">
            {currentCategory
              ? `Every Bitcoinvestments article filed under ${currentCategory.name}${
                  currentCategory.description ? ` — ${currentCategory.description.replace(/\.$/, '')}` : ''
                }. Each post page links to related guides and tools.`
              : 'Plain-English crypto news analysis and explainers for everyday investors: what happened, why it matters, and what (if anything) to do about it. Posts link to our free guides, glossary and calculators so you can check the details yourself.'}
          </p>
          <p className="mt-3 text-sm text-slate-500">
            {newest ? 'Latest post published ' : 'Page last reviewed '}
            <time dateTime={lastUpdated}>{formatDate(lastUpdated)}</time>
          </p>

          {tagParam && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Tag className="w-4 h-4 text-orange-400" aria-hidden="true" />
              <span className="text-orange-400 font-medium">Posts tagged "{tagParam}"</span>
              <Link to="/blog" className="text-sm text-slate-400 hover:text-white ml-2">
                Clear
              </Link>
            </div>
          )}

          {searchParam && (
            <div className="mt-4 text-slate-400">
              Search results for "{searchParam}"
              <Link to="/blog" className="text-sm text-orange-400 hover:text-orange-300 ml-2">
                Clear
              </Link>
            </div>
          )}
        </header>

        {live === 'failed' && allPosts.length > 0 && (
          <p className="mb-6 text-sm text-slate-400 bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3" role="status">
            Showing the posts saved at our last site update. We could not reach the article database just now, so
            anything published since may be missing.
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {showFeatured && featuredPost && (
              <div className="mb-8">
                <BlogPostCard post={featuredPost} variant="featured" />
              </div>
            )}

            {pagePosts.length > 0 ? (
              <section aria-labelledby="blog-posts-heading">
                <h2 id="blog-posts-heading" className="sr-only">
                  {currentCategory ? `${currentCategory.name} posts` : 'Latest posts'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pagePosts.map((post) => (
                    <BlogPostCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            ) : showFeatured ? null : live === 'loading' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-slate-800/50 rounded-xl border border-white/10 overflow-hidden animate-pulse"
                  >
                    <div className="aspect-video bg-slate-700" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-slate-700 rounded w-1/4" />
                      <div className="h-5 bg-slate-700 rounded w-3/4" />
                      <div className="h-4 bg-slate-700 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                filtered={!isUnfiltered}
                unreachable={live === 'failed'}
                categoryName={currentCategory?.name}
              />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2 mt-12" aria-label="Blog pages">
                <button
                  type="button"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {pageWindow(page, totalPages).map((p, i) =>
                    p === 'gap' ? (
                      <span key={`gap-${i}`} className="px-2 text-slate-500" aria-hidden="true">
                        …
                      </span>
                    ) : (
                      <button
                        type="button"
                        key={p}
                        onClick={() => handlePageChange(p)}
                        aria-current={p === page ? 'page' : undefined}
                        aria-label={`Page ${p}`}
                        className={`w-10 h-10 rounded-lg transition-colors ${
                          p === page ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </nav>
            )}

            {/* What this blog is */}
            <section className="mt-16 p-6 bg-slate-800/30 rounded-xl border border-white/10" aria-labelledby="blog-about-heading">
              <h2 id="blog-about-heading" className="text-xl font-semibold text-white mb-3">
                About this blog
              </h2>
              <p className="text-slate-300 mb-3">
                The Bitcoinvestments blog covers crypto news and market developments for beginner and intermediate
                investors. We explain what changed and why it matters, and point to the evergreen guide or tool that
                goes deeper.
              </p>
              <p className="text-sm text-slate-400">
                Nothing on this blog is financial, tax or legal advice. Crypto assets are volatile and you can lose
                money; do your own research and consider speaking to a qualified professional.
              </p>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6" aria-label="Blog navigation">
            {/* Search */}
            <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4">
              <h2 className="text-sm font-semibold text-white mb-3">
                <label htmlFor="blog-search">Search posts</label>
              </h2>
              <form onSubmit={handleSearch} className="relative" role="search">
                <input
                  id="blog-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
              </form>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <nav className="bg-slate-800/50 rounded-xl border border-white/10 p-4" aria-labelledby="blog-categories-heading">
                <h2 id="blog-categories-heading" className="text-sm font-semibold text-white mb-3">
                  Categories
                </h2>
                <div className="space-y-1">
                  <Link
                    to="/blog"
                    aria-current={!categorySlug ? 'page' : undefined}
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                      !categorySlug ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    All posts
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id || cat.slug}
                      to={`/blog/category/${cat.slug}`}
                      aria-current={categorySlug === cat.slug.toLowerCase() ? 'page' : undefined}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        categorySlug === cat.slug.toLowerCase()
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </nav>
            )}

            {/* Tags */}
            {popularTags.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4">
                <h2 className="text-sm font-semibold text-white mb-3">Popular tags</h2>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/blog?tag=${encodeURIComponent(tag)}`}
                      aria-current={tagParam === tag ? 'page' : undefined}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        tagParam === tag ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Evergreen content */}
            <nav className="bg-slate-800/50 rounded-xl border border-white/10 p-4" aria-labelledby="blog-start-heading">
              <h2 id="blog-start-heading" className="text-sm font-semibold text-white mb-3">
                Start here
              </h2>
              <ul className="space-y-2">
                {EVERGREEN_LINKS.slice(0, 3).map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-orange-400 hover:text-orange-300">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Newsletter */}
            <div id="newsletter">
              <Newsletter source="blog-sidebar" variant="card" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  filtered,
  unreachable,
  categoryName,
}: {
  filtered: boolean;
  unreachable: boolean;
  categoryName?: string;
}) {
  const heading = filtered
    ? categoryName
      ? `No ${categoryName} posts yet`
      : 'No posts match that'
    : 'New posts are on the way';
  return (
    <section className="py-8" aria-labelledby="blog-empty-heading">
      <h2 id="blog-empty-heading" className="text-2xl font-semibold text-white mb-3">
        {heading}
      </h2>
      <p className="text-slate-300 mb-2">
        {filtered
          ? 'Try another category or search term, or browse everything on the blog.'
          : 'We have not published any blog posts yet. In the meantime, our evergreen guides and tools answer the questions most new investors ask.'}
      </p>
      {unreachable && (
        <p className="text-sm text-slate-400 mb-2" role="status">
          We could not reach the article database just now, so recent posts may not be listed. Please try again
          later.
        </p>
      )}
      {filtered && (
        <Link to="/blog" className="inline-block text-orange-400 hover:text-orange-300 mb-6">
          View all posts
        </Link>
      )}
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {EVERGREEN_LINKS.map(({ to, label, text, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex gap-3 h-full p-4 bg-slate-800/50 rounded-xl border border-white/10 hover:border-orange-500/30 transition-colors"
            >
              <Icon className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                <span className="block font-medium text-white">{label}</span>
                <span className="block text-sm text-slate-400">{text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default Blog;
