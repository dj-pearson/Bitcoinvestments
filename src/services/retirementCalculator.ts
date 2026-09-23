/**
 * Crypto retirement calculator engine.
 *
 * Model (documented on the page under "How this calculator works"):
 *  - Everything is in TODAY'S dollars. Nominal return assumptions are converted
 *    to real returns with the inflation input, and spending, Social Security and
 *    tax brackets stay in today's dollars. That is equivalent to inflating all of
 *    them every year (Social Security and federal brackets are CPI-indexed), and
 *    it keeps every figure on the page comparable with today's prices.
 *  - Two sleeves: non-crypto savings (a stock/bond mix) and crypto. New monthly
 *    contributions are split between them by the "crypto share" slider.
 *  - One return model everywhere: each sleeve's annual gross return is
 *    lognormal with the given average and volatility (it can never fall below
 *    -100%). The year-by-year table uses the median of that distribution; the
 *    Monte Carlo draws from it. Accumulation and retirement use the same mix.
 *  - Retirement withdrawals cover spending minus guaranteed income, grossed up
 *    for federal + state tax on the withdrawal (current-year brackets, standard
 *    deduction, 0/15/20% stacking for crypto gains, simplified Social Security
 *    taxation). Withdrawals come from both sleeves in proportion to their value.
 */

import {
  DEFAULT_TAX_YEAR,
  computeFederalTax,
  getFederalTaxData,
  type FilingStatus,
} from '../data/taxBrackets';
import { estimateStateCapitalGainsTax, stateRateFor, STATE_TAX_BY_CODE } from '../data/stateTaxRates';

export type NonCryptoAccountType = 'pre_tax' | 'roth' | 'taxable';

export interface RetirementPlanInputs {
  current_age: number;
  retirement_age: number;
  life_expectancy: number;
  /** Non-crypto retirement savings today ($). */
  current_savings: number;
  /** Crypto holdings today ($). */
  current_crypto: number;
  /** What you paid for the crypto you hold today ($); used to estimate taxable gains. */
  crypto_cost_basis: number;
  /** Total monthly saving ($), split by crypto_contribution_percent. */
  monthly_contribution: number;
  /** Share of each month's saving that buys crypto (0-100). */
  crypto_contribution_percent: number;
  /** Real (after-inflation) yearly growth of contributions, %. */
  contribution_growth: number;
  /** Spending needed per year in retirement, today's $. */
  desired_annual_income: number;
  /** Social Security per year, today's $. */
  social_security_income: number;
  social_security_start_age: number;
  /** Other inflation-adjusted income per year in retirement (pension etc.), today's $. */
  other_income: number;
  account_type: NonCryptoAccountType;
  filing_status: FilingStatus;
  state: string;
  /** Decimal assumptions (nominal, before inflation). */
  inflation_rate: number;
  stock_return: number;
  bond_return: number;
  /** Share of non-crypto savings in stocks (0-100). */
  stock_percent: number;
  crypto_return: number;
  crypto_volatility: number;
}

/** Volatilities for the non-crypto sleeve (annual standard deviation). */
export const STOCK_VOLATILITY = 0.16;
export const BOND_VOLATILITY = 0.06;

/**
 * Default assumptions. Sources for the page's assumptions table:
 *  - Inflation 2.5%: close to the Fed's 2% target plus recent overshoot; CPI
 *    averaged ~2.5-3% over the last 30 years (BLS CPI-U).
 *  - Stocks 7% nominal: below the ~10% US large-cap average since 1926
 *    (S&P 500 total return), in line with lower forward-looking estimates.
 *  - Bonds 4% nominal: roughly today's intermediate Treasury / aggregate bond yield.
 *  - Crypto 15% average with 55% volatility: an assumption, not a forecast.
 *    Bitcoin's realised annual volatility has mostly ranged 40-80%; there is no
 *    reliable long-run expected return for crypto.
 */
