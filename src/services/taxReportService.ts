/**
 * Tax Report Service
 *
 * Comprehensive service for generating crypto tax reports including:
 * - Transaction aggregation by tax year
 * - Capital gains/losses calculation with FIFO/LIFO/HIFO methods
 * - Form 8949 compatible export
 * - Income categorization (staking rewards, airdrops)
 * - Summary reports with short-term vs long-term breakdown
 */

import type { Transaction, Portfolio, PortfolioHolding } from '../types';
import {
  calculateCapitalGainsTax,
  calculateMultipleTransactionsTax,
  STATE_TAX_RATES,
  SHORT_TERM_BRACKETS,
} from './calculators/taxCalculator';

// ==================== Types ====================

export type CostBasisMethod = 'fifo' | 'lifo' | 'hifo' | 'specific';

export interface TaxableEvent {
  id: string;
  date: string;
  type: 'sale' | 'trade' | 'income' | 'gift_received' | 'gift_sent';
  asset: string;
  symbol: string;
  amount: number;
  proceedsUSD: number;
  costBasisUSD: number;
  gainLoss: number;
  holdingPeriod: 'short_term' | 'long_term';
  holdingDays: number;
  acquiredDate: string;
  exchange?: string;
  notes?: string;
  // For wash sale tracking
  isWashSale?: boolean;
  disallowedLoss?: number;
}

export interface IncomeEvent {
  id: string;
  date: string;
  type: 'staking_reward' | 'airdrop' | 'mining' | 'interest' | 'other';
  asset: string;
  symbol: string;
  amount: number;
  fairMarketValueUSD: number;
  exchange?: string;
  notes?: string;
}

export interface TaxReportSummary {
  taxYear: number;
  generatedAt: string;

  // Capital Gains Summary
  totalProceeds: number;
  totalCostBasis: number;
  totalGainLoss: number;

  // Short-term vs Long-term
  shortTermGains: number;
  shortTermLosses: number;
  netShortTerm: number;

  longTermGains: number;
  longTermLosses: number;
  netLongTerm: number;

  // Net Capital Gain/Loss
  netCapitalGainLoss: number;

  // Income (taxed as ordinary income)
  totalOrdinaryIncome: number;
  stakingIncome: number;
  otherIncome: number;

  // Tax Estimates
  estimatedFederalTax: number;
  estimatedStateTax: number;
  estimatedTotalTax: number;

  // Wash Sales
  totalWashSaleDisallowed: number;

  // Transaction counts
  totalTransactions: number;
  salesCount: number;
  incomeEventsCount: number;

  // Cost basis method used
  costBasisMethod: CostBasisMethod;
}

export interface TaxReport {
  summary: TaxReportSummary;
  taxableEvents: TaxableEvent[];
  incomeEvents: IncomeEvent[];
  // For Form 8949
  form8949ShortTerm: Form8949Line[];
  form8949LongTerm: Form8949Line[];
}

export interface Form8949Line {
  description: string; // (a) Description of property
  dateAcquired: string; // (b) Date acquired
  dateSold: string; // (c) Date sold or disposed of
  proceeds: number; // (d) Proceeds
  costBasis: number; // (e) Cost or other basis
  adjustmentCode?: string; // (f) Code(s) from instructions
  adjustmentAmount?: number; // (g) Amount of adjustment
  gainOrLoss: number; // (h) Gain or (loss)
}

// ==================== Main Service Functions ====================

/**
 * Generate a complete tax report for a given tax year
 */
