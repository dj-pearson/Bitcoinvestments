/**
 * Global Search Service
 *
 * Provides unified search functionality across all content types:
 * - Guides
 * - Courses
 * - Glossary terms
 * - Exchanges
 * - Wallets
 * - Cryptocurrencies (via CoinGecko API)
 */

import { getAllGuides } from '../data/guides';
import { getAllCourses } from '../data/courses';
import { exchanges } from '../data/exchanges';
import { wallets } from '../data/wallets';
import { searchCryptocurrencies } from './coingecko';

// Glossary terms imported from page (we'll export these separately)
export interface GlossaryTerm {
  term: string;
  definition: string;
  category: string;
  relatedTerms?: string[];
}

/**
 * Search result types
 */
export type SearchResultType =
  | 'guide'
  | 'course'
  | 'module'
  | 'glossary'
  | 'exchange'
  | 'wallet'
  | 'crypto';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description: string;
  url: string;
  category?: string;
  icon?: string;
  score: number; // Relevance score for sorting
  metadata?: Record<string, unknown>;
}

export interface SearchResults {
  results: SearchResult[];
  totalCount: number;
  query: string;
  searchTime: number;
}

export interface SearchFilters {
  types?: SearchResultType[];
  limit?: number;
  category?: string;
}

/**
 * Glossary terms data (exported for use in search)
 */
