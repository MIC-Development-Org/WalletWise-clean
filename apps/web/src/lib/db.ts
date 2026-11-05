import Dexie, { type EntityTable } from 'dexie';

export interface LocalTransaction {
  id: string;
  type: 'EXPENSE' | 'INCOME';
  amountPaise: number;
  accountId: string;
  categoryId: string | null;
  occurredAt: string;
  note: string;
  merchant: string | null;
  /** false until the server has accepted it, so offline entries sync later. */
  synced: boolean;
}

export const db = new Dexie('money-tracker') as Dexie & {
  transactions: EntityTable<LocalTransaction, 'id'>;
};

db.version(1).stores({
  transactions: 'id, occurredAt, synced',
});
