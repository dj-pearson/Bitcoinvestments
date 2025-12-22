/**
 * Sponsored Content Service
 *
 * Manages sponsored articles, native ads, and advertiser integrations.
 */

import { db } from '../lib/supabase';

// Types
export type ContentType = 'article' | 'native_ad' | 'banner';
export type CampaignType = 'article' | 'native_ad' | 'banner' | 'newsletter' | 'video';
export type CampaignStatus = 'draft' | 'pending_review' | 'approved' | 'active' | 'paused' | 'completed' | 'rejected';
export type AdPlacement = 'article_feed' | 'sidebar' | 'in_article' | 'newsletter' | 'learn_page' | 'dashboard';

export interface Sponsor {
  id: string;
  userId?: string;
  name: string;
  slug: string;
  logoUrl?: string;
  websiteUrl?: string;
  description?: string;
  contactEmail: string;
  contactName?: string;
  industry?: string;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface SponsoredCampaign {
  id: string;
  sponsorId: string;
  name: string;
  description?: string;
  campaignType: CampaignType;
  status: CampaignStatus;
  budget: number;
  spent: number;
  startDate?: string;
  endDate?: string;
  targeting: {
    categories?: string[];
    keywords?: string[];
    countries?: string[];
    devices?: string[];
  };
  frequencyCap?: number;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface SponsoredArticle {
  id: string;
  campaignId: string;
  sponsorId: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  authorName?: string;
  authorAvatar?: string;
  category?: string;
  tags: string[];
  ctaText?: string;
  ctaUrl?: string;
  status: 'draft' | 'pending_review' | 'approved' | 'published' | 'archived' | 'rejected';
  seoTitle?: string;
  seoDescription?: string;
  readTimeMinutes: number;
  publishedAt?: string;
  expiresAt?: string;
  viewCount: number;
  clickCount: number;
  shareCount: number;
  createdAt: string;
  updatedAt: string;
  sponsor?: Sponsor;
}

export interface NativeAd {
  id: string;
  campaignId: string;
  sponsorId: string;
  headline: string;
  description?: string;
  imageUrl?: string;
  destinationUrl: string;
  displayUrl?: string;
  ctaText: string;
  placement: AdPlacement;
  status: 'active' | 'paused' | 'completed' | 'rejected';
  impressions: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
  sponsor?: Sponsor;
}

export interface CampaignAnalytics {
  impressions: number;
  views: number;
  clicks: number;
  shares: number;
  conversions: number;
  ctr: number;
  uniqueUsers: number;
  byDevice: Record<string, number>;
  byDay: { date: string; impressions: number; clicks: number }[];
}

// Demo data
const demoSponsor: Sponsor = {
  id: 'demo-sponsor-1',
  name: 'CryptoExchange Pro',
  slug: 'cryptoexchange-pro',
  logoUrl: 'https://placehold.co/100x100/1a1a1a/f0f0f0?text=CEP',
  websiteUrl: 'https://example.com',
  description: 'Leading cryptocurrency exchange with competitive fees',
  contactEmail: 'ads@example.com',
  contactName: 'Marketing Team',
  industry: 'Cryptocurrency Exchange',
  status: 'approved',
  totalSpent: 15000,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
};

const demoNativeAds: NativeAd[] = [
  {
    id: 'demo-ad-1',
    campaignId: 'demo-campaign-1',
    sponsorId: 'demo-sponsor-1',
    headline: 'Trade Bitcoin with 0% fees',
    description: 'Join millions of traders on the world\'s most trusted exchange',
    imageUrl: 'https://placehold.co/400x300/1a1a2e/f0f0f0?text=Trade+BTC',
    destinationUrl: 'https://example.com/trade',
    displayUrl: 'cryptoexchange.pro',
    ctaText: 'Start Trading',
    placement: 'article_feed',
    status: 'active',
    impressions: 45230,
    clicks: 1247,
    createdAt: '2024-11-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
    sponsor: demoSponsor,
  },
  {
    id: 'demo-ad-2',
    campaignId: 'demo-campaign-1',
    sponsorId: 'demo-sponsor-1',
    headline: 'Earn up to 12% APY on crypto',
    description: 'Stake your assets and earn passive income',
    imageUrl: 'https://placehold.co/400x300/1a1a2e/f0f0f0?text=Earn+APY',
    destinationUrl: 'https://example.com/earn',
    displayUrl: 'cryptoexchange.pro/earn',
    ctaText: 'Learn More',
    placement: 'sidebar',
    status: 'active',
    impressions: 28450,
    clicks: 892,
    createdAt: '2024-11-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
    sponsor: demoSponsor,
  },
];

const demoSponsoredArticles: SponsoredArticle[] = [
  {
    id: 'demo-article-1',
    campaignId: 'demo-campaign-1',
    sponsorId: 'demo-sponsor-1',
    title: '5 Strategies for Building a Diversified Crypto Portfolio',
    slug: 'diversified-crypto-portfolio-strategies',
    excerpt: 'Learn how professional traders build balanced cryptocurrency portfolios that weather market volatility.',
    content: `
# 5 Strategies for Building a Diversified Crypto Portfolio

Building a diversified cryptocurrency portfolio is essential for managing risk while maximizing potential returns...

## Strategy 1: The 60/30/10 Rule

Allocate 60% to established cryptocurrencies like Bitcoin and Ethereum, 30% to mid-cap altcoins, and 10% to emerging projects...

## Strategy 2: Sector Diversification

Spread your investments across different crypto sectors: DeFi, NFTs, Layer 2 solutions, and gaming...
    `,
    featuredImage: 'https://placehold.co/800x400/1a1a2e/f0f0f0?text=Portfolio+Guide',
    authorName: 'CryptoExchange Research Team',
    category: 'guides',
    tags: ['portfolio', 'diversification', 'investment'],
    ctaText: 'Start Building Your Portfolio',
    ctaUrl: 'https://example.com/portfolio-tools',
    status: 'published',
    seoTitle: 'Crypto Portfolio Diversification Guide | CryptoExchange',
    seoDescription: 'Learn 5 proven strategies for building a diversified cryptocurrency portfolio that can weather market volatility.',
    readTimeMinutes: 8,
    publishedAt: '2024-12-01T00:00:00Z',
    viewCount: 12450,
    clickCount: 892,
    shareCount: 234,
    createdAt: '2024-11-20T00:00:00Z',
    updatedAt: new Date().toISOString(),
    sponsor: demoSponsor,
  },
];

// Sponsored Articles Functions
export async function getSponsoredArticles(options: {
  category?: string;
  limit?: number;
  status?: string;
}): Promise<SponsoredArticle[]> {
  const { category, limit = 10, status = 'published' } = options;

  try {
    let query = db
      .from('sponsored_articles')
      .select(`
        *,
        sponsor:sponsors(id, name, slug, logo_url, website_url)
      `)
      .eq('status', status)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data as SponsoredArticle[]) || demoSponsoredArticles;
  } catch (error) {
    console.error('Error fetching sponsored articles:', error);
    return demoSponsoredArticles;
  }
}

export async function getSponsoredArticleBySlug(slug: string): Promise<SponsoredArticle | null> {
  try {
    const { data, error } = await db
      .from('sponsored_articles')
      .select(`
        *,
        sponsor:sponsors(id, name, slug, logo_url, website_url)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) throw error;
    return data as SponsoredArticle;
  } catch (error) {
    console.error('Error fetching sponsored article:', error);
    const demo = demoSponsoredArticles.find(a => a.slug === slug);
    return demo || null;
  }
}

// Native Ads Functions
export async function getNativeAds(placement: AdPlacement, limit: number = 3): Promise<NativeAd[]> {
  try {
    const { data, error } = await db
      .rpc('get_active_native_ads', {
        p_placement: placement,
        p_limit: limit,
      });

    if (error) throw error;
    return (data as NativeAd[]) || demoNativeAds.filter(ad => ad.placement === placement);
  } catch (error) {
    console.error('Error fetching native ads:', error);
    return demoNativeAds.filter(ad => ad.placement === placement).slice(0, limit);
  }
}

export async function getAllNativeAds(sponsorId?: string): Promise<NativeAd[]> {
  try {
    let query = db
      .from('native_ads')
      .select(`
        *,
        sponsor:sponsors(id, name, slug, logo_url)
      `)
      .order('created_at', { ascending: false });

    if (sponsorId) {
      query = query.eq('sponsor_id', sponsorId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data as NativeAd[]) || demoNativeAds;
  } catch (error) {
    console.error('Error fetching native ads:', error);
    return demoNativeAds;
  }
}

// Analytics Tracking
export async function trackSponsoredContentEvent(
  contentType: ContentType,
  contentId: string,
  eventType: 'impression' | 'view' | 'click' | 'cta_click' | 'share' | 'conversion',
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    const sessionId = getOrCreateSessionId();

    await db.rpc('track_sponsored_content_view', {
      p_content_type: contentType,
      p_content_id: contentId,
      p_event_type: eventType,
      p_session_id: sessionId,
      p_metadata: metadata,
    });
  } catch (error) {
    console.error('Error tracking sponsored content event:', error);
  }
}

// Campaign Analytics
export async function getCampaignAnalytics(
  campaignId: string,
  startDate?: string,
  endDate?: string
): Promise<CampaignAnalytics> {
  try {
    const { data, error } = await db.rpc('get_campaign_analytics', {
      p_campaign_id: campaignId,
      p_start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      p_end_date: endDate || new Date().toISOString().split('T')[0],
    });

    if (error) throw error;
    return data as CampaignAnalytics;
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    return {
      impressions: 45230,
      views: 12450,
      clicks: 1247,
      shares: 234,
      conversions: 89,
      ctr: 2.76,
      uniqueUsers: 8750,
      byDevice: { desktop: 65, mobile: 30, tablet: 5 },
      byDay: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        impressions: Math.floor(Math.random() * 2000) + 1000,
        clicks: Math.floor(Math.random() * 100) + 20,
      })),
    };
  }
}

// Sponsor Functions
export async function getSponsorByUserId(userId: string): Promise<Sponsor | null> {
  try {
    const { data, error } = await db
      .from('sponsors')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data as Sponsor;
  } catch (error) {
    console.error('Error fetching sponsor:', error);
    return null;
  }
}

export async function getSponsorCampaigns(sponsorId: string): Promise<SponsoredCampaign[]> {
  try {
    const { data, error } = await db
      .from('sponsored_campaigns')
      .select('*')
      .eq('sponsor_id', sponsorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SponsoredCampaign[];
  } catch (error) {
    console.error('Error fetching sponsor campaigns:', error);
    return [];
  }
}

export async function createCampaign(
  sponsorId: string,
  campaign: Partial<SponsoredCampaign>
): Promise<SponsoredCampaign | null> {
  try {
    const { data, error } = await db
      .from('sponsored_campaigns')
      .insert({
        sponsor_id: sponsorId,
        name: campaign.name,
        description: campaign.description,
        campaign_type: campaign.campaignType,
        budget: campaign.budget,
        start_date: campaign.startDate,
        end_date: campaign.endDate,
        targeting: campaign.targeting || {},
      })
      .select()
      .single();

    if (error) throw error;
    return data as SponsoredCampaign;
  } catch (error) {
    console.error('Error creating campaign:', error);
    return null;
  }
}

export async function createNativeAd(
  campaignId: string,
  sponsorId: string,
  ad: Partial<NativeAd>
): Promise<NativeAd | null> {
  try {
    const { data, error } = await db
      .from('native_ads')
      .insert({
        campaign_id: campaignId,
        sponsor_id: sponsorId,
        headline: ad.headline,
        description: ad.description,
        image_url: ad.imageUrl,
        destination_url: ad.destinationUrl,
        display_url: ad.displayUrl,
        cta_text: ad.ctaText || 'Learn More',
        placement: ad.placement,
      })
      .select()
      .single();

    if (error) throw error;
    return data as NativeAd;
  } catch (error) {
    console.error('Error creating native ad:', error);
    return null;
  }
}

// Utility Functions
function getOrCreateSessionId(): string {
  const storageKey = 'bv_session_id';
  let sessionId = sessionStorage.getItem(storageKey);

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(storageKey, sessionId);
  }

  return sessionId;
}

// Check if content should show "Sponsored" label
export function shouldShowSponsoredLabel(): boolean {
  return true; // Always show for FTC compliance
}

// Get disclosure text based on content type
export function getDisclosureText(contentType: ContentType): string {
  switch (contentType) {
    case 'article':
      return 'Sponsored Content';
    case 'native_ad':
      return 'Ad';
    case 'banner':
      return 'Advertisement';
    default:
      return 'Sponsored';
  }
}
