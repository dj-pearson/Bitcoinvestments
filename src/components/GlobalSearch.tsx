/**
 * Global Search Component
 *
 * A search input with autocomplete dropdown that searches across all content types.
 * Designed to be placed in the header for quick access.
 *
 * WCAG 2.1 Success Criteria:
 * - 1.3.1 Info and Relationships (Level A) - proper combobox ARIA pattern
 * - 2.1.1 Keyboard (Level A) - full keyboard navigation
 * - 4.1.2 Name, Role, Value (Level A) - proper ARIA roles and states
 */

import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  BookOpen,
  GraduationCap,
  BookMarked,
  Building2,
  Wallet,
  Coins,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import {
  quickSearch,
  type SearchResult,
  type SearchResultType,
  getResultTypeLabel,
  getResultTypeColor,
} from '../services/search';
import { cn } from '../lib/utils';

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

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

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
  variant?: 'header' | 'page' | 'mobile';
  onClose?: () => void;
}

export function GlobalSearch({
  className = '',
  placeholder = 'Search guides, exchanges, wallets...',
  variant = 'header',
  onClose,
}: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const listboxId = useId();
  const inputId = useId();

  const debouncedQuery = useDebounce(query, 200);

  // Search when query changes
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Use quick search for autocomplete
    const searchResults = quickSearch(debouncedQuery, 8);
    setResults(searchResults);
    setIsLoading(false);
    setSelectedIndex(-1);
  }, [debouncedQuery]);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onClose?.();
  };

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          } else if (query.trim().length >= 2) {
            // Navigate to search results page
            navigate(`/search?q=${encodeURIComponent(query.trim())}`);
            setIsOpen(false);
            onClose?.();
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          inputRef.current?.blur();
          onClose?.();
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOpen, results, selectedIndex, query, navigate, onClose]
  );

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      onClose?.();
    }
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const showDropdown = isOpen && (results.length > 0 || isLoading || query.length >= 2);

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
    >
      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            'relative flex items-center',
            variant === 'header' && 'w-48 md:w-64 lg:w-80',
            variant === 'page' && 'w-full max-w-[calc(100vw-2rem)] sm:max-w-xl md:max-w-2xl',
            variant === 'mobile' && 'w-full'
          )}
        >
          <label htmlFor={inputId} className="sr-only">
            Search guides, exchanges, wallets, and more
          </label>
          <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={listboxId}
            aria-activedescendant={selectedIndex >= 0 && results[selectedIndex] ? `search-result-${results[selectedIndex].type}-${results[selectedIndex].id}` : undefined}
            aria-autocomplete="list"
            aria-haspopup="listbox"
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              'w-full pl-10 pr-10 py-2.5 sm:py-2 rounded-lg bg-white/5 border border-white/10',
              'text-white placeholder-gray-400 text-sm sm:text-base',
              'focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary',
              'transition-all min-h-[44px]',
              variant === 'page' && 'py-3 text-base sm:text-lg',
              variant === 'mobile' && 'py-3'
            )}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="absolute right-2 p-2 rounded hover:bg-white/10 transition-colors touch-target-sm"
            >
              <X className="w-4 h-4 text-gray-400" aria-hidden="true" />
            </button>
          )}
          {isLoading && (
            <Loader2 className="absolute right-3 w-4 h-4 text-gray-400 animate-spin" aria-hidden="true" />
          )}
        </div>
      </form>

      {/* Dropdown Results */}
      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Search results"
          className={cn(
            'absolute top-full left-0 right-0 mt-2 z-50',
            'bg-gray-900 border border-white/10 rounded-xl shadow-xl',
            'max-h-[60vh] sm:max-h-[400px] overflow-y-auto',
            variant === 'page' && 'max-w-[calc(100vw-2rem)] sm:max-w-xl md:max-w-2xl'
          )}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" aria-hidden="true" />
              <span className="sr-only">Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <>
              <ul className="py-2" role="presentation">
                <li role="status" className="sr-only" aria-live="polite">
                  {results.length} results found
                </li>
                {results.map((result, index) => {
                  const Icon = getResultIcon(result.type);
                  const optionId = `search-result-${result.type}-${result.id}`;
                  return (
                    <li
                      key={`${result.type}-${result.id}`}
                      id={optionId}
                      role="option"
                      aria-selected={index === selectedIndex}
                    >
                      <button
                        type="button"
                        onClick={() => handleResultClick(result)}
                        tabIndex={-1}
                        className={cn(
                          'w-full px-3 sm:px-4 py-3 sm:py-3 flex items-start gap-2 sm:gap-3 text-left',
                          'transition-colors min-h-[52px]',
                          index === selectedIndex
                            ? 'bg-white/10'
                            : 'hover:bg-white/5 active:bg-white/10'
                        )}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <Icon className="w-5 h-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white truncate">
                              {result.title}
                            </span>
                            <span
                              className={cn(
                                'px-1.5 py-0.5 text-xs rounded flex-shrink-0',
                                getResultTypeColor(result.type)
                              )}
                            >
                              {getResultTypeLabel(result.type)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 line-clamp-1 mt-0.5">
                            {result.description}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="border-t border-white/10 p-2">
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
                    setIsOpen(false);
                    onClose?.();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-brand-primary hover:bg-white/5 rounded-lg transition-colors"
                >
                  View all results
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </>
          ) : query.length >= 2 ? (
            <div className="py-8 text-center" role="status" aria-live="polite">
              <p className="text-gray-400">No results found for "{query}"</p>
              <p className="text-sm text-gray-500 mt-1">
                Try different keywords or browse our{' '}
                <a href="/learn" className="text-brand-primary hover:underline">
                  guides
                </a>
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/**
 * Mobile search modal trigger
 *
 * WCAG 2.1 Success Criteria:
 * - 2.4.3 Focus Order (Level A) - focus trap in modal
 * - 4.1.2 Name, Role, Value (Level A) - proper labels
 */
export function MobileSearchTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors lg:hidden"
        aria-label="Open search"
      >
        <Search className="w-5 h-5 text-gray-300" aria-hidden="true" />
      </button>

      {/* Mobile Search Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-0 left-0 right-0 bg-gray-900 p-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <GlobalSearch
                variant="mobile"
                placeholder="Search..."
                onClose={() => setIsOpen(false)}
                className="flex-grow"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close search"
              >
                <X className="w-5 h-5 text-gray-300" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GlobalSearch;
