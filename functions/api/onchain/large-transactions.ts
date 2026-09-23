/**
 * GET /api/onchain/large-transactions
 *
 * The largest Bitcoin transactions, by total output value, in the three most
 * recent blocks, read from mempool.space block summaries. Consumed by
 * /whale-tracking.
 *
 * "Output value" is the sum of every output, which includes change sent back
 * to the sender. It is an upper bound on what moved between owners, not a
 * measure of it, and the page says so.
 */

import { cachedJson, getLargestRecentTransactions } from '../../lib/onchainSources';

const CACHE_TTL_SECONDS = 300;

export async function onRequestGet(context: {
  request: Request;
  waitUntil?: (p: Promise<unknown>) => void;
}): Promise<Response> {
  return cachedJson(context, CACHE_TTL_SECONDS, async () => {
    const result = await getLargestRecentTransactions(3, 15);
    return {
      payload: { generatedAt: new Date().toISOString(), result },
      partial: !result.ok,
    };
  });
}
