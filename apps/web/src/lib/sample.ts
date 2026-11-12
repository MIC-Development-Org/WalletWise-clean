import { cycleFor } from './cycle';
import type { AccountId, LocalBudget, LocalGoal, LocalTransaction, Settings, TxnSource } from './db';
import { addDays, startOfDay } from './format';
import { buildSnapshot, type Snapshot } from './snapshot';

/** A fixed "now" so landing previews and screenshots never drift. */
export const SAMPLE_NOW = new Date(2026, 10, 22, 19, 30);

export const SAMPLE_SETTINGS: Settings = {
  onboarded: true,
  name: 'Arjun',
  allowancePaise: 800000,
  cycleStartDay: 1,
};

// [days ago, hour, category, paise, merchant, account, source]
type Row = [number, number, string, number, string, AccountId, TxnSource];
const ROWS: Row[] = [
  [21, 9, 'allowance', 800000, 'Allowance', 'bank', 'SMS'],
  [20, 13, 'mess', 180000, 'Hostel mess fee', 'bank', 'MANUAL'],
  [18, 18, 'recharge', 29900, 'Airtel recharge', 'upi', 'SMS'],
  [17, 16, 'canteen', 8500, 'Canteen', 'upi', 'SMS'],
  [16, 20, 'canteen', 12000, 'Tea Time', 'upi', 'SMS'],
  [15, 11, 'printouts', 4000, 'Xerox corner', 'cash', 'MANUAL'],
  [14, 17, 'canteen', 9000, 'Canteen', 'upi', 'SMS'],
  [13, 10, 'laundry', 15000, 'Hostel laundry', 'upi', 'SMS'],
  [12, 21, 'fun', 25000, 'Movie night', 'upi', 'SMS'],
  [11, 13, 'canteen', 7500, 'Canteen', 'upi', 'SMS'],
  [10, 15, 'books', 45000, 'Campus bookstore', 'upi', 'SMS'],
  [9, 19, 'canteen', 11000, 'Night mess', 'upi', 'SMS'],
  [8, 12, 'shopping', 60000, 'Amazon', 'bank', 'EMAIL'],
  [7, 18, 'canteen', 8000, 'Canteen', 'upi', 'SMS'],
  [6, 14, 'health', 12000, 'Pharmacy', 'cash', 'MANUAL'],
  [5, 20, 'canteen', 14000, 'Pizza with friends', 'upi', 'SMS'],
  [3, 13, 'canteen', 9500, 'Canteen', 'upi', 'SMS'],
  [2, 17, 'canteen', 8500, 'Canteen', 'upi', 'SMS'],
  [1, 20, 'laundry', 12000, 'Hostel laundry', 'upi', 'SMS'],
  [0, 8, 'canteen', 4000, 'Morning chai', 'cash', 'MANUAL'],
  [0, 12, 'canteen', 8500, 'Canteen', 'upi', 'SMS'],
  // Previous cycle, so month over month has something to compare.
  [50, 13, 'mess', 180000, 'Hostel mess fee', 'bank', 'MANUAL'],
  [45, 18, 'recharge', 29900, 'Airtel recharge', 'upi', 'SMS'],
  [40, 17, 'canteen', 150000, 'Canteen', 'upi', 'SMS'],
  [30, 15, 'shopping', 100000, 'Amazon', 'bank', 'EMAIL'],
  [25, 12, 'books', 60000, 'Campus bookstore', 'upi', 'SMS'],
];

/**
 * Spread the sample over whatever cycle `now` is in. Rows up to 21 days old are squeezed into the days
 * elapsed so far, and older rows always land in the previous cycle, so totals and month over month both work.
 * With the landing page's fixed date this maps to the identity.
 */
function fitAgo(ago: number, daysElapsed: number): number {
  if (ago <= 21) return Math.round((ago * (daysElapsed - 1)) / 21);
  return daysElapsed + (ago - 22);
}

export function sampleTransactions(now: Date, mkId: () => string, cycleStartDay = 1): LocalTransaction[] {
  const today = startOfDay(now);
  const { daysElapsed } = cycleFor(now, cycleStartDay);
  const live: LocalTransaction[] = ROWS.map(([ago, hour, categoryId, amountPaise, merchant, accountId, source]) => {
    const at = addDays(today, -fitAgo(ago, daysElapsed));
    at.setHours(hour, 5, 0, 0);
    return {
      id: mkId(),
      type: categoryId === 'allowance' ? ('INCOME' as const) : ('EXPENSE' as const),
      amountPaise,
      accountId,
      categoryId,
      occurredAt: at.toISOString(),
      note: '',
      merchant,
      source,
      synced: false,
    } satisfies LocalTransaction;
  });
  // One uncertain capture, to show the review list instead of guessing.
  const unsure = new Date(today);
  unsure.setHours(18, 10, 0, 0);
  live.push({
    id: mkId(),
    type: 'EXPENSE',
    amountPaise: 34900,
    accountId: 'upi',
    categoryId: 'other',
    occurredAt: unsure.toISOString(),
    note: '',
    merchant: 'UPI/CR8821/KUMAR S',
    source: 'SMS',
    needsReview: true,
    synced: false,
  });
  return live;
}

export function sampleBudgets(mkId: () => string, overallPaise = 800000): LocalBudget[] {
  return [
    { id: mkId(), categoryId: null, limitPaise: overallPaise, synced: false },
    { id: mkId(), categoryId: 'mess', limitPaise: 200000, synced: false },
    { id: mkId(), categoryId: 'canteen', limitPaise: 120000, synced: false },
    { id: mkId(), categoryId: 'recharge', limitPaise: 40000, synced: false },
    { id: mkId(), categoryId: 'fun', limitPaise: 30000, synced: false },
  ];
}

export function sampleGoals(mkId: () => string): LocalGoal[] {
  return [
    { id: mkId(), name: 'Headphones', targetPaise: 300000, savedPaise: 180000, deadline: '2026-12-22', synced: false },
    { id: mkId(), name: 'Trip home', targetPaise: 500000, savedPaise: 120000, deadline: '2027-01-10', synced: false },
  ];
}

let n = 0;
const fixedId = () => `sample-${++n}`;

/** The same data the demo mode loads, computed for the landing page and screenshots. */
export function sampleSnapshot(): Snapshot {
  n = 0;
  return buildSnapshot({
    now: SAMPLE_NOW,
    settings: SAMPLE_SETTINGS,
    transactions: sampleTransactions(SAMPLE_NOW, fixedId),
    budgets: sampleBudgets(fixedId),
    goals: sampleGoals(fixedId),
  });
}
