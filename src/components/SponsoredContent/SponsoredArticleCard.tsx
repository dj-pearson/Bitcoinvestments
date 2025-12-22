import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  type SponsoredArticle,
  trackSponsoredContentEvent,
  getDisclosureText,
} from '../../services/sponsoredContent';

interface SponsoredArticleCardProps {
  article: SponsoredArticle;
  variant?: 'featured' | 'standard' | 'compact';
  className?: string;
}

export function SponsoredArticleCard({
  article,
  variant = 'standard',
  className = '',
}: SponsoredArticleCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const hasTrackedImpression = useRef(false);

  // Track impression when article becomes visible
  useEffect(() => {
    if (hasTrackedImpression.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTrackedImpression.current) {
            hasTrackedImpression.current = true;
            trackSponsoredContentEvent('article', article.id, 'impression');
          }
        });
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [article.id]);

  const handleClick = () => {
    trackSponsoredContentEvent('article', article.id, 'click');
  };

  if (variant === 'compact') {
    return (
      <Link
        to={`/sponsored/${article.slug}`}
        onClick={handleClick}
        className={`block p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors border border-gray-700 ${className}`}
      >
        <div className="flex items-start gap-3">
          {article.featuredImage && (
            <img
              src={article.featuredImage}
              alt=""
              className="w-16 h-16 rounded object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-wider text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded">
                {getDisclosureText('article')}
              </span>
            </div>
            <h4 className="text-sm font-medium text-white line-clamp-2">{article.title}</h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              {article.sponsor?.name && <span>{article.sponsor.name}</span>}
              <span>·</span>
              <span>{article.readTimeMinutes} min read</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <div
        ref={cardRef}
        className={`glass-card overflow-hidden relative ${className}`}
      >
        {/* Featured image */}
        {article.featuredImage && (
          <Link to={`/sponsored/${article.slug}`} onClick={handleClick} className="block relative">
            <img
              src={article.featuredImage}
              alt=""
              className="w-full h-64 object-cover hover:opacity-90 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent" />

            {/* Sponsored badge */}
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-white bg-purple-600 px-3 py-1 rounded-full">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                </svg>
                {getDisclosureText('article')}
              </span>
            </div>

            {/* Title overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h2 className="text-2xl font-bold text-white mb-2 line-clamp-2">
                {article.title}
              </h2>
              {article.excerpt && (
                <p className="text-gray-300 line-clamp-2">{article.excerpt}</p>
              )}
            </div>
          </Link>
        )}

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {article.sponsor?.logoUrl && (
                <img
                  src={article.sponsor.logoUrl}
                  alt={article.sponsor.name}
                  className="w-10 h-10 rounded-lg"
                />
              )}
              <div>
                <p className="text-sm font-medium text-white">
                  {article.authorName || article.sponsor?.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{article.readTimeMinutes} min read</span>
                  <span>·</span>
                  <span>{article.viewCount.toLocaleString()} views</span>
                </div>
              </div>
            </div>

            {article.ctaText && article.ctaUrl && (
              <a
                href={article.ctaUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                onClick={() => trackSponsoredContentEvent('article', article.id, 'cta_click')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {article.ctaText}
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default standard variant
  return (
    <div
      ref={cardRef}
      className={`glass-card overflow-hidden hover:border-purple-500/30 transition-colors ${className}`}
    >
      {/* Sponsored badge - always visible */}
      <div className="px-5 pt-4">
        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
          </svg>
          {getDisclosureText('article')}
        </span>
      </div>

      {/* Image */}
      {article.featuredImage && (
        <Link to={`/sponsored/${article.slug}`} onClick={handleClick} className="block p-4 pb-0">
          <img
            src={article.featuredImage}
            alt=""
            className="w-full h-40 object-cover rounded-lg hover:opacity-90 transition-opacity"
          />
        </Link>
      )}

      {/* Content */}
      <div className="p-5">
        <Link
          to={`/sponsored/${article.slug}`}
          onClick={handleClick}
          className="block group"
        >
          {article.category && (
            <span className="text-xs text-purple-400 uppercase tracking-wider">
              {article.category}
            </span>
          )}
          <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors mt-1 mb-2 line-clamp-2">
            {article.title}
          </h3>
          {article.excerpt && (
            <p className="text-gray-400 text-sm line-clamp-2">
              {article.excerpt}
            </p>
          )}
        </Link>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
          <div className="flex items-center gap-2">
            {article.sponsor?.logoUrl && (
              <img
                src={article.sponsor.logoUrl}
                alt={article.sponsor.name}
                className="w-6 h-6 rounded"
              />
            )}
            <span className="text-xs text-gray-500">
              {article.authorName || article.sponsor?.name}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{article.readTimeMinutes} min</span>
            <span>{article.viewCount.toLocaleString()} views</span>
          </div>
        </div>
      </div>
    </div>
  );
}
