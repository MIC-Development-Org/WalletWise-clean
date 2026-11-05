import { describe, expect, it } from 'vitest';
import { compareTransactions, formatPaise, parseSms, rupeesToPaise } from './index';

describe('money', () => {
  it('converts rupees to paise without float drift', () => {
    expect(rupeesToPaise('1,234.5')).toBe(123450);
    expect(rupeesToPaise('0.07')).toBe(7);
    expect(rupeesToPaise('abc')).toBeNull();
  });
  it('formats paise', () => {
    expect(formatPaise(123450)).toBe('₹1,234.50');
  });
});

describe('sms engine', () => {
  it('parses an HDFC UPI debit', () => {
    const r = parseSms(
      'VM-HDFCBK',
      'Sent Rs.450.00 From HDFC Bank A/C *1234 To ZOMATO On 12/10/26 Ref 123456789012',
    );
    expect(r.status).toBe('parsed');
    if (r.status === 'parsed') {
      expect(r.txn.amountPaise).toBe(45000);
      expect(r.txn.last4).toBe('1234');
      expect(r.txn.refNo).toBe('123456789012');
    }
  });
  it('ignores unknown senders and OTPs', () => {
    expect(parseSms('AB-SHOPPY', 'Rs 500 debited').status).toBe('ignored');
    expect(parseSms('VM-HDFCBK', 'Your OTP is 123456').status).toBe('ignored');
  });
  it('ignores failed payments', () => {
    expect(parseSms('VM-HDFCBK', 'Rs 100 debited but transaction failed').status).toBe('ignored');
  });
  it('sends unmatched money messages to review', () => {
    expect(parseSms('VM-HDFCBK', 'Rs 100 debited from your account somehow').status).toBe(
      'review',
    );
  });
});

describe('dedupe', () => {
  const base = {
    amountPaise: 45000,
    type: 'EXPENSE' as const,
    occurredAt: new Date('2026-10-12T10:14:59Z'),
    last4: '1234',
    refNo: null,
  };
  it('matches on reference number', () => {
    expect(compareTransactions({ ...base, refNo: '1' }, { ...base, refNo: '1' })).toBe(
      'DUPLICATE',
    );
  });
  it('flags close matches without a reference', () => {
    const later = { ...base, occurredAt: new Date('2026-10-12T10:15:02Z') };
    expect(compareTransactions(base, later)).toBe('POSSIBLE');
  });
  it('keeps far apart payments distinct', () => {
    const later = { ...base, occurredAt: new Date('2026-10-12T12:00:00Z') };
    expect(compareTransactions(base, later)).toBe('DISTINCT');
  });
});
