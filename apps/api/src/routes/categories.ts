import type { FastifyPluginAsync } from 'fastify';
import { categoryBody } from '@money-tracker/shared';
import { toCategoryDTO } from '../lib/dto';
import { requireAuth } from '../lib/guard';

export const categoryRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', requireAuth(app));

  /** Built-in hostel categories plus the user's own. */
  app.get('/', async (req) => {
    const rows = await app.prisma.category.findMany({
      where: { OR: [{ userId: null }, { userId: req.user.sub }] },
      orderBy: [{ userId: 'asc' }, { name: 'asc' }],
    });
    return rows.map(toCategoryDTO);
  });

  app.post('/', async (req, reply) => {
    const body = categoryBody.parse(req.body);
    const row = await app.prisma.category.create({ data: { ...body, userId: req.user.sub } });
    return reply.status(201).send(toCategoryDTO(row));
  });
};
