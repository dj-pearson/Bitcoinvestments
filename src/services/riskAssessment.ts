/**
 * Risk Assessment Quiz Service
 *
 * Helps users understand their crypto investment risk tolerance
 * and provides personalized recommendations based on their answers.
 */

export interface QuizQuestion {
  id: string;
  question: string;
  description?: string;
  options: QuizOption[];
  category: 'experience' | 'goals' | 'risk_tolerance' | 'financial' | 'knowledge';
}

export interface QuizOption {
  id: string;
  text: string;
  score: number; // 1-5, where 1 is conservative and 5 is aggressive
  explanation?: string;
}

export interface QuizResult {
  profile: RiskProfile;
  score: number;
  maxScore: number;
  percentage: number;
  recommendations: Recommendation[];
  categoryBreakdown: CategoryBreakdown[];
}

export interface RiskProfile {
  type: 'conservative' | 'moderate' | 'balanced' | 'growth' | 'aggressive';
  title: string;
  description: string;
  suggestedAllocation: AllocationSuggestion;
  traits: string[];
}

export interface AllocationSuggestion {
  bitcoin: number;
  ethereum: number;
  stablecoins: number;
  altcoins: number;
  cash: number;
}

export interface Recommendation {
  category: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  link?: string;
}

export interface CategoryBreakdown {
  category: string;
  label: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export interface QuizAnswers {
  [questionId: string]: string; // questionId -> optionId
}

// Quiz Questions
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // Experience
  {
    id: 'exp_1',
    question: 'How long have you been investing in any asset class?',
    category: 'experience',
    options: [
      { id: 'exp_1_a', text: 'Never invested before', score: 1 },
      { id: 'exp_1_b', text: 'Less than 1 year', score: 2 },
      { id: 'exp_1_c', text: '1-3 years', score: 3 },
      { id: 'exp_1_d', text: '3-5 years', score: 4 },
      { id: 'exp_1_e', text: 'More than 5 years', score: 5 },
    ],
  },
  {
    id: 'exp_2',
    question: 'How familiar are you with cryptocurrency and blockchain technology?',
    category: 'experience',
    options: [
      { id: 'exp_2_a', text: "I've heard of Bitcoin but don't understand it", score: 1 },
      { id: 'exp_2_b', text: 'I understand the basics of cryptocurrency', score: 2 },
      { id: 'exp_2_c', text: 'I understand how blockchain works', score: 3 },
      { id: 'exp_2_d', text: 'I can explain DeFi, NFTs, and smart contracts', score: 4 },
      { id: 'exp_2_e', text: 'I actively use multiple DeFi protocols', score: 5 },
    ],
  },

  // Goals
  {
    id: 'goal_1',
    question: 'What is your primary investment goal?',
    category: 'goals',
    options: [
      { id: 'goal_1_a', text: 'Preserve my wealth and protect against inflation', score: 1 },
      { id: 'goal_1_b', text: 'Generate steady, moderate returns', score: 2 },
      { id: 'goal_1_c', text: 'Balance growth with some stability', score: 3 },
      { id: 'goal_1_d', text: 'Maximize long-term growth potential', score: 4 },
      { id: 'goal_1_e', text: 'Achieve highest possible returns, accepting high risk', score: 5 },
    ],
  },
  {
    id: 'goal_2',
    question: 'What is your investment time horizon?',
    category: 'goals',
    options: [
      { id: 'goal_2_a', text: 'Less than 1 year', score: 1 },
      { id: 'goal_2_b', text: '1-2 years', score: 2 },
      { id: 'goal_2_c', text: '3-5 years', score: 3 },
      { id: 'goal_2_d', text: '5-10 years', score: 4 },
      { id: 'goal_2_e', text: 'More than 10 years', score: 5 },
    ],
  },

