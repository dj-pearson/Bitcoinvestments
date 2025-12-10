/**
 * Consultation Marketplace Service
 *
 * Connect beginners with verified crypto consultants for paid 1:1 sessions.
 * Platform takes 15-20% cut. Consultants are carefully vetted.
 */

import { supabase } from './database';

export interface Consultant {
  id: string;
  user_id: string;
  display_name: string;
  title?: string;
  bio: string;
  avatar_url?: string;
  timezone: string;
  languages: string[];
  specializations: string[];
  experience_years: number;
  credentials: string[];
  is_verified: boolean;
  verification_level?: 'basic' | 'professional' | 'expert';
  verified_at?: string;
  background_check_passed: boolean;
  hourly_rate: number;
  currency: string;
  session_durations: number[]; // in minutes
  platform_commission_rate: number; // e.g., 18 = 18%
  availability_schedule: AvailabilitySchedule;
  booking_lead_time_hours: number;
  max_daily_sessions: number;
  session_types: ('video' | 'audio' | 'chat')[];
  video_platform: string;
  custom_meeting_link?: string;
  total_sessions: number;
  total_hours: number;
  average_rating: number;
  reviews_count: number;
  repeat_client_rate: number;
  response_time_hours: number;
  total_earnings: number;
  pending_payout: number;
  status: 'pending' | 'approved' | 'suspended' | 'inactive';
  created_at: string;
}

export interface AvailabilitySchedule {
  [dayOfWeek: string]: TimeSlot[]; // 0-6 for Sunday-Saturday
}

export interface TimeSlot {
  start: string; // HH:mm format
  end: string;
}

export interface ConsultationBooking {
  id: string;
  client_id: string;
  consultant_id: string;
  consultant?: Consultant;
  session_type: 'video' | 'audio' | 'chat';
  duration_minutes: number;
  scheduled_at: string;
  timezone: string;
  topic: string;
  description?: string;
  client_goals: string[];
  meeting_link?: string;
  meeting_password?: string;
  session_price: number;
  currency: string;
  consultant_share: number;
  platform_share: number;
  stripe_payment_intent_id?: string;
  payment_status: 'pending' | 'paid' | 'refunded' | 'disputed';
  paid_at?: string;
  status: BookingStatus;
  confirmed_at?: string;
  started_at?: string;
  ended_at?: string;
  actual_duration_minutes?: number;
  cancellation_reason?: string;
  cancelled_at?: string;
  refund_amount?: number;
  consultant_notes?: string;
  session_summary?: string;
  resources_shared: { title: string; url: string }[];
  follow_up_scheduled: boolean;
  created_at: string;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled_by_client'
  | 'cancelled_by_consultant'
  | 'rescheduled'
  | 'in_progress'
  | 'completed'
  | 'no_show_client'
  | 'no_show_consultant';

export interface ConsultantReview {
  id: string;
  booking_id: string;
  consultant_id: string;
  client_id: string;
  overall_rating: number;
  knowledge_rating?: number;
  communication_rating?: number;
  value_rating?: number;
  review_text?: string;
  would_recommend: boolean;
  is_visible: boolean;
  consultant_response?: string;
  responded_at?: string;
  created_at: string;
}

/**
 * Commission structure based on verification level
 */
export const COMMISSION_RATES = {
  basic: 20, // 20% platform fee
  professional: 18, // 18% for verified professionals
  expert: 15, // 15% for top-tier experts
} as const;

/**
 * Specialization categories
 */
export const SPECIALIZATIONS = [
  { id: 'investment', name: 'Investment Strategy', icon: 'TrendingUp' },
  { id: 'trading', name: 'Trading & Analysis', icon: 'BarChart2' },
  { id: 'defi', name: 'DeFi & Yield Farming', icon: 'Coins' },
  { id: 'tax', name: 'Crypto Tax Planning', icon: 'FileText' },
  { id: 'security', name: 'Security & Privacy', icon: 'Shield' },
  { id: 'portfolio', name: 'Portfolio Management', icon: 'PieChart' },
  { id: 'beginner', name: 'Beginner Guidance', icon: 'BookOpen' },
  { id: 'nft', name: 'NFTs & Digital Assets', icon: 'Image' },
  { id: 'mining', name: 'Mining & Staking', icon: 'Cpu' },
  { id: 'legal', name: 'Legal & Compliance', icon: 'Scale' },
] as const;

/**
 * Get all approved consultants
 */
export async function getApprovedConsultants(
  options?: {
    specialization?: string;
    minRating?: number;
    maxHourlyRate?: number;
    languages?: string[];
    sortBy?: 'rating' | 'price_low' | 'price_high' | 'experience' | 'reviews';
    limit?: number;
    offset?: number;
  }
): Promise<Consultant[]> {
  let query = supabase
    .from('consultants')
    .select('*')
    .eq('status', 'approved');

  if (options?.specialization) {
    query = query.contains('specializations', [options.specialization]);
  }
  if (options?.minRating) {
    query = query.gte('average_rating', options.minRating);
  }
  if (options?.maxHourlyRate) {
    query = query.lte('hourly_rate', options.maxHourlyRate);
  }
  if (options?.languages && options.languages.length > 0) {
    query = query.overlaps('languages', options.languages);
  }

  // Sorting
  switch (options?.sortBy) {
    case 'price_low':
      query = query.order('hourly_rate', { ascending: true });
      break;
    case 'price_high':
      query = query.order('hourly_rate', { ascending: false });
      break;
    case 'experience':
      query = query.order('experience_years', { ascending: false });
      break;
    case 'reviews':
      query = query.order('reviews_count', { ascending: false });
      break;
    case 'rating':
    default:
      query = query.order('average_rating', { ascending: false });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching consultants:', error);
    return [];
  }

  return data || [];
}

/**
 * Get consultant by ID
 */
export async function getConsultantById(id: string): Promise<Consultant | null> {
  const { data, error } = await supabase
    .from('consultants')
    .select('*')
    .eq('id', id)
    .eq('status', 'approved')
    .single();

  if (error) {
    console.error('Error fetching consultant:', error);
    return null;
  }

  return data;
}

/**
 * Get consultant by user ID
 */
export async function getConsultantByUserId(userId: string): Promise<Consultant | null> {
  const { data, error } = await supabase
    .from('consultants')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching consultant:', error);
  }

