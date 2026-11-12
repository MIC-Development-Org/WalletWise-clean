import Fastify, { type FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import type { PrismaClient } from '@prisma/client';
import { ZodError } from 'zod';
import type { Env } from './env';
import { accountRoutes } from './routes/accounts';
import { authRoutes } from './routes/auth';
import { budgetRoutes } from './routes/budgets';
import { categoryRoutes } from './routes/categories';
import { goalRoutes } from './routes/goals';
import { insightRoutes } from './routes/insights';
import { meRoutes } from './routes/me';
import { pushRoutes } from './routes/push';
import { reviewRoutes } from './routes/review';
import { smsRoutes } from './routes/sms';
import { syncRoutes } from './routes/sync';
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

export interface AppOptions {
  /** Requests per minute on login, register and refresh. Tests raise it, production keeps 10. */
  authRateLimit?: number;
  /** Requests per minute overall. */
  globalRateLimit?: number;
}

export async function buildApp(
  env: Pick<Env, 'JWT_SECRET' | 'CORS_ORIGINS' | 'NODE_ENV'>,
  prisma: PrismaClient,
  opts: AppOptions = {},
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
    allowedHeaders: ['Authorization', 'Content-Type', 'If-None-Match'],
    exposedHeaders: ['ETag'],
  });
  await app.register(rateLimit, { max: opts.globalRateLimit ?? 120, timeWindow: '1 minute' });
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
  await app.register(authRoutes, { prefix: '/api/v1/auth', max: opts.authRateLimit });
  await app.register(meRoutes, { prefix: '/api/v1' });
  await app.register(transactionRoutes, { prefix: '/api/v1/transactions' });
  await app.register(accountRoutes, { prefix: '/api/v1/accounts' });
  await app.register(categoryRoutes, { prefix: '/api/v1/categories' });
  await app.register(budgetRoutes, { prefix: '/api/v1/budgets' });
  await app.register(goalRoutes, { prefix: '/api/v1/goals' });
  await app.register(syncRoutes, { prefix: '/api/v1/sync' });
  await app.register(insightRoutes, { prefix: '/api/v1/insights' });
  await app.register(reviewRoutes, { prefix: '/api/v1/review' });
  await app.register(pushRoutes, { prefix: '/api/v1/push' });
  await app.register(smsRoutes, { prefix: '/api/v1' });

  return app;
}
