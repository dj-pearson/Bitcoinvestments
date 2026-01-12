/**
 * AccessibleTable Component
 *
 * An accessible data table component that follows WCAG 2.1 guidelines.
 * Includes proper headers, captions, and responsive mobile layouts.
 *
 * WCAG 2.1 Success Criteria:
 * - 1.3.1 Info and Relationships (Level A)
 * - 1.3.2 Meaningful Sequence (Level A)
 * - 4.1.1 Parsing (Level A)
 */

import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface Column<T> {
    /** Unique key for the column */
    key: string;
    /** Display header for the column */
    header: string;
    /** Render function for cell content */
    render: (item: T, index: number) => ReactNode;
    /** Whether this column is sortable */
    sortable?: boolean;
    /** Custom header class */
    headerClassName?: string;
    /** Custom cell class */
    cellClassName?: string;
    /** Whether to hide on mobile (will show in card view) */
    hideOnMobile?: boolean;
    /** Screen reader only description for the column */
    srDescription?: string;
}

interface AccessibleTableProps<T> {
    /** Table caption for screen readers */
    caption: string;
    /** Whether to visually hide the caption */
    captionHidden?: boolean;
    /** Column definitions */
    columns: Column<T>[];
    /** Data rows */
    data: T[];
    /** Unique key extractor for each row */
    getRowKey: (item: T, index: number) => string;
    /** Optional row click handler */
    onRowClick?: (item: T, index: number) => void;
    /** Whether the table is loading */
    loading?: boolean;
    /** Empty state message */
    emptyMessage?: string;
    /** Additional class name for the table container */
    className?: string;
    /** Whether to show mobile card view */
    mobileCardView?: boolean;
    /** ARIA label for the table */
    ariaLabel?: string;
    /** Summary of table contents for complex tables */
    summary?: string;
}

export function AccessibleTable<T>({
    caption,
    captionHidden = false,
    columns,
    data,
    getRowKey,
    onRowClick,
    loading = false,
    emptyMessage = 'No data available',
    className = '',
    mobileCardView = true,
    ariaLabel,
    summary,
}: AccessibleTableProps<T>) {
    const visibleColumns = columns.filter((col) => !col.hideOnMobile);
    const hasClickHandler = typeof onRowClick === 'function';

    return (
        <div className={cn('w-full', className)}>
            {/* Desktop Table View */}
            <div className={cn(mobileCardView ? 'hidden md:block' : 'block')}>
                <table
                    className="w-full border-collapse"
                    role="table"
                    aria-label={ariaLabel || caption}
                    aria-busy={loading}
                >
                    <caption className={cn(captionHidden && 'sr-only', 'text-left text-lg font-semibold text-white mb-4')}>
                        {caption}
                        {summary && <span className="sr-only">. {summary}</span>}
                    </caption>
                    <thead>
                        <tr className="border-b border-white/10">
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    scope="col"
                                    className={cn(
                                        'text-left px-4 py-3 text-sm font-medium text-gray-400',
                                        column.headerClassName
                                    )}
                                >
                                    {column.header}
                                    {column.srDescription && (
                                        <span className="sr-only">. {column.srDescription}</span>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-4 py-8 text-center text-gray-400"
                                >
                                    <span aria-live="polite">Loading data...</span>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-4 py-8 text-center text-gray-400"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((item, index) => (
                                <tr
                                    key={getRowKey(item, index)}
                                    className={cn(
                                        'hover:bg-white/5 transition-colors',
                                        hasClickHandler && 'cursor-pointer focus-within:bg-white/5'
                                    )}
                                    onClick={hasClickHandler ? () => onRowClick(item, index) : undefined}
                                    tabIndex={hasClickHandler ? 0 : undefined}
                                    onKeyDown={
                                        hasClickHandler
                                            ? (e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    onRowClick(item, index);
                                                }
                                            }
                                            : undefined
                                    }
                                    role={hasClickHandler ? 'button' : 'row'}
                                    aria-label={hasClickHandler ? `Select row ${index + 1}` : undefined}
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={`${getRowKey(item, index)}-${column.key}`}
                                            className={cn(
                                                'px-4 py-3 text-sm text-gray-300',
                                                column.cellClassName
                                            )}
                                        >
                                            {column.render(item, index)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            {mobileCardView && (
                <div className="md:hidden space-y-4" role="list" aria-label={caption}>
                    {!captionHidden && (
                        <h2 className="text-lg font-semibold text-white mb-4">{caption}</h2>
                    )}

                    {loading ? (
                        <div className="p-4 text-center text-gray-400" role="status" aria-live="polite">
                            Loading data...
                        </div>
                    ) : data.length === 0 ? (
                        <div className="p-4 text-center text-gray-400">{emptyMessage}</div>
                    ) : (
                        data.map((item, index) => (
                            <article
                                key={getRowKey(item, index)}
                                className={cn(
                                    'bg-white/5 border border-white/10 rounded-xl p-4 space-y-3',
                                    hasClickHandler && 'cursor-pointer hover:bg-white/10 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand-primary/50'
                                )}
                                onClick={hasClickHandler ? () => onRowClick(item, index) : undefined}
                                tabIndex={hasClickHandler ? 0 : undefined}
                                onKeyDown={
                                    hasClickHandler
                                        ? (e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                onRowClick(item, index);
                                            }
                                        }
                                        : undefined
                                }
                                role="listitem"
                            >
                                {visibleColumns.map((column) => (
                                    <div
                                        key={`${getRowKey(item, index)}-${column.key}-mobile`}
                                        className="flex justify-between items-start gap-2"
                                    >
                                        <span className="text-xs text-gray-500 font-medium">
                                            {column.header}
                                        </span>
                                        <span className="text-sm text-white text-right">
                                            {column.render(item, index)}
                                        </span>
                                    </div>
                                ))}
                            </article>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Simple accessible table for basic use cases
 */
interface SimpleTableProps {
    caption: string;
    captionHidden?: boolean;
    headers: string[];
    rows: (string | ReactNode)[][];
    className?: string;
}

export function SimpleTable({
    caption,
    captionHidden = false,
    headers,
    rows,
    className = '',
}: SimpleTableProps) {
    return (
        <table className={cn('w-full border-collapse', className)} role="table">
            <caption className={cn(captionHidden && 'sr-only', 'text-left text-lg font-semibold text-white mb-4')}>
                {caption}
            </caption>
            <thead>
                <tr className="border-b border-white/10">
                    {headers.map((header, index) => (
                        <th
                            key={index}
                            scope="col"
                            className="text-left px-4 py-3 text-sm font-medium text-gray-400"
                        >
                            {header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-white/5">
                        {row.map((cell, cellIndex) => (
                            <td
                                key={cellIndex}
                                className="px-4 py-3 text-sm text-gray-300"
                            >
                                {cell}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
