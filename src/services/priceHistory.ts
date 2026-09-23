/**
 * Live top-up for the bundled weekly price history.
 *
 * Call only from effects/event handlers (it hits the network). On any failure it
 * resolves to the static series plus an error message, so callers always have a
 * usable baseline and can say honestly that live data was unavailable.
 */

import { getHistoricalData } from './coingecko';
import {
  getStaticSeries,
  mergeLivePrices,
  type PriceHistoryAssetId,
  type PriceSeries,
} from '../data/priceHistory';

const memo = new Map<PriceHistoryAssetId, Promise<PriceSeries>>();

export interface LoadedSeries {
  series: PriceSeries;
  /** Set when the live request failed; the static baseline is returned instead. */
  liveError: string | null;
}

export async function loadPriceSeries(asset: PriceHistoryAssetId): Promise<LoadedSeries> {
  const base = getStaticSeries(asset);
  try {
    let pending = memo.get(asset);
    if (!pending) {
      pending = getHistoricalData(asset, 365).then((data) => mergeLivePrices(base, data.prices ?? []));
      memo.set(asset, pending);
      // Do not cache failures - let a later visit retry.
      pending.catch(() => memo.delete(asset));
    }
    const series = await pending;
    return {
      series,
      liveError: series.live ? null : 'Live prices returned no data.',
    };
  } catch {
    return {
      series: base,
      liveError: 'Live prices could not be loaded, so results use the bundled weekly history.',
    };
  }
}
