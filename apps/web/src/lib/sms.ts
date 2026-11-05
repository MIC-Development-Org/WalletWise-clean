import { Capacitor, registerPlugin } from '@capacitor/core';
import { KNOWN_SENDER_RE, parseSms, type ParsedSms } from '@money-tracker/shared';

interface SmsReaderPlugin {
  readHistory(opts: {
    senderPattern: string;
    sinceMs: number;
    limit: number;
  }): Promise<{ messages: { sender: string; body: string; date: number }[] }>;
}

const SmsReader = registerPlugin<SmsReaderPlugin>('SmsReader');

/** SMS capture only exists in the Android app. On web and iPhone this returns false. */
export const smsSupported = () => Capacitor.getPlatform() === 'android';

export interface SmsScanResult {
  parsed: (ParsedSms & { occurredAt: string })[];
  needsReview: number;
}

/** Reads bank SMS on the device and returns extracted fields only. Raw text is dropped here. */
export async function scanSmsHistory(sinceMs: number): Promise<SmsScanResult> {
  const { messages } = await SmsReader.readHistory({
    senderPattern: KNOWN_SENDER_RE.source,
    sinceMs,
    limit: 2000,
  });
  const result: SmsScanResult = { parsed: [], needsReview: 0 };
  for (const m of messages) {
    const r = parseSms(m.sender, m.body);
    if (r.status === 'parsed') {
      result.parsed.push({ ...r.txn, occurredAt: new Date(m.date).toISOString() });
    } else if (r.status === 'review') {
      result.needsReview++;
    }
  }
  return result;
}
