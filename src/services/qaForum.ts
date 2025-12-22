/**
 * Q&A Forum Service
 *
 * Community discussion platform with questions, answers, and voting.
 *
 * Features:
 * - Question posting with tags and categories
 * - Answers with voting and acceptance
 * - Comment threads
 * - Search and filtering
 * - Reputation integration
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { awardPoints } from './userReputation';

export interface Question {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  title: string;
  body: string;
  tags: string[];
  category: QuestionCategory;
  views: number;
  upvotes: number;
  downvotes: number;
  answerCount: number;
  acceptedAnswerId?: string;
  isPinned: boolean;
  isClosed: boolean;
  closedReason?: string;
  createdAt: string;
  updatedAt: string;
  userVote?: 'up' | 'down' | null;
}

export interface Answer {
  id: string;
  questionId: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  body: string;
  upvotes: number;
  downvotes: number;
  isAccepted: boolean;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
  userVote?: 'up' | 'down' | null;
}

export interface Comment {
  id: string;
  parentId: string;
  parentType: 'question' | 'answer';
  userId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export type QuestionCategory =
  | 'general'
  | 'bitcoin'
  | 'ethereum'
  | 'altcoins'
  | 'defi'
  | 'nft'
  | 'trading'
  | 'security'
  | 'tax'
  | 'beginner';

export const CATEGORY_INFO: Record<QuestionCategory, { label: string; icon: string; color: string }> = {
  general: { label: 'General', icon: '💬', color: '#94a3b8' },
  bitcoin: { label: 'Bitcoin', icon: '₿', color: '#f7931a' },
  ethereum: { label: 'Ethereum', icon: 'Ξ', color: '#627eea' },
  altcoins: { label: 'Altcoins', icon: '🪙', color: '#22c55e' },
  defi: { label: 'DeFi', icon: '🏦', color: '#a855f7' },
  nft: { label: 'NFTs', icon: '🖼️', color: '#ec4899' },
  trading: { label: 'Trading', icon: '📈', color: '#3b82f6' },
  security: { label: 'Security', icon: '🔐', color: '#ef4444' },
  tax: { label: 'Tax', icon: '📋', color: '#f59e0b' },
  beginner: { label: 'Beginner', icon: '🌱', color: '#10b981' },
};

export const POPULAR_TAGS = [
  'bitcoin', 'ethereum', 'defi', 'nft', 'trading', 'staking',
  'wallet', 'security', 'tax', 'beginner', 'altcoin', 'mining',
  'hodl', 'dca', 'portfolio', 'analysis', 'news', 'regulation',
];

export interface ForumStats {
  totalQuestions: number;
  totalAnswers: number;
  unansweredCount: number;
  activeUsers: number;
}

export interface SearchFilters {
  query?: string;
  category?: QuestionCategory;
  tags?: string[];
  sortBy: 'newest' | 'votes' | 'views' | 'unanswered';
  page: number;
  limit: number;
}

/**
 * Get questions with filters
 */
