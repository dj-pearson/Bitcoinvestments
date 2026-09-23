/**
 * Crypto Retirement Calculator page (/retirement-calculator).
 *
 * Free, runs entirely in the browser. Engine and assumptions are documented in
 * src/services/retirementCalculator.ts. Scenarios are saved to this browser's
 * localStorage only (no account needed); inputs are mirrored into the URL so a
 * result can be shared.
 */

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PiggyBank, Calculator, AlertCircle, Download, Info, RefreshCw, Save, Trash2, Link2 } from 'lucide-react';
import { PageSEO } from '../components/PageSEO';
import { FaqSection, HowItWorks, LastUpdated, RelatedLinks } from '../components/calculators/CalculatorContent';
import {
  breadcrumbSchema,
  howToSchema,
  webApplicationSchema,
  type FaqItem,
  type HowToStep,
} from '../components/calculators/calculatorSchema';
import {
  DEFAULT_RETIREMENT_INPUTS,
  calculateRetirement,
  exportResultJson,
  formatCurrency,
  getSuccessColor,
  medianRealReturns,
  validateInputs,
  STOCK_VOLATILITY,
  BOND_VOLATILITY,
  type RetirementPlanInputs,
  type RetirementResult,
  type NonCryptoAccountType,
} from '../services/retirementCalculator';
import { FILING_STATUSES, FILING_STATUS_LABELS, TAX_DATA_META, DEFAULT_TAX_YEAR, isFilingStatus } from '../data/taxBrackets';
import { STATE_TAX_TABLE, STATE_TAX_BY_CODE } from '../data/stateTaxRates';
import { cn } from '../lib/utils';

const PAGE_UPDATED = '2026-09-23';
const STORAGE_KEY = 'bitcoinvestments.retirementScenarios.v1';

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary';
const labelClass = 'block text-sm font-medium text-gray-300 mb-1';

// Short URL keys for every numeric input (percent-style inputs are stored as whole percents).
const NUM_PARAMS: { key: string; field: keyof RetirementPlanInputs; pct?: boolean }[] = [
  { key: 'age', field: 'current_age' },
  { key: 'retire', field: 'retirement_age' },
  { key: 'to', field: 'life_expectancy' },
  { key: 'sav', field: 'current_savings' },
  { key: 'cr', field: 'current_crypto' },
  { key: 'crb', field: 'crypto_cost_basis' },
  { key: 'mo', field: 'monthly_contribution' },
  { key: 'crp', field: 'crypto_contribution_percent' },
  { key: 'cg', field: 'contribution_growth' },
  { key: 'inc', field: 'desired_annual_income' },
  { key: 'ss', field: 'social_security_income' },
  { key: 'ssa', field: 'social_security_start_age' },
  { key: 'oth', field: 'other_income' },
  { key: 'inf', field: 'inflation_rate', pct: true },
  { key: 'stk', field: 'stock_return', pct: true },
  { key: 'bnd', field: 'bond_return', pct: true },
  { key: 'stp', field: 'stock_percent' },
  { key: 'crr', field: 'crypto_return', pct: true },
  { key: 'crv', field: 'crypto_volatility', pct: true },
];

function inputsFromParams(params: URLSearchParams): RetirementPlanInputs {
  const next: RetirementPlanInputs = { ...DEFAULT_RETIREMENT_INPUTS };
  for (const { key, field, pct } of NUM_PARAMS) {
    const raw = params.get(key);
    if (raw === null || raw.trim() === '') continue;
    const n = Number(raw);
    if (Number.isFinite(n)) (next[field] as number) = pct ? n / 100 : n;
  }
  const fs = params.get('fs');
  if (isFilingStatus(fs)) next.filing_status = fs;
  const st = params.get('st');
  if (st && STATE_TAX_BY_CODE[st]) next.state = st;
  const acct = params.get('acct');
  if (acct === 'pre_tax' || acct === 'roth' || acct === 'taxable') next.account_type = acct;
  return next;
}

