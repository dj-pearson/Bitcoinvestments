/**
 * User Reputation System
 *
 * Gamification system with points, badges, and levels to increase engagement.
 *
 * Features:
 * - Points for various activities
 * - Level progression
 * - Achievement badges
 * - Leaderboards
 * - Streaks and multipliers
 */

import { supabase, isSupabaseConfigured, db } from '../lib/supabase';

export interface UserReputation {
  userId: string;
  points: number;
  level: number;
  levelName: string;
  levelProgress: number; // 0-100 progress to next level
  pointsToNextLevel: number;
  badges: Badge[];
  streak: {
    current: number;
    longest: number;
    lastActivityDate: string;
  };
  stats: UserStats;
  rank?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  earnedAt: string;
  category: BadgeCategory;
}

export type BadgeCategory =
  | 'portfolio'
  | 'learning'
  | 'community'
  | 'trading'
  | 'streak'
  | 'special';

export interface UserStats {
  totalTrades: number;
  articlesRead: number;
  reviewsWritten: number;
  questionsAnswered: number;
  referrals: number;
  daysActive: number;
  coursesCompleted: number;
}

export interface PointAction {
  id: string;
  action: ActionType;
  points: number;
  multiplier: number;
  description: string;
  timestamp: string;
}

export type ActionType =
  | 'login'
  | 'add_trade'
  | 'read_article'
  | 'complete_course'
  | 'write_review'
  | 'answer_question'
  | 'refer_user'
  | 'connect_wallet'
  | 'set_price_alert'
  | 'daily_streak'
  | 'weekly_streak'
  | 'achievement_unlock';

// Level configuration
export const LEVELS = [
  { level: 1, name: 'Newcomer', minPoints: 0, maxPoints: 99 },
  { level: 2, name: 'Beginner', minPoints: 100, maxPoints: 299 },
  { level: 3, name: 'Learner', minPoints: 300, maxPoints: 599 },
  { level: 4, name: 'Enthusiast', minPoints: 600, maxPoints: 999 },
  { level: 5, name: 'Investor', minPoints: 1000, maxPoints: 1499 },
  { level: 6, name: 'Trader', minPoints: 1500, maxPoints: 2499 },
  { level: 7, name: 'Expert', minPoints: 2500, maxPoints: 3999 },
  { level: 8, name: 'Master', minPoints: 4000, maxPoints: 5999 },
  { level: 9, name: 'Guru', minPoints: 6000, maxPoints: 9999 },
  { level: 10, name: 'Legend', minPoints: 10000, maxPoints: Infinity },
];

// Points for each action
export const POINT_VALUES: Record<ActionType, number> = {
  login: 5,
  add_trade: 10,
  read_article: 5,
  complete_course: 50,
  write_review: 25,
  answer_question: 15,
  refer_user: 100,
  connect_wallet: 20,
  set_price_alert: 5,
  daily_streak: 10,
  weekly_streak: 50,
  achievement_unlock: 25,
};

