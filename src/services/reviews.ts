/**
 * Platform Reviews Service
 *
 * Manages user reviews for exchanges, wallets, and tax software
 */

import { isSupabaseConfigured, db } from '../lib/supabase';
import type { PlatformReview } from '../types/database';

export type PlatformType = 'exchange' | 'wallet' | 'tax_software';

export interface ReviewInput {
  platform_type: PlatformType;
  platform_id: string;
  rating: number;
  title: string;
  content: string;
  pros?: string[];
  cons?: string[];
}

export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ReviewWithUser extends PlatformReview {
  user_email?: string;
  user_subscription_status?: string;
}

/**
 * Get reviews for a platform
 */
export async function getReviews(
  platformType: PlatformType,
  platformId: string,
  options?: {
    limit?: number;
    offset?: number;
    sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';
    status?: 'approved' | 'pending' | 'all';
  }
): Promise<{ reviews: ReviewWithUser[]; total: number; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { reviews: [], total: 0, error: 'Database is not configured' };
  }

  const { limit = 10, offset = 0, sortBy = 'newest', status = 'approved' } = options || {};

  let query = db
    .from('platform_reviews')
    .select('*, users!platform_reviews_user_id_fkey(email, subscription_status)', { count: 'exact' })
    .eq('platform_type', platformType)
    .eq('platform_id', platformId);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  // Apply sorting
  switch (sortBy) {
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'highest':
      query = query.order('rating', { ascending: false }).order('created_at', { ascending: false });
      break;
    case 'lowest':
      query = query.order('rating', { ascending: true }).order('created_at', { ascending: false });
      break;
    case 'helpful':
      query = query.order('helpful_count', { ascending: false }).order('created_at', { ascending: false });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching reviews:', error);
    return { reviews: [], total: 0, error: error.message };
  }

  // Transform the data to include user info
  const reviews = (data || []).map((review: any) => ({
    ...review,
    user_email: review.users?.email,
    user_subscription_status: review.users?.subscription_status,
  }));

  return { reviews, total: count || 0, error: null };
}

/**
 * Get review statistics for a platform
 */
export async function getReviewStats(
  platformType: PlatformType,
  platformId: string
): Promise<ReviewStats | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await db
    .from('platform_reviews')
    .select('rating')
    .eq('platform_type', platformType)
    .eq('platform_id', platformId)
    .eq('status', 'approved');

  if (error || !data || data.length === 0) {
    return null;
  }

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;

  for (const review of data) {
    const rating = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[rating]++;
    totalRating += review.rating;
  }

  return {
    average_rating: Number((totalRating / data.length).toFixed(1)),
    total_reviews: data.length,
    rating_distribution: distribution,
  };
}

/**
 * Submit a new review
 */
export async function submitReview(
  userId: string,
  review: ReviewInput
): Promise<{ review: PlatformReview | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { review: null, error: 'Database is not configured' };
  }

  // Check if user has already reviewed this platform
  const { data: existing } = await db
    .from('platform_reviews')
    .select('id')
    .eq('user_id', userId)
    .eq('platform_type', review.platform_type)
    .eq('platform_id', review.platform_id)
    .single();

  if (existing) {
    return { review: null, error: 'You have already reviewed this platform' };
  }

  // Check if user is premium (for verified badge)
  const { data: userProfile } = await db
    .from('users')
    .select('subscription_status')
    .eq('id', userId)
    .single();

  const verifiedUser = userProfile?.subscription_status === 'premium';

  const { data, error } = await db
    .from('platform_reviews')
    .insert({
      user_id: userId,
      platform_type: review.platform_type,
      platform_id: review.platform_id,
      rating: Math.min(5, Math.max(1, review.rating)),
      title: review.title.trim(),
      content: review.content.trim(),
      pros: review.pros?.filter(p => p.trim()) || null,
      cons: review.cons?.filter(c => c.trim()) || null,
      verified_user: verifiedUser,
      helpful_count: 0,
      status: 'pending', // Reviews require moderation
    })
    .select()
    .single();

  if (error) {
    console.error('Error submitting review:', error);
    return { review: null, error: error.message };
  }

  return { review: data, error: null };
}

/**
 * Update an existing review
 */
export async function updateReview(
  userId: string,
  reviewId: string,
  updates: Partial<ReviewInput>
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { error: 'Database is not configured' };
  }

  // Verify ownership
  const { data: existing } = await db
    .from('platform_reviews')
    .select('user_id')
    .eq('id', reviewId)
    .single();

  if (!existing || existing.user_id !== userId) {
    return { error: 'Review not found or access denied' };
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    status: 'pending', // Re-submit for moderation after edit
  };

  if (updates.rating !== undefined) {
    updateData.rating = Math.min(5, Math.max(1, updates.rating));
  }
  if (updates.title !== undefined) {
    updateData.title = updates.title.trim();
  }
  if (updates.content !== undefined) {
    updateData.content = updates.content.trim();
  }
  if (updates.pros !== undefined) {
    updateData.pros = updates.pros.filter(p => p.trim());
  }
  if (updates.cons !== undefined) {
    updateData.cons = updates.cons.filter(c => c.trim());
  }

  const { error } = await db
    .from('platform_reviews')
    .update(updateData)
    .eq('id', reviewId);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Delete a review
 */
export async function deleteReview(
  userId: string,
  reviewId: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { error: 'Database is not configured' };
  }

  // Verify ownership
  const { data: existing } = await db
    .from('platform_reviews')
    .select('user_id')
    .eq('id', reviewId)
    .single();

  if (!existing || existing.user_id !== userId) {
    return { error: 'Review not found or access denied' };
  }

  const { error } = await db
    .from('platform_reviews')
    .delete()
    .eq('id', reviewId);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Mark a review as helpful
 */
export async function markReviewHelpful(
  reviewId: string,
  _userId?: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { error: 'Database is not configured' };
  }

  // Increment helpful count
  const { error } = await db.rpc('increment_review_helpful', {
    review_id: reviewId,
  });

  if (error) {
    // Fallback: manually increment
    const { data: review } = await db
      .from('platform_reviews')
      .select('helpful_count')
      .eq('id', reviewId)
      .single();

    if (review) {
      await db
        .from('platform_reviews')
        .update({ helpful_count: (review.helpful_count || 0) + 1 })
        .eq('id', reviewId);
    }
  }

  return { error: null };
}

/**
 * Get user's reviews
 */
export async function getUserReviews(
  userId: string
): Promise<{ reviews: PlatformReview[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { reviews: [], error: 'Database is not configured' };
  }

  const { data, error } = await db
    .from('platform_reviews')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { reviews: [], error: error.message };
  }

  return { reviews: data || [], error: null };
}

/**
 * Admin: Moderate a review
 */
export async function moderateReview(
  reviewId: string,
  status: 'approved' | 'rejected'
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { error: 'Database is not configured' };
  }

  const { error } = await db
    .from('platform_reviews')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Admin: Get pending reviews
 */
export async function getPendingReviews(
  limit = 20
): Promise<{ reviews: ReviewWithUser[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { reviews: [], error: 'Database is not configured' };
  }

  const { data, error } = await db
    .from('platform_reviews')
    .select('*, users!platform_reviews_user_id_fkey(email, subscription_status)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    return { reviews: [], error: error.message };
  }

  const reviews = (data || []).map((review: any) => ({
    ...review,
    user_email: review.users?.email,
    user_subscription_status: review.users?.subscription_status,
  }));

  return { reviews, error: null };
}
