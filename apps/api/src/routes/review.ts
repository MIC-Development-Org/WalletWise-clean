import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { reviewDecisionBody } from '@money-tracker/shared';
import { toTransactionDTO } from '../lib/dto';
import { requireAuth } from '../lib/guard';

const idParams = z.object({ id: z.string().uuid() });

/** Captures the app was unsure about. Nothing here counts toward totals until the user accepts it. */
export const reviewRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', requireAuth(app));

  app.get('/', async (req) => {
    const rows = await app.prisma.transaction.findMany({
      where: { userId: req.user.sub, needsReview: true, deletedAt: null },
      orderBy: { occurredAt: 'desc' },
      take: 200,
    });
    return rows.map(toTransactionDTO);
  });

  app.post('/:id', async (req, reply) => {
    const userId = req.user.sub;
    const { id } = idParams.parse(req.params);
    const body = reviewDecisionBody.parse(req.body);
    const row = await app.prisma.transaction.findFirst({ where: { id, userId, needsReview: true, deletedAt: null } });
    if (!row) return reply.status(404).send({ error: 'not_found' });

    if (body.categoryId) {
      const cat = await app.prisma.category.findFirst({
        where: { id: body.categoryId, OR: [{ userId }, { userId: null }] },
        select: { id: true },
      });
      if (!cat) return reply.status(400).send({ error: 'unknown_category' });
    }

    const updated = await app.prisma.transaction.update({
      where: { id },
      data:
        body.decision === 'accept'
          ? { needsReview: false, ...(body.categoryId && { categoryId: body.categoryId }), version: { increment: 1 } }
          : { deletedAt: new Date(), version: { increment: 1 } },
    });
    return toTransactionDTO(updated);
  });
};
