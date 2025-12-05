import { useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowRight, Shield, Zap, Globe, TrendingUp, Calculator, BookOpen, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTopCryptocurrencies } from '../services/coingecko';
import type { Cryptocurrency } from '../types';
import { Newsletter } from '../components/Newsletter';
import { NewsFeed } from '../components/NewsFeed';
import { FearGreedGauge } from '../components/FearGreedIndex';
import { Hero } from '../components/Hero';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function Home() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [prices, setPrices] = useState<Cryptocurrency[]>([]);

    useEffect(() => {
        async function loadPrices() {
            const data = await getTopCryptocurrencies(6);
            setPrices(data);
        }
        loadPrices();
    }, []);

    useGSAP(() => {
        const tl = gsap.timeline();

        // Removed Hero animations as they are now in Hero component

        tl.from('.feature-card', {
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
    }, { scope: containerRef });

    return (
        <div ref={containerRef} className="overflow-hidden">
            {/* Hero Section */}
            {/* Hero Section */}
            <Hero />

            {/* Live Prices Ticker */}
            <section className="py-6 bg-white/5 overflow-hidden">
                <div className="flex animate-marquee gap-8">
                    {[...prices, ...prices].map((coin, i) => (
                        <div key={`${coin.id}-${i}`} className="flex items-center gap-3 px-4">
                            <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
                            <span className="text-white font-medium">{coin.symbol.toUpperCase()}</span>
                            <span className="text-gray-400">${coin.current_price.toLocaleString()}</span>
                            <span className={coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {coin.price_change_percentage_24h >= 0 ? '+' : ''}
                                {coin.price_change_percentage_24h?.toFixed(2)}%
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 relative features-section">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Everything You Need to <span className="text-gradient">Get Started</span></h2>
                        <p className="text-gray-400 text-lg">
                            From learning the basics to analyzing the market, we've got you covered.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                icon: BookOpen,
                                title: 'Learn Crypto',
                                desc: 'Comprehensive guides from blockchain basics to advanced strategies.',
                                link: '/learn',
                                color: 'bg-blue-500/20 text-blue-500'
                            },
                            {
                                icon: BarChart3,
                                title: 'Compare Platforms',
                                desc: 'Side-by-side comparisons of exchanges, wallets, and tax software.',
                                link: '/compare',
                                color: 'bg-green-500/20 text-green-500'
                            },
                            {
                                icon: Calculator,
                                title: 'Investment Tools',
                                desc: 'DCA, fee, staking, and tax calculators to plan your investments.',
                                link: '/calculators',
                                color: 'bg-purple-500/20 text-purple-500'
                            },
                            {
                                icon: TrendingUp,
                                title: 'Market Dashboard',
                                desc: 'Real-time prices, market sentiment, and portfolio tracking.',
                                link: '/dashboard',
                                color: 'bg-orange-500/20 text-orange-500'
                            }
                        ].map((feature, i) => (
                            <Link
                                key={i}
                                to={feature.link}
                                className="glass-card p-6 feature-card hover:-translate-y-2 transition-all duration-300 group"
                            >
                                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                                    <feature.icon className="w-6 h-6" />
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
            <section className="py-16 bg-white/5">
                <div className="container mx-auto px-4">
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

            {/* Why Choose Us */}
            <section className="py-24 relative">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Why <span className="text-gradient">Bitcoinvestments</span>?</h2>
                        <p className="text-gray-400 text-lg">
                            We provide the tools and education you need to confidently navigate the cryptocurrency market.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Shield,
                                title: 'Trusted Information',
                                desc: 'All our content is vetted by crypto experts to ensure accuracy and reliability.'
                            },
                            {
                                icon: Zap,
                                title: 'Beginner Friendly',
                                desc: 'Simple explanations that make complex crypto concepts easy to understand.'
                            },
                            {
                                icon: Globe,
                                title: 'Completely Free',
                                desc: 'All our guides, tools, and calculators are 100% free to use forever.'
                            }
                        ].map((feature, i) => (
                            <div key={i} className="glass-card p-8 feature-card hover:-translate-y-2 transition-transform duration-300">
                                <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center mb-6 text-brand-primary">
                                    <feature.icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Newsletter CTA */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-3xl mx-auto">
                        <Newsletter source="home" variant="card" />
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-brand-primary/5" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="glass rounded-3xl p-12 md:p-20 text-center max-w-4xl mx-auto border border-brand-primary/20">
                        <h2 className="text-4xl md:text-6xl font-bold mb-8">Ready to start your journey?</h2>
                        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                            Join thousands of beginners learning crypto the smart way.
                            Start with our beginner guides today.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                to="/learn"
                                className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-white text-brand-dark font-bold text-xl hover:bg-gray-100 transition-colors"
                            >
                                Start Learning <ArrowRight className="w-6 h-6" />
                            </Link>
                            <Link
                                to="/signup"
                                className="inline-flex items-center gap-2 px-10 py-5 rounded-full border border-white/20 text-white font-bold text-xl hover:bg-white/10 transition-colors"
                            >
                                Create Account
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
