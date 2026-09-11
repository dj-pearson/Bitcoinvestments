import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format a cryptocurrency price for display.
 *
 * Precision follows the magnitude. A fixed two or three decimal places is fine
 * for Bitcoin and wrong for most of the market: rendered with the previous
 * `toLocaleString()` defaults, BONK at $0.0000142, SHIB at $0.00000812 and PEPE
 * at $0.00000094 all came out as "$0" on the home page, the hero carousel and
 * the calculators, and as "$0.00" on the charts page. Several of the most
 * frequently viewed coins on a price site displayed no price at all.
 *
 * Below a cent the useful thing is significant figures rather than decimal
 * places, so the leading zeros do not consume the budget.
 */
export function formatCryptoPrice(price: number | null | undefined): string {
    if (price === null || price === undefined || !Number.isFinite(price)) {
        return '—';
    }

    const magnitude = Math.abs(price);

    // Intl rejects significant-digit and fraction-digit options together, so each
    // branch picks one or the other.
    const precision: Intl.NumberFormatOptions =
        magnitude === 0
            ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
            : magnitude >= 1
              ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
              : magnitude >= 0.01
                ? { minimumFractionDigits: 2, maximumFractionDigits: 4 }
                : { minimumSignificantDigits: 2, maximumSignificantDigits: 4 };

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        ...precision,
    }).format(price);
}

/**
 * A calendar date (YYYY-MM-DD) in the viewer's own timezone.
 *
 * `date.toISOString().split('T')[0]` gives the UTC calendar date, which is not
 * the date the user is living in. Everywhere west of UTC it runs ahead for part
 * of every day: for someone in New York adding a holding at 20:30 on 31 December,
 * it yields 2026-01-01 - the wrong day, and the wrong tax year for the
 * transaction that results.
 *
 * Use this wherever the value means "the date on the user's calendar" - a
 * transaction date, a form default, a streak, a filename. Keep toISOString where
 * the value means an instant in time, which is genuinely timezone-independent.
 */
export function toLocalISODate(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Today's calendar date in the viewer's timezone, as YYYY-MM-DD.
 */
export function todayLocalISODate(): string {
    return toLocalISODate(new Date());
}

/**
 * Parse a date-only string (YYYY-MM-DD) as local midnight rather than UTC.
 *
 * `new Date('2025-06-15')` is specified to parse as UTC midnight, so rendering it
 * with toLocaleDateString shows 14 June to every viewer behind UTC. Splitting the
 * parts and using the Date(y, m, d) constructor keeps the date the one that was
 * stored.
 */
export function parseLocalDate(value: string): Date {
    const [datePart] = value.split('T');
    const [year, month, day] = datePart.split('-').map(Number);

    if (!year || !month || !day) {
        return new Date(value);
    }

    return new Date(year, month - 1, day);
}
