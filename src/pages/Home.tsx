import { useRef, useState, useEffect, type FormEvent } from 'react';
import { ArrowRight, BookOpen, Calculator, BarChart3, TrendingUp, ShieldCheck, Search, Pause, Play } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getTopCryptocurrencies } from '../services/coingecko';
import type { Cryptocurrency } from '../types';
import { Newsletter } from '../components/Newsletter';
import { NewsFeed } from '../components/NewsFeed';
import { FearGreedGauge } from '../components/FearGreedIndex';
import { Hero, type PriceStatus } from '../components/Hero';
import { formatChange } from '../components/priceChange';
import { SEO } from '../components/SEO';
import { useLazyAnimation } from '../hooks/useGSAPLazy';
import { useAccessibility } from '../components/accessibility/AccessibilityContext';
import { formatCryptoPrice } from '../lib/utils';
import { PAGE_METADATA, SEO_CONFIG, generateFAQSchema } from '../lib/seo';
import { getAllGuides, getGuide } from '../data/guides';
import { getAllCourses } from '../data/courses';

/** Date this page's copy and FAQ were last reviewed. Update when they change. */
const LAST_REVIEWED_ISO = '2026-09-23';
const LAST_REVIEWED_LABEL = 'September 23, 2026';

// Counted from the repo's content, so the homepage can't drift from reality.
const GUIDE_COUNT = getAllGuides().length;
const COURSE_COUNT = getAllCourses().length;
const FIRST_GUIDE_MINUTES = getGuide('what-is-bitcoin')?.readTime;

const START_STEPS = [
    {
        step: 1,
        title: 'Understand what you are buying',
        body: 'Learn what Bitcoin is, how the blockchain records ownership and why prices swing so much, before you put money in.',
        links: [
            { to: '/learn/what-is-bitcoin', label: 'What is Bitcoin?' },
            { to: '/learn/understanding-blockchain', label: 'How blockchains work' },
        ],
    },
    {
        step: 2,
        title: 'Choose where to buy',
        body: 'Use an exchange that is licensed or registered where you live, supports your bank or card, and shows its fees clearly.',
        links: [
            { to: '/learn/how-to-buy-crypto', label: 'How to buy your first crypto' },
            { to: '/compare', label: 'Compare exchanges and wallets' },
        ],
    },
    {
        step: 3,
        title: 'Keep it safe and invest steadily',
        body: 'Turn on two-factor authentication, consider a hardware wallet for larger amounts, and plan regular small buys instead of guessing the top.',
        links: [
            { to: '/learn/crypto-wallets-explained', label: 'Crypto wallets explained' },
            { to: '/calculators', label: 'DCA and fee calculators' },
        ],
    },
] as const;

const FEATURES = [
    {
        icon: BookOpen,
        title: 'Learn Crypto',
        desc: `${GUIDE_COUNT} guides and a beginner course, from Bitcoin basics to DeFi risks and taxes.`,
        link: '/learn',
        color: 'bg-blue-500/20 text-blue-500',
    },
    {
        icon: BarChart3,
        title: 'Compare Platforms',
        desc: 'Side-by-side comparisons of exchanges and wallets: fees, security features and availability.',
        link: '/compare',
        color: 'bg-green-500/20 text-green-500',
    },
    {
        icon: Calculator,
        title: 'Investment Calculators',
        desc: 'DCA, fee, staking and tax calculators that run in your browser. No sign-up.',
        link: '/calculators',
        color: 'bg-purple-500/20 text-purple-500',
    },
    {
        icon: TrendingUp,
        title: 'Market Dashboard',
        desc: 'Current prices from CoinGecko and the Fear & Greed sentiment index, in one place.',
        link: '/dashboard',
        color: 'bg-orange-500/20 text-orange-500',
    },
] as const;

