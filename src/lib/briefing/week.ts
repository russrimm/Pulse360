/**
 * Week keys and date windows for the Weekly Customer Briefing.
 *
 * Everything is UTC so the server, the cron job, and the browser agree on
 * which week a post belongs to. A week key is the Monday the briefing goes out
 * as YYYY-MM-DD. The briefing for week key W covers the seven days before it:
 * [W - 7 days, W) in UTC, start inclusive and end exclusive.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;

export interface DateWindow {
  /** Inclusive start. */
  start: Date;
  /** Exclusive end. */
  end: Date;
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

export function toIsoDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Parse YYYY-MM-DD as UTC midnight. Returns null for malformed or impossible dates. */
export function parseIsoDate(value: string | null | undefined): Date | null {
  const match = ISO_DATE_PATTERN.exec(String(value ?? '').trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** The Monday (UTC midnight) of the week containing `date`; Sunday belongs to the week before. */
export function mondayOf(date: Date): Date {
  const midnight = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayOfWeek = midnight.getUTCDay();
  return addDays(midnight, dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
}

/** Week key (Monday, YYYY-MM-DD) for the week containing `date`. */
export function weekKeyFor(date: Date): string {
  return toIsoDate(mondayOf(date));
}

/**
 * Default briefing week. Prepping on a weekend targets the coming Monday;
 * any other day targets this week's Monday.
 */
export function defaultWeekKey(now: Date = new Date()): string {
  const dayOfWeek = now.getUTCDay();
  if (dayOfWeek === 6 || dayOfWeek === 0) {
    return weekKeyFor(addDays(now, dayOfWeek === 6 ? 2 : 1));
  }
  return weekKeyFor(now);
}

/** The input if it is a valid YYYY-MM-DD Monday, otherwise null. */
export function isoMondayOrNull(value: string | null | undefined): string | null {
  const date = parseIsoDate(value);
  return date && date.getUTCDay() === 1 ? toIsoDate(date) : null;
}

/** Normalize a user-supplied date to its Monday, falling back to the default week. */
export function resolveWeekKey(value: string | null | undefined, now: Date = new Date()): string {
  const parsed = parseIsoDate(value);
  return parsed ? weekKeyFor(parsed) : defaultWeekKey(now);
}

/** The week key `weeks` Mondays after (or before, if negative) `weekKey`. */
export function shiftWeekKey(weekKey: string, weeks: number): string {
  const monday = parseIsoDate(weekKey);
  return monday ? weekKeyFor(addDays(monday, weeks * 7)) : weekKey;
}

/** The seven days the briefing for `weekKey` covers: [Monday - 7 days, Monday). */
export function weekWindow(weekKey: string): DateWindow {
  const monday = parseIsoDate(weekKey);
  if (!monday) throw new RangeError(`Invalid week key: ${weekKey}`);
  return { start: addDays(monday, -7), end: monday };
}

/** Rolling window ending at `now`, covering the previous `days` days. */
export function rollingWindow(now: Date, days: number): DateWindow {
  return { start: new Date(now.getTime() - days * DAY_MS), end: new Date(now.getTime() + 1) };
}

/** Start inclusive, end exclusive. */
export function isInWindow(value: Date | string | null | undefined, window: DateWindow): boolean {
  if (!value) return false;
  const time = (value instanceof Date ? value : new Date(value)).getTime();
  if (Number.isNaN(time)) return false;
  return time >= window.start.getTime() && time < window.end.getTime();
}

const LONG_DATE = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});
const SHORT_DATE = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

export function formatLongDate(date: Date): string {
  return LONG_DATE.format(date);
}

export function formatShortDate(date: Date): string {
  return SHORT_DATE.format(date);
}

const MEDIUM_DATE = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "Nov 12, 2026" for a YYYY-MM-DD string; empty for invalid input. */
export function formatIsoDateLabel(value: string): string {
  const date = parseIsoDate(value);
  return date ? MEDIUM_DATE.format(date) : '';
}

/** Label such as "Nov 2 – Nov 8" for a window whose end is exclusive. */
export function formatWindowLabel(window: DateWindow): string {
  return `${formatShortDate(window.start)} – ${formatShortDate(addDays(window.end, -1))}`;
}
