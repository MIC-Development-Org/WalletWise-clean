import type { FastifyPluginAsync } from 'fastify';
import {
  cycleFor,
  insightsQuery,
  previousCycle,
  runwayDate,
  safeToSpend,
  type Insights,
} from '@money-tracker/shared';
import { requireAuth } from '../lib/guard';

/**
 * Safe to spend, runway and patterns, worked out on the server from the same shared maths the apps use.
 * The process runs with TZ=UTC. "Now" is shifted by the user's offset so a day means the user's day.
 */
export const insightRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', requireAuth(app));

  app.get('/', async (req, reply): Promise<Insights | void> => {
    const userId = req.user.sub;
    const q = insightsQuery.parse(req.query);
    const user = await app.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.status(401).send({ error: 'unauthorized' });

    const shift = q.tzOffset * 60_000;
    const wall = new Date(Date.now() - shift);
    const cycle = cycleFor(wall, user.cycleStartDay);
    const prev = previousCycle(cycle, user.cycleStartDay);
    const instant = (d: Date) => new Date(d.getTime() + shift);

    const counted = { userId, deletedAt: null, needsReview: false } as const;
    const inCycle = { gte: instant(cycle.start), lt: instant(cycle.end) };

    const [byCat, income, prevSpent, overall, recent] = await Promise.all([
      app.prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { ...counted, type: 'EXPENSE', occurredAt: inCycle },
        _sum: { amountPaise: true },
      }),
      app.prisma.transaction.aggregate({
        where: { ...counted, type: 'INCOME', occurredAt: inCycle },
        _sum: { amountPaise: true },
      }),
      app.prisma.transaction.aggregate({
        where: { ...counted, type: 'EXPENSE', occurredAt: { gte: instant(prev.start), lt: instant(prev.end) } },
        _sum: { amountPaise: true },
      }),
      app.prisma.budget.findFirst({ where: { userId, categoryId: null, deletedAt: null } }),
      app.prisma.transaction.findMany({
        where: { ...counted, type: 'EXPENSE', occurredAt: { gte: new Date(Date.now() - 56 * 86_400_000) } },
        select: { occurredAt: true, amountPaise: true },
      }),
    ]);

    const categories = byCat
      .map((r) => ({ categoryId: r.categoryId, paise: r._sum.amountPaise ?? 0 }))
      .sort((a, b) => b.paise - a.paise);
    const spent = categories.reduce((s, c) => s + c.paise, 0);
    const budget = overall?.limitPaise ?? user.allowancePaise;
    const prevPaise = prevSpent._sum.amountPaise ?? 0;
    const runway = runwayDate(budget, spent, cycle.daysElapsed, wall);

    const perWeekday = new Array<number>(7).fill(0);
    for (const r of recent) perWeekday[new Date(r.occurredAt.getTime() - shift).getUTCDay()]! += r.amountPaise;
    const top = Math.max(...perWeekday);

    return {
      cycle: {
        start: instant(cycle.start).toISOString(),
        end: instant(cycle.end).toISOString(),
        daysLeft: cycle.daysLeft,
        daysTotal: cycle.daysTotal,
      },
      budgetPaise: budget,
      spentPaise: spent,
      incomePaise: income._sum.amountPaise ?? 0,
      leftPaise: budget - spent,
      safeToSpendPaise: safeToSpend(budget, spent, cycle.daysLeft),
      runway: runway ? runway.toISOString().slice(0, 10) : null,
      prevSpentPaise: prevPaise,
      // No previous spending means there is nothing to compare with, so no number and no divide by zero.
      changeVsPrevPct: prevPaise > 0 ? Math.round(((spent - prevPaise) / prevPaise) * 100) : null,
      byCategory: categories,
      patterns: {
        topCategoryId: categories[0]?.categoryId ?? null,
        busiestWeekday: top > 0 ? perWeekday.indexOf(top) : null,
      },
    };
  });
};