function inputsToParams(inputs: RetirementPlanInputs): URLSearchParams {
  const p = new URLSearchParams();
  for (const { key, field, pct } of NUM_PARAMS) {
    const v = inputs[field] as number;
    p.set(key, String(pct ? Math.round(v * 10000) / 100 : v));
  }
  p.set('fs', inputs.filing_status);
  p.set('st', inputs.state);
  p.set('acct', inputs.account_type);
  return p;
}

interface SavedScenario {
  name: string;
  savedOn: string;
  inputs: RetirementPlanInputs;
}

const FAQS: FaqItem[] = [
  {
    question: 'How much crypto should I hold for retirement?',
    answer:
      'There is no standard answer. Advisers who include crypto commonly suggest a small share of a retirement portfolio, such as 1-5%, because a 70-80% fall has happened several times. Use the "crypto share of monthly saving" slider and the what-if results to see how different amounts change your odds.',
  },
  {
    question: 'What does "chance of success" mean?',
    answer:
      'It is the share of 1,000 simulated futures in which your savings paid for your planned spending every year until your plan-to age. Each simulation draws random yearly returns for stocks/bonds and for crypto from lognormal distributions built from your average-return and volatility assumptions.',
  },
  {
    question: 'Why is the crypto line in the table growing slowly when I entered a high return?',
    answer:
      'The year-by-year table uses the median (typical) outcome, which for a volatile asset is well below the average. With a 15% average and 55% volatility the median yearly growth is only about 4% before inflation (about 1% after 2.5% inflation), because big losses need even bigger gains to recover (volatility drag). The Monte Carlo includes the rare very good outcomes that pull the average up.',
  },
  {
    question: 'Are the results in today’s dollars?',
    answer:
      'Yes. Every amount is in today’s purchasing power. Returns you enter are converted to after-inflation returns, and spending, Social Security and tax brackets stay in today’s dollars, which matches how Social Security and federal brackets are indexed to inflation.',
  },
  {
    question: 'How are taxes in retirement estimated?',
    answer: `Withdrawals are grossed up for federal tax using the ${DEFAULT_TAX_YEAR} brackets and standard deduction for your filing status, with crypto gains taxed at the 0/15/20% long-term rates stacked on other income, up to 85% of Social Security taxable, and a simplified state tax at your state’s top rate. Pre-tax (traditional) savings are taxed as ordinary income; Roth withdrawals are tax-free.`,
  },
  {
    question: 'Is this financial advice?',
    answer:
      'No. It is an educational model with simplified assumptions. It does not know your full tax situation, required minimum distributions, healthcare costs or how your crypto is held. Talk to a fee-only fiduciary adviser before making retirement decisions.',
  },
];

const HOW_STEPS: HowToStep[] = [
  { name: 'Enter your ages and savings', text: 'Current age, planned retirement age, the age to plan to, what you have saved outside crypto and what your crypto is worth today (plus what you paid for it).' },
  { name: 'Enter what you save each month', text: 'Your total monthly saving and the share of it that buys crypto. The rest goes into a stock/bond mix you choose.' },
  { name: 'Enter retirement spending and income', text: 'Yearly spending in today’s dollars, expected Social Security and the age it starts, and any other inflation-adjusted income.' },
  { name: 'Check the assumptions', text: 'Inflation, stock and bond returns, and crypto’s average return and volatility. The defaults are documented in the assumptions table.' },
  { name: 'Calculate and compare', text: 'Read the chance of success, the savings you are projected to have versus what you need, and the what-if scenarios. Save or share the scenario.' },
];

