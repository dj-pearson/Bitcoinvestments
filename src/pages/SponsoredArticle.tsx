/**
 * Sponsored Article page (`/sponsored/:slug`)
 *
 * The advertiser side of sponsored content was already live — advertisers can
 * create campaigns and articles from `/advertiser`, and `SponsoredArticleCard`
 * has always linked here — but the reader-facing route did not exist, so every
 * one of those links 404'd and a paid article could not actually be read.
 *
 * FTC disclosure is non-negotiable here: the sponsored label is rendered above
 * the fold, before the headline, and never behind a conditional that content
 * can influence.
 */

import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, ExternalLink, Calendar, RefreshCw } from 'lucide-react';
import {
  getSponsoredArticleBySlug,
  trackSponsoredContentEvent,
  getDisclosureText,
  type SponsoredArticle as SponsoredArticleType,
} from '../services/sponsoredContent';
import { sanitizeArticleHtml } from '../lib/validation';
import { SEO, generateBreadcrumbSchema } from '../components/SEO';
import { formatDate } from '../components/blog/blogUtils';
import { NotFound } from './NotFound';

/** Give up on the fetch after this long and show the unavailable state. */
const LOAD_TIMEOUT_MS = 8000;

export function SponsoredArticle() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<SponsoredArticleType | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [failed, setFailed] = useState(false);

  // One view event per article, even if the effect re-runs.
  const trackedId = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setNotFound(false);
      setFailed(false);

      // The whole page depends on this one request, so it must always settle.
      // A request that hangs — an unreachable database, an offline client, a
      // dropped connection — would otherwise leave the reader on the loading
      // skeleton indefinitely with no way to tell something went wrong.
      let data: SponsoredArticleType | null = null;
      let error = false;
      try {
        data = await Promise.race([
          getSponsoredArticleBySlug(slug),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('timed out')), LOAD_TIMEOUT_MS)
          ),
        ]);
      } catch (err) {
        console.error('Failed to load sponsored article:', err);
        error = true;
      }

      if (cancelled) return;

      if (error) {
        setFailed(true);
      } else if (!data) {
        setNotFound(true);
      } else {
        setArticle(data);
      }
      setLoading(false);
    }

    load();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!article || trackedId.current === article.id) return;
    trackedId.current = article.id;
    trackSponsoredContentEvent('article', article.id, 'view');
  }, [article]);

  const handleCtaClick = () => {
    if (article) {
      trackSponsoredContentEvent('article', article.id, 'cta_click', {
        destination: article.ctaUrl,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-4 bg-slate-800 rounded w-32" />
            <div className="h-9 bg-slate-800 rounded w-3/4" />
            <div className="aspect-video bg-slate-800 rounded-xl" />
            <div className="space-y-3">
              <div className="h-4 bg-slate-800 rounded w-full" />
              <div className="h-4 bg-slate-800 rounded w-full" />
              <div className="h-4 bg-slate-800 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return <NotFound />;
  }

  if (failed || !article) {
    return (
      <div className="min-h-screen py-12 flex items-center justify-center">
        <SEO title="Sponsored Article Unavailable" noindex nofollow />
        <div className="text-center px-4">
          <h1 className="text-2xl font-bold text-white mb-4">This article could not be loaded</h1>
          <p className="text-slate-400 mb-6">Please try again in a moment.</p>
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

  const publishedDate = formatDate(article.publishedAt);
  const sponsorName = article.sponsorName || article.sponsor?.name;
  const sponsorUrl = article.sponsorWebsiteUrl || article.sponsor?.websiteUrl;

  return (
    <article className="min-h-screen py-12">
      {/*
        Paid placements are noindexed: they are advertising rather than
        editorial, and indexing them invites both thin-content and paid-link
        penalties. `nofollow` covers the sponsor's outbound CTA.
      */}
      <SEO
        title={article.seoTitle || article.title}
        description={article.seoDescription || article.excerpt || article.title}
        image={article.featuredImage}
        imageAlt={article.title}
        type="article"
        noindex
        nofollow
        schema={generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
          { name: article.title, url: `/sponsored/${article.slug}` },
        ])}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        {/* FTC disclosure — always rendered, above the headline, naming the payer. */}
        <p className="flex flex-wrap items-center gap-3 mb-4" role="note">
          <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-semibold uppercase tracking-wide border border-amber-500/30">
            {getDisclosureText('article')}
          </span>
          <span className="text-sm text-slate-300">
            {sponsorName ? (
              <>
                Sponsored — paid for by{' '}
                {sponsorUrl && /^https?:\/\//i.test(sponsorUrl) ? (
                  <a
                    href={sponsorUrl}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    className="text-slate-100 font-medium underline decoration-dotted"
                  >
                    {sponsorName}
                  </a>
                ) : (
                  <span className="text-slate-100 font-medium">{sponsorName}</span>
                )}
              </>
            ) : (
              'Sponsored — this is a paid placement by an advertiser'
            )}
          </span>
        </p>

        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{article.title}</h1>

        {article.excerpt && <p className="text-lg text-slate-300 mb-6">{article.excerpt}</p>}

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-8">
          {article.authorName && <span>By {article.authorName}</span>}
          {publishedDate && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              {publishedDate}
            </span>
          )}
          {article.readTimeMinutes > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4" aria-hidden="true" />
              {article.readTimeMinutes} min read
            </span>
          )}
        </div>

        {article.featuredImage && (
          <img
            src={article.featuredImage}
            alt={article.title}
            className="w-full rounded-xl mb-8"
            width={1200}
            height={630}
            loading="eager"
            decoding="async"
          />
        )}

        {/*
          Sponsor-authored HTML is untrusted: it is written by an external
          advertiser and stored, so it goes through the same sanitizer as
          editorial article bodies.
        */}
        <div
          className="prose prose-invert max-w-none prose-headings:text-white prose-a:text-orange-400 prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(article.content) }}
        />

        {article.ctaUrl && (
          <div className="mt-10 p-6 rounded-xl border border-orange-500/30 bg-orange-500/5">
            <a
              href={article.ctaUrl}
              onClick={handleCtaClick}
              target="_blank"
              // `sponsored` is the correct rel for paid links per Google's
              // link-attribution guidance; noopener protects window.opener.
              rel="sponsored noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
            >
              {article.ctaText || 'Learn More'}
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        )}

        <p className="mt-10 pt-6 border-t border-white/10 text-xs text-slate-500">
          This is paid content. Bitcoinvestments did not write it and does not endorse it.
          Nothing here is financial advice — always do your own research before investing.
        </p>
      </div>
    </article>
  );
}

export default SponsoredArticle;
