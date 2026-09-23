/**
 * Page-local helpers for /gas-optimizer.
 *
 * Live EVM gas prices come from src/services/gasPrice.ts (owned by the market
 * workstream; consumed here, not edited). This module adds:
 *  - correct USD cost maths per transaction type,
 *  - chain metadata (which chains are rollups that also pay an L1 data fee),
 *  - Bitcoin fee rates via the same-origin /api/btc-fees function,
 *  - a BTC/USD price via the existing /api/coingecko proxy.
 *
 * Nothing here generates numbers: if a source fails, callers get null/throw
 * and the page says the figure is unavailable.
 */

import type { ChainGasInfo } from '../types';

/** Typical gas used by common actions (order-of-magnitude; real usage varies by contract). */
export const TX_TYPES = [
  { id: 'eth_transfer', label: 'Send ETH (native coin)', gas: 21_000 },
  { id: 'erc20_transfer', label: 'Send a token (ERC-20)', gas: 65_000 },
  { id: 'erc20_approve', label: 'Approve a token', gas: 46_000 },
  { id: 'dex_swap', label: 'Swap on a DEX', gas: 150_000 },
  { id: 'nft_mint', label: 'Mint an NFT', gas: 150_000 },
  { id: 'lending_deposit', label: 'Deposit into a lending market', gas: 200_000 },
  { id: 'contract_deploy', label: 'Deploy a contract', gas: 1_500_000 },
] as const;

export type TxTypeId = (typeof TX_TYPES)[number]['id'];

/** Rollups that post data to Ethereum and charge an L1 data fee on top of execution gas. */
const ROLLUP_CHAIN_IDS = new Set([42161, 10, 8453]);

export function isRollup(chainId: number): boolean {
  return ROLLUP_CHAIN_IDS.has(chainId);
}

/** gasPrice.ts returns an all-zero record when a chain could not be reached. */
export function isGasDataAvailable(info: ChainGasInfo | undefined): info is ChainGasInfo {
  return !!info && Number.isFinite(info.gasPrice.average) && info.gasPrice.average > 0;
}

export function hasTokenPrice(info: ChainGasInfo): boolean {
  return typeof info.nativeTokenPrice === 'number' && info.nativeTokenPrice > 0;
}

/**
 * USD cost = gas price (gwei) × gas units × 1e-9 × native token price.
 * Returns null when the price is unknown rather than pretending it is $0.
 */
export function estimateCostUsd(gwei: number, gasUnits: number, nativeTokenPrice?: number): number | null {
  if (!Number.isFinite(gwei) || gwei <= 0) return null;
  if (typeof nativeTokenPrice !== 'number' || nativeTokenPrice <= 0) return null;
  return ((gwei * gasUnits) / 1e9) * nativeTokenPrice;
}

/** Cost in the chain's native coin (always computable when gas data exists). */
export function estimateCostNative(gwei: number, gasUnits: number): number {
  return (gwei * gasUnits) / 1e9;
}

export function formatUsd(value: number | null): string {
  if (value === null) return 'Price unavailable';
  if (value < 0.01) return '< $0.01';
  if (value < 1) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(2)}`;
}

export function formatNative(value: number, symbol: string): string {
  if (value === 0) return `0 ${symbol}`;
  if (value < 0.000001) return `< 0.000001 ${symbol}`;
  return `${value.toPrecision(3)} ${symbol}`;
}

export function formatGwei(gwei: number | undefined): string {
  if (gwei === undefined || !Number.isFinite(gwei)) return 'n/a';
  if (gwei === 0) return '0';
  if (gwei < 0.001) return '< 0.001';
  if (gwei < 1) return gwei.toFixed(3);
  if (gwei < 10) return gwei.toFixed(2);
  return gwei.toFixed(1);
}

// ============================================
// Bitcoin fees
// ============================================

export interface BtcFees {
  asOf: string;
  source: string;
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

/**
 * Typical size of a one-input, two-output native SegWit (P2WPKH) payment:
 * 10.5 vB overhead + 68 vB per input + 31 vB per output ≈ 141 vB.
 */
export const TYPICAL_BTC_TX_VBYTES = 141;

async function fetchJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${url} responded ${res.status}`);
  if (!(res.headers.get('content-type') || '').includes('application/json')) {
    throw new Error(`${url} did not return JSON`);
  }
  return res.json();
}

export async function fetchBtcFees(signal?: AbortSignal): Promise<BtcFees> {
  const json = (await fetchJson('/api/btc-fees', signal)) as Partial<BtcFees>;
  if (typeof json.fastestFee !== 'number' || typeof json.asOf !== 'string') {
    throw new Error('Unexpected Bitcoin fee data');
  }
  return json as BtcFees;
}

/** BTC/USD via the same-origin CoinGecko proxy; null if unavailable. */
export async function fetchBtcPrice(signal?: AbortSignal): Promise<number | null> {
  try {
    const json = (await fetchJson('/api/coingecko/simple/price?ids=bitcoin&vs_currencies=usd', signal)) as {
      bitcoin?: { usd?: number };
    };
    const p = json.bitcoin?.usd;
    return typeof p === 'number' && p > 0 ? p : null;
  } catch {
    return null;
  }
}

export function btcFeeUsd(satPerVb: number, vbytes: number, btcPrice: number | null): number | null {
  if (btcPrice === null) return null;
  return ((satPerVb * vbytes) / 1e8) * btcPrice;
}
