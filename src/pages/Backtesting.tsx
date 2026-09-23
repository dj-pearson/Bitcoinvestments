/**
 * Bitcoin & crypto backtester (/backtesting): lump sum vs DCA on real price history.
 *
 * First render computes a real result from the committed weekly price history
 * (SSR-safe, no network). After mount the page tries to top up the series with
 * daily CoinGecko prices and re-runs. All inputs live in the URL so any result
 * can be shared.
 */

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, BarChart3, Info, TrendingDown, TrendingUp } from 'lucide-react';
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
import { ValueChart } from '../components/calculators/ValueChart';
import {
  PRICE_ASSETS,
  PRICE_HISTORY_GENERATED,
  PRICE_HISTORY_SOURCES,
  addMonths,
  getStaticSeries,
  isPriceAsset,
  type PriceHistoryAssetId,
  type PriceSeries,
} from '../data/priceHistory';
import { loadPriceSeries } from '../services/priceHistory';
import {
  formatSignedPct,
  formatUsd,
  isBacktestError,
  runBacktest,
  samplePath,
  type DcaFrequency,
} from '../services/backtesting';
import { cn } from '../lib/utils';

const PAGE_UPDATED = '2026-09-23';
const FREQS: DcaFrequency[] = ['daily', 'weekly', 'biweekly', 'monthly'];
const FREQ_LABEL: Record<DcaFrequency, string> = { daily: 'Daily', weekly: 'Weekly', biweekly: 'Every 2 weeks', monthly: 'Monthly' };
const inputClass =
  'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary';

const FAQS: FaqItem[] = [
  {
    question: 'What if I had invested $1,000 in Bitcoin?',
    answer:
      'Pick Bitcoin, enter $1,000 and a start date, and the backtester shows what that purchase would be worth on the latest date in our price history, along with the total and annualised return and the biggest drop you would have sat through. The table of example results on this page shows $1,000 invested on January 1 of each year since 2015.',
  },
  {
    question: 'Is DCA better than a lump sum?',
    answer:
      'Not usually in a market that mostly rises: studies of stocks find a lump sum beats dollar-cost averaging about two-thirds of the time because the money is invested for longer. DCA tends to win when prices fall or move sideways after you start, and it reduces the regret of buying right before a crash. Use the "Add a recurring buy" option to compare both on the same dates.',
  },
  {
    question: 'What is the annualised return for DCA?',
    answer:
      'For a recurring buy the page shows the money-weighted return (XIRR). It accounts for the fact that most of your money went in later, so it is a fairer yearly figure than spreading the total return over the whole period. For a single purchase it shows the compound annual growth rate (CAGR).',
  },
  {
    question: 'Where does the price data come from?',
    answer:
      'Weekly (Monday) USD prices from Coin Metrics’ free community dataset through May 2026, then daily CoinGecko prices. When your browser can reach CoinGecko, the last 12 months are replaced with daily prices. Prices between data points are interpolated, so results are close approximations rather than exchange fills, and fees are not included.',
  },
  {
    question: 'Why does Solana history only start in December 2025?',
    answer:
      'The free datasets we can redistribute do not include older Solana prices, so we only bundle what we could source and cross-check. Bitcoin history starts in January 2014 and Ethereum in August 2015.',
  },
  {
    question: 'Does past performance predict future returns?',
    answer:
      'No. Crypto has had several 70-85% declines, and its early growth is unlikely to repeat at the same pace. Use backtests to understand risk and timing, not to forecast.',
  },
];

const HOW_STEPS: HowToStep[] = [
  { name: 'Choose an asset and dates', text: 'Pick Bitcoin, Ethereum or Solana and a start and end date (or a preset like "5 years").' },
  { name: 'Enter a one-off amount', text: 'The lump sum buys at the start date’s price. Set it to $0 if you only want to test recurring buys.' },
  { name: 'Optionally add a recurring buy', text: 'Choose an amount and how often. Each buy uses the price on that date.' },
  { name: 'Read the results', text: 'Final value, total and annualised return, the largest price drop in the window and your worst paper loss, plus DCA vs lump sum on the same money.' },
  { name: 'Share or tweak', text: 'The URL updates as you type, so you can copy it to share the exact backtest.' },
];

