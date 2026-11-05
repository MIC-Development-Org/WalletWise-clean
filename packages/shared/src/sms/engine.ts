import { rupeesToPaise } from '../money';
import { DEFAULT_SMS_RULES, KNOWN_SENDER_RE } from './rules';
import type { SmsParseResult, SmsRule } from './types';

const MAX_SMS_LENGTH = 600;
const NOISE_RE = /\b(otp|one[- ]time password|verification code|offer|loan|apply now)\b/i;
const FAILED_RE = /\b(failed|declined|unsuccessful|reversed|insufficient)\b/i;
const MONEY_MOVED_RE = /\b(debited|credited|sent|received|paid)\b/i;

export function parseSms(
  sender: string,
  body: string,
  rules: SmsRule[] = DEFAULT_SMS_RULES,
): SmsParseResult {
  if (!KNOWN_SENDER_RE.test(sender)) return { status: 'ignored', reason: 'unknown sender' };
  if (body.length > MAX_SMS_LENGTH) return { status: 'ignored', reason: 'too long' };
  if (NOISE_RE.test(body) && !MONEY_MOVED_RE.test(body)) {
    return { status: 'ignored', reason: 'otp or promo' };
  }
  if (FAILED_RE.test(body)) return { status: 'ignored', reason: 'failed or reversed' };
  if (!MONEY_MOVED_RE.test(body)) return { status: 'ignored', reason: 'not a transaction' };

  for (const rule of rules) {
    if (!new RegExp(rule.sender).test(sender)) continue;
    const g = new RegExp(rule.pattern, 'i').exec(body)?.groups;
    if (!g) continue;
    const amount = rupeesToPaise(g.amount ?? '');
    if (amount === null || amount <= 0) {
      return { status: 'review', reason: 'amount unreadable' };
    }
    return {
      status: 'parsed',
      txn: {
        type: rule.kind === 'DEBIT' ? 'EXPENSE' : 'INCOME',
        amountPaise: amount,
        last4: g.last4 ?? null,
        merchant: g.merchant?.trim() || null,
        refNo: g.ref ?? null,
        ruleId: rule.id,
      },
    };
  }
  return { status: 'review', reason: 'no matching rule' };
}
