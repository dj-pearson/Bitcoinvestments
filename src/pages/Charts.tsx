import { useState, useEffect } from 'react';
import { PriceChart, ComparisonChart } from '../components/charts';
import { searchCryptocurrencies, getTopCryptocurrencies } from '../services/coingecko';
import { Search, Plus, TrendingUp } from 'lucide-react';

export function Charts() {
  const [selectedCrypto, setSelectedCrypto] = useState({
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
  });

  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparedCryptos, setComparedCryptos] = useState<{
    id: string;
    name: string;
    symbol: string;
    color?: string;
  }[]>([
    { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', color: '#f97316' },
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#3b82f6' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    id: string;
    name: string;
    symbol: string;
    thumb: string;
  }[]>([]);
  const [, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [popularCryptos, setPopularCryptos] = useState<{
    id: string;
    name: string;
    symbol: string;
    current_price: number;
    price_change_percentage_24h: number;
    image: string;
  }[]>([]);

  useEffect(() => {
    loadPopularCryptos();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        performSearch();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchQuery]);

  async function loadPopularCryptos() {
    try {
      const cryptos = await getTopCryptocurrencies(10);
      setPopularCryptos(cryptos);
    } catch (error) {
      console.error('Error loading popular cryptos:', error);
    }
  }

  async function performSearch() {
    if (!searchQuery) return;
    
    setSearching(true);
    try {
      const results = await searchCryptocurrencies(searchQuery);
      setSearchResults(results.slice(0, 8));
      setShowResults(true);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setSearching(false);
    }
  }

  function selectCrypto(crypto: { id: string; name: string; symbol: string }) {
    if (comparisonMode) {
      // Add to comparison if not already there
      if (!comparedCryptos.find(c => c.id === crypto.id)) {
        const colors = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#14b8a6'];
        setComparedCryptos([
          ...comparedCryptos,
          {
            ...crypto,
            color: colors[comparedCryptos.length % colors.length],
          },
        ]);
      }
    } else {
      setSelectedCrypto(crypto);
    }
    setSearchQuery('');
    setShowResults(false);
  }

  function removeCrypto(id: string) {
    setComparedCryptos(comparedCryptos.filter(c => c.id !== id));
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Price Charts</h1>
        <p className="text-gray-400">
          Interactive price charts and comparison tools for cryptocurrency analysis
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setComparisonMode(false)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            !comparisonMode
              ? 'bg-orange-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Single Chart
        </button>
        <button
          onClick={() => setComparisonMode(true)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            comparisonMode
              ? 'bg-orange-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Comparison Mode
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search cryptocurrencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
          />
          {comparisonMode && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              <Plus className="w-4 h-4 inline mr-1" />
              Add to comparison
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-10 overflow-hidden">
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => selectCrypto({
                  id: result.id,
                  name: result.name,
                  symbol: result.symbol.toUpperCase(),
                })}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700/50 transition-colors"
              >
                <img src={result.thumb} alt={result.name} className="w-6 h-6 rounded-full" />
                <div className="text-left">
                  <p className="font-medium text-white">{result.name}</p>
                  <p className="text-xs text-gray-400 uppercase">{result.symbol}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {comparisonMode ? (
            <ComparisonChart
              cryptocurrencies={comparedCryptos}
              days={30}
              height={450}
              onRemoveCrypto={removeCrypto}
            />
          ) : (
            <PriceChart
              cryptocurrencyId={selectedCrypto.id}
              cryptocurrencyName={`${selectedCrypto.name} (${selectedCrypto.symbol})`}
              days={30}
              height={450}
              showVolume={true}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Popular Cryptocurrencies */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-bold text-white">Popular</h3>
            </div>
            <div className="space-y-2">
              {popularCryptos.map((crypto) => (
                <button
                  key={crypto.id}
                  onClick={() => selectCrypto({
                    id: crypto.id,
                    name: crypto.name,
                    symbol: crypto.symbol.toUpperCase(),
                  })}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    selectedCrypto.id === crypto.id && !comparisonMode
                      ? 'bg-orange-500/20 border border-orange-500'
                      : 'bg-gray-800/50 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img src={crypto.image} alt={crypto.name} className="w-8 h-8 rounded-full" />
                    <div className="text-left">
                      <p className="font-medium text-white text-sm">{crypto.name}</p>
                      <p className="text-xs text-gray-400 uppercase">{crypto.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white text-sm">
                      ${crypto.current_price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                    <p className={`text-xs ${
                      crypto.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {crypto.price_change_percentage_24h >= 0 ? '+' : ''}
                      {crypto.price_change_percentage_24h.toFixed(2)}%
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chart Tips */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Chart Tips</h3>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex gap-2">
                <span className="text-orange-500">•</span>
                <p>Hover over the chart to see detailed price data</p>
              </div>
              <div className="flex gap-2">
                <span className="text-orange-500">•</span>
                <p>Use time period buttons to zoom in/out</p>
              </div>
              <div className="flex gap-2">
                <span className="text-orange-500">•</span>
                <p>Comparison mode normalizes prices for easy comparison</p>
              </div>
              <div className="flex gap-2">
                <span className="text-orange-500">•</span>
                <p>Add up to 8 cryptocurrencies to compare</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


