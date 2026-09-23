/**
 * GET /api/onchain
 *
 * Bitcoin network metrics from free, keyless public sources, fetched
 * server-side and cached at the edge so every visitor does not hit the
 * upstream APIs. Consumed by /onchain-analytics.
 *
 * Each metric is either { ok: true, data, asOf, source, sourceUrl } or
 * { ok: false, error, source, sourceUrl }. There is no synthetic fallback:
 * a failed source is reported as unavailable.
 */

import {
  cachedJson,
  getBlockchainChart,
  getDifficulty,
  getFees,
  getHashrate,
  getMempool,
  getRecentBlocks,
} from '../../lib/onchainSources';

const CACHE_TTL_SECONDS = 120;

export async function onRequestGet(context: {
  request: Request;
  waitUntil?: (p: Promise<unknown>) => void;
}): Promise<Response> {
  return cachedJson(context, CACHE_TTL_SECONDS, async () => {
    const [hashrate, fees, mempool, blocks, transactions, addresses] = await Promise.all([
      getHashrate(),
      getFees(),
      getMempool(),
      getRecentBlocks(),
      getBlockchainChart('n-transactions'),
      getBlockchainChart('n-unique-addresses'),
    ]);
    const difficulty = await getDifficulty(blocks);

    const metrics = { hashrate, difficulty, fees, mempool, blocks, transactions, addresses };
    const partial = Object.values(metrics).some((m) => !m.ok);
    return {
      payload: { generatedAt: new Date().toISOString(), metrics },
      partial,
    };
  });
}
