/**
 * Staking Rewards Calculator (/staking-calculator).
 *
 * Static-first: everything renders from src/data/staking.ts (dated typical ranges,
 * no fake live rates). A live CoinGecko price is fetched after mount only to show
 * token/dollar conversions; the calculator works without it. Inputs are kept in
 * the URL for sharing.
 */

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Coins, ExternalLink, Info } from 'lucide-react';
import { PageSEO } from '../components/PageSEO';
import { FaqSection, HowItWorks, LastUpdated, RelatedLinks } from '../components/calculators/CalculatorContent';
import {
  breadcrumbSchema,
  formatIsoDate,
  howToSchema,
  webApplicationSchema,
  type FaqItem,
  type HowToStep,
} from '../components/calculators/calculatorSchema';
import { STAKING_ASSETS, STAKING_BY_ID, STAKING_META, isStakingAsset, type StakingAssetId } from '../data/staking';
import { calculateStaking, yearsToDouble, type RateType } from '../services/calculators/stakingCalculator';
import { getSimplePrices } from '../services/coingecko';
import { cn } from '../lib/utils';

const PAGE_UPDATED = '2026-09-23';
const inputClass =
  'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary';
const labelClass = 'block text-sm font-medium text-gray-300 mb-1';

const PERIODS: { value: number; label: string }[] = [
  { value: 365, label: 'Daily' },
  { value: 180, label: 'Every ~2 days (Solana epoch)' },
  { value: 73, label: 'Every 5 days (Cardano epoch)' },
  { value: 52, label: 'Weekly' },
  { value: 12, label: 'Monthly' },
  { value: 1, label: 'Once a year / end of term' },
];

const FAQS: FaqItem[] = [
  {
    question: 'How are staking rewards calculated?',
    answer:
      'Rewards = stake × rate × time, adjusted for compounding. If the rate is an APY it already includes compounding, so a restaked 1,000 tokens at 4% APY becomes 1,040 after a year. If it is an APR, restaking n times a year gives 1,000 × (1 + APR/n)^n. Provider commissions come off the rate first. This calculator does exactly that and shows the formula it used.',
  },
  {
    question: 'What is a typical staking APY in 2026?',
    answer: `Checked ${formatIsoDate(STAKING_META.lastVerified)}: roughly 2.5-3.5% for Ethereum, 6-7.5% for Solana, 2-3.5% for Cardano, 11-14% for Polkadot, 14-20% for Cosmos and 6-8% for Avalanche before provider commission. High headline rates usually come with high token inflation, so compare real (after-inflation) yield.`,
  },
  {
    question: 'Are staking rewards taxed in the US?',
    answer:
      'Yes. Under IRS Revenue Ruling 2023-14, staking rewards are ordinary income at their fair market value when you gain control of them (can sell or move them). That value becomes your cost basis, and selling later creates a capital gain or loss. Liquid staking tokens that grow in value instead of paying out are less settled; keep records and ask a tax professional.',
  },
  {
    question: 'What is the difference between APY and APR?',
    answer:
      'APR is a simple yearly rate; APY includes the effect of compounding. At 10% APR compounded daily the APY is about 10.52%. Most staking dashboards quote APY. Treating an APY as an APR and compounding it again overstates rewards, a common calculator mistake.',
  },
  {
    question: 'What are the risks of staking?',
    answer:
      'The token price can fall far more than the reward earns; some networks lock or unbond your coins for days or weeks; validators can be slashed; exchanges hold your coins (counterparty risk); and liquid staking adds smart-contract risk and the chance the token trades below its underlying value.',
  },
  {
    question: 'Should I stake on an exchange or in my own wallet?',
    answer:
      'Exchanges are simplest but hold your coins and keep a larger commission. Delegating from your own wallet keeps custody and usually a better net rate but takes a few more steps. Liquid staking tokens (stETH, rETH, JitoSOL, mSOL) keep your coins usable but add smart-contract risk.',
  },
];

