import { useState, useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { getAdForZone, recordAdImpression, recordAdClick, shouldShowAds } from '../services/ads';
import { useAuth } from '../contexts/AuthContext';
import type { Advertisement } from '../types/database';

interface AdUnitProps {
  zone: 'banner' | 'sidebar' | 'native' | 'popup';
  className?: string;
}

export function AdUnit({ zone, className = '' }: AdUnitProps) {
  const { user } = useAuth();
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const impressionTracked = useRef(false);
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAd();
  }, [zone]);

  // Track impression when ad is visible
  useEffect(() => {
    if (!ad || impressionTracked.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !impressionTracked.current) {
            recordAdImpression(ad.id);
            impressionTracked.current = true;
          }
        });
      },
      { threshold: 0.5 } // Ad must be 50% visible
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => {
      if (adRef.current) {
        observer.unobserve(adRef.current);
      }
    };
  }, [ad]);

  async function loadAd() {
    setLoading(true);
    setError(false);

    // Check if user should see ads
    const userProfile = user ? await getUserProfile() : null;
    const premiumStatus = userProfile?.subscription_status || 'free';

    if (!shouldShowAds(premiumStatus)) {
      setLoading(false);
      return;
    }

    try {
      const fetchedAd = await getAdForZone(zone);
      setAd(fetchedAd);
    } catch (err) {
      console.error('Error loading ad:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function getUserProfile() {
    // Import dynamically to avoid circular dependencies
    const { getUserProfile } = await import('../services/auth');
    if (!user) return null;
    return getUserProfile(user.id);
  }

  function handleAdClick() {
    if (!ad) return;
    recordAdClick(ad.id, ad.target_url);
  }

  // Don't render anything if no ad or loading
  if (loading || !ad || error) {
    return null;
  }

  // Render based on zone type
  switch (zone) {
    case 'banner':
      return (
        <div ref={adRef} className={`mb-6 ${className}`}>
          <div className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700 hover:border-orange-500/50 transition-colors cursor-pointer group">
            <div className="relative">
              <img
                src={ad.image_url}
                alt={ad.alt_text}
                className="w-full h-auto max-h-[90px] object-cover"
                onClick={handleAdClick}
              />
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-gray-400">
                Sponsored
              </div>
            </div>
          </div>
        </div>
      );

    case 'sidebar':
      return (
        <div ref={adRef} className={`${className}`}>
          <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-orange-500/50 transition-colors">
            <div className="p-3 bg-gray-900 border-b border-gray-700 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Sponsored</span>
              <ExternalLink className="w-3 h-3 text-gray-500" />
            </div>
            <div
              className="cursor-pointer group relative"
              onClick={handleAdClick}
            >
              <img
                src={ad.image_url}
                alt={ad.alt_text}
                className="w-full h-auto max-h-[600px] object-cover group-hover:opacity-90 transition-opacity"
              />
              {ad.cta_text && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <button className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition-colors">
                    {ad.cta_text}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );

    case 'native':
      return (
        <div ref={adRef} className={`${className}`}>
          <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50 hover:border-orange-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-400 font-medium">
                Sponsored
              </span>
            </div>
            <div
              className="cursor-pointer group"
              onClick={handleAdClick}
            >
              <div className="flex gap-4">
                <img
                  src={ad.image_url}
                  alt={ad.alt_text}
                  className="w-32 h-32 object-cover rounded-lg flex-shrink-0 group-hover:opacity-90 transition-opacity"
                />
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-500 transition-colors">
                    {ad.campaign_name}
                  </h3>
                  {ad.cta_text && (
                    <p className="text-gray-400 text-sm mb-3">{ad.cta_text}</p>
                  )}
                  <div className="inline-flex items-center gap-2 text-orange-500 text-sm font-medium">
                    Learn More
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'popup':
      // Popup ads should be handled separately with a modal component
      // This is just a placeholder
      return null;

    default:
      return null;
  }
}

// Convenient preset components for common ad placements
export function BannerAd({ className }: { className?: string }) {
  return <AdUnit zone="banner" className={className} />;
}

export function SidebarAd({ className }: { className?: string }) {
  return <AdUnit zone="sidebar" className={className} />;
}

export function NativeAd({ className }: { className?: string }) {
  return <AdUnit zone="native" className={className} />;
}
