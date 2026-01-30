import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Shield,
  Bot,
  ScrollText,
  FileText,
  Settings,
  HeadphonesIcon,
  BarChart3,
  Mail,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  CreditCard,
  Globe,
  Zap,
  PenSquare,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useIsSuperAdmin, useUserRole } from '../AdminRoute';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
  requiredRole?: 'admin' | 'super_admin';
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'User Management',
    items: [
      { name: 'Users', path: '/admin/users', icon: Users },
      { name: 'Subscriptions', path: '/admin/subscriptions', icon: CreditCard },
    ],
  },
  {
    title: 'Content & Safety',
    items: [
      { name: 'Blog', path: '/admin/blog', icon: PenSquare },
      { name: 'Scam Database', path: '/admin/scam-database', icon: Shield },
      { name: 'Content Moderation', path: '/admin/content', icon: FileText },
      { name: 'Support Tickets', path: '/admin/support', icon: HeadphonesIcon },
    ],
  },
  {
    title: 'System',
    items: [
      { name: 'AI Settings', path: '/admin/ai-settings', icon: Bot },
      { name: 'Audit Logs', path: '/admin/audit-logs', icon: ScrollText },
      { name: 'Newsletters', path: '/admin/newsletters', icon: Mail },
      { name: 'System Settings', path: '/admin/settings', icon: Settings, requiredRole: 'super_admin' },
    ],
  },
];

export function AdminLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const userRole = useUserRole();
  const isSuperAdmin = useIsSuperAdmin();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const currentPageTitle = navSections
    .flatMap((s) => s.items)
    .find((item) => {
      if (item.path === '/admin') {
        return location.pathname === '/admin';
      }
      return location.pathname.startsWith(item.path);
    })?.name || 'Dashboard';

  const filteredSections = navSections.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (item.requiredRole === 'super_admin' && !isSuperAdmin) {
        return false;
      }
      return true;
    }),
  })).filter((section) => section.items.length > 0);

  return (
    <div className="min-h-screen bg-[#0B0D14] flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          flex flex-col
          bg-gradient-to-b from-[#0F1118] to-[#0B0D14]
          border-r border-white/5
          transition-all duration-300 ease-out
          ${collapsed ? 'w-[72px]' : 'w-[260px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo area */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white">Admin Panel</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {filteredSections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <h3 className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.path === '/admin'
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl
                        transition-all duration-200 group relative
                        ${isActive
                          ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-orange-400 shadow-lg shadow-orange-500/5'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-orange-400' : ''}`} />
                      {!collapsed && (
                        <>
                          <span className="font-medium text-sm">{item.name}</span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className="ml-auto px-2 py-0.5 text-xs font-medium rounded-full bg-orange-500/20 text-orange-400">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                      {collapsed && (
                        <div className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-sm rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                          {item.name}
                        </div>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-white/5">
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-white/5 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-white">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.email || 'Admin'}
                </p>
                <p className="text-xs text-slate-500 capitalize">{userRole}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={() => signOut()}
              className="w-full mt-2 flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-6 bg-[#0F1118]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-slate-400"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">{currentPageTitle}</h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Manage your platform settings and users
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5 focus-within:border-orange-500/50 transition-colors">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none w-40"
              />
              <kbd className="hidden lg:inline-flex px-1.5 py-0.5 text-[10px] font-medium text-slate-500 bg-white/5 rounded">
                ⌘K
              </kbd>
            </div>

            {/* Quick actions */}
            <button className="relative p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm">View Site</span>
            </a>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

