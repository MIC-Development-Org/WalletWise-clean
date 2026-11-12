import { create } from 'zustand';
import type {
  AccountDTO,
  BudgetDTO,
  GoalDTO,
  MeDTO,
  PushResult,
  SyncChanges,
  SyncPushBody,
  TransactionDTO,
} from '@money-tracker/shared';
import { api, hasSession, logout } from './api';
import {
  countPending,
  db,
  getMeta,
  loadSettings,
  markSettingsDirty,
  saveSettings,
  setMeta,
  wipeLocal,
  type AccountId,
  type LocalBudget,
  type LocalGoal,
  type LocalTransaction,
} from './db';

/**
 * Local first sync.
 *  1. Settings go up if they changed here, otherwise the server's come down.
 *  2. Every row with local changes is pushed. The server decides conflicts by version.
 *  3. Everything newer than the cursor is pulled, including deletions.
 * Rows are identified by ids made on the device, so running this twice never duplicates anything.
 */

export type SyncPhase = 'signed-out' | 'idle' | 'syncing' | 'offline' | 'error';

interface SyncState {
  phase: SyncPhase;
  lastSyncAt: string | null;
  error: string | null;
  /** Rows the server refused (not retried). */
  refused: number;
}

export const useSyncState = create<SyncState>(() => ({
  phase: typeof localStorage !== 'undefined' && hasSession() ? 'idle' : 'signed-out',
  lastSyncAt: null,
  error: null,
  refused: 0,
}));

const set = (patch: Partial<SyncState>) => useSyncState.setState(patch);

/* ---------- mapping between local rows and the API ---------- */

const TYPE_TO_LOCAL: Record<AccountDTO['type'], AccountId> = { CASH: 'cash', UPI: 'upi', BANK: 'bank', WALLET: 'wallet' };

export interface AccountMaps {
  toServer: Partial<Record<AccountId, string>>;
  toLocal: Map<string, AccountId>;
}

export function buildAccountMaps(accounts: AccountDTO[]): AccountMaps {
  const toServer: AccountMaps['toServer'] = {};
  const toLocal = new Map<string, AccountId>();
  for (const a of accounts) {
    const local = TYPE_TO_LOCAL[a.type];
    // The first account of each type is the one the app uses.
    if (!toServer[local]) toServer[local] = a.id;
    toLocal.set(a.id, local);
  }
  return { toServer, toLocal };
}

type PushTxn = SyncPushBody['transactions'][number];
type PushBudget = SyncPushBody['budgets'][number];
type PushGoal = SyncPushBody['goals'][number];

export function toPushTransaction(t: LocalTransaction, maps: AccountMaps): PushTxn | null {
  const accountId = maps.toServer[t.accountId];
  if (!accountId) return null;
  return {
    id: t.id,
    type: t.type,
    amountPaise: t.amountPaise,
    categoryId: t.categoryId || null,
    accountId,
    occurredAt: t.occurredAt,
    note: t.note.slice(0, 200),
    merchant: t.merchant ? t.merchant.slice(0, 120) : null,
    source: t.source,
    refNo: t.refNo ?? null,
    last4: t.last4 ?? null,
    needsReview: t.needsReview ?? false,
    baseVersion: t.version ?? 0,
    deletedAt: t.deletedAt ?? null,
  };
}

export const toPushBudget = (b: LocalBudget): PushBudget => ({
  id: b.id,
  categoryId: b.categoryId,
  period: 'MONTHLY',
  limitPaise: b.limitPaise,
  baseVersion: b.version ?? 0,
  deletedAt: b.deletedAt ?? null,
});

export const toPushGoal = (g: LocalGoal): PushGoal => ({
  id: g.id,
  name: g.name,
  targetPaise: g.targetPaise,
  savedPaise: g.savedPaise,
  deadline: g.deadline,
  baseVersion: g.version ?? 0,
  deletedAt: g.deletedAt ?? null,
});

export const fromServerTransaction = (d: TransactionDTO, maps: AccountMaps): LocalTransaction => ({
  id: d.id,
  type: d.type,
  amountPaise: d.amountPaise,
  accountId: maps.toLocal.get(d.accountId) ?? 'cash',
  categoryId: d.categoryId ?? 'other',
  occurredAt: d.occurredAt,
  note: d.note,
  merchant: d.merchant,
  source: d.source,
  refNo: d.refNo,
  last4: d.last4,
  needsReview: d.needsReview,
  deletedAt: d.deletedAt,
  version: d.version,
  modifiedAt: d.updatedAt,
  synced: true,
});

export const fromServerBudget = (d: BudgetDTO): LocalBudget => ({
  id: d.id,
  categoryId: d.categoryId,
  limitPaise: d.limitPaise,
  deletedAt: d.deletedAt,
  version: d.version,
  modifiedAt: d.updatedAt,
  synced: true,
});

