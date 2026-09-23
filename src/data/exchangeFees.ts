/**
 * Entry-tier maker/taker fees for the fee calculator on /calculators.
 *
 * Derived from src/data/exchanges.ts - the dated, sourced exchange data the
 * comparison pages use - so the calculator and /compare can never quote two
 * different fee schedules for the same exchange. Update fees there.
 */

import { exchanges, EXCHANGES_LAST_VERIFIED } from './exchanges';

export interface ExchangeFeeRow {
  id: string;
  name: string;
  /** Percent of trade value. */
  maker: number;
  taker: number;
  tier: string;
  feePageUrl: string;
}

export const EXCHANGE_FEES_META = {
  lastVerified: EXCHANGES_LAST_VERIFIED,
  note:
    'Lowest-volume tier on each exchange’s order-book screen. Simple "Buy" buttons and card purchases usually cost more through spreads and flat fees.',
} as const;

export const EXCHANGE_FEES: ExchangeFeeRow[] = exchanges
  // Spread-only brokers (no published maker/taker schedule) don't belong in a
  // maker/taker comparison.
  .filter((e) => e.fees.maker_fee > 0 || e.fees.taker_fee > 0)
  .map((e) => ({
    id: e.id,
    name: e.name,
    maker: +(e.fees.maker_fee * 100).toFixed(3),
    taker: +(e.fees.taker_fee * 100).toFixed(3),
    tier: 'Entry tier, lowest 30-day volume',
    feePageUrl: e.fees_url ?? e.url,
  }));