export const DEFAULT_RETIREMENT_INPUTS: RetirementPlanInputs = {
  current_age: 35,
  retirement_age: 65,
  life_expectancy: 92,
  current_savings: 100000,
  current_crypto: 20000,
  crypto_cost_basis: 15000,
  monthly_contribution: 1200,
  crypto_contribution_percent: 10,
  contribution_growth: 1,
  desired_annual_income: 70000,
  social_security_income: 24000,
  social_security_start_age: 67,
  other_income: 0,
  account_type: 'pre_tax',
  filing_status: 'single',
  state: 'TX',
  inflation_rate: 0.025,
  stock_return: 0.07,
  bond_return: 0.04,
  stock_percent: 60,
  crypto_return: 0.15,
  crypto_volatility: 0.55,
};

export interface YearRow {
  age: number;
  contributions: number;
  crypto_value: number;
  traditional_value: number;
  portfolio_value: number;
  /** Gross withdrawal (spending gap + tax). */
  withdrawals: number;
  taxes: number;
  guaranteed_income: number;
  spending: number;
}

export interface RetirementResult {
  inputs: RetirementPlanInputs;
  years_to_retirement: number;
  years_in_retirement: number;
  /** Portfolio at the start of the retirement year, before the first withdrawal. */
  projected_savings_at_retirement: number;
  /** Savings needed at retirement to last to life expectancy (median returns). */
  total_needed_at_retirement: number;
  /** projected / needed; Infinity when guaranteed income covers all spending. */
  funding_ratio: number;
  funding_gap: number;
  /** Age the median-path portfolio runs out, or null if it lasts. */
  depletion_age: number | null;
  yearly: YearRow[];
  monte_carlo: MonteCarloSummary;
  lifetime_taxes: number;
  lifetime_withdrawals: number;
  what_if: WhatIf[];
}

export interface MonteCarloSummary {
  simulations: number;
  /** % of simulations that funded spending every year to life expectancy. */
  success_probability: number;
  /** Ending balance percentiles (today's $, 0 when depleted). */
  percentiles: { percentile: number; ending_balance: number }[];
  /** Median age at which failing runs ran out, or null. */
  median_depletion_age: number | null;
}

export interface WhatIf {
  label: string;
  description: string;
  success_probability: number;
  change: number;
}

export interface ValidationError {
  field: keyof RetirementPlanInputs;
  message: string;
}

