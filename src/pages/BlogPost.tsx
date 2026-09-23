/**
 * Blog post: /blog/:slug (the one canonical URL for every `articles` row).
 *
 * A post present in the build-time snapshot renders completely on the first
 * render — H1, byline, dates, body, JSON-LD — with no network request. The
 * live row from Supabase then replaces it if it is newer. Unknown slugs render
 * <NotFound /> once the database confirms the post is not published (or
 * immediately when there is no database and no snapshot copy).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  ArrowLeft,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  Check,
  Tag,
  ChevronRight,
  User,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { BlogPostCard } from '../components/blog/BlogPostCard';
import { useBlogIndex, useBlogPost } from '../components/blog/useBlogData';
import {
  SITE_URL,
  addHeadingIds,
  buildBlogPostingSchema,
  formatDate,
  wasUpdated,
} from '../components/blog/blogUtils';
import { getRelatedFrom, incrementArticleView } from '../services/blog';
import { FALLBACK_AUTHOR_NAME, resolveCategory } from '../content/blog';
import { Newsletter } from '../components/Newsletter';
import { SEO, generateBreadcrumbSchema } from '../components/SEO';
import { sanitizeArticleHtml } from '../lib/validation';
import { NotFound } from './NotFound';
import type { BlogPost as BlogPostType } from '../types/blog';

/** Evergreen guides and tools to read next, by category slug. */
const KEEP_LEARNING: Record<string, Array<{ to: string; label: string }>> = {
  bitcoin: [
    { to: '/learn/what-is-bitcoin', label: 'What is Bitcoin?' },
    { to: '/learn/how-to-buy-crypto', label: 'How to buy crypto safely' },
  ],
  altcoins: [
    { to: '/learn/understanding-blockchain', label: 'Understanding blockchain' },
    { to: '/learn/common-crypto-mistakes', label: 'Common crypto mistakes' },
  ],
  defi: [
    { to: '/learn/defi-basics', label: 'DeFi basics' },
    { to: '/learn/defi-risks', label: 'DeFi risks' },
  ],
  trading: [
    { to: '/learn/risk-management', label: 'Risk management' },
    { to: '/learn/dca-strategies', label: 'Dollar-cost averaging strategies' },
  ],
  security: [
    { to: '/learn/crypto-wallets-explained', label: 'Crypto wallets explained' },
    { to: '/scam-database', label: 'Crypto scam database' },
  ],
  regulation: [
    { to: '/learn/crypto-taxes-basics', label: 'Crypto tax basics' },
    { to: '/learn/common-crypto-mistakes', label: 'Common crypto mistakes' },
  ],
  technology: [
    { to: '/learn/understanding-blockchain', label: 'Understanding blockchain' },
    { to: '/learn/what-is-bitcoin', label: 'What is Bitcoin?' },
  ],
  education: [
    { to: '/learn', label: 'All beginner guides' },
    { to: '/learn/common-crypto-mistakes', label: 'Common crypto mistakes' },
  ],
};
const ALWAYS_LEARNING = [
  { to: '/glossary', label: 'Crypto glossary' },
  { to: '/calculators', label: 'Free crypto calculators' },
];

