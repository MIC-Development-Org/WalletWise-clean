import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccountDTO, MeDTO, PushResult, SyncChanges, TransactionDTO } from '@money-tracker/shared';

/** A scripted server, so we can test exactly how the device reacts to each answer. */
const server = {
  me: { id: 'u1', email: 'a@b.co', name: 'A', allowancePaise: 0, cycleStartDay: 1 } as MeDTO,
  accounts: [
    { id: 'srv-cash', name: 'Cash', type: 'CASH' },
    { id: 'srv-upi', name: 'UPI', type: 'UPI' },
    { id: 'srv-bank', name: 'Bank', type: 'BANK' },
    { id: 'srv-wallet', name: 'Wallet', type: 'WALLET' },
  ] as AccountDTO[],
  push: vi.fn<(body: Record<string, unknown[]>) => PushResult>(),
  changes: vi.fn<(query: URLSearchParams) => SyncChanges>(),
  puts: [] as unknown[],
};

vi.mock('./api', () => ({
  hasSession: () => true,
  logout: vi.fn(async () => {}),
  api: vi.fn(async (path: string, init?: { method?: string; body?: string }) => {
    if (path === '/api/v1/accounts') return server.accounts;
    if (path === '/api/v1/me') {
      if (init?.method === 'PUT') {
        server.puts.push(JSON.parse(init.body!));
        return server.me;
      }
      return server.me;
    }
    if (path === '/api/v1/sync/push') return server.push(JSON.parse(init!.body!));
    if (path.startsWith('/api/v1/sync/changes')) return server.changes(new URLSearchParams(path.split('?')[1]));
    throw new Error(`unexpected call ${path}`);
  }),
}));

const { db, getMeta, wipeLocal } = await import('./db');
const sync = await import('./sync');

const emptyPush = (over: Partial<PushResult> = {}): PushResult => ({ applied: [], conflicts: [], duplicates: [], flagged: [], rejected: [], ...over });
const emptyChanges = (over: Partial<SyncChanges> = {}): SyncChanges => ({
  cursor: '2026-11-01T00:00:00.000Z',
  hasMore: false,
  me: server.me,
  accounts: server.accounts,
  transactions: [],
  budgets: [],
  goals: [],
  ...over,
});

const txn = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  type: 'EXPENSE' as const,
  amountPaise: 8500,
  accountId: 'upi' as const,
  categoryId: 'canteen',
  occurredAt: '2026-11-10T10:00:00.000Z',
  note: '',
  merchant: 'Canteen',
  source: 'MANUAL' as const,
  synced: false,
  version: 0,
  modifiedAt: 'v1',
  ...over,
});

const serverTxn = (id: string, over: Partial<TransactionDTO> = {}): TransactionDTO => ({
  id,
  type: 'EXPENSE',
  amountPaise: 8500,
  accountId: 'srv-upi',
  categoryId: 'canteen',
  occurredAt: '2026-11-10T10:00:00.000Z',
  note: '',
  merchant: 'Canteen',
  source: 'MANUAL',
  refNo: null,
  last4: null,
  needsReview: false,
  deletedAt: null,
  version: 1,
  updatedAt: '2026-11-10T10:00:01.000Z',
  ...over,
});

beforeEach(async () => {
  await wipeLocal();
  server.me = { id: 'u1', email: 'a@b.co', name: 'A', allowancePaise: 0, cycleStartDay: 1 };
  server.puts = [];
  server.push.mockReset().mockReturnValue(emptyPush());
  server.changes.mockReset().mockReturnValue(emptyChanges());
});

describe('mapping', () => {
  it('maps local account ids to the server accounts and back', () => {
    const maps = sync.buildAccountMaps(server.accounts);
    expect(maps.toServer.upi).toBe('srv-upi');
    expect(maps.toLocal.get('srv-bank')).toBe('bank');
    const pushed = sync.toPushTransaction(txn('a') as never, maps)!;
    expect(pushed.accountId).toBe('srv-upi');
    expect(pushed.baseVersion).toBe(0);
    expect(sync.fromServerTransaction(serverTxn('a'), maps).accountId).toBe('upi');
  });

  it('does not push a row whose account the server does not know', () => {
    expect(sync.toPushTransaction(txn('a') as never, { toServer: {}, toLocal: new Map() })).toBeNull();
  });
});

