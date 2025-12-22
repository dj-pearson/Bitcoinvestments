// Interactive Courses Service
// Structured learning paths with lessons, quizzes, and progress tracking

import { supabase, db } from '../lib/supabase';

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type CourseCategory = 'bitcoin' | 'ethereum' | 'defi' | 'trading' | 'security' | 'investing' | 'technical_analysis' | 'fundamentals';
export type LessonType = 'video' | 'article' | 'quiz' | 'interactive' | 'assignment';
export type ContentBlockType = 'text' | 'image' | 'video' | 'code' | 'quiz' | 'callout' | 'divider';

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: CourseCategory;
  level: CourseLevel;
  thumbnailUrl: string;
  instructorId: string;
  instructor?: Instructor;
  isPremium: boolean;
  price?: number;
  estimatedHours: number;
  totalLessons: number;
  totalQuizzes: number;
  enrollmentCount: number;
  averageRating: number;
  ratingCount: number;
  prerequisites: string[];
  learningOutcomes: string[];
  tags: string[];
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Instructor {
  id: string;
  name: string;
  bio: string;
  avatarUrl: string;
  title: string;
  expertise: string[];
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  orderIndex: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  type: LessonType;
  orderIndex: number;
  durationMinutes: number;
  content: ContentBlock[];
  videoUrl?: string;
  isFree: boolean;
  isPublished: boolean;
}

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  content: string;
  metadata?: {
    language?: string; // for code blocks
    imageAlt?: string;
    calloutType?: 'info' | 'warning' | 'tip' | 'danger';
    quizId?: string;
  };
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  passingScore: number;
  timeLimit?: number;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank';
  options: string[];
  correctAnswer: number | number[] | string;
  explanation: string;
  points: number;
}

export interface UserEnrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  completedAt?: string;
  progress: number;
  currentLessonId?: string;
  lastAccessedAt: string;
}

export interface LessonProgress {
  id: string;
  enrollmentId: string;
  lessonId: string;
  isCompleted: boolean;
  completedAt?: string;
  timeSpentSeconds: number;
  notes?: string;
}

export interface QuizAttempt {
  id: string;
  enrollmentId: string;
  quizId: string;
  score: number;
  passed: boolean;
  answers: Record<string, any>;
  startedAt: string;
  completedAt?: string;
  timeSpentSeconds: number;
}

export interface CourseFilters {
  category?: CourseCategory;
  level?: CourseLevel;
  isPremium?: boolean;
  search?: string;
  sortBy?: 'popular' | 'newest' | 'rating' | 'title';
  page?: number;
  limit?: number;
}

// Demo data for development
const DEMO_INSTRUCTORS: Instructor[] = [
  {
    id: 'inst-1',
    name: 'Alex Chen',
    bio: 'Former blockchain developer at Coinbase with 8 years of experience in cryptocurrency education.',
    avatarUrl: '/instructors/alex-chen.jpg',
    title: 'Blockchain Expert',
    expertise: ['Bitcoin', 'Ethereum', 'Smart Contracts'],
    socialLinks: { twitter: '@alexchen_crypto' }
  },
  {
    id: 'inst-2',
    name: 'Sarah Williams',
    bio: 'Professional trader with 10+ years experience. Specializes in technical analysis and risk management.',
    avatarUrl: '/instructors/sarah-williams.jpg',
    title: 'Trading Specialist',
    expertise: ['Technical Analysis', 'Trading', 'Risk Management'],
    socialLinks: { twitter: '@sarahwtrades' }
  }
];

