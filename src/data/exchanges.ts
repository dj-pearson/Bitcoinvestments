import type { Exchange } from '../types';

/**
 * Exchange data for the /compare pages.
 *
 * Every entry carries `last_verified` and `sources`. Fee schedules change
 * often (Kraken on 2026-07-09, Coinbase Advanced on 2026-09-16), so the pages
 * always link to the official fee page next to the figures.
 *
 * Affiliate links are NOT stored here. `affiliate_partner_id` maps to
 * services/affiliate.ts, which reads the tracking ID from env vars and falls
 * back to the plain official URL when none is configured.
 *
 * The editorial score (`trust_score`) is the sum of the `editorial`
 * sub-scores, judged against the methodology published on /compare.
 */

/** Date the whole data set was last reviewed. */
export const EXCHANGES_LAST_VERIFIED = '2026-09-23';

/**
 * Assumed order-book spread for a market buy of BTC on a large order-book
 * exchange. Stated on the page wherever it is used.
 */
export const ORDER_BOOK_SPREAD_ASSUMPTION = 0.001; // 0.10%

export const exchanges: Exchange[] = [
  {
    id: 'coinbase',
    name: 'Coinbase',
    description:
      'Coinbase is a US-listed exchange (Nasdaq: COIN) with a simple buy/sell app and a separate order-book screen, Coinbase Advanced (formerly Coinbase Pro), in the same account.',
    url: 'https://www.coinbase.com',
    fees_url: 'https://help.coinbase.com/en/coinbase/trading-and-funding/advanced-trade/advanced-trade-fees',
    affiliate_partner_id: 'coinbase',
    year_established: 2012,
    country: 'United States',
    trust_score: 8,
    editorial: { regulation: 3, security: 2, transparency: 2, costs: 1 },
    fees: {
      maker_fee: 0.005, // Coinbase Advanced, US entry tier (schedule revised 2026-09-16)
      taker_fee: 0.009,
      deposit_fee_fiat: 0,
    },
    fee_notes:
      'Maker/taker figures are Coinbase Advanced at the US entry tier after the 2026-09-16 revision (tiers now start at $10K of 30-day volume, and USDC balances can unlock VIP tiers). Simple buys in the main app cost more: a spread of about 0.5% plus a fee that depends on the payment method.',
    buy_cost: {
      label: 'Coinbase app, simple buy by bank transfer',
      fee_pct: 0.0149,
      spread_pct: 0.005,
      note: 'About 1.49% bank-transfer fee plus about 0.5% spread, as publicly reported in 2026. The preview screen shows the exact total; debit-card buys cost more. A limit order on Coinbase Advanced is usually cheaper.',
    },
    features: {
      spot_trading: true,
      margin_trading: false,
      futures_trading: true,
      staking: true,
      lending: false,
      debit_card: true,
      earn_program: true,
      nft_marketplace: false, // Coinbase NFT marketplace sunset 2024
      advanced_charts: true,
      api_access: true,
    },
    assets_label: '250+ assets',
    supported_fiat: ['USD', 'EUR', 'GBP'],
    kyc_required: true,
    mobile_app: true,
    availability: 'Across the US and in many other countries; some products (staking, derivatives) vary by state and country.',
    best_for: 'First-time buyers in the US who want one regulated app with an easy route to lower-fee Advanced orders later.',
    not_for: 'Frequent traders at the entry tier, who pay 0.90% taker on Advanced and more on simple buys.',
    pros: [
      'Very easy first purchase; clear preview of the total cost',
      'Publicly listed and audited, US-regulated company',
      'Coinbase Advanced (same login) for limit orders and lower fees',
      'Staking and USDC rewards where available',
    ],
    cons: [
      'Simple buys carry a spread plus a payment-method fee (roughly 2% by bank)',
      'Entry-tier Advanced fees (0.50% / 0.90%) are higher than several rivals',
      'May 2025: Coinbase disclosed that bribed support contractors leaked some customer data',
      'Coinbase NFT marketplace was shut down in 2024',
    ],
    last_verified: '2026-09-23',
    sources: [
      { label: 'Coinbase Advanced fees (help center)', url: 'https://help.coinbase.com/en/coinbase/trading-and-funding/advanced-trade/advanced-trade-fees' },
      { label: 'Coinbase pricing and fee disclosures', url: 'https://help.coinbase.com/en/coinbase/trading-and-funding/pricing-and-fees/fees' },
      { label: 'Securities.io: Coinbase lowers Advanced tiers (Sept 2026)', url: 'https://www.securities.io/coinbase-lowers-advanced-trading-fees-with-tiers-starting-at-10-000/' },
    ],
    // NEEDS-OWNER: confirm a paid placement with Coinbase actually exists. If not, delete `sponsored`.
    sponsored: { is_sponsored: true },
  },
  {
    id: 'kraken',
    name: 'Kraken',
    description:
      'Kraken is a long-running US-based exchange with a simple app and the Kraken Pro order-book interface. Its fee tiers now count trading volume or assets held on the platform.',
    url: 'https://www.kraken.com',
    fees_url: 'https://www.kraken.com/features/fee-schedule',
    affiliate_partner_id: 'kraken',
    year_established: 2011,
    country: 'United States',
    trust_score: 9,
    editorial: { regulation: 2, security: 3, transparency: 2, costs: 2 },
    fees: {
      maker_fee: 0.004, // Kraken Pro entry tier, schedule effective 2026-07-09
      taker_fee: 0.008,
      deposit_fee_fiat: 0,
    },
    fee_notes:
      'Kraken Pro entry tier under the schedule effective 2026-07-09 (0.40% maker / 0.80% taker). Fees fall to 0.30% / 0.60% above $2.5K of 30-day volume and 0.22% / 0.38% above $10K volume or $20K held. Instant buys in the simple Kraken app are priced differently.',
    buy_cost: {
      label: 'Kraken Pro market order, entry tier',
      fee_pct: 0.008,
      spread_pct: ORDER_BOOK_SPREAD_ASSUMPTION,
      note: 'Taker fee plus our assumed 0.10% order-book spread. A resting limit order pays the lower maker fee.',
    },
    features: {
      spot_trading: true,
      margin_trading: true,
      futures_trading: true,
      staking: true,
      lending: false,
      debit_card: false,
      earn_program: true,
      nft_marketplace: false,
      advanced_charts: true,
      api_access: true,
    },
    assets_label: '200+ assets',
    supported_fiat: ['USD', 'EUR', 'CAD', 'GBP', 'JPY', 'CHF', 'AUD'],
    kyc_required: true,
    mobile_app: true,
    availability: 'Most US states and 190+ countries; margin, futures and staking availability depends on your state and country.',
    best_for: 'Buyers who will use limit orders on Kraken Pro and want a strong security reputation and regular proof-of-reserves audits.',
    not_for: 'Small, occasional buyers: the July 2026 entry tier doubled the base taker fee to 0.80%.',
    pros: [
      'Strong security reputation and regular proof-of-reserves attestations',
      'Fee discounts can be reached by holding assets, not only by trading',
      'Wide asset list, margin and futures where permitted',
      '24/7 live support',
    ],
    cons: [
      'Entry-tier Pro fees rose on 2026-07-09 (0.80% taker)',
      'Kraken Pro can be complex for beginners',
      'Paid $30M to settle an SEC case over its US staking program in 2023',
      'Product availability varies a lot by US state',
    ],
    last_verified: '2026-09-23',
    sources: [
      { label: 'Kraken fee schedule', url: 'https://www.kraken.com/features/fee-schedule' },
      { label: 'Kraken blog: new Kraken Pro fee tiers', url: 'https://blog.kraken.com/product/pro/new-kraken-pro-fee-tiers' },
    ],
    // NEEDS-OWNER: confirm a paid placement with Kraken actually exists. If not, delete `sponsored`.
    sponsored: { is_sponsored: true },
  },
  {
    id: 'binance-us',
    name: 'Binance.US',
    description:
      'Binance.US is the separately run US affiliate of Binance. Since April 2026 it charges near-zero spot trading fees on every pair.',
    url: 'https://www.binance.us',
    fees_url: 'https://www.binance.us/fees',
    affiliate_partner_id: 'binance-us',
    year_established: 2019,
    country: 'United States',
    trust_score: 6,
    editorial: { regulation: 1, security: 2, transparency: 1, costs: 2 },
    fees: {
      maker_fee: 0,
      taker_fee: 0.0002, // 0.01% on the Tier 0 pair (BNB/USD), 0.02% on other pairs
      deposit_fee_fiat: 0,
    },
    fee_notes:
      '0% maker / 0.02% taker on spot pairs, and 0.01% taker on the Tier 0 pair (BNB/USD), after the April 2026 fee cut. The spread on thinner order books can cost more than the fee.',
    buy_cost: {
      label: 'Binance.US market order',
      fee_pct: 0.0002,
      spread_pct: ORDER_BOOK_SPREAD_ASSUMPTION,
      note: 'Taker fee plus our assumed 0.10% spread. Binance.US order books are thinner than the largest exchanges, so check the live spread before a market order.',
    },
    features: {
      spot_trading: true,
      margin_trading: false,
      futures_trading: false,
      staking: true,
      lending: false,
      debit_card: false,
      earn_program: true,
      nft_marketplace: false,
      advanced_charts: true,
      api_access: true,
    },
    assets_label: '150+ assets',
    supported_fiat: ['USD'],
    kyc_required: true,
    mobile_app: true,
    availability: 'US only, and not in every state. Check the Binance.US state list before signing up.',
    best_for: 'Cost-sensitive US traders in supported states who place their own limit orders.',
    not_for: 'Anyone who wants the most established regulatory track record.',
    pros: [
      'Near-zero spot trading fees (0% maker / 0.02% taker)',
      'USD bank deposits and withdrawals restored in February 2025',
      'Staking on a range of assets',
    ],
    cons: [
      'Not available in every US state',
      'USD deposits and withdrawals were suspended from 2023 until February 2025',
      'Global parent Binance pleaded guilty to US anti-money-laundering violations in 2023',
      'Thinner order books than the largest US exchanges',
    ],
    last_verified: '2026-09-23',
    sources: [
      { label: 'Binance.US fees', url: 'https://www.binance.us/fees' },
      { label: 'Binance.US blog: 0% maker, 0.02% taker', url: 'https://blog.binance.us/zero-fee-trading/' },
      { label: 'BusinessWire: Binance.US restores USD (Feb 2025)', url: 'https://www.businesswire.com/news/home/20250218352407/en/Binance.US-Restores-USD-Deposits-Withdrawals-on-Platform' },
    ],
  },
  {
    id: 'gemini',
    name: 'Gemini',
    description:
      'Gemini is a New York-regulated exchange founded by the Winklevoss twins. It listed on Nasdaq (GEMI) in September 2025.',
    url: 'https://www.gemini.com',
    fees_url: 'https://www.gemini.com/fees/activetrader-fee-schedule',
    affiliate_partner_id: 'gemini',
    year_established: 2014,
    country: 'United States',
    trust_score: 8,
    editorial: { regulation: 3, security: 2, transparency: 2, costs: 1 },
    fees: {
      // NEEDS-OWNER: Gemini's fee pages changed in 2026 and third-party figures conflict.
      // These are the ActiveTrader entry-tier figures reported for Sept 2026; re-check gemini.com/fees.
      maker_fee: 0.006,
      taker_fee: 0.012,
      deposit_fee_fiat: 0,
    },
    fee_notes:
      'ActiveTrader entry tier as reported for September 2026 (0.60% maker / 1.20% taker). Gemini also weighs balances held when setting your tier. Third-party figures conflict, so check the official schedule before trading.',
    buy_cost: {
      label: 'Gemini ActiveTrader market order, entry tier',
      fee_pct: 0.012,
      spread_pct: ORDER_BOOK_SPREAD_ASSUMPTION,
      note: 'Taker fee plus our assumed 0.10% spread. Buys in the simple Gemini app are priced differently.',
    },
    features: {
      spot_trading: true,
      margin_trading: false,
      futures_trading: false,
      staking: true,
      lending: false,
      debit_card: false,
      earn_program: false, // Gemini Earn ended after the 2022 Genesis freeze
      nft_marketplace: false,
      advanced_charts: true,
      api_access: true,
    },
    assets_label: 'About 100 assets',
    supported_fiat: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD'],
    kyc_required: true,
    mobile_app: true,
    availability: 'Across the US and in a list of other countries; some products vary by region.',
    best_for: 'Buyers who put regulatory status first and trade infrequently.',
    not_for: 'Anyone focused on low fees: entry-tier taker fees are among the highest here.',
    pros: [
      'New York trust charter and SOC 2 audits',
      'Publicly listed since September 2025, so financials are public',
      'Gemini credit card with crypto rewards',
    ],
    cons: [
      'High entry-tier ActiveTrader fees (reported 0.60% / 1.20%)',
      'Gemini Earn froze in November 2022 when partner Genesis halted withdrawals; users were repaid in 2024 and Earn is discontinued',
      'Smaller asset selection than the largest exchanges',
    ],
    last_verified: '2026-09-23',
    sources: [
      { label: 'Gemini ActiveTrader fee schedule', url: 'https://www.gemini.com/fees/activetrader-fee-schedule' },
      { label: 'CNBC: Gemini Nasdaq debut (Sept 2025)', url: 'https://www.cnbc.com/2025/09/12/gemini-the-winklevoss-crypto-exchange-pops-in-nasdaq-debut.html' },
    ],
    // NEEDS-OWNER: confirm a paid placement with Gemini actually exists. If not, delete `sponsored`.
    sponsored: { is_sponsored: true },
  },
  {
    id: 'crypto-com',
    name: 'Crypto.com',
    description:
      'Crypto.com runs a spread-priced consumer app, a separate order-book exchange, and Visa debit cards. It is headquartered in Singapore.',
    url: 'https://crypto.com',
    fees_url: 'https://crypto.com/exchange/document/fees-limits',
    affiliate_partner_id: 'crypto-com',
    year_established: 2016,
    country: 'Singapore',
    trust_score: 6,
    editorial: { regulation: 2, security: 2, transparency: 1, costs: 1 },
    fees: {
      maker_fee: 0.0025, // Crypto.com Exchange base tier
      taker_fee: 0.005,
      deposit_fee_fiat: 0,
    },
    fee_notes:
      'Crypto.com Exchange base tier (0.25% maker / 0.50% taker), with discounts for CRO stakers. The Crypto.com App, which most people use, builds a spread into the quoted price instead.',
    buy_cost: {
      label: 'Crypto.com Exchange market order, base tier',
      fee_pct: 0.005,
      spread_pct: ORDER_BOOK_SPREAD_ASSUMPTION,
      note: 'Taker fee plus our assumed 0.10% spread. Buying in the Crypto.com App instead uses a spread that is usually wider.',
    },
    features: {
      spot_trading: true,
      margin_trading: true,
      futures_trading: false,
      staking: true,
      lending: false,
      debit_card: true,
      earn_program: true,
      nft_marketplace: true,
      advanced_charts: true,
      api_access: true,
    },
    assets_label: '350+ assets',
    supported_fiat: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD'],
    kyc_required: true,
    mobile_app: true,
    availability: 'Most US states and many other countries; the order-book exchange and some products vary by region.',
    best_for: 'People who want a crypto debit card and in-app rewards in one place.',
    not_for: 'Anyone who dislikes tying the best perks to staking the CRO token.',
    pros: [
      'Visa debit card with crypto rewards (tiers depend on CRO staked)',
      'Large asset selection',
      'Order-book exchange with published maker/taker fees',
    ],
    cons: [
      'The app prices trades with a spread, not a visible fee',
      'Best card and fee perks require locking up CRO',
      'January 2022 account breach (about $34M, users reimbursed)',
      'Card benefits have been cut several times',
    ],
    last_verified: '2026-09-23',
    sources: [
      { label: 'Crypto.com Exchange fees & limits', url: 'https://crypto.com/exchange/document/fees-limits' },
    ],
  },
  {
    id: 'robinhood',
    name: 'Robinhood',
    description:
      'Robinhood lets US customers trade crypto next to stocks. Casual app trades have no commission; the cost sits in the spread.',
    url: 'https://robinhood.com/us/en/about/crypto/',
    fees_url: 'https://robinhood.com/us/en/support/articles/crypto-order-routing/',
    affiliate_partner_id: 'robinhood',
    year_established: 2013,
    country: 'United States',
    trust_score: 7,
    editorial: { regulation: 2, security: 2, transparency: 2, costs: 1 },
    fees: {
      maker_fee: 0,
      taker_fee: 0,
      deposit_fee_fiat: 0,
    },
    fee_notes:
      'No commission on standard app trades, but a spread is built into the price (publicly reported at roughly 0.35–0.85% for BTC and ETH in 2026). Advanced tools such as Robinhood Legend use volume-tiered fees instead.',
    buy_cost: {
      label: 'Robinhood app, standard market buy',
      fee_pct: 0,
      spread_pct: 0.006,
      note: 'No commission. We model a 0.60% spread, the middle of the 0.35–0.85% range reported for 2026. The real spread varies with market conditions.',
    },
    features: {
      spot_trading: true,
      margin_trading: false,
      futures_trading: true,
      staking: true, // ETH and SOL staking in the US since July 2025, not in every state
      lending: false,
      debit_card: true,
      earn_program: false,
      nft_marketplace: false,
      advanced_charts: true, // Robinhood Legend
      api_access: true,
    },
    assets_label: 'Dozens of assets (list varies by state)',
    supported_fiat: ['USD'],
    kyc_required: true,
    mobile_app: true,
    availability: 'US (coin list varies by state), plus the EU through Robinhood Crypto EU. ETH/SOL staking is not offered in several states, including CA, MD, NJ and WI.',
    best_for: 'People who already invest in stocks on Robinhood and want small crypto positions in the same app.',
    not_for: 'Anyone who wants to see an explicit fee on every trade, or a very long coin list.',
    pros: [
      'No commission on standard crypto trades',
      'Stocks, ETFs and crypto in one app',
      'ETH and SOL staking in most US states since July 2025',
      'Can withdraw crypto to your own wallet',
    ],
    cons: [
      'Spread-based pricing hides the real cost',
      'Smaller coin selection than crypto-only exchanges',
      'Paid a $30M New York DFS penalty in 2022 over crypto compliance failings',
      'Past outages during high volatility',
    ],
    last_verified: '2026-09-23',
    sources: [
      { label: 'Robinhood crypto order routing', url: 'https://robinhood.com/us/en/support/articles/crypto-order-routing/' },
      { label: 'Robinhood crypto staking', url: 'https://robinhood.com/us/en/support/articles/staking/' },
    ],
  },
  {
    id: 'uphold',
    name: 'Uphold',
    description:
      'Uphold is a spread-priced platform for crypto, metals and currencies that publishes a real-time reserves page.',
    url: 'https://uphold.com',
    fees_url: 'https://support.uphold.com/hc/en-us/articles/360038404532-Uphold-Fees-Limits',
    affiliate_partner_id: 'uphold',
    year_established: 2015,
    country: 'United States',
    trust_score: 6,
    editorial: { regulation: 1, security: 2, transparency: 2, costs: 1 },
    fees: {
      maker_fee: 0,
      taker_fee: 0,
      deposit_fee_fiat: 0,
      withdrawal_fee_fiat: 0,
    },
    fee_notes:
      'No commission, but the spread is typically about 1.4–1.6% for BTC and ETH (wider for smaller coins), plus a flat $0.99 on trades under $500. Most crypto withdrawals carry a $0.99 fee plus the network fee.',
    buy_cost: {
      label: 'Uphold market buy',
      fee_pct: 0,
      spread_pct: 0.015,
      flat_fee: { amount: 0.99, below: 500 },
      note: 'We model a 1.5% spread for BTC plus the $0.99 flat fee on trades under $500, as publicly reported in 2026.',
    },
    features: {
      spot_trading: true,
      margin_trading: false,
      futures_trading: false,
      staking: true,
      lending: false,
      debit_card: true,
      earn_program: false,
      nft_marketplace: false,
      advanced_charts: false,
      api_access: true,
    },
    assets_label: '250+ assets',
    supported_fiat: ['USD', 'EUR', 'GBP'],
    kyc_required: true,
    mobile_app: true,
    availability: 'Most US states and many other countries.',
    best_for: 'Converting directly between crypto, metals and currencies in one step.',
    not_for: 'Cost-sensitive buyers: the spread makes it one of the most expensive options here.',
    pros: [
      'Any-to-any trades (crypto, metals, currencies)',
      'Publishes a real-time reserves/transparency page',
      'Recurring buys ("Autopilot")',
    ],
    cons: [
      'Spread of roughly 1.4–1.6% on BTC plus $0.99 on trades under $500',
      'Few advanced trading tools',
      'Faced a 2025 New York Attorney General action over its past promotion of Cred',
    ],
    last_verified: '2026-09-23',
    sources: [
      { label: 'Uphold fees & limits (help center)', url: 'https://support.uphold.com/hc/en-us/articles/360038404532-Uphold-Fees-Limits' },
    ],
  },
];

