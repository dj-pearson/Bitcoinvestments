import type {
  Portfolio,
  PortfolioHolding,
  Transaction,
} from '../types';
import { getSimplePrices } from './coingecko';

// Local storage key for portfolio data
const PORTFOLIO_STORAGE_KEY = 'bitcoin_investments_portfolio';

/**
 * Get portfolio from local storage
 */
export function getLocalPortfolio(): Portfolio | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as Portfolio;
  } catch {
    return null;
  }
}

/**
 * Save portfolio to local storage
 */
export function saveLocalPortfolio(portfolio: Portfolio): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(portfolio));
}

/**
 * Create a new portfolio
 */
export function createPortfolio(name: string, userId?: string): Portfolio {
  const portfolio: Portfolio = {
    id: generateId(),
    user_id: userId || 'local',
    name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    holdings: [],
    total_value_usd: 0,
    total_cost_basis: 0,
    total_profit_loss: 0,
    total_profit_loss_percentage: 0,
  };

  saveLocalPortfolio(portfolio);
  return portfolio;
}

/**
 * Add a holding to portfolio
 */
export function addHolding(
  portfolio: Portfolio,
  cryptoId: string,
  symbol: string,
  name: string,
  amount: number,
  purchasePrice: number,
  purchaseDate: string,
  exchange?: string,
  notes?: string
): Portfolio {
  // Check if holding already exists
  const existingHoldingIndex = portfolio.holdings.findIndex(
    h => h.cryptocurrency_id === cryptoId
  );

  const transaction: Transaction = {
    id: generateId(),
    holding_id: '',
    type: 'buy',
    amount,
    price_per_unit: purchasePrice,
    total_value: amount * purchasePrice,
    date: purchaseDate,
    exchange,
    notes,
  };

  if (existingHoldingIndex >= 0) {
    // Update existing holding
    const holding = portfolio.holdings[existingHoldingIndex];
    holding.transactions.push({ ...transaction, holding_id: holding.id });
    holding.amount += amount;

    // Recalculate average buy price
    const totalCost = holding.transactions
      .filter(t => t.type === 'buy')
      .reduce((sum, t) => sum + t.total_value, 0);
    const totalBought = holding.transactions
      .filter(t => t.type === 'buy')
      .reduce((sum, t) => sum + t.amount, 0);
    holding.average_buy_price = totalBought > 0 ? totalCost / totalBought : 0;
    holding.cost_basis = holding.amount * holding.average_buy_price;
  } else {
    // Create new holding
    const holding: PortfolioHolding = {
      id: generateId(),
      portfolio_id: portfolio.id,
      cryptocurrency_id: cryptoId,
      symbol: symbol.toUpperCase(),
      name,
      amount,
      average_buy_price: purchasePrice,
      current_price: purchasePrice,
      current_value: amount * purchasePrice,
      cost_basis: amount * purchasePrice,
      profit_loss: 0,
      profit_loss_percentage: 0,
      transactions: [],
    };

    transaction.holding_id = holding.id;
    holding.transactions.push(transaction);
    portfolio.holdings.push(holding);
  }

  portfolio.updated_at = new Date().toISOString();
  recalculatePortfolioTotals(portfolio);
  saveLocalPortfolio(portfolio);

  return portfolio;
}

/**
 * Remove amount from a holding (sell or transfer out)
 */
export function removeFromHolding(
  portfolio: Portfolio,
  holdingId: string,
  amount: number,
  price: number,
  type: 'sell' | 'transfer_out',
  date: string,
  exchange?: string,
  notes?: string
): Portfolio {
  const holdingIndex = portfolio.holdings.findIndex(h => h.id === holdingId);

  if (holdingIndex < 0) {
    throw new Error('Holding not found');
  }

  const holding = portfolio.holdings[holdingIndex];

  if (amount > holding.amount) {
    throw new Error('Cannot remove more than available amount');
  }

  const transaction: Transaction = {
    id: generateId(),
    holding_id: holdingId,
    type,
    amount,
    price_per_unit: price,
    total_value: amount * price,
    date,
    exchange,
    notes,
  };

  holding.transactions.push(transaction);
  holding.amount -= amount;

  // Remove holding if amount is 0
  if (holding.amount <= 0) {
    portfolio.holdings.splice(holdingIndex, 1);
  } else {
    holding.cost_basis = holding.amount * holding.average_buy_price;
  }

  portfolio.updated_at = new Date().toISOString();
  recalculatePortfolioTotals(portfolio);
  saveLocalPortfolio(portfolio);

  return portfolio;
}

