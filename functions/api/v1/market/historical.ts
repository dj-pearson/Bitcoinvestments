/**
 * Developer API: Historical Market Data
 *
 * GET /api/v1/market/historical
 * Returns historical price data for a cryptocurrency.
 * Requires: Professional tier or higher
 */

interface Env {
  COINGECKO_API_KEY?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Check tier (attached by middleware)
  const apiKey = (context as any).apiKey;
  if (apiKey && !['professional', 'enterprise'].includes(apiKey.tier)) {
    return new Response(
      JSON.stringify({
        error: 'Insufficient tier',
        message: 'Historical data requires Professional tier or higher',
        code: 'TIER_REQUIRED',
        requiredTier: 'professional'
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const url = new URL(request.url);

  // Parse query parameters
  const symbol = (url.searchParams.get('symbol') || 'BTC').toUpperCase();
  const currency = (url.searchParams.get('currency') || 'USD').toLowerCase();
  const days = parseInt(url.searchParams.get('days') || '30', 10);
  const interval = url.searchParams.get('interval') || 'daily';

  // Validate days based on tier
  const maxDays = apiKey?.tier === 'enterprise' ? 365 * 10 : 365;
  if (days > maxDays) {
    return new Response(
      JSON.stringify({
        error: 'Invalid parameter',
        message: `Maximum ${maxDays} days for your tier`,
        code: 'INVALID_DAYS'
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Map symbol to CoinGecko ID
    const symbolToId: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDT': 'tether',
      'BNB': 'binancecoin',
      'XRP': 'ripple',
      'SOL': 'solana',
      'ADA': 'cardano',
      'DOGE': 'dogecoin',
      'AVAX': 'avalanche-2',
      'DOT': 'polkadot',
    };

    const coinId = symbolToId[symbol] || symbol.toLowerCase();

    // Fetch from CoinGecko
    const apiUrl = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}&interval=${interval}`;

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (env.COINGECKO_API_KEY) {
      headers['x-cg-demo-api-key'] = env.COINGECKO_API_KEY;
    }

    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const rawData = await response.json() as {
      prices: [number, number][];
      market_caps: [number, number][];
      total_volumes: [number, number][];
    };

    // Transform to OHLCV format (simplified - using close prices)
    const data = rawData.prices.map((price, index) => ({
      timestamp: new Date(price[0]).toISOString(),
      open: price[1],
      high: price[1] * 1.001, // Approximation
      low: price[1] * 0.999, // Approximation
      close: price[1],
      volume: rawData.total_volumes[index]?.[1] || 0,
      marketCap: rawData.market_caps[index]?.[1] || 0,
    }));

    return new Response(
      JSON.stringify({
        symbol,
        currency: currency.toUpperCase(),
        interval,
        data,
        dataPoints: data.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Historical data error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch historical data',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'FETCH_ERROR'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
