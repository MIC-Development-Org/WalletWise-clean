import Fastify, { type FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import type { PrismaClient } from '@prisma/client';
import { ZodError } from 'zod';
import type { Env } from './env';
import { authRoutes } from './routes/auth';
import { transactionRoutes } from './routes/transactions';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    authenticate: (req: import('fastify').FastifyRequest) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}

export async function buildApp(
  env: Pick<Env, 'JWT_SECRET' | 'CORS_ORIGINS' | 'NODE_ENV'>,
  prisma: PrismaClient,
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV === 'test' ? false : { redact: ['req.headers.authorization'] },
    bodyLimit: 100 * 1024,
    trustProxy: true,
  });

  app.decorate('prisma', prisma);

  await app.register(helmet);
  await app.register(cors, {
    origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  });
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });
  await app.register(jwt, { secret: env.JWT_SECRET, sign: { expiresIn: '15m' } });

  app.decorate('authenticate', async (req) => {
    await req.jwtVerify();
  });

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ZodError) {
      return reply.status(400).send({ error: 'invalid_request', issues: err.issues });
    }
    const status = (err as { statusCode?: number }).statusCode ?? 500;
    if (status >= 500) app.log.error(err);
    return reply.status(status).send({
      error: status >= 500 ? 'server_error' : ((err as Error).message ?? 'error'),
    });
  });

  app.get('/health', async () => ({ ok: true }));
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(transactionRoutes, { prefix: '/api/v1/transactions' });

  return app;
}
