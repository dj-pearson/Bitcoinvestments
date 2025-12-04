/**
 * Crypto News Service
 *
 * Fetches cryptocurrency news from various sources.
 * Uses CryptoCompare News API (free tier available).
 */

export interface NewsItem {
  id: string;
  title: string;
  body: string;
  source: string;
  sourceUrl: string;
  imageUrl: string;
  url: string;
  publishedAt: number;
  categories: string[];
}

const CRYPTOCOMPARE_NEWS_URL = 'https://min-api.cryptocompare.com/data/v2/news/';

// Cache for news data
let newsCache: { data: NewsItem[]; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch latest crypto news
 */
export async function getLatestNews(limit: number = 10): Promise<NewsItem[]> {
  // Check cache
  if (newsCache && Date.now() - newsCache.timestamp < CACHE_DURATION) {
    return newsCache.data.slice(0, limit);
  }

  try {
    const response = await fetch(`${CRYPTOCOMPARE_NEWS_URL}?lang=EN`);

    if (!response.ok) {
      throw new Error('Failed to fetch news');
    }

    const data = await response.json();

    if (data.Data) {
      const news: NewsItem[] = data.Data.map((item: {
        id: string;
        title: string;
        body: string;
        source: string;
        source_info?: { name: string };
        imageurl: string;
        url: string;
        published_on: number;
        categories: string;
      }) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        source: item.source_info?.name || item.source,
        sourceUrl: item.source,
        imageUrl: item.imageurl,
        url: item.url,
        publishedAt: item.published_on * 1000,
        categories: item.categories.split('|').filter(Boolean),
      }));

      // Update cache
      newsCache = { data: news, timestamp: Date.now() };

      return news.slice(0, limit);
    }

    return [];
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

/**
 * Get news by category
 */
export async function getNewsByCategory(
  category: string,
  limit: number = 10
): Promise<NewsItem[]> {
  try {
    const response = await fetch(
      `${CRYPTOCOMPARE_NEWS_URL}?lang=EN&categories=${encodeURIComponent(category)}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch news');
    }

    const data = await response.json();

    if (data.Data) {
      const news: NewsItem[] = data.Data.map((item: {
        id: string;
        title: string;
        body: string;
        source: string;
        source_info?: { name: string };
        imageurl: string;
        url: string;
        published_on: number;
        categories: string;
      }) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        source: item.source_info?.name || item.source,
        sourceUrl: item.source,
        imageUrl: item.imageurl,
        url: item.url,
        publishedAt: item.published_on * 1000,
        categories: item.categories.split('|').filter(Boolean),
      })).slice(0, limit);

      return news;
    }

    return [];
  } catch (error) {
    console.error('Error fetching news by category:', error);
    return [];
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  const intervals: { label: string; seconds: number }[] = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }

  return 'Just now';
}
