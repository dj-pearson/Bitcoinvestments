import type { AffiliateClick, AffiliatePartner } from '../types';

// Local storage keys
const AFFILIATE_CLICKS_KEY = 'bitcoin_investments_affiliate_clicks';
const SESSION_ID_KEY = 'bitcoin_investments_session_id';

// Affiliate partner configurations
export const affiliatePartners: AffiliatePartner[] = [
  {
    id: 'coinbase',
    name: 'Coinbase',
    type: 'exchange',
    commission_type: 'hybrid',
    commission_rate: 50, // 50% of trading fees
    cookie_duration_days: 30,
    affiliate_url_template: 'https://www.coinbase.com/join/{tracking_id}',
    tracking_id: import.meta.env.VITE_COINBASE_AFFILIATE_ID || 'COINBASE_ID',
    status: 'active',
  },
  {
    id: 'kraken',
    name: 'Kraken',
    type: 'exchange',
    commission_type: 'percentage',
    commission_rate: 20, // 20% revenue share
    cookie_duration_days: 30,
    affiliate_url_template: 'https://www.kraken.com/sign-up?ref={tracking_id}',
    tracking_id: import.meta.env.VITE_KRAKEN_AFFILIATE_ID || 'KRAKEN_ID',
    status: 'active',
  },
  {
    id: 'binance-us',
    name: 'Binance.US',
    type: 'exchange',
    commission_type: 'percentage',
    commission_rate: 40, // Up to 40%
    cookie_duration_days: 90,
    affiliate_url_template: 'https://www.binance.us/register?ref={tracking_id}',
    tracking_id: import.meta.env.VITE_BINANCE_AFFILIATE_ID || 'BINANCE_ID',
    status: 'active',
  },
  {
    id: 'ledger',
    name: 'Ledger',
    type: 'wallet',
    commission_type: 'percentage',
    commission_rate: 10, // 10% on sales
    cookie_duration_days: 30,
    affiliate_url_template: 'https://shop.ledger.com/?r={tracking_id}',
    tracking_id: import.meta.env.VITE_LEDGER_AFFILIATE_ID || 'LEDGER_ID',
    status: 'active',
  },
  {
    id: 'trezor',
    name: 'Trezor',
    type: 'wallet',
    commission_type: 'percentage',
    commission_rate: 8, // 8% on sales
    cookie_duration_days: 30,
    affiliate_url_template: 'https://trezor.io/?offer_id={tracking_id}',
    tracking_id: import.meta.env.VITE_TREZOR_AFFILIATE_ID || 'TREZOR_ID',
    status: 'active',
  },
  {
    id: 'cointracker',
    name: 'CoinTracker',
    type: 'tax_software',
    commission_type: 'percentage',
    commission_rate: 25, // 25% on subscriptions
    cookie_duration_days: 30,
    affiliate_url_template: 'https://www.cointracker.io/?ref={tracking_id}',
    tracking_id: import.meta.env.VITE_COINTRACKER_AFFILIATE_ID || 'COINTRACKER_ID',
    status: 'active',
  },
  {
    id: 'koinly',
    name: 'Koinly',
    type: 'tax_software',
    commission_type: 'percentage',
    commission_rate: 20, // 20% on subscriptions
    cookie_duration_days: 30,
    affiliate_url_template: 'https://koinly.io/?via={tracking_id}',
    tracking_id: import.meta.env.VITE_KOINLY_AFFILIATE_ID || 'KOINLY_ID',
    status: 'active',
  },
];

/**
 * Get or create session ID for tracking
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);

  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }

  return sessionId;
}

/**
 * Generate affiliate link for a partner
 */
export function generateAffiliateLink(
  partnerId: string,
  additionalParams?: Record<string, string>
): string | null {
  const partner = affiliatePartners.find(p => p.id === partnerId);

  if (!partner || partner.status !== 'active') {
    return null;
  }

  let url = partner.affiliate_url_template.replace('{tracking_id}', partner.tracking_id);

  // Add UTM parameters for tracking
  const utmParams = new URLSearchParams({
    utm_source: 'bitcoinvestments',
    utm_medium: 'affiliate',
    utm_campaign: partnerId,
    ...additionalParams,
  });

  const separator = url.includes('?') ? '&' : '?';
  url += separator + utmParams.toString();

  return url;
}

/**
 * Track affiliate link click
 */
