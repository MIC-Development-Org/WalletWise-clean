import Dexie, { type EntityTable } from 'dexie';

export type TxnSource = 'MANUAL' | 'SMS' | 'EMAIL' | 'SCAN';
export type AccountId = 'cash' | 'upi' | 'bank' | 'wallet';

/**
 * Fields every synced record carries.
 *  - `synced` false means there are local changes the server has not accepted yet
 *  - `version` is the last server version this device saw (0 or missing for a brand new row)
 *  - `modifiedAt` lets a finished push tell whether the row changed while the request was in flight
 *  - `deletedAt` is a soft delete, so a deletion travels through sync and never comes back
 */
export interface SyncFields {
  synced: boolean;
  version?: number;
  modifiedAt?: string;
  deletedAt?: string | null;
  /** Set when the server refused the row, so it is not retried forever. */
  syncError?: string | null;
}

export interface LocalTransaction extends SyncFields {
  /** Client generated UUID, so a retried sync can never create a duplicate. */
  id: string;
  type: 'EXPENSE' | 'INCOME';
  /** Whole paise. Never floats. */
  amountPaise: number;
  accountId: AccountId;
  categoryId: string;
  /** ISO string in UTC. Shown in local time. */
  occurredAt: string;
  note: string;
  merchant: string | null;
  source: TxnSource;
  refNo?: string | null;
  last4?: string | null;
  /** Uncertain captures wait here instead of polluting totals. */
  needsReview?: boolean;
}

export interface LocalBudget extends SyncFields {
  id: string;
  /** null means the overall monthly budget. */
  categoryId: string | null;
  limitPaise: number;
}

export interface LocalGoal extends SyncFields {
  id: string;
  name: string;
  targetPaise: number;
  savedPaise: number;
  /** ISO date (yyyy-mm-dd) or null. */
  deadline: string | null;
}

export interface Settings {
  onboarded: boolean;
  name: string;
  /** Monthly allowance in paise. Also the default overall budget. */
  allowancePaise: number;
  /** Day of month (1-28) the allowance lands and the budget cycle restarts. */
  cycleStartDay: number;
}

export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  name: '',
  allowancePaise: 0,
  cycleStartDay: 1,
};

interface MetaRow {
  key: string;
  value: unknown;
}

export const db = new Dexie('money-tracker') as Dexie & {
  transactions: EntityTable<LocalTransaction, 'id'>;
  budgets: EntityTable<LocalBudget, 'id'>;
  goals: EntityTable<LocalGoal, 'id'>;
  meta: EntityTable<MetaRow, 'key'>;
};

db.version(1).stores({
  transactions: 'id, occurredAt, synced',
});

db.version(2)
  .stores({
    transactions: 'id, occurredAt, synced, needsReview',
    budgets: 'id',
    goals: 'id',
    meta: 'key',
  })
  .upgrade((tx) =>
    tx
      .table('transactions')
      .toCollection()
      .modify((t: Partial<LocalTransaction>) => {
        t.source ??= 'MANUAL';
        t.categoryId ??= 'other';
        t.accountId ??= 'cash';
      }),
  );

// Version 3 adds sync. Booleans are not valid IndexedDB keys, so the old `synced` and `needsReview`
// indexes never worked. Pending rows are found by filtering instead.
db.version(3)
  .stores({
    transactions: 'id, occurredAt',
    budgets: 'id',
    goals: 'id',
    meta: 'key',
  })
  .upgrade(async (tx) => {
    const now = new Date().toISOString();
    await tx
      .table('transactions')
      .toCollection()
      .modify((t: Partial<LocalTransaction>) => {
        t.version ??= 0;
        t.modifiedAt ??= now;
        t.synced = false;
      });
    for (const name of ['budgets', 'goals']) {
      await tx
        .table(name)
        .toCollection()
        .modify((r: Partial<SyncFields>) => {
          r.version ??= 0;
          r.modifiedAt ??= now;
          r.synced = false;
        });
    }
  });

/* ---------- meta ---------- */

export async function getMeta<T>(key: string): Promise<T | undefined> {
  return (await db.meta.get(key))?.value as T | undefined;
}

export const setMeta = (key: string, value: unknown) => db.meta.put({ key, value });

export async function loadSettings(): Promise<Settings> {
  const row = await db.meta.get('settings');
  return { ...DEFAULT_SETTINGS, ...((row?.value as Partial<Settings>) ?? {}) };
}

export async function saveSettings(patch: Partial<Settings>) {
  const next = { ...(await loadSettings()), ...patch };
  await db.meta.put({ key: 'settings', value: next });
}

/** Local settings changed and the server has not seen them yet. */
export const markSettingsDirty = (dirty = true) => setMeta('settingsDirty', dirty);

/** Removes everything stored on this device. */
export async function wipeLocal() {
  await db.transaction('rw', db.transactions, db.budgets, db.goals, db.meta, async () => {
    await Promise.all([db.transactions.clear(), db.budgets.clear(), db.goals.clear(), db.meta.clear()]);
  });
}

/** How many local changes the server has not accepted yet. */
export async function countPending(): Promise<number> {
  const [t, b, g] = await Promise.all([db.transactions.toArray(), db.budgets.toArray(), db.goals.toArray()]);
  return [...t, ...b, ...g].filter((r) => !r.synced).length;
}