interface FormState {
  asset: PriceHistoryAssetId;
  start: string;
  end: string;
  amount: number;
  dcaOn: boolean;
  dcaAmount: number;
  freq: DcaFrequency;
}

function readForm(params: URLSearchParams, series: (a: PriceHistoryAssetId) => PriceSeries): FormState {
  const assetParam = params.get('asset');
  const asset: PriceHistoryAssetId = isPriceAsset(assetParam) ? assetParam : 'bitcoin';
  const s = series(asset);
  const defaultStart = asset === 'solana' ? s.start : '2020-01-06';
  const num = (k: string, d: number) => {
    const v = Number(params.get(k));
    return params.get(k) !== null && Number.isFinite(v) && v >= 0 ? v : d;
  };
  const freqParam = params.get('freq') as DcaFrequency | null;
  const dca = num('dca', 0);
  return {
    asset,
    start: /^\d{4}-\d{2}-\d{2}$/.test(params.get('start') ?? '') ? params.get('start')! : defaultStart,
    end: /^\d{4}-\d{2}-\d{2}$/.test(params.get('end') ?? '') ? params.get('end')! : '',
    amount: num('amount', 1000),
    dcaOn: dca > 0,
    dcaAmount: dca > 0 ? dca : 100,
    freq: freqParam && FREQS.includes(freqParam) ? freqParam : 'weekly',
  };
}

function formToParams(f: FormState): URLSearchParams {
  const p = new URLSearchParams();
  p.set('asset', f.asset);
  p.set('start', f.start);
  if (f.end) p.set('end', f.end);
  p.set('amount', String(f.amount));
  if (f.dcaOn) {
    p.set('dca', String(f.dcaAmount));
    p.set('freq', f.freq);
  }
  return p;
}

/** Static landmark results computed from the committed history (prerender-safe). */
function useLandmarks() {
  return useMemo(() => {
    const btc = getStaticSeries('bitcoin');
    const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
    const lump = years.map((y) => {
      const r = runBacktest(btc, { initialInvestment: 1000, startDate: `${y}-01-01`, endDate: btc.end });
      return { year: y, r: isBacktestError(r) ? null : r };
    });
    const dcaCases = [
      { label: '$100 a week since the May 2020 halving', start: '2020-05-11', amount: 100, freq: 'weekly' as const },
      { label: '$100 a week since the Nov 2021 peak', start: '2021-11-08', amount: 100, freq: 'weekly' as const },
      { label: '$250 a month since Jan 2018', start: '2018-01-01', amount: 250, freq: 'monthly' as const },
    ].map((c) => {
      const r = runBacktest(btc, { initialInvestment: 0, startDate: c.start, endDate: btc.end, dcaAmount: c.amount, dcaFrequency: c.freq });
      return { ...c, r: isBacktestError(r) ? null : r };
    });
    return { end: btc.end, lump, dcaCases };
  }, []);
}

