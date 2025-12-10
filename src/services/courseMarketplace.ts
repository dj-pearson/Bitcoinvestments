/**
 * Course Marketplace Service
 *
 * Partner with crypto educators to sell courses on platform.
 * Take 20-30% commission. Curated quality control keeps trust.
 */

import { supabase } from './database';

export interface CourseEducator {
  id: string;
  user_id?: string;
  name: string;
  bio?: string;
  avatar_url?: string;
  website?: string;
  social_links: Record<string, string>;
  credentials: string[];
  years_experience: number;
  specializations: string[];
  is_verified: boolean;
  verified_at?: string;
  commission_rate: number; // Platform's cut (e.g., 25 = 25%)
  total_students: number;
  total_courses: number;
  average_rating: number;
  total_earnings: number;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  created_at: string;
}

export interface MarketplaceCourse {
  id: string;
  educator_id: string;
  educator?: CourseEducator;
  title: string;
  slug: string;
  description: string;
  short_description?: string;
  thumbnail_url?: string;
  preview_video_url?: string;
  category: string;
  subcategory?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  curriculum: CourseCurriculum[];
  total_duration_minutes: number;
  lessons_count: number;
  resources_count: number;
  price: number;
  currency: string;
  stripe_price_id?: string;
  sale_price?: number;
  sale_ends_at?: string;
  lifetime_access: boolean;
  certificate_included: boolean;
  requirements: string[];
  target_audience: string[];
  outcomes: string[];
  status: 'draft' | 'pending_review' | 'published' | 'archived';
  published_at?: string;
  enrollments_count: number;
  completions_count: number;
  average_rating: number;
  reviews_count: number;
  created_at: string;
}

export interface CourseCurriculum {
  id: string;
  title: string;
  description?: string;
  lessons: CourseLesson[];
  order: number;
}

export interface CourseLesson {
  id: string;
  title: string;
  description?: string;
  content_type: 'video' | 'text' | 'quiz' | 'assignment' | 'resource';
  duration_minutes: number;
  is_preview: boolean;
  video_url?: string;
  content?: string;
  resources?: CourseResource[];
  order: number;
}

export interface CourseResource {
  id: string;
  title: string;
  type: 'pdf' | 'link' | 'download' | 'code';
  url: string;
}

export interface CoursePurchase {
  id: string;
  user_id: string;
  course_id: string;
  course?: MarketplaceCourse;
  price_paid: number;
  currency: string;
  educator_share: number;
  platform_share: number;
  status: 'pending' | 'completed' | 'refunded' | 'disputed';
  purchased_at?: string;
  progress_percentage: number;
  completed_lessons: string[];
  last_lesson_id?: string;
  last_accessed_at?: string;
  completed_at?: string;
  certificate_issued: boolean;
  certificate_url?: string;
  rating?: number;
  review?: string;
  review_at?: string;
  created_at: string;
}

/**
 * Course categories
 */
export const COURSE_CATEGORIES = [
  { id: 'fundamentals', name: 'Crypto Fundamentals', icon: 'BookOpen' },
  { id: 'trading', name: 'Trading & Analysis', icon: 'TrendingUp' },
  { id: 'defi', name: 'DeFi & Yield', icon: 'Coins' },
  { id: 'nft', name: 'NFTs & Web3', icon: 'Image' },
  { id: 'security', name: 'Security & Privacy', icon: 'Shield' },
  { id: 'tax', name: 'Tax & Compliance', icon: 'FileText' },
  { id: 'development', name: 'Blockchain Development', icon: 'Code' },
  { id: 'investing', name: 'Investment Strategies', icon: 'Target' },
] as const;

/**
 * Commission structure
 */
export const COMMISSION_STRUCTURE = {
  default: 25, // 25% platform fee
  verified: 20, // 20% for verified educators
  premium: 15, // 15% for top educators (100+ students)
} as const;

/**
 * Get all published courses
 */
