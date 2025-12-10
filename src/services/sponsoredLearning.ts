/**
 * Sponsored Learning Paths Service
 *
 * Exchanges sponsor educational content (e.g., 'Coinbase Beginner Path').
 * They pay for branded content, users get free education. Win-win.
 */

import { supabase } from './database';

export interface SponsoredLearningPath {
  id: string;
  sponsor_name: string;
  sponsor_logo_url?: string;
  sponsor_website?: string;
  sponsor_affiliate_url?: string;
  title: string;
  slug: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  modules: LearningModule[];
  total_duration_minutes: number;
  lessons_count: number;
  primary_color: string;
  secondary_color: string;
  badge_image_url?: string;
  sponsorship_type: 'exclusive' | 'featured' | 'standard';
  status: 'draft' | 'active' | 'paused' | 'expired';
  enrollments_count: number;
  completions_count: number;
  affiliate_clicks: number;
  created_at: string;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  lessons: LearningLesson[];
  order: number;
}

export interface LearningLesson {
  id: string;
  title: string;
  content: string;
  content_type: 'text' | 'video' | 'quiz' | 'interactive';
  duration_minutes: number;
  video_url?: string;
  quiz_questions?: QuizQuestion[];
  order: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

export interface PathEnrollment {
  id: string;
  user_id: string;
  path_id: string;
  current_module: number;
  completed_modules: string[];
  progress_percentage: number;
  status: 'enrolled' | 'in_progress' | 'completed' | 'abandoned';
  enrolled_at: string;
  started_at?: string;
  completed_at?: string;
  certificate_issued: boolean;
  certificate_url?: string;
}

/**
 * Sponsorship tiers and pricing
 */
export const SPONSORSHIP_TIERS = {
  exclusive: {
    name: 'Exclusive Partnership',
    monthlyFee: 5000,
    features: [
      'Branded learning path',
      'Top placement in learning section',
      'Custom badge for completers',
      'Dedicated affiliate tracking',
      'Monthly performance reports',
      'Co-branded certificates',
    ],
    maxPaths: 3,
    affiliateTracking: true,
  },
  featured: {
    name: 'Featured Sponsor',
    monthlyFee: 2500,
    features: [
      'Branded learning path',
      'Featured placement',
      'Affiliate link integration',
      'Basic analytics',
    ],
    maxPaths: 2,
    affiliateTracking: true,
  },
  standard: {
    name: 'Standard Sponsor',
    monthlyFee: 1000,
    features: [
      'Branded learning path',
      'Standard placement',
      'Basic affiliate tracking',
    ],
    maxPaths: 1,
    affiliateTracking: true,
  },
} as const;

/**
 * Get all active sponsored learning paths
 */
export async function getActiveLearningPaths(): Promise<SponsoredLearningPath[]> {
  const { data, error } = await supabase
    .from('sponsored_learning_paths')
    .select('*')
    .eq('status', 'active')
    .order('sponsorship_type', { ascending: true }) // exclusive first
    .order('enrollments_count', { ascending: false });

  if (error) {
    console.error('Error fetching learning paths:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a learning path by slug
 */
export async function getLearningPathBySlug(
  slug: string
): Promise<SponsoredLearningPath | null> {
  const { data, error } = await supabase
    .from('sponsored_learning_paths')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (error) {
    console.error('Error fetching learning path:', error);
    return null;
  }

  return data;
}

/**
 * Get user's enrollment for a path
 */
export async function getUserEnrollment(
  userId: string,
  pathId: string
): Promise<PathEnrollment | null> {
  const { data, error } = await supabase
    .from('learning_path_enrollments')
    .select('*')
    .eq('user_id', userId)
    .eq('path_id', pathId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching enrollment:', error);
  }

  return data;
}

/**
 * Get all user enrollments
 */
export async function getUserEnrollments(userId: string): Promise<(PathEnrollment & { path: SponsoredLearningPath })[]> {
  const { data, error } = await supabase
    .from('learning_path_enrollments')
    .select(`
      *,
      path:sponsored_learning_paths(*)
    `)
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false });

  if (error) {
    console.error('Error fetching enrollments:', error);
    return [];
  }

  return data || [];
}

/**
 * Enroll user in a learning path
 */
export async function enrollInPath(
  userId: string,
  pathId: string
): Promise<{ success: boolean; enrollment?: PathEnrollment; error?: string }> {
  // Check if already enrolled
  const existing = await getUserEnrollment(userId, pathId);
  if (existing) {
    return { success: true, enrollment: existing };
  }

  const { data, error } = await supabase
    .from('learning_path_enrollments')
    .insert({
      user_id: userId,
      path_id: pathId,
      status: 'enrolled',
    })
    .select()
    .single();

  if (error) {
    console.error('Error enrolling in path:', error);
    return { success: false, error: 'Failed to enroll in learning path' };
  }

  // Increment enrollment count
  await supabase.rpc('increment_path_enrollments', { p_path_id: pathId });

  return { success: true, enrollment: data };
}

/**
 * Update enrollment progress
 */
export async function updateProgress(
  userId: string,
  pathId: string,
  completedModuleId: string,
  currentModule: number,
  progressPercentage: number
): Promise<boolean> {
  const enrollment = await getUserEnrollment(userId, pathId);
  if (!enrollment) return false;

  const completedModules = [...(enrollment.completed_modules || [])];
  if (!completedModules.includes(completedModuleId)) {
    completedModules.push(completedModuleId);
  }

  const isCompleted = progressPercentage >= 100;

  const { error } = await supabase
    .from('learning_path_enrollments')
    .update({
      current_module: currentModule,
      completed_modules: completedModules,
      progress_percentage: progressPercentage,
      status: isCompleted ? 'completed' : 'in_progress',
      started_at: enrollment.started_at || new Date().toISOString(),
      completed_at: isCompleted ? new Date().toISOString() : null,
    })
    .eq('user_id', userId)
    .eq('path_id', pathId);

  if (error) {
    console.error('Error updating progress:', error);
    return false;
  }

  // Update completions count if newly completed
  if (isCompleted && enrollment.status !== 'completed') {
    await supabase.rpc('increment_path_completions', { p_path_id: pathId });
  }

  return true;
}

/**
 * Track affiliate click from learning path
 */
export async function trackAffiliateClick(
  pathId: string,
  userId?: string
): Promise<void> {
  // Increment click count
  await supabase
    .from('sponsored_learning_paths')
    .update({ affiliate_clicks: supabase.rpc('increment', { x: 1 }) })
    .eq('id', pathId);

  // Track detailed click if user is logged in
  if (userId) {
    await supabase.from('affiliate_clicks').insert({
      user_id: userId,
      source: 'sponsored_learning_path',
      source_id: pathId,
      clicked_at: new Date().toISOString(),
    });
  }
}

/**
 * Get featured learning paths (for homepage)
 */
export async function getFeaturedPaths(limit: number = 3): Promise<SponsoredLearningPath[]> {
  const { data, error } = await supabase
    .from('sponsored_learning_paths')
    .select('*')
    .eq('status', 'active')
    .in('sponsorship_type', ['exclusive', 'featured'])
    .order('sponsorship_type', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching featured paths:', error);
    return [];
  }

  return data || [];
}

/**
 * Issue completion certificate
 */
export async function issueCertificate(
  userId: string,
  pathId: string
): Promise<{ success: boolean; certificateUrl?: string; error?: string }> {
  const enrollment = await getUserEnrollment(userId, pathId);

  if (!enrollment) {
    return { success: false, error: 'Enrollment not found' };
  }

  if (enrollment.progress_percentage < 100) {
    return { success: false, error: 'Path not completed' };
  }

  if (enrollment.certificate_issued) {
    return { success: true, certificateUrl: enrollment.certificate_url };
  }

  // Generate certificate URL (in production, this would call a certificate generation service)
  const certificateUrl = `/certificates/${pathId}/${userId}`;

  const { error } = await supabase
    .from('learning_path_enrollments')
    .update({
      certificate_issued: true,
      certificate_url: certificateUrl,
    })
    .eq('user_id', userId)
    .eq('path_id', pathId);

  if (error) {
    console.error('Error issuing certificate:', error);
    return { success: false, error: 'Failed to issue certificate' };
  }

  return { success: true, certificateUrl };
}

/**
 * Get paths by difficulty
 */
export async function getPathsByDifficulty(
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): Promise<SponsoredLearningPath[]> {
  const { data, error } = await supabase
    .from('sponsored_learning_paths')
    .select('*')
    .eq('status', 'active')
    .eq('difficulty', difficulty)
    .order('enrollments_count', { ascending: false });

  if (error) {
    console.error('Error fetching paths by difficulty:', error);
    return [];
  }

  return data || [];
}

/**
 * Get sponsor stats (for admin/sponsor dashboard)
 */
export async function getSponsorStats(sponsorName: string): Promise<{
  totalEnrollments: number;
  totalCompletions: number;
  totalAffiliateClicks: number;
  conversionRate: number;
  paths: SponsoredLearningPath[];
}> {
  const { data, error } = await supabase
    .from('sponsored_learning_paths')
    .select('*')
    .eq('sponsor_name', sponsorName);

  if (error || !data) {
    return {
      totalEnrollments: 0,
      totalCompletions: 0,
      totalAffiliateClicks: 0,
      conversionRate: 0,
      paths: [],
    };
  }

  const totalEnrollments = data.reduce((sum, p) => sum + (p.enrollments_count || 0), 0);
  const totalCompletions = data.reduce((sum, p) => sum + (p.completions_count || 0), 0);
  const totalAffiliateClicks = data.reduce((sum, p) => sum + (p.affiliate_clicks || 0), 0);
  const conversionRate = totalEnrollments > 0 ? (totalCompletions / totalEnrollments) * 100 : 0;

  return {
    totalEnrollments,
    totalCompletions,
    totalAffiliateClicks,
    conversionRate,
    paths: data,
  };
}
