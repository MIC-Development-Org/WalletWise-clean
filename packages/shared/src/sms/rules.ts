import type { SmsRule } from './types';

/**
 * Starter rules. Formats vary between banks and change over time, so treat these as
 * a baseline and extend them from a real, anonymised SMS corpus.
 */
export const DEFAULT_SMS_RULES: SmsRule[] = [
  {
    id: 'hdfc-upi-debit',
    bank: 'HDFC',
    sender: '^[A-Z]{2}-HDFCBK',
    kind: 'DEBIT',
    pattern:
      'Sent Rs\\.?\\s?(?<amount>[\\d,]+(?:\\.\\d{1,2})?)\\s+From HDFC Bank A/C \\*?(?<last4>\\d{4})\\s+To (?<merchant>.+?)\\s+On \\S+(?:\\s+Ref (?<ref>\\d{6,20}))?',
  },
  {
    id: 'sbi-upi-debit',
    bank: 'SBI',
    sender: '^[A-Z]{2}-(SBIUPI|SBIINB|SBIPSG)',
    kind: 'DEBIT',
    pattern:
      'A/C X?(?<last4>\\d{4}) debited by (?<amount>[\\d,]+(?:\\.\\d{1,2})?) on \\S+ trf to (?<merchant>.+?) Refno (?<ref>\\d{6,20})',
  },
  {
    id: 'generic-credit',
    bank: 'GENERIC',
    sender: '^[A-Z]{2}-[A-Z]{5,6}$',
    kind: 'CREDIT',
    pattern:
      'Rs\\.?\\s?(?<amount>[\\d,]+(?:\\.\\d{1,2})?)\\s+(?:is\\s+)?credited.{0,60}?(?:A/C|a/c)\\s?[X*]*(?<last4>\\d{4})',
  },
];

/** Only messages from these sender ids are ever read. Everything else is skipped on device. */
export const KNOWN_SENDER_RE =
  /^[A-Z]{2}-(HDFCBK|SBIUPI|SBIINB|SBIPSG|ICICIB|AXISBK|KOTAKB|PNBSMS|BOBTXN|CANBNK|PAYTMB|JIOPAY)/;