export function Backtesting() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [liveSeries, setLiveSeries] = useState<Partial<Record<PriceHistoryAssetId, PriceSeries>>>({});
  const [liveError, setLiveError] = useState<string | null>(null);

  const seriesFor = (a: PriceHistoryAssetId) => liveSeries[a] ?? getStaticSeries(a);
  const form = readForm(searchParams, seriesFor);
  const series = seriesFor(form.asset);
  const endDate = form.end && form.end < series.end ? form.end : series.end;

  const setForm = (patch: Partial<FormState>) => {
    setSearchParams(formToParams({ ...form, ...patch }), { replace: true });
  };

  // Top up with live daily prices after mount (never during render).
  useEffect(() => {
    let cancelled = false;
    loadPriceSeries(form.asset).then(({ series: s, liveError: err }) => {
      if (cancelled) return;
      setLiveSeries((prev) => ({ ...prev, [form.asset]: s }));
      setLiveError(err);
    });
    return () => {
      cancelled = true;
    };
  }, [form.asset]);

  const result = useMemo(
    () =>
      runBacktest(series, {
        initialInvestment: form.amount,
        startDate: form.start,
        endDate,
        dcaAmount: form.dcaOn ? form.dcaAmount : 0,
        dcaFrequency: form.dcaOn ? form.freq : undefined,
      }),
    [series, form.amount, form.start, endDate, form.dcaOn, form.dcaAmount, form.freq]
  );

  const landmarks = useLandmarks();
  const assetMeta = PRICE_ASSETS.find((a) => a.id === form.asset)!;
  const ok = !isBacktestError(result) ? result : null;
  const hasInvestment = form.amount > 0 || (form.dcaOn && form.dcaAmount > 0);

  const presets = [
    { label: '1 year', months: 12 },
    { label: '2 years', months: 24 },
    { label: '3 years', months: 36 },
    { label: '5 years', months: 60 },
    { label: 'All', months: 0 },
  ].map((p) => {
    const start = p.months === 0 ? series.start : addMonths(series.end, -p.months);
    return { ...p, start, available: start >= series.start };
  });

  const description =
    'What if you had invested in Bitcoin? Backtest lump sum vs DCA for BTC and ETH since 2014 on weekly price history, with drawdowns and XIRR returns.';

  const bluf = ok
    ? `${form.dcaOn ? `Investing ${formatUsd(form.amount, 0)} up front plus ${formatUsd(form.dcaAmount, 0)} ${FREQ_LABEL[form.freq].toLowerCase()}` : `${formatUsd(ok.totalInvested, 0)} invested`} in ${assetMeta.name} from ${formatIsoDate(ok.startDate)} would be worth ${formatUsd(ok.finalValue, 0)} on ${formatIsoDate(ok.endDate)}: a ${ok.profit >= 0 ? 'gain' : 'loss'} of ${formatUsd(Math.abs(ok.profit), 0)} (${formatSignedPct(ok.totalReturnPct)}) on ${formatUsd(ok.totalInvested, 0)} put in.`
    : null;

  const tableRows = ok ? samplePath(ok.path, 24) : [];

  return (
    <>
      <PageSEO
        pageKey="backtesting"
        urlPath="/backtesting"
        faqs={FAQS}
        customSchema={[
          webApplicationSchema({
            name: 'Bitcoin & Crypto Backtester',
            description,
            path: '/backtesting',
            dateModified: PAGE_UPDATED,
            featureList: ['Lump sum and DCA backtests', 'BTC since 2014, ETH since 2015', 'Max drawdown on the full price path', 'XIRR for recurring buys', 'Shareable URLs'],
          }),
          howToSchema('How to backtest a Bitcoin investment', description, HOW_STEPS),
          breadcrumbSchema('Backtesting', '/backtesting'),
        ]}
      />
      <div className="container mx-auto px-4 py-10 space-y-8">
        <header className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Bitcoin &amp; Crypto Backtesting: <span className="text-gradient">Lump Sum vs DCA</span>
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            See what a past investment in Bitcoin, Ethereum or Solana would be worth today, bought all at once or in
            regular amounts (dollar-cost averaging). Results use real weekly prices since 2014 and show the return, the
            annualised return and the worst drop along the way.
          </p>
          <div className="mt-3">
            <LastUpdated date={PAGE_UPDATED}>
              {' '}· Price data through {series.end} · {series.live ? 'daily CoinGecko prices for the last 12 months' : PRICE_HISTORY_SOURCES}
            </LastUpdated>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          <section aria-labelledby="bt-inputs" className="lg:col-span-1">
            <form className="glass-card p-6 space-y-5 lg:sticky lg:top-24" onSubmit={(e) => e.preventDefault()}>
              <h2 id="bt-inputs" className="text-lg font-semibold text-white">Backtest settings</h2>

              <div>
                <label htmlFor="bt-asset" className="block text-sm text-gray-300 mb-1">Asset</label>
                <select
                  id="bt-asset"
                  value={form.asset}
                  onChange={(e) => {
                    const a = e.target.value as PriceHistoryAssetId;
                    const s = seriesFor(a);
                    setForm({ asset: a, start: form.start < s.start ? s.start : form.start });
                  }}
                  className={inputClass}
                >
                  {PRICE_ASSETS.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.symbol}) · from {getStaticSeries(a.id).start.slice(0, 7)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="bt-amount" className="block text-sm text-gray-300 mb-1">One-off amount on the start date ($)</label>
                <input
                  id="bt-amount"
                  type="number"
                  min={0}
                  step="any"
                  value={form.amount}
                  onChange={(e) => setForm({ amount: Math.max(0, Number(e.target.value) || 0) })}
                  className={inputClass}
                />
              </div>

              <fieldset>
                <legend className="block text-sm text-gray-300 mb-2">Period</legend>
                <div className="flex flex-wrap gap-2 mb-3">
                  {presets.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      disabled={!p.available}
                      aria-pressed={form.start === p.start && !form.end}
                      onClick={() => setForm({ start: p.start, end: '' })}
                      className={cn(
                        'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                        !p.available
                          ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                          : form.start === p.start && !form.end
                            ? 'bg-brand-primary text-white'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="bt-start" className="block text-xs text-gray-400 mb-1">Start</label>
                    <input id="bt-start" type="date" value={form.start} min={series.start} max={series.end} onChange={(e) => setForm({ start: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="bt-end" className="block text-xs text-gray-400 mb-1">End</label>
                    <input id="bt-end" type="date" value={form.end || series.end} min={series.start} max={series.end} onChange={(e) => setForm({ end: e.target.value === series.end ? '' : e.target.value })} className={inputClass} />
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">{assetMeta.name} data: {series.start} to {series.end}.</p>
              </fieldset>

              <div>
                <button
                  type="button"
                  aria-pressed={form.dcaOn}
                  onClick={() => setForm({ dcaOn: !form.dcaOn })}
                  className={cn(
                    'w-full py-2.5 rounded-lg font-medium transition-colors',
                    form.dcaOn ? 'bg-brand-primary text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  )}
                >
                  {form.dcaOn ? 'Recurring buy: on' : 'Add a recurring buy (DCA)'}
                </button>
                {form.dcaOn && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div>
                      <label htmlFor="bt-dca" className="block text-xs text-gray-400 mb-1">Amount ($)</label>
                      <input id="bt-dca" type="number" min={1} step="any" value={form.dcaAmount} onChange={(e) => setForm({ dcaAmount: Math.max(0, Number(e.target.value) || 0) })} className={inputClass} />
                    </div>
                    <div>
                      <label htmlFor="bt-freq" className="block text-xs text-gray-400 mb-1">How often</label>
                      <select id="bt-freq" value={form.freq} onChange={(e) => setForm({ freq: e.target.value as DcaFrequency })} className={inputClass}>
                        {FREQS.map((f) => (
                          <option key={f} value={f}>{FREQ_LABEL[f]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">Results update as you type. Copy the page URL to share this backtest.</p>
            </form>
          </section>

          <section aria-labelledby="bt-results" aria-live="polite" className="lg:col-span-2 space-y-6">
            <h2 id="bt-results" className="text-2xl font-bold text-white">Results</h2>
            {liveError && (
              <p className="text-xs text-gray-500">{liveError}</p>
            )}
            {!hasInvestment ? (
              <div className="glass-card p-6 text-gray-300">Enter a one-off amount or turn on a recurring buy to see results.</div>
            ) : isBacktestError(result) ? (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex gap-2" role="alert">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" aria-hidden="true" />
                <p className="text-sm text-red-200">{result.error}</p>
              </div>
            ) : ok ? (
              <>
                {ok.coverage.clamped && (
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" aria-hidden="true" />
                    <p className="text-sm text-amber-100">
                      Data for {assetMeta.name} covers {ok.coverage.dataStart} to {ok.coverage.dataEnd}, so this backtest runs
                      {' '}{ok.startDate} to {ok.endDate} instead of the dates you entered.
                    </p>
                  </div>
                )}

                <div className="glass-card p-6">
                  <p className="text-gray-100 leading-relaxed">{bluf}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="glass-card p-4">
                    <p className="text-gray-400 text-sm mb-1">Money invested</p>
                    <p className="text-xl font-bold text-white">{formatUsd(ok.totalInvested, 0)}</p>
                    <p className="text-xs text-gray-500">{ok.buys.length} buy{ok.buys.length === 1 ? '' : 's'}</p>
                  </div>
                  <div className="glass-card p-4">
                    <p className="text-gray-400 text-sm mb-1">Final value</p>
                    <p className={cn('text-xl font-bold', ok.profit >= 0 ? 'text-green-400' : 'text-red-400')}>{formatUsd(ok.finalValue, 0)}</p>
                  </div>
                  <div className="glass-card p-4">
                    <p className="text-gray-400 text-sm mb-1">Total return</p>
                    <p className={cn('text-xl font-bold', ok.totalReturnPct >= 0 ? 'text-green-400' : 'text-red-400')}>{formatSignedPct(ok.totalReturnPct)}</p>
                  </div>
                  <div className="glass-card p-4">
                    <p className="text-gray-400 text-sm mb-1">Annualised ({ok.annualizedMethod === 'xirr' ? 'XIRR' : 'CAGR'})</p>
                    <p className={cn('text-xl font-bold', (ok.annualizedReturnPct ?? 0) >= 0 ? 'text-green-400' : 'text-red-400')}>
                      {ok.annualizedReturnPct === null ? '—' : `${formatSignedPct(ok.annualizedReturnPct)}/yr`}
                    </p>
                    {ok.annualizedReturnPct === null && <p className="text-xs text-gray-500">Window under 30 days</p>}
                  </div>
                </div>

                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Value vs money invested</h3>
                  <ValueChart points={ok.path} label={`Value of the ${assetMeta.name} investment against money invested, ${ok.startDate} to ${ok.endDate}`} />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="glass-card p-6">
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                      {ok.profit >= 0 ? <TrendingUp className="w-5 h-5 text-green-400" aria-hidden="true" /> : <TrendingDown className="w-5 h-5 text-red-400" aria-hidden="true" />}
                      What you held
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between"><dt className="text-gray-400">{assetMeta.symbol} accumulated</dt><dd className="text-white">{ok.units.toLocaleString(undefined, { maximumFractionDigits: 6 })}</dd></div>
                      <div className="flex justify-between"><dt className="text-gray-400">Average cost per {assetMeta.symbol}</dt><dd className="text-white">{formatUsd(ok.averageCost)}</dd></div>
                      <div className="flex justify-between"><dt className="text-gray-400">Price at start / end</dt><dd className="text-white">{formatUsd(ok.startPrice, 0)} / {formatUsd(ok.endPrice, 0)}</dd></div>
                      <div className="flex justify-between"><dt className="text-gray-400">Profit / loss</dt><dd className={ok.profit >= 0 ? 'text-green-400' : 'text-red-400'}>{ok.profit >= 0 ? '+' : '-'}{formatUsd(Math.abs(ok.profit), 0)}</dd></div>
                    </dl>
                  </div>
                  <div className="glass-card p-6">
                    <h3 className="font-semibold text-white mb-3">Risk along the way</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-gray-400">Largest {assetMeta.symbol} price drop</dt>
                        <dd className="text-red-400 text-right">-{ok.priceMaxDrawdownPct.toFixed(1)}%<span className="block text-xs text-gray-500">{ok.priceDrawdownPeakDate} → {ok.priceDrawdownTroughDate}</span></dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-gray-400">Worst paper loss on your money</dt>
                        <dd className={cn('text-right', ok.worstPaperLoss < 0 ? 'text-red-400' : 'text-gray-300')}>
                          {ok.worstPaperLoss < 0 ? `${formatUsd(ok.worstPaperLoss, 0)} (${ok.worstPaperLossPct.toFixed(1)}%)` : 'Never below cost'}
                          {ok.worstPaperLoss < 0 && <span className="block text-xs text-gray-500">{ok.worstPaperLossDate}</span>}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-gray-400">Highest {assetMeta.symbol} price in this window</dt>
                        <dd className="text-white text-right">{formatUsd(ok.windowHighPrice, 0)}<span className="block text-xs text-gray-500">{ok.windowHighDate}</span></dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {ok.lumpSumComparison && (
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Your plan vs one lump sum on day one</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { name: 'Your plan', value: ok.finalValue, ret: ok.totalReturnPct, ann: ok.annualizedReturnPct, better: ok.finalValue >= ok.lumpSumComparison.finalValue },
                        { name: `${formatUsd(ok.totalInvested, 0)} lump sum on ${ok.startDate}`, value: ok.lumpSumComparison.finalValue, ret: ok.lumpSumComparison.totalReturnPct, ann: ok.lumpSumComparison.annualizedReturnPct, better: ok.lumpSumComparison.finalValue > ok.finalValue },
                      ].map((c) => (
                        <div key={c.name} className={cn('p-4 rounded-lg', c.better ? 'bg-green-500/10 border border-green-500/30' : 'bg-white/5')}>
                          <p className="font-medium text-white mb-1">{c.name}{c.better && <span className="ml-2 text-xs text-green-300">ended higher</span>}</p>
                          <p className={cn('text-2xl font-bold', c.ret >= 0 ? 'text-green-400' : 'text-red-400')}>{formatUsd(c.value, 0)}</p>
                          <p className="text-sm text-gray-400">{formatSignedPct(c.ret)} total · {c.ann === null ? '—' : `${formatSignedPct(c.ann)}/yr`}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-sm text-gray-300 flex gap-2">
                      <Info className="w-4 h-4 text-blue-300 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      {ok.lumpSumComparison.finalValue > ok.finalValue
                        ? `A lump sum ended higher because ${assetMeta.name} finished well above its early prices, so money invested on day one had longer to grow. That is the usual result when prices rise over the period.`
                        : `Spreading the buys ended higher because much of the money bought after prices had fallen below the starting level. DCA tends to win when prices drop or move sideways after you start.`}
                    </p>
                  </div>
                )}

                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-1">Timeline</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    Showing {tableRows.length} evenly spaced dates out of {ok.path.length} price points and {ok.buys.length} buys.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <caption className="sr-only">Invested amount and value over time</caption>
                      <thead className="bg-white/5">
                        <tr>
                          <th scope="col" className="text-left px-3 py-2 text-gray-400">Date</th>
                          <th scope="col" className="text-right px-3 py-2 text-gray-400">{assetMeta.symbol} price</th>
                          <th scope="col" className="text-right px-3 py-2 text-gray-400">Invested</th>
                          <th scope="col" className="text-right px-3 py-2 text-gray-400">Value</th>
                          <th scope="col" className="text-right px-3 py-2 text-gray-400">Profit/loss</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {tableRows.map((p) => {
                          const pl = p.value - p.invested;
                          return (
                            <tr key={p.date}>
                              <td className="px-3 py-2 text-white">{p.date}</td>
                              <td className="px-3 py-2 text-right text-gray-300">{formatUsd(p.price, p.price < 10 ? 2 : 0)}</td>
                              <td className="px-3 py-2 text-right text-gray-300">{formatUsd(p.invested, 0)}</td>
                              <td className="px-3 py-2 text-right text-white">{formatUsd(p.value, 0)}</td>
                              <td className={cn('px-3 py-2 text-right', pl >= 0 ? 'text-green-400' : 'text-red-400')}>{pl >= 0 ? '+' : '-'}{formatUsd(Math.abs(pl), 0)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </section>
        </div>

        <section aria-labelledby="landmarks-heading" className="glass-card p-6 md:p-8">
          <h2 id="landmarks-heading" className="text-2xl font-bold text-white mb-2">What $1,000 in Bitcoin became</h2>
          <p className="text-gray-400 mb-4">
            $1,000 of BTC bought on January 1 of each year, valued on {formatIsoDate(landmarks.end)} (bundled weekly data, no fees).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-white/10">
                  <th scope="col" className="text-left py-2 pr-4">Bought Jan 1</th>
                  <th scope="col" className="text-right py-2 pr-4">BTC price then</th>
                  <th scope="col" className="text-right py-2 pr-4">Worth now</th>
                  <th scope="col" className="text-right py-2 pr-4">Total return</th>
                  <th scope="col" className="text-right py-2">Per year</th>
                </tr>
              </thead>
              <tbody>
                {landmarks.lump.map(({ year, r }) =>
                  r ? (
                    <tr key={year} className="border-b border-white/5 text-gray-300">
                      <td className="py-2 pr-4 text-white">{year}</td>
                      <td className="py-2 pr-4 text-right">{formatUsd(r.startPrice, 0)}</td>
                      <td className={cn('py-2 pr-4 text-right', r.profit >= 0 ? 'text-green-400' : 'text-red-400')}>{formatUsd(r.finalValue, 0)}</td>
                      <td className="py-2 pr-4 text-right">{formatSignedPct(r.totalReturnPct, 0)}</td>
                      <td className="py-2 text-right">{r.annualizedReturnPct === null ? '—' : formatSignedPct(r.annualizedReturnPct)}</td>
                    </tr>
                  ) : null
                )}
              </tbody>
            </table>
          </div>
          <h3 className="text-lg font-semibold text-white mt-8 mb-3">Recurring-buy examples</h3>
          <ul className="space-y-2 text-gray-300">
            {landmarks.dcaCases.map((c) =>
              c.r ? (
                <li key={c.label}>
                  <span className="text-white font-medium">{c.label}:</span> {formatUsd(c.r.totalInvested, 0)} invested became{' '}
                  {formatUsd(c.r.finalValue, 0)} ({formatSignedPct(c.r.totalReturnPct, 0)}; XIRR {formatSignedPct(c.r.annualizedReturnPct)}/yr).
                </li>
              ) : null
            )}
          </ul>
        </section>

        <HowItWorks
          title="How the backtest is calculated"
          steps={HOW_STEPS}
          intro={<p>Every buy converts dollars to coins at that day’s price; the final value is coins held × the price on the end date.</p>}
        >
          <p>
            <strong className="text-white">Prices.</strong> {PRICE_HISTORY_SOURCES}; generated {PRICE_HISTORY_GENERATED}. With weekly
            points, prices between Mondays are interpolated, so a daily DCA is approximate. When live data loads, the last 12 months
            use daily closes.
          </p>
          <p>
            <strong className="text-white">Largest price drop</strong> is the biggest peak-to-trough fall in the asset’s price inside
            your window. <strong className="text-white">Worst paper loss</strong> is the lowest point of value minus money invested.
            <strong className="text-white"> Annualised return</strong> is CAGR for a single buy and XIRR (money-weighted) when there are
            recurring buys. Trading fees, spreads and taxes are not included.
          </p>
        </HowItWorks>

        <FaqSection faqs={FAQS} />

        <RelatedLinks
          links={[
            { to: '/calculators', label: 'DCA calculator', description: 'Quick recurring-buy results for BTC, ETH and SOL.' },
            { to: '/learn/dca-strategies', label: 'DCA strategies guide', description: 'How dollar-cost averaging works and when it helps.' },
            { to: '/calculators?type=tax', label: 'Crypto tax calculator', description: 'Estimate tax if you sold at today’s price.' },
            { to: '/retirement-calculator', label: 'Crypto retirement calculator', description: 'Test crypto in a long-term plan with Monte Carlo.' },
          ]}
        />

        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex gap-2">
          <BarChart3 className="w-5 h-5 text-yellow-300 flex-shrink-0" aria-hidden="true" />
          <p className="text-sm text-yellow-100">
            Educational tool, not financial advice. Past performance does not predict future results; crypto prices can fall
            80% or more. Results exclude fees and taxes.
          </p>
        </div>
      </div>
    </>
  );
}
