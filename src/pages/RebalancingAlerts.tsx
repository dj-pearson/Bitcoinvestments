/**
 * /rebalancing-alerts: Crypto Rebalancing Calculator.
 *
 * Runs entirely in the browser. The visitor types in holdings and target
 * weights; the page shows drift and the buy/sell amounts that restore the
 * targets. Inputs are saved to localStorage in this browser only.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Scale, Plus, Trash2, RefreshCw } from 'lucide-react';
import { PageSEO } from '../components/PageSEO';
import { FaqSection, LastUpdated, Callout } from '../components/alerts/PageParts';
import { webApplicationSchema, type FaqItem } from '../components/alerts/schema';
import {
  computeRebalance,
  getTargetAllocationTemplates,
  sumTargets,
  type RebalanceMode,
} from '../services/portfolioRebalancing';
import { coinGeckoIdForSymbol, fetchUsdPrices } from '../lib/coinIds';

const LAST_UPDATED = '2026-09-23';
const STORAGE_KEY = 'bi:rebalancer:v1';
const PAGE_PATH = '/rebalancing-alerts';
const TOOL_DESCRIPTION =
  'Free crypto rebalancing calculator: enter holdings and target weights to see drift and the exact buys and sells that restore your allocation.';

interface Row {
  id: string;
  symbol: string;
  /** 'value' = type the USD value; 'amount' = coin amount x price. */
  mode: 'value' | 'amount';
  value: string;
  amount: string;
  price: string;
  target: string;
}

interface SavedState {
  rows: Row[];
  band: string;
  minTrade: string;
  newCash: string;
  fee: string;
  mode: RebalanceMode;
}

const DEFAULT_ROWS: Row[] = [
  { id: 'r1', symbol: 'BTC', mode: 'value', value: '', amount: '', price: '', target: '50' },
  { id: 'r2', symbol: 'ETH', mode: 'value', value: '', amount: '', price: '', target: '25' },
  { id: 'r3', symbol: 'USDC', mode: 'value', value: '', amount: '', price: '', target: '25' },
];

/** The worked example from the explainer, loadable into the calculator. */
const EXAMPLE_ROWS: Row[] = [
  { id: 'r1', symbol: 'BTC', mode: 'value', value: '6500', amount: '', price: '', target: '50' },
  { id: 'r2', symbol: 'ETH', mode: 'value', value: '2300', amount: '', price: '', target: '25' },
  { id: 'r3', symbol: 'USDC', mode: 'value', value: '2200', amount: '', price: '', target: '25' },
];

const FAQS: FaqItem[] = [
  {
    question: 'What is crypto portfolio rebalancing?',
    answer:
      'Rebalancing means trading your holdings back to the target weights you chose, for example 50% BTC, 25% ETH and 25% stablecoins. When one coin rallies it becomes a bigger share of the portfolio than you planned; rebalancing trims it and tops up the laggards so your risk stays where you set it.',
  },
  {
    question: 'How often should I rebalance crypto?',
    answer:
      'There is no single right answer. Calendar rebalancing (monthly, quarterly or yearly) is simple and predictable. Threshold rebalancing only trades when an asset drifts outside a band such as ±5 percentage points, which usually means fewer trades in quiet markets and more in volatile ones. Many people combine them: check on a schedule, trade only if the band is breached.',
  },
  {
    question: 'What does a ±5% band mean?',
    answer:
      'In this calculator the band is in percentage points of the whole portfolio. With a 50% target and a 5-point band, nothing happens between 45% and 55%; below 45% or above 55% the asset is flagged as outside the band.',
  },
  {
    question: 'Is rebalancing crypto a taxable event?',
    answer:
      'Often, yes. In the US the IRS treats crypto as property, so selling a coin or swapping it for another coin is generally a disposal that can create a capital gain or loss. Adding new money to underweight assets (buy-only mode) does not sell anything. Rules differ by country and situation, so check with a tax professional; this page is not tax advice.',
  },
  {
    question: 'What happens to coins I hold but did not give a target?',
    answer:
      'They are treated as a 0% target. The calculator shows them as fully overweight and, in full mode, suggests selling them. Give them a target if you meant to keep them.',
  },
  {
    question: 'Can this page send me drift alerts by email?',
    answer:
      'Not yet. Email drift alerts need an account, and accounts are coming soon. For now the calculator saves your inputs in this browser so you can come back and re-check with fresh values.',
  },
];

