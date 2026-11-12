import type { Budget, Goal, PrismaClient, Transaction } from '@prisma/client';
import {
  DEDUPE_WINDOW_MS,
  compareTransactions,
  type SyncBudget,
  type SyncGoal,
  type SyncTransaction,
} from '@money-tracker/shared';

/**
 * Write rules shared by sync, SMS ingestion and the REST endpoints.
 *  - ids come from the device, so a retry never creates a second row
 *  - the server version decides conflicts, never a phone clock
 *  - a matching reference number is proof of a duplicate, a close match is only flagged
 */

export type TxnOutcome =
  | { kind: 'applied'; row: Transaction; created?: boolean }
  | { kind: 'conflict'; row: Transaction }
  | { kind: 'duplicate'; existingId: string }
  | { kind: 'flagged'; row: Transaction; similarTo: string }
  | { kind: 'rejected'; reason: string };

const isUniqueViolation = (e: unknown) => (e as { code?: string }).code === 'P2002';
const dateOrNull = (s: string | null) => (s ? new Date(s) : null);

function sameTransaction(a: Transaction, t: SyncTransaction): boolean {
  return (
    a.type === t.type &&
    a.amountPaise === t.amountPaise &&
    a.accountId === t.accountId &&
    a.categoryId === t.categoryId &&
    a.occurredAt.toISOString() === new Date(t.occurredAt).toISOString() &&
    a.note === t.note &&
    a.merchant === t.merchant &&
    a.refNo === t.refNo &&
    a.last4 === t.last4 &&
    a.needsReview === t.needsReview &&
    (a.deletedAt?.toISOString() ?? null) === (t.deletedAt ? new Date(t.deletedAt).toISOString() : null)
  );
}

export async function upsertTransaction(
  prisma: PrismaClient,
  userId: string,
  t: SyncTransaction,
  attempt = 0,
): Promise<TxnOutcome> {
  const account = await prisma.account.findFirst({ where: { id: t.accountId, userId }, select: { id: true } });
  if (!account) return { kind: 'rejected', reason: 'unknown_account' };
  if (t.categoryId) {
    const cat = await prisma.category.findFirst({
      where: { id: t.categoryId, OR: [{ userId }, { userId: null }] },
      select: { id: true },
    });
    if (!cat) return { kind: 'rejected', reason: 'unknown_category' };
  }

  const existing = await prisma.transaction.findUnique({ where: { id: t.id } });
  if (existing) {
    // Someone else's id looks exactly like a missing one, so nothing leaks.
    if (existing.userId !== userId) return { kind: 'rejected', reason: 'id_conflict' };
    if (sameTransaction(existing, t)) return { kind: 'applied', row: existing };
    if (t.baseVersion < existing.version) return { kind: 'conflict', row: existing };
    try {
      const row = await prisma.transaction.update({
        where: { id: t.id },
        data: {
          type: t.type,
          amountPaise: t.amountPaise,
          accountId: t.accountId,
          categoryId: t.categoryId,
          occurredAt: new Date(t.occurredAt),
          note: t.note,
          merchant: t.merchant,
          refNo: t.refNo,
          last4: t.last4,
          needsReview: t.needsReview,
          deletedAt: dateOrNull(t.deletedAt),
          version: { increment: 1 },
        },
      });
      return { kind: 'applied', row };
    } catch (e) {
      if (isUniqueViolation(e)) return { kind: 'rejected', reason: 'duplicate_reference' };
      throw e;
    }
  }

  // New row. A shared reference number is proof it is the same payment.
  if (t.refNo) {
    const dup = await prisma.transaction.findFirst({ where: { userId, refNo: t.refNo }, select: { id: true } });
    if (dup) return { kind: 'duplicate', existingId: dup.id };
  }

  const occurredAt = new Date(t.occurredAt);
  let needsReview = t.needsReview;
  let similarTo: string | null = null;
  if (!t.deletedAt) {
    const near = await prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        type: t.type,
        amountPaise: t.amountPaise,
        occurredAt: {
          gte: new Date(occurredAt.getTime() - DEDUPE_WINDOW_MS),
          lte: new Date(occurredAt.getTime() + DEDUPE_WINDOW_MS),
        },
      },
      take: 10,
    });
    for (const c of near) {
      const verdict = compareTransactions(
        { amountPaise: t.amountPaise, type: t.type, occurredAt, last4: t.last4, refNo: t.refNo },
        { amountPaise: c.amountPaise, type: c.type, occurredAt: c.occurredAt, last4: c.last4, refNo: c.refNo },
      );
      if (verdict === 'POSSIBLE') {
        needsReview = true;
        similarTo = c.id;
        break;
      }
    }
  }

  try {
    const row = await prisma.transaction.create({
      data: {
        id: t.id,
        userId,
        type: t.type,
        amountPaise: t.amountPaise,
        accountId: t.accountId,
        categoryId: t.categoryId,
        occurredAt,
        note: t.note,
        merchant: t.merchant,
        source: t.source,
        refNo: t.refNo,
        last4: t.last4,
        needsReview,
        deletedAt: dateOrNull(t.deletedAt),
      },
    });
    return similarTo ? { kind: 'flagged', row, similarTo } : { kind: 'applied', row, created: true };
  } catch (e) {
    if (!isUniqueViolation(e)) throw e;
    // Two identical requests raced. Run again: the second sees the first one's row.
    if (attempt < 1) return upsertTransaction(prisma, userId, t, attempt + 1);
    return { kind: 'rejected', reason: 'conflict' };
  }
}