const HOW_STEPS: HowToStep[] = [
  { name: 'Pick the coin', text: 'The calculator fills in the midpoint of that network’s typical staking range and its usual payout schedule.' },
  { name: 'Enter your stake', text: 'In dollars or in tokens. The math is the same; rewards come out in the unit you chose.' },
  { name: 'Set the rate and fees', text: 'Paste your provider’s quoted rate, say whether it is an APY or an APR, and add the provider’s commission if the quote is before fees.' },
  { name: 'Choose restake or payout', text: 'Restaking compounds rewards into the stake; payouts leave the stake unchanged.' },
  { name: 'Read the result', text: 'Rewards, final balance, the effective yearly yield, an optional price-change scenario and an estimate of the income tax due on rewards.' },
];

interface Form {
  asset: StakingAssetId;
  amount: number;
  unit: 'usd' | 'token';
  rate: number;
  rateType: RateType;
  commission: number;
  months: number;
  restake: boolean;
  periods: number;
  priceChange: number;
  taxRate: number;
}

function midpoint(id: StakingAssetId): number {
  const a = STAKING_BY_ID[id];
  return Math.round(((a.apyLow + a.apyHigh) / 2) * 100) / 100;
}

function readForm(p: URLSearchParams): Form {
  const assetParam = p.get('asset');
  const asset: StakingAssetId = isStakingAsset(assetParam) ? assetParam : 'ETH';
  const num = (k: string, d: number, min = 0, max = Infinity) => {
    const raw = p.get(k);
    const v = Number(raw);
    return raw !== null && raw !== '' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d;
  };
  return {
    asset,
    amount: num('amount', 1000),
    unit: p.get('unit') === 'token' ? 'token' : 'usd',
    rate: num('rate', midpoint(asset), 0, 1000),
    rateType: p.get('type') === 'apr' ? 'apr' : 'apy',
    commission: num('fee', 0, 0, 100),
    months: Math.round(num('months', 12, 1, 600)),
    restake: p.get('restake') !== '0',
    periods: num('n', STAKING_BY_ID[asset].payoutsPerYear, 1, 365),
    priceChange: num('px', 0, -100, 10000),
    taxRate: num('tax', 22, 0, 60),
  };
}

function toParams(f: Form): URLSearchParams {
  const p = new URLSearchParams();
  p.set('asset', f.asset);
  p.set('amount', String(f.amount));
  if (f.unit === 'token') p.set('unit', 'token');
  p.set('rate', String(f.rate));
  if (f.rateType === 'apr') p.set('type', 'apr');
  if (f.commission) p.set('fee', String(f.commission));
  p.set('months', String(f.months));
  if (!f.restake) p.set('restake', '0');
  p.set('n', String(f.periods));
  if (f.priceChange) p.set('px', String(f.priceChange));
  p.set('tax', String(f.taxRate));
  return p;
}

