/**
 * Crypto calculators hub (/calculators): DCA backtest, capital gains tax, exchange
 * fees, staking and a live converter.
 *
 * Every tab renders a real result on first paint from repo data (price history,
 * tax tables, fee table) and keeps its inputs in the URL (`?type=tax&...`) so a
 * result can be shared. Only the converter needs the network, and it says so
 * when prices can't be loaded.
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowDownUp, Calculator, Coins, DollarSign, Percent, Receipt, RefreshCw } from 'lucide-react';
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
import { cn, formatCryptoPrice } from '../lib/utils';
import { getCachedTopCryptocurrencies } from '../services/coingecko';
import type { Cryptocurrency } from '../types';
import {
  PRICE_ASSETS,
  addMonths,
  getStaticSeries,
  isPriceAsset,
  type PriceHistoryAssetId,
  type PriceSeries,
} from '../data/priceHistory';
import { loadPriceSeries } from '../services/priceHistory';
import { formatSignedPct, formatUsd, isBacktestError, runBacktest, type DcaFrequency } from '../services/backtesting';
import {
  DEFAULT_TAX_YEAR,
  FILING_STATUSES,
  FILING_STATUS_LABELS,
  TAX_DATA_META,
  TAX_YEARS,
  getFederalTaxData,
  isFilingStatus,
  isTaxYear,
  type FilingStatus,
  type TaxYear,
} from '../data/taxBrackets';
import { STATE_TAX_BY_CODE, STATE_TAX_META, STATE_TAX_TABLE } from '../data/stateTaxRates';
import { estimateCryptoSaleTax } from '../services/calculators/taxCalculator';
import { calculateStaking, type RateType } from '../services/calculators/stakingCalculator';
import { EXCHANGE_FEES, EXCHANGE_FEES_META } from '../data/exchangeFees';

const PAGE_UPDATED = '2026-09-23';

type CalculatorType = 'dca' | 'tax' | 'fees' | 'staking' | 'converter';
const CALCULATOR_TYPES: CalculatorType[] = ['dca', 'tax', 'fees', 'staking', 'converter'];
const DEFAULT_CALCULATOR: CalculatorType = 'dca';

function parseCalculatorType(value: string | null): CalculatorType {
  return CALCULATOR_TYPES.includes(value as CalculatorType) ? (value as CalculatorType) : DEFAULT_CALCULATOR;
}

const TABS: { id: CalculatorType; name: string; icon: typeof Calculator; description: string }[] = [
  { id: 'dca', name: 'DCA', icon: DollarSign, description: 'Recurring buys on real prices' },
  { id: 'tax', name: 'Tax', icon: Percent, description: '2025/2026 capital gains' },
  { id: 'fees', name: 'Fees', icon: Receipt, description: 'Maker vs taker costs' },
  { id: 'staking', name: 'Staking', icon: Coins, description: 'Rewards with compounding' },
  { id: 'converter', name: 'Converter', icon: ArrowDownUp, description: 'Live crypto ↔ USD' },
];

const inputClass =
  'w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary';
const labelClass = 'block text-sm font-medium text-gray-300 mb-1';

// ---------------------------------------------------------------------------
// URL helpers: each tab owns a few short params next to `type`.
// ---------------------------------------------------------------------------

function useTabParams() {
  const [params, setParams] = useSearchParams();
  const get = (k: string) => params.get(k);
  const num = (k: string, d: number, min = -Infinity, max = Infinity) => {
    const raw = params.get(k);
    const v = Number(raw);
    return raw !== null && raw !== '' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d;
  };
  const set = useCallback(
    (patch: Record<string, string | number | null>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v === null || v === '') next.delete(k);
            else next.set(k, String(v));
          }
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );
  return { get, num, set };
}

function NumberInput({ id, label, value, onChange, min, max, step = 'any', hint, prefix }: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: string;
  hint?: ReactNode;
  prefix?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true">{prefix}</span>}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) ? value : ''}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          className={cn(inputClass, prefix && 'pl-7')}
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
      </div>
      {hint && <p id={`${id}-hint`} className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

function Row({ label, children, strong }: { label: ReactNode; children: ReactNode; strong?: boolean }) {
  return (
    <div className={cn('flex justify-between gap-4 py-2.5 border-b border-white/10 last:border-0', strong && 'bg-white/5 rounded-lg px-3 -mx-3 border-0')}>
      <dt className="text-gray-400">{label}</dt>
      <dd className="font-semibold text-white text-right">{children}</dd>
    </div>
  );
}

const signedUsd = (n: number) => `${n < 0 ? '-' : n > 0 ? '+' : ''}${formatUsd(Math.abs(n))}`;

// ---------------------------------------------------------------------------
// DCA
// ---------------------------------------------------------------------------

const FREQ_LABEL: Record<DcaFrequency, string> = { daily: 'Daily', weekly: 'Weekly', biweekly: 'Every 2 weeks', monthly: 'Monthly' };

function DCACalculatorForm() {
  const { get, num, set } = useTabParams();
  const coinParam = get('coin');
  const coin: PriceHistoryAssetId = isPriceAsset(coinParam) ? coinParam : 'bitcoin';
  const amount = num('amount', 100, 0);
  const freqParam = get('freq') as DcaFrequency | null;
  const freq: DcaFrequency = freqParam && freqParam in FREQ_LABEL ? freqParam : 'weekly';
  const months = Math.round(num('months', 36, 1, 200));

  const [live, setLive] = useState<Partial<Record<PriceHistoryAssetId, PriceSeries>>>({});
  const [liveNote, setLiveNote] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadPriceSeries(coin).then(({ series, liveError }) => {
      if (cancelled) return;
      setLive((prev) => ({ ...prev, [coin]: series }));
      setLiveNote(liveError);
    });
    return () => {
      cancelled = true;
    };
  }, [coin]);

  const series = live[coin] ?? getStaticSeries(coin);
  const start = addMonths(series.end, -months);
  const meta = PRICE_ASSETS.find((a) => a.id === coin)!;
  const result = useMemo(
    () => runBacktest(series, { initialInvestment: 0, startDate: start, endDate: series.end, dcaAmount: amount, dcaFrequency: freq }),
    [series, start, amount, freq]
  );
  const ok = !isBacktestError(result) && amount > 0 ? result : null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">DCA calculator (dollar-cost averaging)</h2>
      <p className="text-gray-400 mb-6">
        Each buy uses the actual price on its date, so the result shows what a recurring purchase really returned.
      </p>
      <div className="grid md:grid-cols-2 gap-8">
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="dca-coin" className={labelClass}>Coin</label>
            <select id="dca-coin" value={coin} onChange={(e) => set({ coin: e.target.value })} className={inputClass}>
              {PRICE_ASSETS.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.symbol})</option>
              ))}
            </select>
          </div>
          <NumberInput id="dca-amount" label="Amount per buy" prefix="$" value={amount} min={0} onChange={(v) => set({ amount: Math.max(0, v) })} />
          <div>
            <label htmlFor="dca-freq" className={labelClass}>How often</label>
            <select id="dca-freq" value={freq} onChange={(e) => set({ freq: e.target.value })} className={inputClass}>
              {(Object.keys(FREQ_LABEL) as DcaFrequency[]).map((f) => (
                <option key={f} value={f}>{FREQ_LABEL[f]}</option>
              ))}
            </select>
          </div>
          <NumberInput
            id="dca-months"
            label="For the last (months)"
            value={months}
            min={1}
            max={200}
            step="1"
            onChange={(v) => set({ months: Math.round(Math.min(200, Math.max(1, v))) })}
            hint={`${meta.name} price data: ${series.start} to ${series.end}.`}
          />
        </form>

        <div className="bg-white/5 rounded-xl p-6" aria-live="polite">
          <h3 className="font-bold text-lg text-white mb-3">Result</h3>
          {amount <= 0 ? (
            <p className="text-gray-400">Enter an amount per buy.</p>
          ) : isBacktestError(result) ? (
            <p className="text-red-300 flex gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />{result.error}</p>
          ) : ok ? (
            <>
              <p className="text-gray-200 mb-4">
                Buying {formatUsd(amount, 0)} of {meta.symbol} {FREQ_LABEL[freq].toLowerCase()} from {formatIsoDate(ok.startDate)} to{' '}
                {formatIsoDate(ok.endDate)} turned {formatUsd(ok.totalInvested, 0)} into{' '}
                <strong className={ok.profit >= 0 ? 'text-green-400' : 'text-red-400'}>{formatUsd(ok.finalValue, 0)}</strong>.
              </p>
              {ok.coverage.clamped && (
                <p className="text-xs text-amber-300 mb-3">Data for {meta.name} starts {series.start}, so the period was shortened.</p>
              )}
              <dl>
                <Row label="Buys">{ok.buys.length}</Row>
                <Row label="Total invested">{formatUsd(ok.totalInvested)}</Row>
                <Row label={`${meta.symbol} accumulated`}>{ok.units.toLocaleString(undefined, { maximumFractionDigits: 6 })}</Row>
                <Row label="Average cost per coin">{formatUsd(ok.averageCost)}</Row>
                <Row label="Value now">{formatUsd(ok.finalValue)}</Row>
                <Row label="Net return" strong>
                  <span className={ok.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {signedUsd(ok.profit)} ({formatSignedPct(ok.totalReturnPct)})
                  </span>
                </Row>
                <Row label="Annualised (XIRR)">{ok.annualizedReturnPct === null ? '—' : `${formatSignedPct(ok.annualizedReturnPct)}/yr`}</Row>
              </dl>
              <Link
                to={`/backtesting?asset=${coin}&start=${ok.startDate}&amount=0&dca=${amount}&freq=${freq}`}
                className="inline-block mt-4 text-sm text-brand-primary hover:underline"
              >
                Open in the backtester for charts, drawdowns and lump-sum comparison →
              </Link>
            </>
          ) : null}
          <p className="text-xs text-gray-500 mt-4">
            Weekly price history with prices between weeks interpolated{series.live ? '; the last 12 months use daily CoinGecko prices' : ''}. Fees not included.
            {liveNote && ` ${liveNote}`}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tax
// ---------------------------------------------------------------------------

function TaxCalculatorForm() {
  const { get, num, set } = useTabParams();
  const yearParam = Number(get('year'));
  const year: TaxYear = isTaxYear(yearParam) ? (yearParam as TaxYear) : DEFAULT_TAX_YEAR;
  const fsParam = get('fs');
  const status: FilingStatus = isFilingStatus(fsParam) ? fsParam : 'single';
  const income = num('income', 75000, 0);
  const basis = num('basis', 10000, 0);
  const proceeds = num('proceeds', 25000, 0);
  const fees = num('fees', 0, 0);
  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  const bought = dateRe.test(get('bought') ?? '') ? get('bought')! : '2024-03-01';
  const sold = dateRe.test(get('sold') ?? '') ? get('sold')! : `${year}-06-01`;
  const stateParam = get('state') ?? '';
  const state = STATE_TAX_BY_CODE[stateParam] ? stateParam : '';

  const datesValid = sold > bought;
  const r = useMemo(
    () =>
      estimateCryptoSaleTax({
        taxYear: year,
        filingStatus: status,
        otherIncome: income,
        costBasis: basis,
        proceeds,
        fees,
        purchaseDate: bought,
        saleDate: sold,
        state: state || undefined,
      }),
    [year, status, income, basis, proceeds, fees, bought, sold, state]
  );
  const data = getFederalTaxData(year, status);
  const saleYear = Number(sold.slice(0, 4));

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Crypto capital gains tax calculator</h2>
      <p className="text-gray-400 mb-2">
        Estimates the extra federal and state tax from one crypto sale, using {year} IRS brackets for your filing status.
      </p>
      <p className="text-xs text-gray-500 mb-6">
        Federal rates verified {TAX_DATA_META.lastVerified} (IRS Rev. Proc. 2024-40 and 2025-32); state rates verified {STATE_TAX_META.lastVerified}. Not tax advice.
      </p>
      <div className="grid md:grid-cols-2 gap-8">
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="tax-year" className={labelClass}>Tax year</label>
              <select id="tax-year" value={year} onChange={(e) => set({ year: e.target.value })} className={inputClass}>
                {TAX_YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tax-fs" className={labelClass}>Filing status</label>
              <select id="tax-fs" value={status} onChange={(e) => set({ fs: e.target.value })} className={inputClass}>
                {FILING_STATUSES.map((s) => (
                  <option key={s} value={s}>{FILING_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>
          <NumberInput
            id="tax-income"
            label="Other income this year (wages etc.)"
            prefix="$"
            value={income}
            min={0}
            onChange={(v) => set({ income: Math.max(0, v) })}
            hint={`Before the ${formatUsd(data.standardDeduction, 0)} standard deduction, which the calculator applies.`}
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberInput id="tax-basis" label="What you paid (cost basis)" prefix="$" value={basis} min={0} onChange={(v) => set({ basis: Math.max(0, v) })} />
            <NumberInput id="tax-proceeds" label="What you sold for" prefix="$" value={proceeds} min={0} onChange={(v) => set({ proceeds: Math.max(0, v) })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="tax-bought" className={labelClass}>Bought on</label>
              <input id="tax-bought" type="date" value={bought} onChange={(e) => set({ bought: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label htmlFor="tax-sold" className={labelClass}>Sold on</label>
              <input id="tax-sold" type="date" value={sold} onChange={(e) => set({ sold: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberInput id="tax-fees" label="Selling fees" prefix="$" value={fees} min={0} onChange={(v) => set({ fees: Math.max(0, v) })} />
            <div>
              <label htmlFor="tax-state" className={labelClass}>State</label>
              <select id="tax-state" value={state} onChange={(e) => set({ state: e.target.value })} className={inputClass}>
                <option value="">Leave out state tax</option>
                {STATE_TAX_TABLE.map((s) => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          {state && STATE_TAX_BY_CODE[state].note && <p className="text-xs text-gray-500">{STATE_TAX_BY_CODE[state].note}</p>}
          {state && !STATE_TAX_BY_CODE[state].verified && (
            <p className="text-xs text-yellow-400">This state’s rate was not re-checked in our last review; confirm it with your state revenue department.</p>
          )}
        </form>

        <div className="bg-white/5 rounded-xl p-6" aria-live="polite">
          <h3 className="font-bold text-lg text-white mb-3">Estimate</h3>
          {!datesValid ? (
            <p className="text-red-300">The sale date must be after the purchase date.</p>
          ) : (
            <>
              {saleYear !== year && (
                <p className="text-xs text-amber-300 mb-3">
                  The sale date is in {saleYear} but the tax year is {year}. A sale is taxed in the year it happens.
                </p>
              )}
              <p className="text-gray-200 mb-4">
                {r.gain >= 0
                  ? `This ${r.holdingPeriod === 'long_term' ? 'long-term' : 'short-term'} gain of ${formatUsd(r.gain, 0)} adds about ${formatUsd(r.totalTax, 0)} of tax (${(r.effectiveRate * 100).toFixed(1)}% of the gain).`
                  : `This ${formatUsd(-r.gain, 0)} loss can offset other gains, then up to ${formatUsd(status === 'married_filing_separately' ? 1500 : 3000, 0)} of ordinary income a year, saving about ${formatUsd(r.taxSavedByLoss, 0)} in federal tax this year.`}
              </p>
              <dl>
                <Row label="Holding period">{r.holdingPeriod === 'long_term' ? 'Long-term (more than 1 year)' : 'Short-term (1 year or less)'}</Row>
                <Row label="Gain / loss">
                  <span className={r.gain >= 0 ? 'text-green-400' : 'text-red-400'}>{signedUsd(r.gain)}</span>
                </Row>
                <Row label="Federal income tax on it">{signedUsd(r.federalIncomeTax)}</Row>
                <Row label="Net investment income tax (3.8%)">{formatUsd(r.niit)}</Row>
                <Row label={state ? `${STATE_TAX_BY_CODE[state].name} tax (estimate)` : 'State tax'}>{state ? formatUsd(r.stateTax) : 'Not included'}</Row>
                <Row label="Total extra tax" strong>{signedUsd(r.totalTax)}</Row>
                {r.gain > 0 && <Row label="Kept after tax">{formatUsd(r.netAfterTax)}</Row>}
                {r.lossCarryforward > 0 && <Row label="Loss carried to next year">{formatUsd(r.lossCarryforward)}</Row>}
                <Row label="Your ordinary bracket before the sale">{(r.marginalOrdinaryRate * 100).toFixed(0)}%</Row>
              </dl>
              <p className="text-xs text-gray-500 mt-4">
                Short-term gains are taxed as ordinary income; long-term gains use 0/15/20% rates stacked on your other taxable income
                ({year} {FILING_STATUS_LABELS[status].toLowerCase()}: 0% up to {formatUsd(data.ltcg.zeroUpTo, 0)}, 15% up to{' '}
                {formatUsd(data.ltcg.fifteenUpTo, 0)} of taxable income). Ignores other gains/losses, credits, itemizing and AMT.
                State tax uses the state’s top rate and can overstate it for moderate incomes. Not tax advice.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fees
// ---------------------------------------------------------------------------

function FeeCalculatorForm() {
  const { get, num, set } = useTabParams();
  const amount = num('amount', 1000, 0);
  const order: 'maker' | 'taker' = get('order') === 'maker' ? 'maker' : 'taker';
  const roundTrip = get('rt') === '1';

  const rows = EXCHANGE_FEES.map((e) => {
    const pct = order === 'maker' ? e.maker : e.taker;
    const cost = (amount * pct) / 100 * (roundTrip ? 2 : 1);
    return { ...e, pct, cost };
  }).sort((a, b) => a.cost - b.cost);

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Exchange fee calculator</h2>
      <p className="text-gray-400 mb-2">
        What a trade costs on US exchanges’ advanced trading screens at the lowest volume tier. Maker orders (limit orders that wait on the
        book) are cheaper than taker orders (market orders that fill immediately).
      </p>
      <p className="text-xs text-gray-500 mb-6">Fees verified {EXCHANGE_FEES_META.lastVerified}. {EXCHANGE_FEES_META.note}</p>
      <form className="grid sm:grid-cols-3 gap-4 mb-6" onSubmit={(e) => e.preventDefault()}>
        <NumberInput id="fee-amount" label="Trade amount" prefix="$" value={amount} min={0} onChange={(v) => set({ amount: Math.max(0, v) })} />
        <div>
          <span id="fee-order-label" className={labelClass}>Order type</span>
          <div className="flex gap-2" role="group" aria-labelledby="fee-order-label">
            {(['taker', 'maker'] as const).map((o) => (
              <button
                key={o}
                type="button"
                aria-pressed={order === o}
                onClick={() => set({ order: o === 'taker' ? null : o })}
                className={cn('flex-1 py-2.5 rounded-lg text-sm', order === o ? 'bg-brand-primary text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10')}
              >
                {o === 'taker' ? 'Market (taker)' : 'Limit (maker)'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span id="fee-rt-label" className={labelClass}>Include selling later</span>
          <button
            type="button"
            aria-pressed={roundTrip}
            aria-labelledby="fee-rt-label"
            onClick={() => set({ rt: roundTrip ? null : '1' })}
            className={cn('w-full py-2.5 rounded-lg text-sm', roundTrip ? 'bg-brand-primary text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10')}
          >
            {roundTrip ? 'Buy + sell (round trip)' : 'Buy only'}
          </button>
        </div>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full">
          <caption className="sr-only">Fee for a {formatUsd(amount, 0)} {order} trade by exchange</caption>
          <thead>
            <tr className="border-b border-white/10">
              <th scope="col" className="text-left py-3 px-3 text-gray-400 font-medium">Exchange</th>
              <th scope="col" className="text-right py-3 px-3 text-gray-400 font-medium">Maker</th>
              <th scope="col" className="text-right py-3 px-3 text-gray-400 font-medium">Taker</th>
              <th scope="col" className="text-right py-3 px-3 text-gray-400 font-medium">Your cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-white/5">
                <td className="py-3 px-3">
                  <a href={r.feePageUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-white hover:text-brand-primary">{r.name}</a>
                  <span className="block text-xs text-gray-500">{r.tier}</span>
                </td>
                <td className={cn('py-3 px-3 text-right', order === 'maker' ? 'text-white' : 'text-gray-500')}>{r.maker.toFixed(2)}%</td>
                <td className={cn('py-3 px-3 text-right', order === 'taker' ? 'text-white' : 'text-gray-500')}>{r.taker.toFixed(2)}%</td>
                <td className="py-3 px-3 text-right font-bold text-white">{formatUsd(r.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mt-4">
        Not included: spreads, deposit/withdrawal fees and card fees. Binance.US and others offer some zero-fee pairs; check each fee page.
        See <Link to="/compare" className="text-brand-primary hover:underline">exchange comparisons</Link> for more.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Staking (compact; full version at /staking-calculator)
// ---------------------------------------------------------------------------

function StakingCalculatorForm() {
  const { get, num, set } = useTabParams();
  const amount = num('amount', 1000, 0);
  const rate = num('rate', 4, 0, 1000);
  const rateType: RateType = get('rtype') === 'apr' ? 'apr' : 'apy';
  const months = Math.round(num('months', 12, 1, 600));
  const restake = get('restake') !== '0';
  const periods = num('n', 365, 1, 365);
  const r = calculateStaking({ principal: amount, rate, rateType, months, restake, periodsPerYear: periods });

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Staking rewards calculator</h2>
      <p className="text-gray-400 mb-6">
        Quick estimate. For typical rates by coin, lock-ups, providers and tax, use the{' '}
        <Link to="/staking-calculator" className="text-brand-primary hover:underline">full staking calculator</Link>.
      </p>
      <div className="grid md:grid-cols-2 gap-8">
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <NumberInput id="stk-amount" label="Amount staked" prefix="$" value={amount} min={0} onChange={(v) => set({ amount: Math.max(0, v) })} />
          <div className="grid grid-cols-2 gap-3">
            <NumberInput id="stk-rate" label="Rate (%)" value={rate} min={0} step="0.1" onChange={(v) => set({ rate: Math.max(0, v) })} />
            <div>
              <label htmlFor="stk-rtype" className={labelClass}>Rate is</label>
              <select id="stk-rtype" value={rateType} onChange={(e) => set({ rtype: e.target.value === 'apr' ? 'apr' : null })} className={inputClass}>
                <option value="apy">APY (already compounded)</option>
                <option value="apr">APR (simple)</option>
              </select>
            </div>
          </div>
          <NumberInput id="stk-months" label="Duration (months)" value={months} min={1} max={600} step="1" onChange={(v) => set({ months: Math.round(Math.min(600, Math.max(1, v))) })} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="stk-restake" className={labelClass}>Rewards</label>
              <select id="stk-restake" value={restake ? '1' : '0'} onChange={(e) => set({ restake: e.target.value === '0' ? '0' : null })} className={inputClass}>
                <option value="1">Restaked (compound)</option>
                <option value="0">Paid out (no compounding)</option>
              </select>
            </div>
            <div>
              <label htmlFor="stk-n" className={labelClass}>{restake ? 'Compounds' : 'Paid'}</label>
              <select id="stk-n" value={periods} onChange={(e) => set({ n: e.target.value })} className={inputClass}>
                <option value={365}>Daily</option>
                <option value={52}>Weekly</option>
                <option value={12}>Monthly</option>
                <option value={1}>Yearly</option>
              </select>
            </div>
          </div>
        </form>
        <div className="bg-white/5 rounded-xl p-6" aria-live="polite">
          <h3 className="font-bold text-lg text-white mb-3">Result</h3>
          <dl>
            <Row label="Initial stake">{formatUsd(amount)}</Row>
            <Row label="Rewards"><span className="text-green-400">+{formatUsd(r.rewards)}</span></Row>
            <Row label="Final balance">{formatUsd(r.finalBalance)}</Row>
            <Row label="Effective yearly yield" strong>{r.effectiveApy.toFixed(2)}%</Row>
          </dl>
          <p className="text-xs text-gray-500 mt-4">
            {rateType === 'apy'
              ? 'An APY already includes compounding, so the frequency only matters when rewards are paid out.'
              : 'An APR is simple interest; restaking more often raises the effective yield.'}{' '}
            Dollar values assume the token price stays the same.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Converter (live)
// ---------------------------------------------------------------------------

function CryptoConverterForm() {
  const [cryptos, setCryptos] = useState<Cryptocurrency[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [cryptoId, setCryptoId] = useState('bitcoin');
  const [cryptoAmount, setCryptoAmount] = useState('1');
  const [fiatAmount, setFiatAmount] = useState('');
  const [direction, setDirection] = useState<'crypto-to-fiat' | 'fiat-to-crypto'>('crypto-to-fiat');

  useEffect(() => {
    let cancelled = false;
    getCachedTopCryptocurrencies(20).then((data) => {
      if (cancelled) return;
      setCryptos(data);
      // getTopCryptocurrencies resolves to [] on any API failure.
      setStatus(data.length > 0 ? 'ready' : 'error');
    });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const selected = cryptos.find((c) => c.id === cryptoId);
  const derivedFiat = selected && direction === 'crypto-to-fiat' ? ((parseFloat(cryptoAmount) || 0) * selected.current_price).toFixed(2) : fiatAmount;
  const derivedCrypto = selected && direction === 'fiat-to-crypto' ? ((parseFloat(fiatAmount) || 0) / selected.current_price).toFixed(8) : cryptoAmount;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Crypto converter</h2>
      <p className="text-gray-400 mb-6">Convert between the top 20 cryptocurrencies and US dollars at live CoinGecko prices.</p>
      {status === 'loading' ? (
        <div className="max-w-lg mx-auto space-y-4" aria-busy="true">
          {[0, 1, 2].map((i) => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
      ) : status === 'error' ? (
        <div className="max-w-lg mx-auto p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-center" role="alert">
          <p className="text-red-200 mb-3">Live prices could not be loaded right now, so the converter is unavailable.</p>
          <button
            type="button"
            onClick={() => {
              setStatus('loading');
              setAttempt((a) => a + 1);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" /> Try again
          </button>
        </div>
      ) : (
        <form className="max-w-lg mx-auto space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <label htmlFor="conv-coin" className="block text-xs text-gray-400 mb-2">Crypto</label>
            <div className="flex items-center gap-3">
              <select id="conv-coin" value={cryptoId} onChange={(e) => setCryptoId(e.target.value)} className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm min-w-[140px]">
                {cryptos.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.symbol.toUpperCase()})</option>
                ))}
              </select>
              <label htmlFor="conv-crypto-amount" className="sr-only">Crypto amount</label>
              <input
                id="conv-crypto-amount"
                type="number"
                value={derivedCrypto}
                onChange={(e) => {
                  setDirection('crypto-to-fiat');
                  setCryptoAmount(e.target.value);
                }}
                className="flex-1 min-w-0 bg-transparent text-right text-2xl font-bold text-white focus:outline-none"
                min="0"
                step="any"
              />
            </div>
          </div>
          <div className="flex justify-center">
            <ArrowDownUp className="w-5 h-5 text-brand-primary" aria-hidden="true" />
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <label htmlFor="conv-usd" className="block text-xs text-gray-400 mb-2">US dollars</label>
            <input
              id="conv-usd"
              type="number"
              value={derivedFiat}
              onChange={(e) => {
                setDirection('fiat-to-crypto');
                setFiatAmount(e.target.value);
              }}
              className="w-full bg-transparent text-right text-2xl font-bold text-white focus:outline-none"
              min="0"
              step="any"
            />
          </div>
          {selected && (
            <div className="text-center space-y-1 pt-2">
              <p className="text-sm text-gray-400">
                1 {selected.symbol.toUpperCase()} = <span className="text-white font-medium">{formatCryptoPrice(selected.current_price)}</span>
              </p>
              <p className={cn('text-xs', selected.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400')}>
                {selected.price_change_percentage_24h >= 0 ? '+' : ''}
                {selected.price_change_percentage_24h?.toFixed(2)}% (24h)
              </p>
              <p className="text-xs text-gray-500">Price as of {new Date(selected.last_updated).toLocaleTimeString()} · CoinGecko</p>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const FAQS: FaqItem[] = [
  {
    question: 'What is a DCA calculator?',
    answer:
      'A dollar-cost averaging (DCA) calculator shows what buying a fixed dollar amount at regular intervals would have returned. Ours prices every buy at the actual historical price on that date (weekly data since 2014 for Bitcoin), so the average cost, return and XIRR are real, not a projection.',
  },
  {
    question: 'How is crypto taxed in the US?',
    answer:
      'Selling, swapping or spending crypto is a taxable disposal. Gains on coins held one year or less are taxed as ordinary income (10-37%); gains on coins held more than a year are taxed at 0%, 15% or 20% depending on your taxable income, plus 3.8% net investment income tax above $200,000 ($250,000 married filing jointly). Losses offset gains and up to $3,000 of other income a year.',
  },
  {
    question: `What are the ${DEFAULT_TAX_YEAR} long-term capital gains brackets?`,
    answer: `For ${DEFAULT_TAX_YEAR}, the 0% rate applies up to $49,450 of taxable income for single filers ($98,900 married filing jointly, $66,200 head of household), 15% up to $545,500 ($613,700 joint, $579,600 head of household) and 20% above that (IRS Rev. Proc. 2025-32).`,
  },
  {
    question: 'What is Form 1099-DA?',
    answer:
      'Starting with sales in 2025, US brokers such as exchanges report gross proceeds from digital-asset sales to you and the IRS on Form 1099-DA, and for sales from 2026 they also report cost basis for coins bought on that platform from 2025 onward. Since January 1, 2025 you must also track cost basis wallet by wallet (or account by account) rather than across all your holdings.',
  },
  {
    question: 'How do crypto exchange fees work?',
    answer:
      'Exchanges charge a percentage of each trade. Maker orders (limit orders that add liquidity) pay less than taker orders (market orders that fill immediately). At the lowest volume tier, advanced trading fees range from about 0.2-0.6% for makers to 0.4-1.2% for takers on major US exchanges; simple buy buttons usually cost more through spreads.',
  },
  {
    question: 'How are staking rewards calculated?',
    answer:
      'Rewards depend on your stake, the rate and time. An APY already includes compounding, so 1,000 at 4% APY restaked becomes 1,040 after a year; an APR compounds n times a year as (1 + APR/n)^n. Provider commissions reduce the rate.',
  },
];

const DCA_STEPS: HowToStep[] = [
  { name: 'Choose a coin and amount', text: 'Pick BTC, ETH or SOL and how much to buy each time.' },
  { name: 'Choose how often and for how long', text: 'Daily, weekly, every two weeks or monthly, over the last N months.' },
  { name: 'Read the result', text: 'Each buy uses that date’s historical price; the result shows coins accumulated, average cost, value today, net return and XIRR.' },
];

const TAX_STEPS: HowToStep[] = [
  { name: 'Pick the tax year and filing status', text: '2025 or 2026 brackets, standard deduction and 0/15/20% thresholds are loaded for your status.' },
  { name: 'Enter your other income', text: 'Wages and other ordinary income for the year, before the standard deduction.' },
  { name: 'Enter the sale', text: 'Cost basis, sale proceeds, fees and the purchase and sale dates (more than one year held = long-term).' },
  { name: 'Add your state', text: 'Optional; uses the state’s top rate, with notes for states that treat gains differently.' },
  { name: 'Read the extra tax', text: 'Federal tax with and without the sale, the 3.8% NIIT if it applies, and state tax.' },
];

export function Calculators() {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = parseCalculatorType(searchParams.get('type'));

  const select = useCallback(
    (next: CalculatorType) => {
      // Switching tabs drops the previous tab's inputs.
      const p = new URLSearchParams();
      if (next !== DEFAULT_CALCULATOR) p.set('type', next);
      setSearchParams(p, { replace: true });
    },
    [setSearchParams]
  );

  const description =
    'Free crypto calculators: DCA backtest on real BTC, ETH and SOL prices, 2025/2026 capital gains tax, exchange fees, staking and a live price converter.';

  return (
    <>
      <PageSEO
        pageKey="calculators"
        urlPath="/calculators"
        faqs={FAQS}
        customSchema={[
          webApplicationSchema({
            name: 'Crypto Calculators',
            description,
            path: '/calculators',
            dateModified: PAGE_UPDATED,
            featureList: [
              'DCA calculator using historical BTC, ETH and SOL prices',
              `Capital gains tax calculator with ${TAX_YEARS.join(' and ')} IRS brackets, NIIT and state tax`,
              'Exchange fee calculator (maker vs taker)',
              'Staking rewards calculator (APY vs APR)',
              'Live crypto to USD converter',
            ],
          }),
          howToSchema('How to calculate dollar-cost averaging returns for Bitcoin', 'Backtest recurring crypto buys on historical prices.', DCA_STEPS),
          howToSchema('How to estimate tax on a crypto sale', 'Estimate federal and state tax on one crypto sale.', TAX_STEPS),
          breadcrumbSchema('Calculators', '/calculators'),
        ]}
      />
      <div className="container mx-auto px-4 py-10 space-y-8">
        <header className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
            <Calculator className="w-4 h-4 text-brand-primary" aria-hidden="true" />
            <span className="text-sm text-gray-300">Free, runs in your browser</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Crypto <span className="text-gradient">Calculators</span>
          </h1>
          <p className="text-gray-300 text-lg">
            Five free tools: a DCA calculator that prices every buy at the real historical price, a capital gains tax
            estimator with {TAX_YEARS.join(' and ')} IRS brackets, an exchange fee comparison, a staking rewards calculator
            and a live converter. Every result has a shareable link.
          </p>
          <div className="mt-3"><LastUpdated date={PAGE_UPDATED}>{' '}· Tax rates verified {TAX_DATA_META.lastVerified}</LastUpdated></div>
        </header>

        <div role="tablist" aria-label="Calculators" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={active === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => select(t.id)}
              className={cn('p-4 rounded-xl transition-all text-left', active === t.id ? 'glass-card border-brand-primary/50' : 'glass hover:bg-white/5')}
            >
              <t.icon className={cn('w-6 h-6 mb-2', active === t.id ? 'text-brand-primary' : 'text-gray-400')} aria-hidden="true" />
              <span className="block font-medium text-white">{t.name}</span>
              <span className="block text-xs text-gray-400 mt-1">{t.description}</span>
            </button>
          ))}
        </div>

        <div id={`panel-${active}`} role="tabpanel" aria-labelledby={`tab-${active}`} className="glass-card p-6 md:p-8">
          {active === 'dca' && <DCACalculatorForm />}
          {active === 'tax' && <TaxCalculatorForm />}
          {active === 'fees' && <FeeCalculatorForm />}
          {active === 'staking' && <StakingCalculatorForm />}
          {active === 'converter' && <CryptoConverterForm />}
        </div>

        <HowItWorks
          title="How each calculator works"
          steps={[
            { name: 'DCA', text: 'Each buy converts your amount to coins at that date’s price from our weekly history (Coin Metrics and CoinGecko data), topped up with daily CoinGecko prices when available. Value = coins × latest price; the annualised figure is XIRR, which weights each buy by how long it was invested.' },
            { name: 'Tax', text: 'Federal tax is computed twice, with and without the sale, using the standard deduction and brackets for your year and filing status. Long-term gains are stacked on your other taxable income across the 0/15/20% bands; 3.8% NIIT applies to the gain above the $200k/$250k thresholds. State tax uses a dated table of top rates.' },
            { name: 'Fees', text: 'Cost = trade amount × the maker or taker rate (× 2 for a round trip), using each exchange’s lowest-volume advanced-trading tier.' },
            { name: 'Staking', text: 'An APY is treated as already compounded: balance = stake × (1 + APY)^years. An APR compounds n times a year: stake × (1 + APR/n)^(n × years). Paid-out rewards do not compound.' },
            { name: 'Converter', text: 'Amount × the live CoinGecko USD price for the selected coin. If prices cannot be loaded, the converter says so.' },
          ]}
        />

        <FaqSection faqs={FAQS} />

        <RelatedLinks
          links={[
            { to: '/backtesting', label: 'Bitcoin backtester', description: 'Lump sum vs DCA with charts and drawdowns.' },
            { to: '/staking-calculator', label: 'Staking calculator', description: 'Typical rates by coin, lock-ups and providers.' },
            { to: '/retirement-calculator', label: 'Crypto retirement calculator', description: 'Monte Carlo odds for a plan that includes crypto.' },
            { to: '/learn/crypto-taxes-basics', label: 'Crypto taxes basics', description: 'What is taxable and how to keep records.' },
            { to: '/learn/dca-strategies', label: 'DCA strategies', description: 'When dollar-cost averaging helps and when it doesn’t.' },
            { to: '/tax-reports', label: 'Tax reports', description: 'Build a gains report from your transactions.' },
          ]}
        />
        <p className="text-xs text-gray-500 text-center">
          Educational estimates, not financial or tax advice. Crypto prices are volatile; past returns do not predict future results.
        </p>
      </div>
    </>
  );
}
