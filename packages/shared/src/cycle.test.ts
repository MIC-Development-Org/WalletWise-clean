import { describe, expect, it } from 'vitest';
import { cycleFor, goalPerDay, runwayDate, safeToSpend } from './cycle';
const pad = (n: number) => String(n).padStart(2, '0');
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

describe('cycleFor', () => {
  it('groups spending from the allowance day, not the 1st (B-03)', () => {
    const c = cycleFor(new Date(2026, 10, 22), 5);
    expect(dayKey(c.start)).toBe('2026-11-05');
    expect(dayKey(c.end)).toBe('2026-12-05');
    expect(c.daysLeft).toBe(13);
  });

  it('rolls back into the previous month before the start day', () => {
    const c = cycleFor(new Date(2026, 10, 2), 5);
    expect(dayKey(c.start)).toBe('2026-10-05');
    expect(dayKey(c.end)).toBe('2026-11-05');
  });

  it('crosses a year boundary', () => {
    const c = cycleFor(new Date(2027, 0, 3), 10);
    expect(dayKey(c.start)).toBe('2026-12-10');
    expect(dayKey(c.end)).toBe('2027-01-10');
  });

  it('counts today as a spendable day on the last day of the cycle', () => {
    const c = cycleFor(new Date(2026, 10, 30), 1);
    expect(c.daysLeft).toBe(1);
  });
});

describe('safeToSpend', () => {
  it('divides what is left by the days left, in whole paise (B-04)', () => {
    expect(safeToSpend(800000, 500000, 9)).toBe(33333);
  });

  it('is zero, never negative, when overspent', () => {
    expect(safeToSpend(100000, 150000, 5)).toBe(0);
  });
});

describe('runwayDate', () => {
  const today = new Date(2026, 10, 22);

  it('has no end date and no divide by zero when nothing is spent (B-05)', () => {
    expect(runwayDate(800000, 0, 18, today)).toBeNull();
  });

  it('projects the date the money runs out at the current pace', () => {
    // Spent 4,500 in 18 days = 250 a day, 3,500 left = 14 more days.
    expect(dayKey(runwayDate(800000, 450000, 18, today)!)).toBe('2026-12-06');
  });

  it('is today when the budget is already gone', () => {
    expect(dayKey(runwayDate(100000, 120000, 10, today)!)).toBe('2026-11-22');
  });
});

describe('goalPerDay', () => {
  const now = new Date(2026, 10, 22);

  it('spreads the remainder over the days to the deadline', () => {
    expect(goalPerDay(300000, 180000, new Date(2026, 11, 22), now)).toBe(4000);
  });

  it('never goes negative after the deadline (B-06)', () => {
    expect(goalPerDay(300000, 180000, new Date(2026, 10, 1), now)).toBe(120000);
  });

  it('is zero when the goal is met', () => {
    expect(goalPerDay(300000, 300000, new Date(2026, 11, 22), now)).toBe(0);
  });
});