describe('push', () => {
  it('sends pending rows and marks them synced with the server version', async () => {
    await db.transactions.bulkAdd([txn('t1'), txn('t2', { amountPaise: 1000 })] as never);
    server.push.mockImplementation((body) =>
      emptyPush({ applied: (body.transactions as { id: string }[]).map((t) => ({ kind: 'transaction' as const, id: t.id, version: 1 })) }),
    );
    await sync.syncNow();
    const rows = await db.transactions.toArray();
    expect(rows.every((r) => r.synced && r.version === 1)).toBe(true);
    expect(server.push).toHaveBeenCalledTimes(1);
    expect((server.push.mock.calls[0]![0].transactions as { accountId: string }[])[0]!.accountId).toBe('srv-upi');
  });

  it('does not send rows that are already synced', async () => {
    await db.transactions.add(txn('t1', { synced: true, version: 1 }) as never);
    await sync.syncNow();
    expect(server.push).not.toHaveBeenCalled();
  });

  it('lets the server version win a conflict', async () => {
    await db.transactions.add(txn('t1', { amountPaise: 1111, version: 1 }) as never);
    server.push.mockReturnValue(emptyPush({ conflicts: [{ kind: 'transaction', id: 't1', server: serverTxn('t1', { amountPaise: 9999, version: 3 }) }] }));
    await sync.syncNow();
    const row = (await db.transactions.get('t1'))!;
    expect(row.amountPaise).toBe(9999);
    expect(row.version).toBe(3);
    expect(row.synced).toBe(true);
  });

  it('drops a local copy the server says is a duplicate, and keeps one record', async () => {
    await db.transactions.add(txn('copy', { refNo: '123' }) as never);
    server.push.mockReturnValue(emptyPush({ duplicates: [{ id: 'copy', existingId: 'orig' }] }));
    await sync.syncNow();
    expect(await db.transactions.get('copy')).toBeUndefined();
  });

  it('keeps a row pending if it changed while the request was in flight', async () => {
    await db.transactions.add(txn('t1') as never);
    server.push.mockImplementation(() => {
      // The user edits the row while the push is on its way.
      void db.transactions.update('t1', { amountPaise: 7777, modifiedAt: 'v2', synced: false });
      return emptyPush({ applied: [{ kind: 'transaction', id: 't1', version: 1 }] });
    });
    await sync.syncNow();
    // The second round pushes the edit with the new base version.
    const row = (await db.transactions.get('t1'))!;
    expect(row.amountPaise).toBe(7777);
    expect(server.push.mock.calls.length).toBeGreaterThan(1);
    expect((server.push.mock.calls[1]![0].transactions as { baseVersion: number }[])[0]!.baseVersion).toBe(1);
  });

  it('pushes budgets and goals with soft deletes', async () => {
    await db.budgets.add({ id: 'b1', categoryId: 'canteen', limitPaise: 120000, synced: false, version: 2, deletedAt: '2026-11-11T00:00:00.000Z', modifiedAt: 'v1' });
    await db.goals.add({ id: 'g1', name: 'Headphones', targetPaise: 300000, savedPaise: 0, deadline: null, synced: false, version: 0, modifiedAt: 'v1' });
    server.push.mockReturnValue(emptyPush({ applied: [{ kind: 'budget', id: 'b1', version: 3 }, { kind: 'goal', id: 'g1', version: 1 }] }));
    await sync.syncNow();
    const body = server.push.mock.calls[0]![0] as { budgets: { baseVersion: number; deletedAt: string }[]; goals: unknown[] };
    expect(body.budgets[0]).toMatchObject({ baseVersion: 2, deletedAt: '2026-11-11T00:00:00.000Z' });
    expect((await db.budgets.get('b1'))!.version).toBe(3);
    expect((await db.goals.get('g1'))!.synced).toBe(true);
  });

  it('retries a refused batch row by row, so one bad row does not block the others', async () => {
    await db.transactions.bulkAdd([txn('good'), txn('bad')] as never);
    server.push.mockImplementation((body) => {
      const rows = body.transactions as { id: string }[];
      if (rows.length > 1) throw new Error('invalid_request');
      if (rows[0]!.id === 'bad') throw new Error('invalid_request');
      return emptyPush({ applied: [{ kind: 'transaction', id: rows[0]!.id, version: 1 }] });
    });
    await sync.syncNow();
    expect((await db.transactions.get('good'))!.synced).toBe(true);
    const bad = (await db.transactions.get('bad'))!;
    expect(bad.syncError).toBe('invalid_request');
    expect(bad.synced).toBe(true); // not retried forever
    expect(sync.useSyncState.getState().refused).toBe(1);
  });
});

