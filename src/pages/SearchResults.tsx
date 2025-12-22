/**
 * Search Results Page
 *
 * Displays comprehensive search results with filtering by content type.
 */

import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  BookOpen,
  GraduationCap,
  BookMarked,
  Building2,
  Wallet,
  Coins,
  Clock,
  Star,
  ArrowRight,
} from 'lucide-react';
import {
  globalSearch,
  type SearchResult,
  type SearchResultType,
  type SearchResults as SearchResultsType,
  getResultTypeLabel,
  getResultTypeColor,
} from '../services/search';
import { GlobalSearch } from '../components/GlobalSearch';
import { cn } from '../lib/utils';

// Get icon for result type
function getResultIcon(type: SearchResultType) {
  const icons: Record<SearchResultType, typeof BookOpen> = {
    guide: BookOpen,
    course: GraduationCap,
    module: GraduationCap,
    glossary: BookMarked,
    exchange: Building2,
    wallet: Wallet,
    crypto: Coins,
  };
  return icons[type] || BookOpen;
}

// Content type filters
const CONTENT_TYPES: { type: SearchResultType; label: string; icon: typeof BookOpen }[] = [
  { type: 'guide', label: 'Guides', icon: BookOpen },
  { type: 'course', label: 'Courses', icon: GraduationCap },
  { type: 'glossary', label: 'Glossary', icon: BookMarked },
  { type: 'exchange', label: 'Exchanges', icon: Building2 },
  { type: 'wallet', label: 'Wallets', icon: Wallet },
  { type: 'crypto', label: 'Crypto', icon: Coins },
];

export function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const typeFilter = searchParams.get('type') as SearchResultType | null;

  const [results, setResults] = useState<SearchResultsType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<SearchResultType[]>(
    typeFilter ? [typeFilter] : []
  );

  // Perform search when query or filters change
  useEffect(() => {
    async function performSearch() {
      if (!query || query.length < 2) {
        setResults(null);
        return;
      }

      setIsLoading(true);
      try {
        const searchResults = await globalSearch(query, {
          types: activeFilters.length > 0 ? activeFilters : undefined,
        });
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults({
          results: [],
          totalCount: 0,
          query,
          searchTime: 0,
        });
      } finally {
        setIsLoading(false);
      }
    }

    performSearch();
  }, [query, activeFilters]);

  // Toggle filter
  const toggleFilter = (type: SearchResultType) => {
    setActiveFilters((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters([]);
  };

  // Group results by type
  const groupedResults = results?.results.reduce(
    (acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = [];
      }
      acc[result.type].push(result);
      return acc;
    },
    {} as Record<SearchResultType, SearchResult[]>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-white mb-6">Search</h1>

        {/* Search Input */}
        <GlobalSearch variant="page" placeholder="Search guides, exchanges, wallets, glossary..." />

        {/* Active Query */}
        {query && (
          <div className="mt-4 flex items-center gap-2 text-gray-400">
            <span>Showing results for:</span>
            <span className="text-white font-medium">"{query}"</span>
            {results && (
              <span className="text-sm">
                ({results.totalCount} results in {results.searchTime.toFixed(0)}ms)
              </span>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Filter by type:</span>
            {activeFilters.length > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-brand-primary hover:underline ml-2"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {CONTENT_TYPES.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                  activeFilters.includes(type)
                    ? 'bg-brand-primary text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 text-gray-400">
              <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              Searching...
            </div>
          </div>
        ) : !query ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-400 mb-2">
              Start searching
            </h2>
            <p className="text-gray-500">
              Enter a search term to find guides, courses, exchanges, wallets, and more.
            </p>

            {/* Popular Searches */}
            <div className="mt-8">
              <h3 className="text-sm font-medium text-gray-400 mb-3">
                Popular searches:
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {['Bitcoin', 'DCA', 'Ledger', 'Coinbase', 'staking', 'wallet security'].map(
                  (term) => (
                    <button
                      key={term}
                      onClick={() => setSearchParams({ q: term })}
                      className="px-3 py-1.5 rounded-full bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition-colors"
                    >
                      {term}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        ) : results && results.results.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-400 mb-2">
              No results found
            </h2>
            <p className="text-gray-500 mb-6">
              We couldn't find anything matching "{query}".
              {activeFilters.length > 0 && ' Try removing some filters.'}
            </p>

            {activeFilters.length > 0 && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors"
              >
                Clear filters
              </button>
            )}

            {/* Suggestions */}
            <div className="mt-8">
              <h3 className="text-sm font-medium text-gray-400 mb-3">
                Try these instead:
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                <Link
                  to="/learn"
                  className="px-3 py-1.5 rounded-full bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition-colors"
                >
                  Browse Guides
                </Link>
                <Link
                  to="/compare"
                  className="px-3 py-1.5 rounded-full bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition-colors"
                >
                  Compare Platforms
                </Link>
                <Link
                  to="/glossary"
                  className="px-3 py-1.5 rounded-full bg-white/5 text-gray-300 text-sm hover:bg-white/10 transition-colors"
                >
                  Glossary
                </Link>
              </div>
            </div>
          </div>
        ) : results ? (
          <div className="space-y-8">
            {/* Show results by type if no filter active, otherwise show flat list */}
            {activeFilters.length === 0 && groupedResults ? (
              Object.entries(groupedResults).map(([type, typeResults]) => (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={cn('px-2 py-1 rounded text-sm font-medium', getResultTypeColor(type as SearchResultType))}>
                      {getResultTypeLabel(type as SearchResultType)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {typeResults.length} results
                    </span>
                  </div>
                  <div className="space-y-3">
                    {typeResults.slice(0, 5).map((result) => (
                      <SearchResultCard key={`${result.type}-${result.id}`} result={result} />
                    ))}
                  </div>
                  {typeResults.length > 5 && (
                    <button
                      onClick={() => setActiveFilters([type as SearchResultType])}
                      className="mt-3 text-sm text-brand-primary hover:underline flex items-center gap-1"
                    >
                      View all {typeResults.length} {getResultTypeLabel(type as SearchResultType).toLowerCase()} results
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="space-y-3">
                {results.results.map((result) => (
                  <SearchResultCard key={`${result.type}-${result.id}`} result={result} />
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Individual search result card
 */
function SearchResultCard({ result }: { result: SearchResult }) {
  const Icon = getResultIcon(result.type);

  return (
    <Link
      to={result.url}
      className="block p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-white truncate group-hover:text-brand-primary transition-colors">
              {result.title}
            </h3>
            <span className={cn('px-1.5 py-0.5 text-xs rounded flex-shrink-0', getResultTypeColor(result.type))}>
              {getResultTypeLabel(result.type)}
            </span>
          </div>
          <p className="text-sm text-gray-400 line-clamp-2">{result.description}</p>

          {/* Metadata */}
          <div className="flex items-center gap-4 mt-2">
            {result.category && (
              <span className="text-xs text-gray-500">{result.category}</span>
            )}
            {result.metadata?.readTime && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {result.metadata.readTime} min read
              </span>
            )}
            {result.metadata?.userRating && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Star className="w-3 h-3 text-yellow-400" />
                {result.metadata.userRating as number}
              </span>
            )}
            {result.metadata?.difficulty && (
              <span className="text-xs text-gray-500">
                {result.metadata.difficulty as string}
              </span>
            )}
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-brand-primary transition-colors flex-shrink-0" />
      </div>
    </Link>
  );
}

export default SearchResults;
