import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, loadSettings, markSettingsDirty, saveSettings, wipeLocal, type AccountId, type LocalTransaction, type Settings } from './db';
import { category } from './categories';
import { sampleBudgets, sampleGoals, sampleTransactions } from './sample';
import { buildSnapshot, type Snapshot } from './snapshot';
import { rupees } from './format';
import { requestSync } from './sync';

/** Re-renders every minute so "today" rolls over at midnight without a reload. */
function useNow(everyMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}

export function useSettings(): Settings | undefined {
  return useLiveQuery(loadSettings, []);
}

export function useSnapshot(): Snapshot | undefined {
  const now = useNow();
  const minute = Math.floor(now.getTime() / 60_000);
  return useLiveQuery(async () => {
    const [settings, transactions, budgets, goals] = await Promise.all([
      loadSettings(),
      db.transactions.toArray(),
      db.budgets.toArray(),
      db.goals.toArray(),
    ]);
    // Deleted rows stay until the server has heard about them, but never show up.
    return buildSnapshot({ now: new Date(), settings, transactions, budgets, goals });
  }, [minute]);
}

const uuid = () => crypto.randomUUID();
const stamp = () => new Date().toISOString();
/** A local edit: unsynced, remembers when, and asks for a sync soon. */
const dirty = () => {
  requestSync();
  return { synced: false, modifiedAt: stamp() } as const;
};

export interface NewTransaction {
  type: 'EXPENSE' | 'INCOME';
  amountPaise: number;
  categoryId: string;
  accountId: AccountId;
  occurredAt: Date;
  note: string;
  merchant?: string | null;
}

export async function addTransaction(input: NewTransaction): Promise<string> {
  const id = uuid();
  await db.transactions.add({
    id,
    type: input.type,
    amountPaise: input.amountPaise,
    categoryId: input.categoryId,
    accountId: input.accountId,
    occurredAt: input.occurredAt.toISOString(),
    note: input.note.trim().slice(0, 140),
    merchant: input.merchant ?? null,
    source: 'MANUAL',
    version: 0,
    ...dirty(),
  });
  return id;
}

export const deleteTransaction = (id: string) => db.transactions.update(id, { deletedAt: stamp(), ...dirty() });

export const restoreTransaction = (id: string) => db.transactions.update(id, { deletedAt: null, ...dirty() });

export const acceptReview = (id: string, categoryId?: string) =>
  db.transactions.update(id, { needsReview: false, ...(categoryId && { categoryId }), ...dirty() });

export async function setBudget(categoryId: string | null, limitPaise: number) {
  const existing = (await db.budgets.toArray()).find((b) => b.categoryId === categoryId && !b.deletedAt);
  if (existing) await db.budgets.update(existing.id, { limitPaise, ...dirty() });
  else await db.budgets.add({ id: uuid(), categoryId, limitPaise, version: 0, ...dirty() });
}

export const removeBudget = (id: string) => db.budgets.update(id, { deletedAt: stamp(), ...dirty() });

export const addGoal = (name: string, targetPaise: number, deadline: string | null) =>
  db.goals.add({ id: uuid(), name: name.trim().slice(0, 60), targetPaise, savedPaise: 0, deadline, version: 0, ...dirty() });

export async function addToGoal(id: string, deltaPaise: number) {
  const g = await db.goals.get(id);
  if (g) await db.goals.update(id, { savedPaise: Math.max(0, g.savedPaise + deltaPaise), ...dirty() });
}

export const removeGoal = (id: string) => db.goals.update(id, { deletedAt: stamp(), ...dirty() });

export async function completeOnboarding(s: Pick<Settings, 'name' | 'allowancePaise' | 'cycleStartDay'>) {
  await saveSettings({ ...s, name: s.name.trim().slice(0, 40), onboarded: true });
  await markSettingsDirty();
  await setBudget(null, s.allowancePaise);
}

export async function updateAllowance(s: Pick<Settings, 'name' | 'allowancePaise' | 'cycleStartDay'>) {
  await saveSettings({ ...s, name: s.name.trim().slice(0, 40) });
  await markSettingsDirty();
  await setBudget(null, s.allowancePaise);
}

/** Adds a month of example spending to the user's own cycle. Their allowance and cycle day are kept. */
export async function loadSample() {
  const now = new Date();
  const settings = await loadSettings();
  const allowance = settings.allowancePaise || 800000;
  await db.transaction('rw', db.transactions, db.budgets, db.goals, async () => {
    await db.transactions.bulkAdd(sampleTransactions(now, uuid, settings.cycleStartDay).map((t) => ({ ...t, version: 0, modifiedAt: stamp(), synced: false })));
    // Replace the overall and category budgets, keeping soft deletes so the server hears about them.
    for (const b of await db.budgets.toArray()) await db.budgets.update(b.id, { deletedAt: stamp(), synced: false, modifiedAt: stamp() });
    await db.budgets.bulkAdd(sampleBudgets(uuid, allowance).map((b) => ({ ...b, version: 0, modifiedAt: stamp(), synced: false })));
    await db.goals.bulkAdd(sampleGoals(uuid).map((g) => ({ ...g, version: 0, modifiedAt: stamp(), synced: false })));
  });
  if (!settings.allowancePaise) {
    await saveSettings({ allowancePaise: allowance });
    await markSettingsDirty();
  }
  requestSync();
}

export const eraseAll = wipeLocal;

/** Spreadsheet formulas in user text must never run when the file is opened. */
function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function exportCsv(): Promise<string> {
  const rows = (await db.transactions.orderBy('occurredAt').toArray()).filter((t) => !t.deletedAt);
  const head = ['Date', 'Type', 'Amount (INR)', 'Category', 'Account', 'Merchant', 'Note', 'Source'];
  const lines = rows.map((t: LocalTransaction) =>
    [
      t.occurredAt,
      t.type,
      rupees(t.amountPaise).replace(/[₹,]/g, ''),
      category(t.categoryId).name,
      t.accountId,
      t.merchant ?? '',
      t.note,
      t.source,
    ]
      .map((c) => csvCell(String(c)))
      .join(','),
  );
  return [head.map(csvCell).join(','), ...lines].join('\n');
}
