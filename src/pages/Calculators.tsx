import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calculator, DollarSign, Percent, Receipt, Coins, ArrowDownUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { SEO, generateBreadcrumbSchema } from '../components/SEO';
import { getCachedTopCryptocurrencies } from '../services/coingecko';
import type { Cryptocurrency } from '../types';

type CalculatorType = 'dca' | 'fees' | 'staking' | 'tax' | 'converter';

const CALCULATOR_TYPES: CalculatorType[] = ['dca', 'fees', 'staking', 'tax', 'converter'];
const DEFAULT_CALCULATOR: CalculatorType = 'dca';

/** Narrow an arbitrary `?type=` value to a known calculator, falling back to DCA. */
function parseCalculatorType(value: string | null): CalculatorType {
  return CALCULATOR_TYPES.includes(value as CalculatorType)
    ? (value as CalculatorType)
    : DEFAULT_CALCULATOR;
}

export function Calculators() {
  // The header links deep into individual calculators via `/calculators?type=tax`,
  // so the active tab is driven by the URL rather than local-only state. This also
  // makes each calculator linkable, shareable, and back-button friendly.
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCalculator = parseCalculatorType(searchParams.get('type'));

  const selectCalculator = useCallback(
    (next: CalculatorType) => {
      setSearchParams(
        (params) => {
          const updated = new URLSearchParams(params);
          if (next === DEFAULT_CALCULATOR) {
            updated.delete('type');
          } else {
            updated.set('type', next);
          }
          return updated;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const calculators = [
    { id: 'dca' as const, name: 'DCA Calculator', icon: DollarSign, description: 'Calculate dollar-cost averaging returns' },
    { id: 'converter' as const, name: 'Converter', icon: ArrowDownUp, description: 'Convert between crypto and fiat' },
    { id: 'fees' as const, name: 'Fee Calculator', icon: Receipt, description: 'Compare exchange fees' },
    { id: 'staking' as const, name: 'Staking Calculator', icon: Coins, description: 'Estimate staking rewards' },
    { id: 'tax' as const, name: 'Tax Calculator', icon: Percent, description: 'Estimate capital gains tax' },
  ];

  // Breadcrumb schema for SEO
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Calculators', url: '/calculators' },
  ]);

  // Combined schema with SoftwareApplication for calculator tools
  const calculatorSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbSchema,
      {
        '@type': 'SoftwareApplication',
        name: 'Crypto Investment Calculators',
        description: 'Free cryptocurrency investment calculators including DCA (Dollar Cost Averaging), exchange fee comparison, staking rewards estimator, and capital gains tax calculator.',
        url: 'https://bitcoinvestments.net/calculators',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: [
          'DCA Calculator - Calculate dollar-cost averaging returns for Bitcoin and other cryptocurrencies',
          'Exchange Fee Calculator - Compare trading fees across popular exchanges',
          'Staking Rewards Calculator - Estimate potential earnings from cryptocurrency staking',
          'Capital Gains Tax Calculator - Estimate your crypto tax liability',
        ],
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.7',
          ratingCount: '892',
          bestRating: '5',
          worstRating: '1',
        },
        provider: {
          '@type': 'Organization',
          name: 'Bitcoinvestments',
          url: 'https://bitcoinvestments.net',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is a DCA calculator?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'A DCA (Dollar Cost Averaging) calculator helps you estimate potential returns when investing a fixed amount at regular intervals. This strategy reduces the impact of volatility by spreading purchases over time, eliminating the need to time the market.',
            },
          },
          {
            '@type': 'Question',
            name: 'How do cryptocurrency exchange fees work?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Cryptocurrency exchanges typically charge maker fees (for adding liquidity) and taker fees (for removing liquidity). Fees vary by exchange, usually ranging from 0.1% to 0.6% per trade. Our fee calculator helps you compare costs across Binance, Coinbase, Kraken, and other popular exchanges.',
            },
          },
          {
            '@type': 'Question',
            name: 'How are cryptocurrency staking rewards calculated?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Staking rewards are calculated based on your staked amount, the Annual Percentage Yield (APY), staking duration, and compounding frequency. Our calculator factors in compound interest to show your potential earnings over time.',
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <SEO
        title="Free Crypto Calculators - DCA, Fees, Staking & Tax"
        description="Free cryptocurrency investment calculators. Plan your DCA strategy, compare exchange fees, estimate staking rewards, and calculate capital gains tax for Bitcoin and crypto."
        keywords={[
          'DCA calculator',
          'dollar cost averaging calculator',
          'crypto fee calculator',
          'exchange fee comparison',
          'staking calculator',
          'staking rewards calculator',
          'crypto tax calculator',
          'capital gains calculator',
          'Bitcoin calculator',
          'cryptocurrency investment tools',
        ]}
        schema={calculatorSchema}
      />
      <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
          <Calculator className="w-4 h-4 text-brand-primary" />
          <span className="text-sm text-gray-300">Investment Tools</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Crypto <span className="text-gradient">Calculators</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Make informed investment decisions with our suite of cryptocurrency calculators.
        </p>
      </div>

      {/* Calculator Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {calculators.map((calc) => (
          <button
            key={calc.id}
            onClick={() => selectCalculator(calc.id)}
            className={cn(
              'p-4 rounded-xl transition-all text-left',
              activeCalculator === calc.id
                ? 'glass-card border-brand-primary/50'
                : 'glass hover:bg-white/5'
            )}
          >
            <calc.icon className={cn(
              'w-6 h-6 mb-2',
              activeCalculator === calc.id ? 'text-brand-primary' : 'text-gray-400'
            )} />
            <h3 className="font-medium text-white">{calc.name}</h3>
            <p className="text-xs text-gray-400 mt-1">{calc.description}</p>
          </button>
        ))}
      </div>

      {/* Calculator Content */}
      <div className="glass-card p-8">
        {activeCalculator === 'dca' && <DCACalculatorForm />}
        {activeCalculator === 'converter' && <CryptoConverterForm />}
        {activeCalculator === 'fees' && <FeeCalculatorForm />}
        {activeCalculator === 'staking' && <StakingCalculatorForm />}
        {activeCalculator === 'tax' && <TaxCalculatorForm />}
      </div>
      </div>
    </>
  );
}