export type SimpleOutcome<R> = { kind: 'applied'; row: R } | { kind: 'conflict'; row: R } | { kind: 'rejected'; reason: string };

async function categoryAllowed(prisma: PrismaClient, userId: string, categoryId: string | null) {
  if (!categoryId) return true;
  const cat = await prisma.category.findFirst({
    where: { id: categoryId, OR: [{ userId }, { userId: null }] },
    select: { id: true },
  });
  return !!cat;
}

export async function upsertBudget(prisma: PrismaClient, userId: string, b: SyncBudget): Promise<SimpleOutcome<Budget>> {
  if (!(await categoryAllowed(prisma, userId, b.categoryId))) return { kind: 'rejected', reason: 'unknown_category' };
  const existing = await prisma.budget.findUnique({ where: { id: b.id } });
  if (existing) {
    if (existing.userId !== userId) return { kind: 'rejected', reason: 'id_conflict' };
    const same =
      existing.categoryId === b.categoryId &&
      existing.period === b.period &&
      existing.limitPaise === b.limitPaise &&
      (existing.deletedAt?.toISOString() ?? null) === (b.deletedAt ? new Date(b.deletedAt).toISOString() : null);
    if (same) return { kind: 'applied', row: existing };
    if (b.baseVersion < existing.version) return { kind: 'conflict', row: existing };
    const row = await prisma.budget.update({
      where: { id: b.id },
      data: {
        categoryId: b.categoryId,
        period: b.period,
        limitPaise: b.limitPaise,
        deletedAt: dateOrNull(b.deletedAt),
        version: { increment: 1 },
      },
    });
    return { kind: 'applied', row };
  }
  const row = await prisma.budget.create({
    data: {
      id: b.id,
      userId,
      categoryId: b.categoryId,
      period: b.period,
      limitPaise: b.limitPaise,
      deletedAt: dateOrNull(b.deletedAt),
    },
  });
  return { kind: 'applied', row };
}

export async function upsertGoal(prisma: PrismaClient, userId: string, g: SyncGoal): Promise<SimpleOutcome<Goal>> {
  const deadline = g.deadline ? new Date(`${g.deadline}T00:00:00.000Z`) : null;
  const existing = await prisma.goal.findUnique({ where: { id: g.id } });
  if (existing) {
    if (existing.userId !== userId) return { kind: 'rejected', reason: 'id_conflict' };
    const same =
      existing.name === g.name &&
      existing.targetPaise === g.targetPaise &&
      existing.savedPaise === g.savedPaise &&
      (existing.deadline?.toISOString().slice(0, 10) ?? null) === g.deadline &&
      (existing.deletedAt?.toISOString() ?? null) === (g.deletedAt ? new Date(g.deletedAt).toISOString() : null);
    if (same) return { kind: 'applied', row: existing };
    if (g.baseVersion < existing.version) return { kind: 'conflict', row: existing };
    const row = await prisma.goal.update({
      where: { id: g.id },
      data: {
        name: g.name,
        targetPaise: g.targetPaise,
        savedPaise: g.savedPaise,
        deadline,
        deletedAt: dateOrNull(g.deletedAt),
        version: { increment: 1 },
      },
    });
    return { kind: 'applied', row };
  }
  const row = await prisma.goal.create({
    data: {
      id: g.id,
      userId,
      name: g.name,
      targetPaise: g.targetPaise,
      savedPaise: g.savedPaise,
      deadline,
      deletedAt: dateOrNull(g.deletedAt),
    },
  });
  return { kind: 'applied', row };
}

/** HTTP status for a refused write. Unknown references are the caller's mistake, clashes are conflicts. */
export function rejectStatus(reason: string): 400 | 409 {
  return reason === 'unknown_account' || reason === 'unknown_category' ? 400 : 409;
}
