import type { Account, Budget, Category, Goal, Transaction, User } from '@prisma/client';
import type { AccountDTO, BudgetDTO, CategoryDTO, GoalDTO, MeDTO, TransactionDTO } from '@money-tracker/shared';

const iso = (d: Date | null) => (d ? d.toISOString() : null);

export const toTransactionDTO = (t: Transaction): TransactionDTO => ({
  id: t.id,
  type: t.type,
  amountPaise: t.amountPaise,
  accountId: t.accountId,
  categoryId: t.categoryId,
  occurredAt: t.occurredAt.toISOString(),
  note: t.note,
  merchant: t.merchant,
  source: t.source,
  refNo: t.refNo,
  last4: t.last4,
  needsReview: t.needsReview,
  deletedAt: iso(t.deletedAt),
  version: t.version,
  updatedAt: t.updatedAt.toISOString(),
});

export const toBudgetDTO = (b: Budget): BudgetDTO => ({
  id: b.id,
  categoryId: b.categoryId,
  period: b.period,
  limitPaise: b.limitPaise,
  deletedAt: iso(b.deletedAt),
  version: b.version,
  updatedAt: b.updatedAt.toISOString(),
});

export const toGoalDTO = (g: Goal): GoalDTO => ({
  id: g.id,
  name: g.name,
  targetPaise: g.targetPaise,
  savedPaise: g.savedPaise,
  deadline: g.deadline ? g.deadline.toISOString().slice(0, 10) : null,
  deletedAt: iso(g.deletedAt),
  version: g.version,
  updatedAt: g.updatedAt.toISOString(),
});

export const toMeDTO = (u: User): MeDTO => ({
  id: u.id,
  email: u.email,
  name: u.name,
  allowancePaise: u.allowancePaise,
  cycleStartDay: u.cycleStartDay,
});

export const toAccountDTO = (a: Account): AccountDTO => ({ id: a.id, name: a.name, type: a.type });

export const toCategoryDTO = (c: Category): CategoryDTO => ({
  id: c.id,
  name: c.name,
  icon: c.icon,
  isIncome: c.isIncome,
  builtIn: c.userId === null,
});