export function trackAffiliateClick(
  partnerId: string,
  platformType: AffiliateClick['platform_type'],
  platformName: string,
  sourcePage: string,
  userId?: string
): AffiliateClick {
  const click: AffiliateClick = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    session_id: getSessionId(),
    affiliate_id: partnerId,
    platform_type: platformType,
    platform_name: platformName,
    source_page: sourcePage,
    clicked_at: new Date().toISOString(),
    converted: false,
  };

  // Store click locally
  saveClickLocally(click);

  // In production, also send to server
  sendClickToServer(click);

  return click;
}

/**
 * Save click to local storage
 */
function saveClickLocally(click: AffiliateClick): void {
  if (typeof window === 'undefined') return;

  const clicks = getLocalClicks();
  clicks.push(click);

  // Keep only last 100 clicks locally
  const trimmedClicks = clicks.slice(-100);
  localStorage.setItem(AFFILIATE_CLICKS_KEY, JSON.stringify(trimmedClicks));
}

/**
 * Get clicks from local storage
 */
function getLocalClicks(): AffiliateClick[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(AFFILIATE_CLICKS_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored) as AffiliateClick[];
  } catch {
    return [];
  }
}

/**
 * Send click to server for analytics
 * In production, this would send to your Supabase backend
 */
async function sendClickToServer(click: AffiliateClick): Promise<void> {
  // Placeholder for server-side tracking
  // In production:
  // await supabase.from('affiliate_clicks').insert(click);

  console.log('Affiliate click tracked:', click);
}

/**
 * Mark a click as converted
 */
export async function markClickConverted(
  clickId: string,
  conversionValue?: number
): Promise<void> {
  // Update local storage
  const clicks = getLocalClicks();
  const clickIndex = clicks.findIndex(c => c.id === clickId);

  if (clickIndex >= 0) {
    clicks[clickIndex].converted = true;
    clicks[clickIndex].conversion_value = conversionValue;
    localStorage.setItem(AFFILIATE_CLICKS_KEY, JSON.stringify(clicks));
  }

  // In production, also update server
  // await supabase.from('affiliate_clicks').update({
  //   converted: true,
  //   conversion_value: conversionValue
  // }).eq('id', clickId);
}

/**
 * Get affiliate statistics
 */
export function getAffiliateStats(): {
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  clicksByPartner: Record<string, number>;
  clicksByType: Record<string, number>;
  recentClicks: AffiliateClick[];
} {
  const clicks = getLocalClicks();

  const totalClicks = clicks.length;
  const totalConversions = clicks.filter(c => c.converted).length;
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

  const clicksByPartner: Record<string, number> = {};
  const clicksByType: Record<string, number> = {};

  for (const click of clicks) {
    clicksByPartner[click.affiliate_id] = (clicksByPartner[click.affiliate_id] || 0) + 1;
    clicksByType[click.platform_type] = (clicksByType[click.platform_type] || 0) + 1;
  }

  const recentClicks = clicks.slice(-10).reverse();

  return {
    totalClicks,
    totalConversions,
    conversionRate,
    clicksByPartner,
    clicksByType,
    recentClicks,
  };
}

/**
 * Get partner by ID
 */
export function getPartnerById(partnerId: string): AffiliatePartner | undefined {
  return affiliatePartners.find(p => p.id === partnerId);
}

/**
 * Get all active partners
 */
export function getActivePartners(): AffiliatePartner[] {
  return affiliatePartners.filter(p => p.status === 'active');
}

/**
 * Get partners by type
 */
export function getPartnersByType(
  type: AffiliatePartner['type']
): AffiliatePartner[] {
  return affiliatePartners.filter(p => p.type === type && p.status === 'active');
}

/**
 * Component helper: Create affiliate link with tracking
 */
export function createTrackedAffiliateLink(
  partnerId: string,
  platformType: AffiliateClick['platform_type'],
  sourcePage: string
): {
  url: string | null;
  onClick: () => void;
} {
  const url = generateAffiliateLink(partnerId);
  const partner = getPartnerById(partnerId);

  const onClick = () => {
    if (partner) {
      trackAffiliateClick(
        partnerId,
        platformType,
        partner.name,
        sourcePage
      );
    }
  };

  return { url, onClick };
}

/**
 * Disclosure text for affiliate links
 */
export const AFFILIATE_DISCLOSURE = `
Some of the links on this page are affiliate links. This means that if you click
through and make a purchase or sign up, we may receive a small commission at no
extra cost to you. We only recommend products and services that we believe will
add value to our readers. Our reviews and recommendations are based on extensive
research and personal experience, and are not influenced by affiliate partnerships.
`.trim();

/**
 * Generate disclosure badge for individual links
 */
export function getDisclosureBadge(partnerId: string): string {
  const partner = getPartnerById(partnerId);
  if (!partner) return '';

  return `Affiliate link - we may earn a commission if you sign up`;
}
