import type { Exchange } from '../types';

/**
 * Exchange data for comparison engine
 * Note: Affiliate URLs should be stored in environment variables in production
 * These are placeholder affiliate IDs for demonstration
 */
export const exchanges: Exchange[] = [
  {
    id: 'coinbase',
    name: 'Coinbase',
    logo: '/images/exchanges/coinbase.svg',
    description: 'Coinbase is the most trusted cryptocurrency exchange in the US, offering a secure and easy-to-use platform for buying, selling, and storing crypto.',
    url: 'https://www.coinbase.com',
    affiliate_url: 'https://www.coinbase.com/join/AFFILIATE_ID',
    affiliate_commission: '$10 per qualified referral + 50% trading fees for 3 months',
    year_established: 2012,
    country: 'United States',
    trust_score: 10,
    trading_volume_24h: 2000000000,
    fees: {
      maker_fee: 0.004, // 0.40%
      taker_fee: 0.006, // 0.60%
      withdrawal_fee_btc: 0,
      withdrawal_fee_eth: 0,
      deposit_fee_fiat: 0,
      withdrawal_fee_fiat: 0,
    },
    features: {
      spot_trading: true,
      margin_trading: false,
      futures_trading: false,
      staking: true,
      lending: false,
      debit_card: true,
      earn_program: true,
      nft_marketplace: true,
      advanced_charts: true,
      api_access: true,
    },
    supported_cryptocurrencies: 250,
    supported_fiat: ['USD', 'EUR', 'GBP'],
    kyc_required: true,
    mobile_app: true,
    pros: [
      'Extremely user-friendly interface',
      'Strong security track record',
      'Insured USD balances up to $250,000',
      'Coinbase Learn rewards program',
      'Wide variety of cryptocurrencies',
    ],
    cons: [
      'Higher fees than competitors',
      'Customer support can be slow',
      'Limited advanced trading features on basic app',
      'Staking rewards lower than some competitors',
    ],
    user_rating: 4.2,
    review_count: 15420,
  },
  {
    id: 'kraken',
    name: 'Kraken',
    logo: '/images/exchanges/kraken.svg',
    description: 'Kraken is a US-based cryptocurrency exchange known for its strong security, low fees, and extensive selection of cryptocurrencies.',
    url: 'https://www.kraken.com',
    affiliate_url: 'https://www.kraken.com/sign-up?ref=AFFILIATE_ID',
    affiliate_commission: '20% revenue share on trading fees',
    year_established: 2011,
    country: 'United States',
    trust_score: 10,
    trading_volume_24h: 800000000,
    fees: {
      maker_fee: 0.0016, // 0.16%
      taker_fee: 0.0026, // 0.26%
      withdrawal_fee_btc: 0.00015,
      withdrawal_fee_eth: 0.0035,
      deposit_fee_fiat: 0,
      withdrawal_fee_fiat: 5,
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
    supported_cryptocurrencies: 200,
    supported_fiat: ['USD', 'EUR', 'CAD', 'GBP', 'JPY', 'CHF', 'AUD'],
    kyc_required: true,
    mobile_app: true,
    pros: [
      'Very low trading fees',
      'Excellent security record (never been hacked)',
      'Margin and futures trading available',
      'Good staking rewards',
      '24/7 customer support',
    ],
    cons: [
      'Interface can be complex for beginners',
      'Slower verification process',
      'Limited payment options for US users',
      'No debit card option',
    ],
    user_rating: 4.4,
    review_count: 8930,
  },
  {
    id: 'binance-us',
    name: 'Binance.US',
    logo: '/images/exchanges/binance-us.svg',
    description: 'Binance.US is the American arm of the world\'s largest cryptocurrency exchange, offering low fees and a wide selection of cryptocurrencies.',
    url: 'https://www.binance.us',
    affiliate_url: 'https://www.binance.us/register?ref=AFFILIATE_ID',
    affiliate_commission: 'Up to 40% commission on trading fees',
    year_established: 2019,
    country: 'United States',
    trust_score: 7,
    trading_volume_24h: 300000000,
    fees: {
      maker_fee: 0.001, // 0.10%
      taker_fee: 0.001, // 0.10%
      withdrawal_fee_btc: 0.0001,
      withdrawal_fee_eth: 0.005,
      deposit_fee_fiat: 0,
      withdrawal_fee_fiat: 0,
    },
    features: {
      spot_trading: true,
      margin_trading: false,
      futures_trading: false,
      staking: true,
      lending: false,
      debit_card: true,
      earn_program: true,
      nft_marketplace: false,
      advanced_charts: true,
      api_access: true,
    },
    supported_cryptocurrencies: 150,
    supported_fiat: ['USD'],
    kyc_required: true,
    mobile_app: true,
    pros: [
      'Very low trading fees (0.1%)',
      'Large selection of cryptocurrencies',
      'Advanced trading features',
      'Staking available for many coins',
      'Mobile app with full features',
    ],
    cons: [
      'Not available in all US states',
      'Regulatory concerns',
      'Limited customer support',
      'Parent company faced legal issues',
    ],
    user_rating: 3.8,
    review_count: 5240,
  },
  {
    id: 'gemini',
    name: 'Gemini',
    logo: '/images/exchanges/gemini.svg',
    description: 'Gemini is a regulated cryptocurrency exchange founded by the Winklevoss twins, known for its focus on security and compliance.',
    url: 'https://www.gemini.com',
    affiliate_url: 'https://www.gemini.com/share/AFFILIATE_ID',
    affiliate_commission: '$10 per qualified referral',
    year_established: 2014,
    country: 'United States',
    trust_score: 9,
    trading_volume_24h: 150000000,
    fees: {
      maker_fee: 0.002, // 0.20%
      taker_fee: 0.004, // 0.40%
      withdrawal_fee_btc: 0,
      withdrawal_fee_eth: 0,
      deposit_fee_fiat: 0,
      withdrawal_fee_fiat: 0,
    },
    features: {
      spot_trading: true,
      margin_trading: false,
      futures_trading: false,
      staking: true,
      lending: false,
      debit_card: true,
      earn_program: true,
      nft_marketplace: true,
      advanced_charts: true,
      api_access: true,
    },
    supported_cryptocurrencies: 100,
    supported_fiat: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'HKD', 'SGD'],
    kyc_required: true,
    mobile_app: true,
    pros: [
      'Strong regulatory compliance',
      'SOC 2 certified security',
      'Insurance coverage for hot wallet',
      'Gemini Credit Card with crypto rewards',
      'Clean, intuitive interface',
    ],
    cons: [
      'Higher fees than competitors',
      'Smaller cryptocurrency selection',
      'Lower trading volume',
      'Gemini Earn program paused',
    ],
    user_rating: 4.0,
    review_count: 4120,
  },
  {
    id: 'crypto-com',
    name: 'Crypto.com',
    logo: '/images/exchanges/crypto-com.svg',
    description: 'Crypto.com is a comprehensive cryptocurrency platform offering an exchange, wallet, Visa card, and DeFi services.',
    url: 'https://crypto.com',
    affiliate_url: 'https://crypto.com/app/AFFILIATE_ID',
    affiliate_commission: '$25 per qualified referral',
    year_established: 2016,
    country: 'Hong Kong',
    trust_score: 8,
    trading_volume_24h: 500000000,
    fees: {
      maker_fee: 0.004, // 0.40%
      taker_fee: 0.004, // 0.40%
      withdrawal_fee_btc: 0.0004,
      withdrawal_fee_eth: 0.005,
      deposit_fee_fiat: 0,
      withdrawal_fee_fiat: 25,
    },
    features: {
      spot_trading: true,
      margin_trading: true,
      futures_trading: false,
      staking: true,
      lending: true,
      debit_card: true,
      earn_program: true,
      nft_marketplace: true,
      advanced_charts: true,
      api_access: true,
    },
    supported_cryptocurrencies: 350,
    supported_fiat: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD'],
    kyc_required: true,
    mobile_app: true,
    pros: [
      'Crypto Visa card with up to 5% cashback',
      'Large selection of cryptocurrencies',
      'Earn interest on crypto holdings',
      'DeFi wallet integration',
      'Competitive staking rewards',
    ],
    cons: [
      'Complex fee structure',
      'Requires CRO staking for best benefits',
      'Customer support issues reported',
      'Reduced card benefits in recent updates',
    ],
    user_rating: 3.9,
    review_count: 12350,
  },
  {
    id: 'robinhood',
    name: 'Robinhood',
    logo: '/images/exchanges/robinhood.svg',
    description: 'Robinhood offers commission-free cryptocurrency trading alongside stocks and ETFs in a simple, beginner-friendly mobile app.',
    url: 'https://robinhood.com',
    affiliate_url: 'https://join.robinhood.com/AFFILIATE_ID',
    affiliate_commission: 'Free stock for referrer and referee',
    year_established: 2013,
    country: 'United States',
    trust_score: 7,
    trading_volume_24h: 100000000,
    fees: {
      maker_fee: 0,
      taker_fee: 0,
      withdrawal_fee_btc: 0,
      withdrawal_fee_eth: 0,
      deposit_fee_fiat: 0,
      withdrawal_fee_fiat: 0,
    },
    features: {
      spot_trading: true,
      margin_trading: false,
      futures_trading: false,
      staking: false,
      lending: false,
      debit_card: true,
      earn_program: false,
      nft_marketplace: false,
      advanced_charts: false,
      api_access: false,
    },
    supported_cryptocurrencies: 20,
    supported_fiat: ['USD'],
    kyc_required: true,
    mobile_app: true,
    pros: [
      'Commission-free trading',
      'Very simple interface',
      'Trade stocks and crypto in one app',
      'Instant deposits for small amounts',
      'Cash card available',
    ],
    cons: [
      'Limited cryptocurrency selection',
      'No advanced trading features',
      'Spread markup instead of visible fees',
      'Past outages during high volatility',
      'No staking or earn programs',
    ],
    user_rating: 3.5,
    review_count: 28500,
  },
  {
    id: 'coinbase-pro',
    name: 'Coinbase Advanced',
    logo: '/images/exchanges/coinbase.svg',
    description: 'Coinbase Advanced (formerly Coinbase Pro) offers lower fees and professional trading tools for experienced cryptocurrency traders.',
    url: 'https://www.coinbase.com/advanced-trade',
    affiliate_url: 'https://www.coinbase.com/join/AFFILIATE_ID',
    affiliate_commission: '$10 per qualified referral + 50% trading fees for 3 months',
    year_established: 2015,
    country: 'United States',
    trust_score: 10,
    trading_volume_24h: 1500000000,
    fees: {
      maker_fee: 0.004, // 0.40%
      taker_fee: 0.006, // 0.60%
      withdrawal_fee_btc: 0,
      withdrawal_fee_eth: 0,
      deposit_fee_fiat: 0,
      withdrawal_fee_fiat: 0,
    },
    features: {
      spot_trading: true,
      margin_trading: false,
      futures_trading: false,
      staking: false,
      lending: false,
      debit_card: false,
      earn_program: false,
      nft_marketplace: false,
      advanced_charts: true,
      api_access: true,
    },
    supported_cryptocurrencies: 250,
    supported_fiat: ['USD', 'EUR', 'GBP'],
    kyc_required: true,
    mobile_app: true,
    pros: [
      'Lower fees than standard Coinbase',
      'Professional trading interface',
      'Same security as Coinbase',
      'Advanced order types available',
      'Real-time order books',
    ],
    cons: [
      'More complex for beginners',
      'No staking in Advanced interface',
      'Still higher fees than some competitors',
      'Limited educational resources',
    ],
    user_rating: 4.3,
    review_count: 6780,
  },
  {
    id: 'uphold',
    name: 'Uphold',
    logo: '/images/exchanges/uphold.svg',
    description: 'Uphold is a multi-asset trading platform supporting cryptocurrencies, precious metals, and national currencies with transparent pricing.',
    url: 'https://uphold.com',
    affiliate_url: 'https://uphold.com/signup?referral=AFFILIATE_ID',
    affiliate_commission: '$20 per qualified referral',
    year_established: 2015,
    country: 'United States',
    trust_score: 7,
    trading_volume_24h: 50000000,
    fees: {
      maker_fee: 0,
      taker_fee: 0,
      withdrawal_fee_btc: 0,
      withdrawal_fee_eth: 0,
      deposit_fee_fiat: 0,
      withdrawal_fee_fiat: 3.99,
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
    supported_cryptocurrencies: 250,
    supported_fiat: ['USD', 'EUR', 'GBP'],
    kyc_required: true,
    mobile_app: true,
    pros: [
      'No trading commissions',
      'Transparent spread pricing',
      'Trade crypto, metals, and currencies',
      'Autopilot for recurring purchases',
      'Debit card available',
    ],
    cons: [
      'Higher spreads than exchanges',
      'Limited advanced features',
      'Withdrawal fees for fiat',
      'Mixed customer reviews',
    ],
    user_rating: 3.6,
    review_count: 3450,
  },
];

/**
 * Get exchange by ID
 */
export function getExchangeById(id: string): Exchange | undefined {
  return exchanges.find(e => e.id === id);
}

/**
 * Get exchanges sorted by a specific criteria
 */
export function getExchangesSortedBy(
  criteria: 'fees' | 'trust_score' | 'user_rating' | 'supported_cryptocurrencies',
  order: 'asc' | 'desc' = 'asc'
): Exchange[] {
  const sorted = [...exchanges].sort((a, b) => {
    let aValue: number;
    let bValue: number;

    switch (criteria) {
      case 'fees':
        aValue = a.fees.taker_fee;
        bValue = b.fees.taker_fee;
        break;
      case 'trust_score':
        aValue = a.trust_score;
        bValue = b.trust_score;
        break;
      case 'user_rating':
        aValue = a.user_rating;
        bValue = b.user_rating;
        break;
      case 'supported_cryptocurrencies':
        aValue = a.supported_cryptocurrencies;
        bValue = b.supported_cryptocurrencies;
        break;
    }

    return order === 'asc' ? aValue - bValue : bValue - aValue;
  });

  return sorted;
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

/**
 * Get best exchange for a specific use case
 */
export function getBestExchangeFor(
  useCase: 'beginner' | 'low_fees' | 'security' | 'staking' | 'variety'
): Exchange | null {
  switch (useCase) {
    case 'beginner':
      // Best for beginners: user-friendly, trusted, good support
      return exchanges.find(e => e.id === 'coinbase') || null;
    case 'low_fees':
      // Lowest fees
      return getExchangesSortedBy('fees', 'asc')[0] || null;
    case 'security':
      // Highest trust score
      return getExchangesSortedBy('trust_score', 'desc')[0] || null;
    case 'staking':
      // Best staking options
      return exchanges.find(e => e.id === 'kraken') || null;
    case 'variety':
      // Most cryptocurrencies
      return getExchangesSortedBy('supported_cryptocurrencies', 'desc')[0] || null;
    default:
      return null;
  }
}
