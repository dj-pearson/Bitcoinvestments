import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  type NativeAd as NativeAdType,
  trackSponsoredContentEvent,
  getDisclosureText,
} from '../../services/sponsoredContent';

interface NativeAdProps {
  ad: NativeAdType;
  variant?: 'card' | 'inline' | 'sidebar' | 'compact';
  className?: string;
}

export function NativeAd({ ad, variant = 'card', className = '' }: NativeAdProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const hasTrackedImpression = useRef(false);

  // Track impression when ad becomes visible
  useEffect(() => {
    if (hasTrackedImpression.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTrackedImpression.current) {
            hasTrackedImpression.current = true;
            trackSponsoredContentEvent('native_ad', ad.id, 'impression');
          }
        });
      },
      { threshold: 0.5 }
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => observer.disconnect();
  }, [ad.id]);

  const handleClick = () => {
    trackSponsoredContentEvent('native_ad', ad.id, 'click');
  };

  if (variant === 'compact') {
    return (
      <a
        ref={adRef as any}
        href={ad.destinationUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={handleClick}
        className={`block p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors border border-gray-700 ${className}`}
      >
        <div className="flex items-center gap-3">
          {ad.imageUrl && (
            <img
              src={ad.imageUrl}
              alt=""
              className="w-12 h-12 rounded object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{ad.headline}</p>
            <p className="text-xs text-gray-400 truncate">{ad.displayUrl || 'Sponsored'}</p>
          </div>
        </div>
        <span className="absolute top-1 right-1 text-[10px] text-gray-500">
          {getDisclosureText('native_ad')}
        </span>
      </a>
    );
  }

  if (variant === 'inline') {
    return (
      <a
        ref={adRef as any}
        href={ad.destinationUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={handleClick}
        className={`flex items-center gap-4 p-4 bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-all ${className}`}
      >
        {ad.imageUrl && (
          <img
            src={ad.imageUrl}
            alt=""
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wider text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
              {getDisclosureText('native_ad')}
            </span>
            {ad.sponsor?.name && (
              <span className="text-xs text-gray-500">by {ad.sponsor.name}</span>
            )}
          </div>
          <h4 className="font-semibold text-white mb-1">{ad.headline}</h4>
          {ad.description && (
            <p className="text-sm text-gray-400 line-clamp-2">{ad.description}</p>
          )}
        </div>
        <span className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg flex-shrink-0">
          {ad.ctaText}
        </span>
      </a>
    );
  }

  if (variant === 'sidebar') {
    return (
      <a
        ref={adRef as any}
        href={ad.destinationUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={handleClick}
        className={`block p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-purple-500/30 transition-colors ${className}`}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] uppercase tracking-wider text-gray-500">
            {getDisclosureText('native_ad')}
          </span>
        </div>
        {ad.imageUrl && (
          <img
            src={ad.imageUrl}
            alt=""
            className="w-full h-32 rounded-lg object-cover mb-3"
          />
        )}
        <h4 className="font-medium text-white text-sm mb-2">{ad.headline}</h4>
        {ad.description && (
          <p className="text-xs text-gray-400 mb-3 line-clamp-2">{ad.description}</p>
        )}
        <span className="inline-flex items-center text-sm text-purple-400 hover:text-purple-300">
          {ad.ctaText}
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </a>
    );
  }

  // Default card variant
  return (
    <div
      ref={adRef}
      className={`glass-card overflow-hidden relative ${className}`}
    >
      {/* Sponsored badge */}
      <div className="absolute top-3 left-3 z-10">
        <span className="text-[10px] uppercase tracking-wider text-gray-400 bg-gray-900/80 px-2 py-1 rounded">
          {getDisclosureText('native_ad')}
        </span>
      </div>

      {/* Image */}
      {ad.imageUrl && (
        <a
          href={ad.destinationUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={handleClick}
        >
          <img
            src={ad.imageUrl}
            alt=""
            className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
          />
        </a>
      )}

      {/* Content */}
      <div className="p-5">
        <a
          href={ad.destinationUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={handleClick}
          className="block group"
        >
          <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors mb-2">
            {ad.headline}
          </h3>
          {ad.description && (
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
              {ad.description}
            </p>
          )}
        </a>

        <div className="flex items-center justify-between">
          {ad.sponsor && (
            <div className="flex items-center gap-2">
              {ad.sponsor.logoUrl && (
                <img
                  src={ad.sponsor.logoUrl}
                  alt={ad.sponsor.name}
                  className="w-6 h-6 rounded"
                />
              )}
              <span className="text-xs text-gray-500">{ad.displayUrl || ad.sponsor.name}</span>
            </div>
          )}
          <a
            href={ad.destinationUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={handleClick}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {ad.ctaText}
          </a>
        </div>
      </div>
    </div>
  );
}