export async function getPublishedCourses(
  options?: {
    category?: string;
    difficulty?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'popular' | 'newest' | 'rating' | 'price_low' | 'price_high';
    limit?: number;
    offset?: number;
  }
): Promise<MarketplaceCourse[]> {
  let query = supabase
    .from('marketplace_courses')
    .select(`
      *,
      educator:course_educators(id, name, avatar_url, is_verified, average_rating)
    `)
    .eq('status', 'published');

  if (options?.category) {
    query = query.eq('category', options.category);
  }
  if (options?.difficulty) {
    query = query.eq('difficulty', options.difficulty);
  }
  if (options?.minPrice !== undefined) {
    query = query.gte('price', options.minPrice);
  }
  if (options?.maxPrice !== undefined) {
    query = query.lte('price', options.maxPrice);
  }

  // Sorting
  switch (options?.sortBy) {
    case 'newest':
      query = query.order('published_at', { ascending: false });
      break;
    case 'rating':
      query = query.order('average_rating', { ascending: false });
      break;
    case 'price_low':
      query = query.order('price', { ascending: true });
      break;
    case 'price_high':
      query = query.order('price', { ascending: false });
      break;
    case 'popular':
    default:
      query = query.order('enrollments_count', { ascending: false });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching courses:', error);
    return [];
  }

  return data || [];
}

/**
 * Get course by slug
 */