/**
 * Old exchange ids that now live on another page. `coinbase-pro` was a
 * separate entry for Coinbase Advanced, which is the same account and product
 * as Coinbase and is covered on the Coinbase page.
 */
export const LEGACY_EXCHANGE_IDS: Record<string, string> = {
  'coinbase-pro': 'coinbase',
};

/**
 * Get exchange by ID
 */
export function getExchangeById(id: string): Exchange | undefined {
  return exchanges.find(e => e.id === id);
}

/**
 * Modelled cost of a simple market buy of `amount` USD (before any
 * withdrawal). Uses the entry's `buy_cost` model.
 */
export function estimateBuyCost(exchange: Exchange, amount: number): {
  fee: number;
  spread: number;
  flat: number;
  total: number;
  pct: number;
} {
  const { fee_pct, spread_pct, flat_fee } = exchange.buy_cost;
  const fee = amount * fee_pct;
  const spread = amount * spread_pct;
  const flat = flat_fee && amount < flat_fee.below ? flat_fee.amount : 0;
  const total = fee + spread + flat;
  return { fee, spread, flat, total, pct: amount > 0 ? total / amount : 0 };
}

/**
 * Get exchanges sorted by a specific criterion. Never reorders sponsored
 * entries: the sort is the reader's choice.
 */
