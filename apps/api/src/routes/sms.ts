import { createHash } from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import { smsIngestBody, smsRuleSchema } from '@money-tracker/shared';
import { requireAuth } from '../lib/guard';
import { upsertTransaction } from '../lib/sync';

export const smsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', requireAuth(app));

  /**
   * Bank parsing rules as data, so a new bank is a database update and not an app release.
   * Every rule is validated again here, so a bad row can never reach a phone. ETag lets apps skip unchanged lists.
   */
  app.get('/sms-rules', async (req, reply) => {
    const rows = await app.prisma.smsRuleRow.findMany({ where: { active: true }, orderBy: { id: 'asc' } });
    const rules = rows.flatMap((r) => {
      const p = smsRuleSchema.safeParse({ id: r.id, bank: r.bank, sender: r.sender, kind: r.kind, pattern: r.pattern });
      return p.success ? [p.data] : [];
    });
    const version = createHash('sha1').update(JSON.stringify(rules)).digest('hex').slice(0, 16);
    reply.header('ETag', `"${version}"`);
    if (req.headers['if-none-match'] === `"${version}"`) return reply.status(304).send();
    return { version, rules };
  });

  /**
   * Parsed fields only. The raw message text never reaches the server.
   * Uncertain or non-INR items are stored for review and do not count until the user confirms them.
   */
  app.post('/sms/ingest', async (req) => {
    const userId = req.user.sub;
    const { items } = smsIngestBody.parse(req.body);
    const result = {
      created: [] as string[],
      existing: [] as string[],
      duplicates: [] as { id: string; existingId: string }[],
      flagged: [] as { id: string; similarTo: string }[],
      rejected: [] as { id: string; reason: string }[],
    };

    for (const it of items) {
      const out = await upsertTransaction(app.prisma, userId, {
        id: it.id,
        type: it.type,
        amountPaise: it.amountPaise,
        categoryId: null,
        accountId: it.accountId,
        occurredAt: it.occurredAt,
        note: '',
        merchant: it.merchant,
        source: 'SMS',
        refNo: it.refNo,
        last4: it.last4,
        needsReview: it.review || it.currency.toUpperCase() !== 'INR',
        baseVersion: 0,
        deletedAt: null,
      });
      if (out.kind === 'applied') (out.created ? result.created : result.existing).push(it.id);
      else if (out.kind === 'conflict') result.existing.push(it.id);
      else if (out.kind === 'flagged') {
        result.created.push(it.id);
        result.flagged.push({ id: it.id, similarTo: out.similarTo });
      } else if (out.kind === 'duplicate') result.duplicates.push({ id: it.id, existingId: out.existingId });
      else result.rejected.push({ id: it.id, reason: out.reason });
    }
    return result;
  });
};