export const fromServerGoal = (d: GoalDTO): LocalGoal => ({
  id: d.id,
  name: d.name,
  targetPaise: d.targetPaise,
  savedPaise: d.savedPaise,
  deadline: d.deadline,
  deletedAt: d.deletedAt,
  version: d.version,
  modifiedAt: d.updatedAt,
  synced: true,
});

/* ---------- push ---------- */

type Kind = 'transaction' | 'budget' | 'goal';

async function applyPushResult(r: PushResult, captured: Map<string, string | undefined>, maps: AccountMaps) {
  await db.transaction('rw', db.transactions, db.budgets, db.goals, async () => {
    const tableFor = (k: Kind) => (k === 'transaction' ? db.transactions : k === 'budget' ? db.budgets : db.goals);

    for (const a of r.applied) {
      const table = tableFor(a.kind);
      const row = await table.get(a.id);
      if (!row) continue;
      // If the row changed while the request was in flight it stays pending, with the new base version.
      if (row.modifiedAt === captured.get(a.id)) await table.update(a.id, { synced: true, version: a.version, syncError: null });
      else await table.update(a.id, { version: a.version });
    }
    for (const c of r.conflicts) {
      // The server version wins.
      if (c.kind === 'transaction') await db.transactions.put(fromServerTransaction(c.server as TransactionDTO, maps));
      else if (c.kind === 'budget') await db.budgets.put(fromServerBudget(c.server as BudgetDTO));
      else await db.goals.put(fromServerGoal(c.server as GoalDTO));
    }
    // Same reference number as an existing payment: the server keeps one record, so the copy goes.
    for (const d of r.duplicates) await db.transactions.delete(d.id);
    for (const x of r.rejected) await tableFor(x.kind).update(x.id, { synced: true, syncError: x.reason });
  });
}

/** One bad row must not block the rest, so a refused batch is retried row by row. */
async function pushIndividually(payload: SyncPushBody): Promise<PushResult> {
  const merged: PushResult = { applied: [], conflicts: [], duplicates: [], flagged: [], rejected: [] };
  const send = async (kind: Kind, id: string, body: Partial<SyncPushBody>) => {
    try {
      const r = await api<PushResult>('/api/v1/sync/push', { method: 'POST', body: JSON.stringify(body) });
      merged.applied.push(...r.applied);
      merged.conflicts.push(...r.conflicts);
      merged.duplicates.push(...r.duplicates);
      merged.flagged.push(...r.flagged);
      merged.rejected.push(...r.rejected);
    } catch (e) {
      if ((e as Error).message !== 'invalid_request') throw e;
      merged.rejected.push({ kind, id, reason: 'invalid_request' });
    }
  };
  for (const t of payload.transactions) await send('transaction', t.id, { transactions: [t] });
  for (const b of payload.budgets) await send('budget', b.id, { budgets: [b] });
  for (const g of payload.goals) await send('goal', g.id, { goals: [g] });
  return merged;
}

async function pushPending(maps: AccountMaps): Promise<number> {
  let refused = 0;
  for (let round = 0; round < 20; round++) {
    const [tx, bu, go] = await Promise.all([db.transactions.toArray(), db.budgets.toArray(), db.goals.toArray()]);
    const pt = tx.filter((r) => !r.synced).slice(0, 100);
    const pb = bu.filter((r) => !r.synced).slice(0, 50);
    const pg = go.filter((r) => !r.synced).slice(0, 50);

    const captured = new Map<string, string | undefined>();
    for (const r of [...pt, ...pb, ...pg]) captured.set(r.id, r.modifiedAt);
    const payload: SyncPushBody = {
      transactions: pt.map((t) => toPushTransaction(t, maps)).filter((t): t is PushTxn => t !== null),
      budgets: pb.map(toPushBudget),
      goals: pg.map(toPushGoal),
    };
    if (payload.transactions.length + payload.budgets.length + payload.goals.length === 0) break;

    let result: PushResult;
    try {
      result = await api<PushResult>('/api/v1/sync/push', { method: 'POST', body: JSON.stringify(payload) });
    } catch (e) {
      if ((e as Error).message !== 'invalid_request') throw e;
      result = await pushIndividually(payload);
    }
    refused += result.rejected.length;
    await applyPushResult(result, captured, maps);
  }
  return refused;
}

/* ---------- pull ---------- */

async function pullAll(maps: AccountMaps): Promise<void> {
  let cursor = await getMeta<string>('syncCursor');
  for (let page = 0; page < 50; page++) {
    const q = new URLSearchParams({ limit: '300' });
    if (cursor) q.set('cursor', cursor);
    const changes = await api<SyncChanges>(`/api/v1/sync/changes?${q}`);

    await db.transaction('rw', db.transactions, db.budgets, db.goals, async () => {
      // A row with local changes waits for its push, which settles the conflict. Server versions never
      // overwrite newer local work, and a deletion for a row we never had is not worth storing.
      for (const d of changes.transactions) {
        const local = await db.transactions.get(d.id);
        if (local ? !local.synced || (local.version ?? 0) > d.version : d.deletedAt) continue;
        await db.transactions.put(fromServerTransaction(d, maps));
      }
      for (const d of changes.budgets) {
        const local = await db.budgets.get(d.id);
        if (local ? !local.synced || (local.version ?? 0) > d.version : d.deletedAt) continue;
        await db.budgets.put(fromServerBudget(d));
      }
      for (const d of changes.goals) {
        const local = await db.goals.get(d.id);
        if (local ? !local.synced || (local.version ?? 0) > d.version : d.deletedAt) continue;
        await db.goals.put(fromServerGoal(d));
      }
    });

    cursor = changes.cursor;
    await setMeta('syncCursor', cursor);
    if (!changes.hasMore) break;
  }
}