/**
 * Add staking rewards to a holding
 */
export function addStakingReward(
  portfolio: Portfolio,
  holdingId: string,
  amount: number,
  date: string,
  notes?: string
): Portfolio {
  const holding = portfolio.holdings.find(h => h.id === holdingId);

  if (!holding) {
    throw new Error('Holding not found');
  }

  const transaction: Transaction = {
    id: generateId(),
    holding_id: holdingId,
    type: 'staking_reward',
    amount,
    price_per_unit: holding.current_price,
    total_value: amount * holding.current_price,
    date,
    notes,
  };

  holding.transactions.push(transaction);
  holding.amount += amount;

  // Staking rewards have 0 cost basis (income), so don't add to average buy price
  // This affects the profit/loss calculation

  portfolio.updated_at = new Date().toISOString();
  recalculatePortfolioTotals(portfolio);
  saveLocalPortfolio(portfolio);

  return portfolio;
}

/**
 * Update portfolio with current prices
 */
export async function updatePortfolioPrices(
  portfolio: Portfolio
): Promise<Portfolio> {
  if (portfolio.holdings.length === 0) {
    return portfolio;
  }

  const cryptoIds = portfolio.holdings.map(h => h.cryptocurrency_id);

  try {
    const prices = await getSimplePrices(cryptoIds, ['usd'], false, true);

    for (const holding of portfolio.holdings) {
      const priceData = prices[holding.cryptocurrency_id];
      if (priceData) {
        holding.current_price = priceData.usd;
        holding.current_value = holding.amount * holding.current_price;
        holding.profit_loss = holding.current_value - holding.cost_basis;
        holding.profit_loss_percentage = holding.cost_basis > 0
          ? (holding.profit_loss / holding.cost_basis) * 100
          : 0;
      }
    }

    recalculatePortfolioTotals(portfolio);
    portfolio.updated_at = new Date().toISOString();
    saveLocalPortfolio(portfolio);
  } catch (error) {
    console.error('Error updating portfolio prices:', error);
  }

  return portfolio;
}

/**
 * Recalculate portfolio totals
 */
function recalculatePortfolioTotals(portfolio: Portfolio): void {
  portfolio.total_value_usd = portfolio.holdings.reduce(
    (sum, h) => sum + h.current_value,
    0
  );

  portfolio.total_cost_basis = portfolio.holdings.reduce(
    (sum, h) => sum + h.cost_basis,
    0
  );

  portfolio.total_profit_loss = portfolio.total_value_usd - portfolio.total_cost_basis;

  portfolio.total_profit_loss_percentage = portfolio.total_cost_basis > 0
    ? (portfolio.total_profit_loss / portfolio.total_cost_basis) * 100
    : 0;
}

/**
 * Get portfolio allocation breakdown
 */
