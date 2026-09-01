// Expert AMA Sessions Service
// Live Q&A sessions with cryptocurrency experts

import { supabase, db } from '../lib/supabase';

export type AMAStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';
export type QuestionStatus = 'pending' | 'approved' | 'answered' | 'rejected';

export interface AMASession {
  id: string;
  title: string;
  slug: string;
  description: string;
  expertId: string;
  expert?: AMAExpert;
  scheduledAt: string;
  duration: number; // minutes
  status: AMAStatus;
  isPremium: boolean;
  maxAttendees?: number;
  attendeeCount: number;
  questionCount: number;
  streamUrl?: string;
  recordingUrl?: string;
  topics: string[];
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AMAExpert {
  id: string;
  name: string;
  title: string;
  company?: string;
  bio: string;
  avatarUrl?: string;
  expertise: string[];
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  totalSessions: number;
  averageRating: number;
}

export interface AMAQuestion {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  content: string;
  upvotes: number;
  status: QuestionStatus;
  answer?: string;
  answeredAt?: string;
  isAnonymous: boolean;
  createdAt: string;
}

export interface AMARegistration {
  id: string;
  sessionId: string;
  userId: string;
  registeredAt: string;
  attended: boolean;
  reminderSent: boolean;
}

export interface AMAFilters {
  status?: AMAStatus;
  expertId?: string;
  isPremium?: boolean;
  upcoming?: boolean;
  page?: number;
  limit?: number;
}

// Demo experts
const DEMO_EXPERTS: AMAExpert[] = [
  {
    id: 'expert-1',
    name: 'Andreas M. Antonopoulos',
    title: 'Bitcoin Educator & Author',
    bio: 'Best-selling author of "Mastering Bitcoin" and "The Internet of Money". Renowned educator and public speaker on Bitcoin and open blockchain technologies.',
    avatarUrl: '/experts/andreas.jpg',
    expertise: ['Bitcoin', 'Blockchain Technology', 'Decentralization', 'Security'],
    socialLinks: { twitter: '@aantonop', website: 'https://aantonop.com' },
    totalSessions: 12,
    averageRating: 4.9
  },
  {
    id: 'expert-2',
    name: 'Laura Shin',
    title: 'Crypto Journalist & Podcast Host',
    company: 'Unchained Podcast',
    bio: 'Host of Unchained and Unconfirmed podcasts. Former senior editor at Forbes covering crypto and blockchain.',
    avatarUrl: '/experts/laura.jpg',
    expertise: ['Crypto Industry', 'Journalism', 'DeFi', 'Regulation'],
    socialLinks: { twitter: '@laurashin' },
    totalSessions: 8,
    averageRating: 4.8
  },
  {
    id: 'expert-3',
    name: 'Vitalik Buterin',
    title: 'Co-founder of Ethereum',
    bio: 'Co-founder of Ethereum and Bitcoin Magazine. Leading voice in blockchain scalability and cryptographic research.',
    avatarUrl: '/experts/vitalik.jpg',
    expertise: ['Ethereum', 'Smart Contracts', 'Layer 2', 'Cryptography'],
    socialLinks: { twitter: '@VitalikButerin' },
    totalSessions: 5,
    averageRating: 5.0
  }
];

const DEMO_SESSIONS: AMASession[] = [
  {
    id: 'ama-1',
    title: 'Bitcoin in 2025: Institutional Adoption & What It Means for You',
    slug: 'bitcoin-2025-institutional-adoption',
    description: 'Join Andreas for a deep dive into how institutional adoption is reshaping Bitcoin. We\'ll discuss ETFs, corporate treasuries, and what it means for individual investors.',
    expertId: 'expert-1',
    expert: DEMO_EXPERTS[0],
    scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    duration: 60,
    status: 'scheduled',
    isPremium: false,
    maxAttendees: 500,
    attendeeCount: 342,
    questionCount: 47,
    topics: ['Bitcoin', 'Institutional Investing', 'ETFs', 'Future of Crypto'],
    createdAt: '2024-12-15T10:00:00Z',
    updatedAt: '2024-12-20T14:00:00Z'
  },
  {
    id: 'ama-2',
    title: 'DeFi Security: Protecting Your Assets in 2025',
    slug: 'defi-security-protecting-assets-2025',
    description: 'Laura Shin discusses the evolving DeFi security landscape, recent hacks, and practical steps to protect your crypto assets.',
    expertId: 'expert-2',
    expert: DEMO_EXPERTS[1],
    scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    duration: 45,
    status: 'scheduled',
    isPremium: true,
    maxAttendees: 200,
    attendeeCount: 156,
    questionCount: 28,
    topics: ['DeFi', 'Security', 'Smart Contracts', 'Risk Management'],
    createdAt: '2024-12-18T10:00:00Z',
    updatedAt: '2024-12-20T14:00:00Z'
  },
  {
    id: 'ama-3',
    title: 'The Future of Ethereum: Scaling and Beyond',
    slug: 'future-ethereum-scaling-beyond',
    description: 'Vitalik shares insights on Ethereum\'s roadmap, Layer 2 solutions, and the long-term vision for the network.',
    expertId: 'expert-3',
    expert: DEMO_EXPERTS[2],
    scheduledAt: '2024-12-10T18:00:00Z',
    duration: 90,
    status: 'ended',
    isPremium: true,
    attendeeCount: 1250,
    questionCount: 312,
    recordingUrl: '/recordings/ama-3-ethereum-future.mp4',
    topics: ['Ethereum', 'Layer 2', 'Scalability', 'Roadmap'],
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-10T20:00:00Z'
  }
];

const DEMO_QUESTIONS: AMAQuestion[] = [
  {
    id: 'q-1',
    sessionId: 'ama-1',
    userId: 'user-1',
    userName: 'CryptoEnthusiast',
    content: 'What do you think about the impact of Bitcoin ETFs on retail investors? Will it make Bitcoin more accessible or increase volatility?',
    upvotes: 45,
    status: 'approved',
    isAnonymous: false,
    createdAt: '2024-12-20T10:00:00Z'
  },
  {
    id: 'q-2',
    sessionId: 'ama-1',
    userId: 'user-2',
    userName: 'Anonymous',
    content: 'How should beginners approach Bitcoin in this institutional era? Start with DCA or wait for dips?',
    upvotes: 38,
    status: 'approved',
    isAnonymous: true,
    createdAt: '2024-12-20T11:00:00Z'
  },
  {
    id: 'q-3',
    sessionId: 'ama-3',
    userId: 'user-3',
    userName: 'ETHDeveloper',
    content: 'When do you expect full danksharding to be implemented, and how will it affect L2 costs?',
    upvotes: 89,
    status: 'answered',
    answer: 'Full danksharding is a multi-year effort. We expect significant progress by 2025-2026. L2 costs should drop by 10-100x as data availability improves.',
    answeredAt: '2024-12-10T18:45:00Z',
    isAnonymous: false,
    createdAt: '2024-12-10T18:30:00Z'
  }
];

// Get AMA sessions
export async function getAMASessions(filters: AMAFilters = {}): Promise<{
  sessions: AMASession[];
  total: number;
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      let filtered = [...DEMO_SESSIONS];

      if (filters.status) {
        filtered = filtered.filter(s => s.status === filters.status);
      }
      if (filters.expertId) {
        filtered = filtered.filter(s => s.expertId === filters.expertId);
      }
      if (filters.isPremium !== undefined) {
        filtered = filtered.filter(s => s.isPremium === filters.isPremium);
      }
      if (filters.upcoming) {
        filtered = filtered.filter(s => s.status === 'scheduled' && new Date(s.scheduledAt) > new Date());
      }

      filtered.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const start = (page - 1) * limit;

      return {
        sessions: filtered.slice(start, start + limit),
        total: filtered.length,
        error: null
      };
    }

