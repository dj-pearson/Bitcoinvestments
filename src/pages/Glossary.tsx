import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Search, Link2 } from 'lucide-react';
import { SEO, generateBreadcrumbSchema } from '../components/SEO';
import { RelatedPages } from '../components/InternalLinks';
import { PAGE_METADATA } from '../lib/seo';
import {
  GLOSSARY_TERMS,
  GLOSSARY_CATEGORIES,
  GLOSSARY_LAST_REVIEWED,
  getGlossaryTerm,
  findBrokenGlossaryLinks,
  type GlossaryTerm,
} from '../data/glossary';
import { formatGuideDate } from '../data/guides';

const SITE_URL = 'https://bitcoinvestments.net';
const CATEGORIES = ['All', ...GLOSSARY_CATEGORIES];

if (import.meta.env.DEV) {
  const broken = findBrokenGlossaryLinks();
  if (broken.length > 0) {
    console.error('Glossary: related terms that do not resolve', broken);
  }
}

const SORTED_TERMS = [...GLOSSARY_TERMS].sort((a, b) =>
  a.term.localeCompare(b.term, 'en', { sensitivity: 'base' })
);

function firstLetter(term: string): string {
  const c = term[0].toUpperCase();
  return /[A-Z]/.test(c) ? c : '#';
}

/** Resolve a `?term=` value, which may be a slug or a display name. */
function resolveTermParam(value: string): GlossaryTerm | undefined {
  const bySlug = getGlossaryTerm(value.toLowerCase());
  if (bySlug) return bySlug;
  const lower = value.toLowerCase();
  return GLOSSARY_TERMS.find(
    (t) => t.term.toLowerCase() === lower || t.term.toLowerCase().startsWith(`${lower} (`)
  );
}

