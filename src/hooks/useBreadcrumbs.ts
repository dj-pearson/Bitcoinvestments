import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export interface Breadcrumb {
  label: string;
  path: string;
  isCurrentPage: boolean;
}

/**
 * Route configuration for generating breadcrumbs
 */
const ROUTE_LABELS: Record<string, string> = {
  // Main pages
  '/': 'Home',
  '/dashboard': 'Dashboard',
  '/charts': 'Charts',
  '/calculators': 'Calculators',
  '/compare': 'Compare',
  '/scam-database': 'Scam Database',
  '/pricing': 'Pricing',
  '/backtesting': 'Backtesting',

  // Auth pages
  '/login': 'Sign In',
  '/signup': 'Sign Up',
  '/forgot-password': 'Forgot Password',

  // User pages
  '/profile': 'Profile',
  '/affiliate-stats': 'Affiliate Stats',
  '/ad-manager': 'Ad Manager',
  '/tax-reports': 'Tax Reports',
  '/advisor': 'Advisor Dashboard',
  '/affiliate': 'Affiliate Program',
  '/portfolio-analysis': 'Portfolio Analysis',

  // Admin pages
  '/admin': 'Admin Dashboard',
  '/admin/users': 'User Management',
  '/admin/scam-database': 'Scam Reports',
  '/admin/ai-settings': 'AI Settings',

  // Content pages
  '/learn': 'Learn',
  '/glossary': 'Glossary',
  '/search': 'Search Results',

  // Legal pages
  '/privacy': 'Privacy Policy',
  '/terms': 'Terms of Service',
  '/disclaimer': 'Disclaimer',
};

/**
 * Dynamic route patterns and their label generators.
 *
 * Labels come from the regex captures rather than useParams(): Breadcrumbs is
 * rendered by the Layout, above the matched child route, so useParams() there
 * does not see the child's params. Nothing here may read `window` - this runs
 * during render, including server-side prerendering.
 */
interface DynamicRouteConfig {
  pattern: RegExp;
  getLabel: (match: RegExpMatchArray) => string;
  getParent?: (match: RegExpMatchArray) => { label: string; path: string };
}

const DYNAMIC_ROUTES: DynamicRouteConfig[] = [
  {
    pattern: /^\/learn\/([^/]+)$/,
    getLabel: (m) => formatSlug(m[1]),
    getParent: () => ({ label: 'Learn', path: '/learn' }),
  },
  {
    pattern: /^\/course\/([^/]+)$/,
    getLabel: (m) => formatSlug(m[1]),
    getParent: () => ({ label: 'Learn', path: '/learn' }),
  },
  {
    pattern: /^\/course\/([^/]+)\/([^/]+)$/,
    getLabel: (m) => formatSlug(m[2]),
    getParent: (m) => ({ label: 'Course', path: `/course/${m[1]}` }),
  },
  {
    pattern: /^\/compare\/([^/]+)\/([^/]+)$/,
    getLabel: (m) => formatSlug(m[2]),
    getParent: () => ({ label: 'Compare', path: '/compare' }),
  },
  {
    pattern: /^\/coin\/([^/]+)$/,
    getLabel: (m) => formatSlug(m[1]),
    getParent: () => ({ label: 'Prices', path: '/dashboard' }),
  },
  {
    pattern: /^\/scam\/([^/]+)$/,
    getLabel: () => 'Scam Report',
    getParent: () => ({ label: 'Scam Database', path: '/scam-database' }),
  },
  {
    pattern: /^\/blog\/category\/([^/]+)$/,
    getLabel: (m) => formatSlug(m[1]),
    getParent: () => ({ label: 'Blog', path: '/blog' }),
  },
  {
    pattern: /^\/blog\/([^/]+)$/,
    getLabel: (m) => formatSlug(m[1]),
    getParent: () => ({ label: 'Blog', path: '/blog' }),
  },
  {
    pattern: /^\/sponsored\/([^/]+)$/,
    getLabel: (m) => formatSlug(m[1]),
  },
  {
    pattern: /^\/developers\/([^/]+)$/,
    getLabel: (m) => (m[1] === 'pricing' ? 'API Pricing' : formatSlug(m[1])),
  },
];

/**
 * Format a slug into a human-readable label
 */
function formatSlug(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

/**
 * Get the parent path for a given path
 * Reserved for future use in nested breadcrumb navigation
 */
function _getParentPath(path: string): string | null {
  const segments = path.split('/').filter(Boolean);
  if (segments.length <= 1) {
    return '/';
  }
  return '/' + segments.slice(0, -1).join('/');
}
void _getParentPath;

/**
 * Hook to generate breadcrumbs based on current route
 */
export function useBreadcrumbs(): Breadcrumb[] {
  const location = useLocation();

  return useMemo(() => {
    const path = location.pathname;
    const breadcrumbs: Breadcrumb[] = [];

    // Always start with Home (except if we're on the home page)
    if (path !== '/') {
      breadcrumbs.push({
        label: 'Home',
        path: '/',
        isCurrentPage: false,
      });
    }

    // Check if it's a dynamic route
    let dynamicConfig: DynamicRouteConfig | null = null;
    let match: RegExpMatchArray | null = null;
    for (const config of DYNAMIC_ROUTES) {
      match = path.match(config.pattern);
      if (match) {
        dynamicConfig = config;
        break;
      }
    }

    if (dynamicConfig && match) {
      // Add parent breadcrumb for dynamic routes
      if (dynamicConfig.getParent) {
        const parent = dynamicConfig.getParent(match);
        breadcrumbs.push({
          label: parent.label,
          path: parent.path,
          isCurrentPage: false,
        });
      }

      // Add current page
      breadcrumbs.push({
        label: dynamicConfig.getLabel(match),
        path: path,
        isCurrentPage: true,
      });
    } else {
      // Build breadcrumbs from path segments
      const segments = path.split('/').filter(Boolean);
      let currentPath = '';

      for (let i = 0; i < segments.length; i++) {
        currentPath += '/' + segments[i];
        const isLast = i === segments.length - 1;

        // Get label from route config or format the segment
        let label = ROUTE_LABELS[currentPath];

        if (!label) {
          // An intermediate segment that is not itself a page would render a
          // crumb linking to a 404, so it is left out.
          if (!isLast) continue;
          label = formatSlug(segments[i]);
        }

        breadcrumbs.push({
          label,
          path: currentPath,
          isCurrentPage: isLast,
        });
      }
    }

    // If we're on home page, just show Home as current
    if (path === '/') {
      return [
        {
          label: 'Home',
          path: '/',
          isCurrentPage: true,
        },
      ];
    }

    return breadcrumbs;
  }, [location.pathname]);
}

/**
 * Hook to check if breadcrumbs should be shown
 */
export function useShouldShowBreadcrumbs(): boolean {
  const location = useLocation();

  // Pages where breadcrumbs should not be shown
  const hideBreadcrumbsOn = [
    '/',
    '/login',
    '/signup',
    '/forgot-password',
  ];

  return !hideBreadcrumbsOn.includes(location.pathname);
}
