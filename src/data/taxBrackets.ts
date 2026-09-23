/**
 * US federal income tax parameters by tax year and filing status.
 *
 * Single source of truth for every calculator on the site (the /calculators tax
 * tab, the retirement calculator and the tax-report service). Do not copy these
 * numbers elsewhere - import them.
 *
 * Sources (checked 2026-09-23):
 *  - Tax year 2025: IRS Rev. Proc. 2024-40, with the standard deduction as amended
 *    by the One, Big, Beautiful Bill Act (P.L. 119-21, July 2025).
 *  - Tax year 2026: IRS Rev. Proc. 2025-32 (IRS news release, Oct 2025).
 *  - Net investment income tax: IRC §1411 - 3.8%, thresholds fixed in statute
 *    (not inflation-indexed).
 * Add a new year by appending an entry; nothing else needs to change.
 */

export type FilingStatus =
  | 'single'
  | 'married_filing_jointly'
  | 'married_filing_separately'
  | 'head_of_household';

export const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  single: 'Single',
  married_filing_jointly: 'Married filing jointly',
  married_filing_separately: 'Married filing separately',
  head_of_household: 'Head of household',
};

export const FILING_STATUSES = Object.keys(FILING_STATUS_LABELS) as FilingStatus[];

export interface Bracket {
  /** Upper bound of taxable income for this rate (Infinity for the top bracket). */
  upTo: number;
  rate: number;
}

export interface FederalYearStatus {
  ordinary: Bracket[];
  /** Long-term gains / qualified dividends: 0% up to zeroUpTo, 15% up to fifteenUpTo, then 20%. */
  ltcg: { zeroUpTo: number; fifteenUpTo: number };
  standardDeduction: number;
}

const b = (tops: number[]): Bracket[] => {
  const rates = [0.1, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37];
  return rates.map((rate, i) => ({ upTo: i < tops.length ? tops[i] : Infinity, rate }));
};

export const TAX_YEARS = [2025, 2026] as const;
export type TaxYear = (typeof TAX_YEARS)[number];
export const DEFAULT_TAX_YEAR: TaxYear = 2026;

export const FEDERAL_TAX_DATA: Record<TaxYear, Record<FilingStatus, FederalYearStatus>> = {
  2025: {
    single: {
      ordinary: b([11925, 48475, 103350, 197300, 250525, 626350]),
      ltcg: { zeroUpTo: 48350, fifteenUpTo: 533400 },
      standardDeduction: 15750,
    },
    married_filing_jointly: {
      ordinary: b([23850, 96950, 206700, 394600, 501050, 751600]),
      ltcg: { zeroUpTo: 96700, fifteenUpTo: 600050 },
      standardDeduction: 31500,
    },
    married_filing_separately: {
      ordinary: b([11925, 48475, 103350, 197300, 250525, 375800]),
      ltcg: { zeroUpTo: 48350, fifteenUpTo: 300000 },
      standardDeduction: 15750,
    },
    head_of_household: {
      ordinary: b([17000, 64850, 103350, 197300, 250500, 626350]),
      ltcg: { zeroUpTo: 64750, fifteenUpTo: 566700 },
      standardDeduction: 23625,
    },
  },
  2026: {
    single: {
      ordinary: b([12400, 50400, 105700, 201775, 256225, 640600]),
      ltcg: { zeroUpTo: 49450, fifteenUpTo: 545500 },
      standardDeduction: 16100,
    },
    married_filing_jointly: {
      ordinary: b([24800, 100800, 211400, 403550, 512450, 768700]),
      ltcg: { zeroUpTo: 98900, fifteenUpTo: 613700 },
      standardDeduction: 32200,
    },
    married_filing_separately: {
      ordinary: b([12400, 50400, 105700, 201775, 256225, 384350]),
      ltcg: { zeroUpTo: 49450, fifteenUpTo: 306850 },
      standardDeduction: 16100,
    },
    head_of_household: {
      ordinary: b([17700, 67450, 105700, 201750, 256200, 640600]),
      ltcg: { zeroUpTo: 66200, fifteenUpTo: 579600 },
      standardDeduction: 24150,
    },
  },
};

/** Net investment income tax (IRC §1411). Thresholds are statutory and not indexed. */
export const NIIT_RATE = 0.038;
export const NIIT_THRESHOLDS: Record<FilingStatus, number> = {
  single: 200000,
  married_filing_jointly: 250000,
  married_filing_separately: 125000,
  head_of_household: 200000,
};

/** Net capital losses deductible against ordinary income per year (IRC §1211(b)). */
export const CAPITAL_LOSS_LIMIT: Record<FilingStatus, number> = {
  single: 3000,
  married_filing_jointly: 3000,
  married_filing_separately: 1500,
  head_of_household: 3000,
};

export const TAX_DATA_META = {
  lastVerified: '2026-09-23',
  sources: [
    { label: 'IRS Rev. Proc. 2024-40 (tax year 2025)', url: 'https://www.irs.gov/pub/irs-drop/rp-24-40.pdf' },
    { label: 'IRS Rev. Proc. 2025-32 (tax year 2026)', url: 'https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill' },
    { label: 'IRS Topic 409, Capital gains and losses', url: 'https://www.irs.gov/taxtopics/tc409' },
    { label: 'IRS Topic 559, Net investment income tax', url: 'https://www.irs.gov/taxtopics/tc559' },
  ],
} as const;

