import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  AlertTriangle,
  Shield,
  ExternalLink,
  Filter,
  ChevronDown,
  ChevronUp,
  Info,
  X,
  Flag,
  BookOpen,
} from 'lucide-react';
import { PageSEO } from '../components/PageSEO';
import { generateBreadcrumbSchema } from '../components/SEO';
import { Skeleton } from '../components/LoadingSkeletons';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  searchScamReports,
  checkWalletAddress,
  checkContractAddress,
  checkWebsiteUrl,
  getSearchSuggestions,
  getVerifiedReportCount,
  SUPPORTED_BLOCKCHAINS,
  SCAM_DB_UNAVAILABLE,
} from '../services/scamDatabase';
import { SCAM_TYPES, SCAM_TYPES_LAST_REVIEWED } from '../data/scamTypes';
import { NOTABLE_SCAMS, NOTABLE_SCAMS_LAST_VERIFIED } from '../data/notableScams';
import {
  EXTERNAL_CHECKERS,
  IC3_HEADLINE,
  IC3_STATS,
  SCAM_DATABASE_FAQ,
} from '../data/scamGuidance';
import { formatDateUTC } from '../lib/scamSafety';
import type {
  ScamReportWithCommunity,
  ScamSearchFilters,
  ScamType,
  ScamSeverity,
  ScamSearchSuggestion,
} from '../types/admin-database';

const SITE_URL = 'https://bitcoinvestments.net';
const PAGE_PATH = '/scam-database';

const REPORT_TYPE_OPTIONS: { value: ScamType; label: string }[] = [
  { value: 'phishing', label: 'Phishing / wallet drainer' },
  { value: 'ponzi', label: 'Ponzi scheme' },
  { value: 'rug_pull', label: 'Rug pull' },
  { value: 'fake_ico', label: 'Fake token sale' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'fake_exchange', label: 'Fake exchange / platform' },
  { value: 'pump_dump', label: 'Pump and dump' },
  { value: 'other', label: 'Other' },
];
const VALID_REPORT_TYPES = new Set<string>(REPORT_TYPE_OPTIONS.map((t) => t.value));

