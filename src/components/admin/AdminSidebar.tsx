/**
 * AdminSidebar Component
 *
 * Navigation sidebar for the admin dashboard with collapsible sections.
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, Home, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';
import { adminNavSections, type NavSection, type NavItem } from '../../config/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface AdminSidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function AdminSidebar({ collapsed = false, onCollapsedChange }: AdminSidebarProps) {
  const location = useLocation();
  const { profile } = useAuth();
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview', 'management']);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isSuperAdmin = profile?.role === 'super_admin';

  const renderNavItem = (item: NavItem) => {
    // Check role requirements
    if (item.requiredRole?.includes('super_admin') && !isSuperAdmin) {
      return null;
    }

    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        to={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
          active
            ? 'bg-orange-500/20 text-orange-400'
            : 'text-gray-400 hover:text-white hover:bg-white/5',
          collapsed && 'justify-center px-2'
        )}
        title={collapsed ? item.label : undefined}
      >
        {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
        {!collapsed && (
          <span className="truncate">{item.label}</span>
        )}
      </Link>
    );
  };

  const renderSection = (section: NavSection) => {
    // Check section role requirements
    if (section.requiredRole?.includes('super_admin') && !isSuperAdmin) {
      return null;
    }

    const isExpanded = expandedSections.includes(section.id);
    const filteredItems = section.items.filter(item => {
      if (item.requiredRole?.includes('super_admin') && !isSuperAdmin) {
        return false;
      }
      return true;
    });

    if (filteredItems.length === 0) return null;

    if (collapsed) {
      // In collapsed mode, just show the first item of each section as icon-only
      return (
        <div key={section.id} className="space-y-1">
          {filteredItems.map(item => renderNavItem(item))}
        </div>
      );
    }

    return (
      <div key={section.id} className="mb-2">
        <button
          onClick={() => toggleSection(section.id)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors"
        >
          <span>{section.label}</span>
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </button>
        {isExpanded && (
          <div className="mt-1 space-y-1">
            {filteredItems.map(item => renderNavItem(item))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-20 bottom-0 bg-gray-900/95 backdrop-blur-xl border-r border-white/10 z-40 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className={cn(
          'flex items-center gap-3 px-4 py-4 border-b border-white/10',
          collapsed && 'justify-center px-2'
        )}>
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-orange-400" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-sm font-semibold text-white">Admin Panel</h2>
              <p className="text-xs text-gray-500 capitalize">
                {profile?.role?.replace('_', ' ') || 'Admin'}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
          {adminNavSections.map(section => renderSection(section))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-3">
          {/* Back to Site Link */}
          <Link
            to="/dashboard"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? 'Back to Site' : undefined}
          >
            <Home className="w-5 h-5" />
            {!collapsed && <span>Back to Site</span>}
          </Link>

          {/* Collapse Toggle */}
          {onCollapsedChange && (
            <button
              onClick={() => onCollapsedChange(!collapsed)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg text-sm font-medium text-gray-500 hover:text-white hover:bg-white/5 transition-colors',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

// Mobile Admin Navigation
export function AdminMobileNav() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { profile } = useAuth();

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  const isSuperAdmin = profile?.role === 'super_admin';

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 p-4 rounded-full bg-orange-600 text-white shadow-lg shadow-orange-500/25"
      >
        <Shield className="w-6 h-6" />
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 w-72 bg-gray-900 z-50 transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full pt-20">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Admin Panel</h2>
              <p className="text-xs text-gray-500 capitalize">
                {profile?.role?.replace('_', ' ') || 'Admin'}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {adminNavSections.map(section => {
              // Check section role requirements
              if (section.requiredRole?.includes('super_admin') && !isSuperAdmin) {
                return null;
              }

              const filteredItems = section.items.filter(item => {
                if (item.requiredRole?.includes('super_admin') && !isSuperAdmin) {
                  return false;
                }
                return true;
              });

              if (filteredItems.length === 0) return null;

              return (
                <div key={section.id} className="mb-4">
                  <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {section.label}
                  </p>
                  <div className="space-y-1">
                    {filteredItems.map(item => {
                      const active = isActive(item.href);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                            active
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          )}
                        >
                          {Icon && <Icon className="w-5 h-5" />}
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-white/10 p-3">
            <Link
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>Back to Site</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
