import { z } from 'zod';
import { idSchema, paise, transactionSource, transactionType } from './schemas';

/**
 * Request and response contracts for the API. API changes start here, so the server and every
 * client are checked against the same schemas.
 */

const uuid = z.string().uuid();
const money = z.number().int().min(0).max(2_000_000_000);
const isoDateTime = z.string().datetime();

export const accountType = z.enum(['CASH', 'BANK', 'UPI', 'WALLET']);
export const budgetPeriod = z.enum(['WEEKLY', 'MONTHLY']);

/* ---------- me ---------- */

/**
 * Profile photo as a small JPEG data URL. The app resizes it to 256px first, so it is a few tens of
 * kilobytes. Only JPEG is accepted, and it is only ever shown in an img tag.
 */
export const profilePhoto = z
  .string()
  .max(70_000)
  .regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/);

export const meBody = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  /** null removes the photo. Leaving it out keeps the current one. */
  photo: profilePhoto.nullable().optional(),
  allowancePaise: money.optional(),
  /** Day of month the allowance lands and the budget cycle restarts. */
  cycleStartDay: z.number().int().min(1).max(28).optional(),
});

export const deleteMeBody = z.object({
  /** Deleting an account removes all of its data, so it asks for the password again. */
  password: z.string().min(1).max(128),
});

/* ---------- accounts and categories ---------- */

export const accountBody = z.object({
  name: z.string().trim().min(1).max(40),
  type: accountType,
});

export const categoryBody = z.object({
  name: z.string().trim().min(1).max(40),
  icon: z.string().trim().min(1).max(40).default('tag'),
  isIncome: z.boolean().default(false),
});

/* ---------- transactions ---------- */

/** Edit. Fields are optional; `baseVersion` makes the edit lose to a newer server version. */
export const updateTransactionBody = z.object({
  type: transactionType.optional(),
  amountPaise: paise.optional(),
  categoryId: idSchema.nullable().optional(),
  accountId: idSchema.optional(),
  occurredAt: isoDateTime.optional(),
  note: z.string().trim().max(200).optional(),
  merchant: z.string().trim().max(120).nullable().optional(),
  baseVersion: z.number().int().min(0).optional(),
});