  // Risk Tolerance
  {
    id: 'risk_1',
    question: 'If your portfolio dropped 30% in a week, what would you do?',
    category: 'risk_tolerance',
    options: [
      { id: 'risk_1_a', text: 'Sell everything immediately to prevent further losses', score: 1 },
      { id: 'risk_1_b', text: 'Sell some to reduce exposure', score: 2 },
      { id: 'risk_1_c', text: 'Hold and wait for recovery', score: 3 },
      { id: 'risk_1_d', text: 'Consider buying more at lower prices', score: 4 },
      { id: 'risk_1_e', text: 'Definitely buy more - this is a great opportunity', score: 5 },
    ],
  },
  {
    id: 'risk_2',
    question: 'How would you describe your risk tolerance?',
    category: 'risk_tolerance',
    options: [
      { id: 'risk_2_a', text: 'Very low - I cannot afford to lose any money', score: 1 },
      { id: 'risk_2_b', text: 'Low - I prefer stability over potential gains', score: 2 },
      { id: 'risk_2_c', text: 'Moderate - I can handle some volatility', score: 3 },
      { id: 'risk_2_d', text: 'High - I accept significant volatility for higher returns', score: 4 },
      { id: 'risk_2_e', text: 'Very high - I actively seek volatile investments', score: 5 },
    ],
  },
  {
    id: 'risk_3',
    question: 'What percentage of your investment portfolio could you lose without affecting your lifestyle?',
    category: 'risk_tolerance',
    options: [
      { id: 'risk_3_a', text: '0% - I cannot afford any losses', score: 1 },
      { id: 'risk_3_b', text: 'Up to 10%', score: 2 },
      { id: 'risk_3_c', text: 'Up to 25%', score: 3 },
      { id: 'risk_3_d', text: 'Up to 50%', score: 4 },
      { id: 'risk_3_e', text: 'More than 50%', score: 5 },
    ],
  },

  // Financial Situation
  {
    id: 'fin_1',
    question: 'How stable is your current income?',
    category: 'financial',
    options: [
      { id: 'fin_1_a', text: 'Unstable - variable or uncertain income', score: 1 },
      { id: 'fin_1_b', text: 'Somewhat stable - some income variability', score: 2 },
      { id: 'fin_1_c', text: 'Stable - regular income with some fluctuation', score: 3 },
      { id: 'fin_1_d', text: 'Very stable - consistent salary/income', score: 4 },
      { id: 'fin_1_e', text: 'Highly stable - multiple income streams', score: 5 },
    ],
  },
  {
    id: 'fin_2',
    question: 'Do you have an emergency fund covering 3-6 months of expenses?',
    category: 'financial',
    options: [
      { id: 'fin_2_a', text: 'No emergency fund', score: 1 },
      { id: 'fin_2_b', text: 'Less than 1 month of expenses', score: 2 },
      { id: 'fin_2_c', text: '1-3 months of expenses', score: 3 },
      { id: 'fin_2_d', text: '3-6 months of expenses', score: 4 },
      { id: 'fin_2_e', text: 'More than 6 months of expenses', score: 5 },
    ],
  },

  // Knowledge
  {
    id: 'know_1',
    question: 'How do you prefer to make investment decisions?',
    category: 'knowledge',
    options: [
      { id: 'know_1_a', text: 'I rely entirely on professional advice', score: 1 },
      { id: 'know_1_b', text: 'I follow recommendations but do some research', score: 2 },
      { id: 'know_1_c', text: 'I research thoroughly before making decisions', score: 3 },
      { id: 'know_1_d', text: 'I use technical analysis and market indicators', score: 4 },
      { id: 'know_1_e', text: 'I develop my own investment strategies', score: 5 },
    ],
  },
];

