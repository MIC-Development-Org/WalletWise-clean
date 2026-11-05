import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createTransactionBody, listTransactionsQuery } from '@money-tracker/shared';

const idParams = z.object({ id: z.string().uuid() });

export const transactionRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', async (req, reply) => {
    try {
      await app.authenticate(req);
    } catch {
      return reply.status(401).send({ error: 'unauthorized' });
    }
  });

  app.get('/', async (req) => {
    const userId = req.user.sub;
    const q = listTransactionsQuery.parse(req.query);
    return app.prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        occurredAt: {
          ...(q.from && { gte: new Date(q.from) }),
          ...(q.to && { lte: new Date(q.to) }),
        },
      },
      orderBy: { occurredAt: 'desc' },
      take: q.limit,
    });
  });

  /** Idempotent: sending the same id again returns the stored record. */
  app.post('/', async (req, reply) => {
    const userId = req.user.sub;
    const body = createTransactionBody.parse(req.body);

    const account = await app.prisma.account.findFirst({
      where: { id: body.accountId, userId },
      select: { id: true },
    });
    if (!account) return reply.status(400).send({ error: 'unknown_account' });

    if (body.categoryId) {
      const cat = await app.prisma.category.findFirst({
        where: { id: body.categoryId, OR: [{ userId }, { userId: null }] },
        select: { id: true },
      });
      if (!cat) return reply.status(400).send({ error: 'unknown_category' });
    }

    const existing = await app.prisma.transaction.findUnique({ where: { id: body.id } });
    if (existing) {
      if (existing.userId !== userId) return reply.status(409).send({ error: 'id_conflict' });
      return reply.status(200).send(existing);
    }

    try {
      const created = await app.prisma.transaction.create({
        data: { ...body, userId, occurredAt: new Date(body.occurredAt) },
      });
      return reply.status(201).send(created);
    } catch (e) {
      // Same payment already stored through another source (matching reference number).
      if ((e as { code?: string }).code === 'P2002') {
        return reply.status(409).send({ error: 'duplicate_reference' });
      }
      throw e;
    }
  });

  app.delete('/:id', async (req, reply) => {
    const userId = req.user.sub;
    const { id } = idParams.parse(req.params);
    const res = await app.prisma.transaction.updateMany({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date(), version: { increment: 1 } },
    });
    if (res.count === 0) return reply.status(404).send({ error: 'not_found' });
    return reply.status(204).send();
  });
};
