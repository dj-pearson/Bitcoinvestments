// Expert Webinars Service
// Live educational sessions with cryptocurrency experts

import { supabase, db } from '../lib/supabase';

export type WebinarStatus = 'upcoming' | 'live' | 'ended' | 'cancelled';
export type WebinarCategory = 'trading' | 'investing' | 'defi' | 'security' | 'tax' | 'fundamentals' | 'technical_analysis' | 'market_outlook';

export interface Webinar {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: WebinarCategory;
  hostId: string;
  host?: WebinarHost;
  scheduledAt: string;
  duration: number;
  status: WebinarStatus;
  isPremium: boolean;
  price?: number;
  maxAttendees?: number;
  attendeeCount: number;
  streamUrl?: string;
  recordingUrl?: string;
  slidesUrl?: string;
  thumbnail?: string;
  learningOutcomes: string[];
  prerequisites?: string[];
  materials: WebinarMaterial[];
  createdAt: string;
  updatedAt: string;
}

export interface WebinarHost {
  id: string;
  name: string;
  title: string;
  company?: string;
  bio: string;
  avatarUrl?: string;
  expertise: string[];
  webinarCount: number;
  averageRating: number;
}

export interface WebinarMaterial {
  id: string;
  type: 'slides' | 'worksheet' | 'checklist' | 'template' | 'resource';
  title: string;
  url: string;
  isPremium: boolean;
}

export interface WebinarRegistration {
  id: string;
  webinarId: string;
  userId: string;
  registeredAt: string;
  attended: boolean;
  watchTime?: number;
  completedMaterials: string[];
}

export interface WebinarFilters {
  category?: WebinarCategory;
  status?: WebinarStatus;
  isPremium?: boolean;
  hostId?: string;
  page?: number;
  limit?: number;
}

// Category labels
export const WEBINAR_CATEGORY_LABELS: Record<WebinarCategory, string> = {
  trading: 'Trading Strategies',
  investing: 'Long-term Investing',
  defi: 'DeFi & Yield',
  security: 'Security & Safety',
  tax: 'Tax & Compliance',
  fundamentals: 'Crypto Fundamentals',
  technical_analysis: 'Technical Analysis',
  market_outlook: 'Market Outlook'
};

export const WEBINAR_CATEGORY_COLORS: Record<WebinarCategory, string> = {
  trading: 'bg-orange-100 text-orange-700',
  investing: 'bg-green-100 text-green-700',
  defi: 'bg-purple-100 text-purple-700',
  security: 'bg-red-100 text-red-700',
  tax: 'bg-blue-100 text-blue-700',
  fundamentals: 'bg-yellow-100 text-yellow-700',
  technical_analysis: 'bg-pink-100 text-pink-700',
  market_outlook: 'bg-teal-100 text-teal-700'
};

// Demo hosts
const DEMO_HOSTS: WebinarHost[] = [
  {
    id: 'host-1',
    name: 'Dr. Emily Chen',
    title: 'Crypto Tax Specialist',
    company: 'CryptoTax Pro',
    bio: 'Former IRS agent with 15 years of experience. Now helps crypto investors navigate complex tax situations.',
    avatarUrl: '/hosts/emily-chen.jpg',
    expertise: ['Crypto Taxation', 'IRS Compliance', 'Tax Planning', 'DeFi Taxes'],
    webinarCount: 24,
    averageRating: 4.9
  },
  {
    id: 'host-2',
    name: 'Marcus Thompson',
    title: 'Professional Trader',
    company: 'Alpha Trading Academy',
    bio: '10+ years trading experience. Former institutional trader now educating retail investors.',
    avatarUrl: '/hosts/marcus-thompson.jpg',
    expertise: ['Day Trading', 'Technical Analysis', 'Risk Management', 'Options'],
    webinarCount: 45,
    averageRating: 4.8
  },
  {
    id: 'host-3',
    name: 'Rachel Kim',
    title: 'DeFi Researcher',
    company: 'DeFi Weekly',
    bio: 'Leading DeFi analyst. Covers yield strategies, protocol analysis, and DeFi security.',
    avatarUrl: '/hosts/rachel-kim.jpg',
    expertise: ['Yield Farming', 'Liquidity Mining', 'Protocol Analysis', 'DeFi Security'],
    webinarCount: 32,
    averageRating: 4.7
  }
];

