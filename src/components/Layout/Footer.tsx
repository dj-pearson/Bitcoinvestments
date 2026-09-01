import { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Calculator, BarChart3, BookOpen, Shield, TrendingUp } from 'lucide-react';
import { Newsletter } from '../Newsletter';
import { Logo } from '../Logo';
import { getCachedTopCryptocurrencies } from '../../services/coingecko';
import { reopenConsentBanner } from '@/lib/consent';


export const Footer = memo(function Footer() {
    const [btcPrice, setBtcPrice] = useState<{ price: number; change: number } | null>(null);

    useEffect(() => {
        async function fetchBtc() {
            try {
                const data = await getCachedTopCryptocurrencies(1);
                if (data[0]) {
                    setBtcPrice({ price: data[0].current_price, change: data[0].price_change_percentage_24h });
                }
            } catch { /* silent */ }
        }
        fetchBtc();
    }, []);

    return (
        <footer id="footer" className="bg-brand-dark border-t border-white/5 pt-16 pb-8" role="contentinfo" tabIndex={-1}>
            <div className="container mx-auto px-4">
                {/* Popular Tools Quick Access */}
                <div className="mb-12 pb-12 border-b border-white/5">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6 text-center">Popular Tools</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <Link to="/calculators" className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                            <Calculator className="w-5 h-5 text-brand-primary" />
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">DCA Calculator</span>
                        </Link>
                        <Link to="/dashboard" className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                            <BarChart3 className="w-5 h-5 text-green-400" />
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Market Dashboard</span>
                        </Link>
                        <Link to="/compare" className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                            <TrendingUp className="w-5 h-5 text-orange-400" />
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Compare Exchanges</span>
                        </Link>
                        <Link to="/learn" className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                            <BookOpen className="w-5 h-5 text-purple-400" />
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Learn Crypto</span>
                        </Link>
                        <Link to="/scam-database" className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                            <Shield className="w-5 h-5 text-red-400" />
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Scam Database</span>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
                    {/* Brand & Newsletter */}
                    <div className="lg:col-span-2 space-y-6">
                        <Link to="/" aria-label="Bitcoinvestments - Home">
                            <Logo />
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Empowering the next generation of crypto investors with education,
                            tools, and security. Start your journey today.
                        </p>
                        <Newsletter source="footer" variant="footer" />
                    </div>

                    {/* Platform Links */}
                    <nav aria-label="Platform links">
                        <h3 className="font-semibold text-white mb-4">Platform</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/dashboard" className="text-gray-400 hover:text-brand-primary text-sm transition-colors">
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link to="/charts" className="text-gray-400 hover:text-brand-primary text-sm transition-colors">
                                    Price Charts
                                </Link>
                            </li>
                            <li>
                                <Link to="/compare" className="text-gray-400 hover:text-brand-primary text-sm transition-colors">
                                    Compare Exchanges
                                </Link>
                            </li>
                            <li>
                                <Link to="/calculators" className="text-gray-400 hover:text-brand-primary text-sm transition-colors">
                                    Calculators
                                </Link>
                            </li>
                            <li>
                                <Link to="/pricing" className="text-gray-400 hover:text-brand-primary text-sm transition-colors">
                                    Pricing
                                </Link>
                            </li>
                        </ul>
                    </nav>

                    {/* Resources Links */}
                    <nav aria-label="Resources links">
                        <h3 className="font-semibold text-white mb-4">Resources</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/learn" className="text-gray-400 hover:text-brand-primary text-sm transition-colors">
                                    Learn Crypto
                                </Link>
                            </li>
                            <li>
                                <Link to="/glossary" className="text-gray-400 hover:text-brand-primary text-sm transition-colors">
                                    Crypto Glossary
                                </Link>
                            </li>
                            <li>
                                <Link to="/blog" className="text-gray-400 hover:text-brand-primary text-sm transition-colors">
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link to="/scam-database" className="text-gray-400 hover:text-brand-primary text-sm transition-colors">
                                    Scam Database
                                </Link>
                            </li>
                            <li>
                                <Link to="/compare?tab=wallets" className="text-gray-400 hover:text-brand-primary text-sm transition-colors">
                                    Wallet Guide
                                </Link>
                            </li>
                        </ul>
                    </nav>

                    {/* Legal Links */}
                    <nav aria-label="Legal links">
                        <h3 className="font-semibold text-white mb-4">Legal</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/privacy" className="text-gray-400 hover:text-brand-primary text-sm transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms" className="text-gray-400 hover:text-brand-primary text-sm transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link to="/disclaimer" className="text-gray-400 hover:text-brand-primary text-sm transition-colors">
                                    Disclaimer
                                </Link>
                            </li>
                            <li>
                                <Link to="/accessibility" className="text-gray-400 hover:text-brand-primary text-sm transition-colors">
                                    Accessibility
                                </Link>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    onClick={reopenConsentBanner}
                                    className="text-gray-400 hover:text-brand-primary text-sm transition-colors text-left"
                                >
                                    Cookie Preferences
                                </button>
                            </li>
                            <li>
                                <a href="mailto:support@bitcoinvestments.net" className="text-gray-400 hover:text-brand-primary text-sm transition-colors flex items-center gap-1">
                                    <Mail className="w-3 h-3" aria-hidden="true" />
                                    Contact Us
                                </a>
                            </li>
                        </ul>
                    </nav>
                </div>

                {/* Bottom Section */}
                <div className="border-t border-white/5 pt-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-center md:text-left">
                            <p className="text-gray-400 text-sm">
                                © {new Date().getFullYear()} Bitcoinvestments. All rights reserved.
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                                Cryptocurrency investments are subject to market risks. Not financial advice.
                            </p>
                        </div>
                        {btcPrice && (
                            <Link to="/coin/bitcoin" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                                <span className="text-xs text-gray-400">BTC</span>
                                <span className="text-sm font-medium text-white">${btcPrice.price.toLocaleString()}</span>
                                <span className={`text-xs font-medium ${btcPrice.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {btcPrice.change >= 0 ? '+' : ''}{btcPrice.change.toFixed(2)}%
                                </span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    );
});
