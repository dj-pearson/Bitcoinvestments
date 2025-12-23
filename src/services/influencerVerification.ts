/**
 * Influencer Verification Program Service
 *
 * Verify crypto influencers' actual portfolio performance vs claims.
 * - Users pay $2.99/month for transparency access
 * - Influencers pay $49/month for verified badge
 */

import { db } from '../lib/supabase';
import type {
  VerifiedInfluencer,
  InfluencerVerificationRequest,
  InfluencerPerformanceSnapshot,
  InfluencerTransparencySubscription,
  InfluencerTradeClaim,
  InfluencerSearchResult,
} from '../types/monetization';

// ============================================
// INFLUENCER PROFILE MANAGEMENT
// ============================================

/**
 * Get all verified influencers with optional filters
 */
export async function getVerifiedInfluencers(options?: {
  search?: string;
  tier?: string;
  sortBy?: 'followers' | 'accuracy' | 'returns' | 'trust';
  page?: number;
  perPage?: number;
}): Promise<InfluencerSearchResult> {
  const { page = 1, perPage = 20 } = options || {};

  // TODO: Enable once migration is run
  // Returning demo data for now since table doesn't exist yet
  return {
    influencers: DEMO_INFLUENCERS as VerifiedInfluencer[],
    total: DEMO_INFLUENCERS.length,
    page,
    per_page: perPage,
  };

  /* 
  let query = supabase
    .from('verified_influencers')
    .select('*', { count: 'exact' })
    .eq('verification_status', 'verified')
    .eq('subscription_status', 'active');

  if (search) {
    query = query.or(`display_name.ilike.%${search}%,twitter_handle.ilike.%${search}%`);
  }

  if (tier) {
    query = query.eq('verification_tier', tier);
  }

  // Sorting
  switch (sortBy) {
    case 'followers':
      query = query.order('followers_count', { ascending: false });
      break;
    case 'accuracy':
      query = query.order('accuracy_score', { ascending: false, nullsFirst: false });
      break;
    case 'returns':
      query = query.order('verified_total_return', { ascending: false, nullsFirst: false });
      break;
    case 'trust':
      query = query.order('trust_score', { ascending: false, nullsFirst: false });
      break;
  }

  // Pagination
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    influencers: data || [],
    total: count || 0,
    page,
    per_page: perPage,
  };
  */
}

/**
 * Get influencer by slug
 */
export async function getInfluencerBySlug(slug: string): Promise<VerifiedInfluencer | null> {
  // TODO: Enable once migration is run
  // Return demo data for now
  return DEMO_INFLUENCERS.find(i => i.slug === slug) as VerifiedInfluencer || null;

  /*
  const { data, error } = await db
    .from('verified_influencers')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
  */
}

/**
 * Get influencer by user ID
 */
export async function getInfluencerByUserId(userId: string): Promise<VerifiedInfluencer | null> {
  // TODO: Enable once migration is run
  // Return demo data for now
  void userId;
  return null;

  /*
  const { data, error } = await db
    .from('verified_influencers')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
  */
}

/**
 * Update influencer profile
 */
export async function updateInfluencerProfile(
  userId: string,
  updates: Partial<VerifiedInfluencer>
): Promise<VerifiedInfluencer> {
  // TODO: Enable once migration is run
  void userId;
  void updates;
  throw new Error('Not implemented - migration required');

  /*
  const { data, error } = await db
    .from('verified_influencers')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
  */
}

// ============================================
// VERIFICATION REQUESTS
// ============================================

/**
 * Submit verification request
 */
export async function submitVerificationRequest(
  userId: string,
  request: Omit<InfluencerVerificationRequest, 'id' | 'user_id' | 'status' | 'created_at' | 'updated_at'>
): Promise<InfluencerVerificationRequest> {
  // TODO: Enable once migration is run
  void userId;
  void request;
  throw new Error('Not implemented - migration required');

  /*
  // Check if user already has a pending request
  const { data: existing } = await db
    .from('influencer_verification_requests')
    .select('id, status')
    .eq('user_id', userId)
    .in('status', ['pending', 'under_review'])
    .single();

  if (existing) {
    throw new Error('You already have a pending verification request');
  }

  const { data, error } = await db
    .from('influencer_verification_requests')
    .insert({
      user_id: userId,
      ...request,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
  */
}

