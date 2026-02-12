import { Link } from 'react-router-dom';
import { Twitter, Github, Linkedin, Youtube, Mail } from 'lucide-react';
import { Newsletter } from '../Newsletter';
import { Logo } from '../Logo';

export function Footer() {
    return (
        <footer id="footer" className="bg-brand-dark border-t border-white/5 pt-16 pb-8" role="contentinfo" tabIndex={-1}>
            <div className="container mx-auto px-4">
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
                            <p className="text-gray-500 text-sm">
                                © {new Date().getFullYear()} Bitcoinvestments. All rights reserved.
                            </p>
                            <p className="text-gray-600 text-xs mt-1">
                                Cryptocurrency investments are subject to market risks. Not financial advice.
                            </p>
                        </div>
                        <nav aria-label="Social media links" className="flex items-center gap-4">
                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white transition-colors"
                                aria-label="Follow us on Twitter (opens in new tab)"
                            >
                                <Twitter className="w-5 h-5" aria-hidden="true" />
                            </a>
                            <a
                                href="https://youtube.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white transition-colors"
                                aria-label="Subscribe on YouTube (opens in new tab)"
                            >
                                <Youtube className="w-5 h-5" aria-hidden="true" />
                            </a>
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white transition-colors"
                                aria-label="View our GitHub (opens in new tab)"
                            >
                                <Github className="w-5 h-5" aria-hidden="true" />
                            </a>
                            <a
                                href="https://linkedin.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white transition-colors"
                                aria-label="Connect on LinkedIn (opens in new tab)"
                            >
                                <Linkedin className="w-5 h-5" aria-hidden="true" />
                            </a>
                        </nav>
                    </div>
                </div>
            </div>
        </footer>
    );
}
