import { useState, useEffect } from 'react';
import { getLatestNews, formatTimeAgo, type NewsItem } from '../services/news';

interface NewsFeedProps {
  limit?: number;
  className?: string;
  variant?: 'compact' | 'full';
}

export function NewsFeed({ limit = 5, className = '', variant = 'compact' }: NewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadNews() {
      setLoading(true);
      try {
        const items = await getLatestNews(limit);
        setNews(items);
      } catch (err) {
        setError('Failed to load news');
      }
      setLoading(false);
    }
    loadNews();
  }, [limit]);

  if (loading) {
    return (
      <div className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4">Latest Crypto News</h3>
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

  if (error) {
    return (
      <div className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4">Latest Crypto News</h3>
        <p className="text-gray-400 text-sm">{error}</p>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Latest Crypto News</h3>
          <a
            href="https://www.cryptocompare.com/news/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-orange-500 hover:text-orange-400"
          >
            View All
          </a>
        </div>
        <div className="space-y-6">
          {news.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="flex gap-4">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium group-hover:text-orange-500 transition-colors line-clamp-2 mb-2">
                    {item.title}
                  </h4>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-2">{item.body}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{item.source}</span>
                    <span>&bull;</span>
                    <span>{formatTimeAgo(item.publishedAt)}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  }

  // Compact variant (default)
  return (
    <div className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Latest News</h3>
        <span className="text-xs text-gray-500">Live</span>
      </div>
      <div className="space-y-4">
        {news.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <h4 className="text-sm text-gray-300 group-hover:text-orange-500 transition-colors line-clamp-2 mb-1">
              {item.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{item.source}</span>
              <span>&bull;</span>
              <span>{formatTimeAgo(item.publishedAt)}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// Trending topics component
export function TrendingTopics({ className = '' }: { className?: string }) {
  const topics = [
    { name: 'Bitcoin ETF', trend: 'up' },
    { name: 'Ethereum 2.0', trend: 'up' },
    { name: 'DeFi Yield', trend: 'stable' },
    { name: 'NFT Market', trend: 'down' },
    { name: 'Layer 2', trend: 'up' },
  ];

  return (
    <div className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">Trending Topics</h3>
      <div className="flex flex-wrap gap-2">
        {topics.map((topic) => (
          <span
            key={topic.name}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              topic.trend === 'up'
                ? 'bg-green-500/10 text-green-400'
                : topic.trend === 'down'
                ? 'bg-red-500/10 text-red-400'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            {topic.name}
          </span>
        ))}
      </div>
    </div>
  );
}