const SEVERITY_OPTIONS: { value: ScamSeverity; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

type SearchMode = 'general' | 'wallet' | 'contract' | 'website';
const SEARCH_MODES: { value: SearchMode; label: string; placeholder: string }[] = [
  { value: 'general', label: 'Keyword', placeholder: 'Search reports by name, token or description' },
  { value: 'wallet', label: 'Wallet address', placeholder: 'Wallet address (0x…, bc1…, etc.)' },
  { value: 'contract', label: 'Token contract', placeholder: 'Smart contract address' },
  { value: 'website', label: 'Website', placeholder: 'Website address, e.g. example.com' },
];
const VALID_MODES = new Set<string>(SEARCH_MODES.map((m) => m.value));

type LoadStatus = 'idle' | 'loading' | 'done' | 'error';

const UNIVERSAL_RED_FLAGS = [
  'Guaranteed or unusually high returns, or fixed daily profits.',
  'Anyone asking for your seed phrase, private key or remote access to your device.',
  'You must pay a fee, tax or deposit before you can withdraw.',
  'Pressure to act now, keep it secret, or move money to a "safe" account.',
  'Being told to pay a bill, fine or debt in crypto, or to use a crypto ATM.',
  'Unsolicited contact that turns to investing, or "support" that messages you first.',
];

const RELATED_LINKS = [
  { to: '/report-scam', label: 'How to report a crypto scam', note: 'Where to report and what evidence to keep' },
  { to: '/learn/common-crypto-mistakes', label: 'Common crypto mistakes', note: 'Beginner errors that lead to losses' },
  { to: '/learn/defi-risks', label: 'DeFi risks explained', note: 'Smart-contract, rug-pull and approval risk' },
  { to: '/learn/crypto-wallets-explained', label: 'Crypto wallets explained', note: 'Seed phrases and self-custody' },
  { to: '/hardware-wallet', label: 'Hardware wallets', note: 'Keep keys off internet-connected devices' },
  { to: '/glossary', label: 'Crypto glossary', note: 'Plain-English definitions' },
];

function severityClass(severity: string) {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
}

function readInitialState(params: URLSearchParams) {
  const q = (params.get('q') || '').trim();
  const modeParam = params.get('mode') || 'general';
  const mode: SearchMode = VALID_MODES.has(modeParam) ? (modeParam as SearchMode) : 'general';
  const typeParam = params.get('type') || '';
  const chainParam = params.get('chain') || '';
  const filters: ScamSearchFilters = {
    scam_type: VALID_REPORT_TYPES.has(typeParam) ? (typeParam as ScamType) : undefined,
    blockchain: SUPPORTED_BLOCKCHAINS.includes(chainParam) ? chainParam : undefined,
    sort_by: 'created_at',
    sort_order: 'desc',
  };
  let lookup: { mode: Exclude<SearchMode, 'general'>; value: string } | null = null;
  if (q) {
    if (mode === 'general') {
      if (q.length >= 3) filters.query = q;
    } else {
      lookup = { mode, value: q };
    }
  }
  return { q, mode, filters, lookup };
}

export function ScamDatabase() {
  const dbEnabled = isSupabaseConfigured();
  const [searchParams, setSearchParams] = useSearchParams();
  const [initial] = useState(() => readInitialState(searchParams));

  const [searchMode, setSearchMode] = useState<SearchMode>(initial.mode);
  const [searchInput, setSearchInput] = useState(initial.q);
  const [inputHint, setInputHint] = useState<string | null>(null);
  const [filters, setFilters] = useState<ScamSearchFilters>(initial.filters);
  const [lookup, setLookup] = useState(initial.lookup);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [reports, setReports] = useState<ScamReportWithCommunity[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState<LoadStatus>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [verifiedCount, setVerifiedCount] = useState<number | null>(null);

  const [suggestions, setSuggestions] = useState<ScamSearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const suggestionRequest = useRef(0);

  const activeQuery = lookup?.value ?? filters.query ?? '';

  // Community report count (only when the database is configured)
  useEffect(() => {
    if (!dbEnabled) return;
    let cancelled = false;
    getVerifiedReportCount().then(({ count }) => {
      if (!cancelled) setVerifiedCount(count);
    });
    return () => {
      cancelled = true;
    };
  }, [dbEnabled]);

  // Single loader for both the filtered list and address/website lookups
  useEffect(() => {
    if (!dbEnabled) return;
    let cancelled = false;

    async function load() {
      setStatus('loading');
      setLoadError(null);
      if (lookup) {
        const fn =
          lookup.mode === 'wallet'
            ? checkWalletAddress
            : lookup.mode === 'contract'
              ? checkContractAddress
              : checkWebsiteUrl;
        const result = await fn(lookup.value);
        if (cancelled) return;
        setReports(result.scams as ScamReportWithCommunity[]);
        setTotal(result.scams.length);
        setTotalPages(1);
        setLoadError(result.error);
        setStatus(result.error ? 'error' : 'done');
      } else {
        const result = await searchScamReports(filters, { page, limit: 12 });
        if (cancelled) return;
        setReports(result.reports);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        setLoadError(result.error);
        setStatus(result.error ? 'error' : 'done');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [dbEnabled, filters, page, lookup]);

  // Keep the URL in sync so searches can be shared and reloaded
  useEffect(() => {
    const next = new URLSearchParams();
    if (activeQuery) {
      next.set('q', activeQuery);
      next.set('mode', lookup ? lookup.mode : 'general');
    }
    if (typeof filters.scam_type === 'string') next.set('type', filters.scam_type);
    if (filters.blockchain) next.set('chain', filters.blockchain);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [activeQuery, lookup, filters.scam_type, filters.blockchain, searchParams, setSearchParams]);

  // Debounced suggestions
  useEffect(() => {
    const value = searchInput.trim();
    if (!dbEnabled || value.length < 2 || !showSuggestions) return;
    const requestId = ++suggestionRequest.current;
    const timer = setTimeout(async () => {
      const result = await getSearchSuggestions(value);
      if (requestId === suggestionRequest.current) {
        setSuggestions(result);
        setActiveSuggestion(-1);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput, dbEnabled, showSuggestions]);

  function runSearch(rawValue: string, mode: SearchMode) {
    const value = rawValue.trim();
    setShowSuggestions(false);
    setInputHint(null);
    setPage(1);

    if (!value) {
      setLookup(null);
      setFilters((f) => ({ ...f, query: undefined }));
      return;
    }
    if (mode === 'general') {
      if (value.length < 3) {
        setInputHint('Enter at least 3 characters to search.');
        return;
      }
      setLookup(null);
      setFilters((f) => ({ ...f, query: value }));
    } else {
      setLookup({ mode, value });
    }
  }

  function handleSuggestion(s: ScamSearchSuggestion) {
    setShowSuggestions(false);
    setSuggestions([]);
    if (s.type === 'scam_type') {
      setSearchInput('');
      setLookup(null);
      setPage(1);
      setFilters((f) => ({ ...f, query: undefined, scam_type: s.value as ScamType }));
    } else if (s.type === 'blockchain') {
      setSearchInput('');
      setLookup(null);
      setPage(1);
      setFilters((f) => ({ ...f, query: undefined, blockchain: s.value }));
    } else if (s.type === 'address') {
      setSearchMode('wallet');
      setSearchInput(s.value);
      runSearch(s.value, 'wallet');
    } else {
      setSearchMode('general');
      setSearchInput(s.value);
      runSearch(s.value, 'general');
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const open = showSuggestions && suggestions.length > 0;
    if (e.key === 'ArrowDown' && open) {
      e.preventDefault();
      setActiveSuggestion((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp' && open) {
      e.preventDefault();
      setActiveSuggestion((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && activeSuggestion >= 0) {
        handleSuggestion(suggestions[activeSuggestion]);
      } else {
        runSearch(searchInput, searchMode);
      }
    }
  }

  function clearAll() {
    setFilters({ sort_by: 'created_at', sort_order: 'desc' });
    setLookup(null);
    setSearchInput('');
    setSearchMode('general');
    setInputHint(null);
    setPage(1);
  }

  const activeFilterCount = [filters.scam_type, filters.severity, filters.blockchain].filter(Boolean).length;

  const breadcrumbSchema = useMemo(
    () =>
      generateBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Crypto Scam Checker', url: PAGE_PATH },
      ]),
    []
  );

  const itemListSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Common cryptocurrency scam types',
      itemListElement: SCAM_TYPES.map((t, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: t.name,
        url: `${SITE_URL}${PAGE_PATH}#${t.slug}`,
      })),
    }),
    []
  );

  const lastUpdated = formatDateUTC(SCAM_TYPES_LAST_REVIEWED);
  const modeConfig = SEARCH_MODES.find((m) => m.value === searchMode) || SEARCH_MODES[0];
  const listboxOpen = showSuggestions && suggestions.length > 0;

  return (
    <>
      <PageSEO
        pageKey="scamDatabase"
        urlPath={PAGE_PATH}
        faqs={SCAM_DATABASE_FAQ}
        customSchema={[breadcrumbSchema, itemListSchema]}
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-10 h-10 text-orange-600 dark:text-orange-400" aria-hidden="true" />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Crypto Scam Checker &amp; Common Scam Types
              </h1>
            </div>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl">
              Before you send crypto, check the address or website with several independent tools and compare
              what you are being offered against the scam patterns below. {IC3_HEADLINE} No database, including
              ours, can prove that an address or website is safe.
            </p>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Last reviewed: <time dateTime={SCAM_TYPES_LAST_REVIEWED}>{lastUpdated}</time> · Sources: FBI IC3,
              FTC, SEC, CFTC and U.S. Department of Justice
            </p>
            <nav aria-label="On this page" className="mt-5 flex flex-wrap gap-2 text-sm">
              {[
                ['#check', 'Check before you send'],
                ['#red-flags', 'Red flags'],
                ['#scam-types', 'Scam types'],
                ['#statistics', 'Loss statistics'],
                ['#notable-cases', 'Documented cases'],
                ['#community-reports', 'Community reports'],
                ['#been-scammed', 'Been scammed?'],
                ['#faq', 'FAQ'],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-orange-500"
                >
                  {label}
                </a>
              ))}
            </nav>
          </header>

          {/* Check section */}
          <section id="check" aria-labelledby="check-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h2 id="check-heading" className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Check an address or website before you send
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              A scam address or site can be brand new, so check more than one source and look for the red flags
              below even when nothing turns up.
            </p>

            {dbEnabled ? (
              <div className="mb-6">
                <div role="group" aria-label="What are you checking?" className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                  {SEARCH_MODES.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      aria-pressed={searchMode === m.value}
                      onClick={() => {
                        setSearchMode(m.value);
                        setInputHint(null);
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        searchMode === m.value
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <form
                  role="search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    runSearch(searchInput, searchMode);
                  }}
                  className="flex flex-col sm:flex-row gap-2"
                >
                  <div className="flex-1 relative">
                    <label htmlFor="scam-search-input" className="sr-only">
                      {modeConfig.label} to check in our community reports
                    </label>
                    <input
                      id="scam-search-input"
                      type="text"
                      role="combobox"
                      aria-expanded={listboxOpen}
                      aria-controls="scam-search-suggestions"
                      aria-autocomplete="list"
                      aria-activedescendant={
                        listboxOpen && activeSuggestion >= 0 ? `scam-suggestion-${activeSuggestion}` : undefined
                      }
                      autoComplete="off"
                      spellCheck={false}
                      placeholder={modeConfig.placeholder}
                      value={searchInput}
                      onChange={(e) => {
                        setSearchInput(e.target.value);
                        setShowSuggestions(true);
                        if (e.target.value.trim().length < 2) setSuggestions([]);
                      }}
                      onKeyDown={handleInputKeyDown}
                      onBlur={() => setShowSuggestions(false)}
                      className="w-full px-4 py-3 pl-11 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                    {listboxOpen && (
                      <ul
                        id="scam-search-suggestions"
                        role="listbox"
                        aria-label="Search suggestions"
                        className="absolute z-40 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                      >
                        {suggestions.map((s, index) => (
                          <li
                            key={`${s.type}-${s.value}`}
                            id={`scam-suggestion-${index}`}
                            role="option"
                            aria-selected={index === activeSuggestion}
                            // onMouseDown so the choice lands before the input's blur closes the list
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSuggestion(s);
                            }}
                            className={`px-4 py-2 cursor-pointer flex items-center gap-3 text-sm ${
                              index === activeSuggestion ? 'bg-orange-50 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                              {s.type.replace(/_/g, ' ')}
                            </span>
                            <span className="text-gray-900 dark:text-white">{s.label}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <Search className="w-5 h-5" aria-hidden="true" />
                    Check
                  </button>
                </form>
                {inputHint && <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">{inputHint}</p>}

                <SearchResultBanner
                  query={activeQuery}
                  status={status}
                  error={loadError}
                  count={total}
                />
              </div>
            ) : (
              <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  Our community report search needs the account system, which is not live yet (coming soon). Until
                  then, use the independent tools below. They are free and do not need an account.
                </p>
              </div>
            )}

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Independent tools to check with</h3>
            <ul className="grid gap-3 sm:grid-cols-2">
              {EXTERNAL_CHECKERS.map((c) => (
                <li key={c.name} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-1"
                  >
                    {c.name}
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{c.description}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Universal red flags */}
          <section id="red-flags" aria-labelledby="red-flags-heading" className="mb-8">
            <h2 id="red-flags-heading" className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              Red flags that apply to almost every crypto scam
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {UNIVERSAL_RED_FLAGS.map((flag) => (
                <li key={flag} className="flex gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-gray-700 dark:text-gray-300">{flag}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Scam types */}
          <section id="scam-types" aria-labelledby="scam-types-heading" className="mb-8">
            <h2 id="scam-types-heading" className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Common crypto scam types
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              How each scam works, the warning signs, and what to do. Each entry links to the government source it
              draws on.
            </p>
            <nav aria-label="Scam types" className="flex flex-wrap gap-2 mb-6 text-sm">
              {SCAM_TYPES.map((t) => (
                <a
                  key={t.slug}
                  href={`#${t.slug}`}
                  className="px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:underline"
                >
                  {t.name.replace(/ \(.*\)$/, '')}
                </a>
              ))}
            </nav>
            <div className="space-y-6">
              {SCAM_TYPES.map((t) => (
                <article
                  key={t.slug}
                  id={t.slug}
                  aria-labelledby={`${t.slug}-heading`}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 scroll-mt-24"
                >
                  <h3 id={`${t.slug}-heading`} className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Also called: {t.aliases.join(', ')}</p>
                  <p className="mt-3 text-gray-700 dark:text-gray-300">{t.summary}</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">How it works</h4>
                      <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        {t.howItWorks.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Red flags</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        {t.redFlags.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">What to do</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        {t.whatToDo.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                    Sources:{' '}
                    {t.sources.map((s, i) => (
                      <span key={s.url}>
                        {i > 0 && ' · '}
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-orange-600">
                          {s.label}
                        </a>
                      </span>
                    ))}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {/* Statistics */}
          <section id="statistics" aria-labelledby="statistics-heading" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h2 id="statistics-heading" className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              Crypto scam losses: the numbers
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              The FBI Internet Crime Complaint Center’s {IC3_STATS.year} annual report, published {IC3_STATS.published},
              is the most recent full year of U.S. federal complaint data. It counts only losses people reported, so
              the real totals are higher.
            </p>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Crypto fraud losses reported', IC3_STATS.cryptoLosses, `${IC3_STATS.cryptoComplaints} complaints, ${IC3_STATS.cryptoChange}`],
                ['All internet-crime losses', IC3_STATS.totalLosses, `${IC3_STATS.totalComplaints} complaints`],
                ['Recovery-scam losses', IC3_STATS.recoveryScamLosses, `${IC3_STATS.recoveryScamComplaints} complaints`],
                ['Crypto ATM / kiosk losses', IC3_STATS.kioskLosses, `${IC3_STATS.kioskComplaints} complaints`],
              ].map(([label, value, note]) => (
                <div key={label} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40">
                  <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
                  <dd className="text-xl font-bold text-gray-900 dark:text-white mt-1">{value}</dd>
                  <dd className="text-xs text-gray-500 dark:text-gray-400 mt-1">{note}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Source:{' '}
              <a href={IC3_STATS.reportUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-orange-600">
                FBI IC3 {IC3_STATS.year} Internet Crime Report (PDF)
              </a>
              . For comparison, reported crypto losses in {IC3_STATS.prior.year} were {IC3_STATS.prior.cryptoLosses} (
              <a href={IC3_STATS.prior.reportUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-orange-600">
                {IC3_STATS.prior.year} report
              </a>
              ).
            </p>
          </section>

          {/* Notable cases */}
          <section id="notable-cases" aria-labelledby="notable-heading" className="mb-8">
            <h2 id="notable-heading" className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Documented cases from official sources
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Real cases, each summarised from a Justice Department or SEC release. Where a case is at the charge
              stage, the charges are allegations and the defendants are presumed innocent unless proven guilty.
              Checked {formatDateUTC(NOTABLE_SCAMS_LAST_VERIFIED)}.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {NOTABLE_SCAMS.map((c) => (
                <article key={c.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{c.name}</h3>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      {c.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {c.category} · {c.jurisdiction} · <time dateTime={c.actionDate}>{formatDateUTC(c.actionDate)}</time>
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-2">{c.amount}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{c.summary}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    <strong>Lesson:</strong> {c.lesson}{' '}
                    <a href={`#${c.scamTypeSlug}`} className="text-orange-600 dark:text-orange-400 hover:underline">
                      Read about this scam type
                    </a>
                  </p>
                  <p className="text-xs mt-3">
                    <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-1">
                      {c.sourceLabel}
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  </p>
                </article>
              ))}
            </div>
          </section>

          {/* Community reports */}
          <section id="community-reports" aria-labelledby="community-heading" className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h2 id="community-heading" className="text-2xl font-semibold text-gray-900 dark:text-white">
                {activeQuery ? 'Matching community reports' : 'Community reports'}
                {dbEnabled && status === 'done' && (
                  <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">({total})</span>
                )}
              </h2>
              {dbEnabled && (
                <button
                  type="button"
                  aria-expanded={showFilters}
                  aria-controls="community-filters"
                  onClick={() => setShowFilters((v) => !v)}
                  className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <Filter className="w-4 h-4" aria-hidden="true" />
                  Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                  {showFilters ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Community reports are allegations submitted by users and published only after a moderator review.
              They are not findings of fact or legal judgments.
              {dbEnabled && verifiedCount !== null && verifiedCount > 0 && ` ${verifiedCount.toLocaleString('en-US')} verified reports so far.`}
            </p>

            {!dbEnabled ? (
              <div className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                Community reporting needs accounts, which are coming soon. If you have been targeted, see{' '}
                <Link to="/report-scam" className="text-orange-600 dark:text-orange-400 hover:underline">
                  how to report a crypto scam
                </Link>{' '}
                to the authorities.
              </div>
            ) : (
              <>
                {showFilters && (
                  <div id="community-filters" className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow grid gap-4 md:grid-cols-4">
                    <FilterSelect
                      id="filter-type"
                      label="Report type"
                      value={typeof filters.scam_type === 'string' ? filters.scam_type : ''}
                      onChange={(v) => {
                        setPage(1);
                        setFilters((f) => ({ ...f, scam_type: (v || undefined) as ScamType | undefined }));
                      }}
                      options={[{ value: '', label: 'All types' }, ...REPORT_TYPE_OPTIONS]}
                    />
                    <FilterSelect
                      id="filter-severity"
                      label="Severity"
                      value={typeof filters.severity === 'string' ? filters.severity : ''}
                      onChange={(v) => {
                        setPage(1);
                        setFilters((f) => ({ ...f, severity: (v || undefined) as ScamSeverity | undefined }));
                      }}
                      options={[{ value: '', label: 'All severities' }, ...SEVERITY_OPTIONS]}
                    />
                    <FilterSelect
                      id="filter-chain"
                      label="Blockchain"
                      value={filters.blockchain || ''}
                      onChange={(v) => {
                        setPage(1);
                        setFilters((f) => ({ ...f, blockchain: v || undefined }));
                      }}
                      options={[{ value: '', label: 'All chains' }, ...SUPPORTED_BLOCKCHAINS.map((c) => ({ value: c, label: c }))]}
                    />
                    <FilterSelect
                      id="filter-sort"
                      label="Sort by"
                      value={`${filters.sort_by}-${filters.sort_order}`}
                      onChange={(v) => {
                        const [sortBy, sortOrder] = v.split(/-(?=[a-z]+$)/);
                        setPage(1);
                        setFilters((f) => ({
                          ...f,
                          sort_by: sortBy as ScamSearchFilters['sort_by'],
                          sort_order: sortOrder as 'asc' | 'desc',
                        }));
                      }}
                      options={[
                        { value: 'created_at-desc', label: 'Newest first' },
                        { value: 'created_at-asc', label: 'Oldest first' },
                        { value: 'victims_count-desc', label: 'Most reported victims' },
                        { value: 'estimated_loss_usd-desc', label: 'Highest reported loss' },
                      ]}
                    />
                    {lookup && (
                      <p className="md:col-span-4 text-xs text-gray-500 dark:text-gray-400">
                        Filters apply to the report list, not to address and website checks.
                      </p>
                    )}
                    {(activeFilterCount > 0 || activeQuery) && (
                      <div className="md:col-span-4 flex justify-end">
                        <button
                          type="button"
                          onClick={clearAll}
                          className="text-sm text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                        >
                          <X className="w-4 h-4" aria-hidden="true" />
                          Clear search and filters
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {status === 'loading' || status === 'idle' ? (
                  <div className="grid gap-4 md:grid-cols-2" role="status" aria-busy="true">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                    <span className="sr-only">Loading community reports…</span>
                  </div>
                ) : status === 'error' ? (
                  <div role="alert" className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100">
                    We could not load community reports right now
                    {loadError && loadError !== SCAM_DB_UNAVAILABLE ? ` (${loadError})` : ''}. Please try again later.
                  </div>
                ) : reports.length === 0 ? (
                  <div className="p-6 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    {activeQuery || activeFilterCount > 0
                      ? 'No verified community reports match. That is not evidence that something is safe.'
                      : 'No verified community reports have been published yet.'}
                  </div>
                ) : (
                  <ul className="grid gap-4 md:grid-cols-2">
                    {reports.map((report) => (
                      <li key={report.id}>
                        <Link
                          to={`/scam/${report.id}`}
                          className="block h-full bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow p-5 group"
                        >
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 line-clamp-2">
                            {report.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${severityClass(report.severity)}`}>
                              {report.severity} severity
                            </span>
                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                              {report.scam_type.replace(/_/g, ' ')}
                            </span>
                            {report.blockchain && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                                {report.blockchain}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-3">{report.description}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                            Community report · {formatDateUTC(report.created_at)}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {!lookup && totalPages > 1 && status === 'done' && (
                  <nav aria-label="Community report pages" className="mt-6 flex justify-center items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                )}
              </>
            )}
          </section>

          {/* Been scammed */}
          <section id="been-scammed" aria-labelledby="been-scammed-heading" className="mb-8 rounded-lg p-6 bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <h2 id="been-scammed-heading" className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Flag className="w-6 h-6" aria-hidden="true" />
              Been scammed? What to do now
            </h2>
            <ol className="list-decimal pl-5 space-y-1 text-orange-50">
              <li>Stop sending money, including any "fee" to unlock a withdrawal.</li>
              <li>Move remaining funds to a new wallet if your seed phrase or approvals may be compromised.</li>
              <li>Save transaction IDs, addresses, screenshots and messages.</li>
              <li>Report to the FBI (ic3.gov), the FTC and the exchange you sent funds from.</li>
              <li>Ignore anyone offering to recover your crypto for a fee. That is a second scam.</li>
            </ol>
            <Link
              to="/report-scam"
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-white text-orange-700 rounded-lg font-semibold hover:bg-orange-50"
            >
              How to report a crypto scam
            </Link>
          </section>

          {/* Methodology */}
          <section aria-labelledby="method-heading" className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 id="method-heading" className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              How this page works
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li>
                Scam-type explanations, statistics and documented cases come from U.S. government sources (FBI IC3,
                FTC, SEC, CFTC and the Justice Department), linked next to each item. We review them regularly; the
                date at the top shows the last review.
              </li>
              <li>
                Community reports are submitted by users, start as pending and are published only after a moderator
                review. They remain the reporter’s allegations.
              </li>
              <li>
                &quot;No match in our records&quot; only means no verified report exists here. It is never a safety rating.
              </li>
              <li>
                Reported website addresses are shown as inert text (for example hxxps://example[.]com), never as
                clickable links.
              </li>
            </ul>
          </section>

          {/* FAQ */}
          <section id="faq" aria-labelledby="faq-heading" className="mb-8">
            <h2 id="faq-heading" className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {SCAM_DATABASE_FAQ.map((f) => (
                <details key={f.question} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 group">
                  <summary className="font-medium text-gray-900 dark:text-white cursor-pointer">{f.question}</summary>
                  <p className="mt-2 text-gray-700 dark:text-gray-300">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>

          {/* Related */}
          <section aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-orange-500" aria-hidden="true" />
              Related guides
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {RELATED_LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="block p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md"
                  >
                    <span className="font-medium text-orange-600 dark:text-orange-400">{l.label}</span>
                    <span className="block text-sm text-gray-600 dark:text-gray-400 mt-1">{l.note}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

function SearchResultBanner({
  query,
  status,
  error,
  count,
}: {
  query: string;
  status: LoadStatus;
  error: string | null;
  count: number;
}) {
  if (!query || (status !== 'done' && status !== 'error')) return null;

  if (status === 'error') {
    return (
      <div role="alert" className="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100">
        <p className="font-medium">We couldn’t complete this check.</p>
        <p className="text-sm mt-1">
          {error && error !== SCAM_DB_UNAVAILABLE ? `${error}. ` : ''}This is not a clean result. Check &quot;{query}&quot; with
          the independent tools below before you send anything.
        </p>
      </div>
    );
  }

  if (count === 0) {
    return (
      <div role="status" className="mt-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100">
        <p className="font-medium flex items-center gap-2">
          <Info className="w-5 h-5" aria-hidden="true" />
          No match in our records for &quot;{query}&quot;. That does not mean it’s safe.
        </p>
        <p className="text-sm mt-1">
          We only hold verified community reports, and new scam addresses and sites appear every day. Check it with the
          independent tools below and compare the offer against the red flags on this page.
        </p>
      </div>
    );
  }

  return (
    <div role="alert" className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-100">
      <p className="font-medium flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" aria-hidden="true" />
        {count} verified community report{count === 1 ? '' : 's'} match &quot;{query}&quot;. Do not send funds until you have
        reviewed {count === 1 ? 'it' : 'them'}.
      </p>
      <a href="#community-reports" className="text-sm underline mt-1 inline-block">
        See the matching reports
      </a>
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
