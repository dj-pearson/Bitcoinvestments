import { Link } from 'react-router-dom';
import { Bitcoin, Twitter, Github, Linkedin, Youtube, Mail } from 'lucide-react';
import { Newsletter } from '../Newsletter';

export function Footer() {
    return (
        <footer className="bg-brand-dark border-t border-white/5 pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
                    {/* Brand & Newsletter */}
                    <div className="lg:col-span-2 space-y-6">
                        <Link to="/" className="flex items-center gap-2">
                            <Bitcoin className="w-6 h-6 text-brand-secondary" />
                            <span className="text-lg font-bold text-white">
                                Bitcoin<span className="text-brand-primary">vestments</span>
                            </span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Empowering the next generation of crypto investors with education,
                            tools, and security. Start your journey today.
                        </p>
                        <Newsletter source="footer" variant="footer" />
                    </div>

                    {/* Platform Links */}
                    <div>
                        <h3 className="font-semibold text-white mb-4">Platform</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link to="/dashboard" className="text-gray-400 hover:text-brand-primary text-sm transition-colors">
                                    Dashboard
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
                                <Link to="/profile" className="text-gray-400 hover:text-brand-primary text-sm transition-colors">
                                    My Account
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources Links */}
                    <div>
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
                                <Link to="/compare?tab=wallets" className="text-gray-400 hover:text-brand-primary text-sm transition-colors">
                                    Wallet Guide
                                </Link>
                            </li>
                            <li>
                                <Link to="/calculators?type=tax" className="text-gray-400 hover:text-brand-primary text-sm transition-colors">
                                    Tax Guide
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
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
                                <a href="mailto:support@bitcoinvestments.com" className="text-gray-400 hover:text-brand-primary text-sm transition-colors flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    Contact Us
                                </a>
                            </li>
                        </ul>
                    </div>
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
                        <div className="flex items-center gap-4">
                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white transition-colors"
                                aria-label="Twitter"
                            >
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a
                                href="https://youtube.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white transition-colors"
                                aria-label="YouTube"
                            >
                                <Youtube className="w-5 h-5" />
                            </a>
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white transition-colors"
                                aria-label="GitHub"
                            >
                                <Github className="w-5 h-5" />
                            </a>
                            <a
                                href="https://linkedin.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white transition-colors"
                                aria-label="LinkedIn"
                            >
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
