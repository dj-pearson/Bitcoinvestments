/**
 * Video Tutorial Library Service
 *
 * Manages video tutorials with YouTube embeds, progress tracking, and categories.
 *
 * Features:
 * - Video categorization and playlists
 * - Progress tracking per user
 * - Bookmarking and favorites
 * - Search and filtering
 * - Related videos
 */

import { isSupabaseConfigured, db } from '../lib/supabase';

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  embedId: string; // YouTube video ID
  duration: number; // seconds
  category: VideoCategory;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructor: Instructor;
  views: number;
  likes: number;
  publishedAt: string;
  isFeatured: boolean;
  isPremium: boolean;
}

export interface Instructor {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  expertise: string[];
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videos: Video[];
  totalDuration: number;
  videoCount: number;
  category: VideoCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  isFeatured: boolean;
}

export interface UserVideoProgress {
  videoId: string;
  userId: string;
  watchedSeconds: number;
  completed: boolean;
  lastWatchedAt: string;
  bookmarked: boolean;
  liked: boolean;
}

export type VideoCategory =
  | 'getting_started'
  | 'bitcoin'
  | 'ethereum'
  | 'defi'
  | 'trading'
  | 'security'
  | 'tax'
  | 'technical_analysis'
  | 'fundamentals'
  | 'news_analysis';

export const CATEGORY_INFO: Record<VideoCategory, { label: string; icon: string; color: string }> = {
  getting_started: { label: 'Getting Started', icon: '🚀', color: '#22c55e' },
  bitcoin: { label: 'Bitcoin', icon: '₿', color: '#f7931a' },
  ethereum: { label: 'Ethereum', icon: 'Ξ', color: '#627eea' },
  defi: { label: 'DeFi', icon: '🏦', color: '#a855f7' },
  trading: { label: 'Trading', icon: '📈', color: '#3b82f6' },
  security: { label: 'Security', icon: '🔐', color: '#ef4444' },
  tax: { label: 'Tax & Legal', icon: '📋', color: '#f59e0b' },
  technical_analysis: { label: 'Technical Analysis', icon: '📊', color: '#06b6d4' },
  fundamentals: { label: 'Fundamentals', icon: '📚', color: '#8b5cf6' },
  news_analysis: { label: 'News & Analysis', icon: '📰', color: '#ec4899' },
};

export interface VideoFilters {
  category?: VideoCategory;
  difficulty?: Video['difficulty'];
  query?: string;
  tags?: string[];
  instructorId?: string;
  isPremium?: boolean;
  sortBy: 'newest' | 'popular' | 'duration';
  page: number;
  limit: number;
}

/**
 * Get videos with filters
 */
export async function getVideos(
  filters: VideoFilters
): Promise<{ videos: Video[]; total: number; error: string | null }> {
  try {
    if (isSupabaseConfigured()) {
      let query = db
        .from('video_tutorials')
        .select('*, instructors(*)', { count: 'exact' });

      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
      }
      if (filters.isPremium !== undefined) {
        query = query.eq('is_premium', filters.isPremium);
      }
      if (filters.instructorId) {
        query = query.eq('instructor_id', filters.instructorId);
      }
      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      switch (filters.sortBy) {
        case 'popular':
          query = query.order('views', { ascending: false });
          break;
        case 'duration':
          query = query.order('duration', { ascending: true });
          break;
        default:
          query = query.order('published_at', { ascending: false });
      }

      const offset = (filters.page - 1) * filters.limit;
      query = query.range(offset, offset + filters.limit - 1);

      const { data, count, error } = await query;

      if (error) throw error;

      return {
        videos: (data || []).map(mapVideoFromDB),
        total: count || 0,
        error: null,
      };
    }

    return { videos: getDemoVideos(), total: 12, error: null };
  } catch (error) {
    console.error('Error fetching videos:', error);
    return {
      videos: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Failed to load videos',
    };
  }
}

/**
 * Get single video details
 */
