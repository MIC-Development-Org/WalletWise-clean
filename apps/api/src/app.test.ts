import { describe, expect, it } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { buildApp } from './app';

const env = {
  NODE_ENV: 'test' as const,
  JWT_SECRET: 'x'.repeat(40),
  CORS_ORIGINS: 'http://localhost:5173',
};

// Validation and auth guards run before any database call, so a stub is enough here.
const app = await buildApp(env, {} as PrismaClient);

describe('api', () => {
  it('answers health checks', async () => {
    const res = await app.inject({ url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it('sets security headers', async () => {
    const res = await app.inject({ url: '/health' });
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('rejects a short password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: 'a@b.co', password: 'short', name: 'A' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('rejects invalid email on login', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'nope', password: 'whatever' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('requires a token for transactions', async () => {
    const res = await app.inject({ url: '/api/v1/transactions' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects a forged token', async () => {
    const res = await app.inject({
      url: '/api/v1/transactions',
      headers: { authorization: 'Bearer abc.def.ghi' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('accepts a valid token past the auth guard', async () => {
    const token = app.jwt.sign({ sub: 'user-1' });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/transactions',
      headers: { authorization: `Bearer ${token}` },
      payload: { id: 'not-a-uuid' },
    });
    expect(res.statusCode).toBe(400);
  });
});
