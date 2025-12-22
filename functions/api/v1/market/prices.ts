/**
 * Developer API: Market Prices
 *
 * GET /api/v1/market/prices
 * Returns real-time prices for specified cryptocurrencies.
 */

interface Env {
  COINGECKO_API_KEY?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // Parse query parameters
  const symbolsParam = url.searchParams.get('symbols') || 'BTC,ETH';
  const currency = (url.searchParams.get('currency') || 'USD').toLowerCase();

  const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

  if (symbols.length === 0) {
    return new Response(
      JSON.stringify({
        error: 'Invalid request',
        message: 'Please provide at least one symbol',
        code: 'INVALID_SYMBOLS'
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  if (symbols.length > 100) {
    return new Response(
      JSON.stringify({
        error: 'Too many symbols',
        message: 'Maximum 100 symbols per request',
        code: 'TOO_MANY_SYMBOLS'
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Map common symbols to CoinGecko IDs
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
      'MATIC': 'matic-network',
      'LINK': 'chainlink',
      'LTC': 'litecoin',
      'UNI': 'uniswap',
      'ATOM': 'cosmos',
    };

    const coinIds = symbols.map(s => symbolToId[s] || s.toLowerCase()).join(',');

    // Fetch from CoinGecko
    const apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=${currency}&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;

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

    const data = await response.json();

    // Transform response to our format
    const prices: Record<string, {
      price: number;
      change24h: number;
      volume24h: number;
      marketCap: number;
    }> = {};

    const idToSymbol = Object.entries(symbolToId).reduce((acc, [symbol, id]) => {
      acc[id] = symbol;
      return acc;
    }, {} as Record<string, string>);

    for (const [coinId, priceData] of Object.entries(data as Record<string, any>)) {
      const symbol = idToSymbol[coinId] || coinId.toUpperCase();
      if (symbols.includes(symbol) || symbols.map(s => s.toLowerCase()).includes(coinId)) {
        prices[symbol] = {
          price: priceData[currency] || 0,
          change24h: priceData[`${currency}_24h_change`] || 0,
          volume24h: priceData[`${currency}_24h_vol`] || 0,
          marketCap: priceData[`${currency}_market_cap`] || 0,
        };
      }
    }

    return new Response(
      JSON.stringify({
        prices,
        currency: currency.toUpperCase(),
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Market prices error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch prices',
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