export function getExchangesSortedBy(
  criteria: 'fees' | 'trust_score' | 'buy_cost_100' | 'buy_cost_1000',
  order: 'asc' | 'desc' = 'asc'
): Exchange[] {
  const value = (e: Exchange): number => {
    switch (criteria) {
      case 'fees':
        return e.fees.taker_fee;
      case 'trust_score':
        return e.trust_score;
      case 'buy_cost_100':
        return estimateBuyCost(e, 100).total;
      case 'buy_cost_1000':
        return estimateBuyCost(e, 1000).total;
    }
  };
  // Stable sort with name as the tie-breaker so the order is deterministic.
  return [...exchanges].sort((a, b) => {
    const diff = order === 'asc' ? value(a) - value(b) : value(b) - value(a);
    return diff !== 0 ? diff : a.name.localeCompare(b.name);
  });
}

/**
 * Filter exchanges by features
 */
export function filterExchangesByFeatures(
  features: Partial<Exchange['features']>
): Exchange[] {
  return exchanges.filter(exchange => {
    for (const [key, value] of Object.entries(features)) {
      if (exchange.features[key as keyof typeof exchange.features] !== value) {
        return false;
      }
    }
    return true;
  });
}

export type ExchangeUseCase = 'beginner' | 'low_fees' | 'security' | 'staking' | 'stocks_and_crypto';