export async function getCourseBySlug(slug: string): Promise<MarketplaceCourse | null> {
  const { data, error } = await supabase
    .from('marketplace_courses')
    .select(`
      *,
      educator:course_educators(*)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    console.error('Error fetching course:', error);
    return null;
  }

  return data;
}

/**
 * Get course by ID
 */
export async function getCourseById(id: string): Promise<MarketplaceCourse | null> {
  const { data, error } = await supabase
    .from('marketplace_courses')
    .select(`
      *,
      educator:course_educators(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching course:', error);
    return null;
  }

  return data;
}

/**
 * Check if user has purchased a course
 */
export async function hasCoursePurchase(
  userId: string,
  courseId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('course_purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('status', 'completed')
    .single();

  return !!data;
}

/**
 * Get user's purchased courses
 */
export async function getUserCourses(userId: string): Promise<CoursePurchase[]> {
  const { data, error } = await supabase
    .from('course_purchases')
    .select(`
      *,
      course:marketplace_courses(
        *,
        educator:course_educators(id, name, avatar_url)
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('purchased_at', { ascending: false });

  if (error) {
    console.error('Error fetching user courses:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user's course progress
 */
export async function getCourseProgress(
  userId: string,
  courseId: string
): Promise<CoursePurchase | null> {
  const { data, error } = await supabase
    .from('course_purchases')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('status', 'completed')
    .single();

  if (error) {
    console.error('Error fetching course progress:', error);
    return null;
  }

  return data;
}

/**
 * Update course progress
 */
export async function updateCourseProgress(
  userId: string,
  courseId: string,
  lessonId: string,
  progressPercentage: number
): Promise<boolean> {
  const purchase = await getCourseProgress(userId, courseId);
  if (!purchase) return false;

  const completedLessons = [...(purchase.completed_lessons || [])];
  if (!completedLessons.includes(lessonId)) {
    completedLessons.push(lessonId);
  }

  const isCompleted = progressPercentage >= 100;

  const { error } = await supabase
    .from('course_purchases')
    .update({
      progress_percentage: progressPercentage,
      completed_lessons: completedLessons,
      last_lesson_id: lessonId,
      last_accessed_at: new Date().toISOString(),
      completed_at: isCompleted && !purchase.completed_at ? new Date().toISOString() : purchase.completed_at,
    })
    .eq('user_id', userId)
    .eq('course_id', courseId);

  if (error) {
    console.error('Error updating progress:', error);
    return false;
  }

  return true;
}

/**
 * Create checkout session for course purchase
 */
export async function createCourseCheckout(
  courseId: string,
  userId: string,
  userEmail: string
): Promise<{ sessionId: string | null; url: string | null; error: string | null }> {
  try {
    const response = await fetch('/api/create-course-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseId,
        userId,
        userEmail,
        successUrl: `${window.location.origin}/my-courses/${courseId}?purchased=true`,
        cancelUrl: `${window.location.origin}/courses/${courseId}`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { sessionId, url } = await response.json();
    return { sessionId, url, error: null };
  } catch (error) {
    console.error('Error creating course checkout:', error);
    return {
      sessionId: null,
      url: null,
      error: error instanceof Error ? error.message : 'Failed to start checkout',
    };
  }
}

/**
 * Submit course review
 */
export async function submitCourseReview(
  userId: string,
  courseId: string,
  rating: number,
  review: string
): Promise<boolean> {
  const { error } = await supabase
    .from('course_purchases')
    .update({
      rating,
      review,
      review_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('status', 'completed');

  if (error) {
    console.error('Error submitting review:', error);
    return false;
  }

  // Update course average rating
  const { data: reviews } = await supabase
    .from('course_purchases')
    .select('rating')
    .eq('course_id', courseId)
    .not('rating', 'is', null);

  if (reviews && reviews.length > 0) {
    const avgRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
    await supabase
      .from('marketplace_courses')
      .update({
        average_rating: avgRating,
        reviews_count: reviews.length,
      })
      .eq('id', courseId);
  }

  return true;
}

/**
 * Get featured courses
 */
export async function getFeaturedCourses(limit: number = 6): Promise<MarketplaceCourse[]> {
  const { data, error } = await supabase
    .from('marketplace_courses')
    .select(`
      *,
      educator:course_educators(id, name, avatar_url, is_verified)
    `)
    .eq('status', 'published')
    .order('enrollments_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching featured courses:', error);
    return [];
  }

  return data || [];
}

/**
 * Get courses by educator
 */
export async function getEducatorCourses(educatorId: string): Promise<MarketplaceCourse[]> {
  const { data, error } = await supabase
    .from('marketplace_courses')
    .select('*')
    .eq('educator_id', educatorId)
    .eq('status', 'published')
    .order('enrollments_count', { ascending: false });

  if (error) {
    console.error('Error fetching educator courses:', error);
    return [];
  }

  return data || [];
}

/**
 * Get educator profile
 */
export async function getEducatorProfile(educatorId: string): Promise<CourseEducator | null> {
  const { data, error } = await supabase
    .from('course_educators')
    .select('*')
    .eq('id', educatorId)
    .eq('status', 'approved')
    .single();

  if (error) {
    console.error('Error fetching educator:', error);
    return null;
  }

  return data;
}

/**
 * Search courses
 */
export async function searchCourses(query: string): Promise<MarketplaceCourse[]> {
  const { data, error } = await supabase
    .from('marketplace_courses')
    .select(`
      *,
      educator:course_educators(id, name, avatar_url, is_verified)
    `)
    .eq('status', 'published')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,short_description.ilike.%${query}%`)
    .order('enrollments_count', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error searching courses:', error);
    return [];
  }

  return data || [];
}

/**
 * Get course reviews
 */
export async function getCourseReviews(
  courseId: string,
  limit: number = 10
): Promise<{ rating: number; review: string; review_at: string; user_id: string }[]> {
  const { data, error } = await supabase
    .from('course_purchases')
    .select('rating, review, review_at, user_id')
    .eq('course_id', courseId)
    .not('rating', 'is', null)
    .order('review_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  return data || [];
}

/**
 * Issue course certificate
 */
export async function issueCertificate(
  userId: string,
  courseId: string
): Promise<{ success: boolean; certificateUrl?: string; error?: string }> {
  const purchase = await getCourseProgress(userId, courseId);

  if (!purchase) {
    return { success: false, error: 'Course not purchased' };
  }

  if (purchase.progress_percentage < 100) {
    return { success: false, error: 'Course not completed' };
  }

  if (purchase.certificate_issued) {
    return { success: true, certificateUrl: purchase.certificate_url };
  }

  // Generate certificate URL
  const certificateUrl = `/certificates/course/${courseId}/${userId}`;

  const { error } = await supabase
    .from('course_purchases')
    .update({
      certificate_issued: true,
      certificate_url: certificateUrl,
    })
    .eq('user_id', userId)
    .eq('course_id', courseId);

  if (error) {
    console.error('Error issuing certificate:', error);
    return { success: false, error: 'Failed to issue certificate' };
  }

  return { success: true, certificateUrl };
}
