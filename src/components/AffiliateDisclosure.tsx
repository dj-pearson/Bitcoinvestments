/**
 * Affiliate and sponsorship disclosure components.
 *
 * FTC guidance: disclosures must be clear, conspicuous and truthful, placed
 * next to the claim, and not hidden behind hover-only tooltips.
 * Reference: https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Info, ExternalLink } from 'lucide-react';
import { AFFILIATE_DISCLOSURE, getOutboundLink, trackOutboundClick } from '../services/affiliate';

interface AffiliateDisclosureBannerProps {
  variant?: 'default' | 'compact' | 'prominent';
  className?: string;
}

/**
 * Page-level disclosure. Place it above the first affiliate link or
 * sponsored entry on the page.
 */
export function AffiliateDisclosureBanner({
  variant = 'default',
  className = '',
}: AffiliateDisclosureBannerProps) {
  const learnMore = (
    <Link to="/terms#affiliate-disclosure" className="underline hover:text-amber-100">
      Read our full disclosure
    </Link>
  );

  if (variant === 'compact') {
    return (
      <div
        role="note"
        className={`flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm ${className}`}
      >
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          <strong>Disclosure:</strong> {AFFILIATE_DISCLOSURE} {learnMore}.
        </p>
      </div>
    );
  }

  return (
    <div
      role="note"
      className={`flex items-start gap-3 p-4 rounded-xl border ${
        variant === 'prominent'
          ? 'bg-amber-500/10 border-amber-500/30'
          : 'bg-blue-500/10 border-blue-500/20'
      } ${className}`}
    >
      <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="text-sm text-gray-300 leading-relaxed">
        <p className="font-semibold text-amber-200 mb-1">How we make money</p>
        <p>
          {AFFILIATE_DISCLOSURE} Fees and features come from the providers&apos; public pages
          and are dated on every entry.
        </p>
        <p className="mt-2 text-amber-300">{learnMore}</p>
      </div>
    </div>
  );
}

/**
 * Small inline label shown next to an affiliate link. The text is always
 * visible (no hover-only tooltip).
 */
export function AffiliateBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 ${className}`}
    >
      Affiliate link
    </span>
  );
}

/**
 * Visible label for a paid placement. There is one label only: "Sponsored".
 */
export function SponsoredBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border bg-purple-500/20 text-purple-200 border-purple-500/40 ${className}`}
    >
      Sponsored
    </span>
  );
}

interface OutboundLinkProps {
  /** Partner id in services/affiliate.ts */
  partnerId?: string;
  /** Official URL used when no affiliate ID is configured */
  officialUrl: string;
  name: string;
  type: 'exchange' | 'wallet';
  children: React.ReactNode;
  className?: string;
  /** Show the "Affiliate link" label next to the link when it is one */
  showBadge?: boolean;
}

/**
 * Outbound link to a provider. Uses the env-configured affiliate URL when
 * there is one (rel="sponsored noopener noreferrer" + visible label),
 * otherwise the plain official URL. Tracking is fire-and-forget.
 */
export function OutboundLink({
  partnerId,
  officialUrl,
  name,
  type,
  children,
  className = '',
  showBadge = true,
}: OutboundLinkProps) {
  const link = getOutboundLink(partnerId, officialUrl);
  return (
    <span className="inline-flex flex-col items-center gap-1">
      <a
        href={link.href}
        target="_blank"
        rel={link.rel}
        onClick={() => trackOutboundClick(type, name, link)}
        className={className}
      >
        {children}
        <ExternalLink className="w-4 h-4 inline-block ml-1 -mt-0.5" aria-hidden="true" />
        <span className="sr-only"> (opens in a new tab{link.isAffiliate ? ', affiliate link' : ''})</span>
      </a>
      {showBadge && link.isAffiliate && <AffiliateBadge />}
    </span>
  );
}

export default {
  AffiliateDisclosureBanner,
  AffiliateBadge,
  SponsoredBadge,
  OutboundLink,
};
