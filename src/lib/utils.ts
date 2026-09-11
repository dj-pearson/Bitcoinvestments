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
