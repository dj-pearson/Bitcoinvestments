// Early Access Features Service
// Beta access to new tools and features for premium users

import { supabase } from '../lib/supabase';

export type FeatureStatus = 'alpha' | 'beta' | 'stable' | 'deprecated';
export type FeatureCategory = 'trading' | 'portfolio' | 'analytics' | 'social' | 'tools' | 'integrations';

export interface EarlyAccessFeature {
  id: string;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  category: FeatureCategory;
  status: FeatureStatus;
  version: string;
  releaseDate?: string;
  expectedStableDate?: string;
  isPremiumOnly: boolean;
  maxBetaUsers?: number;
  currentBetaUsers: number;
  thumbnail?: string;
  screenshots: string[];
  changelog: ChangelogEntry[];
  feedbackCount: number;
  averageRating: number;
  requirements?: string[];
  knownIssues?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export interface BetaEnrollment {
  id: string;
  userId: string;
  featureId: string;
  enrolledAt: string;
  isActive: boolean;
  feedbackProvided: boolean;
}

export interface FeatureFeedback {
  id: string;
  featureId: string;
  userId: string;
  rating: number;
  feedback: string;
  category: 'bug' | 'suggestion' | 'praise' | 'other';
  createdAt: string;
}

// Category labels
export const FEATURE_CATEGORY_LABELS: Record<FeatureCategory, string> = {
  trading: 'Trading',
  portfolio: 'Portfolio',
  analytics: 'Analytics',
  social: 'Social',
  tools: 'Tools',
  integrations: 'Integrations'
};

export const STATUS_LABELS: Record<FeatureStatus, string> = {
  alpha: 'Alpha',
  beta: 'Beta',
  stable: 'Stable',
  deprecated: 'Deprecated'
};

export const STATUS_COLORS: Record<FeatureStatus, string> = {
  alpha: 'bg-red-100 text-red-700',
  beta: 'bg-yellow-100 text-yellow-700',
  stable: 'bg-green-100 text-green-700',
  deprecated: 'bg-gray-100 text-gray-700'
};

// Demo features
const DEMO_FEATURES: EarlyAccessFeature[] = [
  {
    id: 'feature-1',
    name: 'AI Portfolio Analyzer',
    slug: 'ai-portfolio-analyzer',
    description: 'Get AI-powered insights and recommendations for your crypto portfolio.',
    longDescription: 'Our new AI Portfolio Analyzer uses machine learning to analyze your holdings, identify risks, suggest rebalancing opportunities, and predict potential issues before they happen.',
    category: 'analytics',
    status: 'beta',
    version: '0.9.2',
    expectedStableDate: '2025-02-01',
    isPremiumOnly: true,
    maxBetaUsers: 500,
    currentBetaUsers: 342,
    screenshots: ['/screenshots/ai-analyzer-1.png', '/screenshots/ai-analyzer-2.png'],
    changelog: [
      { version: '0.9.2', date: '2024-12-20', changes: ['Added risk score breakdown', 'Fixed correlation analysis bug', 'Improved recommendations'] },
      { version: '0.9.1', date: '2024-12-10', changes: ['Added correlation analysis', 'Performance optimizations'] },
      { version: '0.9.0', date: '2024-12-01', changes: ['Initial beta release'] }
    ],
    feedbackCount: 89,
    averageRating: 4.2,
    requirements: ['Premium subscription', 'At least $1,000 portfolio value'],
    knownIssues: ['Analysis may take up to 30 seconds for large portfolios'],
    createdAt: '2024-11-15T10:00:00Z',
    updatedAt: '2024-12-20T14:00:00Z'
  },
  {
    id: 'feature-2',
    name: 'Social Trading',
    slug: 'social-trading',
    description: 'Follow top traders and automatically copy their moves.',
    longDescription: 'Connect with successful traders, see their strategies, and optionally mirror their trades. Includes leaderboards, trader profiles, and performance analytics.',
    category: 'social',
    status: 'alpha',
    version: '0.5.0',
    expectedStableDate: '2025-04-01',
    isPremiumOnly: true,
    maxBetaUsers: 100,
    currentBetaUsers: 67,
    screenshots: [],
    changelog: [
      { version: '0.5.0', date: '2024-12-15', changes: ['Initial alpha release', 'Basic copy trading', 'Leaderboards'] }
    ],
    feedbackCount: 23,
    averageRating: 3.8,
    requirements: ['Premium subscription', 'Connected exchange'],
    knownIssues: ['Copy delays may occur during high volatility', 'Limited to supported exchanges'],
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-15T14:00:00Z'
  },
  {
    id: 'feature-3',
    name: 'Advanced Charting',
    slug: 'advanced-charting',
    description: 'Professional-grade charting with 50+ indicators and drawing tools.',
    longDescription: 'TradingView-style charting with all the tools you need for technical analysis. Includes custom indicator support, multiple timeframes, and chart templates.',
    category: 'trading',
    status: 'beta',
    version: '1.2.0',
    expectedStableDate: '2025-01-15',
    isPremiumOnly: false,
    maxBetaUsers: 1000,
    currentBetaUsers: 823,
    screenshots: ['/screenshots/charting-1.png'],
    changelog: [
      { version: '1.2.0', date: '2024-12-18', changes: ['Added 15 new indicators', 'Custom indicator builder', 'Chart templates'] },
      { version: '1.1.0', date: '2024-12-05', changes: ['Drawing tools improvements', 'Multi-chart layouts'] },
      { version: '1.0.0', date: '2024-11-20', changes: ['Initial beta release'] }
    ],
    feedbackCount: 156,
    averageRating: 4.5,
    createdAt: '2024-11-01T10:00:00Z',
    updatedAt: '2024-12-18T14:00:00Z'
  },
  {
    id: 'feature-4',
    name: 'Tax Automation',
    slug: 'tax-automation',
    description: 'Automatic tax lot tracking and report generation.',
    longDescription: 'Automatically track cost basis, calculate gains/losses, and generate tax reports. Supports FIFO, LIFO, and specific identification methods.',
    category: 'tools',
    status: 'beta',
    version: '0.8.5',
    expectedStableDate: '2025-03-01',
    isPremiumOnly: true,
    maxBetaUsers: 300,
    currentBetaUsers: 212,
    screenshots: [],
    changelog: [
      { version: '0.8.5', date: '2024-12-19', changes: ['Added Form 8949 export', 'DeFi transaction support'] },
      { version: '0.8.0', date: '2024-12-01', changes: ['Multiple accounting methods', 'CSV import'] }
    ],
    feedbackCount: 67,
    averageRating: 4.1,
    requirements: ['Premium subscription'],
    knownIssues: ['Some DeFi protocols not yet supported'],
    createdAt: '2024-10-15T10:00:00Z',
    updatedAt: '2024-12-19T14:00:00Z'
  },
  {
    id: 'feature-5',
    name: 'Telegram Alerts Bot',
    slug: 'telegram-alerts-bot',
    description: 'Get price alerts and portfolio updates via Telegram.',
    longDescription: 'Connect your Telegram account to receive instant notifications for price alerts, portfolio changes, and important market events.',
    category: 'integrations',
    status: 'stable',
    version: '2.0.0',
    releaseDate: '2024-12-10',
    isPremiumOnly: false,
    currentBetaUsers: 0,
    screenshots: [],
    changelog: [
      { version: '2.0.0', date: '2024-12-10', changes: ['Stable release', 'Added portfolio summaries', 'Custom alert messages'] }
    ],
    feedbackCount: 234,
    averageRating: 4.7,
    createdAt: '2024-09-01T10:00:00Z',
    updatedAt: '2024-12-10T14:00:00Z'
  }
];

// Get all features
export async function getEarlyAccessFeatures(category?: FeatureCategory): Promise<{
  features: EarlyAccessFeature[];
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      let filtered = [...DEMO_FEATURES];
      if (category) {
        filtered = filtered.filter(f => f.category === category);
      }
      return { features: filtered, error: null };
    }