export const GLOSSARY_TERMS: GlossaryTerm[] = [
  // Basics
  { term: 'Bitcoin (BTC)', definition: 'The first and most well-known cryptocurrency, created by the pseudonymous Satoshi Nakamoto in 2009.', category: 'Basics', relatedTerms: ['Blockchain', 'Cryptocurrency', 'Satoshi'] },
  { term: 'Blockchain', definition: 'A distributed digital ledger that records all transactions across a network of computers.', category: 'Basics', relatedTerms: ['Block', 'Decentralization', 'Node'] },
  { term: 'Cryptocurrency', definition: 'A digital or virtual currency that uses cryptography for security and operates on a decentralized network.', category: 'Basics', relatedTerms: ['Bitcoin', 'Altcoin', 'Token'] },
  { term: 'Altcoin', definition: 'Any cryptocurrency other than Bitcoin. Examples include Ethereum (ETH), Solana (SOL), and Cardano (ADA).', category: 'Basics', relatedTerms: ['Bitcoin', 'Token', 'Cryptocurrency'] },
  { term: 'Wallet', definition: 'A digital tool that stores your private keys and allows you to send, receive, and manage your cryptocurrencies.', category: 'Basics', relatedTerms: ['Private Key', 'Public Key', 'Cold Storage'] },
  { term: 'Exchange', definition: 'A platform where you can buy, sell, and trade cryptocurrencies.', category: 'Basics', relatedTerms: ['Trading', 'Liquidity', 'Order Book'] },
  // Technical
  { term: 'Private Key', definition: 'A secret cryptographic code that proves ownership of your cryptocurrency and allows you to sign transactions.', category: 'Technical', relatedTerms: ['Public Key', 'Wallet', 'Seed Phrase'] },
  { term: 'Public Key', definition: "A cryptographic code derived from your private key that can be shared publicly.", category: 'Technical', relatedTerms: ['Private Key', 'Wallet Address'] },
  { term: 'Seed Phrase', definition: 'A list of 12-24 words that can be used to recover your cryptocurrency wallet. Also called a recovery phrase.', category: 'Technical', relatedTerms: ['Private Key', 'Wallet', 'Cold Storage'] },
  { term: 'Hash', definition: 'A fixed-length alphanumeric string created by a cryptographic hash function.', category: 'Technical', relatedTerms: ['Mining', 'Proof of Work', 'Block'] },
  { term: 'Smart Contract', definition: 'Self-executing code stored on a blockchain that automatically enforces the terms of an agreement.', category: 'Technical', relatedTerms: ['Ethereum', 'DeFi', 'dApp'] },
  { term: 'Node', definition: 'A computer that maintains a copy of the blockchain and helps validate transactions.', category: 'Technical', relatedTerms: ['Full Node', 'Light Node', 'Validator'] },
  { term: 'Consensus', definition: 'The mechanism by which blockchain networks agree on the current state of the ledger.', category: 'Technical', relatedTerms: ['Proof of Work', 'Proof of Stake'] },
  // Trading
  { term: 'HODL', definition: "A misspelling of 'hold' that became crypto slang for holding onto your investments long-term regardless of price volatility.", category: 'Trading', relatedTerms: ['Diamond Hands', 'Paper Hands'] },
  { term: 'DCA (Dollar-Cost Averaging)', definition: 'An investment strategy where you regularly invest a fixed amount regardless of the asset price.', category: 'Trading', relatedTerms: ['Investment Strategy', 'HODL'] },
  { term: 'FOMO', definition: "Fear Of Missing Out - the anxiety that others are profiting from an opportunity you're not participating in.", category: 'Trading', relatedTerms: ['FUD', 'Market Psychology'] },
  { term: 'FUD', definition: 'Fear, Uncertainty, and Doubt - negative sentiment or news that may be spread to drive down prices.', category: 'Trading', relatedTerms: ['FOMO', 'Market Manipulation'] },
  { term: 'Bull Market', definition: 'A market condition characterized by rising prices and optimistic sentiment.', category: 'Trading', relatedTerms: ['Bear Market', 'Market Cycle'] },
  { term: 'Bear Market', definition: 'A market condition characterized by falling prices and pessimistic sentiment.', category: 'Trading', relatedTerms: ['Bull Market', 'Market Cycle'] },
  { term: 'Market Cap', definition: 'The total value of a cryptocurrency, calculated by multiplying price by circulating supply.', category: 'Trading', relatedTerms: ['Circulating Supply', 'Fully Diluted Value'] },
  { term: 'Liquidity', definition: 'How easily an asset can be bought or sold without significantly affecting its price.', category: 'Trading', relatedTerms: ['Order Book', 'Slippage'] },
  // DeFi
  { term: 'DeFi', definition: 'Decentralized Finance - financial services built on blockchain without traditional intermediaries.', category: 'DeFi', relatedTerms: ['Smart Contract', 'DEX', 'Yield Farming'] },
  { term: 'DEX', definition: 'Decentralized Exchange - a cryptocurrency exchange that operates without a central authority.', category: 'DeFi', relatedTerms: ['AMM', 'Liquidity Pool', 'Uniswap'] },
  { term: 'Yield Farming', definition: 'Earning rewards by providing liquidity or staking tokens in DeFi protocols.', category: 'DeFi', relatedTerms: ['Liquidity Mining', 'APY', 'Staking'] },
  { term: 'Staking', definition: 'Locking up cryptocurrency to support network operations and earn rewards.', category: 'DeFi', relatedTerms: ['Proof of Stake', 'Validator', 'APY'] },
  { term: 'Liquidity Pool', definition: 'A pool of tokens locked in a smart contract used to facilitate trading on DEXs.', category: 'DeFi', relatedTerms: ['AMM', 'Impermanent Loss', 'LP Token'] },
  { term: 'APY', definition: 'Annual Percentage Yield - the rate of return on an investment over one year including compound interest.', category: 'DeFi', relatedTerms: ['APR', 'Yield Farming', 'Staking'] },
  { term: 'Gas', definition: 'A fee paid to process transactions on the Ethereum network and other blockchains.', category: 'DeFi', relatedTerms: ['Gwei', 'Transaction Fee', 'Ethereum'] },
  { term: 'Impermanent Loss', definition: 'The temporary loss of funds when providing liquidity due to price changes.', category: 'DeFi', relatedTerms: ['Liquidity Pool', 'AMM'] },
  // Advanced
  { term: 'Layer 2', definition: 'A secondary framework built on top of an existing blockchain to improve scalability.', category: 'Advanced', relatedTerms: ['Lightning Network', 'Rollup', 'Scaling'] },
  { term: 'NFT', definition: 'Non-Fungible Token - a unique digital asset that represents ownership of specific items.', category: 'Advanced', relatedTerms: ['ERC-721', 'Digital Art', 'Collectibles'] },
  { term: 'DAO', definition: 'Decentralized Autonomous Organization - an organization governed by smart contracts and token holders.', category: 'Advanced', relatedTerms: ['Governance', 'Voting', 'Token'] },
  { term: 'Oracle', definition: 'A service that provides external data to smart contracts on the blockchain.', category: 'Advanced', relatedTerms: ['Chainlink', 'Price Feed', 'Smart Contract'] },
  { term: 'Whitepaper', definition: 'A document that explains a cryptocurrency project\'s technology, goals, and tokenomics.', category: 'Advanced', relatedTerms: ['Tokenomics', 'Roadmap'] },
  { term: 'Fork', definition: 'A change to blockchain protocol rules that creates a new version of the blockchain.', category: 'Advanced', relatedTerms: ['Hard Fork', 'Soft Fork', 'Bitcoin Cash'] },
  { term: 'Airdrop', definition: 'Free distribution of tokens to wallet addresses, often as a marketing strategy.', category: 'Advanced', relatedTerms: ['Token Distribution', 'Marketing'] },
];

