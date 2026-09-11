import type {
  Portfolio,
  PortfolioHolding,
  Transaction,
} from '../types';
import { getSimplePrices } from './coingecko';
import { getCurrentUser, getUserProfile } from './auth';
import {
  getUserPortfolios,
  createDbPortfolio,
  getPortfolioHoldings,
  upsertHolding,
} from './database';
import { canAddAsset } from './subscriptionLimits';
import { todayLocalISODate } from '../lib/utils';

export class AssetLimitError extends Error {
  currentCount: number;
  maxCount: number;

  constructor(currentCount: number, maxCount: number) {
    super(`Asset limit reached. You have ${currentCount} assets and the limit is ${maxCount}.`);
    this.name = 'AssetLimitError';
    this.currentCount = currentCount;
    this.maxCount = maxCount;
  }
}

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
 * Get portfolio - tries Supabase first if user is logged in, falls back to localStorage
 */
export async function getPortfolio(): Promise<Portfolio | null> {
  const user = await getCurrentUser();

  if (user) {
    // Try to get from Supabase
    const portfolios = await getUserPortfolios(user.id);

    if (portfolios.length > 0) {
      // Get the default or first portfolio
      const dbPortfolio = portfolios.find(p => p.is_default) || portfolios[0];
      const holdings = await getPortfolioHoldings(dbPortfolio.id);

      // Convert database format to frontend format
      const portfolio: Portfolio = {
        id: dbPortfolio.id,
        user_id: dbPortfolio.user_id,
        name: dbPortfolio.name,
        created_at: dbPortfolio.created_at,
        updated_at: dbPortfolio.updated_at,
        holdings: holdings.map(h => ({
          id: h.id,
          portfolio_id: h.portfolio_id,
          cryptocurrency_id: h.cryptocurrency_id,
          symbol: h.symbol,
          name: h.name,
          amount: h.amount,
          average_buy_price: h.average_buy_price,
          current_price: h.average_buy_price, // Will be updated by price fetch
          current_value: h.amount * h.average_buy_price,
          cost_basis: h.amount * h.average_buy_price,
          profit_loss: 0,
          profit_loss_percentage: 0,
          // The holdings table stores a position, not a ledger, so the saved
          // quantity and average price are represented as a single opening
          // acquisition. recalculateHoldingFromTransactions treats the ledger as
          // authoritative; without this the first edit to a saved holding would
          // replay an empty history and wipe the position.
          transactions: [
            {
              id: `${h.id}-opening`,
              holding_id: h.id,
              type: 'transfer_in' as const,
              amount: h.amount,
              price_per_unit: h.average_buy_price,
              total_value: h.amount * h.average_buy_price,
              date: h.created_at,
              notes: 'Opening balance from saved holding',
            },
          ],
        })),
        total_value_usd: 0,
        total_cost_basis: 0,
        total_profit_loss: 0,
        total_profit_loss_percentage: 0,
      };

      recalculatePortfolioTotals(portfolio);
      return portfolio;
    } else {
      // Check if there's a localStorage portfolio to migrate
      const localPortfolio = getLocalPortfolio();
      if (localPortfolio) {
        await migrateLocalPortfolioToSupabase(user.id, localPortfolio);
        return localPortfolio;
      }
    }
  }

  // Fall back to localStorage for non-authenticated users
  return getLocalPortfolio();
}

/**
 * Migrate localStorage portfolio to Supabase
 */
async function migrateLocalPortfolioToSupabase(
  userId: string,
  localPortfolio: Portfolio
): Promise<void> {
  try {
    // Create portfolio in Supabase
    const dbPortfolio = await createDbPortfolio(userId, localPortfolio.name, true);

    if (!dbPortfolio) {
      console.error('Failed to create portfolio in Supabase');
      return;
    }

    // Migrate holdings
    for (const holding of localPortfolio.holdings) {
      await upsertHolding({
        portfolio_id: dbPortfolio.id,
        cryptocurrency_id: holding.cryptocurrency_id,
        symbol: holding.symbol,
        name: holding.name,
        amount: holding.amount,
        average_buy_price: holding.average_buy_price,
      });
    }

    // Clear localStorage after successful migration
    localStorage.removeItem(PORTFOLIO_STORAGE_KEY);
    console.log('Successfully migrated portfolio to Supabase');
  } catch (error) {
    console.error('Error migrating portfolio to Supabase:', error);
  }
}

/**
 * Create a new portfolio
 */
