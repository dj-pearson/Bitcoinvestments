import { supabase } from '../lib/supabase';

// Type assertion helper for tables not in the schema
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// Types
export type ConversationRole = 'user' | 'assistant' | 'system';
export type LearningTopic = 'basics' | 'trading' | 'defi' | 'security' | 'tax' | 'technical_analysis' | 'fundamentals' | 'portfolio';
export type QuizDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ChatMessage {
  id: string;
  role: ConversationRole;
  content: string;
  timestamp: string;
  metadata?: {
    sources?: string[];
    relatedTopics?: string[];
    confidence?: number;
  };
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  topic: LearningTopic | null;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  topic: LearningTopic;
  difficulty: QuizDifficulty;
  estimatedHours: number;
  modules: LearningModule[];
  progress: number;
  completedModules: string[];
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  content: string;
  keyPoints: string[];
  quiz?: QuizQuestion[];
  resources: LearningResource[];
  order: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LearningResource {
  id: string;
  title: string;
  type: 'article' | 'video' | 'tool' | 'external';
  url: string;
  description: string;
}

export interface UserProgress {
  userId: string;
  totalConversations: number;
  questionsAsked: number;
  topicsExplored: LearningTopic[];
  quizzesTaken: number;
  averageQuizScore: number;
  streakDays: number;
  lastActiveAt: string;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

// Demo data
const demoConversations: Conversation[] = [
  {
    id: '1',
    userId: 'demo-user',
    title: 'Understanding Bitcoin Halving',
    topic: 'basics',
    messages: [
      {
        id: '1',
        role: 'user',
        content: 'What is Bitcoin halving and why does it matter?',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '2',
        role: 'assistant',
        content: `Bitcoin halving is a programmed event that occurs approximately every 4 years (every 210,000 blocks). During a halving, the reward that miners receive for adding new blocks to the blockchain is cut in half.

**Key Points:**
1. **Supply Control**: Halving reduces the rate of new Bitcoin creation, making it more scarce over time
2. **Inflation Reduction**: The inflation rate of Bitcoin decreases with each halving
3. **Maximum Supply**: There will only ever be 21 million Bitcoin, and halvings ensure this limit is reached gradually

**Historical Impact:**
- 2012 Halving: Reward went from 50 to 25 BTC
- 2016 Halving: Reward went from 25 to 12.5 BTC
- 2020 Halving: Reward went from 12.5 to 6.25 BTC
- 2024 Halving: Reward went from 6.25 to 3.125 BTC

Historically, halvings have been associated with significant price increases, though past performance doesn't guarantee future results.`,
        timestamp: new Date(Date.now() - 3590000).toISOString(),
        metadata: {
          sources: ['Bitcoin Whitepaper', 'Historical blockchain data'],
          relatedTopics: ['Mining', 'Supply Economics', 'Price Cycles'],
          confidence: 0.95
        }
      }
    ],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3590000).toISOString()
  }
];

const demoLearningPaths: LearningPath[] = [
  {
    id: '1',
    name: 'Crypto Fundamentals',
    description: 'Master the basics of cryptocurrency and blockchain technology',
    topic: 'basics',
    difficulty: 'beginner',
    estimatedHours: 8,
    progress: 65,
    completedModules: ['mod1', 'mod2', 'mod3'],
    modules: [
      {
        id: 'mod1',
        title: 'What is Cryptocurrency?',
        description: 'Understanding digital currencies and their purpose',
        content: 'Cryptocurrency is a digital or virtual form of currency...',
        keyPoints: [
          'Decentralized digital money',
          'Secured by cryptography',
          'Operates on blockchain technology'
        ],
        resources: [
          {
            id: 'r1',
            title: 'Bitcoin Whitepaper',
            type: 'article',
            url: '/resources/bitcoin-whitepaper',
            description: 'The original Bitcoin whitepaper by Satoshi Nakamoto'
          }
        ],
        order: 1
      },
      {
        id: 'mod2',
        title: 'How Blockchain Works',
        description: 'The technology behind cryptocurrencies',
        content: 'Blockchain is a distributed ledger technology...',
        keyPoints: [
          'Distributed ledger technology',
          'Immutable transaction records',
          'Consensus mechanisms'
        ],
        resources: [],
        order: 2
      },
      {
        id: 'mod3',
        title: 'Types of Cryptocurrencies',
        description: 'Bitcoin, altcoins, and tokens explained',
        content: 'There are thousands of cryptocurrencies...',
        keyPoints: [
          'Bitcoin as digital gold',
          'Altcoins and their purposes',
          'Utility vs security tokens'
        ],
        resources: [],
        order: 3
      },
      {
        id: 'mod4',
        title: 'Wallets and Security',
        description: 'Safely storing your cryptocurrencies',
        content: 'Cryptocurrency wallets are essential...',
        keyPoints: [
          'Hot vs cold wallets',
          'Private keys importance',
          'Best security practices'
        ],
        quiz: [
          {
            id: 'q1',
            question: 'What is the safest way to store large amounts of cryptocurrency?',
            options: ['On an exchange', 'Hardware wallet', 'Mobile wallet', 'Paper in your pocket'],
            correctIndex: 1,
            explanation: 'Hardware wallets (cold storage) are considered the safest for large holdings as they keep private keys offline.'
          }
        ],
        resources: [],
        order: 4
      },
      {
        id: 'mod5',
        title: 'Making Your First Purchase',
        description: 'Step-by-step guide to buying crypto',
        content: 'Buying cryptocurrency for the first time...',
        keyPoints: [
          'Choosing an exchange',
          'KYC verification',
          'Order types explained'
        ],
        resources: [],
        order: 5
      }
    ]
  },
  {
    id: '2',
    name: 'DeFi Mastery',
    description: 'Deep dive into decentralized finance protocols',
    topic: 'defi',
    difficulty: 'intermediate',
    estimatedHours: 12,
    progress: 25,
    completedModules: ['defi1'],
    modules: [
      {
        id: 'defi1',
        title: 'Introduction to DeFi',
        description: 'Understanding decentralized finance',
        content: 'DeFi represents a shift from traditional finance...',
        keyPoints: [
          'Permissionless financial services',
          'Smart contract automation',
          'Composability of protocols'
        ],
        resources: [],
        order: 1
      },
      {
        id: 'defi2',
        title: 'Lending and Borrowing',
        description: 'How DeFi lending protocols work',
        content: 'DeFi lending allows you to...',
        keyPoints: [
          'Collateralized loans',
          'Interest rate models',
          'Liquidation risks'
        ],
        resources: [],
        order: 2
      }
    ]
  },
  {
    id: '3',
    name: 'Technical Analysis',
    description: 'Learn to read charts and identify patterns',
    topic: 'technical_analysis',
    difficulty: 'intermediate',
    estimatedHours: 15,
    progress: 0,
    completedModules: [],
    modules: [
      {
        id: 'ta1',
        title: 'Chart Types and Timeframes',
        description: 'Understanding different chart visualizations',
        content: 'Technical analysis uses charts to...',
        keyPoints: [
          'Candlestick vs line charts',
          'Timeframe selection',
          'Volume analysis'
        ],
        resources: [],
        order: 1
      }
    ]
  }
];

const demoProgress: UserProgress = {
  userId: 'demo-user',
  totalConversations: 24,
  questionsAsked: 156,
  topicsExplored: ['basics', 'trading', 'defi', 'security'],
  quizzesTaken: 12,
  averageQuizScore: 82,
  streakDays: 7,
  lastActiveAt: new Date().toISOString(),
  achievements: [
    {
      id: '1',
      name: 'First Steps',
      description: 'Started your learning journey',
      icon: '🎯',
      unlockedAt: '2024-10-01T10:00:00Z'
    },
    {
      id: '2',
      name: 'Curious Mind',
      description: 'Asked 100 questions',
      icon: '💡',
      unlockedAt: '2024-11-15T14:30:00Z'
    },
    {
      id: '3',
      name: 'Week Warrior',
      description: '7-day learning streak',
      icon: '🔥',
      unlockedAt: new Date().toISOString()
    },
    {
      id: '4',
      name: 'DeFi Explorer',
      description: 'Completed DeFi fundamentals',
      icon: '🌐',
      unlockedAt: '2024-12-01T09:00:00Z'
    }
  ]
};

const topicSuggestions: Record<LearningTopic, string[]> = {
  basics: [
    'What is blockchain technology?',
    'How does Bitcoin mining work?',
    'What are private and public keys?',
    'Explain cryptocurrency wallets'
  ],
  trading: [
    'What are limit and market orders?',
    'How do I read candlestick charts?',
    'What is dollar-cost averaging?',
    'Explain leverage trading risks'
  ],
  defi: [
    'What is liquidity providing?',
    'How do automated market makers work?',
    'Explain impermanent loss',
    'What are flash loans?'
  ],
  security: [
    'How do I protect my crypto?',
    'What is a rug pull scam?',
    'Best practices for seed phrases',
    'How to verify smart contracts'
  ],
  tax: [
    'How are crypto gains taxed?',
    'What is cost basis tracking?',
    'When do I need to report transactions?',
    'Tax-loss harvesting strategies'
  ],
  technical_analysis: [
    'What are support and resistance?',
    'How to identify trend reversals',
    'Explain RSI indicator',
    'What are Fibonacci retracements?'
  ],
  fundamentals: [
    'How to evaluate a crypto project?',
    'What is tokenomics?',
    'Understanding market cap',
    'On-chain metrics explained'
  ],
  portfolio: [
    'How to diversify crypto portfolio?',
    'What is portfolio rebalancing?',
    'Risk management strategies',
    'Asset allocation best practices'
  ]
};

// Conversation Functions
export async function getConversations(userId: string): Promise<Conversation[]> {
  try {
    const { data, error } = await db
      .from('ai_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || demoConversations;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return demoConversations;
  }
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  try {
    const { data, error } = await db
      .from('ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return demoConversations.find(c => c.id === conversationId) || null;
  }
}

export async function createConversation(userId: string, title: string): Promise<Conversation> {
  const newConversation: Conversation = {
    id: crypto.randomUUID(),
    userId,
    title,
    topic: null,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const { data, error } = await db
      .from('ai_conversations')
      .insert({
        id: newConversation.id,
        user_id: userId,
        title,
        messages: []
      })
      .select()
      .single();

    if (error) throw error;
    return data || newConversation;
  } catch (error) {
    console.error('Error creating conversation:', error);
    return newConversation;
  }
}

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<ChatMessage> {
  // In a real implementation, this would call an AI service
  // For demo, we return a simulated response
  const userMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    content,
    timestamp: new Date().toISOString()
  };

  // Simulate AI response
  const aiResponse = await generateAIResponse(content);

  try {
    // Update conversation with new messages
    await db.rpc('append_conversation_messages', {
      conversation_id: conversationId,
      new_messages: [userMessage, aiResponse]
    });
  } catch (error) {
    console.error('Error saving messages:', error);
  }

  return aiResponse;
}

async function generateAIResponse(userMessage: string): Promise<ChatMessage> {
  // Simulate AI thinking time
  await new Promise(resolve => setTimeout(resolve, 500));

  // Simple keyword-based responses for demo
  const lowerMessage = userMessage.toLowerCase();
  let response = '';
  let relatedTopics: string[] = [];

  if (lowerMessage.includes('bitcoin') || lowerMessage.includes('btc')) {
    response = `Bitcoin (BTC) is the first and largest cryptocurrency by market capitalization. Here are key points:

**What is Bitcoin?**
- Created in 2009 by anonymous developer(s) known as Satoshi Nakamoto
- Decentralized digital currency operating on a peer-to-peer network
- Limited supply of 21 million coins

**Key Features:**
1. **Decentralization**: No central authority controls Bitcoin
2. **Transparency**: All transactions are recorded on the public blockchain
3. **Security**: Protected by cryptographic algorithms and proof-of-work consensus

Would you like me to explain any of these concepts in more detail?`;
    relatedTopics = ['Mining', 'Blockchain', 'Wallets', 'Halving'];
  } else if (lowerMessage.includes('defi') || lowerMessage.includes('decentralized finance')) {
    response = `DeFi (Decentralized Finance) refers to financial services built on blockchain networks. Here's an overview:

**Core Concepts:**
1. **Permissionless**: Anyone can access DeFi services without intermediaries
2. **Transparent**: All transactions and smart contract code are publicly visible
3. **Composable**: DeFi protocols can be combined like "money legos"

**Popular DeFi Categories:**
- **Lending/Borrowing**: Aave, Compound
- **Decentralized Exchanges**: Uniswap, Curve
- **Yield Farming**: Earning rewards by providing liquidity
- **Stablecoins**: DAI, USDC

**Risks to Consider:**
- Smart contract vulnerabilities
- Impermanent loss in liquidity pools
- Protocol risks and hacks

What specific aspect of DeFi would you like to explore?`;
    relatedTopics = ['Lending', 'DEX', 'Yield Farming', 'Smart Contracts'];
  } else if (lowerMessage.includes('wallet')) {
    response = `Cryptocurrency wallets are essential for storing and managing your digital assets. Here's what you need to know:

**Types of Wallets:**

1. **Hot Wallets** (Connected to internet)
   - Mobile wallets (Trust Wallet, MetaMask)
   - Desktop wallets
   - Browser extensions
   - Convenient but less secure

2. **Cold Wallets** (Offline storage)
   - Hardware wallets (Ledger, Trezor)
   - Paper wallets
   - Most secure for large holdings

**Security Best Practices:**
- Never share your seed phrase
- Use strong, unique passwords
- Enable 2FA when possible
- Keep backups in secure locations

Would you like recommendations for specific wallet types based on your needs?`;
    relatedTopics = ['Security', 'Private Keys', 'Hardware Wallets', 'Seed Phrases'];
  } else {
    response = `That's a great question! I can help you understand various aspects of cryptocurrency and blockchain technology.

**Popular Topics I Can Explain:**
- Bitcoin, Ethereum, and other cryptocurrencies
- DeFi (Decentralized Finance)
- Trading and technical analysis
- Wallet security and best practices
- Tax implications of crypto
- Portfolio management strategies

**Suggested Questions:**
- "How does blockchain technology work?"
- "What's the difference between Bitcoin and Ethereum?"
- "How do I safely store my cryptocurrency?"

What would you like to learn about?`;
    relatedTopics = ['Getting Started', 'Popular Cryptocurrencies', 'Security'];
  }

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: response,
    timestamp: new Date().toISOString(),
    metadata: {
      relatedTopics,
      confidence: 0.9
    }
  };
}

// Learning Path Functions
export async function getLearningPaths(_userId: string): Promise<LearningPath[]> {
  void _userId; // Reserved for user-specific learning paths
  try {
    const { data, error } = await db
      .from('learning_paths')
      .select(`
        *,
        user_progress:learning_path_progress(*)
      `)
      .eq('is_active', true);

    if (error) throw error;
    return (data as LearningPath[]) || demoLearningPaths;
  } catch (error) {
    console.error('Error fetching learning paths:', error);
    return demoLearningPaths;
  }
}

export async function getLearningPath(pathId: string): Promise<LearningPath | null> {
  return demoLearningPaths.find(p => p.id === pathId) || null;
}

export async function completeModule(
  userId: string,
  pathId: string,
  moduleId: string
): Promise<boolean> {
  try {
    const { error } = await db
      .from('learning_path_progress')
      .upsert({
        user_id: userId,
        path_id: pathId,
        completed_modules: db.rpc('array_append_unique', {
          arr: [],
          elem: moduleId
        })
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error completing module:', error);
    return true; // Return true for demo
  }
}

export async function submitQuizAnswer(
  _userId: string,
  pathId: string,
  moduleId: string,
  questionId: string,
  answerIndex: number
): Promise<{ correct: boolean; explanation: string }> {
  void _userId; // Reserved for user progress tracking
  // Find the question in demo data
  const path = demoLearningPaths.find(p => p.id === pathId);
  const module = path?.modules.find(m => m.id === moduleId);
  const question = module?.quiz?.find(q => q.id === questionId);

  if (!question) {
    return { correct: false, explanation: 'Question not found' };
  }

  const correct = answerIndex === question.correctIndex;
  return { correct, explanation: question.explanation };
}

// Progress Functions
export async function getUserProgress(userId: string): Promise<UserProgress> {
  try {
    const { data, error } = await db
      .from('user_learning_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return (data as UserProgress) || demoProgress;
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return demoProgress;
  }
}

export async function updateStreak(userId: string): Promise<number> {
  try {
    const { data, error } = await db.rpc('update_learning_streak', {
      p_user_id: userId
    });

    if (error) throw error;
    return (data as number) || demoProgress.streakDays;
  } catch (error) {
    console.error('Error updating streak:', error);
    return demoProgress.streakDays;
  }
}

// Topic Suggestions
export function getTopicSuggestions(topic: LearningTopic): string[] {
  return topicSuggestions[topic] || [];
}

export function getAllTopics(): { topic: LearningTopic; label: string; icon: string }[] {
  return [
    { topic: 'basics', label: 'Crypto Basics', icon: '📚' },
    { topic: 'trading', label: 'Trading', icon: '📈' },
    { topic: 'defi', label: 'DeFi', icon: '🌐' },
    { topic: 'security', label: 'Security', icon: '🔒' },
    { topic: 'tax', label: 'Tax & Legal', icon: '📋' },
    { topic: 'technical_analysis', label: 'Technical Analysis', icon: '📊' },
    { topic: 'fundamentals', label: 'Fundamentals', icon: '🔍' },
    { topic: 'portfolio', label: 'Portfolio Management', icon: '💼' }
  ];
}

// Delete conversation
export async function deleteConversation(conversationId: string): Promise<boolean> {
  try {
    const { error } = await db
      .from('ai_conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return true; // Return true for demo
  }
}