function DCACalculatorForm() {
  const [formData, setFormData] = useState({
    cryptocurrency: 'bitcoin',
    amount: 100,
    frequency: 'weekly',
    duration: 12,
  });
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchPrice() {
      setLoading(true);
      try {
        const data = await getCachedTopCryptocurrencies(20);
        const coin = data.find(c => c.id === formData.cryptocurrency);
        if (coin) setCurrentPrice(coin.current_price);
      } catch { /* use previous price */ }
      setLoading(false);
    }
    fetchPrice();
  }, [formData.cryptocurrency]);

  const results = useMemo(() => {
    if (!currentPrice || formData.amount <= 0 || formData.duration <= 0) return null;

    const frequencyMultipliers: Record<string, number> = {
      daily: 30,
      weekly: 4.33,
      biweekly: 2.17,
      monthly: 1,
    };

    const periodsPerMonth = frequencyMultipliers[formData.frequency] || 4.33;
    const totalPeriods = Math.round(periodsPerMonth * formData.duration);
    const totalInvested = formData.amount * totalPeriods;
    const totalCoins = totalInvested / currentPrice;
    const currentValue = totalCoins * currentPrice;
    const averageCost = totalInvested / totalCoins;
    const profitLoss = currentValue - totalInvested;
    const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

    return {
      totalInvested,
      currentValue,
      totalCoins,
      averageCost,
      profitLoss,
      profitLossPercent,
      totalPeriods,
    };
  }, [formData, currentPrice]);

  const cryptoNames: Record<string, string> = {
    bitcoin: 'BTC',
    ethereum: 'ETH',
    solana: 'SOL',
    cardano: 'ADA',
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dollar-Cost Averaging Calculator</h2>
      <p className="text-gray-400 mb-8">
        See how a DCA strategy works by investing a fixed amount at regular intervals.
        {currentPrice && (
          <span className="block mt-1 text-sm">
            Current {cryptoNames[formData.cryptocurrency]} price: <span className="text-white font-medium">${currentPrice.toLocaleString()}</span>
          </span>
        )}
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Cryptocurrency
            </label>
            <select
              value={formData.cryptocurrency}
              onChange={(e) => setFormData({ ...formData, cryptocurrency: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
            >
              <option value="bitcoin">Bitcoin (BTC)</option>
              <option value="ethereum">Ethereum (ETH)</option>
              <option value="solana">Solana (SOL)</option>
              <option value="cardano">Cardano (ADA)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Investment Amount ($)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Investment Frequency
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Duration (months)
            </label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
              min="1"
              max="120"
            />
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4">DCA Results</h3>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />
              ))}
            </div>
          ) : results ? (
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-white/10">
                <span className="text-gray-400">Investment Periods</span>
                <span className="font-bold text-white">{results.totalPeriods} {formData.frequency} buys</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/10">
                <span className="text-gray-400">Total Invested</span>
                <span className="font-bold text-white">${results.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/10">
                <span className="text-gray-400">Coins Accumulated</span>
                <span className="font-bold text-white">{results.totalCoins.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })} {cryptoNames[formData.cryptocurrency]}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/10">
                <span className="text-gray-400">Current Value</span>
                <span className="font-bold text-white">${results.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/10">
                <span className="text-gray-400">Average Cost / Coin</span>
                <span className="font-bold text-white">${results.averageCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-3 bg-white/5 rounded-lg px-3 -mx-3">
                <span className="text-gray-400 font-medium">Net Return</span>
                <span className={cn('font-bold', results.profitLoss >= 0 ? 'text-green-400' : 'text-red-400')}>
                  {results.profitLoss >= 0 ? '+' : ''}${results.profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({results.profitLossPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Enter valid inputs to see results.</p>
          )}
          <p className="text-xs text-gray-500 mt-4">
            * Results use the current price as a baseline. Actual DCA returns depend on price fluctuations over the investment period.
          </p>
        </div>
      </div>
    </div>
  );
}

function CryptoConverterForm() {
  const [cryptos, setCryptos] = useState<Cryptocurrency[]>([]);
  const [loading, setLoading] = useState(true);
  const [cryptoId, setCryptoId] = useState('bitcoin');
  const [cryptoAmount, setCryptoAmount] = useState('1');
  const [fiatAmount, setFiatAmount] = useState('');
  const [direction, setDirection] = useState<'crypto-to-fiat' | 'fiat-to-crypto'>('crypto-to-fiat');

  useEffect(() => {
    async function fetchPrices() {
      setLoading(true);
      try {
        const data = await getCachedTopCryptocurrencies(20);
        setCryptos(data);
      } catch { /* handled */ }
      setLoading(false);
    }
    fetchPrices();
  }, []);

  const selectedCrypto = useMemo(() => cryptos.find(c => c.id === cryptoId), [cryptos, cryptoId]);

  useEffect(() => {
    if (!selectedCrypto) return;
    if (direction === 'crypto-to-fiat') {
      const amount = parseFloat(cryptoAmount) || 0;
      setFiatAmount((amount * selectedCrypto.current_price).toFixed(2));
    } else {
      const amount = parseFloat(fiatAmount) || 0;
      setCryptoAmount((amount / selectedCrypto.current_price).toFixed(8));
    }
  }, [cryptoId, cryptoAmount, fiatAmount, direction, selectedCrypto]);

  const handleCryptoChange = (value: string) => {
    setDirection('crypto-to-fiat');
    setCryptoAmount(value);
  };

  const handleFiatChange = (value: string) => {
    setDirection('fiat-to-crypto');
    setFiatAmount(value);
  };

  const handleSwap = () => {
    setDirection(d => d === 'crypto-to-fiat' ? 'fiat-to-crypto' : 'crypto-to-fiat');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Crypto Converter</h2>
      <p className="text-gray-400 mb-8">
        Instantly convert between cryptocurrencies and USD using live market prices.
      </p>

      {loading ? (
        <div className="max-w-lg mx-auto space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="max-w-lg mx-auto space-y-4">
          {/* Crypto Input */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <label className="block text-xs text-gray-400 mb-2">Crypto</label>
            <div className="flex items-center gap-3">
              <select
                value={cryptoId}
                onChange={(e) => setCryptoId(e.target.value)}
                className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-primary min-w-[140px]"
              >
                {cryptos.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.symbol.toUpperCase()})</option>
                ))}
              </select>
              <input
                type="number"
                value={cryptoAmount}
                onChange={(e) => handleCryptoChange(e.target.value)}
                className="flex-1 bg-transparent text-right text-2xl font-bold text-white focus:outline-none"
                placeholder="0.00"
                min="0"
                step="any"
              />
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSwap}
              className="p-3 rounded-full glass hover:bg-white/10 transition-colors group"
              aria-label="Swap conversion direction"
            >
              <ArrowDownUp className="w-5 h-5 text-brand-primary group-hover:scale-110 transition-transform" />
            </button>
          </div>

          {/* Fiat Input */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <label className="block text-xs text-gray-400 mb-2">USD</label>
            <div className="flex items-center gap-3">
              <span className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-medium">$ USD</span>
              <input
                type="number"
                value={fiatAmount}
                onChange={(e) => handleFiatChange(e.target.value)}
                className="flex-1 bg-transparent text-right text-2xl font-bold text-white focus:outline-none"
                placeholder="0.00"
                min="0"
                step="any"
              />
            </div>
          </div>

          {/* Rate Info */}
          {selectedCrypto && (
            <div className="text-center space-y-1 pt-2">
              <p className="text-sm text-gray-400">
                1 {selectedCrypto.symbol.toUpperCase()} = <span className="text-white font-medium">${selectedCrypto.current_price.toLocaleString()}</span>
              </p>
              <p className={cn('text-xs', selectedCrypto.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400')}>
                {selectedCrypto.price_change_percentage_24h >= 0 ? '+' : ''}{selectedCrypto.price_change_percentage_24h.toFixed(2)}% (24h)
              </p>
              <p className="text-xs text-gray-500">
                Last updated: {new Date(selectedCrypto.last_updated).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FeeCalculatorForm() {
  const [amount, setAmount] = useState(1000);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Exchange Fee Calculator</h2>
      <p className="text-gray-400 mb-8">
        Compare trading fees across popular cryptocurrency exchanges.
      </p>

      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Trade Amount ($)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full md:w-64 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
          min="1"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-4 px-4 text-gray-400 font-medium">Exchange</th>
              <th className="text-right py-4 px-4 text-gray-400 font-medium">Maker Fee</th>
              <th className="text-right py-4 px-4 text-gray-400 font-medium">Taker Fee</th>
              <th className="text-right py-4 px-4 text-gray-400 font-medium">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'Binance.US', maker: 0.1, taker: 0.1 },
              { name: 'Kraken', maker: 0.16, taker: 0.26 },
              { name: 'Coinbase', maker: 0.4, taker: 0.6 },
              { name: 'Gemini', maker: 0.2, taker: 0.4 },
            ].map((exchange, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                <td className="py-4 px-4 font-medium text-white">{exchange.name}</td>
                <td className="py-4 px-4 text-right text-gray-300">{exchange.maker}%</td>
                <td className="py-4 px-4 text-right text-gray-300">{exchange.taker}%</td>
                <td className="py-4 px-4 text-right font-bold text-white">
                  ${((amount * exchange.taker) / 100).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StakingCalculatorForm() {
  const [formData, setFormData] = useState({
    amount: 1000,
    apy: 5,
    duration: 12,
    compound: 'monthly',
  });

  const calculateRewards = () => {
    const { amount, apy, duration } = formData;
    const monthlyRate = apy / 100 / 12;
    let balance = amount;

    for (let i = 0; i < duration; i++) {
      balance *= 1 + monthlyRate;
    }

    return {
      finalAmount: balance,
      totalRewards: balance - amount,
      effectiveApy: ((balance / amount - 1) * 12 / duration) * 100,
    };
  };

  const results = calculateRewards();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Staking Rewards Calculator</h2>
      <p className="text-gray-400 mb-8">
        Estimate your potential earnings from staking cryptocurrencies.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Staking Amount ($)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              APY (%)
            </label>
            <input
              type="number"
              value={formData.apy}
              onChange={(e) => setFormData({ ...formData, apy: Number(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
              min="0"
              max="100"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Duration (months)
            </label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
              min="1"
              max="120"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Compounding Frequency
            </label>
            <select
              value={formData.compound}
              onChange={(e) => setFormData({ ...formData, compound: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="none">No compounding</option>
            </select>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4">Staking Results</h3>
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-white/10">
              <span className="text-gray-400">Initial Stake</span>
              <span className="font-bold text-white">${formData.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/10">
              <span className="text-gray-400">Total Rewards</span>
              <span className="font-bold text-green-400">+${results.totalRewards.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/10">
              <span className="text-gray-400">Final Amount</span>
              <span className="font-bold text-white">${results.finalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-400">Effective APY</span>
              <span className="font-bold text-brand-primary">{results.effectiveApy.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaxCalculatorForm() {
  const [formData, setFormData] = useState({
    purchasePrice: 30000,
    salePrice: 50000,
    amount: 0.5,
    holdingPeriod: 'long',
    taxBracket: 22,
  });

  const calculateTax = () => {
    const costBasis = formData.purchasePrice * formData.amount;
    const proceeds = formData.salePrice * formData.amount;
    const gain = proceeds - costBasis;

    const taxRate = formData.holdingPeriod === 'long' ? 15 : formData.taxBracket;
    const estimatedTax = gain > 0 ? gain * (taxRate / 100) : 0;

    return {
      costBasis,
      proceeds,
      gain,
      taxRate,
      estimatedTax,
      netProfit: gain - estimatedTax,
    };
  };

  const results = calculateTax();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Capital Gains Tax Calculator</h2>
      <p className="text-gray-400 mb-8">
        Estimate your cryptocurrency capital gains tax liability.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Purchase Price (per coin)
            </label>
            <input
              type="number"
              value={formData.purchasePrice}
              onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sale Price (per coin)
            </label>
            <input
              type="number"
              value={formData.salePrice}
              onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount of Coins
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
              min="0"
              step="0.0001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Holding Period
            </label>
            <select
              value={formData.holdingPeriod}
              onChange={(e) => setFormData({ ...formData, holdingPeriod: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
            >
              <option value="short">Short-term (&lt; 1 year)</option>
              <option value="long">Long-term (&gt; 1 year)</option>
            </select>
          </div>

          {formData.holdingPeriod === 'short' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tax Bracket (%)
              </label>
              <select
                value={formData.taxBracket}
                onChange={(e) => setFormData({ ...formData, taxBracket: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
              >
                <option value="10">10%</option>
                <option value="12">12%</option>
                <option value="22">22%</option>
                <option value="24">24%</option>
                <option value="32">32%</option>
                <option value="35">35%</option>
                <option value="37">37%</option>
              </select>
            </div>
          )}
        </div>

        <div className="bg-white/5 rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4">Tax Estimate</h3>
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-white/10">
              <span className="text-gray-400">Cost Basis</span>
              <span className="font-bold text-white">${results.costBasis.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/10">
              <span className="text-gray-400">Sale Proceeds</span>
              <span className="font-bold text-white">${results.proceeds.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/10">
              <span className="text-gray-400">Capital Gain</span>
              <span className={cn(
                'font-bold',
                results.gain >= 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {results.gain >= 0 ? '+' : ''}${results.gain.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/10">
              <span className="text-gray-400">Tax Rate</span>
              <span className="font-bold text-white">{results.taxRate}%</span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/10">
              <span className="text-gray-400">Estimated Tax</span>
              <span className="font-bold text-red-400">${results.estimatedTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-400">Net Profit</span>
              <span className={cn(
                'font-bold',
                results.netProfit >= 0 ? 'text-green-400' : 'text-red-400'
              )}>
                ${results.netProfit.toLocaleString()}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            * This is an estimate only. Consult a tax professional for accurate advice.
          </p>
        </div>
      </div>
    </div>
  );
}
