/**
 * Staking reward math, shared by /staking-calculator and the staking tab on
 * /calculators.
 *
 * Rates are handled explicitly as either:
 *  - APY: an effective annual yield that already includes compounding. When
 *    rewards are restaked, balance = P × (1 + APY)^(years). When they are paid
 *    out, each payout is P × ((1 + APY)^(1/n) − 1) for n payouts a year.
 *  - APR: a simple annual rate. Restaked with n compounding periods a year,
 *    balance = P × (1 + APR/n)^(n × years); paid out, rewards = P × APR × years.
 * The old code compounded an APY a second time, and its "no compounding" branch
 * returned $0 rewards when restaking was on.
 */

export type RateType = 'apy' | 'apr';

export interface StakingInput {
  /** Amount staked, in tokens or dollars - the result is in the same unit. */
  principal: number;
  /** Rate in percent. */
  rate: number;
  rateType: RateType;
  /** Provider commission taken from rewards, percent (0 if the rate is already net). */
  commissionPct?: number;
  months: number;
  /** Rewards added to the stake (compounding) or paid out. */
  restake: boolean;
  /** Payouts / compounding events per year (365 daily, 52 weekly, 12 monthly...). */
  periodsPerYear: number;
}

export interface StakingMonth {
  month: number;
  balance: number;
  cumulativeRewards: number;
}

export interface StakingResult {
  rewards: number;
  finalBalance: number;
  /** Effective annual yield actually earned, % (after commission, incl. compounding if restaked). */
  effectiveApy: number;
  /** Net rate after commission, in the input's rate type. */
  netRate: number;
  months: StakingMonth[];
}

/** Convert any rate to the periodic rate per payout. */
function periodicRate(rate: number, type: RateType, n: number): number {
  const r = rate / 100;
  return type === 'apy' ? Math.pow(1 + r, 1 / n) - 1 : r / n;
}

export function calculateStaking(input: StakingInput): StakingResult {
  const principal = Math.max(0, input.principal);
  const months = Math.max(0, Math.round(input.months));
  const n = Math.max(1, input.periodsPerYear);
  const netRate = input.rate * (1 - Math.min(100, Math.max(0, input.commissionPct ?? 0)) / 100);
  const p = periodicRate(netRate, input.rateType, n);

  const balanceAt = (years: number) =>
    input.restake ? principal * Math.pow(1 + p, n * years) : principal * (1 + p * n * years);

  const rows: StakingMonth[] = [];
  for (let m = 1; m <= months; m++) {
    const b = balanceAt(m / 12);
    rows.push({ month: m, balance: b, cumulativeRewards: b - principal });
  }

  const final = balanceAt(months / 12);
  const rewards = final - principal;
  const years = months / 12;
  const effectiveApy =
    principal > 0 && years > 0 ? (Math.pow(final / principal, 1 / years) - 1) * 100 : input.restake ? (Math.pow(1 + p, n) - 1) * 100 : p * n * 100;

  return { rewards, finalBalance: final, effectiveApy, netRate, months: rows };
}

/** How many years until the stake doubles when rewards are restaked. */
export function yearsToDouble(ratePct: number, type: RateType, periodsPerYear: number): number | null {
  const p = periodicRate(ratePct, type, Math.max(1, periodsPerYear));
  if (p <= 0) return null;
  return Math.log(2) / (Math.max(1, periodsPerYear) * Math.log(1 + p));
}
