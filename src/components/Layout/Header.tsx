import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Bitcoin } from 'lucide-react';


export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
            <div className="glass border-b border-white/5">
                <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="p-2 rounded-full bg-brand-primary/10 group-hover:bg-brand-primary/20 transition-colors">
                            <Bitcoin className="w-8 h-8 text-brand-secondary" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">
                            Bitcoin<span className="text-brand-primary">vestments</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        {['Learn', 'Market', 'About', 'Support'].map((item) => (
                            <Link
                                key={item}
                                to={`/${item.toLowerCase()}`}
                                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                            >
                                {item}
                            </Link>
                        ))}
                        <Link
                            to="/start"
                            className="px-6 py-2.5 rounded-full bg-brand-primary hover:bg-brand-primary/90 text-white font-medium transition-all hover:shadow-[0_0_20px_-5px_rgba(139,92,246,0.5)]"
                        >
                            Get Started
                        </Link>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-gray-300 hover:text-white"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-20 left-0 right-0 glass border-b border-white/5 animate-in slide-in-from-top-5">
                    <nav className="flex flex-col p-4 gap-4">
                        {['Learn', 'Market', 'About', 'Support'].map((item) => (
                            <Link
                                key={item}
                                to={`/${item.toLowerCase()}`}
                                className="text-base font-medium text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {item}
                            </Link>
                        ))}
                        <Link
                            to="/start"
                            className="w-full text-center px-6 py-3 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white font-medium"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Get Started
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
}
