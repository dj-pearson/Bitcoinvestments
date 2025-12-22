import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useBreadcrumbs, useShouldShowBreadcrumbs } from '../hooks/useBreadcrumbs';

interface BreadcrumbsProps {
  className?: string;
}

export function Breadcrumbs({ className = '' }: BreadcrumbsProps) {
  const breadcrumbs = useBreadcrumbs();
  const shouldShow = useShouldShowBreadcrumbs();

  if (!shouldShow || breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center text-sm ${className}`}
    >
      <ol
        className="flex items-center flex-wrap gap-1"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {breadcrumbs.map((crumb, index) => (
          <li
            key={crumb.path}
            className="flex items-center"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-slate-500 mx-1 flex-shrink-0" />
            )}

            {crumb.isCurrentPage ? (
              <span
                className="text-slate-300 font-medium"
                itemProp="name"
                aria-current="page"
              >
                {index === 0 && crumb.label === 'Home' ? (
                  <span className="flex items-center gap-1">
                    <Home className="h-4 w-4" />
                    <span className="sr-only">Home</span>
                  </span>
                ) : (
                  crumb.label
                )}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="text-slate-400 hover:text-orange-400 transition-colors flex items-center gap-1"
                itemProp="item"
              >
                {index === 0 && crumb.label === 'Home' ? (
                  <>
                    <Home className="h-4 w-4" />
                    <span className="sr-only" itemProp="name">Home</span>
                  </>
                ) : (
                  <span itemProp="name">{crumb.label}</span>
                )}
              </Link>
            )}

            <meta itemProp="position" content={String(index + 1)} />
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Compact breadcrumbs variant for smaller spaces
 */
export function CompactBreadcrumbs({ className = '' }: BreadcrumbsProps) {
  const breadcrumbs = useBreadcrumbs();
  const shouldShow = useShouldShowBreadcrumbs();

  if (!shouldShow || breadcrumbs.length <= 1) {
    return null;
  }

  // Only show last 2-3 items in compact mode
  const visibleBreadcrumbs = breadcrumbs.length > 3
    ? [breadcrumbs[0], { label: '...', path: '', isCurrentPage: false }, ...breadcrumbs.slice(-2)]
    : breadcrumbs;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center text-xs ${className}`}
    >
      <ol className="flex items-center gap-1">
        {visibleBreadcrumbs.map((crumb, index) => (
          <li key={crumb.path || index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-3 w-3 text-slate-500 mx-0.5" />
            )}

            {crumb.label === '...' ? (
              <span className="text-slate-500">...</span>
            ) : crumb.isCurrentPage ? (
              <span className="text-slate-300 font-medium truncate max-w-[150px]">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="text-slate-400 hover:text-orange-400 transition-colors truncate max-w-[100px]"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Breadcrumbs with custom items
 */
interface CustomBreadcrumbsProps {
  items: Array<{
    label: string;
    path?: string;
  }>;
  className?: string;
}

export function CustomBreadcrumbs({ items, className = '' }: CustomBreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center text-sm ${className}`}
    >
      <ol className="flex items-center gap-1">
        <li className="flex items-center">
          <Link
            to="/"
            className="text-slate-400 hover:text-orange-400 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="h-4 w-4 text-slate-500 mx-1" />

            {item.path && index < items.length - 1 ? (
              <Link
                to={item.path}
                className="text-slate-400 hover:text-orange-400 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-300 font-medium" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
