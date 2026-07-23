import { useEffect, useState } from 'react';
import { getActiveAds, trackAdImpression, trackAdClick } from '../services/database';
import { useAuth } from '../contexts/AuthContext';
import { hasAdFree } from '../services/subscriptionLimits';
import { hasConsent } from '@/lib/consent';
import type { Advertisement as AdType } from '../types/database';

interface AdvertisementProps {
  zone: 'banner' | 'sidebar' | 'native' | 'popup';
  className?: string;
}

export function Advertisement({ zone, className = '' }: AdvertisementProps) {
  const { profile } = useAuth();
  const [ad, setAd] = useState<AdType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAd() {
      // Check if user has ad-free premium access
      if (profile) {
        const adFreeAccess = hasAdFree(
          profile.subscription_status,
          profile.subscription_expires_at
        );
        if (adFreeAccess) {
          setLoading(false);
          return; // Premium users don't see ads
        }
      }

      const ads = await getActiveAds(zone);
      if (ads.length > 0) {
        // Select random ad from available ones
        const selectedAd = ads[Math.floor(Math.random() * ads.length)];
        setAd(selectedAd);
        // Track impression only with marketing consent (GDPR/ePrivacy).
        if (hasConsent('marketing')) {
          trackAdImpression(selectedAd.id);
        }
      }
      setLoading(false);
    }
    loadAd();
  }, [zone, profile]);

  const handleClick = () => {
    if (ad && hasConsent('marketing')) {
      trackAdClick(ad.id);
    }
  };

  if (loading) {
    return <AdPlaceholder zone={zone} className={className} />;
  }

  if (!ad) {
    return null;
  }

  // Responsive size classes for different ad zones
  const sizeClasses = {
    banner: 'w-full h-[60px] sm:h-[90px]',
    sidebar: 'hidden sm:block w-full sm:w-[300px] h-[200px] sm:h-[250px]',
    native: 'w-full',
    popup: 'w-full max-w-[calc(100vw-2rem)] sm:max-w-[400px]',
  };

  if (zone === 'native') {
    return (
      <a
        href={ad.target_url}
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`block bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700 hover:border-gray-600 transition-colors touch-target ${className}`}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <img
            src={ad.image_url}
            alt={ad.alt_text}
            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1">Sponsored</p>
            <h4 className="text-white font-medium mb-1 truncate text-sm sm:text-base">{ad.campaign_name}</h4>
            {ad.cta_text && (
              <span className="text-orange-500 text-xs sm:text-sm font-medium">
                {ad.cta_text} &rarr;
              </span>
            )}
          </div>
        </div>
      </a>
    );
  }

  return (
    <div className={`relative ${sizeClasses[zone]} ${className}`}>
      <span className="absolute top-1 right-1 text-[10px] text-gray-500 bg-gray-900/80 px-1 rounded z-10">
        Ad
      </span>
      <a
        href={ad.target_url}
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block w-full h-full"
      >
        <img
          src={ad.image_url}
          alt={ad.alt_text}
          className="w-full h-full object-cover rounded-lg"
        />
      </a>
    </div>
  );
}

function AdPlaceholder({ zone, className }: { zone: string; className: string }) {
  // Responsive placeholder sizes matching ad zones
  const sizeClasses: Record<string, string> = {
    banner: 'w-full h-[60px] sm:h-[90px]',
    sidebar: 'hidden sm:block w-full sm:w-[300px] h-[200px] sm:h-[250px]',
    native: 'w-full h-[80px] sm:h-[100px]',
    popup: 'w-full max-w-[calc(100vw-2rem)] sm:max-w-[400px] h-[250px] sm:h-[300px]',
  };

  return (
    <div className={`${sizeClasses[zone]} ${className} bg-gray-800 rounded-lg animate-pulse`} />
  );
}

// Banner ad component for header/content areas
export function BannerAd({ className = '' }: { className?: string }) {
  return <Advertisement zone="banner" className={className} />;
}

// Sidebar ad component
export function SidebarAd({ className = '' }: { className?: string }) {
  return <Advertisement zone="sidebar" className={className} />;
}

// Native ad for in-content placement
export function NativeAd({ className = '' }: { className?: string }) {
  return <Advertisement zone="native" className={className} />;
}
