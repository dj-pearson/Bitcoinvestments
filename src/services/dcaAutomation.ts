/**
 * DCA planner maths for /dca-automation.
 *
 * Pure functions: schedule dates, totals, fee drag, a clearly-hypothetical
 * growth scenario, and an .ics calendar export for manual reminders. The site
 * does not execute trades.
 *
 * Dates are handled as calendar dates ("YYYY-MM-DD") in UTC so that a schedule
 * never shifts by a day because of the visitor's time zone.
 */

export type DCAFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export const DCA_FREQUENCIES: Array<{ value: DCAFrequency; label: string }> = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
];

export interface DCAPlanInput {
  amountUsd: number;
  frequency: DCAFrequency;
  durationMonths: number;
  /** First purchase date, YYYY-MM-DD. */
  startDate: string;
  /** Percentage fee or spread per buy (0-100). */
  feePercent: number;
  /** Flat fee per buy in USD. */
  flatFeeUsd: number;
  /** Hypothetical constant annual return, in percent. 0 = no growth. */
  hypotheticalAnnualReturn: number;
}

export interface DCAPlanResult {
  dates: string[];
  buyCount: number;
  totalInvested: number;
  totalFees: number;
  /** Money that actually buys crypto after fees. */
  netInvested: number;
  /** Value at the end date if the hypothetical return held every day. */
  hypotheticalValue: number;
  endDate: string;
}

const DAY_MS = 86_400_000;

/** Parses YYYY-MM-DD as a UTC date. Returns null for invalid input. */
export function parseISODate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) || d.getUTCDate() !== Number(m[3]) ? null : d;
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Adds calendar months, clamping to the last day of the month (Jan 31 + 1 month = Feb 28/29). */
function addMonthsClamped(start: Date, months: number, dayOfMonth: number): Date {
  const y = start.getUTCFullYear();
  const m = start.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(dayOfMonth, lastDay)));
}

/** Every purchase date from `startDate` up to (not including) start + durationMonths. */
export function buildSchedule(startDate: string, frequency: DCAFrequency, durationMonths: number): string[] {
  const start = parseISODate(startDate);
  if (!start || !(durationMonths > 0)) return [];
  const end = addMonthsClamped(start, Math.round(durationMonths), start.getUTCDate());
  const dates: string[] = [];

  if (frequency === 'monthly') {
    for (let i = 0; ; i++) {
      const d = addMonthsClamped(start, i, start.getUTCDate());
      if (d >= end) break;
      dates.push(toISODate(d));
    }
    return dates;
  }

  const stepDays = frequency === 'daily' ? 1 : frequency === 'weekly' ? 7 : 14;
  for (let t = start.getTime(); t < end.getTime(); t += stepDays * DAY_MS) {
    dates.push(toISODate(new Date(t)));
  }
  return dates;
}

/** End date of the plan (exclusive), YYYY-MM-DD. */
export function planEndDate(startDate: string, durationMonths: number): string | null {
  const start = parseISODate(startDate);
  if (!start) return null;
  return toISODate(addMonthsClamped(start, Math.round(durationMonths), start.getUTCDate()));
}

/** Fee on one buy: percentage plus flat fee, never more than the buy itself. */
export function feePerBuy(amountUsd: number, feePercent: number, flatFeeUsd: number): number {
  const fee = amountUsd * (Math.max(0, feePercent) / 100) + Math.max(0, flatFeeUsd);
  return Math.min(Math.max(0, amountUsd), fee);
}