describe('pull', () => {
  it('stores server rows and saves the cursor', async () => {
    server.changes.mockReturnValue(emptyChanges({ cursor: '2026-11-11T09:00:00.000Z', transactions: [serverTxn('s1', { accountId: 'srv-bank' })] }));
    await sync.syncNow();
    const row = (await db.transactions.get('s1'))!;
    expect(row).toMatchObject({ accountId: 'bank', synced: true, version: 1 });
    expect(await getMeta('syncCursor')).toBe('2026-11-11T09:00:00.000Z');
  });

  it('passes the cursor on the next call and pages until there is no more', async () => {
    server.changes
      .mockReturnValueOnce(emptyChanges({ cursor: 'c1', hasMore: true, transactions: [serverTxn('a')] }))
      .mockReturnValueOnce(emptyChanges({ cursor: 'c2', hasMore: false, transactions: [serverTxn('b')] }));
    await sync.syncNow();
    expect(server.changes.mock.calls[1]![0].get('cursor')).toBe('c1');
    expect(await db.transactions.count()).toBe(2);
  });

  it('never overwrites a row that has local changes waiting', async () => {
    await db.transactions.add(txn('t1', { amountPaise: 5555, version: 1 }) as never);
    server.push.mockReturnValue(emptyPush({ rejected: [] }));
    // The push finds nothing to apply (scripted), so the row stays pending while the pull runs.
    server.push.mockImplementation(() => {
      throw new TypeError('Failed to fetch');
    });
    await sync.syncNow();
    expect(sync.useSyncState.getState().phase).toBe('offline');
    expect((await db.transactions.get('t1'))!.amountPaise).toBe(5555);
  });

  it('keeps a deletion for a row we have, and ignores one for a row we never had', async () => {
    await db.transactions.add(txn('mine', { synced: true, version: 1 }) as never);
    server.changes.mockReturnValue(
      emptyChanges({
        transactions: [
          serverTxn('mine', { deletedAt: '2026-11-12T00:00:00.000Z', version: 2 }),
          serverTxn('stranger', { deletedAt: '2026-11-12T00:00:00.000Z', version: 2 }),
        ],
      }),
    );
    await sync.syncNow();
    expect((await db.transactions.get('mine'))!.deletedAt).not.toBeNull();
    expect(await db.transactions.get('stranger')).toBeUndefined();
  });

  it('ignores an older server version than the one we already have', async () => {
    await db.transactions.add(txn('t1', { synced: true, version: 5, amountPaise: 4242 }) as never);
    server.changes.mockReturnValue(emptyChanges({ transactions: [serverTxn('t1', { version: 3, amountPaise: 1 })] }));
    await sync.syncNow();
    expect((await db.transactions.get('t1'))!.amountPaise).toBe(4242);
  });
});

describe('identity and settings', () => {
  it('sends the allowance up when a guest signs in to a new account', async () => {
    await db.meta.put({ key: 'settings', value: { onboarded: true, name: 'Arjun', allowancePaise: 800000, cycleStartDay: 5 } });
    await sync.syncNow();
    expect(server.puts[0]).toEqual({ name: 'Arjun', allowancePaise: 800000, cycleStartDay: 5 });
    expect(await getMeta('settingsDirty')).toBe(false);
  });

  it('a new device for an existing account picks up the allowance and skips onboarding', async () => {
    server.me = { ...server.me, allowancePaise: 600000, cycleStartDay: 10, name: 'Asha' };
    await sync.syncNow();
    expect(await getMeta('settings')).toMatchObject({ onboarded: true, allowancePaise: 600000, cycleStartDay: 10, name: 'Asha' });
  });

  it("never mixes in another account's data left on this device", async () => {
    await db.meta.put({ key: 'userId', value: 'someone-else' });
    await db.transactions.add(txn('theirs', { synced: true, version: 1 }) as never);
    await sync.syncNow();
    expect(await db.transactions.get('theirs')).toBeUndefined();
    expect(await getMeta('userId')).toBe('u1');
  });
});

describe('sign out', () => {
  it('is blocked while changes are not yet on the server, so nothing is lost', async () => {
    await db.transactions.add(txn('t1') as never);
    server.push.mockImplementation(() => {
      throw new TypeError('Failed to fetch');
    });
    const r = await sync.signOut();
    expect(r).toEqual({ ok: false, unsynced: 1 });
    expect(await db.transactions.count()).toBe(1);
  });

  it('clears this device once everything is synced', async () => {
    await db.transactions.add(txn('t1', { synced: true, version: 1 }) as never);
    const r = await sync.signOut();
    expect(r).toEqual({ ok: true });
    expect(await db.transactions.count()).toBe(0);
    expect(sync.useSyncState.getState().phase).toBe('signed-out');
  });
});
