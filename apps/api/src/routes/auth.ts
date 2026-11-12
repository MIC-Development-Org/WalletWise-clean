import type { FastifyPluginAsync } from 'fastify';
import { hash, verify } from '@node-rs/argon2';
import { loginBody, refreshBody, registerBody } from '@money-tracker/shared';
import { REFRESH_TTL_MS, hashToken, newRefreshToken } from '../tokens';

// Verified against when the email is unknown, so login time does not reveal which emails exist.
const DUMMY_HASH = await hash('timing-equaliser-not-a-real-password');

export const authRoutes: FastifyPluginAsync<{ max?: number }> = async (app, opts) => {
  const strict = { config: { rateLimit: { max: opts.max ?? 10, timeWindow: '1 minute' } } };

  async function issueTokens(userId: string) {
    const { token, hash: tokenHash } = newRefreshToken();
    await app.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) },
    });
    return { accessToken: app.jwt.sign({ sub: userId }), refreshToken: token };
  }

  app.post('/register', strict, async (req, reply) => {
    const body = registerBody.parse(req.body);
    const passwordHash = await hash(body.password);
    try {
      const user = await app.prisma.user.create({
        data: {
          email: body.email,
          name: body.name,
          passwordHash,
          // One account per way students actually pay, so a capture can name where the money moved.
          accounts: {
            create: [
              { name: 'Cash', type: 'CASH' },
              { name: 'UPI', type: 'UPI' },
              { name: 'Bank', type: 'BANK' },
              { name: 'Wallet', type: 'WALLET' },
            ],
          },
        },
      });
      return reply.status(201).send(await issueTokens(user.id));
    } catch (e) {
      if ((e as { code?: string }).code === 'P2002') {
        return reply.status(409).send({ error: 'email_taken' });
      }
      throw e;
    }
  });

  app.post('/login', strict, async (req, reply) => {
    const body = loginBody.parse(req.body);
    const user = await app.prisma.user.findUnique({ where: { email: body.email } });
    const ok = await verify(user?.passwordHash ?? DUMMY_HASH, body.password).catch(() => false);
    if (!user || !ok) return reply.status(401).send({ error: 'invalid_credentials' });
    return issueTokens(user.id);
  });

  app.post('/refresh', strict, async (req, reply) => {
    const { refreshToken } = refreshBody.parse(req.body);
    const row = await app.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
    });
    if (!row || row.expiresAt < new Date()) {
      return reply.status(401).send({ error: 'invalid_token' });
    }
    if (row.revokedAt) {
      // A rotated token was used again: assume theft and end every session.
      await app.prisma.refreshToken.updateMany({
        where: { userId: row.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return reply.status(401).send({ error: 'invalid_token' });
    }
    await app.prisma.refreshToken.update({
      where: { id: row.id },
      data: { revokedAt: new Date() },
    });
    return issueTokens(row.userId);
  });

  app.post('/logout', strict, async (req, reply) => {
    const { refreshToken } = refreshBody.parse(req.body);
    await app.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return reply.status(204).send();
  });
};
