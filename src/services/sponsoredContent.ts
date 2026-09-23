/**
 * Sponsored Content Service
 *
 * Manages sponsored articles, native ads, and advertiser integrations.
 */

import { db, isSupabaseConfigured } from '../lib/supabase';

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
  /** Public sponsor name for the "Paid for by" disclosure. */
  sponsorName?: string;
  sponsorWebsiteUrl?: string;
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

// ---------------------------------------------------------------------------
// Row mappers
//
// PostgREST returns snake_case columns. These used to be cast straight to the
// camelCase types, so `ctaUrl`, `publishedAt`, `featuredImage`, `seoTitle` and
// friends were always undefined. There is deliberately no demo/fallback
// content: a reader must never see an invented paid placement.
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;
const optStr = (v: unknown): string | undefined => (typeof v === 'string' && v ? v : undefined);
/** Advertiser-supplied URLs are only used when they are absolute http(s). */
const webUrl = (v: unknown): string | undefined => {
  const u = optStr(v);
  return u && /^https?:\/\//i.test(u) ? u : undefined;
};
const toNum = (v: unknown): number => {
  const x = typeof v === 'string' ? Number(v) : v;
  return typeof x === 'number' && Number.isFinite(x) ? x : 0;
};

function mapSponsor(row: unknown): Sponsor | undefined {
  if (!row || typeof row !== 'object') return undefined;
  const r = row as Row;
  return {
    id: String(r.id ?? ''),
    userId: optStr(r.user_id),
    name: String(r.name ?? ''),
    slug: String(r.slug ?? ''),
    logoUrl: optStr(r.logo_url),
    websiteUrl: optStr(r.website_url),
    description: optStr(r.description),
    contactEmail: String(r.contact_email ?? ''),
    contactName: optStr(r.contact_name),
    industry: optStr(r.industry),
    status: (optStr(r.status) as Sponsor['status']) || 'pending',
    totalSpent: toNum(r.total_spent),
    createdAt: String(r.created_at ?? ''),
    updatedAt: String(r.updated_at ?? ''),
  };
}

export function mapSponsoredArticle(row: Row): SponsoredArticle {
  const embedded = mapSponsor(row.sponsor);
  // `sponsor_name` / `sponsor_website_url` are copied onto the article by a
  // trigger (migration 20260923000200) because readers cannot select from
  // `sponsors`. Prefer them; fall back to the embed for the sponsor's own view.
  return {
    id: String(row.id ?? ''),
    campaignId: String(row.campaign_id ?? ''),
    sponsorId: String(row.sponsor_id ?? ''),
    title: String(row.title ?? ''),
    slug: String(row.slug ?? ''),
    excerpt: optStr(row.excerpt),
    content: String(row.content ?? ''),
    featuredImage: webUrl(row.featured_image),
    authorName: optStr(row.author_name),
    authorAvatar: optStr(row.author_avatar),
    category: optStr(row.category),
    tags: Array.isArray(row.tags)
      ? (row.tags as unknown[]).filter((t): t is string => typeof t === 'string')
      : [],
    ctaText: optStr(row.cta_text),
    ctaUrl: webUrl(row.cta_url),
    status: (optStr(row.status) as SponsoredArticle['status']) || 'draft',
    seoTitle: optStr(row.seo_title),
    seoDescription: optStr(row.seo_description),
    readTimeMinutes: toNum(row.read_time_minutes),
    publishedAt: optStr(row.published_at),
    expiresAt: optStr(row.expires_at),
    viewCount: toNum(row.view_count),
    clickCount: toNum(row.click_count),
    shareCount: toNum(row.share_count),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
    sponsorName: optStr(row.sponsor_name) || embedded?.name || undefined,
    sponsorWebsiteUrl: webUrl(row.sponsor_website_url) || webUrl(embedded?.websiteUrl),
    sponsor: embedded,
  };
}

function mapNativeAd(row: Row): NativeAd {
  return {
    id: String(row.id ?? ''),
    campaignId: String(row.campaign_id ?? row.campaignId ?? ''),
    sponsorId: String(row.sponsor_id ?? row.sponsorId ?? ''),
    headline: String(row.headline ?? ''),
    description: optStr(row.description),
    imageUrl: optStr(row.image_url ?? row.imageUrl),
    destinationUrl: String(row.destination_url ?? row.destinationUrl ?? ''),
    displayUrl: optStr(row.display_url ?? row.displayUrl),
    ctaText: optStr(row.cta_text ?? row.ctaText) || 'Learn More',
    placement: (optStr(row.placement) as AdPlacement) || 'article_feed',
    status: (optStr(row.status) as NativeAd['status']) || 'active',
    impressions: toNum(row.impressions),
    clicks: toNum(row.clicks),
    createdAt: String(row.created_at ?? row.createdAt ?? ''),
    updatedAt: String(row.updated_at ?? row.updatedAt ?? ''),
    sponsor:
      mapSponsor(row.sponsor) ||
      (optStr(row.sponsor_name)
        ? mapSponsor({ id: row.sponsor_id, name: row.sponsor_name, slug: '' })
        : undefined),
  };
}

// Sponsored Articles Functions
export async function getSponsoredArticles(options: {
  category?: string;
  limit?: number;
  status?: string;
}): Promise<SponsoredArticle[]> {
  const { category, limit = 10, status = 'published' } = options;
  if (!isSupabaseConfigured()) return [];

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
    return ((data || []) as Row[]).map(mapSponsoredArticle);
  } catch (error) {
    console.error('Error fetching sponsored articles:', error);
    return [];
  }
}

/**
 * One published sponsored article. Resolves null when it does not exist or
 * has expired; rejects when it could not be loaded. Never returns placeholder
 * content.
 */
export async function getSponsoredArticleBySlug(slug: string): Promise<SponsoredArticle | null> {
  // Without a configured backend the query cannot succeed, and firing it anyway
  // leaves the caller awaiting a request that may never settle.
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await db
    .from('sponsored_articles')
    .select(`
      *,
      sponsor:sponsors(id, name, slug, logo_url, website_url)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapSponsoredArticle(data as Row) : null;
}

// Native Ads Functions
export async function getNativeAds(placement: AdPlacement, limit: number = 3): Promise<NativeAd[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await db.rpc('get_active_native_ads', {
      p_placement: placement,
      p_limit: limit,
    });

    if (error) throw error;
    return ((data || []) as Row[]).map(mapNativeAd);
  } catch (error) {
    console.error('Error fetching native ads:', error);
    return [];
  }
}

export async function getAllNativeAds(sponsorId?: string): Promise<NativeAd[]> {
  if (!isSupabaseConfigured()) return [];
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
    return ((data || []) as Row[]).map(mapNativeAd);
  } catch (error) {
    console.error('Error fetching native ads:', error);
    return [];
  }
}

// Analytics Tracking
export async function trackSponsoredContentEvent(
  contentType: ContentType,
  contentId: string,
  eventType: 'impression' | 'view' | 'click' | 'cta_click' | 'share' | 'conversion',
  metadata: Record<string, unknown> = {}
): Promise<void> {
  if (!isSupabaseConfigured()) return;
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
): Promise<CampaignAnalytics | null> {
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
    // No invented numbers: the dashboard shows nothing rather than fake stats.
    return null;
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
  try {
    let sessionId = sessionStorage.getItem(storageKey);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem(storageKey, sessionId);
    }
    return sessionId;
  } catch {
    // Storage blocked (private mode, sandboxed iframe): use a per-page id.
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
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