export function getPortfolioAllocation(portfolio: Portfolio): {
  symbol: string;
  name: string;
  value: number;
  percentage: number;
  color: string;
}[] {
  const colors = [
    '#F7931A', // Bitcoin orange
    '#627EEA', // Ethereum blue
    '#14F195', // Solana green
    '#0033AD', // Cardano blue
    '#E84142', // Avalanche red
    '#8247E5', // Polygon purple
    '#00CED1', // Cosmos teal
    '#E6007A', // Polkadot pink
  ];

  return portfolio.holdings
    .map((holding, index) => ({
      symbol: holding.symbol,
      name: holding.name,
      value: holding.current_value,
      percentage: portfolio.total_value_usd > 0
        ? (holding.current_value / portfolio.total_value_usd) * 100
        : 0,
      color: colors[index % colors.length],
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Get portfolio performance over time
 */
export function getPortfolioPerformance(
  portfolio: Portfolio,
  _days: number = 30
): {
  date: string;
  value: number;
  change: number;
}[] {
  // This is a simplified version - in production, you'd store historical snapshots
  // For now, we calculate based on transaction dates

  const transactions = portfolio.holdings.flatMap(h =>
    h.transactions.map(t => ({
      ...t,
      symbol: h.symbol,
    }))
  );

  const sortedTransactions = transactions.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const performance: { date: string; value: number; change: number }[] = [];
  let runningValue = 0;

  for (const tx of sortedTransactions) {
    if (tx.type === 'buy' || tx.type === 'transfer_in' || tx.type === 'staking_reward') {
      runningValue += tx.total_value;
    } else {
      runningValue -= tx.total_value;
    }

    const previousValue = performance.length > 0
      ? performance[performance.length - 1].value
      : 0;

    performance.push({
      date: tx.date,
      value: runningValue,
      change: previousValue > 0
        ? ((runningValue - previousValue) / previousValue) * 100
        : 0,
    });
  }

  // Add current value
  if (performance.length > 0) {
    const lastEntry = performance[performance.length - 1];
    if (portfolio.total_value_usd !== lastEntry.value) {
      performance.push({
        date: new Date().toISOString().split('T')[0],
        value: portfolio.total_value_usd,
        change: lastEntry.value > 0
          ? ((portfolio.total_value_usd - lastEntry.value) / lastEntry.value) * 100
          : 0,
      });
    }
  }

  return performance;
}

/**
 * Get top performers in portfolio
 */
export function getTopPerformers(
  portfolio: Portfolio,
  limit: number = 5
): PortfolioHolding[] {
  return [...portfolio.holdings]
    .sort((a, b) => b.profit_loss_percentage - a.profit_loss_percentage)
    .slice(0, limit);
}

/**
 * Get worst performers in portfolio
 */
export function getWorstPerformers(
  portfolio: Portfolio,
  limit: number = 5
): PortfolioHolding[] {
  return [...portfolio.holdings]
    .sort((a, b) => a.profit_loss_percentage - b.profit_loss_percentage)
    .slice(0, limit);
}

/**
 * Export portfolio to CSV
 */
export function exportPortfolioToCSV(portfolio: Portfolio): string {
  const headers = [
    'Symbol',
    'Name',
    'Amount',
    'Avg Buy Price',
    'Current Price',
    'Cost Basis',
    'Current Value',
    'Profit/Loss',
    'Profit/Loss %',
  ];

  const rows = portfolio.holdings.map(h => [
    h.symbol,
    h.name,
    h.amount.toString(),
    h.average_buy_price.toFixed(2),
    h.current_price.toFixed(2),
    h.cost_basis.toFixed(2),
    h.current_value.toFixed(2),
    h.profit_loss.toFixed(2),
    h.profit_loss_percentage.toFixed(2) + '%',
  ]);

  // Add totals row
  rows.push([
    'TOTAL',
    '',
    '',
    '',
    '',
    portfolio.total_cost_basis.toFixed(2),
    portfolio.total_value_usd.toFixed(2),
    portfolio.total_profit_loss.toFixed(2),
    portfolio.total_profit_loss_percentage.toFixed(2) + '%',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Import portfolio from CSV
 */
export function importPortfolioFromCSV(
  csvContent: string,
  portfolioName: string
): Portfolio {
  const lines = csvContent.trim().split('\n');
  const portfolio = createPortfolio(portfolioName);

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');

    if (values.length < 9 || values[0] === 'TOTAL') continue;

    const [symbol, name, amount, avgBuyPrice] = values;

    addHolding(
      portfolio,
      symbol.toLowerCase(),
      symbol,
      name,
      parseFloat(amount),
      parseFloat(avgBuyPrice),
      new Date().toISOString().split('T')[0]
    );
  }

  return portfolio;
}

/**
 * Delete portfolio
 */
export function deletePortfolio(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PORTFOLIO_STORAGE_KEY);
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