export function validateInputs(i: RetirementPlanInputs): ValidationError[] {
  const errors: ValidationError[] = [];
  const num = (v: number) => Number.isFinite(v);
  if (!num(i.current_age) || i.current_age < 16 || i.current_age > 100) {
    errors.push({ field: 'current_age', message: 'Current age must be between 16 and 100.' });
  }
  if (!num(i.retirement_age) || i.retirement_age <= i.current_age) {
    errors.push({ field: 'retirement_age', message: 'Retirement age must be after your current age.' });
  }
  if (!num(i.life_expectancy) || i.life_expectancy <= i.retirement_age || i.life_expectancy > 120) {
    errors.push({ field: 'life_expectancy', message: 'Plan-to age must be after retirement age (max 120).' });
  }
  for (const f of ['current_savings', 'current_crypto', 'crypto_cost_basis', 'monthly_contribution', 'desired_annual_income', 'social_security_income', 'other_income'] as const) {
    if (!num(i[f]) || i[f] < 0) errors.push({ field: f, message: 'Enter an amount of $0 or more.' });
  }
  if (i.crypto_volatility < 0 || i.crypto_volatility > 2) {
    errors.push({ field: 'crypto_volatility', message: 'Volatility should be between 0% and 200%.' });
  }
  if (i.inflation_rate <= -0.5 || i.inflation_rate > 0.5) {
    errors.push({ field: 'inflation_rate', message: 'Inflation should be between -50% and 50%.' });
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Return model
// ---------------------------------------------------------------------------

interface Lognormal {
  mu: number;
  sigma: number;
}

/** Lognormal parameters for a gross return with arithmetic mean `m` and s.d. `s`. */
function lognormal(m: number, s: number): Lognormal {
  const g = Math.max(1 + m, 0.01);
  const sigma2 = Math.log(1 + (s * s) / (g * g));
  return { mu: Math.log(g) - sigma2 / 2, sigma: Math.sqrt(sigma2) };
}

function toReal(nominal: number, inflation: number): number {
  return (1 + nominal) / (1 + inflation) - 1;
}

interface ReturnModel {
  traditional: Lognormal;
  crypto: Lognormal;
}

function buildReturnModel(i: RetirementPlanInputs): ReturnModel {
  const w = Math.min(100, Math.max(0, i.stock_percent)) / 100;
  const mean = w * i.stock_return + (1 - w) * i.bond_return;
  // Stocks and bonds treated as uncorrelated.
  const sd = Math.sqrt((w * STOCK_VOLATILITY) ** 2 + ((1 - w) * BOND_VOLATILITY) ** 2);
  return {
    traditional: lognormal(toReal(mean, i.inflation_rate), sd / (1 + i.inflation_rate)),
    crypto: lognormal(toReal(i.crypto_return, i.inflation_rate), i.crypto_volatility / (1 + i.inflation_rate)),
  };
}

/** Median gross return factor. */
const medianFactor = (l: Lognormal) => Math.exp(l.mu);

/** Seeded PRNG (mulberry32) so identical inputs always give identical results. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number): number {
  let u = 0;
  while (u === 0) u = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

// ---------------------------------------------------------------------------
// Taxes on a retirement year (today's dollars)
// ---------------------------------------------------------------------------

/** Taxable part of Social Security (simplified IRC §86 formula, thresholds not indexed). */
function taxableSocialSecurity(ss: number, otherIncome: number, status: FilingStatus): number {
  if (ss <= 0) return 0;
  const [base1, base2] =
    status === 'married_filing_jointly' ? [32000, 44000] : status === 'married_filing_separately' ? [0, 0] : [25000, 34000];
  const provisional = otherIncome + ss / 2;
  if (provisional <= base1) return 0;
  const tier1 = Math.min(0.5 * (provisional - base1), 0.5 * (base2 - base1));
  const tier2 = 0.85 * Math.max(0, provisional - base2);
  return Math.min(0.85 * ss, tier1 + tier2);
}

interface YearTaxInput {
  inputs: RetirementPlanInputs;
  traditionalWithdrawal: number;
  cryptoGain: number;
  socialSecurity: number;
  otherIncome: number;
}

function yearTax({ inputs, traditionalWithdrawal, cryptoGain, socialSecurity, otherIncome }: YearTaxInput): number {
  const data = getFederalTaxData(DEFAULT_TAX_YEAR, inputs.filing_status);
  const ordinaryWithdrawal = inputs.account_type === 'pre_tax' ? traditionalWithdrawal : 0;
  // Taxable-account withdrawals: treat half as long-term gain (no basis tracking for this sleeve).
  const taxableGain = inputs.account_type === 'taxable' ? traditionalWithdrawal * 0.5 : 0;
  const nonSsIncome = ordinaryWithdrawal + otherIncome;
  const ssTaxable = taxableSocialSecurity(socialSecurity, nonSsIncome + cryptoGain + taxableGain, inputs.filing_status);
  const fed = computeFederalTax({
    data,
    status: inputs.filing_status,
    ordinaryIncome: nonSsIncome + ssTaxable,
    shortTermGain: 0,
    longTermGain: cryptoGain + taxableGain,
  });
  const state = STATE_TAX_BY_CODE[inputs.state];
  let stateTax = 0;
  if (state) {
    stateTax += estimateStateCapitalGainsTax(inputs.state, DEFAULT_TAX_YEAR, 0, cryptoGain + taxableGain);
    // Ordinary retirement income at the state's top rate (simplified; many states exempt some of it).
    stateTax += nonSsIncome * stateRateFor(inputs.state, DEFAULT_TAX_YEAR);
  }
  return fed.total + stateTax;
}

// ---------------------------------------------------------------------------
// Simulation core (shared by the table and the Monte Carlo)
// ---------------------------------------------------------------------------

interface SimState {
  traditional: number;
  crypto: number;
  cryptoBasis: number;
}

interface RetirementYearOutcome {
  withdrawal: number;
  tax: number;
  shortfall: boolean;
}

/** Spend one retirement year from `s` (mutates). Returns what was withdrawn. */
function spendYear(inputs: RetirementPlanInputs, s: SimState, age: number): RetirementYearOutcome & { guaranteed: number; spending: number } {
  const ss = age >= inputs.social_security_start_age ? inputs.social_security_income : 0;
  const guaranteed = ss + inputs.other_income;
  const spending = inputs.desired_annual_income;
  const need = Math.max(0, spending - guaranteed);
  const total = s.traditional + s.crypto;
  if (need === 0) return { withdrawal: 0, tax: 0, shortfall: false, guaranteed, spending };
  if (total <= 0) return { withdrawal: 0, tax: 0, shortfall: true, guaranteed, spending };

  const cryptoShare = s.crypto / total;
  const gainFraction = s.crypto > 0 ? Math.max(0, 1 - s.cryptoBasis / s.crypto) : 0;

  // Gross up: withdrawal W must cover need + tax(W). Three fixed-point passes get within a few dollars.
  let w = need;
  let tax = 0;
  for (let k = 0; k < 3; k++) {
    tax = yearTax({
      inputs,
      traditionalWithdrawal: w * (1 - cryptoShare),
      cryptoGain: w * cryptoShare * gainFraction,
      socialSecurity: ss,
      otherIncome: inputs.other_income,
    });
    w = need + tax;
  }

  const shortfall = w > total;
  const take = Math.min(w, total);
  const fromCrypto = take * cryptoShare;
  if (s.crypto > 0) s.cryptoBasis *= 1 - fromCrypto / s.crypto;
  s.crypto -= fromCrypto;
  s.traditional -= take - fromCrypto;
  return { withdrawal: take, tax: Math.min(tax, take), shortfall, guaranteed, spending };
}

function contributionForYear(inputs: RetirementPlanInputs, yearIndex: number) {
  const total = inputs.monthly_contribution * 12 * Math.pow(1 + inputs.contribution_growth / 100, yearIndex);
  const crypto = total * Math.min(100, Math.max(0, inputs.crypto_contribution_percent)) / 100;
  return { total, crypto, traditional: total - crypto };
}

function initialState(inputs: RetirementPlanInputs): SimState {
  return {
    traditional: inputs.current_savings,
    crypto: inputs.current_crypto,
    cryptoBasis: inputs.current_crypto > 0 ? inputs.crypto_cost_basis : 0,
  };
}

/** Deterministic path at median returns. */
function medianPath(inputs: RetirementPlanInputs, model: ReturnModel) {
  const s = initialState(inputs);
  const rows: YearRow[] = [];
  const tf = medianFactor(model.traditional);
  const cf = medianFactor(model.crypto);
  let savingsAtRetirement = 0;
  let depletionAge: number | null = null;
  let lifetimeTaxes = 0;
  let lifetimeWithdrawals = 0;

  for (let age = inputs.current_age; age < inputs.life_expectancy; age++) {
    const idx = age - inputs.current_age;
    if (age < inputs.retirement_age) {
      const c = contributionForYear(inputs, idx);
      s.traditional = s.traditional * tf + c.traditional;
      s.crypto = s.crypto * cf + c.crypto;
      s.cryptoBasis += c.crypto;
      rows.push(row(age, c.total, s, 0, 0, 0, 0));
    } else {
      if (age === inputs.retirement_age) savingsAtRetirement = s.traditional + s.crypto;
      const out = spendYear(inputs, s, age);
      lifetimeTaxes += out.tax;
      lifetimeWithdrawals += out.withdrawal;
      if (out.shortfall && depletionAge === null) depletionAge = age;
      s.traditional = Math.max(0, s.traditional) * tf;
      s.crypto = Math.max(0, s.crypto) * cf;
      rows.push(row(age, 0, s, out.withdrawal, out.tax, out.guaranteed, out.spending));
    }
  }
  return { rows, savingsAtRetirement, depletionAge, lifetimeTaxes, lifetimeWithdrawals, stateAtRetirement: s };
}

function row(age: number, contributions: number, s: SimState, withdrawals: number, taxes: number, guaranteed: number, spending: number): YearRow {
  return {
    age,
    contributions: Math.round(contributions),
    crypto_value: Math.round(Math.max(0, s.crypto)),
    traditional_value: Math.round(Math.max(0, s.traditional)),
    portfolio_value: Math.round(Math.max(0, s.crypto) + Math.max(0, s.traditional)),
    withdrawals: Math.round(withdrawals),
    taxes: Math.round(taxes),
    guaranteed_income: Math.round(guaranteed),
    spending: Math.round(spending),
  };
}

/**
 * Smallest balance at retirement (same crypto share and basis ratio as the
 * projected one) that lasts to life expectancy at median returns.
 */
function neededAtRetirement(inputs: RetirementPlanInputs, model: ReturnModel, projected: SimState): number {
  const total = projected.traditional + projected.crypto;
  const cryptoShare = total > 0 ? projected.crypto / total : inputs.crypto_contribution_percent / 100;
  const basisRatio = projected.crypto > 0 ? projected.cryptoBasis / projected.crypto : 1;
  const tf = medianFactor(model.traditional);
  const cf = medianFactor(model.crypto);

  const lasts = (start: number): boolean => {
    const s: SimState = { traditional: start * (1 - cryptoShare), crypto: start * cryptoShare, cryptoBasis: start * cryptoShare * basisRatio };
    for (let age = inputs.retirement_age; age < inputs.life_expectancy; age++) {
      const out = spendYear(inputs, s, age);
      if (out.shortfall) return false;
      s.traditional *= tf;
      s.crypto *= cf;
    }
    return true;
  };

  if (lasts(0)) return 0;
  let lo = 0;
  let hi = 1_000_000;
  while (!lasts(hi) && hi < 1e11) hi *= 2;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (lasts(mid)) hi = mid; else lo = mid;
  }
  return hi;
}

export function runMonteCarlo(inputs: RetirementPlanInputs, simulations = 1000, seed = 20260923): MonteCarloSummary {
  const model = buildReturnModel(inputs);
  const rand = rng(seed);
  const endings: number[] = [];
  const depletionAges: number[] = [];
  let failures = 0;

  for (let n = 0; n < simulations; n++) {
    const s = initialState(inputs);
    let failedAt: number | null = null;
    for (let age = inputs.current_age; age < inputs.life_expectancy; age++) {
      const tr = Math.exp(model.traditional.mu + model.traditional.sigma * gaussian(rand));
      const cr = Math.exp(model.crypto.mu + model.crypto.sigma * gaussian(rand));
      if (age < inputs.retirement_age) {
        const c = contributionForYear(inputs, age - inputs.current_age);
        s.traditional = s.traditional * tr + c.traditional;
        s.crypto = s.crypto * cr + c.crypto;
        s.cryptoBasis += c.crypto;
      } else {
        const out = spendYear(inputs, s, age);
        if (out.shortfall) {
          failedAt = age;
          break;
        }
        s.traditional *= tr;
        s.crypto *= cr;
      }
    }
    if (failedAt !== null) {
      failures++;
      depletionAges.push(failedAt);
      endings.push(0);
    } else {
      endings.push(Math.max(0, s.traditional) + Math.max(0, s.crypto));
    }
  }

  endings.sort((a, b) => a - b);
  depletionAges.sort((a, b) => a - b);
  const pct = (p: number) => endings[Math.min(endings.length - 1, Math.floor((p / 100) * endings.length))] ?? 0;

  return {
    simulations,
    success_probability: ((simulations - failures) / simulations) * 100,
    percentiles: [10, 25, 50, 75, 90].map((p) => ({ percentile: p, ending_balance: Math.round(pct(p)) })),
    median_depletion_age: depletionAges.length ? depletionAges[Math.floor(depletionAges.length / 2)] : null,
  };
}

export function calculateRetirement(inputs: RetirementPlanInputs, simulations = 1000): RetirementResult {
  const model = buildReturnModel(inputs);
  const path = medianPath(inputs, model);

  // Rebuild the state at the start of retirement for the "needed" search.
  const atRetirement = initialState(inputs);
  const tf = medianFactor(model.traditional);
  const cf = medianFactor(model.crypto);
  for (let age = inputs.current_age; age < inputs.retirement_age; age++) {
    const c = contributionForYear(inputs, age - inputs.current_age);
    atRetirement.traditional = atRetirement.traditional * tf + c.traditional;
    atRetirement.crypto = atRetirement.crypto * cf + c.crypto;
    atRetirement.cryptoBasis += c.crypto;
  }

  const projected = atRetirement.traditional + atRetirement.crypto;
  const needed = neededAtRetirement(inputs, model, atRetirement);
  const monte = runMonteCarlo(inputs, simulations);

  const whatIf: WhatIf[] = [];
  const probe = (label: string, description: string, changed: RetirementPlanInputs) => {
    const p = runMonteCarlo(changed, Math.min(simulations, 400)).success_probability;
    whatIf.push({ label, description, success_probability: p, change: p - monte.success_probability });
  };
  probe('Save 25% more each month', `Monthly saving of $${Math.round(inputs.monthly_contribution * 1.25).toLocaleString()} instead of $${Math.round(inputs.monthly_contribution).toLocaleString()}.`, {
    ...inputs,
    monthly_contribution: inputs.monthly_contribution * 1.25,
  });
  probe('Spend 10% less in retirement', `$${Math.round(inputs.desired_annual_income * 0.9).toLocaleString()} a year instead of $${Math.round(inputs.desired_annual_income).toLocaleString()}.`, {
    ...inputs,
    desired_annual_income: inputs.desired_annual_income * 0.9,
  });
  if (inputs.retirement_age + 2 < inputs.life_expectancy) {
    probe('Retire 2 years later', `Retire at ${inputs.retirement_age + 2} (Social Security start age unchanged).`, {
      ...inputs,
      retirement_age: inputs.retirement_age + 2,
    });
  }
  probe(
    inputs.crypto_contribution_percent > 0 ? 'No new crypto buys' : 'Put 10% of savings into crypto',
    inputs.crypto_contribution_percent > 0
      ? 'Same monthly saving, all into the stock/bond mix.'
      : '10% of each month’s saving buys crypto.',
    { ...inputs, crypto_contribution_percent: inputs.crypto_contribution_percent > 0 ? 0 : 10 }
  );

  const fundingRatio = needed === 0 ? Infinity : projected / needed;

  return {
    inputs,
    years_to_retirement: inputs.retirement_age - inputs.current_age,
    years_in_retirement: inputs.life_expectancy - inputs.retirement_age,
    projected_savings_at_retirement: Math.round(projected),
    total_needed_at_retirement: Math.round(needed),
    funding_ratio: fundingRatio,
    funding_gap: Math.round(Math.max(0, needed - projected)),
    depletion_age: path.depletionAge,
    yearly: path.rows,
    monte_carlo: monte,
    lifetime_taxes: Math.round(path.lifetimeTaxes),
    lifetime_withdrawals: Math.round(path.lifetimeWithdrawals),
    what_if: whatIf,
  };
}

/** Median annual real return used by the table, for display. */
export function medianRealReturns(inputs: RetirementPlanInputs): { traditional: number; crypto: number } {
  const m = buildReturnModel(inputs);
  return { traditional: medianFactor(m.traditional) - 1, crypto: medianFactor(m.crypto) - 1 };
}

export function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) return '—';
  const sign = amount < 0 ? '-' : '';
  const a = Math.abs(amount);
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e4) return `${sign}$${(a / 1e3).toFixed(0)}K`;
  return `${sign}$${a.toFixed(0)}`;
}

export function getSuccessColor(probability: number): string {
  if (probability >= 80) return 'text-green-500';
  if (probability >= 60) return 'text-yellow-500';
  if (probability >= 40) return 'text-orange-500';
  return 'text-red-500';
}

/** JSON download of inputs and results (not a PDF). */
export function exportResultJson(result: RetirementResult, generatedOn: string): string {
  return JSON.stringify(
    {
      note: 'Crypto retirement projection from bitcoinvestments.net/retirement-calculator. All amounts in today’s dollars. Estimates only, not financial advice.',
      generatedOn,
      summary: {
        successProbabilityPercent: Math.round(result.monte_carlo.success_probability * 10) / 10,
        projectedSavingsAtRetirement: result.projected_savings_at_retirement,
        neededAtRetirement: result.total_needed_at_retirement,
        fundingGap: result.funding_gap,
        depletionAgeMedianPath: result.depletion_age,
      },
      inputs: result.inputs,
      yearly: result.yearly,
    },
    null,
    2
  );
}
