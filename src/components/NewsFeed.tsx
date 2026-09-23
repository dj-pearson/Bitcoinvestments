import { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { getLatestNews, formatTimeAgo, type NewsItem } from '../services/news';

interface NewsFeedProps {
  limit?: number;
  className?: string;
  variant?: 'compact' | 'full';
}

const HEADLINE_ATTRIBUTION =
  "Headlines come from CryptoCompare's news feed and link to the original publisher. We don't write or check them.";

export const NewsFeed = memo(function NewsFeed({ limit = 5, className = '', variant = 'compact' }: NewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    async function loadNews() {
      setStatus('loading');
      try {
        const items = await getLatestNews(limit);
        if (cancelled) return;
        setNews(items);
        setStatus('ready');
      } catch (err) {
        console.error('Error fetching news:', err);
        if (!cancelled) setStatus('error');
      }
    }
    loadNews();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  const heading = variant === 'full' ? 'Latest Crypto Headlines' : 'Latest Headlines';

  if (status === 'loading') {
    return (
      <div className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${className}`} aria-busy="true">
        <h3 className="text-lg font-semibold text-white mb-4">{heading}</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (status === 'error' || news.length === 0) {
    return (
      <div className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4">{heading}</h3>
        <p className="text-gray-400 text-sm mb-4">
          {status === 'error'
            ? "Headlines can't be loaded right now. The news provider may be down or rate-limiting requests."
            : 'No headlines are available right now.'}
        </p>
        <p className="text-gray-400 text-sm mb-2">While you wait, these guides don't change with the news cycle:</p>
        <ul className="space-y-1 text-sm">
          <li>
            <Link to="/learn/what-is-bitcoin" className="text-orange-400 hover:text-orange-300 underline">
              What is Bitcoin?
            </Link>
          </li>
          <li>
            <Link to="/learn/common-crypto-mistakes" className="text-orange-400 hover:text-orange-300 underline">
              Common crypto mistakes to avoid
            </Link>
          </li>
          <li>
            <Link to="/scam-database" className="text-orange-400 hover:text-orange-300 underline">
              Check a site or wallet against our scam database
            </Link>
          </li>
        </ul>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-2">{heading}</h3>
        <p className="text-xs text-gray-400 mb-6">{HEADLINE_ATTRIBUTION}</p>
        <ul className="space-y-6">
          {news.map((item) => (
            <li key={item.id}>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="block group"
              >
                <div className="flex gap-4">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt=""
                      loading="lazy"
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium group-hover:text-orange-500 transition-colors line-clamp-2 mb-2">
                      {item.title}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </h4>
                    <p className="text-gray-400 text-sm line-clamp-2 mb-2">{item.body}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{item.source}</span>
                      <span aria-hidden="true">&bull;</span>
                      <span>{formatTimeAgo(item.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Compact variant (default)
  return (
    <div className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">{heading}</h3>
      <ul className="space-y-4">
        {news.map((item) => (
          <li key={item.id}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="block group"
            >
              <h4 className="text-sm text-gray-300 group-hover:text-orange-500 transition-colors line-clamp-2 mb-1">
                {item.title}
                <span className="sr-only"> (opens in a new tab)</span>
              </h4>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{item.source}</span>
                <span aria-hidden="true">&bull;</span>
                <span>{formatTimeAgo(item.publishedAt)}</span>
              </div>
            </a>
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-500 mt-4">{HEADLINE_ATTRIBUTION}</p>
    </div>
  );
});
