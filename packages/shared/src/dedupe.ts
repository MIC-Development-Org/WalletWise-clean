export interface DedupeCandidate {
  amountPaise: number;
  type: 'EXPENSE' | 'INCOME';
  occurredAt: Date;
  last4: string | null;
  refNo: string | null;
}

export type DedupeVerdict = 'DUPLICATE' | 'POSSIBLE' | 'DISTINCT';

const WINDOW_MS = 5 * 60 * 1000;

/**
 * Same payment seen through SMS, email, scan or manual entry.
 * A shared reference number is proof. Without one, a close match is only flagged for review.
 */
export function compareTransactions(a: DedupeCandidate, b: DedupeCandidate): DedupeVerdict {
  if (a.amountPaise !== b.amountPaise || a.type !== b.type) return 'DISTINCT';
  if (a.refNo && b.refNo) return a.refNo === b.refNo ? 'DUPLICATE' : 'DISTINCT';
  const close = Math.abs(a.occurredAt.getTime() - b.occurredAt.getTime()) <= WINDOW_MS;
  if (!close) return 'DISTINCT';
  if (a.last4 && b.last4 && a.last4 !== b.last4) return 'DISTINCT';
  return 'POSSIBLE';
}
