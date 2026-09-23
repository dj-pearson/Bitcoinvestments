/**
 * /dca-automation: DCA Planner and recurring-buy guide.
 *
 * Plans a dollar-cost-averaging schedule in the browser (totals, dates, fee
 * drag, a user-chosen hypothetical return) and exports calendar reminders.
 * Bitcoinvestments does not execute trades; the guide explains how to set up
 * recurring buys on an exchange that offers them.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Download } from 'lucide-react';
import { PageSEO } from '../components/PageSEO';
import { FaqSection, LastUpdated, Callout } from '../components/alerts/PageParts';
import { webApplicationSchema, type FaqItem } from '../components/alerts/schema';
import { generateHowToSchema } from '../lib/seo';
import {
  DCA_FREQUENCIES,
  calculateDCAPlan,
  feeDragTable,
  generateDCAICS,
  type DCAFrequency,
} from '../services/dcaAutomation';

const LAST_UPDATED = '2026-09-23';
/** Date the exchange recurring-buy details below were last checked against each exchange's help pages. */
const EXCHANGES_VERIFIED = '2026-09-23';
const PAGE_PATH = '/dca-automation';
const STORAGE_KEY = 'bi:dca-planner:v1';
const TOOL_DESCRIPTION =
  'Free DCA planner: see total invested, number of buys, fee drag and a purchase calendar for a recurring crypto buy, and download calendar reminders.';

const DURATIONS = [3, 6, 12, 24, 36, 60];
const RETURN_PRESETS = [-50, 0, 20];
const FEE_SIZES = [10, 25, 50, 100, 250, 500];
const ASSETS = ['Bitcoin (BTC)', 'Ethereum (ETH)', 'Solana (SOL)', 'crypto'];

interface ExchangeRecurring {
  name: string;
  frequencies: string;
  notes: string;
  source: string;
}

/**
 * US platforms whose own help pages describe a recurring-buy feature.
 * Checked on EXCHANGES_VERIFIED. Fees change often, so they are deliberately
 * not quoted here; link to each fee page instead.
 */
const EXCHANGES: ExchangeRecurring[] = [
  {
    name: 'Coinbase',
    frequencies: 'Daily, weekly, monthly',
    notes: 'The first buy runs immediately when you create the schedule. To change amount or frequency you cancel and recreate it. Not every payment method is eligible.',
    source: 'https://help.coinbase.com/en/coinbase/trading-and-funding/buying-selling-or-converting-crypto/how-can-i-create-or-cancel-a-recurring-transaction',
  },
  {
    name: 'Kraken',
    frequencies: 'Daily, weekly, every 2 weeks, monthly',
    notes: 'Available in the Kraken app and website for verified accounts, not on Kraken Pro. Orders can be edited or paused.',
    source: 'https://support.kraken.com/articles/recurring-orders',
  },
  {
    name: 'Gemini',
    frequencies: 'Daily, weekly, twice monthly, monthly',
    notes: 'Set from the Market page on web or app. Not available on the ActiveTrader interface.',
    source: 'https://support.gemini.com/hc/en-us/articles/360020827411-What-is-a-recurring-buy',
  },
  {
    name: 'Robinhood',
    frequencies: 'Daily, weekly, every 2 weeks, monthly',
    notes: 'Recurring crypto investments from $1. Robinhood Crypto does not charge a commission, but prices include a spread.',
    source: 'https://robinhood.com/us/en/support/articles/recurring-investments/',
  },
  {
    name: 'Cash App',
    frequencies: 'Daily, weekly, every 2 weeks',
    notes: 'Auto Invest is bitcoin-only. Cash App says Auto Invest buys have no fee and no spread; check its fee page for current terms.',
    source: 'https://cash.app/help/us/en-us/31091-schedule-automatic-purchases',
  },
];

