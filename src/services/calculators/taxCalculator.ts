import type { TaxCalculatorInput, TaxCalculatorResult } from '../../types';
import { classifyHoldingPeriod } from './holdingPeriod';
import { toLocalISODate } from '../../lib/utils';

import {
  DEFAULT_TAX_YEAR,
  computeFederalTax,
  getFederalTaxData,
  marginalRate,
  type FilingStatus,
  type TaxYear,
} from '../../data/taxBrackets';
import {
  STATE_TAX_BY_CODE,
  STATE_TAX_TABLE,
  estimateStateCapitalGainsTax,
  stateRateFor,
} from '../../data/stateTaxRates';

/**
 * Flat state rate per state code for the default tax year, derived from the one
 * dated table in src/data/stateTaxRates.ts. Kept for callers that apply a single
 * rate (the tax report service); new code should call estimateStateCapitalGainsTax.
 */
export const STATE_TAX_RATES: Record<string, number> = Object.fromEntries(
  STATE_TAX_TABLE.map((s) => [s.code, stateRateFor(s.code, DEFAULT_TAX_YEAR)])
);

export interface CryptoSaleTaxInput {
  taxYear: TaxYear;
  filingStatus: FilingStatus;
  /** Wages and other ordinary income for the year, before the standard deduction. */
  otherIncome: number;
  costBasis: number;
  proceeds: number;
  /** Fees paid to sell (reduce proceeds). */
  fees?: number;
  purchaseDate: string;
  saleDate: string;
  state?: string;
}

export interface CryptoSaleTaxResult {
  gain: number;
  holdingPeriod: 'short_term' | 'long_term';
  federalIncomeTax: number;
  niit: number;
  stateTax: number;
  totalTax: number;
  /** Total tax / gain (0 when there is no gain). */
  effectiveRate: number;
  /** Ordinary marginal bracket before the sale. */
  marginalOrdinaryRate: number;
  lossDeduction: number;
  lossCarryforward: number;
  /** Tax saved by a loss this year (negative tax change). */
  taxSavedByLoss: number;
  netAfterTax: number;
  standardDeduction: number;
}

/**
 * Incremental tax caused by one crypto sale: federal tax (brackets, 0/15/20%
 * stacking, NIIT) with the sale minus the same return without it, plus a
 * simplified state estimate. Estimate only - no credits, AMT, itemizing or
 * other gains/losses in the year.
 */
export function estimateCryptoSaleTax(input: CryptoSaleTaxInput): CryptoSaleTaxResult {
  const data = getFederalTaxData(input.taxYear, input.filingStatus);
  const gain = input.proceeds - (input.fees ?? 0) - input.costBasis;
  const holdingPeriod = classifyHoldingPeriod(
    new Date(`${input.purchaseDate}T00:00:00Z`),
    new Date(`${input.saleDate}T00:00:00Z`)
  );

  const base = computeFederalTax({
    data,
    status: input.filingStatus,
    ordinaryIncome: input.otherIncome,
    shortTermGain: 0,
    longTermGain: 0,
  });
  const withSale = computeFederalTax({
    data,
    status: input.filingStatus,
    ordinaryIncome: input.otherIncome,
    shortTermGain: holdingPeriod === 'short_term' ? gain : 0,
    longTermGain: holdingPeriod === 'long_term' ? gain : 0,
  });

  const federalIncomeTax = withSale.ordinaryTax + withSale.ltcgTax - (base.ordinaryTax + base.ltcgTax);
  const niit = withSale.niit - base.niit;
  const stateTax = input.state
    ? estimateStateCapitalGainsTax(
        input.state,
        input.taxYear,
        holdingPeriod === 'short_term' ? gain : 0,
        holdingPeriod === 'long_term' ? gain : 0
      )
    : 0;
  const totalTax = federalIncomeTax + niit + stateTax;

  return {
    gain,
    holdingPeriod,
    federalIncomeTax,
    niit,
    stateTax,
    totalTax,
    effectiveRate: gain > 0 ? totalTax / gain : 0,
    marginalOrdinaryRate: marginalRate(base.taxableIncome, data.ordinary),
    lossDeduction: withSale.lossDeduction,
    lossCarryforward: withSale.lossCarryforward,
    taxSavedByLoss: gain < 0 ? -federalIncomeTax : 0,
    netAfterTax: gain - totalTax,
    standardDeduction: data.standardDeduction,
  };
}

/**
 * Calculate estimated capital gains tax
 */