    let query = supabase
      .from('early_access_features')
      .select('*')
      .neq('status', 'deprecated');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) throw error;

    return { features: data || [], error: null };
  } catch (err) {
    console.error('Error fetching features:', err);
    return { features: DEMO_FEATURES, error: null };
  }
}

// Get single feature
export async function getFeature(idOrSlug: string): Promise<{
  feature: EarlyAccessFeature | null;
  error: string | null;
}> {
  const demoFeature = DEMO_FEATURES.find(f => f.id === idOrSlug || f.slug === idOrSlug);

  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || demoFeature) {
      return { feature: demoFeature || null, error: demoFeature ? null : 'Feature not found' };
    }

    const { data, error } = await supabase
      .from('early_access_features')
      .select('*')
      .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
      .single();

    if (error) throw error;

    return { feature: data, error: null };
  } catch (err) {
    return { feature: demoFeature || null, error: demoFeature ? null : 'Feature not found' };
  }
}

// Enroll in beta
export async function enrollInBeta(userId: string, featureId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: true, error: null };
    }

    const { error } = await supabase
      .from('beta_enrollments')
      .upsert({
        user_id: userId,
        feature_id: featureId,
        is_active: true
      });

    if (error) throw error;

    await supabase.rpc('increment_beta_users', { feature_id: featureId });

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Leave beta
export async function leaveBeta(userId: string, featureId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: true, error: null };
    }

    const { error } = await supabase
      .from('beta_enrollments')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('feature_id', featureId);

    if (error) throw error;

    await supabase.rpc('decrement_beta_users', { feature_id: featureId });

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Get user's enrollments
export async function getUserEnrollments(userId: string): Promise<{
  enrollments: BetaEnrollment[];
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { enrollments: [], error: null };
    }

    const { data, error } = await supabase
      .from('beta_enrollments')
      .select('*, feature:early_access_features(*)')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    return { enrollments: data || [], error: null };
  } catch (err) {
    return { enrollments: [], error: null };
  }
}

// Submit feedback
export async function submitFeedback(
  userId: string,
  featureId: string,
  rating: number,
  feedback: string,
  category: 'bug' | 'suggestion' | 'praise' | 'other'
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: true, error: null };
    }

    const { error } = await supabase
      .from('feature_feedback')
      .insert({
        user_id: userId,
        feature_id: featureId,
        rating,
        feedback,
        category
      });

    if (error) throw error;

    // Update feature stats
    await supabase.rpc('update_feature_feedback_stats', { feature_id: featureId });

    // Mark enrollment as feedback provided
    await supabase
      .from('beta_enrollments')
      .update({ feedback_provided: true })
      .eq('user_id', userId)
      .eq('feature_id', featureId);

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Check if user is enrolled in a feature
export async function isUserEnrolled(userId: string, featureId: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return false;
    }

    const { data } = await supabase
      .from('beta_enrollments')
      .select('is_active')
      .eq('user_id', userId)
      .eq('feature_id', featureId)
      .single();

    return data?.is_active || false;
  } catch {
    return false;
  }
}

// Check if feature is available to user
export function isFeatureAvailable(feature: EarlyAccessFeature, isPremiumUser: boolean): boolean {
  if (feature.status === 'deprecated') return false;
  if (feature.isPremiumOnly && !isPremiumUser) return false;
  if (feature.maxBetaUsers && feature.currentBetaUsers >= feature.maxBetaUsers) return false;
  return true;
}