const DEMO_COURSES: Course[] = [
  {
    id: 'course-1',
    title: 'Bitcoin Fundamentals',
    slug: 'bitcoin-fundamentals',
    description: 'Master the basics of Bitcoin, from understanding blockchain technology to making your first purchase. This comprehensive course covers everything you need to know to start your Bitcoin journey with confidence.',
    shortDescription: 'Learn everything about Bitcoin from scratch',
    category: 'bitcoin',
    level: 'beginner',
    thumbnailUrl: '/courses/bitcoin-fundamentals.jpg',
    instructorId: 'inst-1',
    instructor: DEMO_INSTRUCTORS[0],
    isPremium: false,
    estimatedHours: 4,
    totalLessons: 12,
    totalQuizzes: 4,
    enrollmentCount: 15420,
    averageRating: 4.8,
    ratingCount: 2341,
    prerequisites: [],
    learningOutcomes: [
      'Understand how Bitcoin and blockchain work',
      'Set up and secure a Bitcoin wallet',
      'Buy, send, and receive Bitcoin safely',
      'Recognize and avoid common scams'
    ],
    tags: ['bitcoin', 'beginner', 'blockchain', 'wallet'],
    isPublished: true,
    publishedAt: '2024-01-15',
    createdAt: '2024-01-10',
    updatedAt: '2024-12-01'
  },
  {
    id: 'course-2',
    title: 'Technical Analysis Masterclass',
    slug: 'technical-analysis-masterclass',
    description: 'Learn to read charts, identify patterns, and make informed trading decisions using technical analysis. From candlestick basics to advanced indicators.',
    shortDescription: 'Professional chart reading and trading strategies',
    category: 'technical_analysis',
    level: 'intermediate',
    thumbnailUrl: '/courses/ta-masterclass.jpg',
    instructorId: 'inst-2',
    instructor: DEMO_INSTRUCTORS[1],
    isPremium: true,
    price: 49.99,
    estimatedHours: 8,
    totalLessons: 24,
    totalQuizzes: 8,
    enrollmentCount: 8932,
    averageRating: 4.9,
    ratingCount: 1256,
    prerequisites: ['Basic understanding of cryptocurrency markets'],
    learningOutcomes: [
      'Read and interpret candlestick charts',
      'Identify key support and resistance levels',
      'Use RSI, MACD, and Bollinger Bands effectively',
      'Develop your own trading strategy'
    ],
    tags: ['trading', 'technical-analysis', 'charts', 'indicators'],
    isPublished: true,
    publishedAt: '2024-02-20',
    createdAt: '2024-02-01',
    updatedAt: '2024-11-15'
  },
  {
    id: 'course-3',
    title: 'DeFi Deep Dive',
    slug: 'defi-deep-dive',
    description: 'Explore the world of decentralized finance. Learn about lending, borrowing, yield farming, and how to navigate the DeFi ecosystem safely.',
    shortDescription: 'Master decentralized finance protocols',
    category: 'defi',
    level: 'advanced',
    thumbnailUrl: '/courses/defi-deep-dive.jpg',
    instructorId: 'inst-1',
    instructor: DEMO_INSTRUCTORS[0],
    isPremium: true,
    price: 79.99,
    estimatedHours: 10,
    totalLessons: 30,
    totalQuizzes: 10,
    enrollmentCount: 5621,
    averageRating: 4.7,
    ratingCount: 892,
    prerequisites: ['Understanding of Ethereum', 'Basic wallet usage'],
    learningOutcomes: [
      'Understand DeFi protocols and smart contracts',
      'Use lending platforms like Aave and Compound',
      'Provide liquidity and understand impermanent loss',
      'Evaluate DeFi risks and security'
    ],
    tags: ['defi', 'ethereum', 'yield-farming', 'lending'],
    isPublished: true,
    publishedAt: '2024-03-10',
    createdAt: '2024-03-01',
    updatedAt: '2024-10-20'
  },
  {
    id: 'course-4',
    title: 'Crypto Security Essentials',
    slug: 'crypto-security-essentials',
    description: 'Protect your cryptocurrency investments with industry-best security practices. From hardware wallets to operational security.',
    shortDescription: 'Keep your crypto safe from hackers',
    category: 'security',
    level: 'beginner',
    thumbnailUrl: '/courses/security-essentials.jpg',
    instructorId: 'inst-1',
    instructor: DEMO_INSTRUCTORS[0],
    isPremium: false,
    estimatedHours: 3,
    totalLessons: 10,
    totalQuizzes: 3,
    enrollmentCount: 12890,
    averageRating: 4.9,
    ratingCount: 1890,
    prerequisites: [],
    learningOutcomes: [
      'Set up and use hardware wallets',
      'Create secure backup strategies',
      'Identify phishing and scam attempts',
      'Implement operational security practices'
    ],
    tags: ['security', 'wallets', 'safety', 'beginner'],
    isPublished: true,
    publishedAt: '2024-04-01',
    createdAt: '2024-03-20',
    updatedAt: '2024-12-10'
  },
  {
    id: 'course-5',
    title: 'Ethereum & Smart Contracts',
    slug: 'ethereum-smart-contracts',
    description: 'Understand Ethereum, EVM, and smart contracts. Learn how dApps work and how to interact with them safely.',
    shortDescription: 'From ETH basics to smart contract interaction',
    category: 'ethereum',
    level: 'intermediate',
    thumbnailUrl: '/courses/ethereum-basics.jpg',
    instructorId: 'inst-1',
    instructor: DEMO_INSTRUCTORS[0],
    isPremium: true,
    price: 39.99,
    estimatedHours: 6,
    totalLessons: 18,
    totalQuizzes: 6,
    enrollmentCount: 7234,
    averageRating: 4.6,
    ratingCount: 1045,
    prerequisites: ['Bitcoin Fundamentals or equivalent knowledge'],
    learningOutcomes: [
      'Understand Ethereum and the EVM',
      'Interact with smart contracts safely',
      'Use MetaMask and other Web3 wallets',
      'Navigate the Ethereum ecosystem'
    ],
    tags: ['ethereum', 'smart-contracts', 'web3', 'dapps'],
    isPublished: true,
    publishedAt: '2024-05-15',
    createdAt: '2024-05-01',
    updatedAt: '2024-11-01'
  }
];

