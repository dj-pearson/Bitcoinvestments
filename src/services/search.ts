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
 * Split a query into search terms.
 */
function tokenizeQuery(query: string): string[] {
  return query.toLowerCase().trim().split(/\s+/).filter(Boolean);
}

/**
 * Score a single term against a single field.
 */
function scoreTerm(term: string, lowerText: string, isTitle: boolean): number {
  if (!lowerText.includes(term)) {
    return 0;
  }

  let score = 1;

  // The field is exactly this term.
  if (lowerText === term) {
    score += 10;
  }

  // The field opens with the term.
  if (lowerText.startsWith(term)) {
    score += 5;
  }

  // The term starts a word rather than landing mid-word, so that "cat" ranks
  // "cat wallet" above "concatenate".
  if (new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(lowerText)) {
    score += 3;
  }

  return isTitle ? score * 2 : score;
}

interface ScoredField {
  text: string | undefined;
  weight?: number;
  isTitle?: boolean;
}

/**
 * Relevance of a document to a query.
 *
 * Scoring is per term. The previous implementation tested
 * `lowerText.includes(lowerQuery)` against the whole query string and returned
 * zero otherwise, so a document only matched if it contained the entire query as
 * one literal substring. Any query of more than one word therefore found nothing
 * unless that exact phrase appeared verbatim: on this site's own content,
 * "bitcoin wallet", "how to buy bitcoin" and "dollar cost averaging" all returned
 * no results at all, the last one despite a DCA calculator and guides existing.
 *
 * Terms are combined with AND - every term must appear somewhere in the document -
 * which is what a user typing several words expects. A document containing the
 * full query as a phrase still scores highest, so precise queries are not
 * demoted by the change.
 */
function scoreDocument(query: string, fields: ScoredField[]): number {
  const terms = tokenizeQuery(query);
  if (terms.length === 0) return 0;

  const phrase = query.toLowerCase().trim();
  const matchedTerms = new Set<string>();
  let score = 0;

  for (const field of fields) {
    const lowerText = field.text?.toLowerCase();
    if (!lowerText) continue;

    const weight = field.weight ?? 1;
    const isTitle = field.isTitle ?? false;
    let fieldMatched = false;

    for (const term of terms) {
      const termScore = scoreTerm(term, lowerText, isTitle);
      if (termScore > 0) {
        matchedTerms.add(term);
        fieldMatched = true;
        score += termScore * weight;
      }
    }

    if (fieldMatched) {
      // A match in a short field is more specific than the same match buried in
      // a long one. Applied once per field rather than once per term, so a
      // wordier query cannot inflate it.
      score += Math.max(0, 10 - lowerText.length / 50) * weight;
    }

    // The whole query appearing intact is a stronger signal than its words
    // appearing scattered, so phrase matches stay on top.
    if (terms.length > 1 && lowerText.includes(phrase)) {
      score += 8 * weight * (isTitle ? 2 : 1);
    }
  }

  // Every term has to land somewhere, or the document is not a match.
  if (matchedTerms.size < terms.length) {
    return 0;
  }

  return score;
}

/**
 * Search guides
 */
function searchGuides(query: string): SearchResult[] {
  const results: SearchResult[] = [];
  const allGuides = getAllGuides();

  for (const guide of allGuides) {
    const totalScore = scoreDocument(query, [
      { text: guide.title, isTitle: true },
      { text: guide.description },
      { text: guide.content, weight: 0.5 }, // Lower weight for content
      { text: guide.category },
    ]);

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
    const courseScore = scoreDocument(query, [
      { text: course.title, isTitle: true },
      { text: course.description },
      { text: course.longDescription, weight: 0.5 },
    ]);

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
      const moduleScore = scoreDocument(query, [
        { text: module.title, isTitle: true },
        { text: module.description },
        { text: module.content, weight: 0.3 },
      ]);

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
    const totalScore = scoreDocument(query, [
      { text: term.term, isTitle: true },
      { text: term.definition },
      { text: term.category, weight: 0.5 },
    ]);

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
    const totalScore = scoreDocument(query, [
      { text: exchange.name, isTitle: true },
      { text: exchange.description },
      { text: exchange.country },
      ...exchange.pros.map((pro) => ({ text: pro, weight: 0.3 })),
    ]);

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
    const totalScore = scoreDocument(query, [
      { text: wallet.name, isTitle: true },
      { text: wallet.description },
      { text: wallet.type },
      ...wallet.supported_chains.map((chain) => ({ text: chain, weight: 0.5 })),
    ]);

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