export async function getVideo(
  videoId: string
): Promise<{ video: Video | null; related: Video[]; error: string | null }> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await db
        .from('video_tutorials')
        .select('*, instructors(*)')
        .eq('id', videoId)
        .single();

      if (error) throw error;

      // Increment view count
      await db
        .from('video_tutorials')
        .update({ views: ((data as any).views || 0) + 1 })
        .eq('id', videoId);

      // Get related videos
      const { data: relatedData } = await db
        .from('video_tutorials')
        .select('*, instructors(*)')
        .eq('category', (data as any).category)
        .neq('id', videoId)
        .limit(4);

      return {
        video: mapVideoFromDB(data),
        related: (relatedData || []).map(mapVideoFromDB),
        error: null,
      };
    }

    const demoVideos = getDemoVideos();
    const video = demoVideos.find((v) => v.id === videoId) || demoVideos[0];
    return {
      video,
      related: demoVideos.filter((v) => v.id !== video.id).slice(0, 4),
      error: null,
    };
  } catch (error) {
    console.error('Error fetching video:', error);
    return {
      video: null,
      related: [],
      error: error instanceof Error ? error.message : 'Failed to load video',
    };
  }
}

/**
 * Get featured videos
 */
export async function getFeaturedVideos(): Promise<Video[]> {
  if (isSupabaseConfigured()) {
    const { data } = await db
      .from('video_tutorials')
      .select('*, instructors(*)')
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(6);

    return (data || []).map(mapVideoFromDB);
  }

  return getDemoVideos().filter((v) => v.isFeatured);
}

/**
 * Get playlists
 */
export async function getPlaylists(): Promise<Playlist[]> {
  if (isSupabaseConfigured()) {
    const { data } = await db
      .from('video_playlists')
      .select('*, playlist_videos(video_tutorials(*, instructors(*)))')
      .order('created_at', { ascending: false });

    return (data || []).map(mapPlaylistFromDB);
  }

  return getDemoPlaylists();
}

/**
 * Get user's video progress
 */
export async function getUserProgress(
  userId: string
): Promise<Map<string, UserVideoProgress>> {
  const progressMap = new Map<string, UserVideoProgress>();

  if (isSupabaseConfigured()) {
    const { data } = await db
      .from('user_video_progress')
      .select('*')
      .eq('user_id', userId);

    for (const item of (data || []) as any[]) {
      progressMap.set(item.video_id, {
        videoId: item.video_id,
        userId: item.user_id,
        watchedSeconds: item.watched_seconds,
        completed: item.completed,
        lastWatchedAt: item.last_watched_at,
        bookmarked: item.bookmarked,
        liked: item.liked,
      });
    }
  }

  return progressMap;
}

/**
 * Update video progress
 */
export async function updateProgress(
  userId: string,
  videoId: string,
  watchedSeconds: number,
  videoDuration: number
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: true, error: null };
    }

    const completed = watchedSeconds >= videoDuration * 0.9;

    const { error } = await db.from('user_video_progress').upsert(
      {
        user_id: userId,
        video_id: videoId,
        watched_seconds: watchedSeconds,
        completed,
        last_watched_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,video_id' }
    );

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating progress:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update progress',
    };
  }
}

/**
 * Toggle bookmark
 */