const DEMO_MODULES: Record<string, Module[]> = {
  'course-1': [
    {
      id: 'mod-1-1',
      courseId: 'course-1',
      title: 'Introduction to Bitcoin',
      description: 'Understanding what Bitcoin is and why it matters',
      orderIndex: 0,
      lessons: [
        {
          id: 'les-1-1-1',
          moduleId: 'mod-1-1',
          title: 'What is Bitcoin?',
          description: 'An introduction to Bitcoin and its history',
          type: 'video',
          orderIndex: 0,
          durationMinutes: 15,
          content: [],
          videoUrl: 'https://www.youtube.com/embed/example1',
          isFree: true,
          isPublished: true
        },
        {
          id: 'les-1-1-2',
          moduleId: 'mod-1-1',
          title: 'How Blockchain Works',
          description: 'Understanding the technology behind Bitcoin',
          type: 'article',
          orderIndex: 1,
          durationMinutes: 20,
          content: [
            { id: 'cb-1', type: 'text', content: '# How Blockchain Works\n\nBlockchain is a distributed ledger technology...' }
          ],
          isFree: true,
          isPublished: true
        },
        {
          id: 'les-1-1-3',
          moduleId: 'mod-1-1',
          title: 'Module 1 Quiz',
          description: 'Test your understanding of Bitcoin basics',
          type: 'quiz',
          orderIndex: 2,
          durationMinutes: 10,
          content: [],
          isFree: true,
          isPublished: true
        }
      ]
    },
    {
      id: 'mod-1-2',
      courseId: 'course-1',
      title: 'Getting Started with Bitcoin',
      description: 'Setting up your first wallet and making transactions',
      orderIndex: 1,
      lessons: [
        {
          id: 'les-1-2-1',
          moduleId: 'mod-1-2',
          title: 'Choosing a Bitcoin Wallet',
          description: 'Comparing different wallet types',
          type: 'video',
          orderIndex: 0,
          durationMinutes: 20,
          content: [],
          videoUrl: 'https://www.youtube.com/embed/example2',
          isFree: false,
          isPublished: true
        },
        {
          id: 'les-1-2-2',
          moduleId: 'mod-1-2',
          title: 'Your First Bitcoin Purchase',
          description: 'Step-by-step guide to buying Bitcoin',
          type: 'interactive',
          orderIndex: 1,
          durationMinutes: 25,
          content: [],
          isFree: false,
          isPublished: true
        }
      ]
    }
  ]
};

