import type { FastifyPluginAsync } from 'fastify';
import { pushSubscribeBody } from '@money-tracker/shared';
import { requireAuth } from '../lib/guard';

export const pushRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', requireAuth(app));

  /** Register a browser (Web Push) or Android (FCM) target. Safe to call again with the same endpoint. */
  app.post('/subscribe', async (req, reply) => {
    const userId = req.user.sub;
    const body = pushSubscribeBody.parse(req.body);
    if (body.kind === 'webpush') {
      await app.prisma.pushSubscription.upsert({
        where: { endpoint: body.endpoint },
        create: { userId, kind: 'webpush', endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth },
        update: { userId, p256dh: body.keys.p256dh, auth: body.keys.auth },
      });
    } else {
      await app.prisma.pushSubscription.upsert({
        where: { token: body.token },
        create: { userId, kind: 'fcm', token: body.token },
        update: { userId },
      });
    }
    return reply.status(204).send();
  });
};