const DEMO_WEBINARS: Webinar[] = [
  {
    id: 'webinar-1',
    title: 'Crypto Tax Masterclass: What You Need to Know for 2025',
    slug: 'crypto-tax-masterclass-2025',
    description: 'Comprehensive guide to cryptocurrency taxation including DeFi transactions, airdrops, staking rewards, and international considerations.',
    category: 'tax',
    hostId: 'host-1',
    host: DEMO_HOSTS[0],
    scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 90,
    status: 'upcoming',
    isPremium: true,
    price: 49,
    maxAttendees: 100,
    attendeeCount: 67,
    learningOutcomes: [
      'Understand how different crypto transactions are taxed',
      'Learn to track and report DeFi activities',
      'Discover legal tax optimization strategies',
      'Navigate international tax implications'
    ],
    prerequisites: ['Basic understanding of cryptocurrency', 'US tax residency (international welcome but focus is US)'],
    materials: [
      { id: 'mat-1', type: 'slides', title: 'Presentation Slides', url: '/materials/tax-slides.pdf', isPremium: false },
      { id: 'mat-2', type: 'worksheet', title: 'Tax Calculation Worksheet', url: '/materials/tax-worksheet.xlsx', isPremium: true },
      { id: 'mat-3', type: 'checklist', title: 'Tax Filing Checklist', url: '/materials/tax-checklist.pdf', isPremium: true }
    ],
    createdAt: '2024-12-15T10:00:00Z',
    updatedAt: '2024-12-20T14:00:00Z'
  },
  {
    id: 'webinar-2',
    title: 'Technical Analysis: Reading Charts Like a Pro',
    slug: 'technical-analysis-reading-charts',
    description: 'Learn professional chart reading techniques including candlestick patterns, support/resistance, and indicator interpretation.',
    category: 'technical_analysis',
    hostId: 'host-2',
    host: DEMO_HOSTS[1],
    scheduledAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 120,
    status: 'upcoming',
    isPremium: false,
    maxAttendees: 500,
    attendeeCount: 342,
    learningOutcomes: [
      'Read and interpret candlestick patterns',
      'Identify support and resistance levels',
      'Use RSI, MACD, and Bollinger Bands effectively',
      'Develop a systematic trading approach'
    ],
    materials: [
      { id: 'mat-4', type: 'slides', title: 'Chart Reading Guide', url: '/materials/ta-slides.pdf', isPremium: false },
      { id: 'mat-5', type: 'template', title: 'Trading Journal Template', url: '/materials/trading-journal.xlsx', isPremium: false }
    ],
    createdAt: '2024-12-10T10:00:00Z',
    updatedAt: '2024-12-18T14:00:00Z'
  },
  {
    id: 'webinar-3',
    title: 'DeFi Yield Strategies: Maximizing Returns Safely',
    slug: 'defi-yield-strategies-2025',
    description: 'Explore sustainable yield generation in DeFi. Learn about risks, impermanent loss, and how to evaluate protocols.',
    category: 'defi',
    hostId: 'host-3',
    host: DEMO_HOSTS[2],
    scheduledAt: '2024-12-15T18:00:00Z',
    duration: 75,
    status: 'ended',
    isPremium: true,
    price: 39,
    attendeeCount: 189,
    recordingUrl: '/recordings/defi-yield-webinar.mp4',
    learningOutcomes: [
      'Evaluate DeFi protocol risks',
      'Understand impermanent loss and when it matters',
      'Build a diversified yield portfolio',
      'Use tools to track and optimize yields'
    ],
    materials: [
      { id: 'mat-6', type: 'slides', title: 'DeFi Yield Slides', url: '/materials/defi-slides.pdf', isPremium: false },
      { id: 'mat-7', type: 'resource', title: 'Protocol Comparison Sheet', url: '/materials/protocol-comparison.pdf', isPremium: true }
    ],
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-15T20:00:00Z'
  },
  {
    id: 'webinar-4',
    title: '2025 Market Outlook: Where Is Crypto Headed?',
    slug: '2025-crypto-market-outlook',
    description: 'Our analysts share their predictions for 2025 including Bitcoin, Ethereum, altcoins, and emerging trends.',
    category: 'market_outlook',
    hostId: 'host-2',
    host: DEMO_HOSTS[1],
    scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 60,
    status: 'upcoming',
    isPremium: false,
    maxAttendees: 1000,
    attendeeCount: 723,
    learningOutcomes: [
      'Understand macro factors affecting crypto in 2025',
      'Identify promising sectors and narratives',
      'Learn positioning strategies for different scenarios',
      'Get specific asset allocation recommendations'
    ],
    materials: [
      { id: 'mat-8', type: 'slides', title: '2025 Outlook Report', url: '/materials/2025-outlook.pdf', isPremium: false }
    ],
    createdAt: '2024-12-18T10:00:00Z',
    updatedAt: '2024-12-21T14:00:00Z'
  }
];