  return data;
}

/**
 * Get consultant availability for a specific date
 */
export async function getConsultantAvailability(
  consultantId: string,
  date: Date
): Promise<{ available: TimeSlot[]; booked: { start: string; duration: number }[] }> {
  const consultant = await getConsultantById(consultantId);
  if (!consultant) {
    return { available: [], booked: [] };
  }

  const dayOfWeek = date.getDay().toString();
  const daySchedule = consultant.availability_schedule[dayOfWeek] || [];

  // Get existing bookings for this date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: bookings } = await supabase
    .from('consultation_bookings')
    .select('scheduled_at, duration_minutes')
    .eq('consultant_id', consultantId)
    .gte('scheduled_at', startOfDay.toISOString())
    .lte('scheduled_at', endOfDay.toISOString())
    .not('status', 'in', ['cancelled_by_client', 'cancelled_by_consultant']);

  const bookedSlots = (bookings || []).map(b => ({
    start: new Date(b.scheduled_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    duration: b.duration_minutes,
  }));

  return {
    available: daySchedule,
    booked: bookedSlots,
  };
}

/**
 * Get user's bookings as client
 */
export async function getClientBookings(userId: string): Promise<ConsultationBooking[]> {
  const { data, error } = await supabase
    .from('consultation_bookings')
    .select(`
      *,
      consultant:consultants(id, display_name, avatar_url, title)
    `)
    .eq('client_id', userId)
    .order('scheduled_at', { ascending: false });

  if (error) {
    console.error('Error fetching client bookings:', error);
    return [];
  }

  return data || [];
}

/**
 * Get consultant's bookings
 */
export async function getConsultantBookings(consultantId: string): Promise<ConsultationBooking[]> {
  const { data, error } = await supabase
    .from('consultation_bookings')
    .select('*')
    .eq('consultant_id', consultantId)
    .order('scheduled_at', { ascending: false });

  if (error) {
    console.error('Error fetching consultant bookings:', error);
    return [];
  }

  return data || [];
}

/**
 * Create checkout session for booking
 */
export async function createBookingCheckout(
  consultantId: string,
  clientId: string,
  clientEmail: string,
  sessionDetails: {
    sessionType: 'video' | 'audio' | 'chat';
    durationMinutes: number;
    scheduledAt: string;
    timezone: string;
    topic: string;
    description?: string;
    clientGoals?: string[];
  }
): Promise<{ sessionId: string | null; url: string | null; error: string | null }> {
  try {
    const response = await fetch('/api/create-booking-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        consultantId,
        clientId,
        clientEmail,
        ...sessionDetails,
        successUrl: `${window.location.origin}/consultations?booked=true`,
        cancelUrl: `${window.location.origin}/consultants/${consultantId}`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { sessionId, url } = await response.json();
    return { sessionId, url, error: null };
  } catch (error) {
    console.error('Error creating booking checkout:', error);
    return {
      sessionId: null,
      url: null,
      error: error instanceof Error ? error.message : 'Failed to start checkout',
    };
  }
}

/**
 * Confirm a booking (consultant action)
 */
export async function confirmBooking(
  consultantId: string,
  bookingId: string,
  meetingLink?: string,
  meetingPassword?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('consultation_bookings')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      meeting_link: meetingLink,
      meeting_password: meetingPassword,
    })
    .eq('id', bookingId)
    .eq('consultant_id', consultantId)
    .eq('status', 'pending');

  if (error) {
    console.error('Error confirming booking:', error);
    return false;
  }

  return true;
}

