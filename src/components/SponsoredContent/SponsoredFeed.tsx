import { useState, useEffect } from 'react';
import { NativeAd } from './NativeAd';
import { SponsoredArticleCard } from './SponsoredArticleCard';
import {
  getNativeAds,
  getSponsoredArticles,
  type NativeAd as NativeAdType,
  type SponsoredArticle,
  type AdPlacement,
} from '../../services/sponsoredContent';

interface SponsoredFeedProps {
  placement: AdPlacement;
  variant?: 'card' | 'inline' | 'sidebar';
  showArticles?: boolean;
  maxAds?: number;
  maxArticles?: number;
  className?: string;
}

export function SponsoredFeed({
  placement,
  variant = 'card',
  showArticles = true,
  maxAds = 2,
  maxArticles = 1,
  className = '',
}: SponsoredFeedProps) {
  const [nativeAds, setNativeAds] = useState<NativeAdType[]>([]);
  const [sponsoredArticles, setSponsoredArticles] = useState<SponsoredArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const loadContent = async () => {
    setLoading(true);
    try {
      const [ads, articles] = await Promise.all([
        getNativeAds(placement, maxAds),
        showArticles ? getSponsoredArticles({ limit: maxArticles }) : Promise.resolve([]),
      ]);
      setNativeAds(ads);
      setSponsoredArticles(articles);
    } catch (error) {
      console.error('Error loading sponsored content:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement, maxAds, maxArticles]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-800 rounded-lg h-48"></div>
      </div>
    );
  }

  if (nativeAds.length === 0 && sponsoredArticles.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {/* Native Ads */}
      {nativeAds.map((ad) => (
        <NativeAd key={ad.id} ad={ad} variant={variant} className="mb-4" />
      ))}

      {/* Sponsored Articles */}
      {showArticles && sponsoredArticles.map((article) => (
        <SponsoredArticleCard
          key={article.id}
          article={article}
          variant={variant === 'sidebar' ? 'compact' : 'standard'}
          className="mb-4"
        />
      ))}
    </div>
  );
}

// Component for inserting sponsored content into a list of regular content
interface InterspersedFeedProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  placement: AdPlacement;
  insertAt?: number[]; // Positions to insert sponsored content (default: every 5th position)
  maxSponsoredItems?: number;
  sponsoredVariant?: 'card' | 'inline';
  className?: string;
}

export function InterspersedFeed<T>({
  items,
  renderItem,
  placement,
  insertAt,
  maxSponsoredItems = 2,
  sponsoredVariant = 'inline',
  className = '',
}: InterspersedFeedProps<T>) {
  const [nativeAds, setNativeAds] = useState<NativeAdType[]>([]);

  const loadAds = async () => {
    const ads = await getNativeAds(placement, maxSponsoredItems);
    setNativeAds(ads);
  };

  useEffect(() => {
    loadAds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement, maxSponsoredItems]);

  const positions = insertAt || [4, 9, 14]; // Default: after 4th, 9th, 14th item
  let adIndex = 0;

  return (
    <div className={className}>
      {items.map((item, index) => {
        const result = [];

        // Render the regular item
        result.push(
          <div key={`item-${index}`}>
            {renderItem(item, index)}
          </div>
        );

        // Insert sponsored content at specified positions
        if (positions.includes(index) && adIndex < nativeAds.length) {
          result.push(
            <div key={`ad-${index}`} className="my-4">
              <NativeAd
                ad={nativeAds[adIndex]}
                variant={sponsoredVariant}
              />
            </div>
          );
          adIndex++;
        }

        return result;
      })}
    </div>
  );
}

// Sidebar sponsored content widget
export function SponsoredSidebar({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
        From Our Partners
      </h3>
      <SponsoredFeed
        placement="sidebar"
        variant="sidebar"
        maxAds={3}
        maxArticles={0}
        showArticles={false}
      />
    </div>
  );
}

// In-article sponsored content
export function InArticleSponsored({ className = '' }: { className?: string }) {
  const [ad, setAd] = useState<NativeAdType | null>(null);

  const loadAd = async () => {
    const ads = await getNativeAds('in_article', 1);
    if (ads.length > 0) {
      setAd(ads[0]);
    }
  };

  useEffect(() => {
    loadAd();
     
  }, []);

  if (!ad) return null;

  return (
    <div className={`my-8 ${className}`}>
      <NativeAd ad={ad} variant="inline" />
    </div>
  );
}