function toNumber(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function rowValue(r: Row): number {
  if (r.mode === 'amount') return Math.max(0, toNumber(r.amount) * toNumber(r.price));
  return Math.max(0, toNumber(r.value));
}

const usd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: n >= 100 ? 0 : 2 });
const pct = (n: number) => `${n.toFixed(1)}%`;
const signedPts = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(1)} pts`;

function isSavedState(v: unknown): v is SavedState {
  if (!v || typeof v !== 'object') return false;
  const s = v as SavedState;
  return Array.isArray(s.rows) && s.rows.every((r) => r && typeof r.id === 'string' && typeof r.symbol === 'string');
}

export default function RebalancingAlertsPage() {
  const [rows, setRows] = useState<Row[]>(DEFAULT_ROWS);
  const [band, setBand] = useState('5');
  const [minTrade, setMinTrade] = useState('25');
  const [newCash, setNewCash] = useState('0');
  const [fee, setFee] = useState('0.5');
  const [mode, setMode] = useState<RebalanceMode>('full');
  const [loaded, setLoaded] = useState(false);
  const [priceStatus, setPriceStatus] = useState<string>('');
  const [priceLoading, setPriceLoading] = useState(false);
  const nextId = useRef(100);
  const templates = getTargetAllocationTemplates();

  // Restore saved inputs (browser only).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isSavedState(parsed)) {
          const restored: Row[] = parsed.rows.map((r) => ({
            id: r.id,
            symbol: String(r.symbol ?? ''),
            mode: r.mode === 'amount' ? 'amount' : 'value',
            value: String(r.value ?? ''),
            amount: String(r.amount ?? ''),
            price: String(r.price ?? ''),
            target: String(r.target ?? ''),
          }));
          const maxId = restored.reduce((m, r) => Math.max(m, parseInt(r.id.replace(/\D/g, ''), 10) || 0), 100);
          nextId.current = maxId;
          setRows(restored);
          setBand(parsed.band ?? '5');
          setMinTrade(parsed.minTrade ?? '25');
          setNewCash(parsed.newCash ?? '0');
          setFee(parsed.fee ?? '0.5');
          setMode(parsed.mode === 'buy-only' ? 'buy-only' : 'full');
        }
      }
    } catch {
      // Storage blocked or corrupt: start from defaults.
    }
    setLoaded(true);
  }, []);

  // Save inputs after the initial restore.
  useEffect(() => {
    if (!loaded) return;
    try {
      const state: SavedState = { rows, band, minTrade, newCash, fee, mode };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore: saving is a convenience.
    }
  }, [loaded, rows, band, minTrade, newCash, fee, mode]);

  const targetSum = useMemo(
    () => sumTargets(rows.map((r) => ({ symbol: r.symbol, targetPercent: toNumber(r.target) }))),
    [rows]
  );
  const targetsValid = Math.abs(targetSum - 100) < 0.01;

  const result = useMemo(
    () =>
      computeRebalance(
        rows.map((r) => ({ symbol: r.symbol, value: rowValue(r) })),
        rows.filter((r) => r.target.trim() !== '').map((r) => ({ symbol: r.symbol, targetPercent: toNumber(r.target) })),
        {
          bandPoints: toNumber(band),
          minTradeUsd: toNumber(minTrade),
          newCashUsd: toNumber(newCash),
          mode,
          feePercent: toNumber(fee),
        }
      ),
    [rows, band, minTrade, newCash, fee, mode]
  );

  const hasValues = result.totalValue > 0 || toNumber(newCash) > 0;

  function updateRow(id: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    nextId.current += 1;
    setRows((prev) => [
      ...prev,
      { id: `r${nextId.current}`, symbol: '', mode: 'value', value: '', amount: '', price: '', target: '' },
    ]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function applyTemplate(index: number) {
    const tpl = templates[index];
    if (!tpl) return;
    setRows((prev) => {
      const bySymbol = new Map(prev.map((r) => [r.symbol.trim().toUpperCase(), r]));
      const next: Row[] = tpl.targets.map((t) => {
        const existing = bySymbol.get(t.symbol);
        bySymbol.delete(t.symbol);
        if (existing) return { ...existing, target: String(t.targetPercent) };
        nextId.current += 1;
        return { id: `r${nextId.current}`, symbol: t.symbol, mode: 'value', value: '', amount: '', price: '', target: String(t.targetPercent) };
      });
      // Keep holdings that are not in the template, with a 0% target, so they show up as sells.
      for (const r of bySymbol.values()) {
        if (rowValue(r) > 0) next.push({ ...r, target: '0' });
      }
      return next;
    });
  }

  function loadExample() {
    setRows(EXAMPLE_ROWS);
    setBand('5');
    setMinTrade('25');
    setNewCash('0');
    setMode('full');
  }

  function resetAll() {
    setRows(DEFAULT_ROWS);
    setBand('5');
    setMinTrade('25');
    setNewCash('0');
    setFee('0.5');
    setMode('full');
    setPriceStatus('');
  }

  async function fillPrices() {
    const wanted = rows.filter((r) => r.mode === 'amount' && coinGeckoIdForSymbol(r.symbol));
    if (wanted.length === 0) {
      setPriceStatus('Switch a row to "amount × price" and use a common ticker (BTC, ETH, SOL…) to fill prices.');
      return;
    }
    setPriceLoading(true);
    setPriceStatus('');
    try {
      const prices = await fetchUsdPrices(wanted.map((r) => coinGeckoIdForSymbol(r.symbol) as string));
      const filled = wanted.filter((r) => prices[coinGeckoIdForSymbol(r.symbol) as string] !== undefined).length;
      setRows((prev) =>
        prev.map((r) => {
          const id = r.mode === 'amount' ? coinGeckoIdForSymbol(r.symbol) : null;
          return id && prices[id] !== undefined ? { ...r, price: String(prices[id]) } : r;
        })
      );
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setPriceStatus(
        filled === 0
          ? 'CoinGecko returned no prices for these tickers. Enter prices by hand.'
          : `Prices from CoinGecko at ${time}. Check them before trading.`
      );
    } catch (err) {
      setPriceStatus(
        `Could not load prices (${err instanceof Error ? err.message : 'network error'}). Enter prices by hand.`
      );
    } finally {
      setPriceLoading(false);
    }
  }

  const inputClass =
    'w-full px-2 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <PageSEO
        pageKey="rebalancingAlerts"
        urlPath={PAGE_PATH}
        faqs={FAQS}
        customSchema={webApplicationSchema('Crypto Rebalancing Calculator', TOOL_DESCRIPTION, PAGE_PATH)}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Scale className="h-8 w-8 text-indigo-500" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Crypto Rebalancing Calculator</h1>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl">
            Enter what you hold and the weights you want, and this calculator shows how far each coin has drifted
            and the exact dollar amounts to buy or sell to get back on target. Use a threshold band to skip small
            drifts, or buy-only mode to rebalance with new cash instead of selling.
          </p>
          <div className="mt-3">
            <LastUpdated date={LAST_UPDATED} />
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Inputs */}
          <section aria-labelledby="holdings-heading" className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 id="holdings-heading" className="text-xl font-semibold text-gray-900 dark:text-white">
                1. Holdings and targets
              </h2>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={loadExample} className="text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Load worked example
                </button>
                <button type="button" onClick={resetAll} className="text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Reset
                </button>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Start from an example mix (fills the target column; these are illustrations, not advice):
              </p>
              <div className="flex flex-wrap gap-2">
                {templates.map((t, i) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => applyTemplate(i)}
                    title={t.description}
                    className="text-sm px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                  >
                    {t.name}: {t.targets.map((x) => `${x.symbol} ${x.targetPercent}%`).join(' / ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Your holdings and target weights</caption>
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400">
                    <th scope="col" className="py-2 pr-2 font-medium">Asset</th>
                    <th scope="col" className="py-2 pr-2 font-medium">Enter as</th>
                    <th scope="col" className="py-2 pr-2 font-medium">Current value (USD)</th>
                    <th scope="col" className="py-2 pr-2 font-medium">Target %</th>
                    <th scope="col" className="py-2 font-medium"><span className="sr-only">Remove</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const label = r.symbol || `row ${i + 1}`;
                    return (
                      <tr key={r.id} className="border-t border-gray-100 dark:border-gray-700 align-top">
                        <td className="py-2 pr-2 w-24">
                          <label htmlFor={`${r.id}-sym`} className="sr-only">Asset ticker, row {i + 1}</label>
                          <input
                            id={`${r.id}-sym`}
                            value={r.symbol}
                            onChange={(e) => updateRow(r.id, { symbol: e.target.value.toUpperCase().slice(0, 12) })}
                            placeholder="BTC"
                            className={inputClass}
                          />
                        </td>
                        <td className="py-2 pr-2 w-36">
                          <label htmlFor={`${r.id}-mode`} className="sr-only">Enter {label} as</label>
                          <select
                            id={`${r.id}-mode`}
                            value={r.mode}
                            onChange={(e) => updateRow(r.id, { mode: e.target.value as Row['mode'] })}
                            className={inputClass}
                          >
                            <option value="value">USD value</option>
                            <option value="amount">Amount × price</option>
                          </select>
                        </td>
                        <td className="py-2 pr-2">
                          {r.mode === 'value' ? (
                            <>
                              <label htmlFor={`${r.id}-val`} className="sr-only">{label} value in USD</label>
                              <input
                                id={`${r.id}-val`}
                                type="number"
                                inputMode="decimal"
                                min="0"
                                step="any"
                                value={r.value}
                                onChange={(e) => updateRow(r.id, { value: e.target.value })}
                                placeholder="0"
                                className={inputClass}
                              />
                            </>
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <div className="flex-1">
                                <label htmlFor={`${r.id}-amt`} className="block text-xs text-gray-500 dark:text-gray-400">Amount</label>
                                <input
                                  id={`${r.id}-amt`}
                                  type="number"
                                  inputMode="decimal"
                                  min="0"
                                  step="any"
                                  value={r.amount}
                                  onChange={(e) => updateRow(r.id, { amount: e.target.value })}
                                  className={inputClass}
                                />
                              </div>
                              <div className="flex-1">
                                <label htmlFor={`${r.id}-px`} className="block text-xs text-gray-500 dark:text-gray-400">Price (USD)</label>
                                <input
                                  id={`${r.id}-px`}
                                  type="number"
                                  inputMode="decimal"
                                  min="0"
                                  step="any"
                                  value={r.price}
                                  onChange={(e) => updateRow(r.id, { price: e.target.value })}
                                  className={inputClass}
                                />
                              </div>
                              <p className="sm:self-end text-xs text-gray-500 dark:text-gray-400 pb-2 whitespace-nowrap">= {usd(rowValue(r))}</p>
                            </div>
                          )}
                        </td>
                        <td className="py-2 pr-2 w-24">
                          <label htmlFor={`${r.id}-tgt`} className="sr-only">{label} target percent</label>
                          <input
                            id={`${r.id}-tgt`}
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max="100"
                            step="any"
                            value={r.target}
                            onChange={(e) => updateRow(r.id, { target: e.target.value })}
                            placeholder="0"
                            className={inputClass}
                          />
                        </td>
                        <td className="py-2 w-10">
                          <button
                            type="button"
                            onClick={() => removeRow(r.id)}
                            aria-label={`Remove ${label}`}
                            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-3">
              <button type="button" onClick={addRow} className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
                <Plus className="h-4 w-4" aria-hidden="true" /> Add asset
              </button>
              <button
                type="button"
                onClick={fillPrices}
                disabled={priceLoading}
                className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${priceLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                Fill prices for “amount × price” rows
              </button>
              <p className={`text-sm ${targetsValid ? 'text-gray-600 dark:text-gray-400' : 'text-amber-700 dark:text-amber-300 font-medium'}`} aria-live="polite">
                Targets add up to {targetSum.toFixed(1)}%{targetsValid ? '' : ' (they must add up to 100%)'}
              </p>
            </div>
            {priceStatus && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400" role="status">{priceStatus}</p>
            )}

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">2. Rules</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="rb-band" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Threshold band (± percentage points)
                </label>
                <input id="rb-band" type="number" min="0" max="50" step="0.5" value={band} onChange={(e) => setBand(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="rb-min" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Minimum trade size (USD)
                </label>
                <input id="rb-min" type="number" min="0" step="1" value={minTrade} onChange={(e) => setMinTrade(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="rb-cash" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New cash to invest (USD)
                </label>
                <input id="rb-cash" type="number" min="0" step="any" value={newCash} onChange={(e) => setNewCash(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label htmlFor="rb-fee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estimated trading cost (% per trade)
                </label>
                <input id="rb-fee" type="number" min="0" max="10" step="0.05" value={fee} onChange={(e) => setFee(e.target.value)} className={inputClass} />
              </div>
            </div>
            <fieldset className="mt-4">
              <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mode</legend>
              <div className="flex flex-wrap gap-2" role="group">
                <button
                  type="button"
                  aria-pressed={mode === 'full'}
                  onClick={() => setMode('full')}
                  className={`text-sm px-3 py-1.5 rounded-md border ${mode === 'full' ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'}`}
                >
                  Full rebalance (buy and sell)
                </button>
                <button
                  type="button"
                  aria-pressed={mode === 'buy-only'}
                  onClick={() => setMode('buy-only')}
                  className={`text-sm px-3 py-1.5 rounded-md border ${mode === 'buy-only' ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'}`}
                >
                  Buy-only with new cash
                </button>
              </div>
            </fieldset>
          </section>

          {/* Results */}
          <section aria-labelledby="results-heading" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5" aria-live="polite">
            <h2 id="results-heading" className="text-xl font-semibold text-gray-900 dark:text-white mb-4">3. Result</h2>
            {!targetsValid ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">Make the target column add up to 100% to see trades.</p>
            ) : !hasValues ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter the current value of at least one holding (or new cash) to see drift and trades. Or click
                “Load worked example”.
              </p>
            ) : (
              <>
                <dl className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Portfolio value</dt>
                    <dd className="font-semibold text-gray-900 dark:text-white">{usd(result.totalValue)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-gray-400">Largest drift</dt>
                    <dd className="font-semibold text-gray-900 dark:text-white">{result.maxDriftPoints.toFixed(1)} pts</dd>
                  </div>
                </dl>
                <p className={`text-sm font-medium mb-4 ${result.bandBreached ? 'text-amber-700 dark:text-amber-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  {result.bandBreached
                    ? `At least one asset is outside the ±${toNumber(band)} point band, so a threshold rule says rebalance.`
                    : `Every asset is inside the ±${toNumber(band)} point band. A threshold rule would do nothing today; the trades below are what a calendar rebalance would do.`}
                </p>

                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  {mode === 'buy-only' ? 'Buys with new cash' : 'Trades'}
                </h3>
                {result.trades.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {mode === 'buy-only' && toNumber(newCash) <= 0
                      ? 'Buy-only mode needs an amount of new cash.'
                      : 'No trades above your minimum trade size.'}
                  </p>
                ) : (
                  <ul className="space-y-2 mb-3">
                    {result.trades.map((t) => (
                      <li key={`${t.action}-${t.symbol}`} className="flex justify-between text-sm">
                        <span className="text-gray-900 dark:text-white">
                          <span className="font-semibold uppercase">{t.action}</span> {t.symbol}
                        </span>
                        <span className="font-mono text-gray-900 dark:text-white">{usd(t.amountUsd)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {result.skippedTrades.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Skipped (below {usd(toNumber(minTrade))}):{' '}
                    {result.skippedTrades.map((t) => `${t.action} ${t.symbol} ${usd(t.amountUsd)}`).join(', ')}
                  </p>
                )}
                {mode === 'buy-only' && result.unallocatedCashUsd > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Cash left over: {usd(result.unallocatedCashUsd)}
                  </p>
                )}
                {result.trades.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Estimated trading cost at {toNumber(fee)}%: {usd(result.estimatedFeesUsd)}
                  </p>
                )}
                {mode === 'full' && result.trades.some((t) => t.action === 'sell') && (
                  <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                    Selling may be a taxable event. See{' '}
                    <Link to="/learn/crypto-taxes-basics" className="text-indigo-600 dark:text-indigo-400 underline">crypto tax basics</Link>.
                    Not tax advice.
                  </p>
                )}
              </>
            )}
          </section>
        </div>

        {/* Drift table */}
        {targetsValid && result.totalValue > 0 && (
          <section aria-labelledby="drift-heading" className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 id="drift-heading" className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Drift by asset</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400">
                    <th scope="col" className="py-2 pr-3 font-medium">Asset</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Value</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Current</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Target</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Drift</th>
                    <th scope="col" className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((r) => {
                    const over = r.driftPoints > 0.05;
                    const under = r.driftPoints < -0.05;
                    return (
                      <tr key={r.symbol} className="border-t border-gray-100 dark:border-gray-700">
                        <th scope="row" className="py-2 pr-3 text-left font-semibold text-gray-900 dark:text-white">
                          {r.symbol}
                          {r.untargeted && <span className="ml-1 text-xs font-normal text-gray-500">(no target, counts as 0%)</span>}
                        </th>
                        <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{usd(r.currentValue)}</td>
                        <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{pct(r.currentPercent)}</td>
                        <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{pct(r.targetPercent)}</td>
                        <td className={`py-2 pr-3 font-mono ${over ? 'text-violet-700 dark:text-violet-300' : under ? 'text-sky-700 dark:text-sky-300' : 'text-gray-500'}`}>
                          {signedPts(r.driftPoints)}
                        </td>
                        <td className="py-2 text-gray-700 dark:text-gray-300">
                          {over ? 'Overweight' : under ? 'Underweight' : 'On target'}
                          {r.outsideBand && (
                            <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200">outside band</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Overweight and underweight are shown in different colours only to tell them apart; neither is good or bad.
            </p>
          </section>
        )}

        <div className="mt-6">
          <Callout title="Saved in this browser only">
            Your inputs are stored in this browser (localStorage) and never sent to us. Email drift alerts need an
            account — coming soon. Until then, bookmark this page and re-check on your schedule.
          </Callout>
        </div>

        {/* Explainer */}
        <article className="mt-12 prose-sm max-w-none text-gray-800 dark:text-gray-200 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Calendar vs threshold rebalancing</h2>
          <p>
            <strong>Calendar rebalancing</strong> means you trade back to target on a fixed date: every month,
            quarter or year, whatever the market did. It is easy to stick to and easy to automate as a reminder, but
            it can trade when drift is tiny (paying fees for nothing) and ignore big swings between dates.
          </p>
          <p>
            <strong>Threshold (band) rebalancing</strong> means you only trade when an asset moves outside a band
            around its target, such as ±5 percentage points. It reacts to large moves and stays quiet otherwise.
            Crypto is volatile, so a band that is too tight can trigger trades very often; wider bands trade less.
            Many investors check on a calendar and trade only if the band is breached — that is what the result box
            above tells you.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white pt-4">Worked example</h2>
          <p>
            A hypothetical $10,000 portfolio targets 50% BTC, 25% ETH and 25% USDC. After a Bitcoin rally it holds
            BTC $6,500, ETH $2,300 and USDC $2,200 — $11,000 in total. The weights are now 59.1% / 20.9% / 20.0%,
            so BTC is 9.1 points over target and outside a ±5 point band.
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Full rebalance:</strong> targets are $5,500 / $2,750 / $2,750, so sell $1,000 of BTC, buy $450
              of ETH and buy $550 of USDC.
            </li>
            <li>
              <strong>Buy-only with $1,000 of new cash:</strong> the new total is $12,000. ETH is $700 below its $3,000
              target and USDC $800 below, so the cash is split in that 7:8 ratio — about $467 to ETH and $533 to USDC.
              Nothing is sold, and every asset ends inside the band (54.2% / 23.1% / 22.8%).
            </li>
          </ul>
          <p>Click “Load worked example” above to see the same numbers in the calculator.</p>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white pt-4">Costs and taxes</h2>
          <p>
            Every trade costs something: exchange fees, the spread between buy and sell prices, and sometimes network
            fees to move coins. A minimum trade size stops you paying those costs on tiny adjustments.
          </p>
          <p>
            Selling, or swapping one coin for another, may create a taxable gain. In the US the IRS treats crypto as
            property, so each sale is generally a disposal. Buy-only rebalancing with new money avoids selling. Rules
            vary by country and personal situation; this is general information, not tax advice.
          </p>
          {/* NEEDS-OWNER: confirm tax wording for non-US audiences. */}
          <p>
            Related:{' '}
            <Link to="/learn/portfolio-rebalancing" className="text-indigo-600 dark:text-indigo-400 underline">portfolio rebalancing guide</Link>
            {' · '}
            <Link to="/learn/crypto-taxes-basics" className="text-indigo-600 dark:text-indigo-400 underline">crypto tax basics</Link>
            {' · '}
            <Link to="/dca-automation" className="text-indigo-600 dark:text-indigo-400 underline">DCA planner</Link>
            {' · '}
            <Link to="/calculators?type=tax" className="text-indigo-600 dark:text-indigo-400 underline">tax calculator</Link>
          </p>
        </article>

        <FaqSection items={FAQS} />
      </div>
    </div>
  );
}