export function isTaxYear(value: unknown): value is TaxYear {
  return TAX_YEARS.includes(Number(value) as TaxYear);
}

export function isFilingStatus(value: unknown): value is FilingStatus {
  return typeof value === 'string' && value in FILING_STATUS_LABELS;
}

export function getFederalTaxData(year: TaxYear, status: FilingStatus): FederalYearStatus {
  return FEDERAL_TAX_DATA[year][status];
}

/** Tax on ordinary taxable income using a progressive bracket table. */
export function bracketTax(taxable: number, brackets: Bracket[]): number {
  let tax = 0;
  let lower = 0;
  for (const br of brackets) {
    if (taxable <= lower) break;
    tax += (Math.min(taxable, br.upTo) - lower) * br.rate;
    lower = br.upTo;
  }
  return tax;
}

/** Marginal ordinary rate at a given taxable income. */
export function marginalRate(taxable: number, brackets: Bracket[]): number {
  for (const br of brackets) {
    if (taxable <= br.upTo) return br.rate;
  }
  return brackets[brackets.length - 1].rate;
}

/**
 * Tax on long-term gains stacked on top of ordinary taxable income, across the
 * 0/15/20% bands. `ordinaryTaxable` fills the bands first.
 */
export function stackedLtcgTax(
  ordinaryTaxable: number,
  ltGain: number,
  ltcg: FederalYearStatus['ltcg']
): number {
  if (ltGain <= 0) return 0;
  const start = Math.max(0, ordinaryTaxable);
  const end = start + ltGain;
  const inBand = (lo: number, hi: number) => Math.max(0, Math.min(end, hi) - Math.max(start, lo));
  return inBand(ltcg.zeroUpTo, ltcg.fifteenUpTo) * 0.15 + inBand(ltcg.fifteenUpTo, Infinity) * 0.2;
}

export interface FederalTaxInput {
  data: FederalYearStatus;
  status: FilingStatus;
  /** Wages and other ordinary income, before the standard deduction. */
  ordinaryIncome: number;
  /** Net short-term capital gain (negative = loss). */
  shortTermGain: number;
  /** Net long-term capital gain (negative = loss). */
  longTermGain: number;
  /** Include the 3.8% NIIT. Default true. */
  includeNiit?: boolean;
}

export interface FederalTaxBreakdown {
  taxableIncome: number;
  standardDeduction: number;
  ordinaryTax: number;
  ltcgTax: number;
  niit: number;
  total: number;
  /** Capital loss used against ordinary income this year. */
  lossDeduction: number;
  /** Net capital loss left to carry forward. */
  lossCarryforward: number;
  netShortTerm: number;
  netLongTerm: number;
}

/**
 * Federal income tax for one year with the standard deduction, short/long-term
 * netting, the $3,000 loss limit, LTCG stacking and the NIIT. Ignores credits,
 * itemized deductions, AMT and the QBI deduction - it is an estimate.
 */
export function computeFederalTax(input: FederalTaxInput): FederalTaxBreakdown {
  const { data, status } = input;
  let st = input.shortTermGain;
  let lt = input.longTermGain;

  // Net short- and long-term against each other (Schedule D ordering).
  if (st < 0 && lt > 0) {
    const net = lt + st;
    if (net >= 0) { lt = net; st = 0; } else { st = net; lt = 0; }
  } else if (lt < 0 && st > 0) {
    const net = st + lt;
    if (net >= 0) { st = net; lt = 0; } else { lt = net; st = 0; }
  }

  const netLoss = Math.min(0, st) + Math.min(0, lt);
  const lossDeduction = Math.min(Math.max(0, -netLoss), CAPITAL_LOSS_LIMIT[status]);
  const lossCarryforward = Math.max(0, -netLoss - lossDeduction);

  const posSt = Math.max(0, st);
  const posLt = Math.max(0, lt);
  const agi = Math.max(0, input.ordinaryIncome) + posSt + posLt - lossDeduction;
  const taxableIncome = Math.max(0, agi - data.standardDeduction);

  const preferential = Math.min(posLt, taxableIncome);
  const ordinaryTaxable = taxableIncome - preferential;
  const ordinaryTax = bracketTax(ordinaryTaxable, data.ordinary);
  const ltcgTax = stackedLtcgTax(ordinaryTaxable, preferential, data.ltcg);

  const netInvestmentIncome = posSt + posLt;
  const niit =
    input.includeNiit === false
      ? 0
      : NIIT_RATE * Math.max(0, Math.min(netInvestmentIncome, agi - NIIT_THRESHOLDS[status]));

  return {
    taxableIncome,
    standardDeduction: data.standardDeduction,
    ordinaryTax,
    ltcgTax,
    niit,
    total: ordinaryTax + ltcgTax + niit,
    lossDeduction,
    lossCarryforward,
    netShortTerm: st,
    netLongTerm: lt,
  };
}