/* ---------- identity and settings ---------- */

async function syncProfile(me: MeDTO) {
  // Data from a different account must never mix into this one.
  const stored = await getMeta<string>('userId');
  if (stored && stored !== me.id) await wipeLocal();
  await setMeta('userId', me.id);
  await setMeta('account', { id: me.id, email: me.email, name: me.name });

  const local = await loadSettings();
  let dirty = (await getMeta<boolean>('settingsDirty')) ?? false;
  // Set up as a guest, then signed in to a brand new account: send the allowance up.
  if (!dirty && local.onboarded && me.allowancePaise === 0 && local.allowancePaise > 0) dirty = true;

  if (dirty) {
    await api<MeDTO>('/api/v1/me', {
      method: 'PUT',
      body: JSON.stringify({
        ...(local.name && { name: local.name }),
        allowancePaise: local.allowancePaise,
        cycleStartDay: local.cycleStartDay,
      }),
    });
    await markSettingsDirty(false);
  } else if (me.allowancePaise > 0) {
    // A new device for an existing account picks up where the other one left off.
    await saveSettings({ name: me.name, allowancePaise: me.allowancePaise, cycleStartDay: me.cycleStartDay, onboarded: true });
  }
}

/* ---------- running it ---------- */

let running: Promise<void> | null = null;
let again = false;

async function run() {
  if (!hasSession()) {
    set({ phase: 'signed-out', error: null });
    return;
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    set({ phase: 'offline' });
    return;
  }
  set({ phase: 'syncing', error: null });
  try {
    const [accounts, me] = await Promise.all([api<AccountDTO[]>('/api/v1/accounts'), api<MeDTO>('/api/v1/me')]);
    const maps = buildAccountMaps(accounts);
    await syncProfile(me);
    const refused = await pushPending(maps);
    await pullAll(maps);
    set({ phase: 'idle', lastSyncAt: new Date().toISOString(), refused });
  } catch (e) {
    // fetch throws a TypeError when the server cannot be reached at all.
    if (e instanceof TypeError) set({ phase: 'offline' });
    else if (!hasSession()) set({ phase: 'signed-out' });
    else set({ phase: 'error', error: (e as Error).message });
  }
}

/** Runs a sync now. If one is already running, another follows it so late changes are not missed. */
export function syncNow(): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = run().finally(() => {
    running = null;
    if (again) {
      again = false;
      void syncNow();
    }
  });
  return running;
}

let timer: ReturnType<typeof setTimeout> | undefined;
/** Called after every local edit. Waits a moment so a burst of edits becomes one sync. */
export function requestSync() {
  if (typeof window === 'undefined' || !hasSession()) return;
  clearTimeout(timer);
  timer = setTimeout(() => void syncNow(), 1500);
}

/** Sync on start, when the connection returns, when the app comes back to the front, and every minute. */
export function startAutoSync(): () => void {
  void syncNow();
  const onOnline = () => void syncNow();
  const onVisible = () => document.visibilityState === 'visible' && void syncNow();
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', () => set({ phase: hasSession() ? 'offline' : 'signed-out' }));
  document.addEventListener('visibilitychange', onVisible);
  const id = setInterval(() => document.visibilityState === 'visible' && void syncNow(), 60_000);
  return () => {
    window.removeEventListener('online', onOnline);
    document.removeEventListener('visibilitychange', onVisible);
    clearInterval(id);
  };
}

/**
 * Signs out. Anything not yet on the server blocks it, so nothing is lost.
 * Local data is removed afterwards, so the next person to sign in on this device never sees it.
 */
export async function signOut(): Promise<{ ok: true } | { ok: false; unsynced: number }> {
  await syncNow();
  const unsynced = await countPending();
  if (unsynced > 0) return { ok: false, unsynced };
  await logout();
  await wipeLocal();
  set({ phase: 'signed-out', lastSyncAt: null, error: null, refused: 0 });
  return { ok: true };
}

/** Deletes the account and everything on the server, then clears this device. Needs the password again. */
export async function deleteAccount(password: string): Promise<void> {
  await api<void>('/api/v1/me', { method: 'DELETE', body: JSON.stringify({ password }) });
  await logout();
  await wipeLocal();
  set({ phase: 'signed-out', lastSyncAt: null, error: null, refused: 0 });
}