export const searchTransactionsQuery = z.object({
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
  q: z.string().trim().max(80).optional(),
  categoryId: idSchema.optional(),
  accountId: idSchema.optional(),
  type: transactionType.optional(),
  minPaise: z.coerce.number().int().min(0).optional(),
  maxPaise: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

/* ---------- budgets and goals ---------- */

export const budgetBody = z.object({
  /** Client generated, so a retried request never creates a second budget. */
  id: uuid,
  /** null is the overall cycle budget. */
  categoryId: idSchema.nullable().default(null),
  period: budgetPeriod.default('MONTHLY'),
  limitPaise: paise,
});

export const goalBody = z.object({
  id: uuid,
  name: z.string().trim().min(1).max(60),
  targetPaise: paise,
  savedPaise: money.default(0),
  deadline: z.iso.date().nullable().default(null),
});

/* ---------- sync ---------- */

const syncMeta = {
  /** The server version this device last saw. 0 for a brand new row. */
  baseVersion: z.number().int().min(0).default(0),
  deletedAt: isoDateTime.nullable().default(null),
};

export const syncTransaction = z.object({
  id: uuid,
  type: transactionType,
  amountPaise: paise,
  categoryId: idSchema.nullable().default(null),
  accountId: idSchema,
  occurredAt: isoDateTime,
  note: z.string().trim().max(200).default(''),
  merchant: z.string().trim().max(120).nullable().default(null),
  source: transactionSource.default('MANUAL'),
  refNo: z.string().trim().max(40).nullable().default(null),
  last4: z
    .string()
    .regex(/^\d{4}$/)
    .nullable()
    .default(null),
  needsReview: z.boolean().default(false),
  ...syncMeta,
});

export const syncBudget = budgetBody.extend(syncMeta);
export const syncGoal = goalBody.extend(syncMeta);

export const syncPushBody = z.object({
  transactions: z.array(syncTransaction).max(200).default([]),
  budgets: z.array(syncBudget).max(100).default([]),
  goals: z.array(syncGoal).max(100).default([]),
});

export const syncChangesQuery = z.object({
  /** ISO timestamp returned by the previous call. Omit for a full download. */
  cursor: isoDateTime.optional(),
  limit: z.coerce.number().int().min(1).max(500).default(300),
});

export interface TransactionDTO {
  id: string;
  type: 'EXPENSE' | 'INCOME';
  amountPaise: number;
  accountId: string;
  categoryId: string | null;
  occurredAt: string;
  note: string;
  merchant: string | null;
  source: 'MANUAL' | 'SMS' | 'EMAIL' | 'SCAN';
  refNo: string | null;
  last4: string | null;
  needsReview: boolean;
  deletedAt: string | null;
  version: number;
  updatedAt: string;
}

export interface BudgetDTO {
  id: string;
  categoryId: string | null;
  period: 'WEEKLY' | 'MONTHLY';
  limitPaise: number;
  deletedAt: string | null;
  version: number;
  updatedAt: string;
}

export interface GoalDTO {
  id: string;
  name: string;
  targetPaise: number;
  savedPaise: number;
  deadline: string | null;
  deletedAt: string | null;
  version: number;
  updatedAt: string;
}

export interface MeDTO {
  id: string;
  email: string;
  name: string;
  photo: string | null;
  allowancePaise: number;
  cycleStartDay: number;
}

export interface AccountDTO {
  id: string;
  name: string;
  type: 'CASH' | 'BANK' | 'UPI' | 'WALLET';
}

export interface CategoryDTO {
  id: string;
  name: string;
  icon: string;
  isIncome: boolean;
  builtIn: boolean;
}

export interface SyncChanges {
  /** Pass back as `cursor` on the next call. */
  cursor: string;
  hasMore: boolean;
  me: MeDTO;
  accounts: AccountDTO[];
  transactions: TransactionDTO[];
  budgets: BudgetDTO[];
  goals: GoalDTO[];
}

export interface PushResult {
  /** Rows the server accepted, with their new version. */
  applied: { kind: 'transaction' | 'budget' | 'goal'; id: string; version: number }[];
  /** Rows where the server had a newer version. The server row wins and is returned here. */
  conflicts: { kind: 'transaction' | 'budget' | 'goal'; id: string; server: TransactionDTO | BudgetDTO | GoalDTO }[];
  /** New transactions whose reference number matched an existing one. Keep the existing record. */
  duplicates: { id: string; existingId: string }[];
  /** Stored, but similar to another entry nearby. Flagged for the user to decide. */
  flagged: { id: string; similarTo: string }[];
  /** Rows refused, with the reason (unknown account, id owned by someone else and so on). */
  rejected: { kind: 'transaction' | 'budget' | 'goal'; id: string; reason: string }[];
}

/* ---------- SMS ingestion ---------- */

/** Only extracted fields, never the message text. */
export const smsIngestItem = z.object({
  id: uuid,
  type: transactionType,
  amountPaise: paise,
  merchant: z.string().trim().max(120).nullable().default(null),
  last4: z
    .string()
    .regex(/^\d{4}$/)
    .nullable()
    .default(null),
  refNo: z.string().trim().max(40).nullable().default(null),
  occurredAt: isoDateTime,
  ruleId: z.string().max(60),
  accountId: idSchema,
  /** Anything that is not INR goes to the review list. */
  currency: z.string().length(3).default('INR'),
  /** The device was unsure. Stored for review instead of being counted. */
  review: z.boolean().default(false),
});

export const smsIngestBody = z.object({ items: z.array(smsIngestItem).min(1).max(200) });

/* ---------- review ---------- */

export const reviewDecisionBody = z.object({
  decision: z.enum(['accept', 'reject']),
  categoryId: idSchema.optional(),
});

/* ---------- push ---------- */

export const pushSubscribeBody = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('webpush'),
    endpoint: z.string().url().max(600),
    keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
  }),
  z.object({ kind: z.literal('fcm'), token: z.string().min(20).max(600) }),
]);

/* ---------- insights ---------- */

export const insightsQuery = z.object({
  /** Minutes to subtract from UTC to get the user's local time, like JavaScript's getTimezoneOffset. */
  tzOffset: z.coerce.number().int().min(-840).max(840).default(-330),
});

export interface Insights {
  cycle: { start: string; end: string; daysLeft: number; daysTotal: number };
  budgetPaise: number;
  spentPaise: number;
  incomePaise: number;
  leftPaise: number;
  safeToSpendPaise: number;
  /** Null when nothing is spent yet, so there is no end date. */
  runway: string | null;
  prevSpentPaise: number;
  /** Null when there was no spending in the previous cycle to compare with. */
  changeVsPrevPct: number | null;
  byCategory: { categoryId: string | null; paise: number }[];
  patterns: { topCategoryId: string | null; busiestWeekday: number | null };
}

export type SyncPushBody = z.infer<typeof syncPushBody>;
export type SmsIngestBody = z.infer<typeof smsIngestBody>;
export type SyncTransaction = z.infer<typeof syncTransaction>;
export type SyncBudget = z.infer<typeof syncBudget>;
export type SyncGoal = z.infer<typeof syncGoal>;