export function calculateCapitalGainsTax(
  input: TaxCalculatorInput
): TaxCalculatorResult {
  const {
    purchase_price,
    purchase_date,
    sale_price,
    sale_date,
    amount,
    tax_bracket,
    state,
  } = input;

  const costBasis = purchase_price * amount;
  const proceeds = sale_price * amount;
  const gainLoss = proceeds - costBasis;

  // Determine holding period.
  //
  // The IRS test is calendar-based, not a day count: a gain is long-term only
  // if the asset was held MORE than one year, so a sale on the one-year
  // anniversary is still short-term. Counting "> 365 days" got this wrong for
  // any holding period spanning a leap day - buy 2024-01-01, sell 2025-01-01 is
  // 366 calendar days but exactly one year, and was reported as long-term a day
  // early. At a 37% ordinary bracket that understates the tax on the gain by
  // more than half.
  //
  // Comparing against the anniversary handles leap years for free, including a
  // Feb 29 purchase: setFullYear rolls it to Mar 1 in a non-leap year, which is
  // the date the IRS uses too.
  const purchaseDate = new Date(purchase_date);
  const saleDate = new Date(sale_date);

  const holdingPeriod = classifyHoldingPeriod(purchaseDate, saleDate);

  // Calculate federal tax rate
  let federalTaxRate: number;
  if (gainLoss <= 0) {
    federalTaxRate = 0;
  } else if (holdingPeriod === 'short_term') {
    // Short-term uses ordinary income tax rates
    federalTaxRate = tax_bracket / 100;
  } else {
    // Long-term capital gains rates.
    //
    // The 0/15/20% thresholds apply to total taxable income with the gain
    // stacked on top of ordinary income, not to the gain in isolation. Bracketing
    // on gainLoss alone told anyone with a gain under $47,025 that they owed 0%
    // federal tax regardless of what they earn - a filer in the 37% bracket with
    // a $40k long-term gain was quoted $0 instead of $8,000.
    //
    // tax_bracket is the filer's ordinary rate, so use the income floor of that
    // bracket as a conservative stand-in for ordinary taxable income and stack
    // the gain above it.
    // Single-filer thresholds for the default tax year (src/data/taxBrackets.ts).
    const { ordinary, ltcg } = getFederalTaxData(DEFAULT_TAX_YEAR, 'single');
    const ordinaryRate = tax_bracket / 100;
    let ordinaryIncomeFloor = 0;
    for (let i = 0; i < ordinary.length; i++) {
      if (ordinaryRate >= ordinary[i].rate) ordinaryIncomeFloor = i === 0 ? 0 : ordinary[i - 1].upTo;
    }
    const incomeIncludingGain = ordinaryIncomeFloor + gainLoss;
    federalTaxRate =
      incomeIncludingGain <= ltcg.zeroUpTo ? 0 : incomeIncludingGain <= ltcg.fifteenUpTo ? 0.15 : 0.2;
  }

  // Add state tax if applicable
  const stateTaxRate = state ? (STATE_TAX_RATES[state] || 0) : 0;
  const totalTaxRate = federalTaxRate + stateTaxRate;

  // Calculate estimated tax
  const estimatedTax = gainLoss > 0 ? gainLoss * totalTaxRate : 0;
  const netProfit = gainLoss - estimatedTax;

  return {
    cost_basis: costBasis,
    proceeds,
    gain_loss: gainLoss,
    holding_period: holdingPeriod,
    tax_rate: totalTaxRate * 100,
    estimated_tax: estimatedTax,
    net_profit: netProfit,
  };
}

/**
 * Calculate tax for multiple transactions (tax lot method)
 */
