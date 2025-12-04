import type { TaxCalculatorInput, TaxCalculatorResult } from '../../types';

// US Federal capital gains tax brackets for 2024
// Short-term gains are taxed as ordinary income (user's tax bracket is used)
export const SHORT_TERM_BRACKETS = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 },
];

const LONG_TERM_BRACKETS = [
  { min: 0, max: 47025, rate: 0.00 },
  { min: 47025, max: 518900, rate: 0.15 },
  { min: 518900, max: Infinity, rate: 0.20 },
];

// State capital gains tax rates (simplified - actual rates may vary)
const STATE_TAX_RATES: Record<string, number> = {
  CA: 0.133, // California
  NY: 0.0882, // New York
  NJ: 0.1075, // New Jersey
  HI: 0.11, // Hawaii
  MN: 0.0985, // Minnesota
  OR: 0.099, // Oregon
  VT: 0.0875, // Vermont
  IA: 0.06, // Iowa
  WI: 0.0765, // Wisconsin
  ME: 0.0715, // Maine
  SC: 0.07, // South Carolina
  CT: 0.0699, // Connecticut
  MT: 0.0675, // Montana
  NE: 0.0664, // Nebraska
  ID: 0.06, // Idaho
  WV: 0.065, // West Virginia
  AR: 0.055, // Arkansas
  GA: 0.055, // Georgia
  MD: 0.055, // Maryland
  MA: 0.05, // Massachusetts
  KY: 0.05, // Kentucky
  NC: 0.0525, // North Carolina
  OK: 0.05, // Oklahoma
  VA: 0.0575, // Virginia
  LA: 0.0425, // Louisiana
  MS: 0.05, // Mississippi
  AL: 0.05, // Alabama
  MO: 0.054, // Missouri
  KS: 0.057, // Kansas
  MI: 0.0425, // Michigan
  IN: 0.0315, // Indiana
  CO: 0.044, // Colorado
  UT: 0.0485, // Utah
  AZ: 0.025, // Arizona
  IL: 0.0495, // Illinois
  OH: 0, // Ohio - no state tax on capital gains
  PA: 0.0307, // Pennsylvania
  ND: 0.029, // North Dakota
  TX: 0, // Texas - no income tax
  FL: 0, // Florida - no income tax
  WA: 0, // Washington - no income tax (but has 7% on long-term gains over $250k)
  NV: 0, // Nevada - no income tax
  WY: 0, // Wyoming - no income tax
  SD: 0, // South Dakota - no income tax
  TN: 0, // Tennessee - no income tax
  AK: 0, // Alaska - no income tax
  NH: 0, // New Hampshire - no income tax (but has tax on dividends/interest)
};

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

  // Determine holding period
  const purchaseDate = new Date(purchase_date);
  const saleDate = new Date(sale_date);
  const holdingDays = Math.floor(
    (saleDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const holdingPeriod: 'short_term' | 'long_term' =
    holdingDays > 365 ? 'long_term' : 'short_term';

  // Calculate federal tax rate
  let federalTaxRate: number;
  if (gainLoss <= 0) {
    federalTaxRate = 0;
  } else if (holdingPeriod === 'short_term') {
    // Short-term uses ordinary income tax rates
    federalTaxRate = tax_bracket / 100;
  } else {
    // Long-term capital gains rates
    const bracket = LONG_TERM_BRACKETS.find(
      b => gainLoss >= b.min && gainLoss < b.max
    );
    federalTaxRate = bracket?.rate || 0.20;
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
  let sortedTransactions = [...transactions];

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
      const holdingDays = Math.floor(
        (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const holdingPeriod: 'short_term' | 'long_term' =
        holdingDays > 365 ? 'long_term' : 'short_term';

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
    const bracket = LONG_TERM_BRACKETS.find(
      b => estimatedAnnualGains >= b.min && estimatedAnnualGains < b.max
    );
    federalRate = bracket?.rate || 0.15;
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
    dueDate: nextDueDate.toISOString().split('T')[0],
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
  const rate = STATE_TAX_RATES[state];

  if (rate === undefined) {
    return null;
  }

  const noTaxStates = ['TX', 'FL', 'WA', 'NV', 'WY', 'SD', 'TN', 'AK', 'NH'];
  const hasCapitalGainsTax = rate > 0;

  let notes = '';
  if (noTaxStates.includes(state)) {
    notes = 'No state income tax on capital gains.';
  } else if (state === 'WA') {
    notes = 'Washington has a 7% tax on long-term capital gains over $250,000.';
  } else if (state === 'CA') {
    notes = 'California taxes capital gains as ordinary income at the highest rates in the nation.';
  }

  return {
    rate: rate * 100,
    hasCapitalGainsTax,
    notes,
  };
}
