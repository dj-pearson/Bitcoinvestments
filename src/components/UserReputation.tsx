import { useState, useEffect } from 'react';
import {
  Trophy,
  Star,
  Flame,
  Award,
  TrendingUp,
  Users,
  Calendar,
  ChevronRight,
  Lock,
  RefreshCw,
} from 'lucide-react';
import {
  getUserReputation,
  getLeaderboard,
  BADGES,
  getRarityColor,
  type UserReputation as UserReputationType,
  type Badge,
  type LeaderboardEntry,
} from '../services/userReputation';

interface UserReputationProps {
  userId: string;
}

export function UserReputation({ userId }: UserReputationProps) {
  const [reputation, setReputation] = useState<UserReputationType | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'leaderboard'>('overview');

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setIsLoading(true);
    const [repResult, leadResult] = await Promise.all([
      getUserReputation(userId),
      getLeaderboard(10),
    ]);

    if (repResult.reputation) {
      setReputation(repResult.reputation);
    }
    if (leadResult.leaderboard) {
      setLeaderboard(leadResult.leaderboard);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 text-orange-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!reputation) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center">
        <Trophy className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">Unable to Load Reputation</h3>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Level Badge */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">{reputation.level}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-1">
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              </div>
            </div>

            <div>
              <div className="text-2xl font-bold text-white">{reputation.levelName}</div>
              <div className="text-slate-400">Level {reputation.level}</div>
              <div className="flex items-center gap-2 mt-1">
                <Flame className="h-4 w-4 text-orange-400" />
                <span className="text-orange-400 font-medium">
                  {reputation.streak.current} day streak
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold text-white">
              {reputation.points.toLocaleString()}
            </div>
            <div className="text-slate-400">total points</div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Progress to Level {reputation.level + 1}</span>
            <span className="text-white">{reputation.levelProgress}%</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all"
              style={{ width: `${reputation.levelProgress}%` }}
            />
          </div>
          <div className="text-xs text-slate-500">
            {reputation.pointsToNextLevel.toLocaleString()} points to next level
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<TrendingUp />} label="Trades" value={reputation.stats.totalTrades} />
        <StatCard icon={<Award />} label="Badges" value={reputation.badges.length} />
        <StatCard icon={<Calendar />} label="Days Active" value={reputation.stats.daysActive} />
        <StatCard icon={<Users />} label="Referrals" value={reputation.stats.referrals} />
      </div>

      {/* Tabs */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="flex border-b border-slate-700">
          {(['overview', 'badges', 'leaderboard'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-orange-400 border-b-2 border-orange-400 bg-slate-800/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <OverviewTab reputation={reputation} />
          )}
          {activeTab === 'badges' && (
            <BadgesTab badges={reputation.badges} />
          )}
          {activeTab === 'leaderboard' && (
            <LeaderboardTab leaderboard={leaderboard} currentUserId={userId} />
          )}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        <div className="text-orange-400">{icon}</div>
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

// Overview Tab
function OverviewTab({ reputation }: { reputation: UserReputationType }) {
  const recentBadges = reputation.badges.slice(-3).reverse();

  return (
    <div className="space-y-6">
      {/* Recent Badges */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Recent Badges</h3>
        {recentBadges.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {recentBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} compact />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No badges earned yet. Keep exploring!</p>
          </div>
        )}
      </div>

      {/* Activity Stats */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Activity</h3>
        <div className="space-y-3">
          <ActivityRow
            label="Articles Read"
            value={reputation.stats.articlesRead}
            icon="📚"
          />
          <ActivityRow
            label="Reviews Written"
            value={reputation.stats.reviewsWritten}
            icon="✍️"
          />
          <ActivityRow
            label="Questions Answered"
            value={reputation.stats.questionsAnswered}
            icon="💬"
          />
          <ActivityRow
            label="Courses Completed"
            value={reputation.stats.coursesCompleted}
            icon="🎓"
          />
        </div>
      </div>

      {/* Streak Info */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Streak</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-5 w-5 text-orange-400" />
              <span className="text-slate-400">Current</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {reputation.streak.current} days
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              <span className="text-slate-400">Longest</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {reputation.streak.longest} days
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Activity Row
function ActivityRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <span className="text-slate-300">{label}</span>
      </div>
      <span className="font-bold text-white">{value}</span>
    </div>
  );
}

// Badges Tab
function BadgesTab({ badges }: { badges: Badge[] }) {
  const allBadgeIds = Object.keys(BADGES);

  // Group badges by category
  const categories = ['portfolio', 'learning', 'community', 'streak', 'special'] as const;
  const categoryLabels: Record<string, string> = {
    portfolio: 'Portfolio',
    learning: 'Learning',
    community: 'Community',
    streak: 'Streaks',
    special: 'Special',
  };

  return (
    <div className="space-y-8">
      {categories.map((category) => {
        const categoryBadges = allBadgeIds.filter(
          (id) => BADGES[id].category === category
        );

        return (
          <div key={category}>
            <h3 className="text-lg font-semibold text-white mb-4">
              {categoryLabels[category]}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categoryBadges.map((id) => {
                const badge = BADGES[id];
                const earned = badges.find((b) => b.id === id);

                return (
                  <BadgeCard
                    key={id}
                    badge={earned || { ...badge, earnedAt: '' }}
                    locked={!earned}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Badge Card
function BadgeCard({
  badge,
  locked = false,
  compact = false,
}: {
  badge: Badge;
  locked?: boolean;
  compact?: boolean;
}) {
  const rarityColor = getRarityColor(badge.rarity);

  if (compact) {
    return (
      <div
        className={`p-4 rounded-xl border ${
          locked
            ? 'bg-slate-800/30 border-slate-700 opacity-50'
            : 'bg-slate-800/50 border-slate-700'
        }`}
      >
        <div className="text-3xl mb-2">{badge.icon}</div>
        <div className="font-medium text-white text-sm">{badge.name}</div>
        <div
          className="text-xs mt-1"
          style={{ color: rarityColor }}
        >
          {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-xl border relative ${
        locked
          ? 'bg-slate-800/30 border-slate-700'
          : 'bg-slate-800/50 border-slate-700'
      }`}
    >
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-xl">
          <Lock className="h-6 w-6 text-slate-500" />
        </div>
      )}
      <div className="text-center">
        <div className="text-4xl mb-3">{badge.icon}</div>
        <div className="font-medium text-white">{badge.name}</div>
        <div className="text-xs text-slate-400 mt-1 line-clamp-2">
          {badge.description}
        </div>
        <div
          className="inline-block px-2 py-0.5 rounded text-xs mt-2"
          style={{
            backgroundColor: `${rarityColor}20`,
            color: rarityColor,
          }}
        >
          {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
        </div>
        {badge.earnedAt && !locked && (
          <div className="text-xs text-slate-500 mt-2">
            Earned {new Date(badge.earnedAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}

// Leaderboard Tab
function LeaderboardTab({
  leaderboard,
  currentUserId,
}: {
  leaderboard: LeaderboardEntry[];
  currentUserId: string;
}) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Top Players</h3>
        <select className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white">
          <option value="all">All Time</option>
          <option value="month">This Month</option>
          <option value="week">This Week</option>
        </select>
      </div>

      <div className="space-y-2">
        {leaderboard.map((entry) => {
          const isCurrentUser = entry.userId === currentUserId;

          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-4 p-4 rounded-xl ${
                isCurrentUser
                  ? 'bg-orange-500/20 border border-orange-500/30'
                  : 'bg-slate-800/50'
              }`}
            >
              {/* Rank */}
              <div className="w-12 text-center">
                {entry.rank <= 3 ? (
                  <span className="text-2xl">{getRankIcon(entry.rank)}</span>
                ) : (
                  <span className="text-lg font-bold text-slate-400">
                    {getRankIcon(entry.rank)}
                  </span>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="font-medium text-white">
                  {isCurrentUser ? 'You' : `Player ${entry.rank}`}
                </div>
                <div className="text-sm text-slate-400">
                  Level {entry.level.level} • {entry.level.name}
                </div>
              </div>

              {/* Points */}
              <div className="text-right">
                <div className="font-bold text-white">
                  {entry.points.toLocaleString()}
                </div>
                <div className="text-sm text-slate-400">
                  {entry.badgeCount} badges
                </div>
              </div>

              <ChevronRight className="h-5 w-5 text-slate-500" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