// Badge definitions
export const BADGES: Record<string, Omit<Badge, 'earnedAt'>> = {
  // Portfolio badges
  first_trade: {
    id: 'first_trade',
    name: 'First Trade',
    description: 'Recorded your first portfolio trade',
    icon: '📈',
    rarity: 'common',
    category: 'portfolio',
  },
  portfolio_10k: {
    id: 'portfolio_10k',
    name: '$10K Club',
    description: 'Portfolio reached $10,000 in value',
    icon: '💰',
    rarity: 'uncommon',
    category: 'portfolio',
  },
  portfolio_100k: {
    id: 'portfolio_100k',
    name: '$100K Club',
    description: 'Portfolio reached $100,000 in value',
    icon: '💎',
    rarity: 'rare',
    category: 'portfolio',
  },
  diversified: {
    id: 'diversified',
    name: 'Diversified',
    description: 'Hold 10+ different cryptocurrencies',
    icon: '🎯',
    rarity: 'uncommon',
    category: 'portfolio',
  },
  diamond_hands: {
    id: 'diamond_hands',
    name: 'Diamond Hands',
    description: 'Hold a position for 365+ days',
    icon: '💎',
    rarity: 'epic',
    category: 'trading',
  },

  // Learning badges
  first_article: {
    id: 'first_article',
    name: 'Knowledge Seeker',
    description: 'Read your first article',
    icon: '📚',
    rarity: 'common',
    category: 'learning',
  },
  bookworm: {
    id: 'bookworm',
    name: 'Bookworm',
    description: 'Read 25 articles',
    icon: '🐛',
    rarity: 'uncommon',
    category: 'learning',
  },
  scholar: {
    id: 'scholar',
    name: 'Scholar',
    description: 'Read 100 articles',
    icon: '🎓',
    rarity: 'rare',
    category: 'learning',
  },
  course_complete: {
    id: 'course_complete',
    name: 'Graduate',
    description: 'Completed your first course',
    icon: '🏆',
    rarity: 'uncommon',
    category: 'learning',
  },
  all_courses: {
    id: 'all_courses',
    name: 'Valedictorian',
    description: 'Completed all courses',
    icon: '🎖️',
    rarity: 'legendary',
    category: 'learning',
  },

  // Community badges
  first_review: {
    id: 'first_review',
    name: 'Reviewer',
    description: 'Wrote your first platform review',
    icon: '✍️',
    rarity: 'common',
    category: 'community',
  },
  helpful: {
    id: 'helpful',
    name: 'Helpful',
    description: 'Answered 10 community questions',
    icon: '🤝',
    rarity: 'uncommon',
    category: 'community',
  },
  mentor: {
    id: 'mentor',
    name: 'Mentor',
    description: 'Answered 50 community questions',
    icon: '👨‍🏫',
    rarity: 'rare',
    category: 'community',
  },
  influencer: {
    id: 'influencer',
    name: 'Influencer',
    description: 'Referred 10 users to the platform',
    icon: '⭐',
    rarity: 'epic',
    category: 'community',
  },

  // Streak badges
  streak_7: {
    id: 'streak_7',
    name: 'Week Warrior',
    description: '7-day login streak',
    icon: '🔥',
    rarity: 'common',
    category: 'streak',
  },
  streak_30: {
    id: 'streak_30',
    name: 'Monthly Master',
    description: '30-day login streak',
    icon: '🔥',
    rarity: 'uncommon',
    category: 'streak',
  },
  streak_100: {
    id: 'streak_100',
    name: 'Century Club',
    description: '100-day login streak',
    icon: '💯',
    rarity: 'rare',
    category: 'streak',
  },
  streak_365: {
    id: 'streak_365',
    name: 'Year of Dedication',
    description: '365-day login streak',
    icon: '🏅',
    rarity: 'legendary',
    category: 'streak',
  },

  // Special badges
  early_adopter: {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Joined during the first month',
    icon: '🚀',
    rarity: 'epic',
    category: 'special',
  },
  premium_member: {
    id: 'premium_member',
    name: 'Premium Member',
    description: 'Subscribed to premium',
    icon: '👑',
    rarity: 'rare',
    category: 'special',
  },
  bug_hunter: {
    id: 'bug_hunter',
    name: 'Bug Hunter',
    description: 'Reported a valid bug',
    icon: '🐞',
    rarity: 'rare',
    category: 'special',
  },
  og_member: {
    id: 'og_member',
    name: 'OG Member',
    description: 'Been a member for 2+ years',
    icon: '🏛️',
    rarity: 'legendary',
    category: 'special',
  },
};

/**
 * Get user reputation data
 */
export async function getUserReputation(
  userId: string
): Promise<{ reputation: UserReputation | null; error: string | null }> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('user_reputation')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const level = getLevelFromPoints(data.points);
        return {
          reputation: {
            userId: data.user_id,
            points: data.points,
            level: level.level,
            levelName: level.name,
            levelProgress: calculateLevelProgress(data.points, level),
            pointsToNextLevel: level.maxPoints - data.points,
            badges: data.badges || [],
            streak: data.streak || { current: 0, longest: 0, lastActivityDate: '' },
            stats: data.stats || getDefaultStats(),
            rank: data.rank,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          },
          error: null,
        };
      }
    }

    // Return default reputation for new users
    return {
      reputation: createDefaultReputation(userId),
      error: null,
    };
  } catch (error) {
    console.error('Error fetching user reputation:', error);
    return {
      reputation: null,
      error: error instanceof Error ? error.message : 'Failed to load reputation',
    };
  }
}