export function calculateMultipleTransactionsTax(
  transactions: TaxCalculatorInput[],
  method: 'fifo' | 'lifo' | 'hifo' | 'specific' = 'fifo'
): {
  totalCostBasis: number;
  totalProceeds: number;
  totalGainLoss: number;
  totalTax: number;
  shortTermGains: number;
  longTermGains: number;
  transactions: TaxCalculatorResult[];
} {
  // Sort transactions based on method
  const sortedTransactions = [...transactions];

  switch (method) {
    case 'fifo':
      sortedTransactions.sort(
        (a, b) => new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime()
      );
      break;
    case 'lifo':
      sortedTransactions.sort(
        (a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime()
      );
      break;
    case 'hifo':
      sortedTransactions.sort((a, b) => b.purchase_price - a.purchase_price);
      break;
    // 'specific' keeps original order
  }

  const results: TaxCalculatorResult[] = [];
  let totalCostBasis = 0;
  let totalProceeds = 0;
  let totalGainLoss = 0;
  let totalTax = 0;
  let shortTermGains = 0;
  let longTermGains = 0;

  for (const tx of sortedTransactions) {
    const result = calculateCapitalGainsTax(tx);
    results.push(result);

    totalCostBasis += result.cost_basis;
    totalProceeds += result.proceeds;
    totalGainLoss += result.gain_loss;
    totalTax += result.estimated_tax;

    if (result.gain_loss > 0) {
      if (result.holding_period === 'short_term') {
        shortTermGains += result.gain_loss;
      } else {
        longTermGains += result.gain_loss;
      }
    }
  }

  return {
    totalCostBasis,
    totalProceeds,
    totalGainLoss,
    totalTax,
    shortTermGains,
    longTermGains,
    transactions: results,
  };
}

/**
 * Calculate tax-loss harvesting opportunities
 */
export function findTaxLossHarvestingOpportunities(
  holdings: {
    symbol: string;
    purchasePrice: number;
    currentPrice: number;
    amount: number;
    purchaseDate: string;
  }[]
): {
  symbol: string;
  unrealizedLoss: number;
  potentialTaxSavings: number;
  holdingPeriod: 'short_term' | 'long_term';
}[] {
  const opportunities = [];
  const now = new Date();

  for (const holding of holdings) {
    const costBasis = holding.purchasePrice * holding.amount;
    const currentValue = holding.currentPrice * holding.amount;
    const unrealizedGainLoss = currentValue - costBasis;

    // Only include losses
    if (unrealizedGainLoss < 0) {
      const purchaseDate = new Date(holding.purchaseDate);
      const holdingPeriod = classifyHoldingPeriod(purchaseDate, now);

      // Estimate tax savings at 22% (middle tax bracket)
      const estimatedTaxRate = holdingPeriod === 'short_term' ? 0.22 : 0.15;
      const potentialTaxSavings = Math.abs(unrealizedGainLoss) * estimatedTaxRate;

      opportunities.push({
        symbol: holding.symbol,
        unrealizedLoss: Math.abs(unrealizedGainLoss),
        potentialTaxSavings,
        holdingPeriod,
      });
    }
  }

  // Sort by potential tax savings (highest first)
  return opportunities.sort((a, b) => b.potentialTaxSavings - a.potentialTaxSavings);
}

/**
 * Calculate the wash sale impact
 * (Cannot claim loss if you buy same asset within 30 days)
 */
export function calculateWashSaleImpact(
  saleDate: string,
  salePrice: number,
  purchasePrice: number,
  amount: number,
  repurchaseDate?: string,
  repurchasePrice?: number
): {
  isWashSale: boolean;
  disallowedLoss: number;
  adjustedBasis: number;
  message: string;
} {
  const loss = (purchasePrice - salePrice) * amount;

  // If no loss, wash sale doesn't apply
  if (loss <= 0) {
    return {
      isWashSale: false,
      disallowedLoss: 0,
      adjustedBasis: purchasePrice,
      message: 'No loss to disallow - wash sale rule does not apply.',
    };
  }

  // Check if repurchase is within 30-day window
  if (!repurchaseDate || !repurchasePrice) {
    return {
      isWashSale: false,
      disallowedLoss: 0,
      adjustedBasis: purchasePrice,
      message: 'No repurchase detected within wash sale window.',
    };
  }

  const sale = new Date(saleDate);
  const repurchase = new Date(repurchaseDate);
  const daysDifference = Math.abs(
    (repurchase.getTime() - sale.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDifference <= 30) {
    // Wash sale applies
    const adjustedBasis = repurchasePrice + loss / amount;

    return {
      isWashSale: true,
      disallowedLoss: loss,
      adjustedBasis,
      message: `Wash sale detected. Loss of $${loss.toFixed(2)} is disallowed. The disallowed loss is added to your new cost basis ($${adjustedBasis.toFixed(2)}).`,
    };
  }

  return {
    isWashSale: false,
    disallowedLoss: 0,
    adjustedBasis: purchasePrice,
    message: 'Repurchase is outside the 30-day wash sale window.',
  };
}

/**
 * Estimate quarterly tax payment
 */
export function estimateQuarterlyPayment(
  estimatedAnnualGains: number,
  taxBracket: number,
  holdingPeriod: 'short_term' | 'long_term',
  state?: string
): {
  quarterlyPayment: number;
  annualTax: number;
  dueDate: string;
} {
  let federalRate: number;

  if (holdingPeriod === 'short_term') {
    federalRate = taxBracket / 100;
  } else {
    const { ltcg } = getFederalTaxData(DEFAULT_TAX_YEAR, 'single');
    federalRate =
      estimatedAnnualGains <= ltcg.zeroUpTo ? 0 : estimatedAnnualGains <= ltcg.fifteenUpTo ? 0.15 : 0.2;
  }

  const stateRate = state ? (STATE_TAX_RATES[state] || 0) : 0;
  const totalRate = federalRate + stateRate;

  const annualTax = estimatedAnnualGains * totalRate;
  const quarterlyPayment = annualTax / 4;

  // Next quarterly due date
  const now = new Date();
  const quarterlyDates = [
    new Date(now.getFullYear(), 3, 15), // April 15
    new Date(now.getFullYear(), 5, 15), // June 15
    new Date(now.getFullYear(), 8, 15), // September 15
    new Date(now.getFullYear() + 1, 0, 15), // January 15
  ];

  const nextDueDate = quarterlyDates.find(d => d > now) || quarterlyDates[0];

  return {
    quarterlyPayment,
    annualTax,
    dueDate: toLocalISODate(nextDueDate),
  };
}

/**
 * Get state tax information
 */
export function getStateTaxInfo(state: string): {
  rate: number;
  hasCapitalGainsTax: boolean;
  notes: string;
} | null {
  const info = STATE_TAX_BY_CODE[state];
  if (!info) return null;

  const rate = stateRateFor(state, DEFAULT_TAX_YEAR);
  return {
    rate: rate * 100,
    // Washington has no income tax but does tax large long-term gains.
    hasCapitalGainsTax: state === 'WA' || (rate > 0 && !info.noCapitalGainsTax),
    notes: info.note ?? '',
  };
}
