import type { FastifyPluginAsync } from 'fastify';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { createTransactionBody, searchTransactionsQuery, updateTransactionBody } from '@money-tracker/shared';
import { toTransactionDTO } from '../lib/dto';
import { requireAuth } from '../lib/guard';
import { rejectStatus, upsertTransaction } from '../lib/sync';

const idParams = z.object({ id: z.string().uuid() });

export const transactionRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', requireAuth(app));

  /** Search and filter. Entries awaiting review are not counted, so they are not listed here. */
  app.get('/', async (req) => {
    const userId = req.user.sub;
    const q = searchTransactionsQuery.parse(req.query);
    const where: Prisma.TransactionWhereInput = {
      userId,
      deletedAt: null,
      needsReview: false,
      ...((q.from || q.to) && {
        occurredAt: { ...(q.from && { gte: new Date(q.from) }), ...(q.to && { lte: new Date(q.to) }) },
      }),
      ...(q.categoryId && { categoryId: q.categoryId }),
      ...(q.accountId && { accountId: q.accountId }),
      ...(q.type && { type: q.type }),
      ...((q.minPaise !== undefined || q.maxPaise !== undefined) && {
        amountPaise: {
          ...(q.minPaise !== undefined && { gte: q.minPaise }),
          ...(q.maxPaise !== undefined && { lte: q.maxPaise }),
        },
      }),
      ...(q.q && {
        OR: [
          { merchant: { contains: q.q, mode: 'insensitive' as const } },
          { note: { contains: q.q, mode: 'insensitive' as const } },
        ],
      }),
    };
    const rows = await app.prisma.transaction.findMany({ where, orderBy: { occurredAt: 'desc' }, take: q.limit });
    return rows.map(toTransactionDTO);
  });

  /** Idempotent: sending the same id again returns the stored record. */
  app.post('/', async (req, reply) => {
    const userId = req.user.sub;
    const body = createTransactionBody.parse(req.body);
    const out = await upsertTransaction(app.prisma, userId, { ...body, needsReview: false, baseVersion: 0, deletedAt: null });
    switch (out.kind) {
      case 'applied':
        return reply.status(out.created ? 201 : 200).send(toTransactionDTO(out.row));
      case 'conflict':
        return reply.status(200).send(toTransactionDTO(out.row));
      case 'flagged':
        return reply.status(201).send({ ...toTransactionDTO(out.row), similarTo: out.similarTo });
      case 'duplicate':
        return reply.status(409).send({ error: 'duplicate_reference', existingId: out.existingId });
      case 'rejected':
        return reply.status(rejectStatus(out.reason)).send({ error: out.reason });
    }
  });

  /** Edit. Sending the version you last saw makes the edit lose to a newer one. */
  app.put('/:id', async (req, reply) => {
    const userId = req.user.sub;
    const { id } = idParams.parse(req.params);
    const body = updateTransactionBody.parse(req.body);
    const existing = await app.prisma.transaction.findFirst({ where: { id, userId, deletedAt: null } });
    if (!existing) return reply.status(404).send({ error: 'not_found' });

    const merged = {
      id,
      type: body.type ?? existing.type,
      amountPaise: body.amountPaise ?? existing.amountPaise,
      accountId: body.accountId ?? existing.accountId,
      categoryId: body.categoryId === undefined ? existing.categoryId : body.categoryId,
      occurredAt: body.occurredAt ?? existing.occurredAt.toISOString(),
      note: body.note ?? existing.note,
      merchant: body.merchant === undefined ? existing.merchant : body.merchant,
      source: existing.source,
      refNo: existing.refNo,
      last4: existing.last4,
      needsReview: existing.needsReview,
      baseVersion: body.baseVersion ?? existing.version,
      deletedAt: null,
    };
    const out = await upsertTransaction(app.prisma, userId, merged);
    if (out.kind === 'applied' || out.kind === 'flagged') return toTransactionDTO(out.row);
    if (out.kind === 'conflict') return reply.status(409).send({ error: 'version_conflict', server: toTransactionDTO(out.row) });
    return reply.status(out.kind === 'rejected' ? rejectStatus(out.reason) : 409).send({
      error: out.kind === 'rejected' ? out.reason : 'duplicate_reference',
    });
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