/**
 * Cancel a booking
 */
export async function cancelBooking(
  bookingId: string,
  cancelledBy: 'client' | 'consultant',
  userId: string,
  reason?: string
): Promise<{ success: boolean; refundAmount?: number; error?: string }> {
  const { data: booking } = await supabase
    .from('consultation_bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (!booking) {
    return { success: false, error: 'Booking not found' };
  }

  // Verify user can cancel
  if (cancelledBy === 'client' && booking.client_id !== userId) {
    return { success: false, error: 'Not authorized' };
  }

  // Calculate refund based on time until session
  const hoursUntilSession = (new Date(booking.scheduled_at).getTime() - Date.now()) / (1000 * 60 * 60);
  let refundAmount = 0;

  if (cancelledBy === 'consultant' || hoursUntilSession >= 24) {
    refundAmount = booking.session_price; // Full refund
  } else if (hoursUntilSession >= 12) {
    refundAmount = booking.session_price * 0.5; // 50% refund
  }
  // Less than 12 hours = no refund

  const { error } = await supabase
    .from('consultation_bookings')
    .update({
      status: cancelledBy === 'client' ? 'cancelled_by_client' : 'cancelled_by_consultant',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
      refund_amount: refundAmount,
    })
    .eq('id', bookingId);

  if (error) {
    console.error('Error cancelling booking:', error);
    return { success: false, error: 'Failed to cancel booking' };
  }

  return { success: true, refundAmount };
}

/**
 * Complete a session
 */
export async function completeSession(
  consultantId: string,
  bookingId: string,
  notes?: string,
  summary?: string,
  resources?: { title: string; url: string }[]
): Promise<boolean> {
  const { error } = await supabase
    .from('consultation_bookings')
    .update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      consultant_notes: notes,
      session_summary: summary,
      resources_shared: resources || [],
    })
    .eq('id', bookingId)
    .eq('consultant_id', consultantId);

  if (error) {
    console.error('Error completing session:', error);
    return false;
  }

  // Update consultant stats
  await supabase.rpc('increment_consultant_sessions', { p_consultant_id: consultantId });

  return true;
}

/**
 * Submit a review
 */
