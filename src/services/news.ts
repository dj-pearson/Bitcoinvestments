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

interface CryptoCompareNewsResponse {
  Response?: string;
  Message?: string;
  Data?: unknown;
}

/**
 * Optional CryptoCompare (now CoinDesk Data) key. The legacy min-api news
 * endpoint has been served without a key, but CoinDesk documents keys as
 * required, so a keyless request may start failing at any time.
 * NEEDS-OWNER: confirm whether a key is needed and set VITE_CRYPTOCOMPARE_API_KEY.
 */
const CRYPTOCOMPARE_API_KEY = import.meta.env.VITE_CRYPTOCOMPARE_API_KEY as string | undefined;

function newsUrl(extraParams = ''): string {
  const key = CRYPTOCOMPARE_API_KEY ? `&api_key=${encodeURIComponent(CRYPTOCOMPARE_API_KEY)}` : '';
  return `${CRYPTOCOMPARE_NEWS_URL}?lang=EN${extraParams}${key}`;
}

/**
 * Fetch latest crypto news.
 *
 * Throws when the news provider cannot be reached or reports an error (for
 * example a rate limit or a missing API key), so callers can tell "no
 * headlines" apart from "the feed is down" and show an honest message.
 */
export async function getLatestNews(limit: number = 10): Promise<NewsItem[]> {
  // Check cache
  if (newsCache && Date.now() - newsCache.timestamp < CACHE_DURATION) {
    return newsCache.data.slice(0, limit);
  }

  const response = await fetch(newsUrl());

  if (!response.ok) {
    throw new Error(`News API error: ${response.status}`);
  }

  const data = (await response.json()) as CryptoCompareNewsResponse;

  if (data.Response === 'Error' || !Array.isArray(data.Data)) {
    throw new Error(data.Message || 'News API returned no data');
  }

  const news = mapNewsItems(data.Data);
  newsCache = { data: news, timestamp: Date.now() };
  return news.slice(0, limit);
}

type RawNewsItem = {
  id: string;
  title: string;
  body: string;
  source: string;
  source_info?: { name: string };
  imageurl: string;
  url: string;
  published_on: number;
  categories: string;
};

function mapNewsItems(items: unknown[]): NewsItem[] {
  return (items as RawNewsItem[]).map((item) => ({
    id: String(item.id),
    title: item.title,
    body: item.body,
    source: item.source_info?.name || item.source,
    sourceUrl: item.source,
    imageUrl: item.imageurl,
    url: item.url,
    publishedAt: item.published_on * 1000,
    categories: (item.categories || '').split('|').filter(Boolean),
  }));
}

/**
 * Get news by category
 */
export async function getNewsByCategory(
  category: string,
  limit: number = 10
): Promise<NewsItem[]> {
  try {
    const response = await fetch(newsUrl(`&categories=${encodeURIComponent(category)}`));

    if (!response.ok) {
      throw new Error('Failed to fetch news');
    }

    const data = (await response.json()) as CryptoCompareNewsResponse;

    if (data.Response === 'Error' || !Array.isArray(data.Data)) {
      return [];
    }

    return mapNewsItems(data.Data).slice(0, limit);
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
