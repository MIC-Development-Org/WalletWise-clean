import type { FastifyPluginAsync } from 'fastify';
import { verify } from '@node-rs/argon2';
import { deleteMeBody, meBody } from '@money-tracker/shared';
import { toMeDTO } from '../lib/dto';
import { requireAuth } from '../lib/guard';

/** Spreadsheet formulas in user text must never run when the file is opened. */
function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export const meRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', requireAuth(app));

  app.get('/me', async (req, reply) => {
    const user = await app.prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!user) return reply.status(401).send({ error: 'unauthorized' });
    return toMeDTO(user);
  });

  app.put('/me', async (req) => {
    const body = meBody.parse(req.body);
    const user = await app.prisma.user.update({ where: { id: req.user.sub }, data: body });
    return toMeDTO(user);
  });

  /** Removes the account and everything in it (cascade). Asks for the password again. */
  app.delete('/me', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (req, reply) => {
    const { password } = deleteMeBody.parse(req.body);
    const user = await app.prisma.user.findUnique({ where: { id: req.user.sub } });
    const ok = user ? await verify(user.passwordHash, password).catch(() => false) : false;
    if (!user || !ok) return reply.status(401).send({ error: 'invalid_credentials' });
    await app.prisma.user.delete({ where: { id: user.id } });
    return reply.status(204).send();
  });

  app.get('/export.csv', async (req, reply) => {
    const rows = await app.prisma.transaction.findMany({
      where: { userId: req.user.sub, deletedAt: null },
      include: { category: true, account: true },
      orderBy: { occurredAt: 'asc' },
    });
    const head = ['Date', 'Type', 'Amount (INR)', 'Category', 'Account', 'Merchant', 'Note', 'Source', 'Needs review'];
    const lines = rows.map((t) =>
      [
        t.occurredAt.toISOString(),
        t.type,
        `${Math.floor(t.amountPaise / 100)}.${String(t.amountPaise % 100).padStart(2, '0')}`,
        t.category?.name ?? '',
        t.account.name,
        t.merchant ?? '',
        t.note,
        t.source,
        t.needsReview ? 'yes' : 'no',
      ]
        .map((c) => csvCell(String(c)))
        .join(','),
    );
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="walletwise.csv"')
      .send([head.map(csvCell).join(','), ...lines].join('\n'));
  });
};
