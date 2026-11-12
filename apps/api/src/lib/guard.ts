import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

/** onRequest hook for routes that need a signed in user. Always answers 401, never leaks why. */
export function requireAuth(app: FastifyInstance) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await app.authenticate(req);
    } catch {
      return reply.status(401).send({ error: 'unauthorized' });
    }
  };
}
