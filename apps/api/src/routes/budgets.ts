import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { budgetBody, budgetPeriod, idSchema, paise } from '@money-tracker/shared';
import { toBudgetDTO } from '../lib/dto';
import { requireAuth } from '../lib/guard';
import { rejectStatus, upsertBudget } from '../lib/sync';

const idParams = z.object({ id: z.string().uuid() });
const updateBody = z.object({
  categoryId: idSchema.nullable().optional(),
  period: budgetPeriod.optional(),
  limitPaise: paise.optional(),
  baseVersion: z.number().int().min(0).optional(),
});

export const budgetRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', requireAuth(app));

  app.get('/', async (req) => {
    const rows = await app.prisma.budget.findMany({
      where: { userId: req.user.sub, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toBudgetDTO);
  });

  /** Idempotent on the client generated id. */
  app.post('/', async (req, reply) => {
    const userId = req.user.sub;
    const body = budgetBody.parse(req.body);
    const existed = await app.prisma.budget.findUnique({ where: { id: body.id }, select: { id: true } });
    const out = await upsertBudget(app.prisma, userId, { ...body, baseVersion: 0, deletedAt: null });
    if (out.kind === 'rejected') return reply.status(rejectStatus(out.reason)).send({ error: out.reason });
    return reply.status(existed ? 200 : 201).send(toBudgetDTO(out.row));
  });

  app.put('/:id', async (req, reply) => {
    const userId = req.user.sub;
    const { id } = idParams.parse(req.params);
    const body = updateBody.parse(req.body);
    const cur = await app.prisma.budget.findFirst({ where: { id, userId, deletedAt: null } });
    if (!cur) return reply.status(404).send({ error: 'not_found' });
    const out = await upsertBudget(app.prisma, userId, {
      id,
      categoryId: body.categoryId === undefined ? cur.categoryId : body.categoryId,
      period: body.period ?? cur.period,
      limitPaise: body.limitPaise ?? cur.limitPaise,
      baseVersion: body.baseVersion ?? cur.version,
      deletedAt: null,
    });
    if (out.kind === 'conflict') return reply.status(409).send({ error: 'version_conflict', server: toBudgetDTO(out.row) });
    if (out.kind === 'rejected') return reply.status(rejectStatus(out.reason)).send({ error: out.reason });
    return toBudgetDTO(out.row);
  });

  app.delete('/:id', async (req, reply) => {
    const { id } = idParams.parse(req.params);
    const res = await app.prisma.budget.updateMany({
      where: { id, userId: req.user.sub, deletedAt: null },
      data: { deletedAt: new Date(), version: { increment: 1 } },
    });
    if (res.count === 0) return reply.status(404).send({ error: 'not_found' });
    return reply.status(204).send();
  });
};