export async function generateTaxReport(
  portfolio: Portfolio,
  taxYear: number,
  options: {
    costBasisMethod?: CostBasisMethod;
    state?: string;
    taxBracket?: number; // User's marginal tax bracket (%)
    includeUnrealized?: boolean;
  } = {}
): Promise<TaxReport> {
  const {
    costBasisMethod = 'fifo',
    state,
    taxBracket = 22, // Default to 22% bracket
  } = options;

  // Get all transactions for the tax year
  const yearStart = new Date(taxYear, 0, 1);
  const yearEnd = new Date(taxYear, 11, 31, 23, 59, 59);

  // Collect all transactions from all holdings
  const allTransactions = collectAllTransactions(portfolio, yearStart, yearEnd);

  // Separate buy/sell transactions from income events
  const { dispositions, acquisitions, incomeTransactions } = categorizeTransactions(allTransactions);

  // Match sales to purchases using the specified cost basis method
  const taxableEvents = calculateTaxableEvents(
    dispositions,
    acquisitions,
    costBasisMethod,
    portfolio
  );

  // Calculate income events (staking rewards, etc.)
  const incomeEvents = calculateIncomeEvents(incomeTransactions);

  // Generate Form 8949 lines
  const form8949ShortTerm = taxableEvents
    .filter(e => e.holdingPeriod === 'short_term')
    .map(eventToForm8949Line);

  const form8949LongTerm = taxableEvents
    .filter(e => e.holdingPeriod === 'long_term')
    .map(eventToForm8949Line);

  // Calculate summary
  const summary = calculateSummary(
    taxableEvents,
    incomeEvents,
    taxYear,
    costBasisMethod,
    state,
    taxBracket
  );

  return {
    summary,
    taxableEvents,
    incomeEvents,
    form8949ShortTerm,
    form8949LongTerm,
  };
}

/**
 * Collect all transactions from portfolio within date range
 */
