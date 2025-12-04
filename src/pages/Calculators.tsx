import { useState } from 'react';
import { Calculator, DollarSign, Percent, Receipt, Coins } from 'lucide-react';
import { cn } from '../lib/utils';

type CalculatorType = 'dca' | 'fees' | 'staking' | 'tax';

export function Calculators() {
  const [activeCalculator, setActiveCalculator] = useState<CalculatorType>('dca');

  const calculators = [
    { id: 'dca' as const, name: 'DCA Calculator', icon: DollarSign, description: 'Calculate dollar-cost averaging returns' },
    { id: 'fees' as const, name: 'Fee Calculator', icon: Receipt, description: 'Compare exchange fees' },
    { id: 'staking' as const, name: 'Staking Calculator', icon: Coins, description: 'Estimate staking rewards' },
    { id: 'tax' as const, name: 'Tax Calculator', icon: Percent, description: 'Estimate capital gains tax' },
  ];

  return (
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
            onClick={() => setActiveCalculator(calc.id)}
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
        {activeCalculator === 'fees' && <FeeCalculatorForm />}
        {activeCalculator === 'staking' && <StakingCalculatorForm />}
        {activeCalculator === 'tax' && <TaxCalculatorForm />}
      </div>
    </div>
  );
}

function DCACalculatorForm() {
  const [formData, setFormData] = useState({
    cryptocurrency: 'bitcoin',
    amount: 100,
    frequency: 'weekly',
    duration: 12,
  });

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dollar-Cost Averaging Calculator</h2>
      <p className="text-gray-400 mb-8">
        See how your investment would have performed using a DCA strategy.
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

          <button className="w-full py-4 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-bold transition-colors">
            Calculate Returns
          </button>
        </div>

        <div className="bg-white/5 rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4">Projected Results</h3>
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b border-white/10">
              <span className="text-gray-400">Total Invested</span>
              <span className="font-bold text-white">$4,800.00</span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/10">
              <span className="text-gray-400">Current Value</span>
              <span className="font-bold text-green-400">$6,240.00</span>
            </div>
            <div className="flex justify-between py-3 border-b border-white/10">
              <span className="text-gray-400">Total Return</span>
              <span className="font-bold text-green-400">+$1,440.00 (30%)</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-gray-400">Average Cost</span>
              <span className="font-bold text-white">$45,200.00</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            * Results are based on historical data and do not guarantee future performance.
          </p>
        </div>
      </div>
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