export async function createPortfolio(name: string, userId?: string): Promise<Portfolio> {
  const user = await getCurrentUser();

  if (user) {
    // Create in Supabase
    const dbPortfolio = await createDbPortfolio(user.id, name, true);

    if (dbPortfolio) {
      return {
        id: dbPortfolio.id,
        user_id: dbPortfolio.user_id,
        name: dbPortfolio.name,
        created_at: dbPortfolio.created_at,
        updated_at: dbPortfolio.updated_at,
        holdings: [],
        total_value_usd: 0,
        total_cost_basis: 0,
        total_profit_loss: 0,
        total_profit_loss_percentage: 0,
      };
    }
  }

  // Fall back to localStorage
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
 * Check if user can add a new asset to their portfolio
 */
export async function checkCanAddAsset(
  portfolio: Portfolio
): Promise<{ allowed: boolean; limit: number; remaining: number }> {
  const user = await getCurrentUser();

  if (user) {
    const profile = await getUserProfile(user.id);
    return canAddAsset(
      portfolio.holdings.length,
      profile?.subscription_status || 'free',
      profile?.subscription_expires_at
    );
  }

  // Non-authenticated users use free tier limits
  return canAddAsset(portfolio.holdings.length, 'free', null);
}

/**
 * Add a holding to portfolio
 * Throws AssetLimitError if free tier limit is reached and adding a new asset
 */
export async function addHolding(
  portfolio: Portfolio,
  cryptoId: string,
  symbol: string,
  name: string,
  amount: number,
  purchasePrice: number,
  purchaseDate: string,
  exchange?: string,
  notes?: string
): Promise<Portfolio> {
  const user = await getCurrentUser();

  // Check if holding already exists
  const existingHoldingIndex = portfolio.holdings.findIndex(
    h => h.cryptocurrency_id === cryptoId
  );

  // If adding a NEW asset (not existing), check limits
  if (existingHoldingIndex < 0) {
    let subscriptionStatus: 'free' | 'premium' = 'free';
    let subscriptionExpiresAt: string | null = null;

    if (user) {
      const profile = await getUserProfile(user.id);
      subscriptionStatus = profile?.subscription_status || 'free';
      subscriptionExpiresAt = profile?.subscription_expires_at || null;
    }

    const limitCheck = canAddAsset(
      portfolio.holdings.length,
      subscriptionStatus,
      subscriptionExpiresAt
    );

    if (!limitCheck.allowed) {
      throw new AssetLimitError(
        portfolio.holdings.length,
        limitCheck.limit
      );
    }
  }

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
    recalculateHoldingFromTransactions(holding);

    // Update in Supabase if user is logged in
    if (user && portfolio.user_id !== 'local') {
      await upsertHolding({
        portfolio_id: portfolio.id,
        cryptocurrency_id: holding.cryptocurrency_id,
        symbol: holding.symbol,
        name: holding.name,
        amount: holding.amount,
        average_buy_price: holding.average_buy_price,
      });
    }
  } else {
    // Create new holding
    const holding: PortfolioHolding = {
      id: generateId(),
      portfolio_id: portfolio.id,
      cryptocurrency_id: cryptoId,
      symbol: symbol.toUpperCase(),
      name,
      amount: 0,
      average_buy_price: 0,
      current_price: purchasePrice,
      current_value: 0,
      cost_basis: 0,
      profit_loss: 0,
      profit_loss_percentage: 0,
      transactions: [],
    };

    transaction.holding_id = holding.id;
    holding.transactions.push(transaction);
    // Derived from the ledger like every other mutation, so a fee on the opening
    // buy is picked up rather than silently dropped.
    recalculateHoldingFromTransactions(holding);
    portfolio.holdings.push(holding);

    // Save to Supabase if user is logged in
    if (user && portfolio.user_id !== 'local') {
      const dbHolding = await upsertHolding({
        portfolio_id: portfolio.id,
        cryptocurrency_id: holding.cryptocurrency_id,
        symbol: holding.symbol,
        name: holding.name,
        amount: holding.amount,
        average_buy_price: holding.average_buy_price,
      });

      // Update holding ID with database ID if successful
      if (dbHolding) {
        holding.id = dbHolding.id;
      }
    }
  }

  portfolio.updated_at = new Date().toISOString();
  recalculatePortfolioTotals(portfolio);

  // Save to localStorage if not logged in or as backup
  if (!user || portfolio.user_id === 'local') {
    saveLocalPortfolio(portfolio);
  }

  return portfolio;
}

/**
 * Remove amount from a holding (sell or transfer out)
 */
/**
 * Rebuild a holding's quantity and cost basis by replaying its transactions.
 *
 * This is the single source of truth for basis. It previously lived in three
 * places that each maintained it incrementally and disagreed with one another:
 *
 *   - addHolding averaged over every buy the holding had ever seen, including
 *     units already sold, so basis was understated after any disposal.
 *   - removeFromHolding recomputed cost_basis as amount * average_buy_price,
 *     which inflates basis when average_buy_price is stale.
 *   - addStakingReward raised amount while leaving both basis fields alone, so
 *     the two stopped agreeing the moment a reward arrived.
 *
 * Method is average cost (ACB): a disposal removes basis in proportion to the
 * units it removes and never changes the average unit cost of what remains.
 *
 * Acquisitions carry basis at the price recorded on the transaction, staking
 * rewards included - a reward is taxable income at its value on receipt and that
 * value becomes its basis, so the position does not show an instant paper profit
 * equal to income that was already recognised. Fees paid on an acquisition are
 * added to basis; fees paid on a disposal reduce proceeds and are not handled
 * here, since this function does not compute proceeds.
 */
