/**
 * LoadingSkeletons Component Library
 *
 * A comprehensive collection of reusable skeleton loading components
 * following best practices for perceived performance and SEO.
 *
 * Best Practices:
 * - Skeleton shapes match the actual content for seamless transitions
 * - Animation is subtle to avoid distraction
 * - Components are SSR-friendly (no layout shift)
 * - Accessible with aria-busy and role attributes
 */

import { cn } from '../lib/utils';

// ============================================
// Base Skeleton Component
// ============================================

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

/**
 * Base skeleton element with shimmer animation
 */
export function Skeleton({ className, animate = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-white/10 rounded',
        animate && 'animate-pulse',
        className
      )}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton with shimmer effect (alternative animation)
 */
export function SkeletonShimmer({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-white/10 rounded',
        className
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

// ============================================
// Layout Skeletons
// ============================================

interface PageSkeletonProps {
  showHeader?: boolean;
  showSidebar?: boolean;
  className?: string;
}

/**
 * Full page loading skeleton
 */
export function PageSkeleton({ showHeader = true, showSidebar = false, className }: PageSkeletonProps) {
  return (
    <div
      className={cn('container mx-auto px-4 py-8', className)}
      role="status"
      aria-busy="true"
      aria-label="Loading page content"
    >
      {showHeader && (
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      )}

      <div className={cn('grid gap-8', showSidebar ? 'lg:grid-cols-3' : '')}>
        <div className={showSidebar ? 'lg:col-span-2' : ''}>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </div>
        </div>

        {showSidebar && (
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        )}
      </div>

      <span className="sr-only">Loading...</span>
    </div>
  );
}

// ============================================
// Card Skeletons
// ============================================

interface CardSkeletonProps {
  className?: string;
  showImage?: boolean;
  lines?: number;
}

/**
 * Generic card skeleton
 */
export function CardSkeleton({ className, showImage = false, lines = 3 }: CardSkeletonProps) {
  return (
    <div
      className={cn('glass-card p-6', className)}
      role="status"
      aria-busy="true"
    >
      {showImage && <Skeleton className="h-40 w-full rounded-lg mb-4" />}
      <Skeleton className="h-6 w-3/4 mb-3" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')}
          />
        ))}
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Stat/metric card skeleton
 */
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('glass-card p-4', className)}
      role="status"
      aria-busy="true"
    >
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-8 w-32 mb-1" />
      <Skeleton className="h-4 w-16" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Grid of stat cards skeleton
 */
export function StatGridSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div
      className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}
      role="status"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// ============================================
// Table Skeletons
// ============================================

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
  showHeader?: boolean;
}

/**
 * Table skeleton for data-heavy pages
 */
export function TableSkeleton({ rows = 10, columns = 5, className, showHeader = true }: TableSkeletonProps) {
  return (
    <div
      className={cn('glass-card p-6', className)}
      role="status"
      aria-busy="true"
      aria-label="Loading table data"
    >
      {showHeader && (
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
      )}

      <div className="space-y-4">
        {/* Table header */}
        <div className="grid gap-4 pb-3 border-b border-white/10" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>

        {/* Table rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-4 py-3 border-b border-white/5"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={cn(
                  'h-4',
                  colIndex === 0 ? 'w-full' : 'w-16'
                )}
              />
            ))}
          </div>
        ))}
      </div>

      <span className="sr-only">Loading table data...</span>
    </div>
  );
}

/**
 * Cryptocurrency price table row skeleton
 */
export function CryptoTableRowSkeleton() {
  return (
    <tr className="border-b border-white/5">
      <td className="py-4 px-2"><Skeleton className="h-4 w-6" /></td>
      <td className="py-4 px-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <div>
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
      </td>
      <td className="py-4 px-2 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
      <td className="py-4 px-2 text-right"><Skeleton className="h-4 w-14 ml-auto" /></td>
      <td className="py-4 px-2 text-right hidden md:table-cell"><Skeleton className="h-4 w-16 ml-auto" /></td>
    </tr>
  );
}

/**
 * Cryptocurrency price table skeleton
 */
export function CryptoTableSkeleton({ rows = 10, className }: { rows?: number; className?: string }) {
  return (
    <div
      className={cn('glass-card p-6', className)}
      role="status"
      aria-busy="true"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-64" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-2"><Skeleton className="h-4 w-4" /></th>
              <th className="text-left py-3 px-2"><Skeleton className="h-4 w-12" /></th>
              <th className="text-right py-3 px-2"><Skeleton className="h-4 w-12" /></th>
              <th className="text-right py-3 px-2"><Skeleton className="h-4 w-8" /></th>
              <th className="text-right py-3 px-2 hidden md:table-cell"><Skeleton className="h-4 w-20" /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <CryptoTableRowSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </div>

      <span className="sr-only">Loading cryptocurrency data...</span>
    </div>
  );
}

// ============================================
// List Skeletons
// ============================================

interface ListSkeletonProps {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}

/**
 * Generic list skeleton
 */
export function ListSkeleton({ items = 5, showAvatar = false, className }: ListSkeletonProps) {
  return (
    <div
      className={cn('space-y-4', className)}
      role="status"
      aria-busy="true"
    >
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
          {showAvatar && <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-16 flex-shrink-0" />
        </div>
      ))}
      <span className="sr-only">Loading list...</span>
    </div>
  );
}

/**
 * Trending list skeleton (for sidebar)
 */
export function TrendingListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div
      className="glass-card p-6"
      role="status"
      aria-busy="true"
    >
      <Skeleton className="h-5 w-24 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="flex-grow">
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading trending items...</span>
    </div>
  );
}

