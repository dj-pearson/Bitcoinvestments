/** "+1.23%" / "-0.45%", or "24h n/a" when CoinGecko has no 24h change for the coin. */
export function formatChange(change: number | null | undefined): { text: string; className: string } {
  if (typeof change !== 'number' || !Number.isFinite(change)) {
    return { text: '24h n/a', className: 'text-gray-400' };
  }
  return {
    text: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
    className: change >= 0 ? 'text-green-400' : 'text-red-400',
  };
}
