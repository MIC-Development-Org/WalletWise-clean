import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app';
import { seedReference } from './seed';

/**
 * These run against a real PostgreSQL database (the PDF's "real database" test rows).
 * Set TEST_DATABASE_URL to a throwaway database. They are skipped when it is not set.
 */
const url = process.env.TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;

const env = { NODE_ENV: 'test' as const, JWT_SECRET: 'x'.repeat(48), CORS_ORIGINS: 'http://localhost:5173' };

suite('API with a real database', () => {
  let prisma: PrismaClient;
  let app: FastifyInstance;

  beforeAll(async () => {
    execSync('npx --no-install prisma migrate deploy', { env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe' });
    prisma = new PrismaClient({ datasources: { db: { url } } });
    await seedReference(prisma);
    app = await buildApp(env, prisma, { authRateLimit: 10_000, globalRateLimit: 100_000 });
  });

  afterAll(async () => {
    await app?.close();
    await prisma?.$disconnect();
  });

  beforeEach(async () => {
    // Deleting users cascades to everything they own. Built-in categories stay.
    await prisma.user.deleteMany();
  });

  async function call(method: string, path: string, opts: { token?: string; body?: unknown } = {}) {
    const res = await app.inject({
      method: method as 'GET',
      url: `/api/v1${path}`,
      headers: opts.token ? { authorization: `Bearer ${opts.token}` } : {},
      ...(opts.body !== undefined && { payload: opts.body as object }),
    });
    // Responses are asserted field by field below, so a loose type keeps the tests readable.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let json: any = null;
    try {
      json = res.json();
    } catch {
      /* non-JSON body (csv, 204) */
    }
    return { status: res.statusCode, json, text: res.body, headers: res.headers };
  }

  async function signUp(email = `${randomUUID()}@example.com`) {
    const r = await call('POST', '/auth/register', { body: { email, password: 'correct-horse-battery', name: 'Test' } });
    expect(r.status).toBe(201);
    const token = r.json.accessToken as string;
    const accounts = (await call('GET', '/accounts', { token })).json as { id: string; type: string }[];
    const acc = Object.fromEntries(accounts.map((a) => [a.type, a.id])) as Record<string, string>;
    return { email, token, refresh: r.json.refreshToken as string, acc };
  }

  const txn = (accountId: string, over: Record<string, unknown> = {}) => ({
    id: randomUUID(),
    type: 'EXPENSE',
    amountPaise: 8500,
    categoryId: 'canteen',
    accountId,
    occurredAt: new Date().toISOString(),
    ...over,
  });

  /* ---------- auth ---------- */

  describe('auth', () => {
    it('registers, creates the default accounts and works end to end (A-08)', async () => {
      const u = await signUp();
      expect(Object.keys(u.acc).sort()).toEqual(['BANK', 'CASH', 'UPI', 'WALLET']);
      const me = await call('GET', '/me', { token: u.token });
      expect(me.status).toBe(200);
      expect(me.json.email).toBe(u.email);
    });

    it('rejects a second account with the same email (A-07)', async () => {
      const u = await signUp();
      const r = await call('POST', '/auth/register', { body: { email: u.email, password: 'another-long-password', name: 'Dup' } });
      expect(r.status).toBe(409);
      expect(r.json.error).toBe('email_taken');
    });

    it('answers a wrong password and an unknown email the same way (A-09)', async () => {
      const u = await signUp();
      const wrong = await call('POST', '/auth/login', { body: { email: u.email, password: 'definitely-not-it' } });
      const unknown = await call('POST', '/auth/login', { body: { email: 'nobody@example.com', password: 'definitely-not-it' } });
      expect(wrong.status).toBe(401);
      expect(unknown.status).toBe(401);
      expect(wrong.json).toEqual(unknown.json);
    });

    it('rotates the refresh token and revokes everything when an old one is reused (A-10, A-11)', async () => {
      const u = await signUp();
      const first = await call('POST', '/auth/refresh', { body: { refreshToken: u.refresh } });
      expect(first.status).toBe(200);
      expect(first.json.refreshToken).not.toBe(u.refresh);

      const reuse = await call('POST', '/auth/refresh', { body: { refreshToken: u.refresh } });
      expect(reuse.status).toBe(401);
      // The new token was issued before the theft was noticed, and is now revoked too.
      const after = await call('POST', '/auth/refresh', { body: { refreshToken: first.json.refreshToken } });
      expect(after.status).toBe(401);
    });

    it('limits auth calls to 10 a minute (A-13)', async () => {
      const strict = await buildApp(env, prisma);
      const codes: number[] = [];
      for (let i = 0; i < 12; i++) {
        const r = await strict.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: 'a@b.co', password: 'whatever-it-is' } });
        codes.push(r.statusCode);
      }
      expect(codes.slice(0, 10).every((c) => c === 401)).toBe(true);
      expect(codes[10]).toBe(429);
      await strict.close();
    });

    it('needs a token for every data route (A-03)', async () => {
      for (const path of ['/transactions', '/accounts', '/budgets', '/goals', '/sync/changes', '/insights', '/review', '/me', '/export.csv']) {
        expect((await call('GET', path)).status).toBe(401);
      }
    });
  });

  /* ---------- transactions ---------- */

  describe('transactions', () => {
    it('creates once and returns the same record for the same id (T-01, T-02)', async () => {
      const u = await signUp();
      const body = txn(u.acc.UPI!);
      const a = await call('POST', '/transactions', { token: u.token, body });
      const b = await call('POST', '/transactions', { token: u.token, body });
      expect(a.status).toBe(201);
      expect(b.status).toBe(200);
      expect(b.json.id).toBe(a.json.id);
      expect(await prisma.transaction.count({ where: { id: body.id } })).toBe(1);
    });

    it('does not leak an id that belongs to someone else (T-03, A-16)', async () => {
      const a = await signUp();
      const b = await signUp();
      const body = txn(a.acc.UPI!);
      await call('POST', '/transactions', { token: a.token, body });

      const clash = await call('POST', '/transactions', { token: b.token, body: { ...body, accountId: b.acc.UPI } });
      expect(clash.status).toBe(409);
      expect(JSON.stringify(clash.json)).not.toContain('8500');

      expect((await call('DELETE', `/transactions/${body.id}`, { token: b.token })).status).toBe(404);
      const list = await call('GET', '/transactions', { token: b.token });
      expect(list.json).toEqual([]);
    });

    it("refuses another user's account or category (T-04)", async () => {
      const a = await signUp();
      const b = await signUp();
      const cat = await call('POST', '/categories', { token: a.token, body: { name: 'Private' } });
      const wrongAccount = await call('POST', '/transactions', { token: b.token, body: txn(a.acc.UPI!) });
      const wrongCategory = await call('POST', '/transactions', { token: b.token, body: txn(b.acc.UPI!, { categoryId: cat.json.id }) });
      expect(wrongAccount.status).toBe(400);
      expect(wrongCategory.status).toBe(400);
    });

    it('soft deletes so the deletion survives sync (T-05)', async () => {
      const u = await signUp();
      const body = txn(u.acc.UPI!);
      await call('POST', '/transactions', { token: u.token, body });
      expect((await call('DELETE', `/transactions/${body.id}`, { token: u.token })).status).toBe(204);

      expect((await call('GET', '/transactions', { token: u.token })).json).toEqual([]);
      const changes = await call('GET', '/sync/changes', { token: u.token });
      const row = changes.json.transactions.find((t: { id: string }) => t.id === body.id);
      expect(row.deletedAt).not.toBeNull();
      expect(row.version).toBe(2);
    });

    it('lets the higher server version win an edit conflict (T-06)', async () => {
      const u = await signUp();
      const body = txn(u.acc.UPI!);
      await call('POST', '/transactions', { token: u.token, body });
      const first = await call('PUT', `/transactions/${body.id}`, { token: u.token, body: { amountPaise: 9000, baseVersion: 1 } });
      expect(first.status).toBe(200);
      expect(first.json.version).toBe(2);

      const stale = await call('PUT', `/transactions/${body.id}`, { token: u.token, body: { amountPaise: 1234, baseVersion: 1 } });
      expect(stale.status).toBe(409);
      expect(stale.json.error).toBe('version_conflict');
      expect(stale.json.server.amountPaise).toBe(9000);
    });

    it('filters by date range and limit, newest first (T-09)', async () => {
      const u = await signUp();
      for (const day of [1, 2, 3, 4]) {
        await call('POST', '/transactions', { token: u.token, body: txn(u.acc.UPI!, { occurredAt: `2026-10-0${day}T10:00:00.000Z`, amountPaise: day * 1000 }) });
      }
      const r = await call('GET', '/transactions?from=2026-10-02T00:00:00.000Z&to=2026-10-03T23:59:59.000Z&limit=5', { token: u.token });
      expect(r.json.map((t: { amountPaise: number }) => t.amountPaise)).toEqual([3000, 2000]);
      const limited = await call('GET', '/transactions?limit=1', { token: u.token });
      expect(limited.json).toHaveLength(1);
    });

    it('searches by text and stores hostile text as plain text (A-17)', async () => {
      const u = await signUp();
      const evil = "Robert'); DROP TABLE \"Transaction\";--";
      await call('POST', '/transactions', { token: u.token, body: txn(u.acc.UPI!, { merchant: evil }) });
      // A different amount, so the two are not mistaken for one payment seen twice.
      await call('POST', '/transactions', { token: u.token, body: txn(u.acc.UPI!, { merchant: 'Canteen', amountPaise: 9100 }) });
      const all = await call('GET', '/transactions', { token: u.token });
      expect(all.json).toHaveLength(2);
      const found = await call('GET', `/transactions?q=${encodeURIComponent('canteen')}`, { token: u.token });
      expect(found.json).toHaveLength(1);
      expect(all.json.some((t: { merchant: string }) => t.merchant === evil)).toBe(true);
    });

    it('rejects an amount above the limit (M-05) and a body over 100 KB (A-15)', async () => {
      const u = await signUp();
      const big = await call('POST', '/transactions', { token: u.token, body: txn(u.acc.UPI!, { amountPaise: 2_000_000_001 }) });
      expect(big.status).toBe(400);
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/transactions',
        headers: { authorization: `Bearer ${u.token}`, 'content-type': 'application/json' },
        payload: JSON.stringify({ note: 'x'.repeat(200_000) }),
      });
      expect(res.statusCode).toBe(413);
    });
  });

  /* ---------- duplicates ---------- */

  describe('duplicate detection', () => {
    it('keeps one record when the same reference arrives by SMS then email (D-05)', async () => {
      const u = await signUp();
      const sms = await call('POST', '/transactions', { token: u.token, body: txn(u.acc.UPI!, { source: 'SMS', refNo: '4455667788' }) });
      const email = await call('POST', '/transactions', { token: u.token, body: txn(u.acc.UPI!, { source: 'EMAIL', refNo: '4455667788' }) });
      expect(sms.status).toBe(201);
      expect(email.status).toBe(409);
      expect(email.json.existingId).toBe(sms.json.id);
      expect(await prisma.transaction.count({ where: { userId: (await prisma.user.findFirstOrThrow()).id } })).toBe(1);
    });

    it('flags two close payments for review instead of merging them (D-06)', async () => {
      const u = await signUp();
      const at = new Date('2026-11-01T10:00:00.000Z');
      const first = await call('POST', '/transactions', { token: u.token, body: txn(u.acc.UPI!, { occurredAt: at.toISOString() }) });
      const second = await call('POST', '/transactions', {
        token: u.token,
        body: txn(u.acc.UPI!, { occurredAt: new Date(at.getTime() + 2 * 60_000).toISOString() }),
      });
      expect(second.status).toBe(201);
      expect(second.json.needsReview).toBe(true);
      expect(second.json.similarTo).toBe(first.json.id);
      expect(await prisma.transaction.count()).toBe(2);
    });

    it('treats different last 4 digits as separate payments (D-04)', async () => {
      const u = await signUp();
      const at = new Date('2026-11-01T10:00:00.000Z').toISOString();
      await call('POST', '/transactions', { token: u.token, body: txn(u.acc.UPI!, { occurredAt: at, last4: '1111' }) });
      const other = await call('POST', '/transactions', { token: u.token, body: txn(u.acc.UPI!, { occurredAt: at, last4: '2222' }) });
      expect(other.json.needsReview).toBe(false);
    });
  });

  /* ---------- sync ---------- */

  describe('sync', () => {
    it('pushes a batch, then a second device pulls it, tombstones included', async () => {
      const u = await signUp();
      const t1 = txn(u.acc.UPI!);
      const t2 = txn(u.acc.CASH!, { amountPaise: 4000 });
      const budget = { id: randomUUID(), categoryId: 'canteen', period: 'MONTHLY', limitPaise: 120000 };
      const goal = { id: randomUUID(), name: 'Headphones', targetPaise: 300000, savedPaise: 1000, deadline: '2026-12-22' };

      const push = await call('POST', '/sync/push', { token: u.token, body: { transactions: [t1, t2], budgets: [budget], goals: [goal] } });
      expect(push.status).toBe(200);
      expect(push.json.applied).toHaveLength(4);
      expect(push.json.rejected).toEqual([]);

      // Delete t2 with the version we know about, as a device would.
      const del = await call('POST', '/sync/push', { token: u.token, body: { transactions: [{ ...t2, baseVersion: 1, deletedAt: new Date().toISOString() }] } });
      expect(del.json.applied[0].version).toBe(2);

      const pull = await call('GET', '/sync/changes', { token: u.token });
      expect(pull.json.transactions).toHaveLength(2);
      expect(pull.json.transactions.find((t: { id: string }) => t.id === t2.id).deletedAt).not.toBeNull();
      expect(pull.json.budgets).toHaveLength(1);
      expect(pull.json.goals[0].deadline).toBe('2026-12-22');
      expect(pull.json.hasMore).toBe(false);
    });

    it('is idempotent: pushing the same batch twice changes nothing (T-08)', async () => {
      const u = await signUp();
      const batch = { transactions: [txn(u.acc.UPI!), txn(u.acc.UPI!, { amountPaise: 5000, occurredAt: '2026-10-10T10:00:00.000Z' })] };
      await call('POST', '/sync/push', { token: u.token, body: batch });
      const again = await call('POST', '/sync/push', { token: u.token, body: batch });
      expect(again.json.conflicts).toEqual([]);
      expect(await prisma.transaction.count()).toBe(2);
      const rows = await prisma.transaction.findMany();
      expect(rows.every((r) => r.version === 1)).toBe(true);
    });

    it('returns only what changed after the cursor, and pages when there is more', async () => {
      const u = await signUp();
      const rows = Array.from({ length: 5 }, (_, i) => txn(u.acc.UPI!, { amountPaise: 1000 + i, occurredAt: `2026-10-0${i + 1}T10:00:00.000Z` }));
      for (const r of rows) {
        await call('POST', '/sync/push', { token: u.token, body: { transactions: [r] } });
        await new Promise((res) => setTimeout(res, 5)); // distinct updatedAt values
      }
      const seen = new Set<string>();
      let cursor: string | undefined;
      for (let guard = 0; guard < 10; guard++) {
        const page = await call('GET', `/sync/changes?limit=2${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, { token: u.token });
        page.json.transactions.forEach((t: { id: string }) => seen.add(t.id));
        cursor = page.json.cursor;
        if (!page.json.hasMore) break;
      }
      expect(seen.size).toBe(5);

      const none = await call('GET', `/sync/changes?cursor=${encodeURIComponent(cursor!)}`, { token: u.token });
      // The boundary row can repeat, but nothing newer exists.
      expect(none.json.transactions.length).toBeLessThanOrEqual(1);
    });

    it('lets the server win when a device edits an old version', async () => {
      const u = await signUp();
      const t = txn(u.acc.UPI!);
      await call('POST', '/sync/push', { token: u.token, body: { transactions: [t] } });
      await call('POST', '/sync/push', { token: u.token, body: { transactions: [{ ...t, amountPaise: 9999, baseVersion: 1 }] } });
      const stale = await call('POST', '/sync/push', { token: u.token, body: { transactions: [{ ...t, amountPaise: 1111, baseVersion: 1 }] } });
      expect(stale.json.conflicts).toHaveLength(1);
      expect(stale.json.conflicts[0].server.amountPaise).toBe(9999);
      expect((await prisma.transaction.findUniqueOrThrow({ where: { id: t.id } })).amountPaise).toBe(9999);
    });

    it("one bad row does not block the others, and nobody can write into another user's rows", async () => {
      const a = await signUp();
      const b = await signUp();
      const mine = txn(a.acc.UPI!);
      const theirs = txn(b.acc.UPI!);
      await call('POST', '/sync/push', { token: b.token, body: { transactions: [theirs] } });

      const push = await call('POST', '/sync/push', {
        token: a.token,
        body: { transactions: [txn('not-an-account'), { ...theirs, accountId: a.acc.UPI, amountPaise: 1 }, mine] },
      });
      expect(push.json.applied.map((x: { id: string }) => x.id)).toEqual([mine.id]);
      expect(push.json.rejected.map((x: { reason: string }) => x.reason).sort()).toEqual(['id_conflict', 'unknown_account']);
      expect((await prisma.transaction.findUniqueOrThrow({ where: { id: theirs.id } })).amountPaise).toBe(8500);
    });
  });

  /* ---------- budgets, goals, categories ---------- */

  describe('budgets and goals', () => {
    it('creates a budget once for the same id and rejects stale edits', async () => {
      const u = await signUp();
      const body = { id: randomUUID(), categoryId: 'canteen', limitPaise: 120000 };
      expect((await call('POST', '/budgets', { token: u.token, body })).status).toBe(201);
      expect((await call('POST', '/budgets', { token: u.token, body })).status).toBe(200);
      expect(await prisma.budget.count()).toBe(1);

      const ok = await call('PUT', `/budgets/${body.id}`, { token: u.token, body: { limitPaise: 150000, baseVersion: 1 } });
      expect(ok.json.limitPaise).toBe(150000);
      const stale = await call('PUT', `/budgets/${body.id}`, { token: u.token, body: { limitPaise: 1, baseVersion: 1 } });
      expect(stale.status).toBe(409);

      expect((await call('DELETE', `/budgets/${body.id}`, { token: u.token })).status).toBe(204);
      expect((await call('GET', '/budgets', { token: u.token })).json).toEqual([]);
    });

    it('stores a goal without a deadline and never a negative amount', async () => {
      const u = await signUp();
      const g = await call('POST', '/goals', { token: u.token, body: { id: randomUUID(), name: 'Laptop', targetPaise: 5000000 } });
      expect(g.status).toBe(201);
      expect(g.json.deadline).toBeNull();
      const bad = await call('POST', '/goals', { token: u.token, body: { id: randomUUID(), name: 'Bad', targetPaise: -5 } });
      expect(bad.status).toBe(400);
    });

    it('lists built-in categories plus the userʼs own, and no one elseʼs', async () => {
      const a = await signUp();
      const b = await signUp();
      await call('POST', '/categories', { token: a.token, body: { name: 'Gym' } });
      const forA = (await call('GET', '/categories', { token: a.token })).json as { name: string; builtIn: boolean }[];
      const forB = (await call('GET', '/categories', { token: b.token })).json as { name: string }[];
      expect(forA.filter((c) => c.builtIn).length).toBe(14);
      expect(forA.some((c) => c.name === 'Gym')).toBe(true);
      expect(forB.some((c) => c.name === 'Gym')).toBe(false);
    });
  });

  /* ---------- insights ---------- */

  describe('insights', () => {
    it('has no end date and no divide by zero when nothing is spent (B-05)', async () => {
      const u = await signUp();
      await call('PUT', '/me', { token: u.token, body: { allowancePaise: 800000, cycleStartDay: 1 } });
      const r = await call('GET', '/insights?tzOffset=-330', { token: u.token });
      expect(r.status).toBe(200);
      expect(r.json.runway).toBeNull();
      expect(r.json.changeVsPrevPct).toBeNull();
      expect(r.json.spentPaise).toBe(0);
      expect(r.json.safeToSpendPaise).toBeGreaterThan(0);
    });

    it('counts spending, ignores entries awaiting review and works out safe to spend', async () => {
      const u = await signUp();
      await call('PUT', '/me', { token: u.token, body: { allowancePaise: 800000, cycleStartDay: 1 } });
      const now = new Date().toISOString();
      await call('POST', '/transactions', { token: u.token, body: txn(u.acc.UPI!, { amountPaise: 100000, occurredAt: now }) });
      await call('POST', '/sms/ingest', {
        token: u.token,
        body: { items: [{ id: randomUUID(), type: 'EXPENSE', amountPaise: 500000, occurredAt: now, ruleId: 'x', accountId: u.acc.UPI, currency: 'USD' }] },
      });
      const r = await call('GET', '/insights', { token: u.token });
      expect(r.json.spentPaise).toBe(100000);
      expect(r.json.leftPaise).toBe(700000);
      expect(r.json.runway).not.toBeNull();
      expect(r.json.byCategory[0]).toEqual({ categoryId: 'canteen', paise: 100000 });
    });
  });

  /* ---------- SMS ---------- */

  describe('SMS', () => {
    it('serves validated rules with an ETag and answers 304 when unchanged', async () => {
      const u = await signUp();
      const r = await call('GET', '/sms-rules', { token: u.token });
      expect(r.status).toBe(200);
      expect(r.json.rules.length).toBeGreaterThanOrEqual(3);
      const etag = r.headers.etag as string;
      const res = await app.inject({ method: 'GET', url: '/api/v1/sms-rules', headers: { authorization: `Bearer ${u.token}`, 'if-none-match': etag } });
      expect(res.statusCode).toBe(304);
    });

    it('never serves a rule whose pattern is over the length cap (S-12)', async () => {
      const u = await signUp();
      await prisma.smsRuleRow.create({ data: { id: 'too-long', bank: 'X', sender: '^X', kind: 'DEBIT', pattern: 'a'.repeat(501) } });
      const r = await call('GET', '/sms-rules', { token: u.token });
      expect(r.json.rules.some((x: { id: string }) => x.id === 'too-long')).toBe(false);
      await prisma.smsRuleRow.delete({ where: { id: 'too-long' } });
    });

    it('ingests parsed fields, is idempotent, and sends non-INR to review (S-11)', async () => {
      const u = await signUp();
      const inr = { id: randomUUID(), type: 'EXPENSE', amountPaise: 8500, merchant: 'Canteen', last4: '1234', refNo: '998877665544', occurredAt: new Date().toISOString(), ruleId: 'hdfc-upi-debit', accountId: u.acc.UPI };
      const usd = { id: randomUUID(), type: 'EXPENSE', amountPaise: 12000, occurredAt: '2026-10-01T10:00:00.000Z', ruleId: 'generic', accountId: u.acc.UPI, currency: 'USD' };
      const first = await call('POST', '/sms/ingest', { token: u.token, body: { items: [inr, usd] } });
      expect(first.json.created).toHaveLength(2);
      const again = await call('POST', '/sms/ingest', { token: u.token, body: { items: [inr, usd] } });
      expect(again.json.existing).toHaveLength(2);
      expect(await prisma.transaction.count()).toBe(2);
      expect((await prisma.transaction.findUniqueOrThrow({ where: { id: usd.id } })).needsReview).toBe(true);
      expect((await prisma.transaction.findUniqueOrThrow({ where: { id: inr.id } })).source).toBe('SMS');
    });

    it('refuses a body that tries to carry the raw message text', async () => {
      const u = await signUp();
      const r = await call('POST', '/sms/ingest', {
        token: u.token,
        body: { items: [{ id: randomUUID(), type: 'EXPENSE', amountPaise: 100, occurredAt: new Date().toISOString(), ruleId: 'x', accountId: u.acc.UPI, rawText: 'Rs 100 debited, OTP 123456' }] },
      });
      // Unknown keys are dropped by the schema, never stored.
      expect(r.status).toBe(200);
      const row = await prisma.transaction.findFirstOrThrow();
      expect(JSON.stringify(row)).not.toContain('OTP');
    });
  });

  /* ---------- review ---------- */

  describe('review list', () => {
    it('accepts with a category, or rejects as a soft delete', async () => {
      const u = await signUp();
      const make = (id: string) => ({ id, type: 'EXPENSE', amountPaise: 3000, occurredAt: new Date().toISOString(), ruleId: 'x', accountId: u.acc.UPI, review: true });
      const [keep, drop] = [randomUUID(), randomUUID()];
      await call('POST', '/sms/ingest', { token: u.token, body: { items: [make(keep), { ...make(drop), amountPaise: 4000 }] } });
      expect((await call('GET', '/review', { token: u.token })).json).toHaveLength(2);

      const ok = await call('POST', `/review/${keep}`, { token: u.token, body: { decision: 'accept', categoryId: 'mess' } });
      expect(ok.json.needsReview).toBe(false);
      expect(ok.json.categoryId).toBe('mess');
      await call('POST', `/review/${drop}`, { token: u.token, body: { decision: 'reject' } });

      expect((await call('GET', '/review', { token: u.token })).json).toEqual([]);
      expect((await prisma.transaction.findUniqueOrThrow({ where: { id: drop } })).deletedAt).not.toBeNull();
      expect((await call('POST', `/review/${keep}`, { token: u.token, body: { decision: 'reject' } })).status).toBe(404);
    });
  });

  /* ---------- me, export, push, delete ---------- */

  describe('account', () => {
    it('updates the profile and cycle settings', async () => {
      const u = await signUp();
      const r = await call('PUT', '/me', { token: u.token, body: { name: 'Arjun', allowancePaise: 800000, cycleStartDay: 5 } });
      expect(r.json).toMatchObject({ name: 'Arjun', allowancePaise: 800000, cycleStartDay: 5 });
      expect((await call('PUT', '/me', { token: u.token, body: { cycleStartDay: 31 } })).status).toBe(400);
    });

    it('stores a small JPEG profile photo, keeps it when other fields change, and removes it with null', async () => {
      const u = await signUp();
      const photo = `data:image/jpeg;base64,${'/9j/4AAQSkZJRgABAQ'.padEnd(2000, 'A')}`;
      const set = await call('PUT', '/me', { token: u.token, body: { photo } });
      expect(set.status).toBe(200);
      expect(set.json.photo).toBe(photo);

      // Changing the name alone must not wipe the photo.
      const rename = await call('PUT', '/me', { token: u.token, body: { name: 'Asha' } });
      expect(rename.json).toMatchObject({ name: 'Asha', photo });
      expect((await call('GET', '/me', { token: u.token })).json.photo).toBe(photo);

      const removed = await call('PUT', '/me', { token: u.token, body: { photo: null } });
      expect(removed.json.photo).toBeNull();
    });

    it('refuses a photo that is not a small JPEG data URL', async () => {
      const u = await signUp();
      const bad = [
        'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
        'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
        'https://example.com/me.jpg',
        `data:image/jpeg;base64,${'A'.repeat(70_001)}`,
        'data:image/jpeg;base64,<script>',
      ];
      for (const photo of bad) {
        expect((await call('PUT', '/me', { token: u.token, body: { photo } })).status).toBe(400);
      }
      expect((await call('GET', '/me', { token: u.token })).json.photo).toBeNull();
    });

    it('exports CSV with spreadsheet formulas defused (W-08)', async () => {
      const u = await signUp();
      await call('POST', '/transactions', { token: u.token, body: txn(u.acc.UPI!, { merchant: '=HYPERLINK("http://evil.example")', note: 'tea, "chai"' }) });
      const r = await call('GET', '/export.csv', { token: u.token });
      expect(r.status).toBe(200);
      expect(r.headers['content-type']).toContain('text/csv');
      expect(r.text).toContain(`"'=HYPERLINK(""http://evil.example"")"`);
      expect(r.text).toContain('"tea, ""chai"""');
    });

    it('registers a push target once, even if called twice', async () => {
      const u = await signUp();
      const sub = { kind: 'webpush', endpoint: 'https://push.example/abc', keys: { p256dh: 'p', auth: 'a' } };
      expect((await call('POST', '/push/subscribe', { token: u.token, body: sub })).status).toBe(204);
      expect((await call('POST', '/push/subscribe', { token: u.token, body: sub })).status).toBe(204);
      expect(await prisma.pushSubscription.count()).toBe(1);
    });

    it('deletes the account and every row it owns, only with the password (A-18)', async () => {
      const u = await signUp();
      const other = await signUp();
      await call('POST', '/transactions', { token: u.token, body: txn(u.acc.UPI!) });
      await call('POST', '/goals', { token: u.token, body: { id: randomUUID(), name: 'G', targetPaise: 1000 } });
      await call('POST', '/transactions', { token: other.token, body: txn(other.acc.UPI!) });

      expect((await call('DELETE', '/me', { token: u.token, body: { password: 'wrong-password-here' } })).status).toBe(401);
      expect((await call('DELETE', '/me', { token: u.token, body: { password: 'correct-horse-battery' } })).status).toBe(204);

      expect(await prisma.user.count({ where: { email: u.email } })).toBe(0);
      expect(await prisma.transaction.count()).toBe(1); // the other user's row is untouched
      expect(await prisma.goal.count()).toBe(0);
      expect(await prisma.account.count()).toBe(4);
    });
  });
});