// Risk Profiles
const RISK_PROFILES: Record<string, RiskProfile> = {
  conservative: {
    type: 'conservative',
    title: 'Conservative Investor',
    description: 'You prioritize capital preservation over growth. You prefer stable investments with lower risk, even if returns are modest.',
    suggestedAllocation: {
      bitcoin: 10,
      ethereum: 5,
      stablecoins: 60,
      altcoins: 0,
      cash: 25,
    },
    traits: [
      'Prefers stability over high returns',
      'Low tolerance for volatility',
      'Focus on capital preservation',
      'Shorter investment horizon',
    ],
  },
  moderate: {
    type: 'moderate',
    title: 'Moderate Investor',
    description: 'You seek a balance between safety and growth. You can tolerate some volatility for potentially higher returns.',
    suggestedAllocation: {
      bitcoin: 25,
      ethereum: 15,
      stablecoins: 40,
      altcoins: 5,
      cash: 15,
    },
    traits: [
      'Balanced approach to risk and reward',
      'Comfortable with moderate volatility',
      'Medium-term investment focus',
      'Willing to diversify cautiously',
    ],
  },
  balanced: {
    type: 'balanced',
    title: 'Balanced Investor',
    description: 'You have a well-rounded approach to investing. You accept market volatility as part of the journey to long-term growth.',
    suggestedAllocation: {
      bitcoin: 35,
      ethereum: 25,
      stablecoins: 20,
      altcoins: 10,
      cash: 10,
    },
    traits: [
      'Equal focus on growth and stability',
      'Comfortable with market cycles',
      'Long-term oriented',
      'Active portfolio management',
    ],
  },
  growth: {
    type: 'growth',
    title: 'Growth Investor',
    description: 'You prioritize growth potential over stability. You can handle significant volatility and have a long-term perspective.',
    suggestedAllocation: {
      bitcoin: 40,
      ethereum: 30,
      stablecoins: 10,
      altcoins: 15,
      cash: 5,
    },
    traits: [
      'Focus on maximizing returns',
      'High tolerance for volatility',
      'Long-term investment horizon',
      'Active in emerging opportunities',
    ],
  },
  aggressive: {
    type: 'aggressive',
    title: 'Aggressive Investor',
    description: 'You seek maximum returns and are comfortable with high risk. You have extensive experience and can handle extreme volatility.',
    suggestedAllocation: {
      bitcoin: 35,
      ethereum: 30,
      stablecoins: 5,
      altcoins: 25,
      cash: 5,
    },
    traits: [
      'Maximum growth orientation',
      'Very high risk tolerance',
      'Extensive market knowledge',
      'Active trading and DeFi participation',
    ],
  },
};

/**
 * Calculate quiz results from answers
 */
export function calculateQuizResults(answers: QuizAnswers): QuizResult {
  const categoryScores: Record<string, { score: number; maxScore: number }> = {};
  let totalScore = 0;
  let totalMaxScore = 0;

  // Calculate scores by category
  for (const question of QUIZ_QUESTIONS) {
    const selectedOptionId = answers[question.id];
    if (!selectedOptionId) continue;

    const selectedOption = question.options.find((opt) => opt.id === selectedOptionId);
    if (!selectedOption) continue;

    const maxQuestionScore = Math.max(...question.options.map((opt) => opt.score));

    if (!categoryScores[question.category]) {
      categoryScores[question.category] = { score: 0, maxScore: 0 };
    }

    categoryScores[question.category].score += selectedOption.score;
    categoryScores[question.category].maxScore += maxQuestionScore;
    totalScore += selectedOption.score;
    totalMaxScore += maxQuestionScore;
  }

  // Calculate percentage
  const percentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

  // Determine risk profile
  const profile = determineRiskProfile(percentage);

  // Generate recommendations
  const recommendations = generateRecommendations(profile, categoryScores);

  // Category breakdown
  const categoryLabels: Record<string, string> = {
    experience: 'Investment Experience',
    goals: 'Investment Goals',
    risk_tolerance: 'Risk Tolerance',
    financial: 'Financial Situation',
    knowledge: 'Investment Knowledge',
  };

  const categoryBreakdown: CategoryBreakdown[] = Object.entries(categoryScores).map(
    ([category, { score, maxScore }]) => ({
      category,
      label: categoryLabels[category] || category,
      score,
      maxScore,
      percentage: maxScore > 0 ? (score / maxScore) * 100 : 0,
    })
  );

  return {
    profile,
    score: totalScore,
    maxScore: totalMaxScore,
    percentage: Math.round(percentage),
    recommendations,
    categoryBreakdown,
  };
}

/**
 * Determine risk profile based on percentage score
 */
