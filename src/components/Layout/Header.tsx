import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '../Logo';
import { Menu, X, ChevronDown, User, Shield, Lock, Crown, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getCurrentUser, type AuthUser } from '../../services/auth';
import { GlobalSearch, MobileSearchTrigger } from '../GlobalSearch';
import {
  mainNavItems,
  userMenuItems,
  advisorMenuItems,
  enterpriseMenuItems,
  canAccessNavItem,
  type NavItem,
  type UserContext,
} from '../../config/navigation';

// Helper to get badge styling
function getBadgeStyle(badge: NavItem['badge']) {
  switch (badge) {
    case 'new':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'premium':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'pro':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'beta':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    default:
      return '';
  }
}

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

  // Create user context for navigation filtering
  const userContext: UserContext = useMemo(() => ({
    isAuthenticated: !!user,
    subscriptionStatus: user?.subscription_status || 'free',
    subscriptionExpiresAt: user?.subscription_expires_at,
    role: user?.role,
    purchases: [], // TODO: Load from user's purchase history
  }), [user]);

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + '/');

  // Check if user has premium access
  const hasPremiumAccess = user?.subscription_status === 'premium' ||
    user?.subscription_status === 'lifetime' ||
    user?.subscription_status === 'advisor' ||
    user?.subscription_status === 'enterprise';

  // Check if user is advisor or higher
  const hasAdvisorAccess = user?.subscription_status === 'advisor' ||
    user?.subscription_status === 'enterprise';

  // Check if user is enterprise
  const hasEnterpriseAccess = user?.subscription_status === 'enterprise';

  // Render a nav item (desktop)
  const renderNavItem = (item: NavItem, inDropdown = false) => {
    const hasAccess = canAccessNavItem(item, userContext);
    const showLock = item.showUpgradePrompt && !hasAccess;

    return (
      <Link
        key={item.label}
        to={hasAccess ? item.href : '/pricing'}
        className={cn(
          'flex items-center gap-2 text-sm transition-colors rounded-lg',
          inDropdown
            ? 'px-4 py-2.5 hover:bg-white/5'
            : 'px-3 py-2',
          hasAccess
            ? 'text-gray-300 hover:text-white'
            : 'text-gray-500 hover:text-gray-400',
          isActive(item.href) && hasAccess && 'text-white bg-white/10'
        )}
      >
        {item.icon && <item.icon className="w-4 h-4" />}
        <span className="flex-1">{item.label}</span>
        {showLock && <Lock className="w-3.5 h-3.5 text-gray-500" />}
        {item.badge && (
          <span className={cn(
            'px-1.5 py-0.5 text-[10px] font-medium rounded border',
            getBadgeStyle(item.badge)
          )}>
            {item.badge.toUpperCase()}
          </span>
        )}
      </Link>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div className="glass border-b border-white/5">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            {mainNavItems.map((item) => (
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
                  {item.icon && <item.icon className="w-4 h-4 mr-1" />}
                  {item.label}
                  {item.badge && (
                    <span className={cn(
                      'px-1.5 py-0.5 text-[10px] font-medium rounded border ml-1',
                      getBadgeStyle(item.badge)
                    )}>
                      {item.badge.toUpperCase()}
                    </span>
                  )}
                  {item.children && (
                    <ChevronDown className={cn(
                      'w-4 h-4 transition-transform ml-1',
                      openDropdown === item.label && 'rotate-180'
                    )} />
                  )}
                </Link>

                {/* Dropdown */}
                {item.children && openDropdown === item.label && (
                  <div className="absolute top-full left-0 pt-2">
                    <div className={cn(
                      'glass-card p-2 rounded-xl border border-white/10',
                      item.label === 'Premium' ? 'min-w-[280px] max-h-[70vh] overflow-y-auto' : 'min-w-[200px]'
                    )}>
                      {item.label === 'Premium' && !hasPremiumAccess && (
                        <div className="px-4 py-3 mb-2 border-b border-white/10">
                          <div className="flex items-center gap-2 text-purple-400 mb-1">
                            <Crown className="w-4 h-4" />
                            <span className="text-sm font-medium">Premium Features</span>
                          </div>
                          <p className="text-xs text-gray-400">
                            Unlock all features with Premium
                          </p>
                          <Link
                            to="/pricing"
                            className="mt-2 block w-full text-center px-3 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                          >
                            Upgrade Now
                          </Link>
                        </div>
                      )}
                      {item.children.map((child) => renderNavItem(child, true))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Search Bar */}
            <GlobalSearch className="hidden lg:block" />

            {/* Auth Section */}
            {user ? (
              <div
                className="relative"
                onMouseEnter={() => setUserDropdownOpen(true)}
                onMouseLeave={() => setUserDropdownOpen(false)}
              >
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    hasPremiumAccess ? 'bg-purple-500/20' : 'bg-brand-primary/20'
                  )}>
                    {hasPremiumAccess ? (
                      <Crown className="w-4 h-4 text-purple-400" />
                    ) : (
                      <User className="w-4 h-4 text-brand-primary" />
                    )}
                  </div>
                  <ChevronDown className={cn(
                    'w-4 h-4 transition-transform',
                    userDropdownOpen && 'rotate-180'
                  )} />
                </button>

                {userDropdownOpen && (
                  <div className="absolute top-full right-0 pt-2">
                    <div className="glass-card p-2 min-w-[240px] rounded-xl border border-white/10 max-h-[80vh] overflow-y-auto">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-white/10 mb-2">
                        <p className="text-sm text-gray-400">Signed in as</p>
                        <p className="text-sm text-white font-medium truncate">{user.email}</p>
                        {user.subscription_status && user.subscription_status !== 'free' && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            <span className="text-xs text-purple-400 capitalize">
                              {user.subscription_status} Plan
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Standard Menu Items */}
                      {userMenuItems.map((item) => renderNavItem(item, true))}

                      {/* Advisor Menu Items */}
                      {hasAdvisorAccess && advisorMenuItems.length > 0 && (
                        <>
                          <div className="border-t border-white/10 my-2 pt-2">
                            <div className="px-4 py-1 text-xs text-gray-500 uppercase tracking-wider">
                              Advisor Tools
                            </div>
                          </div>
                          {advisorMenuItems.map((item) => renderNavItem(item, true))}
                        </>
                      )}

                      {/* Enterprise Menu Items */}
                      {hasEnterpriseAccess && enterpriseMenuItems.length > 0 && (
                        <>
                          <div className="border-t border-white/10 my-2 pt-2">
                            <div className="px-4 py-1 text-xs text-gray-500 uppercase tracking-wider">
                              Enterprise
                            </div>
                          </div>
                          {enterpriseMenuItems.map((item) => renderNavItem(item, true))}
                        </>
                      )}

                      {/* Admin Dashboard link */}
                      {(user.role === 'admin' || user.role === 'super_admin') && (
                        <>
                          <div className="border-t border-white/10 my-2"></div>
                          <Link
                            to="/admin"
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-lg transition-colors"
                          >
                            <Shield className="w-4 h-4" />
                            Admin Dashboard
                          </Link>
                        </>
                      )}

                      {/* Sign Out */}
                      <div className="border-t border-white/10 my-2"></div>
                      <Link
                        to="/logout"
                        className="block px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        Sign Out
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

          {/* Mobile Search & Menu */}
          <div className="flex items-center gap-2 md:hidden">
            <MobileSearchTrigger />
            <button
              className="p-2 text-gray-300 hover:text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 glass border-b border-white/5 animate-in slide-in-from-top-5 max-h-[calc(100vh-5rem)] overflow-y-auto">
          <nav className="flex flex-col p-4 gap-2">
            {mainNavItems.map((item) => (
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
                  <span className="flex items-center gap-2">
                    {item.icon && <item.icon className="w-5 h-5" />}
                    {item.label}
                    {item.badge && (
                      <span className={cn(
                        'px-1.5 py-0.5 text-[10px] font-medium rounded border',
                        getBadgeStyle(item.badge)
                      )}>
                        {item.badge.toUpperCase()}
                      </span>
                    )}
                  </span>
                  {item.children && <ChevronDown className="w-4 h-4" />}
                </Link>
                {item.children && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const hasAccess = canAccessNavItem(child, userContext);
                      const showLock = child.showUpgradePrompt && !hasAccess;
                      return (
                        <Link
                          key={child.label}
                          to={hasAccess ? child.href : '/pricing'}
                          className={cn(
                            'flex items-center gap-2 px-4 py-2 text-sm rounded-lg',
                            hasAccess
                              ? 'text-gray-400 hover:text-white hover:bg-white/5'
                              : 'text-gray-600'
                          )}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {child.icon && <child.icon className="w-4 h-4" />}
                          <span className="flex-1">{child.label}</span>
                          {showLock && <Lock className="w-3.5 h-3.5 text-gray-600" />}
                          {child.badge && (
                            <span className={cn(
                              'px-1.5 py-0.5 text-[10px] font-medium rounded border',
                              getBadgeStyle(child.badge)
                            )}>
                              {child.badge.toUpperCase()}
                            </span>
                          )}
                        </Link>
                      );
                    })}
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
                    {user.subscription_status && user.subscription_status !== 'free' && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span className="text-xs text-purple-400 capitalize">
                          {user.subscription_status} Plan
                        </span>
                      </div>
                    )}
                  </div>

                  {userMenuItems.slice(0, 5).map((item) => (
                    <Link
                      key={item.label}
                      to={item.href}
                      className="flex items-center gap-2 px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.icon && <item.icon className="w-5 h-5" />}
                      {item.label}
                    </Link>
                  ))}

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

                  <div className="border-t border-white/10 my-2"></div>
                  <Link
                    to="/logout"
                    className="block px-4 py-3 text-base font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Out
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
