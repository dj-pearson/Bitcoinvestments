/**
 * AccessibleChart Wrapper Component
 *
 * Provides accessibility features for chart components including:
 * - Screen reader descriptions
 * - Data table alternatives
 * - Keyboard navigation
 *
 * WCAG 2.1 Success Criteria:
 * - 1.1.1 Non-text Content (Level A)
 * - 1.3.1 Info and Relationships (Level A)
 * - 4.1.2 Name, Role, Value (Level A)
 */

import { useState, type ReactNode } from 'react';
import { Table, ChartLine } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DataPoint {
    label: string;
    value: number;
    formattedValue?: string;
}

interface AccessibleChartProps {
    /** The chart component to render */
    children: ReactNode;
    /** Title of the chart for screen readers */
    title: string;
    /** Description of what the chart shows */
    description: string;
    /** Data points for the accessible data table */
    dataPoints?: DataPoint[];
    /** Additional summary information */
    summary?: string;
    /** Whether to show the data table toggle */
    showTableToggle?: boolean;
    /** Format function for values */
    formatValue?: (value: number) => string;
    /** Additional class name */
    className?: string;
}

/**
 * Default currency formatter
 */
const defaultFormatValue = (value: number): string => {
    return `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: value < 1 ? 6 : 2,
    })}`;
};

export function AccessibleChart({
    children,
    title,
    description,
    dataPoints = [],
    summary,
    showTableToggle = true,
    formatValue = defaultFormatValue,
    className = '',
}: AccessibleChartProps) {
    const [showTable, setShowTable] = useState(false);

    return (
        <figure
            className={cn('relative', className)}
            role="figure"
            aria-label={title}
        >
            {/* Screen reader description */}
            <figcaption className="sr-only">
                <h3>{title}</h3>
                <p>{description}</p>
                {summary && <p>{summary}</p>}
            </figcaption>

            {/* Toggle button for data table */}
            {showTableToggle && dataPoints.length > 0 && (
                <div className="absolute top-2 right-2 z-10">
                    <button
                        onClick={() => setShowTable(!showTable)}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                            showTable
                                ? 'bg-brand-primary text-white'
                                : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
                        )}
                        aria-pressed={showTable}
                        aria-label={showTable ? 'Show chart view' : 'Show data table view'}
                    >
                        {showTable ? (
                            <>
                                <ChartLine className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Chart</span>
                            </>
                        ) : (
                            <>
                                <Table className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Table</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Chart or Data Table */}
            {showTable && dataPoints.length > 0 ? (
                <div
                    className="bg-gray-900/50 rounded-xl border border-gray-800 p-4"
                    role="region"
                    aria-label={`Data table for ${title}`}
                >
                    <h4 className="text-lg font-bold text-white mb-4">{title}</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse" role="table">
                            <caption className="sr-only">{description}</caption>
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th
                                        scope="col"
                                        className="text-left px-4 py-3 text-sm font-medium text-gray-400"
                                    >
                                        Date/Time
                                    </th>
                                    <th
                                        scope="col"
                                        className="text-right px-4 py-3 text-sm font-medium text-gray-400"
                                    >
                                        Value
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {dataPoints.map((point, index) => (
                                    <tr key={index} className="hover:bg-white/5">
                                        <td className="px-4 py-2 text-sm text-gray-300">
                                            {point.label}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-white text-right font-mono">
                                            {point.formattedValue || formatValue(point.value)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {summary && (
                        <p className="mt-4 text-sm text-gray-400">{summary}</p>
                    )}
                </div>
            ) : (
                <div aria-hidden="false">
                    {children}
                </div>
            )}

            {/* Hidden data table for screen readers (always available) */}
            {!showTable && dataPoints.length > 0 && (
                <div className="sr-only" role="table" aria-label={`${title} data`}>
                    <div role="rowgroup">
                        <div role="row">
                            <span role="columnheader">Date/Time</span>
                            <span role="columnheader">Value</span>
                        </div>
                    </div>
                    <div role="rowgroup">
                        {dataPoints.slice(0, 10).map((point, index) => (
                            <div key={index} role="row">
                                <span role="cell">{point.label}</span>
                                <span role="cell">{point.formattedValue || formatValue(point.value)}</span>
                            </div>
                        ))}
                        {dataPoints.length > 10 && (
                            <div role="row">
                                <span role="cell" colSpan={2}>
                                    ...and {dataPoints.length - 10} more data points
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </figure>
    );
}

/**
 * Hook to generate accessible chart data from raw data
 */
export function useAccessibleChartData(
    labels: string[],
    values: number[],
    formatValue?: (value: number) => string
): DataPoint[] {
    return labels.map((label, index) => ({
        label,
        value: values[index],
        formattedValue: formatValue ? formatValue(values[index]) : undefined,
    }));
}

/**
 * Generate chart summary for screen readers
 */
export function generateChartSummary(
    values: number[],
    formatValue: (value: number) => string = defaultFormatValue
): string {
    if (values.length === 0) return 'No data available';

    const min = Math.min(...values);
    const max = Math.max(...values);
    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;
    const trend = change >= 0 ? 'increased' : 'decreased';

    return `The chart shows ${values.length} data points. The value ${trend} by ${Math.abs(change).toFixed(2)}% from ${formatValue(first)} to ${formatValue(last)}. The minimum value was ${formatValue(min)} and the maximum was ${formatValue(max)}.`;
}
