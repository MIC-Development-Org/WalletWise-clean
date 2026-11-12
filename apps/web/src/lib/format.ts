/** Display helpers. Amounts are always integer paise on the way in. */

/** 12000 -> "₹120", 12050 -> "₹120.50". Indian digit grouping. */
export function rupees(paise: number): string {
  const sign = paise < 0 ? '-' : '';
  const abs = Math.abs(paise);
  const whole = Math.floor(abs / 100).toLocaleString('en-IN');
  const rest = abs % 100;
  return `${sign}₹${whole}${rest ? `.${String(rest).padStart(2, '0')}` : ''}`;
}

/** Signed amount for lists: expenses show a minus, income a plus. */
export function signedRupees(paise: number, type: 'EXPENSE' | 'INCOME'): string {
  return `${type === 'INCOME' ? '+' : '-'}${rupees(Math.abs(paise))}`;
}

export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Local calendar day key, yyyy-mm-dd. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

const SHORT = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
const LONG = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const TIME = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

export function shortDate(d: Date): string {
  return SHORT.format(d);
}

export function timeOf(d: Date): string {
  return TIME.format(d).toLowerCase();
}

/** "Today", "Yesterday", or "Mon, 3 Nov". */
export function dayLabel(key: string, now: Date): string {
  const today = startOfDay(now);
  if (key === dayKey(today)) return 'Today';
  if (key === dayKey(addDays(today, -1))) return 'Yesterday';
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  return LONG.format(new Date(y, m - 1, d));
}

export function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
