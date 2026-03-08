import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '../Logo';
import {
    Menu,
    X,
    ChevronDown,
    User,
    Shield,
    LayoutDashboard,
    LineChart,
    ArrowLeftRight,
    Calculator,
    Wrench,
    Search,
    Coins,
    GraduationCap,
    Wallet,
    TrendingUp,
    Receipt,
    RefreshCw,
    Bell,
    Layers,
    Activity,
    Fish,
    BarChart3,
    Users,
    AlertTriangle,
    Percent,
    Fuel,
    Globe,
    HardDrive
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { getCurrentUser, type AuthUser } from '../../services/auth';
import { GlobalSearch, MobileSearchTrigger } from '../GlobalSearch';
import { PrefetchLink } from '../PrefetchLink';
import { STATIC_MODE } from '../../config/staticMode';

// Navigation items with icons for better visual hierarchy
const navItems = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'Your portfolio overview',
    },
    {
        label: 'Charts',
        href: '/charts',
        icon: LineChart,
        description: 'Price charts & analytics',
    },
    {
        label: 'Compare',
        href: '/compare',
        icon: ArrowLeftRight,
        description: 'Compare platforms',
        children: [
            { label: 'Exchanges', href: '/compare?tab=exchanges', icon: ArrowLeftRight, description: 'Compare crypto exchanges' },
            { label: 'Wallets', href: '/compare?tab=wallets', icon: Wallet, description: 'Compare wallet options' },
            { label: 'Lending Rates', href: '/lending', icon: Percent, description: 'Compare lending rates' },
        ],
    },
    {
        label: 'Calculators',
        href: '/calculators',
        icon: Calculator,
        description: 'Investment calculators',
        children: [
            { label: 'DCA Calculator', href: '/calculators?type=dca', icon: TrendingUp, description: 'Dollar cost averaging' },
            { label: 'Fee Calculator', href: '/calculators?type=fees', icon: Receipt, description: 'Calculate trading fees' },
            { label: 'Staking Calculator', href: '/staking-calculator', icon: Coins, description: 'Staking rewards estimator' },
            { label: 'Tax Calculator', href: '/calculators?type=tax', icon: Receipt, description: 'Estimate crypto taxes' },
            { label: 'Retirement Calculator', href: '/retirement-calculator', icon: Calculator, description: 'Plan for retirement' },
        ],
    },
    {
        label: 'Tools',
        href: '/backtesting',
        icon: Wrench,
        description: 'Advanced trading tools',
        children: STATIC_MODE
            ? [
                { label: 'Backtesting', href: '/backtesting', icon: RefreshCw, description: 'Test trading strategies' },
                { label: 'Multi-Exchange', href: '/multi-exchange', icon: Layers, description: 'Manage multiple exchanges' },
                { label: 'Rebalancing Alerts', href: '/rebalancing-alerts', icon: Bell, description: 'Portfolio rebalancing' },
                { label: 'Smart Alert Bundles', href: '/alert-bundles', icon: Bell, description: 'Custom alert packages' },
            ]
            : [
                { label: 'Portfolio Analysis', href: '/portfolio-analysis', icon: BarChart3, description: 'Analyze your holdings' },
                { label: 'Backtesting', href: '/backtesting', icon: RefreshCw, description: 'Test trading strategies' },
                { label: 'Tax Reports', href: '/tax-reports', icon: Receipt, description: 'Generate tax reports' },
                { label: 'Multi-Exchange', href: '/multi-exchange', icon: Layers, description: 'Manage multiple exchanges' },
                { label: 'DCA Automation', href: '/dca-automation', icon: TrendingUp, description: 'Automate DCA purchases' },
                { label: 'Rebalancing Alerts', href: '/rebalancing-alerts', icon: Bell, description: 'Portfolio rebalancing' },
                { label: 'Smart Alert Bundles', href: '/alert-bundles', icon: Bell, description: 'Custom alert packages' },
            ],
    },
    {
        label: 'Research',
        href: '/onchain-analytics',
        icon: Search,
        description: 'Market research & data',
        children: [
            { label: 'On-Chain Analytics', href: '/onchain-analytics', icon: Activity, description: 'Blockchain data insights' },
            { label: 'Whale Tracking', href: '/whale-tracking', icon: Fish, description: 'Track large holders' },
            { label: 'Trading Indicators', href: '/trading-indicators', icon: BarChart3, description: 'Technical indicators' },
            { label: 'Social Trading', href: '/social-trading', icon: Users, description: 'Follow top traders' },
            { label: 'Scam Database', href: '/scam-database', icon: AlertTriangle, description: 'Avoid crypto scams' },
        ],
    },
    {
        label: 'DeFi',
        href: '/defi-yield',
        icon: Coins,
        description: 'DeFi opportunities',
        children: [
            { label: 'DeFi Yield', href: '/defi-yield', icon: Percent, description: 'Find the best yields' },
            { label: 'Gas Optimizer', href: '/gas-optimizer', icon: Fuel, description: 'Optimize gas costs' },
            { label: 'Web3 Features', href: '/web3', icon: Globe, description: 'Web3 integrations' },
            { label: 'Hardware Wallet Guide', href: '/hardware-wallet', icon: HardDrive, description: 'Secure your crypto' },
        ],
    },
    {
        label: 'Learn',
        href: '/learn',
        icon: GraduationCap,
        description: 'Educational resources',
    },
];