function determineRiskProfile(percentage: number): RiskProfile {
  if (percentage < 25) {
    return RISK_PROFILES.conservative;
  } else if (percentage < 40) {
    return RISK_PROFILES.moderate;
  } else if (percentage < 60) {
    return RISK_PROFILES.balanced;
  } else if (percentage < 80) {
    return RISK_PROFILES.growth;
  } else {
    return RISK_PROFILES.aggressive;
  }
}

/**
 * Generate personalized recommendations
 */
function generateRecommendations(
  profile: RiskProfile,
  categoryScores: Record<string, { score: number; maxScore: number }>
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Experience-based recommendations
  const experienceScore = categoryScores.experience;
  if (experienceScore && experienceScore.score / experienceScore.maxScore < 0.4) {
    recommendations.push({
      category: 'Education',
      title: 'Start with the Basics',
      description: 'We recommend completing our beginner guides before investing. Understanding blockchain fundamentals will help you make better decisions.',
      priority: 'high',
      link: '/learn',
    });
  }

  // Financial situation recommendations
  const financialScore = categoryScores.financial;
  if (financialScore && financialScore.score / financialScore.maxScore < 0.5) {
    recommendations.push({
      category: 'Financial Health',
      title: 'Build Your Emergency Fund First',
      description: 'Consider building a 3-6 month emergency fund before investing in volatile assets like cryptocurrency.',
      priority: 'high',
    });
  }

  // Profile-specific recommendations
  switch (profile.type) {
    case 'conservative':
      recommendations.push({
        category: 'Strategy',
        title: 'Consider Dollar-Cost Averaging',
        description: 'Start with small, regular investments in Bitcoin to reduce timing risk. Our DCA calculator can help you plan.',
        priority: 'medium',
        link: '/calculators',
      });
      recommendations.push({
        category: 'Security',
        title: 'Use a Hardware Wallet',
        description: 'For maximum security, store your crypto in a hardware wallet. Check our wallet comparison guide.',
        priority: 'medium',
        link: '/compare/wallets',
      });
      break;

    case 'moderate':
    case 'balanced':
      recommendations.push({
        category: 'Diversification',
        title: 'Diversify Your Portfolio',
        description: 'Consider a mix of Bitcoin, Ethereum, and stablecoins. Use our portfolio tracker to monitor your allocations.',
        priority: 'medium',
        link: '/dashboard',
      });
      recommendations.push({
        category: 'Alerts',
        title: 'Set Up Price Alerts',
        description: 'Stay informed about market movements with price alerts so you can make timely decisions.',
        priority: 'low',
        link: '/dashboard',
      });
      break;

    case 'growth':
    case 'aggressive':
      recommendations.push({
        category: 'Research',
        title: 'Research Before Investing',
        description: 'With higher-risk investments, thorough research is crucial. Check our scam database before investing in new projects.',
        priority: 'high',
        link: '/scams',
      });
      recommendations.push({
        category: 'Risk Management',
        title: 'Set Stop-Losses',
        description: 'Even with high risk tolerance, use stop-losses to protect against catastrophic losses.',
        priority: 'medium',
      });
      recommendations.push({
        category: 'DeFi',
        title: 'Learn About DeFi Safely',
        description: 'If exploring DeFi, start with established protocols and understand smart contract risks.',
        priority: 'medium',
        link: '/learn/defi',
      });
      break;
  }

  // Universal recommendations
  recommendations.push({
    category: 'Security',
    title: 'Enable Two-Factor Authentication',
    description: 'Protect your accounts with 2FA on all exchanges and wallets.',
    priority: 'high',
  });

  return recommendations;
}

/**
 * Get profile color for UI
 */
export function getProfileColor(type: RiskProfile['type']): string {
  const colors: Record<RiskProfile['type'], string> = {
    conservative: '#10b981', // green
    moderate: '#3b82f6', // blue
    balanced: '#8b5cf6', // purple
    growth: '#f97316', // orange
    aggressive: '#ef4444', // red
  };
  return colors[type];
}

/**
 * Get category icon name
 */
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    experience: 'clock',
    goals: 'target',
    risk_tolerance: 'trending-up',
    financial: 'wallet',
    knowledge: 'book-open',
  };
  return icons[category] || 'help-circle';
}