/**
 * Get user's verification requests
 */
export async function getUserVerificationRequests(
  userId: string
): Promise<InfluencerVerificationRequest[]> {
  // TODO: Enable once migration is run
  void userId;
  return [];

  /*
  const { data, error } = await db
    .from('influencer_verification_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
  */
}

/**
 * Admin: Get pending verification requests
 */
export async function getPendingVerificationRequests(): Promise<InfluencerVerificationRequest[]> {
  // TODO: Enable once migration is run
  return [];

  /*
  const { data, error } = await db
    .from('influencer_verification_requests')
    .select('*')
    .in('status', ['pending', 'under_review'])
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
  */
}

/**
 * Admin: Approve verification request
 */
export async function approveVerificationRequest(
  requestId: string,
  reviewerId: string,
  tier: 'standard' | 'professional' | 'elite' = 'standard'
): Promise<void> {
  // TODO: Enable once migration is run
  void requestId;
  void reviewerId;
  void tier;
  throw new Error('Not implemented - migration required');

  /*
  // Get the request
  const { data: request, error: fetchError } = await db
    .from('influencer_verification_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError) throw fetchError;

  // Create the verified influencer profile
  const slug = request.display_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const { error: insertError } = await db.from('verified_influencers').insert({
    user_id: request.user_id,
    display_name: request.display_name,
    slug: `${slug}-${Date.now().toString(36)}`,
    bio: request.bio,
    twitter_handle: request.twitter_handle,
    youtube_channel: request.youtube_channel,
    website_url: request.website_url,
    verification_status: 'verified',
    verified_at: new Date().toISOString(),
    verified_by: reviewerId,
    verification_tier: tier,
    verified_wallets: request.wallet_addresses || [],
  });

  if (insertError) throw insertError;

  // Update the request
  const { error: updateError } = await db
    .from('influencer_verification_requests')
    .update({
      status: 'approved',
      reviewer_id: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateError) throw updateError;
  */
}

/**
 * Admin: Reject verification request
 */
export async function rejectVerificationRequest(
  requestId: string,
  reviewerId: string,
  reason: string
): Promise<void> {
  // TODO: Enable once migration is run
  void requestId;
  void reviewerId;
  void reason;
  throw new Error('Not implemented - migration required');

  /*
  const { error } = await db
    .from('influencer_verification_requests')
    .update({
      status: 'rejected',
      reviewer_id: reviewerId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq('id', requestId);

  if (error) throw error;
  */
}

// ============================================
// PERFORMANCE & TRADE CLAIMS
// ============================================

/**
 * Get influencer performance snapshots
 */
export async function getInfluencerPerformance(
  influencerId: string,
  days: number = 30
): Promise<InfluencerPerformanceSnapshot[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await db
    .from('influencer_performance_snapshots')
    .select('*')
    .eq('influencer_id', influencerId)
    .gte('snapshot_date', startDate.toISOString().split('T')[0])
    .order('snapshot_date', { ascending: true });

  if (error) throw error;
  return (data || []) as InfluencerPerformanceSnapshot[];
}

/**
 * Get influencer trade claims
 */