/**
 * Award points for an action
 */
export async function awardPoints(
  userId: string,
  action: ActionType,
  multiplier: number = 1
): Promise<{ success: boolean; pointsAwarded: number; newBadges: Badge[]; error: string | null }> {
  try {
    const basePoints = POINT_VALUES[action];
    const pointsAwarded = Math.round(basePoints * multiplier);
    const newBadges: Badge[] = [];

    if (isSupabaseConfigured()) {
      // Get current reputation
      const { data: current } = await supabase
        .from('user_reputation')
        .select('*')
        .eq('user_id', userId)
        .single();

      const currentPoints = current?.points || 0;
      const currentStats = current?.stats || getDefaultStats();
      const currentBadges = current?.badges || [];
      const newPoints = currentPoints + pointsAwarded;

      // Update stats based on action
      const updatedStats = updateStatsForAction(currentStats, action);

      // Check for new badges
      const earnedBadges = checkForNewBadges(updatedStats, currentBadges, newPoints);
      newBadges.push(...earnedBadges);

      // Calculate new streak
      const streak = updateStreak(current?.streak);

      // Upsert reputation
      const { error } = await db.from('user_reputation').upsert(
        {
          user_id: userId,
          points: newPoints,
          badges: [...currentBadges, ...newBadges],
          stats: updatedStats,
          streak,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (error) throw error;

      // Log the action
      await db.from('reputation_history').insert({
        user_id: userId,
        action,
        points: pointsAwarded,
        multiplier,
      });
    }

    return { success: true, pointsAwarded, newBadges, error: null };
  } catch (error) {
    console.error('Error awarding points:', error);
    return {
      success: false,
      pointsAwarded: 0,
      newBadges: [],
      error: error instanceof Error ? error.message : 'Failed to award points',
    };
  }
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(
  limit: number = 10,
  timeframe: 'all' | 'month' | 'week' = 'all'
): Promise<{ leaderboard: LeaderboardEntry[]; error: string | null }> {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('user_reputation')
        .select('user_id, points, badges, stats')
        .order('points', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const leaderboard: LeaderboardEntry[] = (data || []).map((entry, index) => ({
        rank: index + 1,
        userId: entry.user_id,
        points: entry.points,
        level: getLevelFromPoints(entry.points),
        badgeCount: entry.badges?.length || 0,
      }));

      return { leaderboard, error: null };
    }

    // Demo leaderboard
    return { leaderboard: getDemoLeaderboard(), error: null };
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return {
      leaderboard: [],
      error: error instanceof Error ? error.message : 'Failed to load leaderboard',
    };
  }
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  points: number;
  level: { level: number; name: string };
  badgeCount: number;
}

/**
 * Get level from points
 */
export function getLevelFromPoints(points: number): (typeof LEVELS)[0] {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

/**
 * Calculate level progress percentage
 */
function calculateLevelProgress(
  points: number,
  level: (typeof LEVELS)[0]
): number {
  if (level.maxPoints === Infinity) return 100;
  const levelPoints = points - level.minPoints;
  const levelRange = level.maxPoints - level.minPoints;
  return Math.round((levelPoints / levelRange) * 100);
}

/**
 * Create default reputation for new user
 */
function createDefaultReputation(userId: string): UserReputation {
  const level = LEVELS[0];
  return {
    userId,
    points: 0,
    level: level.level,
    levelName: level.name,
    levelProgress: 0,
    pointsToNextLevel: level.maxPoints,
    badges: [],
    streak: { current: 0, longest: 0, lastActivityDate: '' },
    stats: getDefaultStats(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get default stats
 */
function getDefaultStats(): UserStats {
  return {
    totalTrades: 0,
    articlesRead: 0,
    reviewsWritten: 0,
    questionsAnswered: 0,
    referrals: 0,
    daysActive: 0,
    coursesCompleted: 0,
  };
}

/**
 * Update stats for action
 */
function updateStatsForAction(stats: UserStats, action: ActionType): UserStats {
  const updated = { ...stats };

  switch (action) {
    case 'add_trade':
      updated.totalTrades++;
      break;
    case 'read_article':
      updated.articlesRead++;
      break;
    case 'write_review':
      updated.reviewsWritten++;
      break;
    case 'answer_question':
      updated.questionsAnswered++;
      break;
    case 'refer_user':
      updated.referrals++;
      break;
    case 'complete_course':
      updated.coursesCompleted++;
      break;
    case 'login':
    case 'daily_streak':
      updated.daysActive++;
      break;
  }

  return updated;
}

/**
 * Check for new badges based on stats
 */
function checkForNewBadges(
  stats: UserStats,
  existingBadges: Badge[],
  points: number
): Badge[] {
  const earnedBadgeIds = new Set(existingBadges.map((b) => b.id));
  const newBadges: Badge[] = [];

  const checkAndAward = (badgeId: string, condition: boolean) => {
    if (condition && !earnedBadgeIds.has(badgeId) && BADGES[badgeId]) {
      newBadges.push({
        ...BADGES[badgeId],
        earnedAt: new Date().toISOString(),
      });
    }
  };

  // Portfolio badges
  checkAndAward('first_trade', stats.totalTrades >= 1);

  // Learning badges
  checkAndAward('first_article', stats.articlesRead >= 1);
  checkAndAward('bookworm', stats.articlesRead >= 25);
  checkAndAward('scholar', stats.articlesRead >= 100);
  checkAndAward('course_complete', stats.coursesCompleted >= 1);

  // Community badges
  checkAndAward('first_review', stats.reviewsWritten >= 1);
  checkAndAward('helpful', stats.questionsAnswered >= 10);
  checkAndAward('mentor', stats.questionsAnswered >= 50);
  checkAndAward('influencer', stats.referrals >= 10);

  return newBadges;
}

/**
 * Update streak
 */
function updateStreak(
  currentStreak?: UserReputation['streak']
): UserReputation['streak'] {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (!currentStreak || !currentStreak.lastActivityDate) {
    return { current: 1, longest: 1, lastActivityDate: today };
  }

  const lastDate = currentStreak.lastActivityDate.split('T')[0];

  if (lastDate === today) {
    // Already logged in today
    return currentStreak;
  } else if (lastDate === yesterday) {
    // Continuing streak
    const newCurrent = currentStreak.current + 1;
    return {
      current: newCurrent,
      longest: Math.max(newCurrent, currentStreak.longest),
      lastActivityDate: today,
    };
  } else {
    // Streak broken
    return { current: 1, longest: currentStreak.longest, lastActivityDate: today };
  }
}

/**
 * Get rarity color
 */
export function getRarityColor(rarity: Badge['rarity']): string {
  switch (rarity) {
    case 'common':
      return '#94a3b8';
    case 'uncommon':
      return '#22c55e';
    case 'rare':
      return '#3b82f6';
    case 'epic':
      return '#a855f7';
    case 'legendary':
      return '#f59e0b';
  }
}

/**
 * Demo leaderboard
 */
function getDemoLeaderboard(): LeaderboardEntry[] {
  return [
    { rank: 1, userId: 'user_1', points: 15420, level: getLevelFromPoints(15420), badgeCount: 24 },
    { rank: 2, userId: 'user_2', points: 12350, level: getLevelFromPoints(12350), badgeCount: 21 },
    { rank: 3, userId: 'user_3', points: 9870, level: getLevelFromPoints(9870), badgeCount: 18 },
    { rank: 4, userId: 'user_4', points: 7650, level: getLevelFromPoints(7650), badgeCount: 15 },
    { rank: 5, userId: 'user_5', points: 5430, level: getLevelFromPoints(5430), badgeCount: 12 },
  ];
}