// Every answer here is visible on the page and mirrored in FAQPage JSON-LD.
const HOME_FAQS = [
    {
        question: 'Is Bitcoinvestments free?',
        answer:
            'Yes. Every guide, calculator, comparison and the scam database is free to use and needs no account. We earn money from some affiliate links, which are labelled. Paid Premium features are planned but not open yet.',
    },
    {
        question: 'How do I start investing in Bitcoin safely?',
        answer:
            'Learn the basics first, then buy through an exchange that is licensed or registered in your country. Turn on two-factor authentication, move larger amounts to a wallet you control, invest only money you can afford to lose, and never send crypto to someone who contacted you first.',
    },
    {
        question: 'How much money do I need to buy Bitcoin?',
        answer:
            'Not much. One bitcoin divides into 100 million units called satoshis, so you can buy a small fraction. Many exchanges let you start with a few dollars, but minimums and fees vary, and fees take a bigger share of very small purchases.',
    },
    {
        question: 'Which crypto exchange should I use?',
        answer:
            'It depends on where you live. Pick one that is allowed to serve customers in your country, supports your payment method and shows its fees up front. Some large global exchanges do not accept US residents. Our comparison pages set out fees, security features and availability side by side.',
    },
    {
        question: 'How can I tell if a crypto offer is a scam?',
        answer:
            'Warning signs include guaranteed or very high returns, pressure to act fast, requests to send crypto to "verify" or "unlock" funds, and strangers or "romantic partners" steering you to a trading platform. Search the name or address in our scam database, and report scams to the FBI\'s IC3 or the FTC in the US, or Action Fraud in the UK.',
    },
    {
        question: 'Is the information on this site financial advice?',
        answer:
            'No. Our content is general education. It does not consider your personal circumstances. Crypto is volatile and you can lose some or all of your money, so consider speaking to a regulated financial adviser before making investment decisions.',
    },
];

function PriceTicker({ prices }: { prices: Cryptocurrency[] }) {
    const { settings } = useAccessibility();
    const [paused, setPaused] = useState(false);
    const animate = !settings.reducedMotion;

    const items = (copy: number) =>
        prices.map((coin) => {
            const change = formatChange(coin.price_change_percentage_24h);
            return (
                <li key={`${coin.id}-${copy}`} className="flex items-center gap-3 px-4 whitespace-nowrap">
                    <img src={coin.image} alt="" width={24} height={24} className="w-6 h-6 rounded-full" />
                    <span className="text-white font-medium">{coin.symbol.toUpperCase()}</span>
                    <span className="text-gray-300">{formatCryptoPrice(coin.current_price)}</span>
                    <span className={change.className}>{change.text}</span>
                </li>
            );
        });

    return (
        <section aria-label="Current cryptocurrency prices" className="py-4 bg-white/5 overflow-hidden">
            <div className="container mx-auto px-4 flex items-center justify-between gap-4 mb-2 text-xs text-gray-400">
                <span>Top {prices.length} by market cap · prices from CoinGecko (USD), may be delayed</span>
                {animate && (
                    <button
                        type="button"
                        onClick={() => setPaused((p) => !p)}
                        aria-pressed={paused}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded border border-white/10 hover:bg-white/10 text-gray-300"
                    >
                        {paused ? <Play className="w-3 h-3" aria-hidden="true" /> : <Pause className="w-3 h-3" aria-hidden="true" />}
                        Pause ticker
                    </button>
                )}
            </div>
            {animate ? (
                <div
                    className="flex animate-marquee gap-8"
                    style={paused ? { animationPlayState: 'paused' } : undefined}
                >
                    <ul className="flex gap-8">{items(0)}</ul>
                    {/* Second copy only makes the loop seamless; hide it from assistive tech. */}
                    <ul className="flex gap-8" aria-hidden="true">{items(1)}</ul>
                </div>
            ) : (
                <ul className="container mx-auto px-4 flex flex-wrap justify-center gap-y-2">{items(0)}</ul>
            )}
        </section>
    );
}

function ScamCheck() {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const q = query.trim();
        navigate(q ? `/scam-database?q=${encodeURIComponent(q)}` : '/scam-database');
    };

    return (
        <section aria-labelledby="scam-check-heading" className="py-16">
            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto glass-card p-8 border border-amber-500/20">
                    <div className="flex items-center gap-3 mb-3">
                        <ShieldCheck className="w-7 h-7 text-amber-400" aria-hidden="true" />
                        <h2 id="scam-check-heading" className="text-2xl md:text-3xl font-bold">Check before you send</h2>
                    </div>
                    <p className="text-gray-300 mb-6">
                        About to send crypto to a new platform, wallet address or &ldquo;investment manager&rdquo;?
                        Search our scam database first. No match doesn&apos;t mean it&apos;s safe, but a match
                        is a reason to stop.
                    </p>
                    {/* action/method keep the search working even before JavaScript loads. */}
                    <form action="/scam-database" method="get" onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
                        <label htmlFor="home-scam-check" className="sr-only">
                            Website, project name or wallet address
                        </label>
                        <input
                            id="home-scam-check"
                            name="q"
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Website, project name or wallet address"
                            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors"
                        >
                            <Search className="w-5 h-5" aria-hidden="true" /> Check
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}