export async function getInfluencerTradeClaims(
  influencerId: string,
  options?: {
    status?: string;
    limit?: number;
  }
): Promise<InfluencerTradeClaim[]> {
  let query = db
    .from('influencer_trade_claims')
    .select('*')
    .eq('influencer_id', influencerId)
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('verification_status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as InfluencerTradeClaim[];
}

/**
 * Submit a trade claim (for influencers)
 */
export async function submitTradeClaim(
  influencerId: string,
  claim: Omit<InfluencerTradeClaim, 'id' | 'influencer_id' | 'verification_status' | 'created_at'>
): Promise<InfluencerTradeClaim> {
  const { data, error } = await db
    .from('influencer_trade_claims')
    .insert({
      influencer_id: influencerId,
      ...claim,
      verification_status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get influencer accuracy statistics
 */
export async function getInfluencerAccuracyStats(influencerId: string): Promise<{
  total_claims: number;
  verified_claims: number;
  accurate_claims: number;
  accuracy_rate: number;
  avg_claimed_return: number;
  avg_verified_return: number;
  discrepancy: number;
}> {
  const { data: claims, error } = await db
    .from('influencer_trade_claims')
    .select('*')
    .eq('influencer_id', influencerId);

  if (error) throw error;

  const total_claims = claims?.length || 0;
  const verified = (claims as InfluencerTradeClaim[] | null)?.filter((c) => c.verification_status === 'verified') || [];
  const verified_claims = verified.length;

  // Claims within 5% of actual are considered accurate
  const accurate = verified.filter((c) => {
    const claimed = c.claimed_return_percent || 0;
    const actual = c.verified_return_percent || 0;
    return Math.abs(claimed - actual) < 5;
  });
  const accurate_claims = accurate.length;

  const accuracy_rate = verified_claims > 0 ? (accurate_claims / verified_claims) * 100 : 0;

  const avg_claimed = ((claims as InfluencerTradeClaim[] | null)?.reduce((sum, c) => sum + (c.claimed_return_percent || 0), 0) || 0) / (total_claims || 1);
  const avg_verified = verified.reduce((sum, c) => sum + (c.verified_return_percent || 0), 0) / (verified_claims || 1);

  return {
    total_claims,
    verified_claims,
    accurate_claims,
    accuracy_rate: Math.round(accuracy_rate * 100) / 100,
    avg_claimed_return: Math.round(avg_claimed * 100) / 100,
    avg_verified_return: Math.round(avg_verified * 100) / 100,
    discrepancy: Math.round((avg_claimed - avg_verified) * 100) / 100,
  };
}

// ============================================
// TRANSPARENCY SUBSCRIPTIONS
// ============================================

/**
 * Get user's transparency subscription
 */
export async function getTransparencySubscription(
  userId: string
): Promise<InfluencerTransparencySubscription | null> {
  const { data, error } = await db
    .from('influencer_transparency_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as InfluencerTransparencySubscription | null;
}

/**
 * Check if user has active transparency subscription
 */
export async function hasTransparencyAccess(userId: string): Promise<boolean> {
  const subscription = await getTransparencySubscription(userId);
  if (!subscription) return false;

  return (
    subscription.status === 'active' &&
    (!subscription.expires_at || new Date(subscription.expires_at) > new Date())
  );
}

/**
 * Create transparency subscription (called after Stripe payment)
 */
export async function createTransparencySubscription(
  userId: string,
  stripeSubscriptionId: string,
  type: 'monthly' | 'yearly' = 'monthly'
): Promise<InfluencerTransparencySubscription> {
  const price = type === 'monthly' ? 2.99 : 29.99;
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + (type === 'yearly' ? 12 : 1));

  const { data, error } = await db
    .from('influencer_transparency_subscriptions')
    .upsert(
      {
        user_id: userId,
        subscription_type: type,
        status: 'active',
        price_paid: price,
        stripe_subscription_id: stripeSubscriptionId,
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as InfluencerTransparencySubscription;
}

/**
 * Cancel transparency subscription
 */
export async function cancelTransparencySubscription(userId: string): Promise<void> {
  const { error } = await db
    .from('influencer_transparency_subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) throw error;
}

// ============================================
// INFLUENCER SUBSCRIPTION ($49/month)
// ============================================

/**
 * Activate influencer subscription (called after Stripe payment)
 */
export async function activateInfluencerSubscription(
  userId: string,
  stripeSubscriptionId: string
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const { error } = await db
    .from('verified_influencers')
    .update({
      subscription_status: 'active',
      stripe_subscription_id: stripeSubscriptionId,
      subscription_expires_at: expiresAt.toISOString(),
    })
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Cancel influencer subscription
 */
export async function cancelInfluencerSubscription(userId: string): Promise<void> {
  const { error } = await db
    .from('verified_influencers')
    .update({
      subscription_status: 'cancelled',
    })
    .eq('user_id', userId);

  if (error) throw error;
}

// ============================================
// LEADERBOARDS & RANKINGS
// ============================================

/**
 * Get top influencers by accuracy
 */
export async function getTopInfluencersByAccuracy(limit: number = 10): Promise<VerifiedInfluencer[]> {
  const { data, error } = await db
    .from('verified_influencers')
    .select('*')
    .eq('verification_status', 'verified')
    .eq('subscription_status', 'active')
    .not('accuracy_score', 'is', null)
    .order('accuracy_score', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as VerifiedInfluencer[];
}

/**
 * Get top influencers by verified returns
 */
export async function getTopInfluencersByReturns(limit: number = 10): Promise<VerifiedInfluencer[]> {
  const { data, error } = await db
    .from('verified_influencers')
    .select('*')
    .eq('verification_status', 'verified')
    .eq('subscription_status', 'active')
    .not('verified_total_return', 'is', null)
    .order('verified_total_return', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as VerifiedInfluencer[];
}

/**
 * Get trending influencers (most followed recently)
 */
export async function getTrendingInfluencers(limit: number = 10): Promise<VerifiedInfluencer[]> {
  const { data, error } = await db
    .from('verified_influencers')
    .select('*')
    .eq('verification_status', 'verified')
    .eq('subscription_status', 'active')
    .order('followers_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as VerifiedInfluencer[];
}

// ============================================
// DEMO DATA (for development/demo purposes)
// ============================================

export const DEMO_INFLUENCERS: Partial<VerifiedInfluencer>[] = [
  {
    id: 'demo-1',
    display_name: 'CryptoKing',
    slug: 'cryptoking',
    bio: 'Trading crypto since 2017. Focus on BTC and ETH analysis.',
    twitter_handle: 'cryptoking',
    twitter_followers: 125000,
    verification_status: 'verified',
    verification_tier: 'elite',
    subscription_status: 'active',
    claimed_win_rate: 78,
    verified_win_rate: 62,
    claimed_total_return: 450,
    verified_total_return: 280,
    accuracy_score: 75.5,
    followers_count: 8500,
    trust_score: 82,
  },
  {
    id: 'demo-2',
    display_name: 'DeFi_Degen',
    slug: 'defi-degen',
    bio: 'Yield farming expert. Finding the best DeFi opportunities.',
    twitter_handle: 'defidegen',
    twitter_followers: 85000,
    verification_status: 'verified',
    verification_tier: 'professional',
    subscription_status: 'active',
    claimed_win_rate: 85,
    verified_win_rate: 71,
    claimed_total_return: 890,
    verified_total_return: 520,
    accuracy_score: 68.2,
    followers_count: 5200,
    trust_score: 75,
  },
  {
    id: 'demo-3',
    display_name: 'AltcoinAlice',
    slug: 'altcoin-alice',
    bio: 'Researching hidden gems in the altcoin market.',
    twitter_handle: 'altcoinalice',
    twitter_followers: 45000,
    youtube_subscribers: 28000,
    verification_status: 'verified',
    verification_tier: 'standard',
    subscription_status: 'active',
    claimed_win_rate: 65,
    verified_win_rate: 58,
    claimed_total_return: 320,
    verified_total_return: 275,
    accuracy_score: 88.5,
    followers_count: 3100,
    trust_score: 91,
  },
];

export const DEMO_TRADE_CLAIMS: Partial<InfluencerTradeClaim>[] = [
  {
    id: 'claim-1',
    claim_type: 'call',
    asset_symbol: 'BTC',
    asset_name: 'Bitcoin',
    claimed_entry_price: 42000,
    claimed_exit_price: 48000,
    claimed_return_percent: 14.3,
    verified_entry_price: 42500,
    verified_exit_price: 46800,
    verified_return_percent: 10.1,
    verification_status: 'verified',
    claim_source_url: 'https://twitter.com/example/status/123',
  },
  {
    id: 'claim-2',
    claim_type: 'call',
    asset_symbol: 'ETH',
    asset_name: 'Ethereum',
    claimed_entry_price: 2800,
    claimed_exit_price: 3200,
    claimed_return_percent: 14.3,
    verified_entry_price: 2850,
    verified_exit_price: 3150,
    verified_return_percent: 10.5,
    verification_status: 'verified',
  },
  {
    id: 'claim-3',
    claim_type: 'prediction',
    asset_symbol: 'SOL',
    asset_name: 'Solana',
    claimed_entry_price: 95,
    claimed_return_percent: 50,
    verification_status: 'pending',
  },
];