const fmtNum = (n: number, digits = 2) => n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export default function StakingCalculatorPage() {
  const [params, setParams] = useSearchParams();
  const form = readForm(params);
  const asset = STAKING_BY_ID[form.asset];
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [priceError, setPriceError] = useState(false);

  const setForm = (patch: Partial<Form>) => setParams(toParams({ ...form, ...patch }), { replace: true });

  useEffect(() => {
    let cancelled = false;
    getSimplePrices(STAKING_ASSETS.map((a) => a.coingeckoId)).then((data) => {
      if (cancelled) return;
      const out: Record<string, number> = {};
      for (const a of STAKING_ASSETS) {
        const usd = data[a.coingeckoId]?.usd;
        if (typeof usd === 'number' && usd > 0) out[a.id] = usd;
      }
      setPrices(out);
      setPriceError(Object.keys(out).length === 0);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const result = useMemo(
    () =>
      calculateStaking({
        principal: form.amount,
        rate: form.rate,
        rateType: form.rateType,
        commissionPct: form.commission,
        months: form.months,
        restake: form.restake,
        periodsPerYear: form.periods,
      }),
    [form.amount, form.rate, form.rateType, form.commission, form.months, form.restake, form.periods]
  );

  const price = prices[form.asset];
  const unitLabel = form.unit === 'usd' ? 'USD' : asset.id;
  const fmtAmt = (n: number) => (form.unit === 'usd' ? `$${fmtNum(n)}` : `${fmtNum(n, 4)} ${asset.id}`);
  const other = (n: number) =>
    price ? (form.unit === 'usd' ? `≈ ${fmtNum(n / price, 4)} ${asset.id} at $${fmtNum(price)}` : `≈ $${fmtNum(n * price)} at today’s price`) : null;
  const pxFactor = 1 + form.priceChange / 100;
  const finalUsdScenario =
    form.unit === 'usd' ? result.finalBalance * pxFactor : price ? result.finalBalance * price * pxFactor : null;
  const startUsd = form.unit === 'usd' ? form.amount : price ? form.amount * price : null;
  const rewardsUsdToday = form.unit === 'usd' ? result.rewards : price ? result.rewards * price : null;
  const taxOnRewards = rewardsUsdToday !== null ? rewardsUsdToday * (form.taxRate / 100) : null;
  const inRange = form.rate >= asset.apyLow && form.rate <= asset.apyHigh;
  const doubling = form.restake ? yearsToDouble(result.netRate, form.rateType, form.periods) : null;
  const maxBar = Math.max(1e-9, ...result.months.map((m) => m.cumulativeRewards));

  const description =
    'Estimate staking rewards for ETH, SOL, ADA, DOT and ATOM with dated typical APY ranges, correct compounding, lockup notes and staking tax basics.';

  return (
    <>
      <PageSEO
        pageKey="stakingCalculator"
        urlPath="/staking-calculator"
        faqs={FAQS}
        customSchema={[
          webApplicationSchema({
            name: 'Crypto Staking Rewards Calculator',
            description,
            path: '/staking-calculator',
            dateModified: PAGE_UPDATED,
            featureList: ['APY and APR handled correctly', 'Restake or payout', 'Provider commission', 'Price-change scenario', 'Staking income tax estimate'],
          }),
          howToSchema('How to calculate crypto staking rewards', description, HOW_STEPS),
          breadcrumbSchema('Staking Calculator', '/staking-calculator'),
        ]}
      />
      <div className="container mx-auto px-4 py-10 space-y-8">
        <header className="max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <Coins className="h-8 w-8 text-brand-primary" aria-hidden="true" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">Crypto Staking Rewards Calculator</h1>
          </div>
          <p className="text-lg text-gray-300 leading-relaxed">
            Staking typically earns about 2.5-3.5% a year on Ethereum, 6-7.5% on Solana and 2-3.5% on Cardano (typical
            ranges checked {formatIsoDate(STAKING_META.lastVerified)}). Enter your stake and your provider’s rate to see
            rewards with correct compounding, fees and the tax you may owe on them.
          </p>
          <div className="mt-3"><LastUpdated date={PAGE_UPDATED}>{' '}· Staking ranges verified {STAKING_META.lastVerified}</LastUpdated></div>
        </header>

        <div className="grid lg:grid-cols-5 gap-8">
          <section aria-labelledby="stk-inputs" className="lg:col-span-2">
            <form className="glass-card p-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
              <h2 id="stk-inputs" className="text-xl font-bold text-white">Your stake</h2>
              <div>
                <label htmlFor="stk-asset" className={labelClass}>Coin</label>
                <select
                  id="stk-asset"
                  value={form.asset}
                  onChange={(e) => {
                    const id = e.target.value as StakingAssetId;
                    setForm({ asset: id, rate: midpoint(id), periods: STAKING_BY_ID[id].payoutsPerYear });
                  }}
                  className={inputClass}
                >
                  {STAKING_ASSETS.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.id}) · typical {a.apyLow}-{a.apyHigh}%</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label htmlFor="stk-amount" className={labelClass}>Amount staked</label>
                  <input id="stk-amount" type="number" min={0} step="any" value={form.amount} onChange={(e) => setForm({ amount: Math.max(0, Number(e.target.value) || 0) })} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="stk-unit" className={labelClass}>Unit</label>
                  <select id="stk-unit" value={form.unit} onChange={(e) => setForm({ unit: e.target.value as Form['unit'] })} className={inputClass}>
                    <option value="usd">USD</option>
                    <option value="token">{asset.id}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label htmlFor="stk-rate" className={labelClass}>Rate (%)</label>
                  <input id="stk-rate" type="number" min={0} step="0.1" value={form.rate} onChange={(e) => setForm({ rate: Math.max(0, Number(e.target.value) || 0) })} className={inputClass} aria-describedby="stk-rate-hint" />
                </div>
                <div>
                  <label htmlFor="stk-type" className={labelClass}>Rate is</label>
                  <select id="stk-type" value={form.rateType} onChange={(e) => setForm({ rateType: e.target.value as RateType })} className={inputClass}>
                    <option value="apy">APY</option>
                    <option value="apr">APR</option>
                  </select>
                </div>
              </div>
              <p id="stk-rate-hint" className={cn('text-xs', inRange ? 'text-gray-500' : 'text-yellow-400')}>
                Typical {asset.name} range: {asset.apyLow}-{asset.apyHigh}% (as of {STAKING_META.lastVerified}).
                {!inRange && ' Your rate is outside it: double-check the source.'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="stk-fee" className={labelClass}>Provider commission (%)</label>
                  <input id="stk-fee" type="number" min={0} max={100} step="1" value={form.commission} onChange={(e) => setForm({ commission: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="stk-months" className={labelClass}>Months</label>
                  <input id="stk-months" type="number" min={1} max={600} step="1" value={form.months} onChange={(e) => setForm({ months: Math.min(600, Math.max(1, Math.round(Number(e.target.value) || 1))) })} className={inputClass} />
                </div>
              </div>
              <p className="text-xs text-gray-500">Leave commission at 0 if your provider already quotes a net rate.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className={labelClass} id="stk-restake-label">Rewards</span>
                  <div className="flex gap-2" role="group" aria-labelledby="stk-restake-label">
                    {[true, false].map((v) => (
                      <button
                        key={String(v)}
                        type="button"
                        aria-pressed={form.restake === v}
                        onClick={() => setForm({ restake: v })}
                        className={cn('flex-1 py-2 rounded-lg text-sm', form.restake === v ? 'bg-brand-primary text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10')}
                      >
                        {v ? 'Restaked' : 'Paid out'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="stk-periods" className={labelClass}>{form.restake ? 'Compounds' : 'Paid'}</label>
                  <select id="stk-periods" value={form.periods} onChange={(e) => setForm({ periods: Number(e.target.value) })} className={inputClass}>
                    {PERIODS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="stk-px" className={labelClass}>{asset.id} price change over the period (%)</label>
                  <input id="stk-px" type="number" min={-100} step="5" value={form.priceChange} onChange={(e) => setForm({ priceChange: Math.max(-100, Number(e.target.value) || 0) })} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="stk-tax" className={labelClass}>Your income tax rate (%)</label>
                  <input id="stk-tax" type="number" min={0} max={60} step="1" value={form.taxRate} onChange={(e) => setForm({ taxRate: Math.min(60, Math.max(0, Number(e.target.value) || 0)) })} className={inputClass} />
                </div>
              </div>
            </form>
          </section>

          <section aria-labelledby="stk-results" aria-live="polite" className="lg:col-span-3 space-y-6">
            <h2 id="stk-results" className="text-2xl font-bold text-white">Projected rewards</h2>
            <div className="glass-card p-6">
              <p className="text-gray-100 leading-relaxed">
                Staking {fmtAmt(form.amount)} of {asset.name} at {fmtNum(result.netRate)}% {form.rateType.toUpperCase()}
                {form.commission ? ` (after a ${form.commission}% commission)` : ''} for {form.months} month{form.months === 1 ? '' : 's'} with
                rewards {form.restake ? 'restaked' : 'paid out'} earns about <strong className="text-white">{fmtAmt(result.rewards)}</strong>,
                an effective {fmtNum(result.effectiveApy)}% a year. Rewards are paid in {asset.id}
                {form.unit === 'usd' ? ', so dollar figures assume today’s price' : ''}; what they are worth later depends on the {asset.id} price.
              </p>
            </div>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass-card p-4">
                <dt className="text-sm text-gray-400">Rewards</dt>
                <dd className="text-xl font-bold text-green-400">{fmtAmt(result.rewards)}</dd>
                {other(result.rewards) && <dd className="text-xs text-gray-500">{other(result.rewards)}</dd>}
              </div>
              <div className="glass-card p-4">
                <dt className="text-sm text-gray-400">Final balance</dt>
                <dd className="text-xl font-bold text-white">{fmtAmt(result.finalBalance)}</dd>
              </div>
              <div className="glass-card p-4">
                <dt className="text-sm text-gray-400">Effective yearly yield</dt>
                <dd className="text-xl font-bold text-white">{fmtNum(result.effectiveApy)}%</dd>
                {doubling && <dd className="text-xs text-gray-500">Doubles in ~{doubling.toFixed(0)} years</dd>}
              </div>
              <div className="glass-card p-4">
                <dt className="text-sm text-gray-400">USD value if {asset.id} {form.priceChange >= 0 ? 'rises' : 'falls'} {Math.abs(form.priceChange)}%</dt>
                <dd className={cn('text-xl font-bold', finalUsdScenario !== null && startUsd !== null && finalUsdScenario < startUsd ? 'text-red-400' : 'text-white')}>
                  {finalUsdScenario === null ? '—' : `$${fmtNum(finalUsdScenario)}`}
                </dd>
                {finalUsdScenario === null && <dd className="text-xs text-gray-500">Needs a live price</dd>}
              </div>
            </dl>

            <div className="glass-card p-6">
              <h3 className="font-semibold text-white mb-3">Cumulative rewards by month ({unitLabel})</h3>
              <div className="h-40 flex items-end gap-0.5" aria-hidden="true">
                {result.months.filter((_, i, arr) => arr.length <= 60 || i % Math.ceil(arr.length / 60) === 0).map((m) => (
                  <div key={m.month} className="flex-1 bg-brand-primary/80 rounded-t" style={{ height: `${Math.max(1, (m.cumulativeRewards / maxBar) * 100)}%` }} title={`Month ${m.month}: ${fmtAmt(m.cumulativeRewards)}`} />
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1"><span>Month 1</span><span>Month {form.months}</span></div>
              <p className="sr-only">Rewards grow from {fmtAmt(result.months[0]?.cumulativeRewards ?? 0)} after month 1 to {fmtAmt(result.rewards)} after month {form.months}.</p>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-semibold text-white mb-2">Tax on staking rewards (US)</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Rewards are ordinary income when you receive them (IRS Rev. Rul. 2023-14), valued at the price that day.
                {taxOnRewards !== null
                  ? ` At today’s price and a ${form.taxRate}% income tax rate, these rewards would add roughly $${fmtNum(taxOnRewards)} of tax, even if you never sell.`
                  : ' Tax is estimated once a live price loads.'}{' '}
                The reward value becomes your cost basis for a later sale. Not tax advice.
              </p>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-semibold text-white mb-3">{asset.name} staking at a glance</h3>
              <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div><dt className="text-gray-400">Typical rate</dt><dd className="text-white">{asset.apyLow}-{asset.apyHigh}% APY, before commission</dd></div>
                <div><dt className="text-gray-400">Rewards</dt><dd className="text-gray-200">{asset.rewardNote}</dd></div>
                <div><dt className="text-gray-400">Unstaking</dt><dd className="text-gray-200">{asset.unbonding}</dd></div>
                <div><dt className="text-gray-400">Minimum</dt><dd className="text-gray-200">{asset.minimum}</dd></div>
                <div><dt className="text-gray-400">Slashing</dt><dd className="text-gray-200">{asset.slashing}</dd></div>
                <div><dt className="text-gray-400">Inflation</dt><dd className="text-gray-200">{asset.inflationNote}</dd></div>
              </dl>
              <h4 className="font-medium text-white mt-5 mb-2">Ways to stake {asset.id}</h4>
              <p className="text-xs text-gray-500 mb-3">Listed for reference, not endorsements. Rates change often, so check each provider’s current net rate.</p>
              <ul className="space-y-2">
                {asset.providers.map((p) => (
                  <li key={p.name} className="p-3 rounded-lg bg-white/5">
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-medium text-white hover:text-brand-primary inline-flex items-center gap-1">
                      {p.name} <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                    <span className="ml-2 text-xs px-2 py-0.5 rounded bg-white/10 text-gray-300">
                      {p.kind === 'exchange' ? 'Exchange (custodial)' : p.kind === 'liquid' ? 'Liquid staking' : 'Self-custody'}
                    </span>
                    <p className="text-sm text-gray-400 mt-1">{p.note}</p>
                  </li>
                ))}
              </ul>
              {priceError && <p className="text-xs text-gray-500 mt-3">Live prices are unavailable right now, so dollar/token conversions are hidden.</p>}
            </div>
          </section>
        </div>

        <section aria-labelledby="stk-compare" className="glass-card p-6 md:p-8">
          <h2 id="stk-compare" className="text-2xl font-bold text-white mb-4">Typical staking rates by coin</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="text-left text-gray-500 text-xs mb-2">Typical native staking ranges, before provider commission, as of {formatIsoDate(STAKING_META.lastVerified)}.</caption>
              <thead>
                <tr className="text-gray-400 border-b border-white/10">
                  <th scope="col" className="text-left py-2 pr-4">Coin</th>
                  <th scope="col" className="text-left py-2 pr-4">Typical APY</th>
                  <th scope="col" className="text-left py-2 pr-4">Unstaking</th>
                  <th scope="col" className="text-left py-2">Slashing</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {STAKING_ASSETS.map((a) => (
                  <tr key={a.id} className="border-b border-white/5 align-top">
                    <td className="py-2 pr-4 text-white whitespace-nowrap">{a.name} ({a.id})</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{a.apyLow}-{a.apyHigh}%</td>
                    <td className="py-2 pr-4">{a.unbonding}</td>
                    <td className="py-2">{a.slashing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-3">{STAKING_META.sourceNote}</p>
        </section>

        <HowItWorks title="How staking rewards are calculated" steps={HOW_STEPS}>
          <p>
            <strong className="text-white">APY, restaked:</strong> balance = stake × (1 + APY)<sup>years</sup>.{' '}
            <strong className="text-white">APY, paid out:</strong> each payout = stake × ((1 + APY)<sup>1/n</sup> − 1), n payouts a year.{' '}
            <strong className="text-white">APR, restaked:</strong> balance = stake × (1 + APR/n)<sup>n × years</sup>.{' '}
            <strong className="text-white">APR, paid out:</strong> rewards = stake × APR × years. Commission is taken off the rate first:
            net rate = rate × (1 − commission).
          </p>
        </HowItWorks>

        <FaqSection faqs={FAQS} />

        <RelatedLinks
          links={[
            { to: '/calculators?type=staking', label: 'Quick staking calculator', description: 'The same math in a compact form alongside DCA, tax and fee tools.' },
            { to: '/defi-yield', label: 'DeFi yields', description: 'How staking compares with lending and liquidity yields.' },
            { to: '/learn/defi-risks', label: 'DeFi risks guide', description: 'Smart-contract, depeg and custody risks explained.' },
            { to: '/calculators?type=tax', label: 'Crypto tax calculator', description: 'Tax when you later sell staked coins.' },
          ]}
        />

        <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex gap-2">
          <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-gray-400">
            Estimates for education only, not financial or tax advice. Staking rates change constantly and are not guaranteed;
            the token’s price can fall by more than the rewards earned.
          </p>
        </div>
      </div>
    </>
  );
}