export function Glossary() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [highlighted, setHighlighted] = useState<string | null>(null);

  // Deep links: /glossary#slug or /glossary?term=Name. Runs after render so the
  // first (prerenderable) render always lists every term.
  const termParam = searchParams.get('term');
  const hash = location.hash;
  useEffect(() => {
    const fromHash = hash ? decodeURIComponent(hash.slice(1)) : '';
    const target = (fromHash && getGlossaryTerm(fromHash)) || (termParam ? resolveTermParam(termParam) : undefined);
    if (!target) return;
    // Make sure the term is not filtered out, then scroll to it.
    setSearchQuery('');
    setSelectedCategory('All');
    setHighlighted(target.slug);
    const raf = window.requestAnimationFrame(() => {
      const el = document.getElementById(target.slug);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus({ preventScroll: true });
      }
    });
    const timer = window.setTimeout(() => setHighlighted(null), 4000);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [hash, termParam]);

  const filteredTerms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return SORTED_TERMS.filter((item) => {
      const matchesSearch =
        !q || item.term.toLowerCase().includes(q) || item.definition.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const groupedTerms = useMemo(() => {
    const groups: Array<[string, GlossaryTerm[]]> = [];
    for (const term of filteredTerms) {
      const letter = firstLetter(term.term);
      const last = groups[groups.length - 1];
      if (last && last[0] === letter) last[1].push(term);
      else groups.push([letter, [term]]);
    }
    return groups;
  }, [filteredTerms]);

  const lettersPresent = new Set(groupedTerms.map(([letter]) => letter));

  const meta = PAGE_METADATA.glossary;
  const glossaryUrl = `${SITE_URL}/glossary`;
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'DefinedTermSet',
      '@id': `${glossaryUrl}#terms`,
      name: 'Bitcoinvestments Crypto Glossary',
      description: meta.description,
      url: glossaryUrl,
      dateModified: GLOSSARY_LAST_REVIEWED,
      hasDefinedTerm: SORTED_TERMS.map((t) => ({
        '@type': 'DefinedTerm',
        '@id': `${glossaryUrl}#${t.slug}`,
        url: `${glossaryUrl}#${t.slug}`,
        name: t.term,
        description: t.definition,
        inDefinedTermSet: `${glossaryUrl}#terms`,
      })),
    },
    generateBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Glossary', url: '/glossary' },
    ]),
  ];

  const filtersActive = searchQuery.trim() !== '' || selectedCategory !== 'All';

  return (
    <>
      <SEO
        title={meta.title}
        description={meta.description}
        keywords={meta.keywords}
        url={glossaryUrl}
        blufSummary={`A plain-English glossary of ${GLOSSARY_TERMS.length} cryptocurrency terms, from Bitcoin, seed phrases and halving to slippage, staking, Form 1099-DA and spot Bitcoin ETFs. Each term has its own link.`}
        contentCategory="Education"
        modifiedTime={GLOSSARY_LAST_REVIEWED}
        schema={schema}
      />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Crypto Glossary</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Short, plain-English definitions of {GLOSSARY_TERMS.length} terms you will meet when
            buying, storing and paying tax on crypto. Every term has its own link you can share, and
            many point to a guide that goes deeper.
          </p>
          <p className="text-sm text-gray-500 mt-3">
            Definitions last reviewed{' '}
            <time dateTime={GLOSSARY_LAST_REVIEWED}>{formatGuideDate(GLOSSARY_LAST_REVIEWED)}</time>.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <label htmlFor="glossary-search" className="sr-only">
              Search glossary terms
            </label>
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              aria-hidden="true"
            />
            <input
              id="glossary-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search terms and definitions..."
              className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={selectedCategory === category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* A–Z jump bar */}
        <nav aria-label="Jump to letter" className="mb-6">
          <ul className="flex flex-wrap gap-1">
            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => (
              <li key={letter}>
                {lettersPresent.has(letter) ? (
                  <a
                    href={`#letter-${letter}`}
                    className="block w-8 h-8 leading-8 text-center rounded bg-gray-800 text-gray-200 hover:bg-orange-500 hover:text-white text-sm"
                  >
                    {letter}
                  </a>
                ) : (
                  <span className="block w-8 h-8 leading-8 text-center rounded text-gray-600 text-sm" aria-hidden="true">
                    {letter}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <p className="text-gray-400 text-sm mb-6" aria-live="polite">
          Showing {filteredTerms.length} of {GLOSSARY_TERMS.length} terms
          {filtersActive && (
            <>
              {' · '}
              <button
                type="button"
                className="text-orange-500 hover:text-orange-400 underline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
              >
                Show all
              </button>
            </>
          )}
        </p>

        {/* Glossary List: every definition is in the HTML */}
        {groupedTerms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No terms match your search.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {groupedTerms.map(([letter, terms]) => (
              <section key={letter} aria-labelledby={`letter-${letter}`}>
                <h2
                  id={`letter-${letter}`}
                  className="text-2xl font-bold text-orange-500 mb-4 border-b border-gray-700 pb-2 scroll-mt-24"
                >
                  {letter}
                </h2>
                <dl className="space-y-3">
                  {terms.map((item) => (
                    <div
                      key={item.slug}
                      id={item.slug}
                      tabIndex={-1}
                      className={`scroll-mt-24 rounded-xl border px-6 py-4 transition-colors focus:outline-none ${
                        highlighted === item.slug
                          ? 'bg-orange-500/10 border-orange-500'
                          : 'bg-gray-800 border-gray-700'
                      }`}
                    >
                      <dt className="flex flex-wrap items-center gap-3">
                        <span className="text-lg font-semibold text-white">{item.term}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                          {item.category}
                        </span>
                        <a
                          href={`#${item.slug}`}
                          className="ml-auto text-gray-500 hover:text-orange-400"
                          aria-label={`Link to ${item.term}`}
                          title="Link to this term"
                        >
                          <Link2 className="w-4 h-4" aria-hidden="true" />
                        </a>
                      </dt>
                      <dd className="mt-2">
                        <p className="text-gray-300 leading-relaxed">{item.definition}</p>
                        {item.learnMore && (
                          <p className="mt-2 text-sm">
                            <Link to={item.learnMore.url} className="text-orange-500 hover:text-orange-400 underline">
                              {item.learnMore.label}
                            </Link>
                          </p>
                        )}
                        {item.related && item.related.length > 0 && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="text-sm text-gray-500">Related:</span>
                            {item.related.map((slug) => {
                              const rel = getGlossaryTerm(slug);
                              if (!rel) return null;
                              return (
                                <Link
                                  key={slug}
                                  to={{ pathname: '/glossary', hash: `#${slug}` }}
                                  className="text-sm px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors"
                                >
                                  {rel.term}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        )}

        <div className="mt-12">
          <RelatedPages currentPath="/glossary" title="Continue Learning" />
        </div>
      </div>
    </>
  );
}
