/**
 * Affiliate Disclosure Components
 *
 * FTC-compliant disclosure components for affiliate marketing.
 * These components ensure clear and conspicuous disclosure of
 * affiliate relationships as required by the FTC Act.
 *
 * Reference: https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers
 */

import React from 'react';
import { Info, ExternalLink, AlertCircle } from 'lucide-react';
import { trackAffiliateClick } from '../services/analytics';

interface AffiliateDisclosureBannerProps {
  variant?: 'default' | 'compact' | 'prominent';
  className?: string;
}

/**
 * Page-level affiliate disclosure banner.
 * Should be placed at the top of pages that contain affiliate links.
 */
export function AffiliateDisclosureBanner({
  variant = 'default',
  className = '',
}: AffiliateDisclosureBannerProps) {
  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm ${className}`}
      >
        <Info className="w-4 h-4 flex-shrink-0" />
        <p>
          <strong>Affiliate Disclosure:</strong> Some links on this page are affiliate links.
          We may earn a commission at no extra cost to you.{' '}
          <a href="/terms#affiliate-disclosure" className="underline hover:text-amber-100">
            Learn more
          </a>
        </p>
      </div>
    );
  }

  if (variant === 'prominent') {
    return (
      <div
        className={`rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 p-4 ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <AlertCircle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h4 className="font-semibold text-amber-200 mb-1">Affiliate Disclosure</h4>
            <p className="text-sm text-gray-300 leading-relaxed">
              This page contains affiliate links. When you sign up or make a purchase through these
              links, we may earn a commission at no additional cost to you. This helps support our
              free educational content and platform maintenance. Our recommendations are based on
              genuine assessment, and affiliate relationships do not influence our ratings or reviews.
            </p>
            <a
              href="/terms#affiliate-disclosure"
              className="inline-flex items-center gap-1 mt-2 text-sm text-amber-400 hover:text-amber-300"
            >
              Read full disclosure
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 ${className}`}
    >
      <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
      <div className="text-sm text-gray-300">
        <p>
          <strong className="text-blue-300">Affiliate Disclosure:</strong> Some of the links on
          this page are affiliate links, meaning we may receive a small commission if you sign up
          or make a purchase through them — at no extra cost to you. This helps us maintain the
          platform and continue providing free educational content.
        </p>
        <a
          href="/terms#affiliate-disclosure"
          className="inline-flex items-center gap-1 mt-1 text-blue-400 hover:text-blue-300"
        >
          Learn more about our affiliate relationships
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

interface AffiliateBadgeProps {
  showTooltip?: boolean;
  className?: string;
}

/**
 * Small inline badge to indicate an affiliate link.
 * Should be placed next to or near each affiliate link.
 */
export function AffiliateBadge({ showTooltip = true, className = '' }: AffiliateBadgeProps) {
  const [tooltipVisible, setTooltipVisible] = React.useState(false);

  return (
    <span className={`relative inline-flex ${className}`}>
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-help"
        onMouseEnter={() => showTooltip && setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
        aria-label="This is an affiliate link. We may earn a commission if you make a purchase."
      >
        <span>Affiliate</span>
      </span>
      {showTooltip && tooltipVisible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap z-50 border border-gray-700">
          We may earn a commission at no extra cost to you
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  );
}

interface SponsoredBadgeProps {
  tier?: 'featured' | 'recommended' | 'partner';
  className?: string;
}

/**
 * Badge for sponsored/paid placements.
 * FTC requires clear disclosure when content is sponsored.
 */
export function SponsoredBadge({ tier = 'partner', className = '' }: SponsoredBadgeProps) {
  const colors = {
    featured: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    recommended: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    partner: 'bg-green-500/20 text-green-300 border-green-500/30',
  };

  const labels = {
    featured: 'Sponsored',
    recommended: 'Partner',
    partner: 'Affiliate Partner',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${colors[tier]} ${className}`}
    >
      {labels[tier]}
    </span>
  );
}

interface AffiliateLinkProps {
  href: string;
  children: React.ReactNode;
  platform?: string;
  type?: 'exchange' | 'wallet';
  showBadge?: boolean;
  showInlineDisclosure?: boolean;
  onClick?: () => void;
  className?: string;
  buttonClassName?: string;
  target?: string;
  rel?: string;
}

/**
 * Wrapper component for affiliate links with built-in FTC disclosure.
 * Automatically adds proper disclosure and tracking attributes.
 */
export function AffiliateLink({
  href,
  children,
  platform,
  type = 'exchange',
  showBadge = true,
  showInlineDisclosure = false,
  onClick,
  className = '',
  buttonClassName = '',
  target = '_blank',
  rel = 'noopener noreferrer sponsored',
}: AffiliateLinkProps) {
  const handleClick = () => {
    // Track affiliate click
    if (platform) {
      trackAffiliateClick(type, platform, href);
    }
    // Call custom onClick handler if provided
    if (onClick) {
      onClick();
    }
  };

  return (
    <span className={`inline-flex flex-col items-start gap-1 ${className}`}>
      <span className="inline-flex items-center gap-2">
        <a
          href={href}
          target={target}
          rel={rel}
          onClick={handleClick}
          className={buttonClassName}
          aria-label={platform ? `Visit ${platform} (affiliate link)` : 'Visit site (affiliate link)'}
        >
          {children}
        </a>
        {showBadge && <AffiliateBadge />}
      </span>
      {showInlineDisclosure && (
        <span className="text-xs text-gray-500">
          We may earn a commission if you sign up through this link
        </span>
      )}
    </span>
  );
}

interface AffiliateCardFooterProps {
  isAffiliate?: boolean;
  isSponsored?: boolean;
  sponsorTier?: 'featured' | 'recommended' | 'partner';
  className?: string;
}

/**
 * Footer disclosure for product/service cards.
 * Shows appropriate badges and disclosure text.
 */
export function AffiliateCardFooter({
  isAffiliate = false,
  isSponsored = false,
  sponsorTier = 'partner',
  className = '',
}: AffiliateCardFooterProps) {
  if (!isAffiliate && !isSponsored) return null;

  return (
    <div
      className={`flex items-center justify-between pt-3 mt-3 border-t border-gray-700/50 text-xs ${className}`}
    >
      <div className="flex items-center gap-2">
        {isSponsored && <SponsoredBadge tier={sponsorTier} />}
        {isAffiliate && !isSponsored && <AffiliateBadge showTooltip={false} />}
      </div>
      <span className="text-gray-500">
        {isSponsored
          ? 'Paid placement'
          : isAffiliate
            ? 'Commission earned'
            : ''}
      </span>
    </div>
  );
}

/**
 * Section header with disclosure for comparison/listing pages.
 */
export function AffiliateDisclosureHeader({
  title,
  description,
  className = '',
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 ${className}`}
    >
      <div>
        {title && <h3 className="font-semibold text-white">{title}</h3>}
        {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Info className="w-4 h-4" />
        <span>Contains affiliate links</span>
      </div>
    </div>
  );
}

export default {
  AffiliateDisclosureBanner,
  AffiliateBadge,
  SponsoredBadge,
  AffiliateLink,
  AffiliateCardFooter,
  AffiliateDisclosureHeader,
};
