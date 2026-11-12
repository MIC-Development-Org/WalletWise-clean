import type { FastifyPluginAsync } from 'fastify';
import { accountBody } from '@money-tracker/shared';
import { toAccountDTO } from '../lib/dto';
import { requireAuth } from '../lib/guard';

export const accountRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', requireAuth(app));

  app.get('/', async (req) => {
    const rows = await app.prisma.account.findMany({ where: { userId: req.user.sub }, orderBy: { createdAt: 'asc' } });
    return rows.map(toAccountDTO);
  });

  app.post('/', async (req, reply) => {
    const body = accountBody.parse(req.body);
    const row = await app.prisma.account.create({ data: { ...body, userId: req.user.sub } });
    return reply.status(201).send(toAccountDTO(row));
  });
};