function collectAllTransactions(
  portfolio: Portfolio,
  startDate: Date,
  endDate: Date
): (Transaction & { asset: string; symbol: string })[] {
  const transactions: (Transaction & { asset: string; symbol: string })[] = [];

  for (const holding of portfolio.holdings) {
    for (const tx of holding.transactions) {
      const txDate = new Date(tx.date);
      if (txDate >= startDate && txDate <= endDate) {
        transactions.push({
          ...tx,
          asset: holding.name,
          symbol: holding.symbol,
        });
      }
    }
  }

  // Sort by date
  return transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Categorize transactions into dispositions, acquisitions, and income
 */
function categorizeTransactions(
  transactions: (Transaction & { asset: string; symbol: string })[]
): {
  dispositions: (Transaction & { asset: string; symbol: string })[];
  acquisitions: (Transaction & { asset: string; symbol: string })[];
  incomeTransactions: (Transaction & { asset: string; symbol: string })[];
} {
  const dispositions: (Transaction & { asset: string; symbol: string })[] = [];
  const acquisitions: (Transaction & { asset: string; symbol: string })[] = [];
  const incomeTransactions: (Transaction & { asset: string; symbol: string })[] = [];

  for (const tx of transactions) {
    switch (tx.type) {
      case 'sell':
      case 'transfer_out':
        dispositions.push(tx);
        break;
      case 'buy':
      case 'transfer_in':
        acquisitions.push(tx);
        break;
      case 'staking_reward':
        incomeTransactions.push(tx);
        break;
    }
  }

  return { dispositions, acquisitions, incomeTransactions };
}

/**
 * Calculate taxable events by matching dispositions to acquisitions
 */
function calculateTaxableEvents(
  dispositions: (Transaction & { asset: string; symbol: string })[],
  acquisitions: (Transaction & { asset: string; symbol: string })[],
  method: CostBasisMethod,
  portfolio: Portfolio
): TaxableEvent[] {
  const taxableEvents: TaxableEvent[] = [];

  // Build a pool of available lots for each asset
  const lotPools: Map<string, {
    date: string;
    amount: number;
    pricePerUnit: number;
    remainingAmount: number;
  }[]> = new Map();

  // First, collect ALL acquisitions (not just current year) for cost basis
  for (const holding of portfolio.holdings) {
    const lots: {
      date: string;
      amount: number;
      pricePerUnit: number;
      remainingAmount: number;
    }[] = [];

    for (const tx of holding.transactions) {
      if (tx.type === 'buy' || tx.type === 'transfer_in') {
        lots.push({
          date: tx.date,
          amount: tx.amount,
          pricePerUnit: tx.price_per_unit,
          remainingAmount: tx.amount,
        });
      }
    }

    // Sort lots based on cost basis method
    sortLots(lots, method);
    lotPools.set(holding.symbol, lots);
  }

  // Process each disposition
  for (const sale of dispositions) {
    const lots = lotPools.get(sale.symbol) || [];
    let remainingToSell = sale.amount;

    while (remainingToSell > 0 && lots.length > 0) {
      // Find a lot with remaining amount
      const lot = lots.find(l => l.remainingAmount > 0);
      if (!lot) break;

      const amountFromLot = Math.min(remainingToSell, lot.remainingAmount);
      const proceeds = amountFromLot * sale.price_per_unit;
      const costBasis = amountFromLot * lot.pricePerUnit;
      const gainLoss = proceeds - costBasis;

      // Calculate holding period
      const acquiredDate = new Date(lot.date);
      const soldDate = new Date(sale.date);
      const holdingDays = Math.floor(
        (soldDate.getTime() - acquiredDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const holdingPeriod: 'short_term' | 'long_term' = holdingDays > 365 ? 'long_term' : 'short_term';

      taxableEvents.push({
        id: `${sale.id}-${lot.date}`,
        date: sale.date,
        type: 'sale',
        asset: sale.asset,
        symbol: sale.symbol,
        amount: amountFromLot,
        proceedsUSD: proceeds,
        costBasisUSD: costBasis,
        gainLoss,
        holdingPeriod,
        holdingDays,
        acquiredDate: lot.date,
        exchange: sale.exchange,
        notes: sale.notes,
      });

      lot.remainingAmount -= amountFromLot;
      remainingToSell -= amountFromLot;
    }

    // If we couldn't match all sales to lots, use $0 cost basis (unknown)
    if (remainingToSell > 0) {
      const proceeds = remainingToSell * sale.price_per_unit;
      taxableEvents.push({
        id: `${sale.id}-unknown`,
        date: sale.date,
        type: 'sale',
        asset: sale.asset,
        symbol: sale.symbol,
        amount: remainingToSell,
        proceedsUSD: proceeds,
        costBasisUSD: 0, // Unknown cost basis
        gainLoss: proceeds,
        holdingPeriod: 'short_term', // Assume short-term if unknown
        holdingDays: 0,
        acquiredDate: 'Unknown',
        exchange: sale.exchange,
        notes: 'Cost basis unknown - using $0',
      });
    }
  }

  return taxableEvents;
}

/**
 * Sort lots based on cost basis method
 */
function sortLots(
  lots: { date: string; pricePerUnit: number; remainingAmount: number }[],
  method: CostBasisMethod
): void {
  switch (method) {
    case 'fifo':
      lots.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      break;
    case 'lifo':
      lots.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      break;
    case 'hifo':
      lots.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
      break;
    // 'specific' keeps original order
  }
}

/**
 * Calculate income events from staking rewards, etc.
 */
function calculateIncomeEvents(
  incomeTransactions: (Transaction & { asset: string; symbol: string })[]
): IncomeEvent[] {
  return incomeTransactions.map(tx => ({
    id: tx.id,
    date: tx.date,
    type: tx.type === 'staking_reward' ? 'staking_reward' : 'other',
    asset: tx.asset,
    symbol: tx.symbol,
    amount: tx.amount,
    fairMarketValueUSD: tx.total_value, // FMV at time of receipt
    exchange: tx.exchange,
    notes: tx.notes,
  }));
}

/**
 * Convert taxable event to Form 8949 line
 */
function eventToForm8949Line(event: TaxableEvent): Form8949Line {
  return {
    description: `${event.amount.toFixed(8)} ${event.symbol} (${event.asset})`,
    dateAcquired: event.acquiredDate === 'Unknown' ? 'VARIOUS' : formatDate(event.acquiredDate),
    dateSold: formatDate(event.date),
    proceeds: Math.round(event.proceedsUSD * 100) / 100,
    costBasis: Math.round(event.costBasisUSD * 100) / 100,
    adjustmentCode: event.isWashSale ? 'W' : undefined,
    adjustmentAmount: event.disallowedLoss,
    gainOrLoss: Math.round(event.gainLoss * 100) / 100,
  };
}

/**
 * Calculate tax report summary
 */
function calculateSummary(
  taxableEvents: TaxableEvent[],
  incomeEvents: IncomeEvent[],
  taxYear: number,
  costBasisMethod: CostBasisMethod,
  state?: string,
  taxBracket: number = 22
): TaxReportSummary {
  let totalProceeds = 0;
  let totalCostBasis = 0;
  let shortTermGains = 0;
  let shortTermLosses = 0;
  let longTermGains = 0;
  let longTermLosses = 0;
  let totalWashSaleDisallowed = 0;

  for (const event of taxableEvents) {
    totalProceeds += event.proceedsUSD;
    totalCostBasis += event.costBasisUSD;

    if (event.gainLoss >= 0) {
      if (event.holdingPeriod === 'short_term') {
        shortTermGains += event.gainLoss;
      } else {
        longTermGains += event.gainLoss;
      }
    } else {
      if (event.holdingPeriod === 'short_term') {
        shortTermLosses += Math.abs(event.gainLoss);
      } else {
        longTermLosses += Math.abs(event.gainLoss);
      }
    }

    if (event.disallowedLoss) {
      totalWashSaleDisallowed += event.disallowedLoss;
    }
  }

  const netShortTerm = shortTermGains - shortTermLosses;
  const netLongTerm = longTermGains - longTermLosses;
  const netCapitalGainLoss = netShortTerm + netLongTerm;
  const totalGainLoss = totalProceeds - totalCostBasis;

  // Calculate income
  const stakingIncome = incomeEvents
    .filter(e => e.type === 'staking_reward')
    .reduce((sum, e) => sum + e.fairMarketValueUSD, 0);

  const otherIncome = incomeEvents
    .filter(e => e.type !== 'staking_reward')
    .reduce((sum, e) => sum + e.fairMarketValueUSD, 0);

  const totalOrdinaryIncome = stakingIncome + otherIncome;

  // Estimate taxes
  const federalTaxRate = taxBracket / 100;
  const stateTaxRate = state ? (STATE_TAX_RATES[state] || 0) : 0;

  // Short-term gains taxed at ordinary income rates
  const shortTermTax = netShortTerm > 0 ? netShortTerm * federalTaxRate : 0;

  // Long-term gains taxed at preferential rates (simplified to 15%)
  const longTermTaxRate = netLongTerm > 518900 ? 0.20 : netLongTerm > 47025 ? 0.15 : 0;
  const longTermTax = netLongTerm > 0 ? netLongTerm * longTermTaxRate : 0;

  // Income taxed at ordinary rates
  const incomeTax = totalOrdinaryIncome * federalTaxRate;

  const estimatedFederalTax = Math.max(0, shortTermTax + longTermTax + incomeTax);
  const estimatedStateTax = Math.max(0, (netCapitalGainLoss + totalOrdinaryIncome) * stateTaxRate);
  const estimatedTotalTax = estimatedFederalTax + estimatedStateTax;

  return {
    taxYear,
    generatedAt: new Date().toISOString(),
    totalProceeds,
    totalCostBasis,
    totalGainLoss,
    shortTermGains,
    shortTermLosses,
    netShortTerm,
    longTermGains,
    longTermLosses,
    netLongTerm,
    netCapitalGainLoss,
    totalOrdinaryIncome,
    stakingIncome,
    otherIncome,
    estimatedFederalTax,
    estimatedStateTax,
    estimatedTotalTax,
    totalWashSaleDisallowed,
    totalTransactions: taxableEvents.length + incomeEvents.length,
    salesCount: taxableEvents.length,
    incomeEventsCount: incomeEvents.length,
    costBasisMethod,
  };
}

// ==================== Export Functions ====================

/**
 * Export tax report as Form 8949 compatible CSV
 */
export function exportForm8949CSV(report: TaxReport): string {
  const lines: string[] = [];

  // Header
  lines.push('Form 8949 - Sales and Other Dispositions of Capital Assets');
  lines.push(`Tax Year: ${report.summary.taxYear}`);
  lines.push(`Generated: ${new Date(report.summary.generatedAt).toLocaleDateString()}`);
  lines.push(`Cost Basis Method: ${report.summary.costBasisMethod.toUpperCase()}`);
  lines.push('');

  // Part I - Short-Term
  lines.push('PART I - SHORT-TERM CAPITAL GAINS AND LOSSES (Assets held one year or less)');
  lines.push('"(a) Description of property","(b) Date acquired","(c) Date sold","(d) Proceeds","(e) Cost basis","(f) Code","(g) Adjustment","(h) Gain or (loss)"');

  for (const line of report.form8949ShortTerm) {
    lines.push(formatForm8949CSVLine(line));
  }

  // Short-term totals
  const shortTermTotals = calculateForm8949Totals(report.form8949ShortTerm);
  lines.push(`"TOTAL SHORT-TERM","","","${shortTermTotals.proceeds.toFixed(2)}","${shortTermTotals.costBasis.toFixed(2)}","","${shortTermTotals.adjustment.toFixed(2)}","${shortTermTotals.gainLoss.toFixed(2)}"`);
  lines.push('');

  // Part II - Long-Term
  lines.push('PART II - LONG-TERM CAPITAL GAINS AND LOSSES (Assets held more than one year)');
  lines.push('"(a) Description of property","(b) Date acquired","(c) Date sold","(d) Proceeds","(e) Cost basis","(f) Code","(g) Adjustment","(h) Gain or (loss)"');

  for (const line of report.form8949LongTerm) {
    lines.push(formatForm8949CSVLine(line));
  }

  // Long-term totals
  const longTermTotals = calculateForm8949Totals(report.form8949LongTerm);
  lines.push(`"TOTAL LONG-TERM","","","${longTermTotals.proceeds.toFixed(2)}","${longTermTotals.costBasis.toFixed(2)}","","${longTermTotals.adjustment.toFixed(2)}","${longTermTotals.gainLoss.toFixed(2)}"`);

  return lines.join('\n');
}

/**
 * Export complete transaction history CSV
 */
export function exportTransactionHistoryCSV(report: TaxReport): string {
  const lines: string[] = [];

  // Header
  lines.push('Date,Type,Asset,Symbol,Amount,Proceeds (USD),Cost Basis (USD),Gain/Loss (USD),Holding Period,Days Held,Acquired Date,Exchange,Notes');

  // Taxable events
  for (const event of report.taxableEvents) {
    lines.push([
      event.date,
      event.type,
      `"${event.asset}"`,
      event.symbol,
      event.amount.toFixed(8),
      event.proceedsUSD.toFixed(2),
      event.costBasisUSD.toFixed(2),
      event.gainLoss.toFixed(2),
      event.holdingPeriod,
      event.holdingDays.toString(),
      event.acquiredDate,
      event.exchange || '',
      `"${event.notes || ''}"`,
    ].join(','));
  }

  return lines.join('\n');
}

/**
 * Export income report CSV
 */
export function exportIncomeCSV(report: TaxReport): string {
  const lines: string[] = [];

  lines.push('CRYPTOCURRENCY INCOME REPORT');
  lines.push(`Tax Year: ${report.summary.taxYear}`);
  lines.push('');
  lines.push('Date,Type,Asset,Symbol,Amount,Fair Market Value (USD),Exchange,Notes');

  for (const event of report.incomeEvents) {
    lines.push([
      event.date,
      event.type,
      `"${event.asset}"`,
      event.symbol,
      event.amount.toFixed(8),
      event.fairMarketValueUSD.toFixed(2),
      event.exchange || '',
      `"${event.notes || ''}"`,
    ].join(','));
  }

  lines.push('');
  lines.push(`TOTAL INCOME,$${report.summary.totalOrdinaryIncome.toFixed(2)}`);
  lines.push(`Staking Rewards,$${report.summary.stakingIncome.toFixed(2)}`);
  lines.push(`Other Income,$${report.summary.otherIncome.toFixed(2)}`);

  return lines.join('\n');
}

/**
 * Export tax summary CSV
 */
export function exportTaxSummaryCSV(report: TaxReport): string {
  const s = report.summary;
  const lines: string[] = [];

  lines.push('CRYPTOCURRENCY TAX SUMMARY');
  lines.push(`Tax Year: ${s.taxYear}`);
  lines.push(`Generated: ${new Date(s.generatedAt).toLocaleDateString()}`);
  lines.push(`Cost Basis Method: ${s.costBasisMethod.toUpperCase()}`);
  lines.push('');

  lines.push('CAPITAL GAINS/LOSSES');
  lines.push(`Total Proceeds,$${s.totalProceeds.toFixed(2)}`);
  lines.push(`Total Cost Basis,$${s.totalCostBasis.toFixed(2)}`);
  lines.push(`Total Gain/Loss,$${s.totalGainLoss.toFixed(2)}`);
  lines.push('');

  lines.push('SHORT-TERM (held ≤ 1 year)');
  lines.push(`Gains,$${s.shortTermGains.toFixed(2)}`);
  lines.push(`Losses,$${s.shortTermLosses.toFixed(2)}`);
  lines.push(`Net Short-Term,$${s.netShortTerm.toFixed(2)}`);
  lines.push('');

  lines.push('LONG-TERM (held > 1 year)');
  lines.push(`Gains,$${s.longTermGains.toFixed(2)}`);
  lines.push(`Losses,$${s.longTermLosses.toFixed(2)}`);
  lines.push(`Net Long-Term,$${s.netLongTerm.toFixed(2)}`);
  lines.push('');

  lines.push('NET CAPITAL GAIN/LOSS');
  lines.push(`Net Capital Gain/Loss,$${s.netCapitalGainLoss.toFixed(2)}`);
  lines.push('');

  lines.push('ORDINARY INCOME');
  lines.push(`Staking Rewards,$${s.stakingIncome.toFixed(2)}`);
  lines.push(`Other Income,$${s.otherIncome.toFixed(2)}`);
  lines.push(`Total Ordinary Income,$${s.totalOrdinaryIncome.toFixed(2)}`);
  lines.push('');

  lines.push('ESTIMATED TAXES');
  lines.push(`Federal Tax,$${s.estimatedFederalTax.toFixed(2)}`);
  lines.push(`State Tax,$${s.estimatedStateTax.toFixed(2)}`);
  lines.push(`Total Estimated Tax,$${s.estimatedTotalTax.toFixed(2)}`);
  lines.push('');

  if (s.totalWashSaleDisallowed > 0) {
    lines.push('WASH SALES');
    lines.push(`Disallowed Losses,$${s.totalWashSaleDisallowed.toFixed(2)}`);
    lines.push('');
  }

  lines.push('TRANSACTION COUNTS');
  lines.push(`Total Transactions,${s.totalTransactions}`);
  lines.push(`Sales/Dispositions,${s.salesCount}`);
  lines.push(`Income Events,${s.incomeEventsCount}`);

  return lines.join('\n');
}

// ==================== Helper Functions ====================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
}

function formatForm8949CSVLine(line: Form8949Line): string {
  return [
    `"${line.description}"`,
    `"${line.dateAcquired}"`,
    `"${line.dateSold}"`,
    line.proceeds.toFixed(2),
    line.costBasis.toFixed(2),
    `"${line.adjustmentCode || ''}"`,
    line.adjustmentAmount?.toFixed(2) || '',
    line.gainOrLoss.toFixed(2),
  ].join(',');
}

function calculateForm8949Totals(lines: Form8949Line[]): {
  proceeds: number;
  costBasis: number;
  adjustment: number;
  gainLoss: number;
} {
  return lines.reduce(
    (acc, line) => ({
      proceeds: acc.proceeds + line.proceeds,
      costBasis: acc.costBasis + line.costBasis,
      adjustment: acc.adjustment + (line.adjustmentAmount || 0),
      gainLoss: acc.gainLoss + line.gainOrLoss,
    }),
    { proceeds: 0, costBasis: 0, adjustment: 0, gainLoss: 0 }
  );
}

// ==================== TurboTax/H&R Block Compatible Export ====================

/**
 * Export in TXF format (compatible with TurboTax and other tax software)
 */
export function exportTXF(report: TaxReport): string {
  const lines: string[] = [];

  // TXF Header
  lines.push('V042'); // Version
  lines.push('ABitcoin Investments Tax Export'); // Application name
  lines.push(`D${formatTXFDate(new Date())}`); // Date
  lines.push('^'); // End of header

  // Short-term sales (Form 8949 Box A)
  for (const event of report.taxableEvents.filter(e => e.holdingPeriod === 'short_term')) {
    lines.push('TD'); // Transaction detail
    lines.push('N321'); // Schedule D short-term
    lines.push(`C1`); // Category
    lines.push('L1'); // Line 1
    lines.push(`P${event.amount.toFixed(8)} ${event.symbol}`); // Description
    lines.push(`D${formatTXFDate(new Date(event.acquiredDate))}`); // Date acquired
    lines.push(`D${formatTXFDate(new Date(event.date))}`); // Date sold
    lines.push(`$${event.costBasisUSD.toFixed(2)}`); // Cost basis
    lines.push(`$${event.proceedsUSD.toFixed(2)}`); // Sales price
    lines.push('^');
  }

  // Long-term sales (Form 8949 Box D)
  for (const event of report.taxableEvents.filter(e => e.holdingPeriod === 'long_term')) {
    lines.push('TD');
    lines.push('N323'); // Schedule D long-term
    lines.push(`C1`);
    lines.push('L1');
    lines.push(`P${event.amount.toFixed(8)} ${event.symbol}`);
    lines.push(`D${formatTXFDate(new Date(event.acquiredDate))}`);
    lines.push(`D${formatTXFDate(new Date(event.date))}`);
    lines.push(`$${event.costBasisUSD.toFixed(2)}`);
    lines.push(`$${event.proceedsUSD.toFixed(2)}`);
    lines.push('^');
  }

  return lines.join('\n');
}

function formatTXFDate(date: Date): string {
  return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
}

// ==================== PDF Export ====================

/**
 * Export tax report as PDF
 */
export async function exportTaxReportPDF(report: TaxReport): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  const s = report.summary;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Cryptocurrency Tax Report', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tax Year: ${s.taxYear}`, 105, 28, { align: 'center' });
  doc.text(`Generated: ${new Date(s.generatedAt).toLocaleDateString()}`, 105, 35, { align: 'center' });
  doc.text(`Cost Basis Method: ${s.costBasisMethod.toUpperCase()}`, 105, 42, { align: 'center' });

  let yPos = 55;

  // Summary Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Capital Gains Summary', 14, yPos);
  yPos += 8;

  // Summary table
  autoTable(doc, {
    startY: yPos,
    head: [['Category', 'Amount']],
    body: [
      ['Total Proceeds', formatCurrency(s.totalProceeds)],
      ['Total Cost Basis', formatCurrency(s.totalCostBasis)],
      ['Total Gain/Loss', formatCurrency(s.totalGainLoss)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [51, 51, 51] },
    margin: { left: 14, right: 105 },
  });

  // Short-term/Long-term breakdown on the right
  autoTable(doc, {
    startY: yPos,
    head: [['Term', 'Net Gain/Loss']],
    body: [
      ['Short-Term (≤1 year)', formatCurrency(s.netShortTerm)],
      ['Long-Term (>1 year)', formatCurrency(s.netLongTerm)],
      ['Net Capital Gain/Loss', formatCurrency(s.netCapitalGainLoss)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [51, 51, 51] },
    margin: { left: 110, right: 14 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Income Section (if any)
  if (s.totalOrdinaryIncome > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Ordinary Income', 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['Source', 'Amount']],
      body: [
        ['Staking Rewards', formatCurrency(s.stakingIncome)],
        ['Other Income', formatCurrency(s.otherIncome)],
        ['Total Income', formatCurrency(s.totalOrdinaryIncome)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [51, 51, 51] },
      margin: { left: 14, right: 120 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Estimated Taxes
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Estimated Tax Liability', 14, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Tax Type', 'Estimated Amount']],
    body: [
      ['Federal Tax', formatCurrency(s.estimatedFederalTax)],
      ['State Tax', formatCurrency(s.estimatedStateTax)],
      ['Total Estimated Tax', formatCurrency(s.estimatedTotalTax)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [51, 51, 51] },
    styles: { fontSize: 10 },
    margin: { left: 14, right: 120 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Page break for transactions if needed
  if (yPos > 220) {
    doc.addPage();
    yPos = 20;
  }

  // Short-Term Transactions (Form 8949 Part I)
  if (report.form8949ShortTerm.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Form 8949 Part I - Short-Term Transactions', 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['Description', 'Acquired', 'Sold', 'Proceeds', 'Cost Basis', 'Gain/Loss']],
      body: report.form8949ShortTerm.slice(0, 25).map(line => [
        truncateText(line.description, 30),
        line.dateAcquired,
        line.dateSold,
        formatCurrency(line.proceeds),
        formatCurrency(line.costBasis),
        formatCurrency(line.gainOrLoss),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [51, 51, 51], fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 22 },
        2: { cellWidth: 22 },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
      },
    });

    // Subtotal row
    const shortTermTotals = calculateForm8949Totals(report.form8949ShortTerm);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY,
      body: [[
        'TOTAL SHORT-TERM',
        '',
        '',
        formatCurrency(shortTermTotals.proceeds),
        formatCurrency(shortTermTotals.costBasis),
        formatCurrency(shortTermTotals.gainLoss),
      ]],
      theme: 'plain',
      styles: { fontSize: 8, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 22 },
        2: { cellWidth: 22 },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
      },
    });

    if (report.form8949ShortTerm.length > 25) {
      yPos = (doc as any).lastAutoTable.finalY + 3;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`Showing 25 of ${report.form8949ShortTerm.length} transactions. See CSV export for complete list.`, 14, yPos);
    }

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Page break if needed
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }

  // Long-Term Transactions (Form 8949 Part II)
  if (report.form8949LongTerm.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Form 8949 Part II - Long-Term Transactions', 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['Description', 'Acquired', 'Sold', 'Proceeds', 'Cost Basis', 'Gain/Loss']],
      body: report.form8949LongTerm.slice(0, 25).map(line => [
        truncateText(line.description, 30),
        line.dateAcquired,
        line.dateSold,
        formatCurrency(line.proceeds),
        formatCurrency(line.costBasis),
        formatCurrency(line.gainOrLoss),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [51, 51, 51], fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 22 },
        2: { cellWidth: 22 },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
      },
    });

    // Subtotal row
    const longTermTotals = calculateForm8949Totals(report.form8949LongTerm);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY,
      body: [[
        'TOTAL LONG-TERM',
        '',
        '',
        formatCurrency(longTermTotals.proceeds),
        formatCurrency(longTermTotals.costBasis),
        formatCurrency(longTermTotals.gainLoss),
      ]],
      theme: 'plain',
      styles: { fontSize: 8, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 22 },
        2: { cellWidth: 22 },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
      },
    });

    if (report.form8949LongTerm.length > 25) {
      yPos = (doc as any).lastAutoTable.finalY + 3;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`Showing 25 of ${report.form8949LongTerm.length} transactions. See CSV export for complete list.`, 14, yPos);
    }
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'This report is for informational purposes only and does not constitute tax advice. Consult a qualified tax professional.',
      105,
      285,
      { align: 'center' }
    );
    doc.text(`Page ${i} of ${pageCount}`, 195, 285, { align: 'right' });
    doc.text('Generated by Bitcoin Investments', 14, 285);
  }

  return doc.output('blob');
}

/**
 * Format currency for PDF display
 */
function formatCurrency(amount: number): string {
  const prefix = amount < 0 ? '-$' : '$';
  return prefix + Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Truncate text for table cells
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
