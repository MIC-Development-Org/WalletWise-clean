/** Money is always whole paise (integer). Never use floats for amounts. */

const AMOUNT_RE = /^\d{1,9}(\.\d{1,2})?$/;

/** "1,234.5" -> 123450. Returns null if the text is not a valid rupee amount. */
export function rupeesToPaise(text: string): number | null {
  const clean = text.replace(/,/g, '').trim();
  if (!AMOUNT_RE.test(clean)) return null;
  const [whole = '0', frac = ''] = clean.split('.');
  return Number(whole) * 100 + Number(frac.padEnd(2, '0'));
}

export function formatPaise(paise: number): string {
  const sign = paise < 0 ? '-' : '';
  const abs = Math.abs(paise);
  const rupees = Math.floor(abs / 100).toLocaleString('en-IN');
  const rest = String(abs % 100).padStart(2, '0');
  return `${sign}₹${rupees}.${rest}`;
}