/**
 * Get the best exchange for a use case, with the reason shown on the page.
 * "low_fees" and "security" are computed from the data; the others are
 * editorial picks explained in `reason`.
 */
export function getBestExchangeFor(
  useCase: ExchangeUseCase
): { exchange: Exchange; reason: string } | null {
  const pick = (id: string, reason: string) => {
    const exchange = getExchangeById(id);
    return exchange ? { exchange, reason } : null;
  };
  switch (useCase) {
    case 'beginner':
      return pick('coinbase', 'Simplest first purchase with a full cost preview, and a lower-fee Advanced screen in the same account.');
    case 'low_fees': {
      const cheapest = getExchangesSortedBy('buy_cost_1000', 'asc')[0];
      if (!cheapest) return null;
      const cost = estimateBuyCost(cheapest, 1000).total;
      return {
        exchange: cheapest,
        reason: `Lowest modelled cost for a $1,000 market buy (about $${cost.toFixed(2)} incl. spread). Check it is available in your state.`,
      };
    }
    case 'security': {
      const best = [...exchanges].sort(
        (a, b) =>
          b.editorial.security + b.editorial.transparency - (a.editorial.security + a.editorial.transparency) ||
          b.trust_score - a.trust_score
      )[0];
      return best
        ? { exchange: best, reason: 'Highest security + transparency sub-scores in our methodology (incident record, proof of reserves).' }
        : null;
    }
    case 'staking':
      return pick('kraken', 'Broad staking menu and fee discounts for holding assets; staking availability still varies by state.');
    case 'stocks_and_crypto':
      return pick('robinhood', 'Crypto next to stocks and ETFs in one app, with no commission (you pay the spread).');
    default:
      return null;
  }
}