const DEMO_ENROLLMENTS: UserEnrollment[] = [
  {
    id: 'enr-1',
    userId: 'demo-user',
    courseId: 'course-1',
    enrolledAt: '2024-11-01',
    progress: 45,
    currentLessonId: 'les-1-2-1',
    lastAccessedAt: '2024-12-20'
  },
  {
    id: 'enr-2',
    userId: 'demo-user',
    courseId: 'course-4',
    enrolledAt: '2024-10-15',
    completedAt: '2024-11-10',
    progress: 100,
    lastAccessedAt: '2024-11-10'
  }
];

// Get all courses with filters
export async function getCourses(filters: CourseFilters = {}): Promise<{
  courses: Course[];
  total: number;
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Return demo courses for non-authenticated users
      let filtered = [...DEMO_COURSES];

      if (filters.category) {
        filtered = filtered.filter(c => c.category === filters.category);
      }
      if (filters.level) {
        filtered = filtered.filter(c => c.level === filters.level);
      }
      if (filters.isPremium !== undefined) {
        filtered = filtered.filter(c => c.isPremium === filters.isPremium);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(c =>
          c.title.toLowerCase().includes(search) ||
          c.description.toLowerCase().includes(search) ||
          c.tags.some(t => t.includes(search))
        );
      }

      // Sort
      switch (filters.sortBy) {
        case 'popular':
          filtered.sort((a, b) => b.enrollmentCount - a.enrollmentCount);
          break;
        case 'newest':
          filtered.sort((a, b) => new Date(b.publishedAt || '').getTime() - new Date(a.publishedAt || '').getTime());
          break;
        case 'rating':
          filtered.sort((a, b) => b.averageRating - a.averageRating);
          break;
        case 'title':
          filtered.sort((a, b) => a.title.localeCompare(b.title));
          break;
      }

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const start = (page - 1) * limit;

      return {
        courses: filtered.slice(start, start + limit),
        total: filtered.length,
        error: null
      };
    }

    let query = supabase
      .from('courses')
      .select('*, instructor:instructors(*)', { count: 'exact' })
      .eq('is_published', true);

    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.level) {
      query = query.eq('level', filters.level);
    }
    if (filters.isPremium !== undefined) {
      query = query.eq('is_premium', filters.isPremium);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Sorting
    switch (filters.sortBy) {
      case 'popular':
        query = query.order('enrollment_count', { ascending: false });
        break;
      case 'newest':
        query = query.order('published_at', { ascending: false });
        break;
      case 'rating':
        query = query.order('average_rating', { ascending: false });
        break;
      case 'title':
        query = query.order('title');
        break;
      default:
        query = query.order('enrollment_count', { ascending: false });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    query = query.range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      courses: data || [],
      total: count || 0,
      error: null
    };
  } catch (err) {
    console.error('Error fetching courses:', err);
    return { courses: DEMO_COURSES, total: DEMO_COURSES.length, error: null };
  }
}

// Get single course with modules and lessons
export async function getCourse(courseIdOrSlug: string): Promise<{
  course: Course | null;
  modules: Module[];
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    // Check demo courses first
    const demoCourse = DEMO_COURSES.find(c => c.id === courseIdOrSlug || c.slug === courseIdOrSlug);

    if (!session || demoCourse) {
      if (demoCourse) {
        return {
          course: demoCourse,
          modules: DEMO_MODULES[demoCourse.id] || [],
          error: null
        };
      }
      return { course: null, modules: [], error: 'Course not found' };
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*, instructor:instructors(*)')
      .or(`id.eq.${courseIdOrSlug},slug.eq.${courseIdOrSlug}`)
      .single();

    if (courseError) throw courseError;

    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select('*, lessons:course_lessons(*)')
      .eq('course_id', course.id)
      .order('order_index');

    if (modulesError) throw modulesError;

    return {
      course,
      modules: modules || [],
      error: null
    };
  } catch (err) {
    console.error('Error fetching course:', err);
    const demoCourse = DEMO_COURSES.find(c => c.id === courseIdOrSlug || c.slug === courseIdOrSlug);
    return {
      course: demoCourse || null,
      modules: demoCourse ? DEMO_MODULES[demoCourse.id] || [] : [],
      error: demoCourse ? null : 'Course not found'
    };
  }
}