    let query = db
      .from('ama_sessions')
      .select('*, expert:ama_experts(*)', { count: 'exact' });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.expertId) {
      query = query.eq('expert_id', filters.expertId);
    }
    if (filters.isPremium !== undefined) {
      query = query.eq('is_premium', filters.isPremium);
    }
    if (filters.upcoming) {
      query = query.eq('status', 'scheduled').gt('scheduled_at', new Date().toISOString());
    }

    query = query.order('scheduled_at', { ascending: false });

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    query = query.range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return { sessions: (data as AMASession[]) || [], total: count || 0, error: null };
  } catch (err) {
    console.error('Error fetching AMA sessions:', err);
    return { sessions: DEMO_SESSIONS, total: DEMO_SESSIONS.length, error: null };
  }
}

// Get single session with questions
export async function getAMASession(idOrSlug: string): Promise<{
  session: AMASession | null;
  questions: AMAQuestion[];
  error: string | null;
}> {
  const demoSession = DEMO_SESSIONS.find(s => s.id === idOrSlug || s.slug === idOrSlug);
  const demoQuestions = DEMO_QUESTIONS.filter(q => q.sessionId === demoSession?.id);

  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || demoSession) {
      return {
        session: demoSession || null,
        questions: demoQuestions,
        error: demoSession ? null : 'Session not found'
      };
    }

    const { data: amaSession, error: sessionError } = await db
      .from('ama_sessions')
      .select('*, expert:ama_experts(*)')
      .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
      .single();

    if (sessionError) throw sessionError;

    const { data: questions } = await db
      .from('ama_questions')
      .select('*')
      .eq('session_id', amaSession.id)
      .in('status', ['approved', 'answered'])
      .order('upvotes', { ascending: false });

    return {
      session: amaSession as AMASession,
      questions: (questions as AMAQuestion[]) || [],
      error: null
    };
  } catch (err) {
    console.error('Error fetching AMA session:', err);
    return {
      session: demoSession || null,
      questions: demoQuestions,
      error: demoSession ? null : 'Session not found'
    };
  }
}

