/**
 * State tax on capital gains - one simplified table for the whole site.
 *
 * `rate` is the state's TOP marginal personal income tax rate, which is what most
 * states apply to capital gains (gains are taxed as ordinary income). Using the top
 * rate overstates the tax for moderate incomes in states with graduated brackets;
 * the UI says so. Local income taxes (NYC, MD counties, OH cities...) are ignored.
 *
 * `verified: true` rows were checked against state revenue departments / the Tax
 * Foundation's 2026 table on `STATE_TAX_META.lastVerified`. Rows marked false are
 * carried from the previous table and should be confirmed before relying on them.
 */

export interface StateTaxInfo {
  code: string;
  name: string;
  /** Top marginal rate for tax year 2026 (decimal). */
  rate: number;
  /** Tax year 2025 rate when it differs from 2026. */
  rate2025?: number;
  /** Share of long-term gains excluded from state taxable income (e.g. 0.4 = 40%). */
  ltExclusion?: number;
  /** State does not tax capital gains of individuals at all. */
  noCapitalGainsTax?: boolean;
  note?: string;
  verified: boolean;
}

export const STATE_TAX_META = {
  lastVerified: '2026-09-23',
  source: 'State revenue departments and Tax Foundation, "2026 State Income Tax Rates and Brackets"',
  sourceUrl: 'https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/',
} as const;

const NO_INCOME_TAX = 'No state personal income tax.';

export const STATE_TAX_TABLE: StateTaxInfo[] = [
  { code: 'AL', name: 'Alabama', rate: 0.05, verified: false },
  { code: 'AK', name: 'Alaska', rate: 0, noCapitalGainsTax: true, note: NO_INCOME_TAX, verified: true },
  { code: 'AZ', name: 'Arizona', rate: 0.025, note: 'Flat 2.5%.', verified: true },
  { code: 'AR', name: 'Arkansas', rate: 0.039, ltExclusion: 0.5, note: 'Top rate 3.9%; 50% of net long-term gains excluded.', verified: false },
  { code: 'CA', name: 'California', rate: 0.133, note: '12.3% top bracket plus 1% mental health surcharge above $1M. No preferential rate for long-term gains.', verified: true },
  { code: 'CO', name: 'Colorado', rate: 0.044, note: 'Flat 4.4% (temporary TABOR reductions in some years).', verified: false },
  { code: 'CT', name: 'Connecticut', rate: 0.0699, verified: false },
  { code: 'DE', name: 'Delaware', rate: 0.066, verified: false },
  { code: 'DC', name: 'District of Columbia', rate: 0.1075, verified: false },
  { code: 'FL', name: 'Florida', rate: 0, noCapitalGainsTax: true, note: NO_INCOME_TAX, verified: true },
  { code: 'GA', name: 'Georgia', rate: 0.0499, rate2025: 0.0519, note: 'Flat rate cut to 4.99% for 2026 (5.19% in 2025).', verified: true },
  { code: 'HI', name: 'Hawaii', rate: 0.11, note: 'Long-term gains are taxed at a separate 7.25% maximum rate; this estimate uses 11% for short-term gains and 7.25% for long-term.', verified: false },
  { code: 'ID', name: 'Idaho', rate: 0.053, note: 'Flat 5.3% since 2025.', verified: true },
  { code: 'IL', name: 'Illinois', rate: 0.0495, note: 'Flat 4.95%.', verified: false },
  { code: 'IN', name: 'Indiana', rate: 0.0295, rate2025: 0.03, note: 'Flat 2.95% for 2026 (3.0% in 2025), plus county income tax.', verified: true },
  { code: 'IA', name: 'Iowa', rate: 0.038, note: 'Flat 3.8% since 2025.', verified: true },
  { code: 'KS', name: 'Kansas', rate: 0.0558, verified: false },
  { code: 'KY', name: 'Kentucky', rate: 0.035, rate2025: 0.04, note: 'Flat 3.5% for 2026 (4.0% in 2025).', verified: true },
  { code: 'LA', name: 'Louisiana', rate: 0.03, note: 'Flat 3% since 2025.', verified: true },
  { code: 'ME', name: 'Maine', rate: 0.0715, verified: false },
  { code: 'MD', name: 'Maryland', rate: 0.065, note: 'New 6.25%/6.5% top brackets from 2025, plus a 2% surtax on net capital gains when federal AGI exceeds $350,000 and county income tax (not modelled).', verified: false },
  { code: 'MA', name: 'Massachusetts', rate: 0.05, note: '5% on long-term gains; short-term gains are taxed at 8.5%; 4% surtax on income above about $1.08M (not modelled).', verified: false },
  { code: 'MI', name: 'Michigan', rate: 0.0425, note: 'Flat 4.25%, plus city income tax in some cities.', verified: false },
  { code: 'MN', name: 'Minnesota', rate: 0.0985, note: 'Also a 1% surtax on net investment income above $1M (not modelled).', verified: false },
  { code: 'MS', name: 'Mississippi', rate: 0.04, rate2025: 0.044, note: 'Flat 4.0% for 2026 (4.4% in 2025).', verified: true },
  { code: 'MO', name: 'Missouri', rate: 0.047, noCapitalGainsTax: true, note: 'From tax year 2025, 100% of federally reported capital gains are subtracted for individuals (HB 594).', verified: true },
  { code: 'MT', name: 'Montana', rate: 0.0565, rate2025: 0.059, note: 'Top ordinary rate 5.65% for 2026; net long-term gains use lower capital gains rates (3.0%/4.1%) - this estimate applies 4.1% to long-term gains.', verified: false },
  { code: 'NE', name: 'Nebraska', rate: 0.0455, rate2025: 0.052, note: 'Top rate 4.55% for 2026 (5.2% in 2025).', verified: true },
  { code: 'NV', name: 'Nevada', rate: 0, noCapitalGainsTax: true, note: NO_INCOME_TAX, verified: true },
  { code: 'NH', name: 'New Hampshire', rate: 0, noCapitalGainsTax: true, note: 'No tax on wages or capital gains; the interest and dividends tax was repealed from 2025.', verified: true },
  { code: 'NJ', name: 'New Jersey', rate: 0.1075, verified: false },
  { code: 'NM', name: 'New Mexico', rate: 0.059, note: 'Top rate 5.9%; a limited capital gains deduction applies (not modelled).', verified: false },
  { code: 'NY', name: 'New York', rate: 0.109, note: 'Top rate 10.9%; NYC residents also pay city income tax (not modelled).', verified: true },
  { code: 'NC', name: 'North Carolina', rate: 0.0399, rate2025: 0.0425, note: 'Flat 3.99% for 2026 (4.25% in 2025).', verified: true },
  { code: 'ND', name: 'North Dakota', rate: 0.025, ltExclusion: 0.4, note: 'Top rate 2.5%; 40% of net long-term gains excluded.', verified: false },
  { code: 'OH', name: 'Ohio', rate: 0.0275, rate2025: 0.035, note: 'Ohio taxes capital gains. Flat 2.75% above the exempt amount for 2026 (3.5% top rate in 2025); municipal income taxes generally do not apply to capital gains.', verified: true },
  { code: 'OK', name: 'Oklahoma', rate: 0.045, rate2025: 0.0475, note: 'Top rate 4.5% for 2026 (4.75% in 2025).', verified: true },
  { code: 'OR', name: 'Oregon', rate: 0.099, verified: false },
  { code: 'PA', name: 'Pennsylvania', rate: 0.0307, note: 'Flat 3.07%, plus local earned income tax (not on gains).', verified: false },
  { code: 'RI', name: 'Rhode Island', rate: 0.0599, verified: false },
  { code: 'SC', name: 'South Carolina', rate: 0.0521, rate2025: 0.062, ltExclusion: 0.44, note: 'Top rate 5.21% for 2026 (6.2% in 2025); 44% of net long-term gains excluded.', verified: true },
  { code: 'SD', name: 'South Dakota', rate: 0, noCapitalGainsTax: true, note: NO_INCOME_TAX, verified: true },
  { code: 'TN', name: 'Tennessee', rate: 0, noCapitalGainsTax: true, note: NO_INCOME_TAX, verified: true },
  { code: 'TX', name: 'Texas', rate: 0, noCapitalGainsTax: true, note: NO_INCOME_TAX, verified: true },
  { code: 'UT', name: 'Utah', rate: 0.0445, rate2025: 0.045, note: 'Flat 4.45% for 2026 (4.5% in 2025).', verified: true },
  { code: 'VT', name: 'Vermont', rate: 0.0875, verified: false },
  { code: 'VA', name: 'Virginia', rate: 0.0575, verified: false },
  {
    code: 'WA',
    name: 'Washington',
    rate: 0,
    note: 'No wage income tax, but a 7% tax on long-term capital gains above an annual deduction ($278,000 for 2025, indexed; 2026 figure not yet published), plus 2.9% on taxable gains above $1M. Short-term gains are not taxed.',
    verified: true,
  },
  { code: 'WV', name: 'West Virginia', rate: 0.0458, rate2025: 0.0482, note: 'Top rate 4.58% for 2026 (4.82% in 2025).', verified: true },
  { code: 'WI', name: 'Wisconsin', rate: 0.0765, ltExclusion: 0.3, note: 'Top rate 7.65%; 30% of net long-term gains excluded.', verified: false },
  { code: 'WY', name: 'Wyoming', rate: 0, noCapitalGainsTax: true, note: NO_INCOME_TAX, verified: true },
];

