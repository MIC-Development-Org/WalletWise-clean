import { z } from 'zod';

/**
 * Parsing rules are plain data so the API can ship new banks without an app release.
 * Patterns are validated and length-capped because they are compiled on the client.
 */
export const smsRuleSchema = z.object({
  id: z.string().min(1).max(60),
  bank: z.string().min(1).max(40),
  /** Matches the sender id, for example "VM-HDFCBK". */
  sender: z.string().min(1).max(200),
  kind: z.enum(['DEBIT', 'CREDIT']),
  /** Named groups: amount (required), last4, merchant, ref. */
  pattern: z.string().min(1).max(500),
});

export type SmsRule = z.infer<typeof smsRuleSchema>;

export interface ParsedSms {
  type: 'EXPENSE' | 'INCOME';
  amountPaise: number;
  last4: string | null;
  merchant: string | null;
  refNo: string | null;
  ruleId: string;
}

export type SmsParseResult =
  | { status: 'parsed'; txn: ParsedSms }
  | { status: 'review'; reason: string }
  | { status: 'ignored'; reason: string };
