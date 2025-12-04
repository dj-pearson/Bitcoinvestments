import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowRight, Shield, Zap, Globe, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

gsap.registerPlugin(useGSAP);

export function Home() {
    const containerRef = useRef<HTMLDivElement>(null);
    const heroRef = useRef<HTMLDivElement>(null);

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
            }, '-=0.5')
            .from('.feature-card', {
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
            <section ref={heroRef} className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
                {/* Background Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-brand-primary/20 rounded-full blur-[120px] -z-10" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-brand-accent/10 rounded-full blur-[100px] -z-10" />

                <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8 text-center lg:text-left">
                        <h1 className="text-5xl lg:text-7xl font-bold leading-tight hero-text">
                            The Future of <br />
                            <span className="text-gradient">Crypto Investing</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto lg:mx-0 hero-text">
                            Start your journey into the world of digital assets with confidence.
                            Secure, simple, and built for the next generation of investors.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 hero-text">
                            <Link
                                to="/start"
                                className="px-8 py-4 rounded-full bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-lg transition-all hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.6)] flex items-center gap-2"
                            >
                                Start Investing <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                to="/learn"
                                className="px-8 py-4 rounded-full glass hover:bg-white/10 text-white font-medium text-lg transition-all"
                            >
                                Learn More
                            </Link>
                        </div>

                        <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 hero-text">
                            <div>
                                <p className="text-3xl font-bold text-white">2M+</p>
                                <p className="text-gray-500 text-sm">Users</p>
                            </div>
                            <div className="w-px h-12 bg-white/10" />
                            <div>
                                <p className="text-3xl font-bold text-white">$5B+</p>
                                <p className="text-gray-500 text-sm">Volume</p>
                            </div>
                            <div className="w-px h-12 bg-white/10" />
                            <div>
                                <p className="text-3xl font-bold text-white">0%</p>
                                <p className="text-gray-500 text-sm">Fees*</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative hero-image hidden lg:block">
                        <div className="relative z-10 glass-card p-8 rotate-[-5deg] hover:rotate-0 transition-transform duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <p className="text-gray-400 text-sm">Current Balance</p>
                                    <p className="text-4xl font-bold text-white">$124,500.00</p>
                                </div>
                                <div className="p-3 bg-brand-primary/20 rounded-full">
                                    <TrendingUp className="w-6 h-6 text-brand-primary" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { name: 'Bitcoin', symbol: 'BTC', price: '$98,450', change: '+5.2%' },
                                    { name: 'Ethereum', symbol: 'ETH', price: '$3,850', change: '+2.1%' },
                                    { name: 'Solana', symbol: 'SOL', price: '$145', change: '+8.4%' },
                                ].map((coin, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i === 0 ? 'bg-orange-500/20 text-orange-500' : i === 1 ? 'bg-blue-500/20 text-blue-500' : 'bg-purple-500/20 text-purple-500'}`}>
                                                {coin.symbol[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{coin.name}</p>
                                                <p className="text-xs text-gray-400">{coin.symbol}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-white">{coin.price}</p>
                                            <p className="text-xs text-green-400">{coin.change}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Decorative elements */}
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-secondary/20 rounded-full blur-xl animate-pulse" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand-primary/20 rounded-full blur-xl animate-pulse delay-700" />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 relative features-section">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Why Choose <span className="text-gradient">Bitcoinvestments</span>?</h2>
                        <p className="text-gray-400 text-lg">
                            We provide the tools and security you need to confidently navigate the cryptocurrency market.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Shield,
                                title: 'Bank-Grade Security',
                                desc: 'Your assets are protected by industry-leading encryption and cold storage protocols.'
                            },
                            {
                                icon: Zap,
                                title: 'Lightning Fast',
                                desc: 'Execute trades in milliseconds with our high-performance matching engine.'
                            },
                            {
                                icon: Globe,
                                title: 'Global Access',
                                desc: 'Trade from anywhere in the world with 24/7 support in multiple languages.'
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

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-brand-primary/5" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="glass rounded-3xl p-12 md:p-20 text-center max-w-4xl mx-auto border border-brand-primary/20">
                        <h2 className="text-4xl md:text-6xl font-bold mb-8">Ready to start your journey?</h2>
                        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                            Join millions of users who trust Bitcoinvestments for their crypto portfolio.
                            Sign up today and get $10 in Bitcoin.
                        </p>
                        <Link
                            to="/start"
                            className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-white text-brand-dark font-bold text-xl hover:bg-gray-100 transition-colors"
                        >
                            Create Free Account <ArrowRight className="w-6 h-6" />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
