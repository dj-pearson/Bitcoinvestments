/**
 * Entry-tier (lowest 30-day volume) advanced-trading fees for US exchanges,
 * used by the fee calculator on /calculators.
 *
 * Kept separate from src/data/exchanges.ts (owned by the compare pages) so this
 * table can carry its own verification date. Checked against the exchanges'
 * published fee schedules and third-party fee comparisons on `lastVerified`.
 * NEEDS-OWNER: re-confirm against each exchange's fee page before relying on it,
 * and consider merging with src/data/exchanges.ts once that file is refreshed.
 */

export interface ExchangeFeeRow {
  id: string;
  name: string;
  product: string;
  /** Percent of trade value. */
  maker: number;
  taker: number;
  tier: string;
  feePageUrl: string;
  note?: string;
}

export const EXCHANGE_FEES_META = {
  lastVerified: '2026-09-23',
  note:
    'Lowest-volume tier on each exchange’s advanced trading screen. Simple "Buy" buttons and card purchases usually cost more through spreads and flat fees.',
} as const;

export const EXCHANGE_FEES: ExchangeFeeRow[] = [
  {
    id: 'kraken-pro',
    name: 'Kraken Pro',
    product: 'Advanced trading',
    maker: 0.25,
    taker: 0.4,
    tier: '$0-$10K 30-day volume',
    feePageUrl: 'https://www.kraken.com/features/fee-schedule',
  },
  {
    id: 'gemini-activetrader',
    name: 'Gemini ActiveTrader',
    product: 'Advanced trading',
    maker: 0.2,
    taker: 0.4,
    tier: 'Lowest volume tier',
    feePageUrl: 'https://www.gemini.com/fees/activetrader-fee-schedule',
  },
  {
    id: 'coinbase-advanced',
    name: 'Coinbase Advanced',
    product: 'Advanced trading',
    maker: 0.6,
    taker: 1.2,
    tier: '$0-$1K 30-day volume (drops to 0.25%/0.40% at $10K-$50K)',
    feePageUrl: 'https://help.coinbase.com/en/coinbase/trading-and-funding/advanced-trade/advanced-trade-fees',
  },
];
