/**
 * Budget cycle maths, shared by the API (insights) and the apps. Pure functions over `Date`.
 * Dates use the process' local calendar. The API runs with TZ=UTC and shifts "now" by the
 * user's offset first, so "today" is always the user's day.
 */

export interface Cycle {
  /** First day of the cycle at local midnight. */
  start: Date;
  /** First day of the NEXT cycle (exclusive end) at local midnight. */
  end: Date;
  /** Days left including today. Never below 1. */
  daysLeft: number;
  daysTotal: number;
  /** Days elapsed including today. At least 1. */
  daysElapsed: number;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function clampDay(year: number, month: number, day: number): Date {
  const last = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, last));
}

const MS_DAY = 86_400_000;
function diffDays(a: Date, b: Date): number {
  // Calendar fields through UTC, so daylight saving never skews the count.
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / MS_DAY);
}

/** The budget cycle that contains `now`, restarting on `startDay` (1-28) each month. */
export function cycleFor(now: Date, startDay: number): Cycle {
  const today = startOfDay(now);
  const day = Math.min(Math.max(Math.round(startDay), 1), 28);
  let start = clampDay(today.getFullYear(), today.getMonth(), day);
  if (start > today) start = clampDay(today.getFullYear(), today.getMonth() - 1, day);
  const end = clampDay(start.getFullYear(), start.getMonth() + 1, day);
  return {
    start,
    end,
    daysTotal: diffDays(start, end),
    daysLeft: Math.max(1, diffDays(today, end)),
    daysElapsed: Math.max(1, diffDays(start, today) + 1),
  };
}

export function previousCycle(c: Cycle, startDay: number): { start: Date; end: Date } {
  const day = Math.min(Math.max(Math.round(startDay), 1), 28);
  return { start: clampDay(c.start.getFullYear(), c.start.getMonth() - 1, day), end: c.start };
}

/** Budget left divided by days left, in whole paise. Never negative. */
export function safeToSpend(budgetPaise: number, spentPaise: number, daysLeft: number): number {
  const left = budgetPaise - spentPaise;
  if (left <= 0) return 0;
  return Math.floor(left / Math.max(1, daysLeft));
}

/** The date the money runs out at the current pace. Null when nothing has been spent yet. */
export function runwayDate(budgetPaise: number, spentPaise: number, daysElapsed: number, today: Date): Date | null {
  if (spentPaise <= 0) return null;
  const left = budgetPaise - spentPaise;
  if (left <= 0) return startOfDay(today);
  const perDay = spentPaise / Math.max(1, daysElapsed);
  return addDays(startOfDay(today), Math.floor(left / perDay));
}

/** Paise to set aside per day to hit a goal. Never negative, even past the deadline. */
export function goalPerDay(targetPaise: number, savedPaise: number, deadline: Date | null, now: Date): number | null {
  if (!deadline) return null;
  const remaining = targetPaise - savedPaise;
  if (remaining <= 0) return 0;
  const days = diffDays(startOfDay(now), deadline);
  if (days <= 0) return remaining;
  return Math.ceil(remaining / days);
}