export async function getQuestions(
  filters: SearchFilters
): Promise<{ questions: Question[]; total: number; error: string | null }> {
  try {
    if (isSupabaseConfigured()) {
      let query = supabase
        .from('forum_questions')
        .select('*, forum_votes(vote_type)', { count: 'exact' });

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,body.ilike.%${filters.query}%`);
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'votes':
          query = query.order('upvotes', { ascending: false });
          break;
        case 'views':
          query = query.order('views', { ascending: false });
          break;
        case 'unanswered':
          query = query.eq('answer_count', 0).order('created_at', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Pagination
      const offset = (filters.page - 1) * filters.limit;
      query = query.range(offset, offset + filters.limit - 1);

      const { data, count, error } = await query;

      if (error) throw error;

      const questions: Question[] = (data || []).map(mapQuestionFromDB);
      return { questions, total: count || 0, error: null };
    }

    // Return demo data
    return { questions: getDemoQuestions(), total: 10, error: null };
  } catch (error) {
    console.error('Error fetching questions:', error);
    return {
      questions: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Failed to load questions',
    };
  }
}

/**
 * Get single question with answers
 */
export async function getQuestion(
  questionId: string
): Promise<{ question: Question | null; answers: Answer[]; error: string | null }> {
  try {
    if (isSupabaseConfigured()) {
      // Get question
      const { data: questionData, error: questionError } = await supabase
        .from('forum_questions')
        .select('*')
        .eq('id', questionId)
        .single();

      if (questionError) throw questionError;

      // Increment view count
      await supabase
        .from('forum_questions')
        .update({ views: (questionData.views || 0) + 1 })
        .eq('id', questionId);

      // Get answers
      const { data: answersData, error: answersError } = await supabase
        .from('forum_answers')
        .select('*, forum_comments(*)')
        .eq('question_id', questionId)
        .order('is_accepted', { ascending: false })
        .order('upvotes', { ascending: false });

      if (answersError) throw answersError;

      return {
        question: mapQuestionFromDB(questionData),
        answers: (answersData || []).map(mapAnswerFromDB),
        error: null,
      };
    }

    // Return demo data
    const demoQuestion = getDemoQuestions()[0];
    return {
      question: demoQuestion,
      answers: getDemoAnswers(demoQuestion.id),
      error: null,
    };
  } catch (error) {
    console.error('Error fetching question:', error);
    return {
      question: null,
      answers: [],
      error: error instanceof Error ? error.message : 'Failed to load question',
    };
  }
}

/**
 * Create a new question
 */
export async function createQuestion(
  userId: string,
  data: {
    title: string;
    body: string;
    category: QuestionCategory;
    tags: string[];
  }
): Promise<{ question: Question | null; error: string | null }> {
  try {
    if (!isSupabaseConfigured()) {
      return { question: null, error: 'Database not configured' };
    }

    const { data: question, error } = await supabase
      .from('forum_questions')
      .insert({
        user_id: userId,
        title: data.title,
        body: data.body,
        category: data.category,
        tags: data.tags,
      })
      .select()
      .single();

    if (error) throw error;

    // Award points for asking a question
    await awardPoints(userId, 'answer_question', 0.5);

    return { question: mapQuestionFromDB(question), error: null };
  } catch (error) {
    console.error('Error creating question:', error);
    return {
      question: null,
      error: error instanceof Error ? error.message : 'Failed to create question',
    };
  }
}

/**
 * Create an answer
 */
export async function createAnswer(
  userId: string,
  questionId: string,
  body: string
): Promise<{ answer: Answer | null; error: string | null }> {
  try {
    if (!isSupabaseConfigured()) {
      return { answer: null, error: 'Database not configured' };
    }

    const { data: answer, error } = await supabase
      .from('forum_answers')
      .insert({
        question_id: questionId,
        user_id: userId,
        body,
      })
      .select()
      .single();

    if (error) throw error;

    // Update answer count
    await supabase.rpc('increment_answer_count', { q_id: questionId });

    // Award points for answering
    await awardPoints(userId, 'answer_question');

    return { answer: mapAnswerFromDB(answer), error: null };
  } catch (error) {
    console.error('Error creating answer:', error);
    return {
      answer: null,
      error: error instanceof Error ? error.message : 'Failed to post answer',
    };
  }
}

/**
 * Vote on a question or answer
 */
export async function vote(
  userId: string,
  targetId: string,
  targetType: 'question' | 'answer',
  voteType: 'up' | 'down'
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Database not configured' };
    }

    // Check existing vote
    const { data: existing } = await supabase
      .from('forum_votes')
      .select('*')
      .eq('user_id', userId)
      .eq('target_id', targetId)
      .eq('target_type', targetType)
      .single();

    if (existing) {
      if (existing.vote_type === voteType) {
        // Remove vote
        await supabase
          .from('forum_votes')
          .delete()
          .eq('id', existing.id);
      } else {
        // Change vote
        await supabase
          .from('forum_votes')
          .update({ vote_type: voteType })
          .eq('id', existing.id);
      }
    } else {
      // New vote
      await supabase.from('forum_votes').insert({
        user_id: userId,
        target_id: targetId,
        target_type: targetType,
        vote_type: voteType,
      });
    }

    // Update vote counts
    await updateVoteCounts(targetId, targetType);

    return { success: true, error: null };
  } catch (error) {
    console.error('Error voting:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to vote',
    };
  }
}

/**
 * Accept an answer
 */
export async function acceptAnswer(
  userId: string,
  questionId: string,
  answerId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Database not configured' };
    }

    // Verify user owns the question
    const { data: question } = await supabase
      .from('forum_questions')
      .select('user_id')
      .eq('id', questionId)
      .single();

    if (!question || question.user_id !== userId) {
      return { success: false, error: 'Only the question author can accept answers' };
    }

    // Unaccept any existing accepted answer
    await supabase
      .from('forum_answers')
      .update({ is_accepted: false })
      .eq('question_id', questionId);

    // Accept the new answer
    const { error } = await supabase
      .from('forum_answers')
      .update({ is_accepted: true })
      .eq('id', answerId);

    if (error) throw error;

    // Update question
    await supabase
      .from('forum_questions')
      .update({ accepted_answer_id: answerId })
      .eq('id', questionId);

    // Award points to answer author
    const { data: answer } = await supabase
      .from('forum_answers')
      .select('user_id')
      .eq('id', answerId)
      .single();

    if (answer) {
      await awardPoints(answer.user_id, 'answer_question', 2);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error accepting answer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to accept answer',
    };
  }
}

/**
 * Add a comment
 */
export async function addComment(
  userId: string,
  parentId: string,
  parentType: 'question' | 'answer',
  body: string
): Promise<{ comment: Comment | null; error: string | null }> {
  try {
    if (!isSupabaseConfigured()) {
      return { comment: null, error: 'Database not configured' };
    }

    const { data, error } = await supabase
      .from('forum_comments')
      .insert({
        parent_id: parentId,
        parent_type: parentType,
        user_id: userId,
        body,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      comment: {
        id: data.id,
        parentId: data.parent_id,
        parentType: data.parent_type,
        userId: data.user_id,
        authorName: 'User',
        body: data.body,
        createdAt: data.created_at,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error adding comment:', error);
    return {
      comment: null,
      error: error instanceof Error ? error.message : 'Failed to add comment',
    };
  }
}

/**
 * Get forum statistics
 */
export async function getForumStats(): Promise<ForumStats> {
  if (isSupabaseConfigured()) {
    const [questions, answers, unanswered] = await Promise.all([
      supabase.from('forum_questions').select('id', { count: 'exact', head: true }),
      supabase.from('forum_answers').select('id', { count: 'exact', head: true }),
      supabase.from('forum_questions').select('id', { count: 'exact', head: true }).eq('answer_count', 0),
    ]);

    return {
      totalQuestions: questions.count || 0,
      totalAnswers: answers.count || 0,
      unansweredCount: unanswered.count || 0,
      activeUsers: 150, // Placeholder
    };
  }

  return {
    totalQuestions: 245,
    totalAnswers: 892,
    unansweredCount: 23,
    activeUsers: 156,
  };
}

// Helper functions
async function updateVoteCounts(targetId: string, targetType: 'question' | 'answer') {
  const { data: votes } = await supabase
    .from('forum_votes')
    .select('vote_type')
    .eq('target_id', targetId)
    .eq('target_type', targetType);

  const upvotes = votes?.filter((v) => v.vote_type === 'up').length || 0;
  const downvotes = votes?.filter((v) => v.vote_type === 'down').length || 0;

  const table = targetType === 'question' ? 'forum_questions' : 'forum_answers';
  await supabase.from(table).update({ upvotes, downvotes }).eq('id', targetId);
}

function mapQuestionFromDB(data: Record<string, unknown>): Question {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    authorName: (data.author_name as string) || 'Anonymous',
    authorAvatar: data.author_avatar as string | undefined,
    title: data.title as string,
    body: data.body as string,
    tags: (data.tags as string[]) || [],
    category: (data.category as QuestionCategory) || 'general',
    views: (data.views as number) || 0,
    upvotes: (data.upvotes as number) || 0,
    downvotes: (data.downvotes as number) || 0,
    answerCount: (data.answer_count as number) || 0,
    acceptedAnswerId: data.accepted_answer_id as string | undefined,
    isPinned: (data.is_pinned as boolean) || false,
    isClosed: (data.is_closed as boolean) || false,
    closedReason: data.closed_reason as string | undefined,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

function mapAnswerFromDB(data: Record<string, unknown>): Answer {
  return {
    id: data.id as string,
    questionId: data.question_id as string,
    userId: data.user_id as string,
    authorName: (data.author_name as string) || 'Anonymous',
    authorAvatar: data.author_avatar as string | undefined,
    body: data.body as string,
    upvotes: (data.upvotes as number) || 0,
    downvotes: (data.downvotes as number) || 0,
    isAccepted: (data.is_accepted as boolean) || false,
    comments: ((data.forum_comments as Record<string, unknown>[]) || []).map((c) => ({
      id: c.id as string,
      parentId: c.parent_id as string,
      parentType: c.parent_type as 'question' | 'answer',
      userId: c.user_id as string,
      authorName: (c.author_name as string) || 'Anonymous',
      body: c.body as string,
      createdAt: c.created_at as string,
    })),
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

// Demo data
function getDemoQuestions(): Question[] {
  return [
    {
      id: 'q1',
      userId: 'user1',
      authorName: 'CryptoEnthusiast',
      title: 'What is the best strategy for DCA into Bitcoin?',
      body: 'I want to start dollar-cost averaging into Bitcoin. What frequency and amount would you recommend for someone just starting out? I have about $500/month to invest.',
      tags: ['bitcoin', 'dca', 'beginner', 'strategy'],
      category: 'bitcoin',
      views: 342,
      upvotes: 28,
      downvotes: 2,
      answerCount: 5,
      acceptedAnswerId: 'a1',
      isPinned: false,
      isClosed: false,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'q2',
      userId: 'user2',
      authorName: 'DeFiExplorer',
      title: 'How do I evaluate the risk of a DeFi protocol?',
      body: 'I want to provide liquidity but I\'m worried about smart contract risks. What should I look for when evaluating a DeFi protocol?',
      tags: ['defi', 'security', 'risk', 'liquidity'],
      category: 'defi',
      views: 189,
      upvotes: 15,
      downvotes: 0,
      answerCount: 3,
      isPinned: false,
      isClosed: false,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'q3',
      userId: 'user3',
      authorName: 'TaxConfused',
      title: 'Do I need to report crypto-to-crypto trades for taxes?',
      body: 'I traded ETH for SOL last year. Do I need to report this as a taxable event even though I never converted to USD?',
      tags: ['tax', 'trading', 'regulations'],
      category: 'tax',
      views: 567,
      upvotes: 45,
      downvotes: 1,
      answerCount: 8,
      acceptedAnswerId: 'a5',
      isPinned: true,
      isClosed: false,
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
  ];
}

function getDemoAnswers(questionId: string): Answer[] {
  return [
    {
      id: 'a1',
      questionId,
      userId: 'user4',
      authorName: 'BTCMaximalist',
      body: 'For DCA, I recommend weekly purchases. With $500/month, that\'s about $125/week. Weekly is a good balance between catching price swings and not overcomplicating things.\n\nHere\'s what I suggest:\n1. Set up automatic buys on a reputable exchange\n2. Choose the same day each week (e.g., every Monday)\n3. Don\'t check the price before buying - that defeats the purpose of DCA\n4. Consider moving to cold storage every few months for security',
      upvotes: 24,
      downvotes: 1,
      isAccepted: true,
      comments: [
        {
          id: 'c1',
          parentId: 'a1',
          parentType: 'answer',
          userId: 'user1',
          authorName: 'CryptoEnthusiast',
          body: 'Thanks! This is really helpful. Which exchange do you recommend for automatic buys?',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
      createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    },
    {
      id: 'a2',
      questionId,
      userId: 'user5',
      authorName: 'InvestorPro',
      body: 'I actually prefer monthly DCA for simplicity. Set it on your payday and forget about it. The difference between weekly and monthly is minimal over the long term.\n\nWhat matters most is:\n- Consistency (never skip)\n- Long time horizon (5+ years)\n- Never invest more than you can afford to lose',
      upvotes: 12,
      downvotes: 2,
      isAccepted: false,
      comments: [],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
}