export const STATE_TAX_BY_CODE: Record<string, StateTaxInfo> = Object.fromEntries(
  STATE_TAX_TABLE.map((s) => [s.code, s])
);

/** Washington capital gains tax parameters (RCW 82.87). */
export const WA_CAPITAL_GAINS = { deduction: 278000, rate: 0.07, surtaxAbove: 1_000_000, surtaxRate: 0.029 };

/** Top rate applied to capital gains for a state and year (0 when not taxed). */
export function stateRateFor(code: string, year: number): number {
  const s = STATE_TAX_BY_CODE[code];
  if (!s || s.noCapitalGainsTax) return 0;
  return year <= 2025 && s.rate2025 !== undefined ? s.rate2025 : s.rate;
}

/**
 * Simplified state tax on a year's net capital gains.
 * Losses produce 0 (state loss treatment varies).
 */
export function estimateStateCapitalGainsTax(
  code: string,
  year: number,
  shortTermGain: number,
  longTermGain: number
): number {
  const s = STATE_TAX_BY_CODE[code];
  if (!s) return 0;
  const st = Math.max(0, shortTermGain);
  const lt = Math.max(0, longTermGain);

  if (code === 'WA') {
    const taxable = Math.max(0, lt - WA_CAPITAL_GAINS.deduction);
    return taxable * WA_CAPITAL_GAINS.rate + Math.max(0, taxable - WA_CAPITAL_GAINS.surtaxAbove) * WA_CAPITAL_GAINS.surtaxRate;
  }
  if (s.noCapitalGainsTax) return 0;

  const rate = stateRateFor(code, year);
  let ltRate = rate;
  if (code === 'HI') ltRate = 0.0725;
  if (code === 'MT') ltRate = 0.041;
  const stRate = code === 'MA' ? 0.085 : rate;
  return st * stRate + lt * (1 - (s.ltExclusion ?? 0)) * ltRate;
}
