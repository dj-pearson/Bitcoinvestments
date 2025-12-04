import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Bitcoin, ChevronDown, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getCurrentUser, type AuthUser } from '../../services/auth';

const navItems = [
    {
        label: 'Dashboard',
        href: '/dashboard',
    },
    {
        label: 'Compare',
        href: '/compare',
        children: [
            { label: 'Exchanges', href: '/compare?tab=exchanges' },
            { label: 'Wallets', href: '/compare?tab=wallets' },
        ],
    },
    {
        label: 'Calculators',
        href: '/calculators',
        children: [
            { label: 'DCA Calculator', href: '/calculators?type=dca' },
            { label: 'Fee Calculator', href: '/calculators?type=fees' },
            { label: 'Staking Calculator', href: '/calculators?type=staking' },
            { label: 'Tax Calculator', href: '/calculators?type=tax' },
        ],
    },
    {
        label: 'Learn',
        href: '/learn',
    },
];

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        async function checkAuth() {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        }
        checkAuth();
    }, [location.pathname]);

    const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');

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
                    <nav className="hidden md:flex items-center gap-6">
                        {navItems.map((item) => (
                            <div
                                key={item.label}
                                className="relative"
                                onMouseEnter={() => item.children && setOpenDropdown(item.label)}
                                onMouseLeave={() => setOpenDropdown(null)}
                            >
                                <Link
                                    to={item.href}
                                    className={cn(
                                        'flex items-center gap-1 text-sm font-medium transition-colors px-3 py-2 rounded-lg',
                                        isActive(item.href)
                                            ? 'text-white bg-white/10'
                                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                                    )}
                                >
                                    {item.label}
                                    {item.children && (
                                        <ChevronDown className={cn(
                                            'w-4 h-4 transition-transform',
                                            openDropdown === item.label && 'rotate-180'
                                        )} />
                                    )}
                                </Link>

                                {/* Dropdown */}
                                {item.children && openDropdown === item.label && (
                                    <div className="absolute top-full left-0 pt-2">
                                        <div className="glass-card p-2 min-w-[180px] rounded-xl border border-white/10">
                                            {item.children.map((child) => (
                                                <Link
                                                    key={child.label}
                                                    to={child.href}
                                                    className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                >
                                                    {child.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Auth Section */}
                        {user ? (
                            <div
                                className="relative"
                                onMouseEnter={() => setUserDropdownOpen(true)}
                                onMouseLeave={() => setUserDropdownOpen(false)}
                            >
                                <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center">
                                        <User className="w-4 h-4 text-brand-primary" />
                                    </div>
                                    <ChevronDown className={cn(
                                        'w-4 h-4 transition-transform',
                                        userDropdownOpen && 'rotate-180'
                                    )} />
                                </button>

                                {userDropdownOpen && (
                                    <div className="absolute top-full right-0 pt-2">
                                        <div className="glass-card p-2 min-w-[180px] rounded-xl border border-white/10">
                                            <div className="px-4 py-2 border-b border-white/10 mb-2">
                                                <p className="text-sm text-gray-400">Signed in as</p>
                                                <p className="text-sm text-white font-medium truncate">{user.email}</p>
                                            </div>
                                            <Link
                                                to="/profile"
                                                className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                            >
                                                Profile Settings
                                            </Link>
                                            <Link
                                                to="/dashboard"
                                                className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                            >
                                                Dashboard
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/signup"
                                    className="px-6 py-2.5 rounded-full bg-brand-primary hover:bg-brand-primary/90 text-white font-medium transition-all hover:shadow-[0_0_20px_-5px_rgba(139,92,246,0.5)]"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
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
                    <nav className="flex flex-col p-4 gap-2">
                        {navItems.map((item) => (
                            <div key={item.label}>
                                <Link
                                    to={item.href}
                                    className={cn(
                                        'flex items-center justify-between text-base font-medium px-4 py-3 rounded-lg',
                                        isActive(item.href)
                                            ? 'text-white bg-white/10'
                                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                                    )}
                                    onClick={() => !item.children && setIsMenuOpen(false)}
                                >
                                    {item.label}
                                    {item.children && <ChevronDown className="w-4 h-4" />}
                                </Link>
                                {item.children && (
                                    <div className="ml-4 mt-1 space-y-1">
                                        {item.children.map((child) => (
                                            <Link
                                                key={child.label}
                                                to={child.href}
                                                className="block px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                {child.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Mobile Auth */}
                        <div className="border-t border-white/10 mt-2 pt-4">
                            {user ? (
                                <div className="space-y-2">
                                    <div className="px-4 py-2">
                                        <p className="text-sm text-gray-400">Signed in as</p>
                                        <p className="text-sm text-white font-medium">{user.email}</p>
                                    </div>
                                    <Link
                                        to="/profile"
                                        className="block px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Profile Settings
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Link
                                        to="/login"
                                        className="block w-full text-center px-6 py-3 rounded-lg border border-white/20 text-white font-medium"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="block w-full text-center px-6 py-3 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white font-medium"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Get Started
                                    </Link>
                                </div>
                            )}
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