export function recalculateHoldingFromTransactions(holding: PortfolioHolding): void {
  const ordered = [...holding.transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let units = 0;
  let basis = 0;

  for (const transaction of ordered) {
    const amount = Number(transaction.amount) || 0;
    if (amount <= 0) continue;

    switch (transaction.type) {
      case 'buy':
      case 'transfer_in':
      case 'staking_reward': {
        const unitPrice = Number(transaction.price_per_unit) || 0;
        const fee = Number(transaction.fee) || 0;
        units += amount;
        basis += amount * unitPrice + fee;
        break;
      }

      case 'sell':
      case 'transfer_out': {
        // Proportional basis removal. Guard the ratio so a ledger that disposes
        // of more than it holds cannot drive basis negative.
        const disposed = Math.min(amount, units);
        const share = units > 0 ? disposed / units : 0;
        basis -= basis * share;
        units -= disposed;
        break;
      }
    }
  }

  // Floating point residue from repeated proportional subtraction.
  if (units <= 1e-12) {
    units = 0;
    basis = 0;
  }

  holding.amount = units;
  holding.cost_basis = basis;
  holding.average_buy_price = units > 0 ? basis / units : 0;

  // Derived display figures are refreshed here too. They are a function of the
  // quantity that just changed, and leaving them to the next price refresh meant
  // a sale updated the basis but left current_value describing the old position,
  // which recalculatePortfolioTotals then summed into the portfolio total.
  holding.current_value = units * (Number(holding.current_price) || 0);
  holding.profit_loss = holding.current_value - basis;
  holding.profit_loss_percentage = basis > 0 ? (holding.profit_loss / basis) * 100 : 0;
}

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
  recalculateHoldingFromTransactions(holding);

  // Remove holding if nothing is left
  if (holding.amount <= 0) {
    portfolio.holdings.splice(holdingIndex, 1);
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
  recalculateHoldingFromTransactions(holding);

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
        date: todayLocalISODate(),
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
export async function importPortfolioFromCSV(
  csvContent: string,
  portfolioName: string
): Promise<Portfolio> {
  const lines = csvContent.trim().split('\n');
  const portfolio = await createPortfolio(portfolioName);

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
      todayLocalISODate()
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
 * Get or create a holding for an asset
 * Used primarily for transaction imports
 */
export async function getOrCreateHolding(
  userId: string,
  symbol: string,
  name: string
): Promise<PortfolioHolding> {
  let portfolio = await getPortfolio();

  if (!portfolio) {
    portfolio = await createPortfolio('My Portfolio', userId);
  }

  // Check if holding already exists
  const existingHolding = portfolio.holdings.find(
    h => h.symbol.toUpperCase() === symbol.toUpperCase()
  );

  if (existingHolding) {
    return existingHolding;
  }

  // Create new empty holding
  const holding: PortfolioHolding = {
    id: generateId(),
    portfolio_id: portfolio.id,
    cryptocurrency_id: symbol.toLowerCase(),
    symbol: symbol.toUpperCase(),
    name: name || symbol,
    amount: 0,
    average_buy_price: 0,
    current_price: 0,
    current_value: 0,
    cost_basis: 0,
    profit_loss: 0,
    profit_loss_percentage: 0,
    transactions: [],
  };

  portfolio.holdings.push(holding);
  portfolio.updated_at = new Date().toISOString();

  // Save to localStorage
  saveLocalPortfolio(portfolio);

  return holding;
}

/**
 * Add a transaction to a holding
 * Used primarily for transaction imports
 */
export async function addTransaction(
  holdingId: string,
  transaction: Omit<Transaction, 'id'>
): Promise<Transaction> {
  const portfolio = await getPortfolio();

  if (!portfolio) {
    throw new Error('Portfolio not found');
  }

  const holding = portfolio.holdings.find(h => h.id === holdingId);

  if (!holding) {
    throw new Error('Holding not found');
  }

  const newTransaction: Transaction = {
    ...transaction,
    id: generateId(),
    holding_id: holdingId,
  };

  holding.transactions.push(newTransaction);
  recalculateHoldingFromTransactions(holding);

  portfolio.updated_at = new Date().toISOString();
  recalculatePortfolioTotals(portfolio);
  saveLocalPortfolio(portfolio);

  return newTransaction;
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