// Enroll in a course
export async function enrollInCourse(userId: string, courseId: string): Promise<{
  enrollment: UserEnrollment | null;
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Demo enrollment
      const newEnrollment: UserEnrollment = {
        id: `enr-${Date.now()}`,
        userId,
        courseId,
        enrolledAt: new Date().toISOString(),
        progress: 0,
        lastAccessedAt: new Date().toISOString()
      };
      return { enrollment: newEnrollment, error: null };
    }

    const { data, error } = await supabase
      .from('course_enrollments')
      .insert({
        user_id: userId,
        course_id: courseId,
        progress: 0
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { enrollment: null, error: 'Already enrolled in this course' };
      }
      throw error;
    }

    // Increment enrollment count
    await db.rpc('increment_enrollment_count', { course_id: courseId });

    return { enrollment: data, error: null };
  } catch (err: any) {
    console.error('Error enrolling in course:', err);
    return { enrollment: null, error: err.message || 'Failed to enroll' };
  }
}

// Get user enrollments
export async function getUserEnrollments(userId: string): Promise<{
  enrollments: (UserEnrollment & { course: Course })[];
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Return demo enrollments
      const enriched = DEMO_ENROLLMENTS.map(e => ({
        ...e,
        course: DEMO_COURSES.find(c => c.id === e.courseId)!
      }));
      return { enrollments: enriched, error: null };
    }

    const { data, error } = await supabase
      .from('course_enrollments')
      .select('*, course:courses(*, instructor:instructors(*))')
      .eq('user_id', userId)
      .order('last_accessed_at', { ascending: false });

    if (error) throw error;

    return { enrollments: data || [], error: null };
  } catch (err) {
    console.error('Error fetching enrollments:', err);
    const enriched = DEMO_ENROLLMENTS.map(e => ({
      ...e,
      course: DEMO_COURSES.find(c => c.id === e.courseId)!
    }));
    return { enrollments: enriched, error: null };
  }
}

// Mark lesson as complete
export async function completeLesson(
  enrollmentId: string,
  lessonId: string,
  timeSpentSeconds: number
): Promise<{ success: boolean; newProgress: number; error: string | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Demo: just return success
      return { success: true, newProgress: 50, error: null };
    }

    // Upsert lesson progress
    const { error: progressError } = await supabase
      .from('lesson_progress')
      .upsert({
        enrollment_id: enrollmentId,
        lesson_id: lessonId,
        is_completed: true,
        completed_at: new Date().toISOString(),
        time_spent_seconds: timeSpentSeconds
      });

    if (progressError) throw progressError;

    // Calculate new course progress
    const { data: enrollment } = await supabase
      .from('course_enrollments')
      .select('course_id')
      .eq('id', enrollmentId)
      .single();

    if (!enrollment) throw new Error('Enrollment not found');

    // Count completed lessons vs total lessons
    const { count: completedCount } = await supabase
      .from('lesson_progress')
      .select('*', { count: 'exact' })
      .eq('enrollment_id', enrollmentId)
      .eq('is_completed', true);

    const { count: totalCount } = await supabase
      .from('course_lessons')
      .select('*', { count: 'exact' })
      .eq('course_id', enrollment.course_id);

    const newProgress = Math.round((completedCount || 0) / (totalCount || 1) * 100);

    // Update enrollment progress
    const { error: updateError } = await supabase
      .from('course_enrollments')
      .update({
        progress: newProgress,
        last_accessed_at: new Date().toISOString(),
        ...(newProgress === 100 ? { completed_at: new Date().toISOString() } : {})
      })
      .eq('id', enrollmentId);

    if (updateError) throw updateError;

    return { success: true, newProgress, error: null };
  } catch (err: any) {
    console.error('Error completing lesson:', err);
    return { success: false, newProgress: 0, error: err.message || 'Failed to mark lesson complete' };
  }
}