export default function RetirementCalculatorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputs, setInputs] = useState<RetirementPlanInputs>(() => inputsFromParams(searchParams));
  const [result, setResult] = useState<RetirementResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [saved, setSaved] = useState<SavedScenario[]>([]);
  const [scenarioName, setScenarioName] = useState('');
  const [storageNote, setStorageNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const errors = useMemo(() => validateInputs(inputs), [inputs]);
  const errorFor = (field: keyof RetirementPlanInputs) => errors.find((e) => e.field === field)?.message;

  const update = <K extends keyof RetirementPlanInputs>(key: K, value: RetirementPlanInputs[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  const runCalculation = useCallback(
    (next: RetirementPlanInputs) => {
      if (validateInputs(next).length > 0) return;
      setIsCalculating(true);
      // Yield a frame so the button state paints before the ~200 ms simulation.
      setTimeout(() => {
        setResult(calculateRetirement(next));
        setIsCalculating(false);
      }, 0);
    },
    []
  );

  // First result with the (URL or default) inputs, and load saved scenarios.
  // Deferred to a timer so the page (H1, form, content) paints first.
  useEffect(() => {
    const id = setTimeout(() => {
      if (validateInputs(inputs).length === 0) setResult(calculateRetirement(inputs));
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as SavedScenario[];
          if (Array.isArray(parsed)) setSaved(parsed);
        }
      } catch {
        setStorageNote('Saved scenarios are unavailable in this browser (storage is blocked).');
      }
    }, 0);
    return () => clearTimeout(id);
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (list: SavedScenario[]) => {
    setSaved(list);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      setStorageNote(null);
    } catch {
      setStorageNote('Could not save: this browser is blocking local storage.');
    }
  };

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (errors.length > 0) return;
    setSearchParams(inputsToParams(inputs), { replace: true });
    runCalculation(inputs);
  }

  function handleSave() {
    const name = scenarioName.trim() || `Scenario ${saved.length + 1}`;
    const savedOn = new Date().toISOString().slice(0, 10);
    persist([{ name, savedOn, inputs }, ...saved.filter((s) => s.name !== name)].slice(0, 20));
    setScenarioName('');
  }

  function handleLoad(s: SavedScenario) {
    const merged = { ...DEFAULT_RETIREMENT_INPUTS, ...s.inputs };
    setInputs(merged);
    setSearchParams(inputsToParams(merged), { replace: true });
    runCalculation(merged);
  }

  async function handleCopyLink() {
    setSearchParams(inputsToParams(inputs), { replace: true });
    try {
      const url = `${window.location.origin}${window.location.pathname}?${inputsToParams(inputs).toString()}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function handleExport() {
    if (!result) return;
    const today = new Date().toISOString().slice(0, 10);
    const blob = new Blob([exportResultJson(result, today)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retirement-projection-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const medians = useMemo(() => medianRealReturns(inputs), [inputs]);
  const stateInfo = STATE_TAX_BY_CODE[inputs.state];

  const description =
    'Model crypto in your retirement plan: Monte Carlo success odds, today’s-dollar projections, 2026 tax brackets, Social Security and what-if scenarios.';

  const numberField = (
    field: keyof RetirementPlanInputs,
    label: string,
    opts: { pct?: boolean; step?: string; min?: number; max?: number; hint?: string } = {}
  ) => {
    const id = `ret-${field}`;
    const raw = inputs[field] as number;
    const value = opts.pct ? Math.round(raw * 10000) / 100 : raw;
    const err = errorFor(field);
    return (
      <div>
        <label htmlFor={id} className={labelClass}>{label}</label>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step={opts.step ?? 'any'}
          min={opts.min}
          max={opts.max}
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => {
            const n = e.target.value === '' ? NaN : Number(e.target.value);
            update(field, (opts.pct ? n / 100 : n) as RetirementPlanInputs[typeof field]);
          }}
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? `${id}-err` : opts.hint ? `${id}-hint` : undefined}
          className={cn(inputClass, err && 'border-red-500/60')}
        />
        {err ? (
          <p id={`${id}-err`} className="text-xs text-red-400 mt-1">{err}</p>
        ) : opts.hint ? (
          <p id={`${id}-hint`} className="text-xs text-gray-500 mt-1">{opts.hint}</p>
        ) : null}
      </div>
    );
  };

  const fundingLabel = !result
    ? null
    : !Number.isFinite(result.funding_ratio)
      ? { text: 'Covered by guaranteed income', color: 'text-green-400' }
      : result.funding_ratio >= 1
        ? { text: 'On track', color: 'text-green-400' }
        : result.funding_ratio >= 0.8
          ? { text: 'Close', color: 'text-yellow-400' }
          : { text: 'Needs attention', color: 'text-red-400' };

  const summarySentence = result
    ? result.total_needed_at_retirement === 0
      ? `Your Social Security and other income cover almost all of your planned spending, so very little savings are needed. You are projected to have ${formatCurrency(result.projected_savings_at_retirement)} (today’s dollars) at ${inputs.retirement_age}.`
      : `At median returns you are projected to have ${formatCurrency(result.projected_savings_at_retirement)} (today’s dollars) at ${inputs.retirement_age}, against about ${formatCurrency(result.total_needed_at_retirement)} needed to fund ${formatCurrency(inputs.desired_annual_income)} a year to age ${inputs.life_expectancy}. In ${result.monte_carlo.success_probability.toFixed(0)}% of 1,000 simulated markets the money lasted${result.depletion_age ? `; on the median path it runs out at ${result.depletion_age}` : ''}.`
    : null;

  const maxValue = result ? Math.max(1, ...result.yearly.map((y) => y.portfolio_value)) : 1;
  const chartRows = result ? result.yearly.filter((_, i) => i % 3 === 0) : [];

  return (
    <>
      <PageSEO
        pageKey="retirementCalculator"
        urlPath="/retirement-calculator"
        faqs={FAQS}
        customSchema={[
          webApplicationSchema({
            name: 'Crypto Retirement Calculator',
            description,
            path: '/retirement-calculator',
            dateModified: PAGE_UPDATED,
            featureList: ['Monte Carlo simulation (1,000 runs)', 'Today’s-dollar projections', `${DEFAULT_TAX_YEAR} federal brackets and state tax`, 'What-if scenarios', 'Shareable links and browser-saved scenarios'],
          }),
          howToSchema('How to estimate whether crypto fits your retirement plan', description, HOW_STEPS),
          breadcrumbSchema('Retirement Calculator', '/retirement-calculator'),
        ]}
      />
      <div className="container mx-auto px-4 py-10 space-y-8">
        <header className="max-w-3xl">
          <div className="flex items-center gap-3 mb-3">
            <PiggyBank className="h-8 w-8 text-brand-primary" aria-hidden="true" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">Crypto Retirement Calculator</h1>
          </div>
          <p className="text-lg text-gray-300 leading-relaxed">
            Enter your savings, monthly contributions and planned spending to see how likely your money is to last,
            with and without crypto. The calculator runs 1,000 simulated markets, works in today’s dollars and
            applies {DEFAULT_TAX_YEAR} tax brackets. It is free and runs in your browser.
          </p>
          <div className="mt-3">
            <LastUpdated date={PAGE_UPDATED}>
              {' '}· Tax rates verified {TAX_DATA_META.lastVerified}
            </LastUpdated>
          </div>
        </header>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Inputs */}
          <section aria-labelledby="inputs-heading" className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6" noValidate>
              <h2 id="inputs-heading" className="text-xl font-bold text-white">Your plan</h2>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-brand-primary mb-2">Ages</legend>
                <div className="grid grid-cols-3 gap-3">
                  {numberField('current_age', 'Current age', { step: '1', min: 16 })}
                  {numberField('retirement_age', 'Retire at', { step: '1' })}
                  {numberField('life_expectancy', 'Plan to age', { step: '1' })}
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-brand-primary mb-2">Savings today</legend>
                <div className="grid grid-cols-2 gap-3">
                  {numberField('current_savings', 'Non-crypto savings ($)', { min: 0 })}
                  {numberField('current_crypto', 'Crypto value ($)', { min: 0 })}
                </div>
                {numberField('crypto_cost_basis', 'What you paid for that crypto ($)', { min: 0, hint: 'Used to estimate the taxable gain when you sell in retirement.' })}
                <div>
                  <label htmlFor="ret-account_type" className={labelClass}>Non-crypto savings are mostly</label>
                  <select
                    id="ret-account_type"
                    value={inputs.account_type}
                    onChange={(e) => update('account_type', e.target.value as NonCryptoAccountType)}
                    className={inputClass}
                  >
                    <option value="pre_tax">Pre-tax (traditional 401(k)/IRA)</option>
                    <option value="roth">Roth (tax-free withdrawals)</option>
                    <option value="taxable">Taxable brokerage account</option>
                  </select>
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-brand-primary mb-2">Saving each month</legend>
                <div className="grid grid-cols-2 gap-3">
                  {numberField('monthly_contribution', 'Total monthly saving ($)', { min: 0 })}
                  {numberField('contribution_growth', 'Raise it each year by (%)', { hint: 'After inflation.' })}
                </div>
                <div>
                  <label htmlFor="ret-crypto-share" className={labelClass}>
                    Crypto share of monthly saving: {inputs.crypto_contribution_percent}%
                  </label>
                  <input
                    id="ret-crypto-share"
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={inputs.crypto_contribution_percent}
                    onChange={(e) => update('crypto_contribution_percent', Number(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ${Math.round((inputs.monthly_contribution * inputs.crypto_contribution_percent) / 100).toLocaleString()} a month to crypto,
                    ${Math.round(inputs.monthly_contribution * (1 - inputs.crypto_contribution_percent / 100)).toLocaleString()} to stocks/bonds.
                  </p>
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-brand-primary mb-2">Retirement (today’s dollars)</legend>
                {numberField('desired_annual_income', 'Yearly spending in retirement ($)', { min: 0 })}
                <div className="grid grid-cols-2 gap-3">
                  {numberField('social_security_income', 'Social Security per year ($)', { min: 0, hint: 'Your estimate at ssa.gov/myaccount.' })}
                  {numberField('social_security_start_age', 'Starts at age', { step: '1', min: 62, max: 70 })}
                </div>
                {numberField('other_income', 'Other inflation-adjusted income per year ($)', { min: 0 })}
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-brand-primary mb-2">Taxes</legend>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="ret-fs" className={labelClass}>Filing status</label>
                    <select id="ret-fs" value={inputs.filing_status} onChange={(e) => update('filing_status', e.target.value as RetirementPlanInputs['filing_status'])} className={inputClass}>
                      {FILING_STATUSES.map((s) => (
                        <option key={s} value={s}>{FILING_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="ret-state" className={labelClass}>State</label>
                    <select id="ret-state" value={inputs.state} onChange={(e) => update('state', e.target.value)} className={inputClass}>
                      {STATE_TAX_TABLE.map((s) => (
                        <option key={s.code} value={s.code}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {stateInfo?.note && <p className="text-xs text-gray-500">{stateInfo.note}</p>}
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-brand-primary mb-2">Assumptions (yearly, before inflation)</legend>
                <div className="grid grid-cols-2 gap-3">
                  {numberField('inflation_rate', 'Inflation (%)', { pct: true, step: '0.1' })}
                  {numberField('stock_percent', 'Stocks in non-crypto mix (%)', { step: '1', min: 0, max: 100 })}
                  {numberField('stock_return', 'Stock return (%)', { pct: true, step: '0.1' })}
                  {numberField('bond_return', 'Bond return (%)', { pct: true, step: '0.1' })}
                  {numberField('crypto_return', 'Crypto average return (%)', { pct: true, step: '0.5' })}
                  {numberField('crypto_volatility', 'Crypto volatility (%)', { pct: true, step: '1' })}
                </div>
                <p className="text-xs text-gray-500">
                  Median yearly growth after inflation implied by these: {(medians.traditional * 100).toFixed(1)}% for the
                  stock/bond mix, {(medians.crypto * 100).toFixed(1)}% for crypto.
                </p>
              </fieldset>

              <button
                type="submit"
                disabled={isCalculating || errors.length > 0}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-brand-primary text-white font-semibold hover:bg-brand-primary/90 disabled:opacity-50"
              >
                {isCalculating ? <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Calculator className="h-5 w-5" aria-hidden="true" />}
                {isCalculating ? 'Calculating…' : 'Calculate'}
              </button>
              {errors.length > 0 && (
                <p className="text-sm text-red-400" role="alert">Fix the highlighted fields to calculate.</p>
              )}
            </form>
          </section>

          {/* Results */}
          <section aria-labelledby="results-heading" aria-live="polite" className="lg:col-span-3 space-y-6">
            <h2 id="results-heading" className="text-2xl font-bold text-white">Your projection</h2>
            {!result ? (
              <div className="glass-card p-8 space-y-3" aria-busy="true">
                <div className="h-6 bg-white/5 rounded animate-pulse" />
                <div className="h-24 bg-white/5 rounded animate-pulse" />
                <div className="h-40 bg-white/5 rounded animate-pulse" />
              </div>
            ) : (
              <>
                <div className="glass-card p-6">
                  <p className="text-gray-200 leading-relaxed">{summarySentence}</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="glass-card p-6 text-center">
                    <p className="text-sm text-gray-400">Chance of success</p>
                    <p className={cn('text-5xl font-bold my-2', getSuccessColor(result.monte_carlo.success_probability))}>
                      {result.monte_carlo.success_probability.toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      Share of {result.monte_carlo.simulations.toLocaleString()} simulations where savings covered spending to age {inputs.life_expectancy}.
                      {result.monte_carlo.median_depletion_age && ` When they fell short, the median age money ran out was ${result.monte_carlo.median_depletion_age}.`}
                    </p>
                  </div>
                  <dl className="glass-card p-6 space-y-3">
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-400">Projected at {inputs.retirement_age}</dt>
                      <dd className="font-bold text-white">{formatCurrency(result.projected_savings_at_retirement)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-400">Needed at {inputs.retirement_age}</dt>
                      <dd className="font-bold text-white">{formatCurrency(result.total_needed_at_retirement)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-400">Funding ratio</dt>
                      <dd className={cn('font-bold', fundingLabel?.color)}>
                        {Number.isFinite(result.funding_ratio) ? `${(result.funding_ratio * 100).toFixed(0)}%` : '—'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-400">Status</dt>
                      <dd className={cn('font-medium', fundingLabel?.color)}>{fundingLabel?.text}</dd>
                    </div>
                  </dl>
                </div>

                {result.funding_gap > 0 && (
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-sm text-yellow-100">
                      On the median path you are about <strong>{formatCurrency(result.funding_gap)}</strong> short at retirement.
                      The what-if results below show which changes help most.
                    </p>
                  </div>
                )}

                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Portfolio by age (median path, today’s dollars)</h3>
                  <div className="h-56 flex items-end gap-1" aria-hidden="true">
                    {chartRows.map((y) => {
                      const h = (y.portfolio_value / maxValue) * 100;
                      const cryptoPart = y.portfolio_value > 0 ? (y.crypto_value / y.portfolio_value) * 100 : 0;
                      return (
                        <div key={y.age} className="flex-1 flex flex-col items-center justify-end h-full">
                          <div
                            className={cn('w-full rounded-t relative', y.age >= inputs.retirement_age ? 'bg-purple-500' : 'bg-blue-500')}
                            style={{ height: `${h}%` }}
                            title={`Age ${y.age}: ${formatCurrency(y.portfolio_value)}`}
                          >
                            <div className="absolute bottom-0 w-full bg-orange-400 rounded-t" style={{ height: `${cryptoPart}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-500 mt-1">{y.age}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm text-gray-400">
                    <span className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded" />Saving years</span>
                    <span className="flex items-center gap-2"><span className="w-3 h-3 bg-purple-500 rounded" />Retirement</span>
                    <span className="flex items-center gap-2"><span className="w-3 h-3 bg-orange-400 rounded" />Crypto part</span>
                  </div>
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-brand-primary">Show the year-by-year table</summary>
                    <div className="overflow-x-auto mt-3 max-h-96">
                      <table className="w-full text-sm">
                        <caption className="sr-only">Year-by-year projection in today’s dollars</caption>
                        <thead>
                          <tr className="text-gray-400 border-b border-white/10">
                            <th scope="col" className="text-left py-2 px-2">Age</th>
                            <th scope="col" className="text-right py-2 px-2">Saved</th>
                            <th scope="col" className="text-right py-2 px-2">Withdrawn</th>
                            <th scope="col" className="text-right py-2 px-2">Of which tax</th>
                            <th scope="col" className="text-right py-2 px-2">Crypto</th>
                            <th scope="col" className="text-right py-2 px-2">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.yearly.map((y) => (
                            <tr key={y.age} className="border-b border-white/5 text-gray-300">
                              <td className="py-1 px-2">{y.age}</td>
                              <td className="py-1 px-2 text-right">{y.contributions ? formatCurrency(y.contributions) : '—'}</td>
                              <td className="py-1 px-2 text-right">{y.withdrawals ? formatCurrency(y.withdrawals) : '—'}</td>
                              <td className="py-1 px-2 text-right">{y.taxes ? formatCurrency(y.taxes) : '—'}</td>
                              <td className="py-1 px-2 text-right">{formatCurrency(y.crypto_value)}</td>
                              <td className="py-1 px-2 text-right text-white">{formatCurrency(y.portfolio_value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                </div>

                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-1">What if you changed one thing?</h3>
                  <p className="text-sm text-gray-400 mb-4">Each line re-runs the simulation with a single change.</p>
                  <ul className="space-y-3">
                    {result.what_if.map((w) => (
                      <li key={w.label} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-white/5">
                        <div>
                          <p className="font-medium text-white">{w.label}</p>
                          <p className="text-sm text-gray-400">{w.description}</p>
                        </div>
                        <p className={cn('font-bold whitespace-nowrap', w.change >= 0 ? 'text-green-400' : 'text-red-400')}>
                          {w.success_probability.toFixed(0)}% ({w.change >= 0 ? '+' : ''}{w.change.toFixed(0)} pts)
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Taxes in retirement</h3>
                  <dl className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <dt className="text-sm text-gray-400">Estimated taxes, retirement years</dt>
                      <dd className="text-2xl font-bold text-white">{formatCurrency(result.lifetime_taxes)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-400">Average tax on withdrawals</dt>
                      <dd className="text-2xl font-bold text-white">
                        {result.lifetime_withdrawals > 0 ? `${((result.lifetime_taxes / result.lifetime_withdrawals) * 100).toFixed(1)}%` : '—'}
                      </dd>
                    </div>
                  </dl>
                  <p className="text-sm text-gray-400">
                    General education, not advice: many planners draw from taxable accounts first, then pre-tax accounts, and
                    leave Roth money for last, while filling low tax brackets in early retirement (for example with Roth
                    conversions). Selling crypto held over a year is taxed at 0/15/20% long-term rates. Whether any of this fits
                    you depends on details this calculator does not model.
                  </p>
                </div>

                <div className="glass-card p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-white">Save or share this scenario</h3>
                  <div className="flex flex-wrap gap-2">
                    <label htmlFor="ret-scenario-name" className="sr-only">Scenario name</label>
                    <input
                      id="ret-scenario-name"
                      type="text"
                      placeholder="Scenario name"
                      value={scenarioName}
                      onChange={(e) => setScenarioName(e.target.value)}
                      className={cn(inputClass, 'flex-1 min-w-[10rem]')}
                      maxLength={60}
                    />
                    <button type="button" onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white">
                      <Save className="h-4 w-4" aria-hidden="true" /> Save in this browser
                    </button>
                    <button type="button" onClick={handleCopyLink} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white">
                      <Link2 className="h-4 w-4" aria-hidden="true" /> {copied ? 'Link copied' : 'Copy share link'}
                    </button>
                    <button type="button" onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white">
                      <Download className="h-4 w-4" aria-hidden="true" /> Download results (JSON)
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Scenarios are stored only in this browser. Clearing site data removes them.</p>
                  {storageNote && <p className="text-xs text-yellow-400">{storageNote}</p>}
                  {saved.length > 0 && (
                    <ul className="divide-y divide-white/10">
                      {saved.map((s) => (
                        <li key={s.name} className="flex items-center justify-between py-2 gap-3">
                          <button type="button" onClick={() => handleLoad(s)} className="text-left text-white hover:text-brand-primary">
                            {s.name} <span className="text-xs text-gray-500">saved {s.savedOn}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => persist(saved.filter((x) => x.name !== s.name))}
                            className="p-2 text-gray-400 hover:text-red-400"
                            aria-label={`Delete scenario ${s.name}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </section>
        </div>

        <HowItWorks
          title="How this calculator works"
          intro={
            <p>
              The calculator follows your savings year by year until retirement, then withdraws what your spending needs
              after Social Security and other income, plus the tax on that withdrawal. All figures are in today’s dollars.
            </p>
          }
          steps={HOW_STEPS}
        >
          <p>
            <strong className="text-white">Returns.</strong> Each year the stock/bond mix and crypto grow by a random return drawn
            from a lognormal distribution with the average and volatility you set (stocks {STOCK_VOLATILITY * 100}% and bonds{' '}
            {BOND_VOLATILITY * 100}% volatility, treated as uncorrelated). Lognormal returns can never lose more than 100%, which
            matters for a 50%+ volatility asset. The table and chart use the median return; the chance of success comes from
            1,000 random paths (the same seed each time, so identical inputs give identical results).
          </p>
          <p>
            <strong className="text-white">Needed at retirement</strong> is the smallest balance, with the same crypto share, that
            lasts to your plan-to age at median returns. <strong className="text-white">Funding ratio</strong> is projected ÷ needed.
          </p>
          <p>
            <strong className="text-white">Taxes</strong> use the {DEFAULT_TAX_YEAR} federal brackets and standard deduction for your
            filing status (verified {TAX_DATA_META.lastVerified}), long-term rates for crypto gains stacked on other income, the
            Social Security taxation formula, and your state’s top rate as a simplification. Required minimum distributions,
            Medicare premiums (IRMAA) and healthcare costs are not modelled.
          </p>
        </HowItWorks>

        <section aria-labelledby="assumptions-heading" className="glass-card p-6 md:p-8">
          <h2 id="assumptions-heading" className="text-2xl font-bold text-white mb-4">Default assumptions and where they come from</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-white/10">
                  <th scope="col" className="text-left py-2 pr-4">Assumption</th>
                  <th scope="col" className="text-left py-2 pr-4">Default</th>
                  <th scope="col" className="text-left py-2">Basis</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-white/5"><td className="py-2 pr-4">Inflation</td><td className="py-2 pr-4">2.5%</td><td className="py-2">US CPI-U averaged roughly 2.5% a year over the last 30 years (Bureau of Labor Statistics); the Fed targets 2%.</td></tr>
                <tr className="border-b border-white/5"><td className="py-2 pr-4">Stocks</td><td className="py-2 pr-4">7%, 16% volatility</td><td className="py-2">Deliberately below the ~10% average US large-cap total return since 1926, in line with lower long-run forecasts from large asset managers.</td></tr>
                <tr className="border-b border-white/5"><td className="py-2 pr-4">Bonds</td><td className="py-2 pr-4">4%, 6% volatility</td><td className="py-2">Close to current yields on intermediate US Treasury and investment-grade bond funds.</td></tr>
                <tr className="border-b border-white/5"><td className="py-2 pr-4">Crypto</td><td className="py-2 pr-4">15% average, 55% volatility</td><td className="py-2">An assumption, not a forecast. Bitcoin’s realised yearly volatility has mostly been 40-80%; there is no reliable long-run expected return, so test lower numbers too.</td></tr>
                <tr><td className="py-2 pr-4">Social Security</td><td className="py-2 pr-4">$24,000 from 67</td><td className="py-2">Near the average retired-worker benefit; get your own estimate from your SSA account.</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <FaqSection faqs={FAQS} />

        <RelatedLinks
          links={[
            { to: '/backtesting', label: 'Bitcoin backtest: lump sum vs DCA', description: 'See how buying BTC or ETH on a schedule actually played out.' },
            { to: '/calculators?type=tax', label: 'Crypto capital gains tax calculator', description: '2025/2026 brackets, NIIT and state tax on one sale.' },
            { to: '/learn/risk-management', label: 'Risk management guide', description: 'Position sizing and why crypto allocations are usually small.' },
            { to: '/learn/crypto-taxes-basics', label: 'Crypto taxes basics', description: 'How crypto sales, swaps and income are taxed in the US.' },
          ]}
        />

        <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-start gap-2">
          <Info className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-gray-400">
            Educational estimates only, not financial or tax advice. Crypto is highly volatile and can lose most of its value.
            Past returns do not predict future returns. Consult a qualified adviser for decisions about your retirement.
          </p>
        </div>
      </div>
    </>
  );
}
