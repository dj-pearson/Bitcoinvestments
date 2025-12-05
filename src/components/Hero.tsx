import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Hero3D } from './Hero3D';
import { getTopCryptocurrencies } from '../services/coingecko';
import type { Cryptocurrency } from '../types';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

export function Hero() {
    const heroRef = useRef<HTMLDivElement>(null);
    const [prices, setPrices] = useState<Cryptocurrency[]>([]);
    const [loadingPrices, setLoadingPrices] = useState(true);

    useEffect(() => {
        async function loadPrices() {
            try {
                const data = await getTopCryptocurrencies(3);
                setPrices(data);
                setLoadingPrices(false);
            } catch (error) {
                console.error("Failed to load prices", error);
                setLoadingPrices(false);
            }
        }
        loadPrices();
    }, []);

    useGSAP(() => {
        const tl = gsap.timeline();

        tl.from('.hero-text', {
            y: 50,
            opacity: 0,
            duration: 1,
            stagger: 0.2,
            ease: 'power3.out',
        })
            .from('.hero-image', {
                scale: 0.8,
                opacity: 0,
                duration: 1,
                ease: 'back.out(1.7)',
            }, '-=0.5');
    }, { scope: heroRef });

    return (
        <section ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
            {/* 3D Background */}
            <Hero3D />

            {/* Overlay Gradient for readability (provisional) - ensure text pops over the stars */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-brand-dark/50 pointer-events-none" />

            <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                <div className="space-y-8 text-center lg:text-left">
                    <h1 className="text-5xl lg:text-7xl font-bold leading-tight hero-text text-shadow-lg">
                        The Future of <br />
                        <span className="text-gradient">Crypto Investing</span>
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto lg:mx-0 hero-text drop-shadow-md">
                        Start your journey into the world of digital assets with confidence.
                        Secure, simple, and built for the next generation of investors.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 hero-text">
                        <Link
                            to="/learn"
                            className="px-8 py-4 rounded-full bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-lg transition-all hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.6)] flex items-center gap-2"
                        >
                            Start Learning <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            to="/dashboard"
                            className="px-8 py-4 rounded-full glass hover:bg-white/10 text-white font-medium text-lg transition-all"
                        >
                            View Dashboard
                        </Link>
                    </div>

                    <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 hero-text">
                        <div>
                            <p className="text-3xl font-bold text-white">10K+</p>
                            <p className="text-gray-400 text-sm">Readers</p>
                        </div>
                        <div className="w-px h-12 bg-white/10" />
                        <div>
                            <p className="text-3xl font-bold text-white">50+</p>
                            <p className="text-gray-400 text-sm">Guides</p>
                        </div>
                        <div className="w-px h-12 bg-white/10" />
                        <div>
                            <p className="text-3xl font-bold text-white">Free</p>
                            <p className="text-gray-400 text-sm">Forever</p>
                        </div>
                    </div>
                </div>

                <div className="relative hero-image hidden lg:block">
                    {/* Floating Phone/Card mock can stay as part of the "foreground" interest */}
                    <div className="relative z-10 glass-card p-8 rotate-[-5deg] hover:rotate-0 transition-transform duration-500">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="text-gray-400 text-sm">Live Market</p>
                                <p className="text-2xl font-bold text-white">Top Cryptocurrencies</p>
                            </div>
                            <div className="p-3 bg-brand-primary/20 rounded-full">
                                <TrendingUp className="w-6 h-6 text-brand-primary" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            {loadingPrices ? (
                                [...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 animate-pulse">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-700" />
                                            <div>
                                                <div className="w-20 h-4 bg-gray-700 rounded mb-1" />
                                                <div className="w-12 h-3 bg-gray-700 rounded" />
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="w-16 h-4 bg-gray-700 rounded mb-1" />
                                            <div className="w-12 h-3 bg-gray-700 rounded" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                prices.slice(0, 3).map((coin) => (
                                    <div key={coin.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={coin.image}
                                                alt={coin.name}
                                                className="w-10 h-10 rounded-full"
                                            />
                                            <div>
                                                <p className="font-bold text-white">{coin.name}</p>
                                                <p className="text-xs text-gray-400 uppercase">{coin.symbol}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-white">
                                                ${coin.current_price.toLocaleString()}
                                            </p>
                                            <p className={`text-xs ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {coin.price_change_percentage_24h >= 0 ? '+' : ''}
                                                {coin.price_change_percentage_24h?.toFixed(2)}%
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <Link
                            to="/dashboard"
                            className="block text-center mt-4 text-sm text-brand-primary hover:text-brand-primary/80"
                        >
                            View All Prices &rarr;
                        </Link>
                    </div>

                    {/* Additional decorative glow behind the card to separate it from 3D bg */}
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-secondary/20 rounded-full blur-xl animate-pulse -z-10" />

                </div>
            </div>
        </section>
    );
}