// Submit quiz attempt
export async function submitQuizAttempt(
  enrollmentId: string,
  quizId: string,
  answers: Record<string, any>,
  timeSpentSeconds: number
): Promise<{
  attempt: QuizAttempt | null;
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Demo quiz result
      const score = Math.floor(Math.random() * 40) + 60; // 60-100
      const attempt: QuizAttempt = {
        id: `attempt-${Date.now()}`,
        enrollmentId,
        quizId,
        score,
        passed: score >= 70,
        answers,
        startedAt: new Date(Date.now() - timeSpentSeconds * 1000).toISOString(),
        completedAt: new Date().toISOString(),
        timeSpentSeconds
      };
      return { attempt, error: null };
    }

    // Get quiz to calculate score
    const { data: quiz, error: quizError } = await supabase
      .from('course_quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (quizError) throw quizError;

    // Calculate score
    let correctAnswers = 0;
    const questions = quiz.questions as QuizQuestion[];

    for (const question of questions) {
      const userAnswer = answers[question.id];
      if (JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer)) {
        correctAnswers++;
      }
    }

    const score = Math.round((correctAnswers / questions.length) * 100);
    const passed = score >= quiz.passing_score;

    const { data: attempt, error } = await supabase
      .from('quiz_attempts')
      .insert({
        enrollment_id: enrollmentId,
        quiz_id: quizId,
        score,
        passed,
        answers,
        time_spent_seconds: timeSpentSeconds,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return { attempt, error: null };
  } catch (err: any) {
    console.error('Error submitting quiz:', err);
    return { attempt: null, error: err.message || 'Failed to submit quiz' };
  }
}

// Get course progress details
export async function getCourseProgress(enrollmentId: string): Promise<{
  lessonProgress: LessonProgress[];
  quizAttempts: QuizAttempt[];
  error: string | null;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { lessonProgress: [], quizAttempts: [], error: null };
    }

    const [lessonsResult, quizzesResult] = await Promise.all([
      supabase
        .from('lesson_progress')
        .select('*')
        .eq('enrollment_id', enrollmentId),
      supabase
        .from('quiz_attempts')
        .select('*')
        .eq('enrollment_id', enrollmentId)
        .order('completed_at', { ascending: false })
    ]);

    return {
      lessonProgress: lessonsResult.data || [],
      quizAttempts: quizzesResult.data || [],
      error: null
    };
  } catch (err) {
    console.error('Error fetching progress:', err);
    return { lessonProgress: [], quizAttempts: [], error: null };
  }
}

// Rate a course
export async function rateCourse(
  userId: string,
  courseId: string,
  rating: number,
  review?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: true, error: null };
    }

    const { error } = await supabase
      .from('course_ratings')
      .upsert({
        user_id: userId,
        course_id: courseId,
        rating,
        review,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    // Update course average rating
    await db.rpc('update_course_rating', { course_id: courseId });

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error rating course:', err);
    return { success: false, error: err.message || 'Failed to submit rating' };
  }
}

// Get category and level labels
export const CATEGORY_LABELS: Record<CourseCategory, string> = {
  bitcoin: 'Bitcoin',
  ethereum: 'Ethereum',
  defi: 'DeFi',
  trading: 'Trading',
  security: 'Security',
  investing: 'Investing',
  technical_analysis: 'Technical Analysis',
  fundamentals: 'Fundamentals'
};

export const LEVEL_LABELS: Record<CourseLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert'
};

export const LEVEL_COLORS: Record<CourseLevel, string> = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-blue-100 text-blue-800',
  advanced: 'bg-purple-100 text-purple-800',
  expert: 'bg-red-100 text-red-800'
};