export async function submitReview(
  clientId: string,
  bookingId: string,
  review: {
    overallRating: number;
    knowledgeRating?: number;
    communicationRating?: number;
    valueRating?: number;
    reviewText?: string;
    wouldRecommend: boolean;
  }
): Promise<boolean> {
  const { data: booking } = await supabase
    .from('consultation_bookings')
    .select('consultant_id')
    .eq('id', bookingId)
    .eq('client_id', clientId)
    .eq('status', 'completed')
    .single();

  if (!booking) {
    console.error('Booking not found or not completed');
    return false;
  }

  const { error } = await supabase
    .from('consultant_reviews')
    .insert({
      booking_id: bookingId,
      consultant_id: booking.consultant_id,
      client_id: clientId,
      overall_rating: review.overallRating,
      knowledge_rating: review.knowledgeRating,
      communication_rating: review.communicationRating,
      value_rating: review.valueRating,
      review_text: review.reviewText,
      would_recommend: review.wouldRecommend,
      is_visible: true,
    });

  if (error) {
    console.error('Error submitting review:', error);
    return false;
  }

  // Update consultant average rating
  const { data: reviews } = await supabase
    .from('consultant_reviews')
    .select('overall_rating')
    .eq('consultant_id', booking.consultant_id)
    .eq('is_visible', true);

  if (reviews && reviews.length > 0) {
    const avgRating = reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length;
    await supabase
      .from('consultants')
      .update({
        average_rating: avgRating,
        reviews_count: reviews.length,
      })
      .eq('id', booking.consultant_id);
  }

  return true;
}

/**
 * Get consultant reviews
 */
export async function getConsultantReviews(
  consultantId: string,
  limit: number = 10
): Promise<ConsultantReview[]> {
  const { data, error } = await supabase
    .from('consultant_reviews')
    .select('*')
    .eq('consultant_id', consultantId)
    .eq('is_visible', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  return data || [];
}

/**
 * Search consultants
 */
export async function searchConsultants(query: string): Promise<Consultant[]> {
  const { data, error } = await supabase
    .from('consultants')
    .select('*')
    .eq('status', 'approved')
    .or(`display_name.ilike.%${query}%,bio.ilike.%${query}%,title.ilike.%${query}%`)
    .order('average_rating', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error searching consultants:', error);
    return [];
  }

  return data || [];
}

/**
 * Get featured consultants (for homepage)
 */
export async function getFeaturedConsultants(limit: number = 4): Promise<Consultant[]> {
  const { data, error } = await supabase
    .from('consultants')
    .select('*')
    .eq('status', 'approved')
    .eq('is_verified', true)
    .gte('average_rating', 4.5)
    .order('total_sessions', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching featured consultants:', error);
    return [];
  }

  return data || [];
}

/**
 * Apply to become a consultant
 */
export async function applyAsConsultant(
  userId: string,
  application: {
    displayName: string;
    title?: string;
    bio: string;
    timezone: string;
    languages: string[];
    specializations: string[];
    experienceYears: number;
    credentials: string[];
    hourlyRate: number;
    sessionDurations: number[];
    sessionTypes: ('video' | 'audio' | 'chat')[];
    availabilitySchedule: AvailabilitySchedule;
  }
): Promise<{ success: boolean; consultantId?: string; error?: string }> {
  // Check if user already has a consultant profile
  const existing = await getConsultantByUserId(userId);
  if (existing) {
    return { success: false, error: 'You already have a consultant profile' };
  }

  const { data, error } = await supabase
    .from('consultants')
    .insert({
      user_id: userId,
      display_name: application.displayName,
      title: application.title,
      bio: application.bio,
      timezone: application.timezone,
      languages: application.languages,
      specializations: application.specializations,
      experience_years: application.experienceYears,
      credentials: application.credentials,
      hourly_rate: application.hourlyRate,
      session_durations: application.sessionDurations,
      session_types: application.sessionTypes,
      availability_schedule: application.availabilitySchedule,
      platform_commission_rate: COMMISSION_RATES.basic,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating consultant profile:', error);
    return { success: false, error: 'Failed to submit application' };
  }

  return { success: true, consultantId: data.id };
}