// ============================================
// Chart Skeletons
// ============================================

interface ChartSkeletonProps {
  height?: number | string;
  className?: string;
  showLegend?: boolean;
}

/**
 * Line/area chart skeleton
 */
export function ChartSkeleton({ height = 300, className, showLegend = true }: ChartSkeletonProps) {
  return (
    <div
      className={cn('glass-card p-6', className)}
      role="status"
      aria-busy="true"
    >
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      <div
        className="relative rounded-lg overflow-hidden bg-white/5"
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        {/* Simulated chart lines */}
        <div className="absolute inset-0 flex items-end justify-around px-4 pb-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-white/10 rounded-t animate-pulse"
              style={{
                height: `${30 + Math.random() * 50}%`,
                animationDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>

        {/* Axis lines */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/20" />
        <div className="absolute top-0 bottom-0 left-0 w-px bg-white/20" />
      </div>

      {showLegend && (
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      )}

      <span className="sr-only">Loading chart...</span>
    </div>
  );
}

/**
 * Gauge/circular chart skeleton
 */
export function GaugeSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('glass-card p-6', className)}
      role="status"
      aria-busy="true"
    >
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="flex justify-center">
        <Skeleton className="h-32 w-32 rounded-full" />
      </div>
      <div className="text-center mt-4">
        <Skeleton className="h-8 w-16 mx-auto mb-2" />
        <Skeleton className="h-4 w-24 mx-auto" />
      </div>
      <span className="sr-only">Loading gauge...</span>
    </div>
  );
}

// ============================================
// Content Skeletons
// ============================================

/**
 * Article/blog content skeleton
 */
export function ArticleSkeleton({ className }: { className?: string }) {
  return (
    <article
      className={cn('max-w-4xl mx-auto px-4 py-8', className)}
      role="status"
      aria-busy="true"
      aria-label="Loading article"
    >
      {/* Back link */}
      <Skeleton className="h-4 w-40 mb-8" />

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-12 w-4/5 mb-6" />
        <div className="flex gap-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
      </header>

      {/* Featured image */}
      <Skeleton className="h-64 md:h-96 w-full rounded-xl mb-8" />

      {/* Excerpt */}
      <div className="bg-gray-800/50 rounded-xl p-6 mb-8 border-l-4 border-white/20">
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-5 w-5/6" />
      </div>

      {/* Content */}
      <div className="space-y-4 mb-12">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ))}
      </div>

      <span className="sr-only">Loading article...</span>
    </article>
  );
}

/**
 * Scam report detail skeleton
 */
export function ScamReportSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('min-h-screen py-8', className)}
      role="status"
      aria-busy="true"
      aria-label="Loading scam report"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <Skeleton className="h-4 w-40 mb-6" />

        {/* Header card */}
        <div className="bg-white/5 rounded-lg shadow-lg overflow-hidden mb-6">
          {/* Warning banner */}
          <div className="p-4 bg-white/10 flex items-center gap-3">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-5 w-64" />
          </div>

          {/* Main header */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-12 w-12 rounded" />
            </div>

            {/* Voting and actions */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-20 rounded-lg" />
                <Skeleton className="h-10 w-20 rounded-lg" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-10 w-24 rounded-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        {/* Content sections */}
        <div className="space-y-6">
          {/* Description */}
          <div className="bg-white/5 rounded-lg shadow p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-lg shadow p-4 text-center">
                <Skeleton className="h-8 w-8 mx-auto mb-2 rounded" />
                <Skeleton className="h-6 w-16 mx-auto mb-1" />
                <Skeleton className="h-3 w-20 mx-auto" />
              </div>
            ))}
          </div>

          {/* Red flags */}
          <div className="bg-white/5 rounded-lg shadow p-6">
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Skeleton className="h-4 w-4 mt-1 flex-shrink-0" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <span className="sr-only">Loading scam report...</span>
    </div>
  );
}

// ============================================
// Form Skeletons
// ============================================

/**
 * Form field skeleton
 */
export function FormFieldSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

/**
 * Form skeleton
 */
