import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { goalBody, paise } from '@money-tracker/shared';
import { toGoalDTO } from '../lib/dto';
import { requireAuth } from '../lib/guard';
import { rejectStatus, upsertGoal } from '../lib/sync';

const idParams = z.object({ id: z.string().uuid() });
const updateBody = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  targetPaise: paise.optional(),
  savedPaise: z.number().int().min(0).max(2_000_000_000).optional(),
  deadline: z.iso.date().nullable().optional(),
  baseVersion: z.number().int().min(0).optional(),
});

export const goalRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', requireAuth(app));

  app.get('/', async (req) => {
    const rows = await app.prisma.goal.findMany({
      where: { userId: req.user.sub, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toGoalDTO);
  });

  app.post('/', async (req, reply) => {
    const userId = req.user.sub;
    const body = goalBody.parse(req.body);
    const existed = await app.prisma.goal.findUnique({ where: { id: body.id }, select: { id: true } });
    const out = await upsertGoal(app.prisma, userId, { ...body, baseVersion: 0, deletedAt: null });
    if (out.kind === 'rejected') return reply.status(rejectStatus(out.reason)).send({ error: out.reason });
    return reply.status(existed ? 200 : 201).send(toGoalDTO(out.row));
  });

  app.put('/:id', async (req, reply) => {
    const userId = req.user.sub;
    const { id } = idParams.parse(req.params);
    const body = updateBody.parse(req.body);
    const cur = await app.prisma.goal.findFirst({ where: { id, userId, deletedAt: null } });
    if (!cur) return reply.status(404).send({ error: 'not_found' });
    const out = await upsertGoal(app.prisma, userId, {
      id,
      name: body.name ?? cur.name,
      targetPaise: body.targetPaise ?? cur.targetPaise,
      savedPaise: body.savedPaise ?? cur.savedPaise,
      deadline: body.deadline === undefined ? (cur.deadline ? cur.deadline.toISOString().slice(0, 10) : null) : body.deadline,
      baseVersion: body.baseVersion ?? cur.version,
      deletedAt: null,
    });
    if (out.kind === 'conflict') return reply.status(409).send({ error: 'version_conflict', server: toGoalDTO(out.row) });
    if (out.kind === 'rejected') return reply.status(rejectStatus(out.reason)).send({ error: out.reason });
    return toGoalDTO(out.row);
  });

  app.delete('/:id', async (req, reply) => {
    const { id } = idParams.parse(req.params);
    const res = await app.prisma.goal.updateMany({
      where: { id, userId: req.user.sub, deletedAt: null },
      data: { deletedAt: new Date(), version: { increment: 1 } },
    });
    if (res.count === 0) return reply.status(404).send({ error: 'not_found' });
    return reply.status(204).send();
  });
};
