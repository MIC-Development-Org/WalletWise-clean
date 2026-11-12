import { cycleFor, goalPerDay, previousCycle, runwayDate, safeToSpend, type Cycle } from './cycle';
import type { LocalBudget, LocalGoal, LocalTransaction, Settings } from './db';
import { addDays, dayKey, startOfDay } from './format';

export interface CategorySlice {
  id: string;
  paise: number;
  /** 0-100, share of total spend this cycle. */
  pct: number;
}

export interface BudgetView {
  id: string;
  categoryId: string | null;
  limitPaise: number;
  spentPaise: number;
  /** Can exceed 100. */
  pct: number;
}

export interface GoalView extends LocalGoal {
  pct: number;
  perDayPaise: number | null;
}

export interface Snapshot {
  now: Date;
  name: string;
  allowancePaise: number;
  cycle: Cycle;
  budgetPaise: number;
  spentPaise: number;
  incomePaise: number;
  leftPaise: number;
  /** 0-100+, share of the budget used. */
  usedPct: number;
  safeToSpendPaise: number;
  runway: Date | null;
  prevSpentPaise: number;
  byCategory: CategorySlice[];
  daily: { key: string; date: Date; paise: number; isToday: boolean }[];
  /** All live (not deleted, not awaiting review) transactions, newest first. */
  transactions: LocalTransaction[];
  review: LocalTransaction[];
  budgets: BudgetView[];
  goals: GoalView[];
}

export interface SnapshotInput {
  now: Date;
  settings: Settings;
  transactions: LocalTransaction[];
  budgets: LocalBudget[];
  goals: LocalGoal[];
}

const sum = (list: LocalTransaction[]) => list.reduce((s, t) => s + t.amountPaise, 0);

export function buildSnapshot({ now, settings, transactions, budgets, goals }: SnapshotInput): Snapshot {
  const cycle = cycleFor(now, settings.cycleStartDay);
  const prev = previousCycle(cycle, settings.cycleStartDay);
  const live = transactions.filter((t) => !t.deletedAt);
  budgets = budgets.filter((b) => !b.deletedAt);
  goals = goals.filter((g) => !g.deletedAt);
  const review = live.filter((t) => t.needsReview);
  // Uncertain captures never count toward totals until the user accepts them.
  const counted = live
    .filter((t) => !t.needsReview)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  const inRange = (t: LocalTransaction, from: Date, to: Date) => {
    const at = new Date(t.occurredAt);
    return at >= from && at < to;
  };
  const cycleTx = counted.filter((t) => inRange(t, cycle.start, cycle.end));
  const expenses = cycleTx.filter((t) => t.type === 'EXPENSE');
  const spentPaise = sum(expenses);
  const incomePaise = sum(cycleTx.filter((t) => t.type === 'INCOME'));
  const prevSpentPaise = sum(counted.filter((t) => t.type === 'EXPENSE' && inRange(t, prev.start, prev.end)));

  const overall = budgets.find((b) => b.categoryId === null);
  const budgetPaise = overall?.limitPaise ?? settings.allowancePaise;
  const leftPaise = budgetPaise - spentPaise;

  const byCat = new Map<string, number>();
  for (const t of expenses) byCat.set(t.categoryId, (byCat.get(t.categoryId) ?? 0) + t.amountPaise);
  const byCategory: CategorySlice[] = [...byCat]
    .map(([id, paise]) => ({ id, paise, pct: spentPaise ? (paise / spentPaise) * 100 : 0 }))
    .sort((a, b) => b.paise - a.paise);

  const perDay = new Map<string, number>();
  for (const t of expenses) {
    const k = dayKey(new Date(t.occurredAt));
    perDay.set(k, (perDay.get(k) ?? 0) + t.amountPaise);
  }
  const today = startOfDay(now);
  const todayKey = dayKey(today);
  const daily = Array.from({ length: cycle.daysElapsed }, (_, i) => {
    const date = addDays(cycle.start, i);
    const key = dayKey(date);
    return { key, date, paise: perDay.get(key) ?? 0, isToday: key === todayKey };
  });

  const budgetViews: BudgetView[] = budgets
    .filter((b) => b.categoryId !== null)
    .map((b) => {
      const spent = sum(expenses.filter((t) => t.categoryId === b.categoryId));
      return { ...b, spentPaise: spent, pct: b.limitPaise ? (spent / b.limitPaise) * 100 : 0 };
    })
    .sort((a, b) => b.pct - a.pct);

  const goalViews: GoalView[] = goals.map((g) => ({
    ...g,
    pct: g.targetPaise ? Math.min(100, (g.savedPaise / g.targetPaise) * 100) : 0,
    perDayPaise: goalPerDay(g.targetPaise, g.savedPaise, g.deadline ? new Date(`${g.deadline}T00:00:00`) : null, now),
  }));

  return {
    now,
    name: settings.name,
    allowancePaise: settings.allowancePaise,
    cycle,
    budgetPaise,
    spentPaise,
    incomePaise,
    leftPaise,
    usedPct: budgetPaise ? (spentPaise / budgetPaise) * 100 : 0,
    safeToSpendPaise: safeToSpend(budgetPaise, spentPaise, cycle.daysLeft),
    runway: runwayDate(budgetPaise, spentPaise, cycle.daysElapsed, now),
    prevSpentPaise,
    byCategory,
    daily,
    transactions: counted,
    review,
    budgets: budgetViews,
    goals: goalViews,
  };
}