export const Header = memo(function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [mobileOpenSections, setMobileOpenSections] = useState<Set<string>>(new Set());
    const [user, setUser] = useState<AuthUser | null>(null);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const location = useLocation();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (STATIC_MODE) return; // Skip auth check in static mode
        async function checkAuth() {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        }
        checkAuth();
    }, [location.pathname]);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMenuOpen(false);
        setMobileOpenSections(new Set());
    }, [location.pathname]);

    // Handle escape key to close menus
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsMenuOpen(false);
                setOpenDropdown(null);
                setUserDropdownOpen(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    // Handle click outside to close dropdowns
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');

    // Toggle mobile accordion section
    const toggleMobileSection = useCallback((label: string) => {
        setMobileOpenSections(prev => {
            const next = new Set(prev);
            if (next.has(label)) {
                next.delete(label);
            } else {
                next.add(label);
            }
            return next;
        });
    }, []);

    // Handle keyboard navigation for dropdowns
    const handleDropdownKeyDown = useCallback((e: React.KeyboardEvent, item: typeof navItems[0]) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (item.children) {
                setOpenDropdown(prev => prev === item.label ? null : item.label);
            }
        } else if (e.key === 'ArrowDown' && item.children) {
            e.preventDefault();
            setOpenDropdown(item.label);
        }
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300" role="banner">
            <div className="glass border-b border-white/5">
                <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" aria-label="Bitcoinvestments - Home">
                        <Logo />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav id="navigation" className="hidden lg:flex items-center gap-1" ref={dropdownRef} aria-label="Main navigation">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.label}
                                    className="relative"
                                    onMouseEnter={() => item.children && setOpenDropdown(item.label)}
                                    onMouseLeave={() => setOpenDropdown(null)}
                                >
                                    <PrefetchLink
                                        to={item.href}
                                        className={cn(
                                            'flex items-center gap-1.5 text-sm font-medium transition-all px-3 py-2 rounded-lg group',
                                            isActive(item.href)
                                                ? 'text-white bg-white/10'
                                                : 'text-gray-300 hover:text-white hover:bg-white/5'
                                        )}
                                        onKeyDown={(e) => handleDropdownKeyDown(e, item)}
                                        aria-expanded={item.children ? openDropdown === item.label : undefined}
                                        aria-haspopup={item.children ? 'menu' : undefined}
                                    >
                                        <Icon className={cn(
                                            'w-4 h-4 transition-colors',
                                            isActive(item.href) ? 'text-brand-primary' : 'text-gray-400 group-hover:text-brand-accent'
                                        )} />
                                        <span className="hidden xl:inline">{item.label}</span>
                                        {item.children && (
                                            <ChevronDown className={cn(
                                                'w-3.5 h-3.5 transition-transform duration-200',
                                                openDropdown === item.label && 'rotate-180'
                                            )} />
                                        )}
                                    </PrefetchLink>

                                    {/* Enhanced Dropdown with icons and descriptions */}
                                    {item.children && openDropdown === item.label && (
                                        <div
                                            className="absolute top-full left-0 pt-2 z-50"
                                            role="menu"
                                            aria-label={`${item.label} submenu`}
                                        >
                                            <div className="glass-card p-2 min-w-[260px] rounded-xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="px-3 py-2 border-b border-white/10 mb-2">
                                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{item.label}</p>
                                                </div>
                                                {item.children.map((child) => {
                                                    const ChildIcon = child.icon;
                                                    return (
                                                        <PrefetchLink
                                                            key={child.label}
                                                            to={child.href}
                                                            className="flex items-start gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all group"
                                                            role="menuitem"
                                                        >
                                                            <ChildIcon className="w-4 h-4 mt-0.5 text-gray-400 group-hover:text-brand-accent transition-colors flex-shrink-0" />
                                                            <div>
                                                                <span className="block font-medium">{child.label}</span>
                                                                <span className="block text-xs text-gray-500 group-hover:text-gray-400 mt-0.5">{child.description}</span>
                                                            </div>
                                                        </PrefetchLink>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Search Bar */}
                        <GlobalSearch className="hidden lg:block" />

                        {/* Auth Section */}
                        {STATIC_MODE ? (
                            <Link
                                to="/pricing"
                                className="px-6 py-2.5 rounded-full bg-brand-primary hover:bg-brand-primary/90 text-white font-medium text-sm transition-all hover:shadow-[0_0_20px_-5px_rgba(139,92,246,0.5)]"
                            >
                                View Plans
                            </Link>
                        ) : user ? (
                            <div
                                className="relative"
                                onMouseEnter={() => setUserDropdownOpen(true)}
                                onMouseLeave={() => setUserDropdownOpen(false)}
                            >
                                <button
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                                    aria-label="User account menu"
                                    aria-expanded={userDropdownOpen}
                                    aria-haspopup="menu"
                                >
                                    <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center">
                                        <User className="w-4 h-4 text-brand-primary" aria-hidden="true" />
                                    </div>
                                    <ChevronDown className={cn(
                                        'w-4 h-4 transition-transform',
                                        userDropdownOpen && 'rotate-180'
                                    )} aria-hidden="true" />
                                </button>

                                {userDropdownOpen && (
                                    <div className="absolute top-full right-0 pt-2">
                                        <div className="glass-card p-2 min-w-[200px] rounded-xl border border-white/10" role="menu" aria-label="User account menu">
                                            <div className="px-4 py-2 border-b border-white/10 mb-2">
                                                <p className="text-sm text-gray-400">Signed in as</p>
                                                <p className="text-sm text-white font-medium truncate">{user.email}</p>
                                            </div>
                                            <Link
                                                to="/profile"
                                                className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                role="menuitem"
                                            >
                                                Profile Settings
                                            </Link>
                                            <Link
                                                to="/dashboard"
                                                className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                role="menuitem"
                                            >
                                                Dashboard
                                            </Link>
                                            <div className="border-t border-white/10 my-2" role="separator"></div>
                                            <Link
                                                to="/portfolio-analysis"
                                                className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                role="menuitem"
                                            >
                                                Portfolio Analysis
                                            </Link>
                                            <Link
                                                to="/backtesting"
                                                className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                role="menuitem"
                                            >
                                                Backtesting
                                            </Link>
                                            <Link
                                                to="/tax-reports"
                                                className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                role="menuitem"
                                            >
                                                Tax Reports
                                            </Link>
                                            <div className="border-t border-white/10 my-2" role="separator"></div>
                                            <Link
                                                to="/developers/portal"
                                                className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                role="menuitem"
                                            >
                                                Developer Portal
                                            </Link>
                                            <Link
                                                to="/affiliate"
                                                className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                role="menuitem"
                                            >
                                                Affiliate Dashboard
                                            </Link>
                                            <Link
                                                to="/advertiser"
                                                className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                role="menuitem"
                                            >
                                                Advertiser Dashboard
                                            </Link>
                                            <Link
                                                to="/advisor"
                                                className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                                role="menuitem"
                                            >
                                                Advisor Dashboard
                                            </Link>
                                            {/* Admin Dashboard link - only show for admin users */}
                                            {(user.role === 'admin' || user.role === 'super_admin') && (
                                                <>
                                                    <div className="border-t border-white/10 my-2" role="separator"></div>
                                                    <Link
                                                        to="/admin"
                                                        className="flex items-center gap-2 px-4 py-2 text-sm text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-lg transition-colors"
                                                        role="menuitem"
                                                    >
                                                        <Shield className="w-4 h-4" aria-hidden="true" />
                                                        Admin Dashboard
                                                    </Link>
                                                </>
                                            )}
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

                    {/* Mobile Search & Menu */}
                    <div className="flex items-center gap-1 lg:hidden">
                        <MobileSearchTrigger />
                        <button
                            className="p-3 text-gray-300 hover:text-white touch-target relative"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                            aria-expanded={isMenuOpen}
                        >
                            <span className={cn(
                                'absolute inset-0 flex items-center justify-center transition-all duration-200',
                                isMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'
                            )}>
                                <X className="w-6 h-6" />
                            </span>
                            <span className={cn(
                                'flex items-center justify-center transition-all duration-200',
                                isMenuOpen ? 'opacity-0 -rotate-90' : 'opacity-100 rotate-0'
                            )}>
                                <Menu className="w-6 h-6" />
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation - Accordion Style */}
            {isMenuOpen && (
                <div
                    ref={mobileMenuRef}
                    className="lg:hidden absolute top-20 left-0 right-0 glass border-b border-white/5 animate-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-5rem)] overflow-y-auto safe-padding-bottom"
                    role="navigation"
                    aria-label="Mobile navigation"
                >
                    <nav className="flex flex-col p-4 gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isExpanded = mobileOpenSections.has(item.label);

                            return (
                                <div key={item.label} className="border-b border-white/5 last:border-0">
                                    {item.children ? (
                                        <>
                                            {/* Accordion Header */}
                                            <button
                                                onClick={() => toggleMobileSection(item.label)}
                                                className={cn(
                                                    'flex items-center justify-between w-full text-base font-medium px-4 py-3.5 rounded-lg min-h-[52px] transition-colors',
                                                    isActive(item.href)
                                                        ? 'text-white bg-white/10'
                                                        : 'text-gray-300 hover:text-white active:bg-white/10'
                                                )}
                                                aria-expanded={isExpanded}
                                                aria-controls={`mobile-section-${item.label}`}
                                            >
                                                <span className="flex items-center gap-3">
                                                    <Icon className={cn(
                                                        'w-5 h-5',
                                                        isActive(item.href) ? 'text-brand-primary' : 'text-gray-400'
                                                    )} />
                                                    <span>{item.label}</span>
                                                </span>
                                                <ChevronDown className={cn(
                                                    'w-5 h-5 transition-transform duration-200',
                                                    isExpanded && 'rotate-180'
                                                )} />
                                            </button>

                                            {/* Accordion Content */}
                                            <div
                                                id={`mobile-section-${item.label}`}
                                                className={cn(
                                                    'overflow-hidden transition-all duration-200',
                                                    isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                                                )}
                                            >
                                                <div className="ml-4 pl-4 border-l-2 border-white/10 py-2 space-y-1">
                                                    {item.children.map((child) => {
                                                        const ChildIcon = child.icon;
                                                        return (
                                                            <Link
                                                                key={child.label}
                                                                to={child.href}
                                                                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white rounded-lg active:bg-white/10 min-h-[48px] transition-colors"
                                                                onClick={() => setIsMenuOpen(false)}
                                                            >
                                                                <ChildIcon className="w-4 h-4 text-gray-500" />
                                                                <div>
                                                                    <span className="block">{child.label}</span>
                                                                    <span className="block text-xs text-gray-500 mt-0.5">{child.description}</span>
                                                                </div>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <Link
                                            to={item.href}
                                            className={cn(
                                                'flex items-center gap-3 text-base font-medium px-4 py-3.5 rounded-lg min-h-[52px] transition-colors',
                                                isActive(item.href)
                                                    ? 'text-white bg-white/10'
                                                    : 'text-gray-300 hover:text-white active:bg-white/10'
                                            )}
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <Icon className={cn(
                                                'w-5 h-5',
                                                isActive(item.href) ? 'text-brand-primary' : 'text-gray-400'
                                            )} />
                                            {item.label}
                                        </Link>
                                    )}
                                </div>
                            );
                        })}

                        {/* Mobile Auth */}
                        <div className="border-t border-white/10 mt-2 pt-4">
                            {STATIC_MODE ? (
                                <div className="space-y-2">
                                    <Link
                                        to="/pricing"
                                        className="block w-full text-center px-6 py-3 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white font-medium"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        View Plans
                                    </Link>
                                </div>
                            ) : user ? (
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
                                    <div className="border-t border-white/10 my-2"></div>
                                    <Link
                                        to="/portfolio-analysis"
                                        className="block px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Portfolio Analysis
                                    </Link>
                                    <Link
                                        to="/backtesting"
                                        className="block px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Backtesting
                                    </Link>
                                    <Link
                                        to="/tax-reports"
                                        className="block px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Tax Reports
                                    </Link>
                                    <div className="border-t border-white/10 my-2"></div>
                                    <Link
                                        to="/developers/portal"
                                        className="block px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Developer Portal
                                    </Link>
                                    <Link
                                        to="/affiliate"
                                        className="block px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Affiliate Dashboard
                                    </Link>
                                    <Link
                                        to="/advertiser"
                                        className="block px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Advertiser Dashboard
                                    </Link>
                                    <Link
                                        to="/advisor"
                                        className="block px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Advisor Dashboard
                                    </Link>
                                    {/* Mobile Admin Dashboard link */}
                                    {(user.role === 'admin' || user.role === 'super_admin') && (
                                        <>
                                            <div className="border-t border-white/10 my-2"></div>
                                            <Link
                                                to="/admin"
                                                className="flex items-center gap-2 px-4 py-3 text-base font-medium text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-lg"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                <Shield className="w-5 h-5" />
                                                Admin Dashboard
                                            </Link>
                                        </>
                                    )}
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
});