export function Home() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [prices, setPrices] = useState<Cryptocurrency[]>([]);
    const [priceStatus, setPriceStatus] = useState<PriceStatus>('loading');

    // One price request for the whole page; Hero and the ticker share it.
    useEffect(() => {
        let cancelled = false;
        getTopCryptocurrencies(6)
            .then((data) => {
                if (cancelled) return;
                setPrices(data);
                // getTopCryptocurrencies returns [] on failure rather than throwing.
                setPriceStatus(data.length > 0 ? 'ready' : 'error');
            })
            .catch(() => {
                if (!cancelled) setPriceStatus('error');
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Lazy load GSAP for scroll-triggered animations
    useLazyAnimation((gsap) => {
        import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
            gsap.registerPlugin(ScrollTrigger);

            gsap.from('.feature-card', {
                y: 30,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power2.out',
                scrollTrigger: {
                    trigger: '.features-section',
                    start: 'top 80%',
                }
            });
        });
    }, [], containerRef);

    const meta = PAGE_METADATA.home;
    const homepageSchema = [
        {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            '@id': `${SEO_CONFIG.siteUrl}/#webpage`,
            url: `${SEO_CONFIG.siteUrl}/`,
            name: meta.title,
            description: meta.description,
            dateModified: LAST_REVIEWED_ISO,
            inLanguage: 'en',
            isPartOf: { '@id': `${SEO_CONFIG.siteUrl}/#website` },
            publisher: { '@id': `${SEO_CONFIG.siteUrl}/#organization` },
            about: { '@type': 'Thing', name: 'Investing in Bitcoin and cryptocurrency for beginners' },
        },
        generateFAQSchema(HOME_FAQS),
    ];

    return (
        <>
            <SEO
                title={meta.title}
                description={meta.description}
                keywords={meta.keywords}
                modifiedTime={LAST_REVIEWED_ISO}
                schema={homepageSchema}
            />
            <div ref={containerRef} className="overflow-hidden">
                <Hero
                    prices={prices}
                    priceStatus={priceStatus}
                    guideCount={GUIDE_COUNT}
                    courseCount={COURSE_COUNT}
                />

                {/* Hidden entirely when prices can't be loaded rather than showing an empty strip. */}
                {priceStatus === 'ready' && prices.length > 0 && <PriceTicker prices={prices} />}

                {/* Start here */}
                <section aria-labelledby="start-here-heading" className="py-20">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <h2 id="start-here-heading" className="text-3xl md:text-5xl font-bold mb-4">
                                New to crypto? <span className="text-gradient">Start here</span>
                            </h2>
                            <p className="text-gray-400 text-lg">
                                Three steps most beginners should take, in this order.
                            </p>
                        </div>
                        <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {START_STEPS.map((s) => (
                                <li key={s.step} className="glass-card p-6">
                                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-brand-primary/20 text-brand-primary font-bold mb-4" aria-hidden="true">
                                        {s.step}
                                    </span>
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        <span className="sr-only">Step {s.step}: </span>
                                        {s.title}
                                    </h3>
                                    <p className="text-gray-400 mb-4">{s.body}</p>
                                    <ul className="space-y-1">
                                        {s.links.map((l) => (
                                            <li key={l.to}>
                                                <Link to={l.to} className="text-brand-primary hover:underline inline-flex items-center gap-1">
                                                    {l.label} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                <ScamCheck />

                {/* Features Section */}
                <section aria-labelledby="features-heading" className="py-20 relative features-section">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <h2 id="features-heading" className="text-3xl md:text-5xl font-bold mb-6">What you&apos;ll find <span className="text-gradient">here</span></h2>
                            <p className="text-gray-400 text-lg">
                                Everything below is free and works without an account.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {FEATURES.map((feature) => (
                                <Link
                                    key={feature.link}
                                    to={feature.link}
                                    className="glass-card p-6 feature-card hover:-translate-y-2 transition-all duration-300 group"
                                >
                                    <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                                        <feature.icon className="w-6 h-6" aria-hidden="true" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-brand-primary transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        {feature.desc}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Market Sentiment & News Section */}
                <section aria-labelledby="market-mood-heading" className="py-16 bg-white/5">
                    <div className="container mx-auto px-4">
                        <h2 id="market-mood-heading" className="text-2xl md:text-3xl font-bold mb-2">Market mood and headlines</h2>
                        <p className="text-gray-400 mb-8 max-w-3xl">
                            A snapshot from third-party sources. Short-term sentiment and headlines are
                            context, not signals to buy or sell.
                        </p>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1">
                                <FearGreedGauge />
                            </div>
                            <div className="lg:col-span-2">
                                <NewsFeed limit={4} variant="full" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section aria-labelledby="faq-heading" className="py-20">
                    <div className="container mx-auto px-4 max-w-3xl">
                        <h2 id="faq-heading" className="text-3xl md:text-4xl font-bold mb-8 text-center">
                            Frequently asked questions
                        </h2>
                        <div className="space-y-4">
                            {HOME_FAQS.map((faq) => (
                                <details key={faq.question} className="glass-card p-6 group" open>
                                    <summary className="cursor-pointer text-lg font-semibold text-white">
                                        <h3 className="inline">{faq.question}</h3>
                                    </summary>
                                    <p className="text-gray-300 mt-3 leading-relaxed">{faq.answer}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                {/* About / how we make money */}
                <section aria-labelledby="about-heading" className="py-16 bg-white/5">
                    <div className="container mx-auto px-4 max-w-3xl">
                        <h2 id="about-heading" className="text-2xl md:text-3xl font-bold mb-4">Who we are and how we make money</h2>
                        <p className="text-gray-300 mb-4">
                            Bitcoinvestments is an independent education website. We are not a bank, broker,
                            exchange or financial adviser, and we never ask you to send us crypto. The site is
                            free because some links to exchanges and wallets are affiliate links: if you sign up
                            through one, the provider may pay us a commission at no cost to you. Affiliate links
                            and sponsored content are labelled.
                        </p>
                        <p className="text-gray-300 mb-6">
                            <Link to="/about" className="text-brand-primary underline hover:no-underline">
                                Read about our editorial policy, corrections and how we make money
                            </Link>
                            .
                        </p>
                        <p className="text-sm text-gray-400">
                            Page last reviewed: <time dateTime={LAST_REVIEWED_ISO}>{LAST_REVIEWED_LABEL}</time>
                        </p>
                    </div>
                </section>

                {/* Newsletter CTA */}
                <section aria-label="Newsletter sign-up" className="py-16">
                    <div className="container mx-auto px-4">
                        <div className="max-w-3xl mx-auto">
                            <Newsletter source="home" variant="card" />
                        </div>
                    </div>
                </section>

                {/* Final CTA Section */}
                <section aria-labelledby="final-cta-heading" className="py-20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-brand-primary/5" />
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="glass rounded-3xl p-10 md:p-16 text-center max-w-4xl mx-auto border border-brand-primary/20">
                            <h2 id="final-cta-heading" className="text-3xl md:text-5xl font-bold mb-6">Ready to start?</h2>
                            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                                Begin with the basics. Our first guide assumes no prior knowledge
                                {FIRST_GUIDE_MINUTES ? ` and takes about ${FIRST_GUIDE_MINUTES} minutes to read` : ''}.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link
                                    to="/learn/what-is-bitcoin"
                                    className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-white text-brand-dark font-bold text-xl hover:bg-gray-100 transition-colors"
                                >
                                    What is Bitcoin? <ArrowRight className="w-6 h-6" aria-hidden="true" />
                                </Link>
                                <Link
                                    to="/learn"
                                    className="inline-flex items-center gap-2 px-10 py-5 rounded-full border border-white/20 text-white font-bold text-xl hover:bg-white/10 transition-colors"
                                >
                                    All guides
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