const HOWTO_STEPS = [
  { name: 'Pick a platform that offers recurring buys', text: 'Choose a regulated exchange or app that lists a recurring-buy or auto-invest feature for the coin you want, and read its fee page.' },
  { name: 'Verify your account and link a payment method', text: 'Recurring buys usually need a verified account and a bank account (ACH) or debit card; check which payment methods are eligible and what each costs.' },
  { name: 'Choose the coin, amount and frequency', text: 'Open the buy screen, switch from one-time to recurring, then enter the amount and pick daily, weekly, every two weeks or monthly.' },
  { name: 'Review fees before confirming', text: 'Look at the total cost of each buy, including spread and any flat fee. Small, frequent buys can cost a much higher percentage.' },
  { name: 'Confirm and note how to pause or cancel', text: 'Confirm the schedule, then find where the platform lists recurring orders so you can pause, edit or cancel them later.' },
  { name: 'Move long-term holdings to storage you control (optional)', text: 'If you plan to hold for years, consider periodically withdrawing to a wallet you control, weighing the withdrawal fee against exchange risk.' },
];

const FAQS: FaqItem[] = [
  {
    question: 'What is dollar-cost averaging (DCA) in crypto?',
    answer:
      'DCA means buying a fixed dollar amount on a fixed schedule, for example $50 of bitcoin every week, regardless of price. You buy more coins when the price is low and fewer when it is high, and you avoid trying to time the market. It does not guarantee a profit or protect against losses.',
  },
  {
    question: 'Does Bitcoinvestments buy crypto for me?',
    answer:
      'No. We do not execute trades or hold funds. This planner shows what a schedule looks like and can export calendar reminders. To automate the buys themselves, use the recurring-buy feature of an exchange you already use.',
  },
  {
    question: 'Is daily, weekly or monthly DCA better?',
    answer:
      'Over long periods the difference between daily, weekly and monthly buying is usually small. Fees matter more: if your platform charges a flat fee per purchase, many small buys can cost far more than fewer larger ones. Pick a frequency you can sustain and whose fees you understand.',
  },
  {
    question: 'Why does the planner default to a 0% return?',
    answer:
      'Because nobody knows future returns. The hypothetical return field lets you try scenarios such as −50% or +20% a year, but the result is arithmetic on your assumption, not a forecast. For what DCA would actually have returned in the past, use the historical DCA calculator.',
  },
  {
    question: 'How do the calendar reminders work?',
    answer:
      'The Download button creates an .ics file in your browser with one reminder per scheduled buy (or one repeating event). Import it into Google Calendar, Apple Calendar or Outlook. Nothing is sent to our servers. Email reminders need an account — coming soon.',
  },
];

function todayLocalISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const usd = (n: number, digits = 0) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: digits, maximumFractionDigits: digits });

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DCAAutomationPage() {
  const [amount, setAmount] = useState('50');
  const [frequency, setFrequency] = useState<DCAFrequency>('weekly');
  const [duration, setDuration] = useState(12);
  const [startDate, setStartDate] = useState('');
  const [asset, setAsset] = useState(ASSETS[0]);
  const [annualReturn, setAnnualReturn] = useState('0');
  const [feePct, setFeePct] = useState('0.6');
  const [flatFee, setFlatFee] = useState('0.99');
  const [loaded, setLoaded] = useState(false);
  const [icsMessage, setIcsMessage] = useState('');

  // Restore saved plan and default the start date to today (browser only).
  useEffect(() => {
    let savedStart = '';
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Record<string, unknown>;
        if (typeof s.amount === 'string') setAmount(s.amount);
        if (DCA_FREQUENCIES.some((f) => f.value === s.frequency)) setFrequency(s.frequency as DCAFrequency);
        if (typeof s.duration === 'number' && DURATIONS.includes(s.duration)) setDuration(s.duration);
        if (typeof s.asset === 'string' && ASSETS.includes(s.asset)) setAsset(s.asset);
        if (typeof s.annualReturn === 'string') setAnnualReturn(s.annualReturn);
        if (typeof s.feePct === 'string') setFeePct(s.feePct);
        if (typeof s.flatFee === 'string') setFlatFee(s.flatFee);
        if (typeof s.startDate === 'string') savedStart = s.startDate;
      }
    } catch {
      // Storage unavailable: use defaults.
    }
    const today = todayLocalISO();
    setStartDate(savedStart && savedStart >= today ? savedStart : today);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ amount, frequency, duration, asset, annualReturn, feePct, flatFee, startDate })
      );
    } catch {
      // Ignore.
    }
  }, [loaded, amount, frequency, duration, asset, annualReturn, feePct, flatFee, startDate]);

  const amountNum = parseFloat(amount);
  const amountValid = Number.isFinite(amountNum) && amountNum >= 1 && amountNum <= 1_000_000;
  const returnNum = parseFloat(annualReturn);
  const returnValid = Number.isFinite(returnNum) && returnNum >= -99 && returnNum <= 500;
  const feePctNum = Math.max(0, parseFloat(feePct) || 0);
  const flatFeeNum = Math.max(0, parseFloat(flatFee) || 0);

  const plan = useMemo(() => {
    if (!amountValid || !startDate) return null;
    return calculateDCAPlan({
      amountUsd: amountNum,
      frequency,
      durationMonths: duration,
      startDate,
      feePercent: feePctNum,
      flatFeeUsd: flatFeeNum,
      hypotheticalAnnualReturn: returnValid ? returnNum : 0,
    });
  }, [amountValid, amountNum, frequency, duration, startDate, feePctNum, flatFeeNum, returnValid, returnNum]);

  const feeRows = useMemo(() => feeDragTable(FEE_SIZES, feePctNum, flatFeeNum), [feePctNum, flatFeeNum]);

  function downloadICS() {
    if (!plan) return;
    try {
      const seed =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
      const ics = generateDCAICS({
        dates: plan.dates,
        frequency,
        amountUsd: amountNum,
        asset,
        uidSeed: seed,
        now: new Date(),
      });
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dca-reminders-${frequency}.ics`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setIcsMessage(`Downloaded ${plan.buyCount} reminder${plan.buyCount === 1 ? '' : 's'}. Open the file to add them to your calendar.`);
    } catch {
      setIcsMessage('Could not create the calendar file in this browser.');
    }
  }

  const inputClass =
    'w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  const preview = plan ? plan.dates.slice(0, 8) : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <PageSEO
        pageKey="dcaAutomation"
        urlPath={PAGE_PATH}
        faqs={FAQS}
        customSchema={[
          webApplicationSchema('DCA Planner', TOOL_DESCRIPTION, PAGE_PATH),
          generateHowToSchema({
            name: 'How to set up recurring crypto buys on an exchange',
            description: 'Steps to automate dollar-cost averaging with an exchange’s built-in recurring-buy feature.',
            steps: HOWTO_STEPS,
          }),
        ]}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <CalendarClock className="h-8 w-8 text-orange-500" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">DCA Planner and Recurring Buy Guide</h1>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl">
            Plan a dollar-cost-averaging schedule: see how much you will invest, how many buys that is, what fees
            take out, and the exact purchase dates — then download calendar reminders or set up the same schedule
            as a recurring buy on your exchange. We don’t execute trades.
          </p>
          <div className="mt-3">
            <LastUpdated date={LAST_UPDATED} />
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-5">
          <section aria-labelledby="plan-heading" className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <h2 id="plan-heading" className="text-xl font-semibold text-gray-900 dark:text-white">Your plan</h2>
            <div>
              <label htmlFor="dca-amount" className={labelClass}>Amount per buy (USD)</label>
              <input
                id="dca-amount"
                type="number"
                inputMode="decimal"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-invalid={!amountValid}
                aria-describedby={!amountValid ? 'dca-amount-err' : undefined}
                className={inputClass}
              />
              {!amountValid && (
                <p id="dca-amount-err" className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  Enter an amount of at least $1.
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="dca-freq" className={labelClass}>Frequency</label>
                <select id="dca-freq" value={frequency} onChange={(e) => setFrequency(e.target.value as DCAFrequency)} className={inputClass}>
                  {DCA_FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="dca-duration" className={labelClass}>Duration</label>
                <select id="dca-duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputClass}>
                  {DURATIONS.map((m) => (
                    <option key={m} value={m}>{m < 12 ? `${m} months` : `${m / 12} year${m === 12 ? '' : 's'}`}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="dca-start" className={labelClass}>First buy</label>
                <input id="dca-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="dca-asset" className={labelClass}>Asset (for reminders)</label>
                <select id="dca-asset" value={asset} onChange={(e) => setAsset(e.target.value)} className={inputClass}>
                  {ASSETS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
            <fieldset className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <legend className="text-sm font-semibold text-gray-900 dark:text-white">Fee assumptions</legend>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Example values, not any specific exchange. Replace them with your platform’s fee and spread.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="dca-feepct" className={labelClass}>Fee + spread (%)</label>
                  <input id="dca-feepct" type="number" min="0" max="20" step="0.05" value={feePct} onChange={(e) => setFeePct(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="dca-flat" className={labelClass}>Flat fee per buy ($)</label>
                  <input id="dca-flat" type="number" min="0" step="0.01" value={flatFee} onChange={(e) => setFlatFee(e.target.value)} className={inputClass} />
                </div>
              </div>
            </fieldset>
            <fieldset className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <legend className="text-sm font-semibold text-gray-900 dark:text-white">Hypothetical annual return (optional)</legend>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Not a forecast. Leave at 0% to see only what you put in.
              </p>
              <label htmlFor="dca-return" className="sr-only">Hypothetical annual return in percent</label>
              <input
                id="dca-return"
                type="number"
                min="-99"
                max="500"
                step="1"
                value={annualReturn}
                onChange={(e) => setAnnualReturn(e.target.value)}
                className={inputClass}
              />
              <div className="flex gap-2 mt-2" role="group" aria-label="Return scenarios">
                {RETURN_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={returnValid && returnNum === p}
                    onClick={() => setAnnualReturn(String(p))}
                    className={`text-sm px-3 py-1 rounded-md border ${returnValid && returnNum === p ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 border-transparent' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'}`}
                  >
                    {p > 0 ? `+${p}` : p}%
                  </button>
                ))}
              </div>
            </fieldset>
          </section>

          <section aria-labelledby="result-heading" className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5" aria-live="polite">
            <h2 id="result-heading" className="text-xl font-semibold text-gray-900 dark:text-white mb-4">What this plan looks like</h2>
            {!plan ? (
              <p className="text-gray-600 dark:text-gray-400">
                {!amountValid ? 'Enter an amount per buy to see your plan.' : 'Choose a first-buy date to see your plan.'}
              </p>
            ) : (
              <>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Number of buys</dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white">{plan.buyCount.toLocaleString('en-US')}</dd>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Total invested</dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white">{usd(plan.totalInvested)}</dd>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Estimated fees</dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white">{usd(plan.totalFees, 2)}</dd>
                    <dd className="text-xs text-gray-500 dark:text-gray-400">
                      {plan.totalInvested > 0 ? `${((plan.totalFees / plan.totalInvested) * 100).toFixed(2)}% of money in` : ''}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
                    <dt className="text-xs text-gray-500 dark:text-gray-400">Actually buys crypto</dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white">{usd(plan.netInvested)}</dd>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-3 col-span-2">
                    <dt className="text-xs text-gray-500 dark:text-gray-400">
                      Value on {formatDate(plan.endDate)} if it returned {returnValid ? returnNum : 0}%/yr (hypothetical)
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white">{usd(plan.hypotheticalValue)}</dd>
                    <dd className="text-xs text-gray-500 dark:text-gray-400">
                      Arithmetic on your assumption, not a forecast. Crypto can lose most of its value.
                    </dd>
                  </div>
                </dl>

                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mt-6 mb-2">Schedule preview</h3>
                <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-700 dark:text-gray-300">
                  {preview.map((d, i) => (
                    <li key={d} className="rounded bg-gray-50 dark:bg-gray-900 px-2 py-1">
                      <span className="text-gray-400 mr-1">#{i + 1}</span>{formatDate(d)}
                    </li>
                  ))}
                </ol>
                {plan.buyCount > preview.length && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    … {plan.buyCount - preview.length} more, last buy on {formatDate(plan.dates[plan.dates.length - 1])}.
                  </p>
                )}
                {frequency === 'monthly' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Monthly buys on the 29th–31st move to the last day of shorter months.
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={downloadICS}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" /> Download calendar reminders (.ics)
                  </button>
                  {icsMessage && <p className="text-sm text-gray-600 dark:text-gray-400" role="status">{icsMessage}</p>}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  The file is made in your browser. Email reminders need an account — coming soon.
                </p>
              </>
            )}
          </section>
        </div>

        <section aria-labelledby="fee-heading" className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 id="fee-heading" className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Fee drag on small buys</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-3">
            A flat fee hurts small purchases most. With your assumptions ({feePctNum}% plus {usd(flatFeeNum, 2)} per buy),
            this is what each purchase size really costs:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400">
                  <th scope="col" className="py-2 pr-4 font-medium">Buy size</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Fee per buy</th>
                  <th scope="col" className="py-2 font-medium">Effective cost</th>
                </tr>
              </thead>
              <tbody>
                {feeRows.map((r) => (
                  <tr key={r.size} className="border-t border-gray-100 dark:border-gray-700">
                    <th scope="row" className="py-2 pr-4 text-left font-medium text-gray-900 dark:text-white">{usd(r.size)}</th>
                    <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{usd(r.fee, 2)}</td>
                    <td className="py-2 text-gray-700 dark:text-gray-300">{r.effectivePercent.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
            If the effective cost of your buy size looks high, buy less often with a larger amount, pay by bank transfer
            instead of card, or use a platform with lower fees on recurring buys. Compare costs with the{' '}
            <Link to="/calculators?type=fees" className="text-orange-600 dark:text-orange-400 underline">fee calculator</Link>.
          </p>
        </section>

        <article className="mt-12 space-y-4 text-gray-800 dark:text-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How to automate recurring buys on your exchange</h2>
          <p>
            Most large US platforms let you schedule a recurring buy, so the purchase happens without you logging in.
            The steps are similar everywhere:
          </p>
          <ol className="list-decimal pl-6 space-y-2">
            {HOWTO_STEPS.map((s) => (
              <li key={s.name}>
                <strong>{s.name}.</strong> {s.text}
              </li>
            ))}
          </ol>

          <h3 className="text-xl font-semibold text-gray-900 dark:text-white pt-2">Platforms with a recurring-buy feature (US)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400">
                  <th scope="col" className="py-2 pr-4 font-medium">Platform</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Schedules offered</th>
                  <th scope="col" className="py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {EXCHANGES.map((x) => (
                  <tr key={x.name} className="border-t border-gray-100 dark:border-gray-700 align-top">
                    <th scope="row" className="py-2 pr-4 text-left font-semibold text-gray-900 dark:text-white">
                      <a href={x.source} target="_blank" rel="noopener noreferrer" className="underline">{x.name}</a>
                    </th>
                    <td className="py-2 pr-4">{x.frequencies}</td>
                    <td className="py-2">{x.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <LastUpdated date={EXCHANGES_VERIFIED} label="Checked against each platform’s help pages on" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Listing is not an endorsement, and availability varies by state. Features and fees change; confirm on the
            platform before you set up a schedule. Compare platforms on our{' '}
            <Link to="/compare" className="text-orange-600 dark:text-orange-400 underline">exchange comparison</Link>.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white pt-4">What DCA does and doesn’t do</h2>
          <p>
            DCA spreads your purchases over time, so one bad entry price matters less and you are not tempted to time
            the market. It does not make a falling asset profitable: if the price ends lower than your average cost, you
            lose money. It also tends to underperform investing a lump sum all at once in markets that mostly rise — the
            trade-off is lower regret and a habit that is easier to keep.
          </p>
          <Callout title="Want to see how DCA actually performed?">
            The historical{' '}
            <Link to="/calculators?type=dca" className="underline font-medium">DCA calculator</Link> backtests a schedule
            against real past prices. Past performance does not predict future results. Read more in our{' '}
            <Link to="/learn/dca-strategies" className="underline font-medium">DCA strategies guide</Link>.
          </Callout>
        </article>

        <FaqSection items={FAQS} />
      </div>
    </div>
  );
}
