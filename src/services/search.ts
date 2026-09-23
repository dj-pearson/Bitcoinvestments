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
 *
 * Glossary terms come from src/data/glossary.ts, the same list /glossary renders.
 */

import { getAllGuides } from '../data/guides';
import { getAllCourses } from '../data/courses';
import { exchanges } from '../data/exchanges';
import { wallets } from '../data/wallets';
import { searchCryptocurrencies } from './coingecko';
import { GLOSSARY_TERMS, glossaryTermUrl } from '../data/glossary';

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
        id: term.slug,
        type: 'glossary',
        title: term.term,
        description: term.definition,
        url: glossaryTermUrl(term.slug),
        category: term.category,
        score: totalScore,
        metadata: {
          related: term.related,
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
      description: `Price and market data for ${crypto.name}`,
      url: `/coin/${encodeURIComponent(crypto.id)}`,
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

  // Choosing "course" also means its modules: module hits are how most course
  // content is found, and there is no separate Modules filter.
  const requestedTypes = filters?.types?.length
    ? Array.from(new Set<SearchResultType>([
        ...filters.types,
        ...(filters.types.includes('course') ? (['module'] as SearchResultType[]) : []),
      ]))
    : undefined;

  const allowedTypes = requestedTypes || [
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
  if (requestedTypes) {
    allResults = allResults.filter((r) => requestedTypes.includes(r.type));
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
