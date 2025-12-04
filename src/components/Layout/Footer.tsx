import { Link } from 'react-router-dom';
import { Bitcoin, Twitter, Github, Linkedin } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-brand-dark border-t border-white/5 pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link to="/" className="flex items-center gap-2">
                            <Bitcoin className="w-6 h-6 text-brand-secondary" />
                            <span className="text-lg font-bold text-white">
                                Bitcoin<span className="text-brand-primary">vestments</span>
                            </span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Empowering the next generation of crypto investors with education, tools, and security.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="font-semibold text-white mb-4">Platform</h3>
                        <ul className="space-y-2">
                            {['Features', 'Security', 'Pricing', 'API'].map((item) => (
                                <li key={item}>
                                    <Link to="#" className="text-gray-400 hover:text-brand-primary text-sm transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-4">Resources</h3>
                        <ul className="space-y-2">
                            {['Learn', 'Blog', 'Help Center', 'Community'].map((item) => (
                                <li key={item}>
                                    <Link to="#" className="text-gray-400 hover:text-brand-primary text-sm transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-4">Legal</h3>
                        <ul className="space-y-2">
                            {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Disclaimer'].map((item) => (
                                <li key={item}>
                                    <Link to="#" className="text-gray-400 hover:text-brand-primary text-sm transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} Bitcoinvestments. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        {[Twitter, Github, Linkedin].map((Icon, i) => (
                            <a key={i} href="#" className="text-gray-400 hover:text-white transition-colors">
                                <Icon className="w-5 h-5" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
