import { z } from 'zod';

export const paise = z.number().int().positive().max(2_000_000_000);

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z.string().min(10).max(128);

export const registerBody = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1).max(80),
});

export const loginBody = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const refreshBody = z.object({ refreshToken: z.string().min(20).max(200) });

export const transactionType = z.enum(['EXPENSE', 'INCOME']);
export const transactionSource = z.enum(['MANUAL', 'SMS', 'EMAIL', 'SCAN']);

export const createTransactionBody = z.object({
  /** Client-generated id so a retried sync never creates a duplicate. */
  id: z.string().uuid(),
  type: transactionType,
  amountPaise: paise,
  categoryId: z.string().uuid().nullable().default(null),
  accountId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  note: z.string().trim().max(200).default(''),
  merchant: z.string().trim().max(120).nullable().default(null),
  source: transactionSource.default('MANUAL'),
  refNo: z.string().trim().max(40).nullable().default(null),
  last4: z
    .string()
    .regex(/^\d{4}$/)
    .nullable()
    .default(null),
});

export const listTransactionsQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type RegisterBody = z.infer<typeof registerBody>;
export type LoginBody = z.infer<typeof loginBody>;
export type CreateTransactionBody = z.infer<typeof createTransactionBody>;
export type TransactionType = z.infer<typeof transactionType>;