// Register for AMA session
export async function registerForAMA(userId: string, sessionId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: true, error: null };
    }

    const { error } = await db
      .from('ama_registrations')
      .upsert({
        user_id: userId,
        session_id: sessionId,
        registered_at: new Date().toISOString()
      });

    if (error) throw error;

    // Increment attendee count
    await db.rpc('increment_ama_attendees', { session_id: sessionId });

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error registering for AMA:', err);
    return { success: false, error: err.message };
  }
}

// Submit a question
export async function submitQuestion(
  userId: string,
  sessionId: string,
  content: string,
  isAnonymous: boolean = false
): Promise<{ question: AMAQuestion | null; error: string | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const newQuestion: AMAQuestion = {
        id: `q-${Date.now()}`,
        sessionId,
        userId,
        userName: isAnonymous ? 'Anonymous' : 'Demo User',
        content,
        upvotes: 0,
        status: 'pending',
        isAnonymous,
        createdAt: new Date().toISOString()
      };
      return { question: newQuestion, error: null };
    }

    const { data: user } = await supabase.auth.getUser();

    const { data, error } = await db
      .from('ama_questions')
      .insert({
        session_id: sessionId,
        user_id: userId,
        user_name: isAnonymous ? 'Anonymous' : (user?.user?.user_metadata?.full_name || 'User'),
        content,
        is_anonymous: isAnonymous,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // Increment question count
    await db.rpc('increment_ama_questions', { session_id: sessionId });

    return { question: data as AMAQuestion, error: null };
  } catch (err: any) {
    console.error('Error submitting question:', err);
    return { question: null, error: err.message };
  }
}

// Upvote a question
export async function upvoteQuestion(userId: string, questionId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: true, error: null };
    }

    await db.from('ama_question_votes').upsert({
      user_id: userId,
      question_id: questionId
    });

    await db.rpc('update_question_upvotes', { question_id: questionId });

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Get user's registrations
export async function getUserRegistrations(userId: string): Promise<{
  registrations: AMARegistration[];
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { registrations: [], error: null };
    }

    const { data, error } = await db
      .from('ama_registrations')
      .select('*, session:ama_sessions(*, expert:ama_experts(*))')
      .eq('user_id', userId)
      .order('registered_at', { ascending: false });

    if (error) throw error;

    return { registrations: (data as AMARegistration[]) || [], error: null };
  } catch {
    return { registrations: [], error: null };
  }
}

// Get all experts
export async function getExperts(): Promise<AMAExpert[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return DEMO_EXPERTS;
    }

    const { data } = await db
      .from('ama_experts')
      .select('*')
      .order('total_sessions', { ascending: false });

    return (data as AMAExpert[]) || DEMO_EXPERTS;
  } catch {
    return DEMO_EXPERTS;
  }
}
