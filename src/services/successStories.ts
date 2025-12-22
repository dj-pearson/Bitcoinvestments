// Success Stories Service
// User-submitted crypto investment journeys

import { supabase, db } from '../lib/supabase';

export type StoryCategory = 'first_investment' | 'portfolio_growth' | 'learning_journey' | 'trading_success' | 'defi_experience' | 'mistake_learned' | 'hodl_story' | 'retirement_planning';
export type StoryStatus = 'pending' | 'approved' | 'featured' | 'rejected';

export interface SuccessStory {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  authorLocation?: string;
  isAnonymous: boolean;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: StoryCategory;
  thumbnailUrl?: string;
  startDate: string;
  investmentAmount?: string; // Range like "$1k-$5k"
  returns?: string; // Range like "100-200%"
  timeframe?: string; // e.g., "2 years"
  keyLessons: string[];
  tags: string[];
  views: number;
  likes: number;
  commentsCount: number;
  isFeatured: boolean;
  status: StoryStatus;
  submittedAt: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoryComment {
  id: string;
  storyId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  likes: number;
  createdAt: string;
}

export interface StoryFilters {
  category?: StoryCategory;
  search?: string;
  featured?: boolean;
  sortBy?: 'newest' | 'popular' | 'most_liked';
  page?: number;
  limit?: number;
}

// Category labels and colors
export const STORY_CATEGORY_LABELS: Record<StoryCategory, string> = {
  first_investment: 'First Investment',
  portfolio_growth: 'Portfolio Growth',
  learning_journey: 'Learning Journey',
  trading_success: 'Trading Success',
  defi_experience: 'DeFi Experience',
  mistake_learned: 'Mistake Learned',
  hodl_story: 'HODL Story',
  retirement_planning: 'Retirement Planning'
};

export const STORY_CATEGORY_COLORS: Record<StoryCategory, string> = {
  first_investment: 'bg-green-100 text-green-700',
  portfolio_growth: 'bg-blue-100 text-blue-700',
  learning_journey: 'bg-purple-100 text-purple-700',
  trading_success: 'bg-orange-100 text-orange-700',
  defi_experience: 'bg-pink-100 text-pink-700',
  mistake_learned: 'bg-red-100 text-red-700',
  hodl_story: 'bg-yellow-100 text-yellow-700',
  retirement_planning: 'bg-teal-100 text-teal-700'
};

// Demo stories
const DEMO_STORIES: SuccessStory[] = [
  {
    id: 'story-1',
    userId: 'user-1',
    authorName: 'Michael T.',
    authorLocation: 'California, USA',
    isAnonymous: false,
    title: 'From Skeptic to HODLer: My 5-Year Bitcoin Journey',
    slug: 'from-skeptic-to-hodler-5-year-bitcoin-journey',
    summary: 'I went from thinking Bitcoin was a scam to building a significant portion of my retirement portfolio in crypto. Here\'s what I learned along the way.',
    content: `
## The Beginning: Skepticism and Doubt

In 2019, I was a complete crypto skeptic. I worked in traditional finance and thought Bitcoin was either a bubble waiting to pop or outright fraud. My colleagues would occasionally mention crypto, and I'd roll my eyes.

Then one day, a friend sat me down and explained the fundamentals of Bitcoin - the fixed supply, the decentralization, the mathematical elegance. Something clicked.

## Taking the First Step

I started small. Really small. I put $500 into Bitcoin when it was around $8,000. I was terrified I'd lose it all. For weeks, I checked the price obsessively - every hour, sometimes every few minutes.

Then the 2020 crash happened. Bitcoin dropped to $5,000 and I panicked. I almost sold. But something made me hold on.

## The Learning Curve

Instead of selling, I started learning. I read the Bitcoin whitepaper. I watched hours of educational content. I joined online communities. The more I learned, the more confident I became.

I started dollar-cost averaging - putting in a fixed amount every week regardless of price. This removed the emotional decision-making that had been so stressful.

## Growth and Discipline

By late 2020, Bitcoin had recovered and was making new highs. My initial $500 had grown significantly. More importantly, I had developed a disciplined approach:

- Never invest more than I could afford to lose
- Don't check the price constantly
- Focus on the long-term fundamentals
- Keep learning and stay humble

## Where I Am Today

Five years later, crypto represents about 20% of my overall investment portfolio. I've weathered multiple 50%+ drops without panic selling. I've learned about Ethereum, DeFi, and Layer 2 solutions.

More valuable than the financial returns is the knowledge I've gained. Understanding crypto has made me a better investor overall and given me insight into the future of finance.

## Key Advice for Newcomers

1. **Start small** - You don't need to go all-in. Even small amounts add up over time.
2. **Learn constantly** - The space moves fast. Never stop educating yourself.
3. **Think long-term** - Short-term price movements are noise. Focus on the bigger picture.
4. **Stay humble** - The market will humble everyone eventually.
5. **Secure your assets** - Learn proper security practices early.

The journey hasn't always been smooth, but looking back, taking that first step was one of the best financial decisions I've ever made.
    `,
    category: 'hodl_story',
    startDate: '2019-06-15',
    investmentAmount: '$500 initial',
    returns: 'Life-changing',
    timeframe: '5 years',
    keyLessons: [
      'Start small and learn as you go',
      'Dollar-cost averaging removes emotional decisions',
      'Long-term thinking beats short-term trading',
      'Education is more valuable than any single trade'
    ],
    tags: ['bitcoin', 'hodl', 'dca', 'long-term', 'beginner'],
    views: 12453,
    likes: 892,
    commentsCount: 156,
    isFeatured: true,
    status: 'featured',
    submittedAt: '2024-10-15T10:00:00Z',
    publishedAt: '2024-10-18T08:00:00Z',
    createdAt: '2024-10-15T10:00:00Z',
    updatedAt: '2024-10-18T08:00:00Z'
  },
  {
    id: 'story-2',
    userId: 'user-2',
    authorName: 'Sarah K.',
    authorLocation: 'London, UK',
    isAnonymous: false,
    title: 'How I Learned DeFi and Earned My First Yield',
    slug: 'how-i-learned-defi-earned-first-yield',
    summary: 'My journey from traditional savings accounts earning 0.5% to understanding and using DeFi protocols for yield generation.',
    content: `## Discovering DeFi...`,
    category: 'defi_experience',
    startDate: '2021-03-01',
    investmentAmount: '$10k-$50k',
    returns: '15-25% APY',
    timeframe: '2 years',
    keyLessons: [
      'Start with well-audited protocols',
      'Understand impermanent loss before LPing',
      'Diversify across multiple protocols',
      'Always keep gas costs in mind'
    ],
    tags: ['defi', 'yield-farming', 'ethereum', 'aave', 'uniswap'],
    views: 8234,
    likes: 567,
    commentsCount: 89,
    isFeatured: true,
    status: 'featured',
    submittedAt: '2024-11-01T14:00:00Z',
    publishedAt: '2024-11-05T08:00:00Z',
    createdAt: '2024-11-01T14:00:00Z',
    updatedAt: '2024-11-05T08:00:00Z'
  },
  {
    id: 'story-3',
    userId: 'user-3',
    authorName: 'Anonymous',
    isAnonymous: true,
    title: 'The Expensive Mistake That Made Me a Better Investor',
    slug: 'expensive-mistake-made-me-better-investor',
    summary: 'I lost $15,000 chasing a memecoin pump. Here\'s what that painful lesson taught me about risk management.',
    content: `## The FOMO Trap...`,
    category: 'mistake_learned',
    startDate: '2021-05-01',
    investmentAmount: '$15k lost',
    timeframe: '1 week',
    keyLessons: [
      'FOMO is your worst enemy',
      'If it sounds too good to be true, it is',
      'Never invest money you can\'t afford to lose',
      'Research before you invest, not after'
    ],
    tags: ['lessons', 'risk-management', 'fomo', 'altcoins'],
    views: 15678,
    likes: 1234,
    commentsCount: 245,
    isFeatured: false,
    status: 'approved',
    submittedAt: '2024-09-20T09:00:00Z',
    publishedAt: '2024-09-25T08:00:00Z',
    createdAt: '2024-09-20T09:00:00Z',
    updatedAt: '2024-09-25T08:00:00Z'
  },
  {
    id: 'story-4',
    userId: 'user-4',
    authorName: 'David R.',
    authorLocation: 'Toronto, Canada',
    isAnonymous: false,
    title: 'From Zero to Confident: My Crypto Learning Journey',
    slug: 'zero-to-confident-crypto-learning-journey',
    summary: 'How I went from not understanding blockchain to completing courses, earning certificates, and confidently managing my own portfolio.',
    content: `## Starting From Scratch...`,
    category: 'learning_journey',
    startDate: '2023-01-15',
    timeframe: '1 year',
    keyLessons: [
      'Structured courses are worth the investment',
      'Practice with small amounts first',
      'Join communities to learn faster',
      'Document your learning journey'
    ],
    tags: ['education', 'beginner', 'courses', 'learning'],
    views: 6543,
    likes: 432,
    commentsCount: 67,
    isFeatured: false,
    status: 'approved',
    submittedAt: '2024-12-01T11:00:00Z',
    publishedAt: '2024-12-05T08:00:00Z',
    createdAt: '2024-12-01T11:00:00Z',
    updatedAt: '2024-12-05T08:00:00Z'
  }
];

// Get stories with filters
export async function getStories(filters: StoryFilters = {}): Promise<{
  stories: SuccessStory[];
  total: number;
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      let filtered = [...DEMO_STORIES];

      if (filters.category) {
        filtered = filtered.filter(s => s.category === filters.category);
      }
      if (filters.featured) {
        filtered = filtered.filter(s => s.isFeatured);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(s =>
          s.title.toLowerCase().includes(search) ||
          s.summary.toLowerCase().includes(search) ||
          s.tags.some(t => t.includes(search))
        );
      }

      switch (filters.sortBy) {
        case 'popular':
          filtered.sort((a, b) => b.views - a.views);
          break;
        case 'most_liked':
          filtered.sort((a, b) => b.likes - a.likes);
          break;
        case 'newest':
        default:
          filtered.sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
      }

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const start = (page - 1) * limit;

      return {
        stories: filtered.slice(start, start + limit),
        total: filtered.length,
        error: null
      };
    }