export async function toggleBookmark(
  userId: string,
  videoId: string
): Promise<{ bookmarked: boolean; error: string | null }> {
  try {
    if (!isSupabaseConfigured()) {
      return { bookmarked: true, error: null };
    }

    const { data: existing } = await db
      .from('user_video_progress')
      .select('bookmarked')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single();

    const newValue = !((existing as any)?.bookmarked || false);

    const { error } = await db.from('user_video_progress').upsert(
      {
        user_id: userId,
        video_id: videoId,
        bookmarked: newValue,
        last_watched_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,video_id' }
    );

    if (error) throw error;

    return { bookmarked: newValue, error: null };
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return {
      bookmarked: false,
      error: error instanceof Error ? error.message : 'Failed to toggle bookmark',
    };
  }
}

/**
 * Toggle like
 */
export async function toggleLike(
  userId: string,
  videoId: string
): Promise<{ liked: boolean; error: string | null }> {
  try {
    if (!isSupabaseConfigured()) {
      return { liked: true, error: null };
    }

    const { data: existing } = await db
      .from('user_video_progress')
      .select('liked')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single();

    const newValue = !((existing as any)?.liked || false);

    const { error } = await db.from('user_video_progress').upsert(
      {
        user_id: userId,
        video_id: videoId,
        liked: newValue,
        last_watched_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,video_id' }
    );

    if (error) throw error;

    // Update like count on video
    await db.rpc('update_video_likes', { v_id: videoId, increment: newValue ? 1 : -1 });

    return { liked: newValue, error: null };
  } catch (error) {
    console.error('Error toggling like:', error);
    return {
      liked: false,
      error: error instanceof Error ? error.message : 'Failed to toggle like',
    };
  }
}

/**
 * Get user's bookmarked videos
 */
export async function getBookmarkedVideos(userId: string): Promise<Video[]> {
  if (isSupabaseConfigured()) {
    const { data } = await db
      .from('user_video_progress')
      .select('video_id, video_tutorials(*, instructors(*))')
      .eq('user_id', userId)
      .eq('bookmarked', true);

    return ((data || []) as any[])
      .map((item) => item.video_tutorials)
      .filter(Boolean)
      .map(mapVideoFromDB);
  }

  return [];
}

/**
 * Get watch history
 */
export async function getWatchHistory(userId: string): Promise<Video[]> {
  if (isSupabaseConfigured()) {
    const { data } = await db
      .from('user_video_progress')
      .select('video_id, video_tutorials(*, instructors(*))')
      .eq('user_id', userId)
      .gt('watched_seconds', 0)
      .order('last_watched_at', { ascending: false })
      .limit(20);

    return ((data || []) as any[])
      .map((item) => item.video_tutorials)
      .filter(Boolean)
      .map(mapVideoFromDB);
  }

  return [];
}

// Helper functions
function mapVideoFromDB(data: Record<string, unknown>): Video {
  const instructor = data.instructors as Record<string, unknown> | undefined;

  return {
    id: data.id as string,
    title: data.title as string,
    description: data.description as string,
    thumbnailUrl: data.thumbnail_url as string,
    videoUrl: data.video_url as string,
    embedId: data.embed_id as string,
    duration: data.duration as number,
    category: data.category as VideoCategory,
    tags: (data.tags as string[]) || [],
    difficulty: data.difficulty as Video['difficulty'],
    instructor: instructor
      ? {
          id: instructor.id as string,
          name: instructor.name as string,
          avatar: instructor.avatar as string,
          bio: instructor.bio as string,
          expertise: (instructor.expertise as string[]) || [],
        }
      : {
          id: 'default',
          name: 'Instructor',
          avatar: '',
          bio: '',
          expertise: [],
        },
    views: (data.views as number) || 0,
    likes: (data.likes as number) || 0,
    publishedAt: data.published_at as string,
    isFeatured: (data.is_featured as boolean) || false,
    isPremium: (data.is_premium as boolean) || false,
  };
}

function mapPlaylistFromDB(data: Record<string, unknown>): Playlist {
  const playlistVideos = (data.playlist_videos as Record<string, unknown>[]) || [];
  const videos = playlistVideos
    .map((pv) => pv.video_tutorials as Record<string, unknown>)
    .filter(Boolean)
    .map(mapVideoFromDB);

  return {
    id: data.id as string,
    title: data.title as string,
    description: data.description as string,
    thumbnailUrl: data.thumbnail_url as string,
    videos,
    totalDuration: videos.reduce((sum, v) => sum + v.duration, 0),
    videoCount: videos.length,
    category: data.category as VideoCategory,
    difficulty: data.difficulty as Playlist['difficulty'],
    isFeatured: (data.is_featured as boolean) || false,
  };
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Demo data
function getDemoVideos(): Video[] {
  const instructor: Instructor = {
    id: 'inst1',
    name: 'Alex Crypto',
    avatar: 'https://i.pravatar.cc/150?u=instructor1',
    bio: 'Crypto educator with 5+ years of experience',
    expertise: ['Bitcoin', 'Trading', 'DeFi'],
  };

  return [
    {
      id: 'vid1',
      title: 'Bitcoin for Beginners: Complete Guide 2024',
      description: 'Everything you need to know to get started with Bitcoin. This comprehensive guide covers wallets, buying, storing, and basic security.',
      thumbnailUrl: 'https://img.youtube.com/vi/s4g1XFU8Gto/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=s4g1XFU8Gto',
      embedId: 's4g1XFU8Gto',
      duration: 1845,
      category: 'getting_started',
      tags: ['bitcoin', 'beginner', 'guide', 'wallet'],
      difficulty: 'beginner',
      instructor,
      views: 15420,
      likes: 892,
      publishedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      isFeatured: true,
      isPremium: false,
    },
    {
      id: 'vid2',
      title: 'Understanding DeFi: Decentralized Finance Explained',
      description: 'Learn what DeFi is, how it works, and explore the most popular protocols including Uniswap, Aave, and Compound.',
      thumbnailUrl: 'https://img.youtube.com/vi/k9HYC0EJU6E/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=k9HYC0EJU6E',
      embedId: 'k9HYC0EJU6E',
      duration: 2430,
      category: 'defi',
      tags: ['defi', 'ethereum', 'yield', 'lending'],
      difficulty: 'intermediate',
      instructor,
      views: 8932,
      likes: 567,
      publishedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      isFeatured: true,
      isPremium: false,
    },
    {
      id: 'vid3',
      title: 'Technical Analysis Masterclass',
      description: 'Master the art of reading charts. Learn support/resistance, trend lines, candlestick patterns, and key indicators.',
      thumbnailUrl: 'https://img.youtube.com/vi/eynxyoKgpng/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=eynxyoKgpng',
      embedId: 'eynxyoKgpng',
      duration: 3600,
      category: 'technical_analysis',
      tags: ['trading', 'charts', 'analysis', 'indicators'],
      difficulty: 'intermediate',
      instructor,
      views: 12045,
      likes: 1023,
      publishedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      isFeatured: false,
      isPremium: true,
    },
    {
      id: 'vid4',
      title: 'Crypto Security: Protect Your Assets',
      description: 'Essential security practices every crypto investor needs to know. Hardware wallets, seed phrases, and avoiding scams.',
      thumbnailUrl: 'https://img.youtube.com/vi/ZloHVKk7DVk/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/watch?v=ZloHVKk7DVk',
      embedId: 'ZloHVKk7DVk',
      duration: 1920,
      category: 'security',
      tags: ['security', 'wallet', 'scams', 'hardware'],
      difficulty: 'beginner',
      instructor,
      views: 6780,
      likes: 445,
      publishedAt: new Date(Date.now() - 86400000 * 21).toISOString(),
      isFeatured: true,
      isPremium: false,
    },
  ];
}

function getDemoPlaylists(): Playlist[] {
  const videos = getDemoVideos();

  return [
    {
      id: 'pl1',
      title: 'Complete Crypto Starter Course',
      description: 'Everything you need to start your crypto journey, from buying your first Bitcoin to advanced security practices.',
      thumbnailUrl: 'https://img.youtube.com/vi/s4g1XFU8Gto/maxresdefault.jpg',
      videos: videos.filter((v) => v.difficulty === 'beginner'),
      totalDuration: 3765,
      videoCount: 2,
      category: 'getting_started',
      difficulty: 'beginner',
      isFeatured: true,
    },
    {
      id: 'pl2',
      title: 'Trading Fundamentals',
      description: 'Learn the basics of crypto trading, from reading charts to executing your first trade.',
      thumbnailUrl: 'https://img.youtube.com/vi/eynxyoKgpng/maxresdefault.jpg',
      videos: videos.filter((v) => v.category === 'technical_analysis' || v.category === 'trading'),
      totalDuration: 3600,
      videoCount: 1,
      category: 'trading',
      difficulty: 'intermediate',
      isFeatured: false,
    },
  ];
}
