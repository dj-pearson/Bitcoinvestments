/**
 * Affiliate links for the compare and hardware-wallet pages.
 *
 * Tracking IDs come ONLY from build-time env vars (VITE_AFFILIATE_<PARTNER>).
 * When a partner's ID is not set, links fall back to the plain official URL
 * and are not labelled as affiliate links. No placeholder IDs are ever
 * rendered, and commission terms are not shipped to the browser.
 *
 * NEEDS-OWNER: set the real IDs in the Cloudflare Pages build environment, e.g.
 *   VITE_AFFILIATE_COINBASE, VITE_AFFILIATE_KRAKEN, VITE_AFFILIATE_BINANCE_US,
 *   VITE_AFFILIATE_GEMINI, VITE_AFFILIATE_CRYPTO_COM, VITE_AFFILIATE_ROBINHOOD,
 *   VITE_AFFILIATE_UPHOLD, VITE_AFFILIATE_LEDGER, VITE_AFFILIATE_TREZOR.
 * The URL templates below are the partners' usual referral formats; confirm
 * each against the partner dashboard when adding the ID.
 */

import { trackAffiliateClick as trackAnalyticsAffiliateClick } from './analytics';

interface AffiliatePartnerConfig {
  id: string;
  name: string;
  /** `{id}` is replaced with the URL-encoded tracking ID */
  template: string;
  trackingId: string | undefined;
}

const env = import.meta.env;

/**
 * Each env var is referenced literally so Vite can inline it at build time.
 * The older VITE_<PARTNER>_AFFILIATE_ID names are still honoured.
 */
const AFFILIATE_PARTNERS: AffiliatePartnerConfig[] = [
  { id: 'coinbase', name: 'Coinbase', template: 'https://www.coinbase.com/join/{id}', trackingId: env.VITE_AFFILIATE_COINBASE || env.VITE_COINBASE_AFFILIATE_ID },
  { id: 'kraken', name: 'Kraken', template: 'https://www.kraken.com/sign-up?ref={id}', trackingId: env.VITE_AFFILIATE_KRAKEN || env.VITE_KRAKEN_AFFILIATE_ID },
  { id: 'binance-us', name: 'Binance.US', template: 'https://www.binance.us/register?ref={id}', trackingId: env.VITE_AFFILIATE_BINANCE_US || env.VITE_BINANCE_AFFILIATE_ID },
  { id: 'gemini', name: 'Gemini', template: 'https://www.gemini.com/share/{id}', trackingId: env.VITE_AFFILIATE_GEMINI },
  { id: 'crypto-com', name: 'Crypto.com', template: 'https://crypto.com/app/{id}', trackingId: env.VITE_AFFILIATE_CRYPTO_COM },
  { id: 'robinhood', name: 'Robinhood', template: 'https://join.robinhood.com/{id}', trackingId: env.VITE_AFFILIATE_ROBINHOOD },
  { id: 'uphold', name: 'Uphold', template: 'https://uphold.com/signup?referral={id}', trackingId: env.VITE_AFFILIATE_UPHOLD },
  { id: 'ledger', name: 'Ledger', template: 'https://shop.ledger.com/?r={id}', trackingId: env.VITE_AFFILIATE_LEDGER || env.VITE_LEDGER_AFFILIATE_ID },
  { id: 'trezor', name: 'Trezor', template: 'https://trezor.io/?offer_id={id}', trackingId: env.VITE_AFFILIATE_TREZOR || env.VITE_TREZOR_AFFILIATE_ID },
];

function getPartner(partnerId: string | undefined): AffiliatePartnerConfig | undefined {
  if (!partnerId) return undefined;
  return AFFILIATE_PARTNERS.find(p => p.id === partnerId);
}

/** True when a real tracking ID is configured for this partner. */
export function isAffiliateConfigured(partnerId: string | undefined): boolean {
  const id = getPartner(partnerId)?.trackingId;
  return typeof id === 'string' && id.trim().length > 0;
}

export interface ResolvedOutboundLink {
  href: string;
  /** True only when the link carries a real tracking ID */
  isAffiliate: boolean;
  /** rel attribute to use on the <a> */
  rel: string;
}

/**
 * Resolve the outbound link for a product. Returns the affiliate URL when a
 * tracking ID is configured, otherwise the plain official URL.
 */
export function getOutboundLink(
  partnerId: string | undefined,
  officialUrl: string
): ResolvedOutboundLink {
  const partner = getPartner(partnerId);
  if (partner && isAffiliateConfigured(partnerId)) {
    return {
      href: partner.template.replace('{id}', encodeURIComponent(String(partner.trackingId).trim())),
      isAffiliate: true,
      rel: 'sponsored noopener noreferrer',
    };
  }
  return { href: officialUrl, isAffiliate: false, rel: 'noopener noreferrer' };
}

/**
 * Fire-and-forget click tracking. Never awaited and never blocks navigation.
 */
export function trackOutboundClick(
  type: 'exchange' | 'wallet',
  name: string,
  link: ResolvedOutboundLink
): void {
  if (!link.isAffiliate) return;
  try {
    trackAnalyticsAffiliateClick(type, name, link.href);
  } catch {
    // Analytics must never break the link.
  }
}

/**
 * Disclosure text for pages with affiliate links or paid placements.
 */
export const AFFILIATE_DISCLOSURE =
  'Some links on this page may be affiliate links: if you sign up or buy through them we may earn a commission, at no extra cost to you. Entries marked "Sponsored" are paid placements. Neither changes our editorial scores or the order you choose to sort by.';
