/**
 * Line chart of a strategy's value against the money put in over time.
 * Two series on one axis (both USD): value (solid, brand orange) and amount
 * invested (dashed, neutral grey) - identity never relies on colour alone.
 * Hover/focus shows a crosshair tooltip; callers provide a table fallback.
 */

import { useId, useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react';
import type { ValuePoint } from '../../services/backtesting';
import { samplePath } from '../../services/backtesting';

const W = 640;
const H = 240;
const PAD = { top: 12, right: 12, bottom: 28, left: 56 };

function compactUsd(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e6) return `$${(n / 1e6).toFixed(a >= 1e7 ? 0 : 1)}M`;
  if (a >= 1e3) return `$${(n / 1e3).toFixed(a >= 1e4 ? 0 : 1)}K`;
  return `$${n.toFixed(0)}`;
}

export function ValueChart({ points, label }: { points: ValuePoint[]; label: string }) {
  const titleId = useId();
  const data = useMemo(() => samplePath(points, 240), [points]);
  const [hover, setHover] = useState<number | null>(null);

  const geom = useMemo(() => {
    const t = data.map((p) => Date.parse(`${p.date}T00:00:00Z`));
    const t0 = t[0];
    const t1 = t[t.length - 1] === t0 ? t0 + 1 : t[t.length - 1];
    const maxY = Math.max(1, ...data.map((p) => Math.max(p.value, p.invested)));
    const x = (ms: number) => PAD.left + ((ms - t0) / (t1 - t0)) * (W - PAD.left - PAD.right);
    const y = (v: number) => PAD.top + (1 - v / maxY) * (H - PAD.top - PAD.bottom);
    const line = (key: 'value' | 'invested') =>
      data.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(t[i]).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxY);
    const firstYear = new Date(t0).getUTCFullYear();
    const lastYear = new Date(t1).getUTCFullYear();
    const span = Math.max(1, lastYear - firstYear);
    const stepYears = Math.max(1, Math.ceil(span / 6));
    const yearTicks: { x: number; label: string }[] = [];
    for (let yr = firstYear + 1; yr <= lastYear; yr += stepYears) {
      const ms = Date.UTC(yr, 0, 1);
      if (ms > t0 && ms < t1) yearTicks.push({ x: x(ms), label: String(yr) });
    }
    return { t, x, y, value: line('value'), invested: line('invested'), ticks, yearTicks };
  }, [data]);

  if (data.length < 2) return null;

  const onMove = (e: MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestD = Infinity;
    geom.t.forEach((ms, i) => {
      const d = Math.abs(geom.x(ms) - px);
      if (d < bestD) { bestD = d; best = i; }
    });
    setHover(best);
  };
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key === 'ArrowRight') setHover((h) => Math.min(data.length - 1, (h ?? -1) + 1));
    if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? data.length) - 1));
    if (e.key === 'Escape') setHover(null);
  };

  const hp = hover !== null ? data[hover] : null;
  const last = data[data.length - 1];

  return (
    <figure className="w-full">
      <div className="flex flex-wrap gap-4 text-sm text-gray-300 mb-2" aria-hidden="true">
        <span className="flex items-center gap-2"><svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#f7931a" strokeWidth="2" /></svg>Value</span>
        <span className="flex items-center gap-2"><svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke="#9ca3af" strokeWidth="2" strokeDasharray="4 3" /></svg>Money invested</span>
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded"
          role="img"
          aria-labelledby={titleId}
          tabIndex={0}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          onKeyDown={onKey}
        >
          <title id={titleId}>{label}</title>
          {geom.ticks.map((v) => (
            <g key={v}>
              <line x1={PAD.left} x2={W - PAD.right} y1={geom.y(v)} y2={geom.y(v)} stroke="rgba(255,255,255,0.08)" />
              <text x={PAD.left - 6} y={geom.y(v) + 4} textAnchor="end" fontSize="11" fill="#9ca3af">{compactUsd(v)}</text>
            </g>
          ))}
          {geom.yearTicks.map((t) => (
            <text key={t.label} x={t.x} y={H - 8} textAnchor="middle" fontSize="11" fill="#9ca3af">{t.label}</text>
          ))}
          <path d={geom.invested} fill="none" stroke="#9ca3af" strokeWidth="2" strokeDasharray="4 3" />
          <path d={geom.value} fill="none" stroke="#f7931a" strokeWidth="2" strokeLinejoin="round" />
          {hp && hover !== null && (
            <g>
              <line x1={geom.x(geom.t[hover])} x2={geom.x(geom.t[hover])} y1={PAD.top} y2={H - PAD.bottom} stroke="rgba(255,255,255,0.3)" />
              <circle cx={geom.x(geom.t[hover])} cy={geom.y(hp.value)} r="4" fill="#f7931a" stroke="#111827" strokeWidth="2" />
              <circle cx={geom.x(geom.t[hover])} cy={geom.y(hp.invested)} r="4" fill="#9ca3af" stroke="#111827" strokeWidth="2" />
            </g>
          )}
          {!hp && (
            <text x={W - PAD.right} y={Math.max(PAD.top + 10, geom.y(last.value) - 6)} textAnchor="end" fontSize="11" fill="#e5e7eb">
              {compactUsd(last.value)}
            </text>
          )}
        </svg>
        {hp && (
          <div className="absolute top-2 left-16 pointer-events-none rounded-lg bg-gray-900/95 border border-white/10 px-3 py-2 text-xs text-gray-200 shadow-lg">
            <p className="font-medium text-white">{hp.date}</p>
            <p>Value: {compactUsd(hp.value)}</p>
            <p>Invested: {compactUsd(hp.invested)}</p>
            <p>Price: ${hp.price.toLocaleString(undefined, { maximumFractionDigits: hp.price < 10 ? 4 : 0 })}</p>
          </div>
        )}
      </div>
      <figcaption className="sr-only">{label}. Use the table below for exact values.</figcaption>
    </figure>
  );
}