export function BlogPost() {
  const { slug } = useParams();
  const { index } = useBlogIndex();
  const state = useBlogPost(slug, index.categories);
  const [copied, setCopied] = useState(false);
  const countedSlug = useRef<string | null>(null);

  const post: BlogPostType | null = state.status === 'ready' ? state.post : null;

  // Sanitise once per body, then anchor the headings in the same string the
  // table of contents is built from, so every TOC link has a target.
  const body = useMemo(
    () => (post ? addHeadingIds(sanitizeArticleHtml(post.content)) : { html: '', toc: [] }),
    [post]
  );

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  // Count the view once per slug, in the background.
  useEffect(() => {
    if (!post || countedSlug.current === post.slug) return;
    countedSlug.current = post.slug;
    incrementArticleView(post.slug);
  }, [post]);

  if (state.status === 'missing') {
    return <NotFound />;
  }

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen py-12">
        <SEO title="Loading article" noindex />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8" aria-busy="true">
          <p className="sr-only" role="status">
            Loading article…
          </p>
          <div className="animate-pulse space-y-6" aria-hidden="true">
            <div className="h-8 bg-slate-800 rounded w-3/4" />
            <div className="h-4 bg-slate-800 rounded w-1/4" />
            <div className="aspect-video bg-slate-800 rounded-xl" />
            <div className="space-y-4">
              <div className="h-4 bg-slate-800 rounded w-full" />
              <div className="h-4 bg-slate-800 rounded w-full" />
              <div className="h-4 bg-slate-800 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === 'error' || !post) {
    return (
      <div className="min-h-screen py-12 flex items-center justify-center">
        <SEO title="Article temporarily unavailable" noindex />
        <div className="text-center px-4 max-w-lg">
          <h1 className="text-2xl font-bold text-white mb-4">This article could not be loaded</h1>
          <p className="text-slate-400 mb-6">
            We could not reach our article database just now. Please try again in a moment, or browse the rest of
            the blog.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Try again
            </button>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Back to Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const category = resolveCategory(post.category, index.categories);
  const canonical = `${SITE_URL}/blog/${post.slug}`;
  const shareTitle = post.title;
  const publishedIso = post.published_at || post.created_at;
  const showUpdated = wasUpdated(post);
  const authorName = post.author?.display_name || FALLBACK_AUTHOR_NAME;
  const related = getRelatedFrom(index.posts, post, 3);
  const keepLearning = [...(KEEP_LEARNING[category.slug] || []), ...ALWAYS_LEARNING];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(canonical);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context or permission denied).
      window.prompt('Copy this link:', canonical);
    }
  };

  return (
    <>
      <SEO
        title={post.seo_title || post.title}
        description={post.seo_description || post.excerpt}
        keywords={post.meta_keywords?.length ? post.meta_keywords : post.tags}
        image={post.og_image || post.featured_image || undefined}
        imageAlt={post.title}
        url={canonical}
        type="article"
        author={authorName}
        publishedTime={publishedIso || undefined}
        modifiedTime={post.updated_at || undefined}
        section={category.name}
        tags={post.tags}
        blufSummary={post.excerpt}
        contentCategory={category.name}
        schema={[
          buildBlogPostingSchema(post, category.name),
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Blog', url: '/blog' },
            ...(category.slug ? [{ name: category.name, url: `/blog/category/${category.slug}` }] : []),
            { name: post.title, url: `/blog/${post.slug}` },
          ]),
        ]}
      />

      <article className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Blog
          </Link>

          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {category.slug && (
                <Link
                  to={`/blog/category/${category.slug}`}
                  className="px-3 py-1 bg-orange-500/20 text-orange-400 text-sm font-medium rounded-full hover:bg-orange-500/30 transition-colors"
                >
                  {category.name}
                </Link>
              )}
              {post.ai_generated && (
                <span className="flex items-center gap-1 px-3 py-1 bg-violet-500/20 text-violet-300 text-sm font-medium rounded-full">
                  <Sparkles className="w-3 h-3" aria-hidden="true" />
                  Written with AI assistance
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Answer-first summary */}
            {post.excerpt && <p className="text-lg text-slate-300 mb-6">{post.excerpt}</p>}

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-6">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" aria-hidden="true" />
                <span>By {authorName}</span>
              </div>
              {publishedIso && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  <span>
                    Published <time dateTime={publishedIso}>{formatDate(publishedIso)}</time>
                  </span>
                </div>
              )}
              {showUpdated && (
                <div className="flex items-center gap-2">
                  <span>
                    Updated <time dateTime={post.updated_at}>{formatDate(post.updated_at)}</time>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" aria-hidden="true" />
                <span>{post.read_time_minutes} min read</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">Share:</span>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(canonical)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on X (Twitter)"
                className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white hover:bg-slate-700 transition-colors"
              >
                <Twitter className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonical)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on Facebook"
                className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white hover:bg-slate-700 transition-colors"
              >
                <Facebook className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(canonical)}&title=${encodeURIComponent(shareTitle)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on LinkedIn"
                className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white hover:bg-slate-700 transition-colors"
              >
                <Linkedin className="w-4 h-4" aria-hidden="true" />
              </a>
              <button
                type="button"
                onClick={handleCopyLink}
                aria-label={copied ? 'Link copied' : 'Copy link to this article'}
                className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white hover:bg-slate-700 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" aria-hidden="true" />
                ) : (
                  <LinkIcon className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
              <span className="sr-only" role="status">
                {copied ? 'Link copied to clipboard' : ''}
              </span>
            </div>
          </header>

          {post.featured_image && (
            <div className="mb-8 rounded-2xl overflow-hidden">
              <img
                src={post.featured_image}
                alt=""
                width={1200}
                height={675}
                loading="eager"
                decoding="async"
                className="w-full aspect-video object-cover"
              />
            </div>
          )}

          {body.toc.length > 2 && (
            <nav
              className="mb-8 p-4 bg-slate-800/50 rounded-xl border border-white/10"
              aria-labelledby="toc-heading"
            >
              <h2 id="toc-heading" className="text-sm font-semibold text-white mb-3">
                Table of Contents
              </h2>
              <ul className="space-y-2">
                {body.toc.map((heading) => (
                  <li key={heading.id}>
                    <a
                      href={`#${heading.id}`}
                      className="flex items-center gap-2 text-sm text-slate-400 hover:text-orange-400 transition-colors"
                    >
                      <ChevronRight className="w-3 h-3" aria-hidden="true" />
                      {heading.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div
            className="prose prose-lg prose-invert max-w-none
              prose-headings:text-white prose-headings:font-bold prose-headings:scroll-mt-24
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-6
              prose-a:text-orange-400 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white
              prose-code:text-orange-300 prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-slate-900 prose-pre:border prose-pre:border-white/10
              prose-blockquote:border-l-4 prose-blockquote:border-orange-500 prose-blockquote:bg-slate-800/30 prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:not-italic prose-blockquote:text-slate-300
              prose-ul:list-disc prose-ul:pl-6 prose-ul:text-slate-300
              prose-ol:list-decimal prose-ol:pl-6 prose-ol:text-slate-300
              prose-li:mb-2
              prose-img:rounded-xl prose-img:mx-auto
              prose-hr:border-white/10
            "
            // Stored article HTML is untrusted on the read path: it is
            // sanitised before the heading anchors are added.
            dangerouslySetInnerHTML={{ __html: body.html }}
          />

          {post.ai_generated && (
            // NEEDS-OWNER: state who reviews AI-assisted posts and when, once an
            // editorial review process (and a `reviewed_by` field) exists.
            <p className="mt-8 text-sm text-slate-400 border-l-2 border-violet-500/50 pl-3">
              This article was drafted with the help of AI tools and published by the Bitcoinvestments team. Check
              important facts against the linked sources before acting on them.
            </p>
          )}

          <p className="mt-8 text-sm text-slate-500">
            This article is for education only and is not financial, tax or legal advice. Crypto assets are volatile
            and you can lose money.
          </p>

          {post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-white/10">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-4 h-4 text-slate-500" aria-hidden="true" />
                <span className="sr-only">Tags:</span>
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="px-3 py-1 bg-slate-800 text-sm text-slate-300 rounded-full hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Author */}
          <section className="mt-12 p-6 bg-slate-800/50 rounded-xl border border-white/10" aria-labelledby="author-heading">
            <div className="flex items-start gap-4">
              {post.author?.avatar_url ? (
                <img
                  src={post.author.avatar_url}
                  alt=""
                  width={64}
                  height={64}
                  loading="lazy"
                  className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0"
                  aria-hidden="true"
                >
                  <span className="text-2xl font-bold text-white">{authorName.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div>
                <h2 id="author-heading" className="font-semibold text-white">
                  {authorName}
                </h2>
                {post.author?.credentials && (
                  <p className="text-sm text-orange-300 mb-1">{post.author.credentials}</p>
                )}
                <p className="text-sm text-slate-400">
                  {post.author?.bio ||
                    'Posts without a named author are written and edited by the Bitcoinvestments editorial team.'}
                </p>
                {post.author?.profile_links && post.author.profile_links.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-3 text-sm">
                    {post.author.profile_links.map((href) => (
                      <li key={href}>
                        <a href={href} target="_blank" rel="me noopener noreferrer" className="text-orange-400 hover:text-orange-300">
                          {href.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* Keep learning */}
          <nav className="mt-8 p-6 bg-slate-800/30 rounded-xl border border-white/10" aria-labelledby="keep-learning-heading">
            <h2 id="keep-learning-heading" className="text-lg font-semibold text-white mb-3">
              Keep learning
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {keepLearning.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300">
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {related.length > 0 && (
            <section className="mt-16" aria-labelledby="related-heading">
              <h2 id="related-heading" className="text-2xl font-bold text-white mb-6">
                Related Posts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {related.map((relatedPost) => (
                  <BlogPostCard key={relatedPost.id} post={relatedPost} />
                ))}
              </div>
            </section>
          )}

          <div id="newsletter" className="mt-16">
            <Newsletter source="blog-post" variant="card" />
          </div>
        </div>
      </article>
    </>
  );
}

export default BlogPost;