// Get webinars
export async function getWebinars(filters: WebinarFilters = {}): Promise<{
  webinars: Webinar[];
  total: number;
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      let filtered = [...DEMO_WEBINARS];

      if (filters.category) {
        filtered = filtered.filter(w => w.category === filters.category);
      }
      if (filters.status) {
        filtered = filtered.filter(w => w.status === filters.status);
      }
      if (filters.isPremium !== undefined) {
        filtered = filtered.filter(w => w.isPremium === filters.isPremium);
      }

      filtered.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const start = (page - 1) * limit;

      return {
        webinars: filtered.slice(start, start + limit),
        total: filtered.length,
        error: null
      };
    }

    let query = supabase
      .from('webinars')
      .select('*, host:webinar_hosts(*)', { count: 'exact' })
      .neq('status', 'cancelled');

    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.isPremium !== undefined) {
      query = query.eq('is_premium', filters.isPremium);
    }

    query = query.order('scheduled_at', { ascending: true });

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    query = query.range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return { webinars: data || [], total: count || 0, error: null };
  } catch (err) {
    console.error('Error fetching webinars:', err);
    return { webinars: DEMO_WEBINARS, total: DEMO_WEBINARS.length, error: null };
  }
}

// Get single webinar
export async function getWebinar(idOrSlug: string): Promise<{
  webinar: Webinar | null;
  error: string | null;
}> {
  const demoWebinar = DEMO_WEBINARS.find(w => w.id === idOrSlug || w.slug === idOrSlug);

  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || demoWebinar) {
      return {
        webinar: demoWebinar || null,
        error: demoWebinar ? null : 'Webinar not found'
      };
    }

    const { data, error } = await supabase
      .from('webinars')
      .select('*, host:webinar_hosts(*)')
      .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
      .single();

    if (error) throw error;

    return { webinar: data, error: null };
  } catch (err) {
    console.error('Error fetching webinar:', err);
    return {
      webinar: demoWebinar || null,
      error: demoWebinar ? null : 'Webinar not found'
    };
  }
}

// Register for webinar
export async function registerForWebinar(userId: string, webinarId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: true, error: null };
    }

    const { error } = await supabase
      .from('webinar_registrations')
      .upsert({
        user_id: userId,
        webinar_id: webinarId,
        registered_at: new Date().toISOString()
      });

    if (error) throw error;

    await supabase.rpc('increment_webinar_attendees', { webinar_id: webinarId });

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error registering for webinar:', err);
    return { success: false, error: err.message };
  }
}

// Get user registrations
export async function getUserWebinarRegistrations(userId: string): Promise<{
  registrations: WebinarRegistration[];
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { registrations: [], error: null };
    }

    const { data, error } = await supabase
      .from('webinar_registrations')
      .select('*, webinar:webinars(*, host:webinar_hosts(*))')
      .eq('user_id', userId)
      .order('registered_at', { ascending: false });

    if (error) throw error;

    return { registrations: data || [], error: null };
  } catch (err) {
    return { registrations: [], error: null };
  }
}

// Get upcoming webinars for dashboard
export async function getUpcomingWebinars(limit: number = 3): Promise<Webinar[]> {
  return DEMO_WEBINARS
    .filter(w => w.status === 'upcoming')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, limit);
}

// Rate a webinar
export async function rateWebinar(
  userId: string,
  webinarId: string,
  rating: number,
  feedback?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: true, error: null };
    }

    const { error } = await supabase
      .from('webinar_ratings')
      .upsert({
        user_id: userId,
        webinar_id: webinarId,
        rating,
        feedback
      });

    if (error) throw error;

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