/**
 * Calculate relevance score based on match position and type
 */
function calculateScore(
  query: string,
  text: string,
  isTitle: boolean = false
): number {
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();

  if (!lowerText.includes(lowerQuery)) {
    return 0;
  }

  let score = 1;

  // Exact match bonus
  if (lowerText === lowerQuery) {
    score += 10;
  }

  // Starts with query bonus
  if (lowerText.startsWith(lowerQuery)) {
    score += 5;
  }

  // Word boundary match bonus
  if (lowerText.includes(` ${lowerQuery}`) || lowerText.startsWith(lowerQuery)) {
    score += 3;
  }

  // Title match bonus
  if (isTitle) {
    score *= 2;
  }

  // Shorter text is more relevant (more specific match)
  score += Math.max(0, 10 - text.length / 50);

  return score;
}

/**
 * Search guides
 */
function searchGuides(query: string): SearchResult[] {
  const results: SearchResult[] = [];
  const allGuides = getAllGuides();

  for (const guide of allGuides) {
    const titleScore = calculateScore(query, guide.title, true);
    const descScore = calculateScore(query, guide.description);
    const contentScore = calculateScore(query, guide.content) * 0.5; // Lower weight for content
    const categoryScore = calculateScore(query, guide.category);

    const totalScore = titleScore + descScore + contentScore + categoryScore;

    if (totalScore > 0) {
      results.push({
        id: guide.id,
        type: 'guide',
        title: guide.title,
        description: guide.description,
        url: `/learn/${guide.id}`,
        category: guide.category,
        icon: guide.icon,
        score: totalScore,
        metadata: {
          readTime: guide.readTime,
        },
      });
    }
  }

  return results;
}

/**
 * Search courses and modules
 */
function searchCourses(query: string): SearchResult[] {
  const results: SearchResult[] = [];
  const allCourses = getAllCourses();

  for (const course of allCourses) {
    // Search course
    const titleScore = calculateScore(query, course.title, true);
    const descScore = calculateScore(query, course.description);
    const longDescScore = calculateScore(query, course.longDescription) * 0.5;

    const courseScore = titleScore + descScore + longDescScore;

    if (courseScore > 0) {
      results.push({
        id: course.id,
        type: 'course',
        title: course.title,
        description: course.description,
        url: `/course/${course.id}`,
        category: course.difficulty,
        icon: course.icon,
        score: courseScore,
        metadata: {
          moduleCount: course.moduleCount,
          difficulty: course.difficulty,
        },
      });
    }

    // Search modules
    for (const module of course.modules) {
      const modTitleScore = calculateScore(query, module.title, true);
      const modDescScore = calculateScore(query, module.description);
      const modContentScore = calculateScore(query, module.content) * 0.3;

      const moduleScore = modTitleScore + modDescScore + modContentScore;

      if (moduleScore > 0) {
        results.push({
          id: `${course.id}-${module.id}`,
          type: 'module',
          title: `${module.title}`,
          description: module.description,
          url: `/course/${course.id}/${module.id}`,
          category: course.title,
          score: moduleScore,
          metadata: {
            courseId: course.id,
            moduleNumber: module.moduleNumber,
            duration: module.duration,
          },
        });
      }
    }
  }

  return results;
}