    let query = supabase
      .from('success_stories')
      .select('*', { count: 'exact' })
      .in('status', ['approved', 'featured']);

    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.featured) {
      query = query.eq('is_featured', true);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`);
    }

    switch (filters.sortBy) {
      case 'popular':
        query = query.order('views', { ascending: false });
        break;
      case 'most_liked':
        query = query.order('likes', { ascending: false });
        break;
      default:
        query = query.order('published_at', { ascending: false });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    query = query.range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return { stories: data || [], total: count || 0, error: null };
  } catch (err) {
    console.error('Error fetching stories:', err);
    return { stories: DEMO_STORIES, total: DEMO_STORIES.length, error: null };
  }
}

// Get single story
export async function getStory(idOrSlug: string): Promise<{
  story: SuccessStory | null;
  error: string | null;
}> {
  const demoStory = DEMO_STORIES.find(s => s.id === idOrSlug || s.slug === idOrSlug);

  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || demoStory) {
      return { story: demoStory || null, error: demoStory ? null : 'Story not found' };
    }

    const { data, error } = await supabase
      .from('success_stories')
      .select('*')
      .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
      .single();

    if (error) throw error;

    // Increment view count
    await supabase.rpc('increment_story_views', { story_id: data.id });

    return { story: data, error: null };
  } catch (err) {
    console.error('Error fetching story:', err);
    return { story: demoStory || null, error: demoStory ? null : 'Story not found' };
  }
}

// Submit a story
export async function submitStory(
  userId: string,
  story: {
    title: string;
    summary: string;
    content: string;
    category: StoryCategory;
    isAnonymous: boolean;
    authorName?: string;
    authorLocation?: string;
    startDate: string;
    investmentAmount?: string;
    returns?: string;
    timeframe?: string;
    keyLessons: string[];
    tags: string[];
  }
): Promise<{ story: SuccessStory | null; error: string | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const newStory: SuccessStory = {
        id: `story-${Date.now()}`,
        userId,
        authorName: story.isAnonymous ? 'Anonymous' : (story.authorName || 'User'),
        authorLocation: story.isAnonymous ? undefined : story.authorLocation,
        isAnonymous: story.isAnonymous,
        title: story.title,
        slug: story.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        summary: story.summary,
        content: story.content,
        category: story.category,
        startDate: story.startDate,
        investmentAmount: story.investmentAmount,
        returns: story.returns,
        timeframe: story.timeframe,
        keyLessons: story.keyLessons,
        tags: story.tags,
        views: 0,
        likes: 0,
        commentsCount: 0,
        isFeatured: false,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return { story: newStory, error: null };
    }

    const slug = story.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

    const { data, error } = await supabase
      .from('success_stories')
      .insert({
        user_id: userId,
        author_name: story.isAnonymous ? 'Anonymous' : story.authorName,
        author_location: story.isAnonymous ? null : story.authorLocation,
        is_anonymous: story.isAnonymous,
        title: story.title,
        slug,
        summary: story.summary,
        content: story.content,
        category: story.category,
        start_date: story.startDate,
        investment_amount: story.investmentAmount,
        returns: story.returns,
        timeframe: story.timeframe,
        key_lessons: story.keyLessons,
        tags: story.tags,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return { story: data, error: null };
  } catch (err: any) {
    console.error('Error submitting story:', err);
    return { story: null, error: err.message || 'Failed to submit story' };
  }
}

// Like a story
export async function likeStory(userId: string, storyId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: true, error: null };
    }

    await db.from('story_likes').upsert({ user_id: userId, story_id: storyId });
    await supabase.rpc('update_story_likes', { story_id: storyId });

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Get story comments
export async function getStoryComments(storyId: string): Promise<{
  comments: StoryComment[];
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { comments: [], error: null };
    }

    const { data, error } = await supabase
      .from('story_comments')
      .select('*')
      .eq('story_id', storyId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { comments: data || [], error: null };
  } catch (err) {
    return { comments: [], error: null };
  }
}

// Add comment to story
export async function addStoryComment(
  userId: string,
  storyId: string,
  content: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: true, error: null };
    }

    const { error } = await supabase
      .from('story_comments')
      .insert({ user_id: userId, story_id: storyId, content });

    if (error) throw error;

    await supabase.rpc('increment_story_comments', { story_id: storyId });

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Get featured stories for homepage
export async function getFeaturedStories(): Promise<SuccessStory[]> {
  return DEMO_STORIES.filter(s => s.isFeatured);
}
