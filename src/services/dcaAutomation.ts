/**
 * DCA Automation Service
 *
 * Automate dollar-cost averaging purchases through integrated exchanges.
 * Free: manual DCA only (calculator + reminders)
 * Basic: 1 schedule, 1% fee, $9.99/month
 * Premium: unlimited schedules, 0.5% fee, $19.99/month
 */

import type {
  DCASchedule,
  DCAExecution,
  DCAPerformance,
  DCAPlan,
  DCAFrequency,
} from '../types/premiumFeatures';

// Mock DCA schedules
const mockSchedules: DCASchedule[] = [
  {
    id: 'dca-1',
    user_id: 'user-1',
    exchange_credential_id: 'cred-1',
    exchange: 'coinbase',
    name: 'Weekly Bitcoin',
    asset_symbol: 'BTC',
    asset_name: 'Bitcoin',
    amount_usd: 100,
    frequency: 'weekly',
    day_of_week: 1, // Monday
    day_of_month: null,
    time_utc: '09:00',
    status: 'active',
    next_execution_at: new Date(Date.now() + 86400000 * 3).toISOString(),
    total_invested_usd: 5200,
    total_purchased: 0.128,
    average_price: 40625,
    execution_count: 52,
    failed_count: 1,
    last_executed_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    last_error: null,
    created_at: new Date(Date.now() - 86400000 * 365).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dca-2',
    user_id: 'user-1',
    exchange_credential_id: 'cred-2',
    exchange: 'binance',
    name: 'Monthly ETH',
    asset_symbol: 'ETH',
    asset_name: 'Ethereum',
    amount_usd: 250,
    frequency: 'monthly',
    day_of_week: null,
    day_of_month: 1,
    time_utc: '10:00',
    status: 'active',
    next_execution_at: new Date(Date.now() + 86400000 * 15).toISOString(),
    total_invested_usd: 3000,
    total_purchased: 1.35,
    average_price: 2222,
    execution_count: 12,
    failed_count: 0,
    last_executed_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    last_error: null,
    created_at: new Date(Date.now() - 86400000 * 365).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock executions
const mockExecutions: DCAExecution[] = [
  { id: 'exec-1', schedule_id: 'dca-1', executed_at: new Date(Date.now() - 86400000 * 4).toISOString(), status: 'success', amount_usd: 100, amount_purchased: 0.00232, price_at_execution: 43103, fee_usd: 0.50, fee_percent: 0.5, order_id: 'order-123', error_message: null, created_at: new Date().toISOString() },
  { id: 'exec-2', schedule_id: 'dca-1', executed_at: new Date(Date.now() - 86400000 * 11).toISOString(), status: 'success', amount_usd: 100, amount_purchased: 0.00241, price_at_execution: 41494, fee_usd: 0.50, fee_percent: 0.5, order_id: 'order-122', error_message: null, created_at: new Date().toISOString() },
  { id: 'exec-3', schedule_id: 'dca-1', executed_at: new Date(Date.now() - 86400000 * 18).toISOString(), status: 'success', amount_usd: 100, amount_purchased: 0.00248, price_at_execution: 40322, fee_usd: 0.50, fee_percent: 0.5, order_id: 'order-121', error_message: null, created_at: new Date().toISOString() },
  { id: 'exec-4', schedule_id: 'dca-2', executed_at: new Date(Date.now() - 86400000 * 15).toISOString(), status: 'success', amount_usd: 250, amount_purchased: 0.1136, price_at_execution: 2201, fee_usd: 1.25, fee_percent: 0.5, order_id: 'order-456', error_message: null, created_at: new Date().toISOString() },
];

/**
 * Create a new DCA schedule
 */
export async function createDCASchedule(
  userId: string,
  schedule: Omit<DCASchedule, 'id' | 'user_id' | 'status' | 'next_execution_at' | 'total_invested_usd' | 'total_purchased' | 'average_price' | 'execution_count' | 'failed_count' | 'last_executed_at' | 'last_error' | 'created_at' | 'updated_at'>
): Promise<DCASchedule> {
  const nextExecution = calculateNextExecution(schedule.frequency, schedule.day_of_week, schedule.day_of_month, schedule.time_utc);

  return {
    id: `dca-${Date.now()}`,
    user_id: userId,
    ...schedule,
    status: 'active',
    next_execution_at: nextExecution,
    total_invested_usd: 0,
    total_purchased: 0,
    average_price: 0,
    execution_count: 0,
    failed_count: 0,
    last_executed_at: null,
    last_error: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Calculate next execution time
 */
function calculateNextExecution(
  frequency: DCAFrequency,
  dayOfWeek: number | null,
  dayOfMonth: number | null,
  timeUtc: string
): string {
  const now = new Date();
  const [hours, minutes] = timeUtc.split(':').map(Number);

  let next = new Date(now);
  next.setUTCHours(hours, minutes, 0, 0);

  switch (frequency) {
    case 'daily':
      if (next <= now) next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      const targetDay = dayOfWeek || 1;
      const daysUntilTarget = (targetDay - now.getDay() + 7) % 7;
      next.setDate(next.getDate() + (daysUntilTarget === 0 && next <= now ? 7 : daysUntilTarget));
      break;
    case 'biweekly':
      const biweeklyTarget = dayOfWeek || 1;
      const daysUntilBiweekly = (biweeklyTarget - now.getDay() + 7) % 7;
      next.setDate(next.getDate() + (daysUntilBiweekly === 0 && next <= now ? 14 : daysUntilBiweekly));
      break;
    case 'monthly':
      const targetDate = dayOfMonth || 1;
      next.setDate(targetDate);
      if (next <= now) next.setMonth(next.getMonth() + 1);
      break;
  }

  return next.toISOString();
}

/**
 * Get user's DCA schedules
 */
export async function getUserDCASchedules(
  userId: string,
  tier: 'free' | 'basic' | 'premium' = 'free'
): Promise<DCASchedule[]> {
  // In production, fetch from database
  let schedules = mockSchedules.filter(s => s.user_id === userId || s.user_id === 'user-1');

  if (tier === 'free') {
    return []; // Free users can't create DCA schedules
  } else if (tier === 'basic') {
    return schedules.slice(0, 1); // Basic tier: 1 schedule
  }

  return schedules; // Premium: unlimited
}

/**
 * Get DCA schedule executions
 */
export async function getDCAExecutions(
  scheduleId: string,
  limit: number = 50
): Promise<DCAExecution[]> {
  return mockExecutions
    .filter(e => e.schedule_id === scheduleId)
    .slice(0, limit);
}

/**
 * Get DCA performance metrics
 */
export async function getDCAPerformance(
  scheduleId: string
): Promise<DCAPerformance> {
  const schedule = mockSchedules.find(s => s.id === scheduleId);
  const executions = mockExecutions.filter(e => e.schedule_id === scheduleId);

  if (!schedule) {
    throw new Error('Schedule not found');
  }

  // Calculate current value (mock - would use real price data)
  const currentPrice = schedule.asset_symbol === 'BTC' ? 43000 : 2400;
  const currentValue = schedule.total_purchased * currentPrice;
  const totalReturn = currentValue - schedule.total_invested_usd;
  const totalReturnPercent = schedule.total_invested_usd > 0
    ? (totalReturn / schedule.total_invested_usd) * 100
    : 0;

  const totalFees = executions.reduce((sum, e) => sum + e.fee_usd, 0);

  // Group by month
  const monthlyBreakdown = executions.reduce((acc, exec) => {
    const month = exec.executed_at.substring(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = { invested_usd: 0, purchased: 0, count: 0 };
    }
    acc[month].invested_usd += exec.amount_usd;
    acc[month].purchased += exec.amount_purchased;
    acc[month].count += 1;
    return acc;
  }, {} as Record<string, { invested_usd: number; purchased: number; count: number }>);

  return {
    schedule_id: scheduleId,
    total_invested_usd: schedule.total_invested_usd,
    total_purchased: schedule.total_purchased,
    current_value_usd: currentValue,
    total_return_usd: totalReturn,
    total_return_percent: totalReturnPercent,
    average_buy_price: schedule.average_price,
    current_price: currentPrice,
    total_fees_usd: totalFees,
    executions,
    monthly_breakdown: Object.entries(monthlyBreakdown).map(([month, data]) => ({
      month,
      invested_usd: data.invested_usd,
      purchased: data.purchased,
      avg_price: data.invested_usd / data.purchased,
    })),
  };
}

/**
 * Pause a DCA schedule
 */
export async function pauseDCASchedule(scheduleId: string): Promise<DCASchedule> {
  const schedule = mockSchedules.find(s => s.id === scheduleId);
  if (!schedule) throw new Error('Schedule not found');

  schedule.status = 'paused';
  schedule.next_execution_at = null;
  schedule.updated_at = new Date().toISOString();

  return schedule;
}

/**
 * Resume a DCA schedule
 */
export async function resumeDCASchedule(scheduleId: string): Promise<DCASchedule> {
  const schedule = mockSchedules.find(s => s.id === scheduleId);
  if (!schedule) throw new Error('Schedule not found');

  schedule.status = 'active';
  schedule.next_execution_at = calculateNextExecution(
    schedule.frequency,
    schedule.day_of_week,
    schedule.day_of_month,
    schedule.time_utc
  );
  schedule.updated_at = new Date().toISOString();

  return schedule;
}

/**
 * Cancel a DCA schedule
 */
export async function cancelDCASchedule(scheduleId: string): Promise<void> {
  const scheduleIndex = mockSchedules.findIndex(s => s.id === scheduleId);
  if (scheduleIndex === -1) throw new Error('Schedule not found');

  mockSchedules[scheduleIndex].status = 'cancelled';
  mockSchedules[scheduleIndex].next_execution_at = null;
  mockSchedules[scheduleIndex].updated_at = new Date().toISOString();
}

/**
 * Calculate DCA projection
 */
export function calculateDCAProjection(
  amountUsd: number,
  frequency: DCAFrequency,
  durationMonths: number,
  expectedAnnualReturn: number = 0
): {
  totalInvested: number;
  executionCount: number;
  projectedValue: number;
  projectedReturn: number;
  projectedReturnPercent: number;
} {
  const executionsPerMonth = {
    daily: 30,
    weekly: 4.33,
    biweekly: 2.17,
    monthly: 1,
  }[frequency];

  const executionCount = Math.round(executionsPerMonth * durationMonths);
  const totalInvested = amountUsd * executionCount;

  // Calculate projected value with compound growth
  // This is a simplified model - real DCA calculations are more complex
  const monthlyReturn = expectedAnnualReturn / 12 / 100;
  let projectedValue = 0;

  for (let i = 0; i < executionCount; i++) {
    const monthsRemaining = durationMonths - (i / executionsPerMonth);
    const investment = amountUsd;
    const growthFactor = Math.pow(1 + monthlyReturn, monthsRemaining);
    projectedValue += investment * growthFactor;
  }

  const projectedReturn = projectedValue - totalInvested;
  const projectedReturnPercent = (projectedReturn / totalInvested) * 100;

  return {
    totalInvested,
    executionCount,
    projectedValue: Math.round(projectedValue * 100) / 100,
    projectedReturn: Math.round(projectedReturn * 100) / 100,
    projectedReturnPercent: Math.round(projectedReturnPercent * 100) / 100,
  };
}

/**
 * Get recommended DCA plans
 */
export function getDCAPlans(): DCAPlan[] {
  return [
    { id: 'btc-only', name: 'Bitcoin Accumulator', description: 'Simple BTC-only DCA strategy', assets: [{ symbol: 'BTC', allocation_percent: 100 }], frequency: 'weekly', min_amount_usd: 10, is_recommended: true },
    { id: 'btc-eth', name: 'Blue Chip Crypto', description: 'Split between Bitcoin and Ethereum', assets: [{ symbol: 'BTC', allocation_percent: 60 }, { symbol: 'ETH', allocation_percent: 40 }], frequency: 'weekly', min_amount_usd: 25, is_recommended: true },
    { id: 'diversified', name: 'Diversified Portfolio', description: 'Spread across major cryptocurrencies', assets: [{ symbol: 'BTC', allocation_percent: 40 }, { symbol: 'ETH', allocation_percent: 30 }, { symbol: 'SOL', allocation_percent: 15 }, { symbol: 'LINK', allocation_percent: 15 }], frequency: 'weekly', min_amount_usd: 50, is_recommended: false },
  ];
}

/**
 * Get fee for DCA tier
 */
export function getDCAFee(tier: 'free' | 'basic' | 'premium'): number {
  return {
    free: 0,
    basic: 1.0,
    premium: 0.5,
  }[tier];
}
