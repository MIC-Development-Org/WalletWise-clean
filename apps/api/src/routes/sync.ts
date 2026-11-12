import type { FastifyPluginAsync } from 'fastify';
import {
  syncChangesQuery,
  syncPushBody,
  type PushResult,
  type SyncChanges,
} from '@money-tracker/shared';
import { toAccountDTO, toBudgetDTO, toGoalDTO, toMeDTO, toTransactionDTO } from '../lib/dto';
import { requireAuth } from '../lib/guard';
import { upsertBudget, upsertGoal, upsertTransaction } from '../lib/sync';

export const syncRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', requireAuth(app));

  /**
   * Everything that changed at or after the cursor, including deletions (tombstones).
   * Rows at the boundary can arrive twice, which is harmless because clients apply by version.
   */
  app.get('/changes', async (req, reply): Promise<SyncChanges | void> => {
    const userId = req.user.sub;
    const q = syncChangesQuery.parse(req.query);
    const since = q.cursor ? new Date(q.cursor) : new Date(0);
    const where = { userId, updatedAt: { gte: since } };
    const order = [{ updatedAt: 'asc' as const }, { id: 'asc' as const }];
    const take = q.limit + 1;

    const [me, accounts, tx, budgets, goals] = await Promise.all([
      app.prisma.user.findUnique({ where: { id: userId } }),
      app.prisma.account.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      app.prisma.transaction.findMany({ where, orderBy: order, take }),
      app.prisma.budget.findMany({ where, orderBy: order, take }),
      app.prisma.goal.findMany({ where, orderBy: order, take }),
    ]);
    if (!me) return reply.status(401).send({ error: 'unauthorized' });

    // If any table has more rows than fit, the next cursor must not skip past the rows we cut off.
    const cut = <T extends { updatedAt: Date }>(rows: T[]) => ({
      rows: rows.slice(0, q.limit),
      more: rows.length > q.limit,
    });
    const t = cut(tx);
    const b = cut(budgets);
    const g = cut(goals);
    const hasMore = t.more || b.more || g.more;

    const lastOf = (r: { rows: { updatedAt: Date }[] }) => r.rows[r.rows.length - 1]?.updatedAt;
    let cursor: Date;
    if (hasMore) {
      const limits = [t, b, g].filter((x) => x.more).map((x) => lastOf(x)!.getTime());
      cursor = new Date(Math.min(...limits));
    } else {
      const all = [lastOf(t), lastOf(b), lastOf(g)].filter((d): d is Date => !!d).map((d) => d.getTime());
      cursor = all.length ? new Date(Math.max(...all)) : since;
    }

    return {
      cursor: cursor.toISOString(),
      hasMore,
      me: toMeDTO(me),
      accounts: accounts.map(toAccountDTO),
      transactions: t.rows.map(toTransactionDTO),
      budgets: b.rows.map(toBudgetDTO),
      goals: g.rows.map(toGoalDTO),
    };
  });

  /** Upload local changes. Every row is applied on its own, so one bad row never blocks the rest. */
  app.post('/push', async (req): Promise<PushResult> => {
    const userId = req.user.sub;
    const body = syncPushBody.parse(req.body);
    const result: PushResult = { applied: [], conflicts: [], duplicates: [], flagged: [], rejected: [] };

    for (const t of body.transactions) {
      const out = await upsertTransaction(app.prisma, userId, t);
      if (out.kind === 'applied') result.applied.push({ kind: 'transaction', id: t.id, version: out.row.version });
      else if (out.kind === 'flagged') {
        result.applied.push({ kind: 'transaction', id: t.id, version: out.row.version });
        result.flagged.push({ id: t.id, similarTo: out.similarTo });
      } else if (out.kind === 'conflict') result.conflicts.push({ kind: 'transaction', id: t.id, server: toTransactionDTO(out.row) });
      else if (out.kind === 'duplicate') result.duplicates.push({ id: t.id, existingId: out.existingId });
      else result.rejected.push({ kind: 'transaction', id: t.id, reason: out.reason });
    }
    for (const b of body.budgets) {
      const out = await upsertBudget(app.prisma, userId, b);
      if (out.kind === 'applied') result.applied.push({ kind: 'budget', id: b.id, version: out.row.version });
      else if (out.kind === 'conflict') result.conflicts.push({ kind: 'budget', id: b.id, server: toBudgetDTO(out.row) });
      else result.rejected.push({ kind: 'budget', id: b.id, reason: out.reason });
    }
    for (const g of body.goals) {
      const out = await upsertGoal(app.prisma, userId, g);
      if (out.kind === 'applied') result.applied.push({ kind: 'goal', id: g.id, version: out.row.version });
      else if (out.kind === 'conflict') result.conflicts.push({ kind: 'goal', id: g.id, server: toGoalDTO(out.row) });
      else result.rejected.push({ kind: 'goal', id: g.id, reason: out.reason });
    }
    return result;
  });
};