/**
 * Search glossary terms
 */
function searchGlossary(query: string): SearchResult[] {
  const results: SearchResult[] = [];

  for (const term of GLOSSARY_TERMS) {
    const termScore = calculateScore(query, term.term, true);
    const defScore = calculateScore(query, term.definition);
    const categoryScore = calculateScore(query, term.category) * 0.5;

    const totalScore = termScore + defScore + categoryScore;

    if (totalScore > 0) {
      results.push({
        id: term.term.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        type: 'glossary',
        title: term.term,
        description: term.definition,
        url: `/glossary?term=${encodeURIComponent(term.term)}`,
        category: term.category,
        score: totalScore,
        metadata: {
          relatedTerms: term.relatedTerms,
        },
      });
    }
  }

  return results;
}

/**
 * Search exchanges
 */
function searchExchanges(query: string): SearchResult[] {
  const results: SearchResult[] = [];

  for (const exchange of exchanges) {
    const nameScore = calculateScore(query, exchange.name, true);
    const descScore = calculateScore(query, exchange.description);
    const countryScore = calculateScore(query, exchange.country);
    const prosScore = exchange.pros.reduce(
      (acc, pro) => acc + calculateScore(query, pro) * 0.3,
      0
    );

    const totalScore = nameScore + descScore + countryScore + prosScore;

    if (totalScore > 0) {
      results.push({
        id: exchange.id,
        type: 'exchange',
        title: exchange.name,
        description: exchange.description,
        url: `/compare/exchange/${exchange.id}`,
        category: 'Exchange',
        score: totalScore,
        metadata: {
          country: exchange.country,
          trustScore: exchange.trust_score,
          userRating: exchange.user_rating,
        },
      });
    }
  }

  return results;
}

/**
 * Search wallets
 */
function searchWallets(query: string): SearchResult[] {
  const results: SearchResult[] = [];

  for (const wallet of wallets) {
    const nameScore = calculateScore(query, wallet.name, true);
    const descScore = calculateScore(query, wallet.description);
    const typeScore = calculateScore(query, wallet.type);
    const chainsScore = wallet.supported_chains.reduce(
      (acc, chain) => acc + calculateScore(query, chain) * 0.5,
      0
    );

    const totalScore = nameScore + descScore + typeScore + chainsScore;

    if (totalScore > 0) {
      results.push({
        id: wallet.id,
        type: 'wallet',
        title: wallet.name,
        description: wallet.description,
        url: `/compare/wallet/${wallet.id}`,
        category: wallet.type.charAt(0).toUpperCase() + wallet.type.slice(1),
        score: totalScore,
        metadata: {
          type: wallet.type,
          price: wallet.price,
          userRating: wallet.user_rating,
        },
      });
    }
  }

  return results;
}

/**
 * Search cryptocurrencies via CoinGecko API
 */