export function calculateDCAPlan(input: DCAPlanInput): DCAPlanResult | null {
  const { amountUsd, frequency, durationMonths, startDate } = input;
  if (!(amountUsd > 0) || !Number.isFinite(amountUsd)) return null;
  const dates = buildSchedule(startDate, frequency, durationMonths);
  const endDate = planEndDate(startDate, durationMonths);
  if (dates.length === 0 || !endDate) return null;

  const fee = feePerBuy(amountUsd, input.feePercent, input.flatFeeUsd);
  const buyCount = dates.length;
  const totalInvested = amountUsd * buyCount;
  const totalFees = fee * buyCount;
  const netInvested = totalInvested - totalFees;

  // Constant-rate scenario: each buy compounds from its date to the end date.
  const r = Number.isFinite(input.hypotheticalAnnualReturn) ? input.hypotheticalAnnualReturn / 100 : 0;
  const endMs = (parseISODate(endDate) as Date).getTime();
  let hypotheticalValue = 0;
  for (const d of dates) {
    const years = (endMs - (parseISODate(d) as Date).getTime()) / (365.25 * DAY_MS);
    hypotheticalValue += (amountUsd - fee) * Math.pow(1 + Math.max(-0.99, r), years);
  }

  return {
    dates,
    buyCount,
    totalInvested,
    totalFees,
    netInvested,
    hypotheticalValue,
    endDate,
  };
}

/** Effective cost of one buy at several sizes, to show how flat fees punish small buys. */
export function feeDragTable(
  sizes: number[],
  feePercent: number,
  flatFeeUsd: number
): Array<{ size: number; fee: number; effectivePercent: number }> {
  return sizes.map((size) => {
    const fee = feePerBuy(size, feePercent, flatFeeUsd);
    return { size, fee, effectivePercent: size > 0 ? (fee / size) * 100 : 0 };
  });
}

// ---------------------------------------------------------------------------
// .ics export
// ---------------------------------------------------------------------------

function escapeICS(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Folds a content line to 75 octets as RFC 5545 requires (ASCII input assumed). */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) parts.push(` ${line.slice(i, i + 74)}`);
  return parts.join('\r\n');
}

const compact = (iso: string) => iso.replace(/-/g, '');

export interface ICSOptions {
  dates: string[];
  frequency: DCAFrequency;
  amountUsd: number;
  asset: string;
  /** Unique id prefix; pass something random from the click handler. */
  uidSeed: string;
  /** DTSTAMP in UTC, e.g. new Date() from the click handler. */
  now: Date;
}

/**
 * Builds an iCalendar file of all-day reminder events with a 9:00 alarm.
 * Daily/weekly/biweekly schedules use one recurring event; monthly schedules
 * list each date so that the 29th-31st clamp to month end like the planner.
 */
export function generateDCAICS(opts: ICSOptions): string {
  const { dates, frequency, amountUsd, asset, uidSeed, now } = opts;
  if (dates.length === 0) return '';
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const summary = escapeICS(`DCA reminder: buy $${amountUsd.toLocaleString('en-US')} of ${asset}`);
  const description = escapeICS(
    'Reminder from your Bitcoinvestments DCA plan. Check your exchange, then place your buy. ' +
      'This is a reminder only; no trade is made for you. https://bitcoinvestments.net/dca-automation'
  );

  const event = (uid: string, date: string, rrule?: string) => {
    const next = new Date((parseISODate(date) as Date).getTime() + DAY_MS);
    const lines = [
      'BEGIN:VEVENT',
      `UID:${uid}@bitcoinvestments.net`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(date)}`,
      `DTEND;VALUE=DATE:${compact(toISODate(next))}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      'TRANSP:TRANSPARENT',
    ];
    if (rrule) lines.push(rrule);
    lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${summary}`, 'TRIGGER:PT9H', 'END:VALARM', 'END:VEVENT');
    return lines;
  };

  const body: string[] = [];
  if (frequency === 'monthly') {
    dates.forEach((d, i) => body.push(...event(`${uidSeed}-${i}`, d)));
  } else {
    const rule =
      frequency === 'daily'
        ? `RRULE:FREQ=DAILY;COUNT=${dates.length}`
        : `RRULE:FREQ=WEEKLY;INTERVAL=${frequency === 'biweekly' ? 2 : 1};COUNT=${dates.length}`;
    body.push(...event(`${uidSeed}-0`, dates[0], rule));
  }

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bitcoinvestments//DCA Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...body,
    'END:VCALENDAR',
  ]
    .map(foldLine)
    .join('\r\n') + '\r\n';
}
