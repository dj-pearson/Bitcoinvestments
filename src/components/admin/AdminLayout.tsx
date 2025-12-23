/**
 * AdminLayout Component
 *
 * Layout wrapper for admin pages with sidebar navigation.
 */

import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { AdminSidebar, AdminMobileNav } from './AdminSidebar';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    if (saved !== null) {
      setSidebarCollapsed(saved === 'true');
    }
  }, []);

  // Save collapsed state to localStorage
  const handleCollapsedChange = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    localStorage.setItem('admin-sidebar-collapsed', String(collapsed));
  };

  // Auto-collapse on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280 && window.innerWidth >= 1024) {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={handleCollapsedChange}
        />
      </div>

      {/* Mobile Navigation */}
      <AdminMobileNav />

      {/* Main Content */}
      <main
        className={cn(
          'min-h-screen pt-20 transition-all duration-300',
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        )}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}

// Page header component for admin pages
interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
          {description && (
            <p className="mt-1 text-sm sm:text-base text-gray-400">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// Card component for admin dashboard
interface AdminCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function AdminCard({ children, className, padding = 'md' }: AdminCardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        'bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/5',
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

// Stat card for admin dashboard
interface AdminStatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  href?: string;
}

export function AdminStatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  href,
}: AdminStatCardProps) {
  const changeColors = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-gray-400',
  };

  const content = (
    <AdminCard className="hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change && (
            <p className={cn('mt-2 text-sm', changeColors[changeType])}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 rounded-lg bg-white/5">
            {icon}
          </div>
        )}
      </div>
    </AdminCard>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  return content;
}

// Export all admin layout components
export { AdminSidebar, AdminMobileNav } from './AdminSidebar';