export function FormSkeleton({ fields = 4, className }: { fields?: number; className?: string }) {
  return (
    <div
      className={cn('space-y-4', className)}
      role="status"
      aria-busy="true"
    >
      {Array.from({ length: fields }).map((_, i) => (
        <FormFieldSkeleton key={i} />
      ))}
      <Skeleton className="h-10 w-32 rounded-lg mt-6" />
      <span className="sr-only">Loading form...</span>
    </div>
  );
}

// ============================================
// Portfolio/Analysis Skeletons
// ============================================

/**
 * Portfolio analysis skeleton
 */
export function AnalysisSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('glass-card p-12 text-center', className)}
      role="status"
      aria-busy="true"
    >
      <div className="flex justify-center mb-4">
        <div className="h-16 w-16 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
      </div>
      <Skeleton className="h-6 w-48 mx-auto mb-2" />
      <Skeleton className="h-4 w-72 mx-auto" />
      <span className="sr-only">Analyzing portfolio...</span>
    </div>
  );
}

/**
 * Portfolio holdings list skeleton
 */
export function HoldingsListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div
      className="space-y-3"
      role="status"
      aria-busy="true"
    >
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div>
              <Skeleton className="h-4 w-12 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="text-right">
            <Skeleton className="h-4 w-10 mb-1 ml-auto" />
            <Skeleton className="h-3 w-16 ml-auto" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading holdings...</span>
    </div>
  );
}

// ============================================
// Enhanced Page Loader
// ============================================

interface PageLoaderProps {
  message?: string;
  showProgress?: boolean;
  className?: string;
}

/**
 * Enhanced page loader with better UX
 */
export function PageLoader({ message = 'Loading...', showProgress = false, className }: PageLoaderProps) {
  return (
    <div
      className={cn(
        'min-h-[400px] flex flex-col items-center justify-center gap-4',
        className
      )}
      role="status"
      aria-busy="true"
      aria-label={message}
    >
      {/* Animated loader */}
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-white/10" />
        <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-brand-primary border-t-transparent animate-spin" />
      </div>

      {/* Message */}
      <p className="text-gray-400 text-sm animate-pulse">{message}</p>

      {/* Optional progress bar */}
      {showProgress && (
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-brand-primary rounded-full animate-[progress_2s_ease-in-out_infinite]" />
        </div>
      )}

      <span className="sr-only">{message}</span>
    </div>
  );
}

/**
 * Inline loader for smaller sections
 */
export function InlineLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex items-center justify-center gap-2 py-4', className)}
      role="status"
      aria-busy="true"
    >
      <div className="h-4 w-4 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
      <span className="text-gray-400 text-sm">Loading...</span>
    </div>
  );
}

// ============================================
// Specialized Dashboard Skeletons
// ============================================

/**
 * Dashboard global stats skeleton
 */
export function DashboardStatsSkeleton() {
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      role="status"
      aria-busy="true"
    >
      {/* Market Cap */}
      <div className="glass-card p-4">
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-6 w-20 mb-1" />
        <Skeleton className="h-4 w-12" />
      </div>

      {/* Fear & Greed */}
      <div className="glass-card p-4">
        <Skeleton className="h-3 w-28 mb-2" />
        <Skeleton className="h-6 w-16 mb-1" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* BTC Dominance */}
      <div className="glass-card p-4">
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-6 w-14 mb-1" />
      </div>

      {/* Active Cryptos */}
      <div className="glass-card p-4">
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-6 w-20" />
      </div>

      <span className="sr-only">Loading market stats...</span>
    </div>
  );
}

/**
 * Full dashboard skeleton
 */
export function DashboardSkeleton() {
  return (
    <div
      className="container mx-auto px-4 py-12"
      role="status"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <Skeleton className="h-9 w-56 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      {/* Global Stats */}
      <DashboardStatsSkeleton />

      {/* Chart */}
      <ChartSkeleton height={300} className="mb-8" />

      {/* Portfolio Tracker */}
      <div className="glass-card p-6 mb-8">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid md:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Price Table */}
        <div className="lg:col-span-2">
          <CryptoTableSkeleton rows={10} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <GaugeSkeleton />
          <CardSkeleton lines={4} />
          <TrendingListSkeleton items={5} />
        </div>
      </div>

      <span className="sr-only">Loading dashboard...</span>
    </div>
  );
}

export default {
  Skeleton,
  SkeletonShimmer,
  PageSkeleton,
  CardSkeleton,
  StatCardSkeleton,
  StatGridSkeleton,
  TableSkeleton,
  CryptoTableSkeleton,
  CryptoTableRowSkeleton,
  ListSkeleton,
  TrendingListSkeleton,
  ChartSkeleton,
  GaugeSkeleton,
  ArticleSkeleton,
  ScamReportSkeleton,
  FormSkeleton,
  FormFieldSkeleton,
  AnalysisSkeleton,
  HoldingsListSkeleton,
  PageLoader,
  InlineLoader,
  DashboardStatsSkeleton,
  DashboardSkeleton,
};