async function searchCryptos(query: string): Promise<SearchResult[]> {
  if (query.length < 2) return [];

  try {
    const cryptos = await searchCryptocurrencies(query);
    return cryptos.slice(0, 5).map((crypto, index) => ({
      id: crypto.id,
      type: 'crypto' as SearchResultType,
      title: `${crypto.name} (${crypto.symbol.toUpperCase()})`,
      description: `View price chart and market data for ${crypto.name}`,
      url: `/charts?coin=${crypto.id}`,
      category: 'Cryptocurrency',
      icon: crypto.thumb,
      score: 10 - index, // Higher rank = higher score
      metadata: {
        symbol: crypto.symbol,
        thumb: crypto.thumb,
      },
    }));
  } catch (error) {
    console.error('Error searching cryptocurrencies:', error);
    return [];
  }
}

/**
 * Main search function - searches all content types
 */
export async function globalSearch(
  query: string,
  filters?: SearchFilters
): Promise<SearchResults> {
  const startTime = performance.now();
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 2) {
    return {
      results: [],
      totalCount: 0,
      query: trimmedQuery,
      searchTime: 0,
    };
  }

  const allowedTypes = filters?.types || [
    'guide',
    'course',
    'module',
    'glossary',
    'exchange',
    'wallet',
    'crypto',
  ];

  let allResults: SearchResult[] = [];

  // Search local content synchronously
  if (allowedTypes.includes('guide')) {
    allResults.push(...searchGuides(trimmedQuery));
  }
  if (allowedTypes.includes('course') || allowedTypes.includes('module')) {
    allResults.push(...searchCourses(trimmedQuery));
  }
  if (allowedTypes.includes('glossary')) {
    allResults.push(...searchGlossary(trimmedQuery));
  }
  if (allowedTypes.includes('exchange')) {
    allResults.push(...searchExchanges(trimmedQuery));
  }
  if (allowedTypes.includes('wallet')) {
    allResults.push(...searchWallets(trimmedQuery));
  }

  // Search cryptocurrencies asynchronously
  if (allowedTypes.includes('crypto')) {
    const cryptoResults = await searchCryptos(trimmedQuery);
    allResults.push(...cryptoResults);
  }

  // Filter by type if specified
  if (filters?.types && filters.types.length > 0) {
    allResults = allResults.filter((r) => filters.types!.includes(r.type));
  }

  // Sort by score (descending)
  allResults.sort((a, b) => b.score - a.score);

  // Apply limit
  const limit = filters?.limit || 50;
  const limitedResults = allResults.slice(0, limit);

  const endTime = performance.now();

  return {
    results: limitedResults,
    totalCount: allResults.length,
    query: trimmedQuery,
    searchTime: endTime - startTime,
  };
}

/**
 * Quick search for autocomplete (limited results, no crypto API call)
 */
export function quickSearch(query: string, limit: number = 8): SearchResult[] {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 2) {
    return [];
  }

  const allResults: SearchResult[] = [
    ...searchGuides(trimmedQuery),
    ...searchCourses(trimmedQuery),
    ...searchGlossary(trimmedQuery),
    ...searchExchanges(trimmedQuery),
    ...searchWallets(trimmedQuery),
  ];

  // Sort by score and limit
  return allResults.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Get search result type label
 */
export function getResultTypeLabel(type: SearchResultType): string {
  const labels: Record<SearchResultType, string> = {
    guide: 'Guide',
    course: 'Course',
    module: 'Module',
    glossary: 'Term',
    exchange: 'Exchange',
    wallet: 'Wallet',
    crypto: 'Crypto',
  };
  return labels[type] || type;
}

/**
 * Get search result type color
 */
export function getResultTypeColor(type: SearchResultType): string {
  const colors: Record<SearchResultType, string> = {
    guide: 'bg-blue-500/20 text-blue-400',
    course: 'bg-purple-500/20 text-purple-400',
    module: 'bg-purple-500/20 text-purple-300',
    glossary: 'bg-green-500/20 text-green-400',
    exchange: 'bg-orange-500/20 text-orange-400',
    wallet: 'bg-cyan-500/20 text-cyan-400',
    crypto: 'bg-yellow-500/20 text-yellow-400',
  };
  return colors[type] || 'bg-gray-500/20 text-gray-400';
}
