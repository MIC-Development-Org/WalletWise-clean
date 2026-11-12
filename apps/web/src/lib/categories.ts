import {
  BookOpen,
  Banknote,
  Clapperboard,
  Coffee,
  Ellipsis,
  GraduationCap,
  HeartPulse,
  IndianRupee,
  Printer,
  Shirt,
  ShoppingBag,
  TrainFront,
  Utensils,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { AccountId } from './db';

export interface CategoryDef {
  id: string;
  name: string;
  icon: LucideIcon;
  isIncome: boolean;
  /** Fixed chart hue slot (0-4). Only the five main hostel categories own a hue; the rest fold into "Other". */
  slot: number | null;
}

/**
 * Chart colours validated for dark mode (lightness band, chroma, colourblind separation).
 * Assigned by category, never by rank, so a filter never repaints a category.
 */
export const CHART_HUES = ['#68a817', '#3b8be0', '#c98022', '#8c68e0', '#d0507e'] as const;
export const OTHER_HUE = '#7b8272';

export const CATEGORIES: CategoryDef[] = [
  { id: 'mess', name: 'Mess', icon: Utensils, isIncome: false, slot: 0 },
  { id: 'recharge', name: 'Recharge', icon: Zap, isIncome: false, slot: 1 },
  { id: 'canteen', name: 'Canteen', icon: Coffee, isIncome: false, slot: 2 },
  { id: 'laundry', name: 'Laundry', icon: Shirt, isIncome: false, slot: 3 },
  { id: 'travel', name: 'Travel home', icon: TrainFront, isIncome: false, slot: 4 },
  { id: 'printouts', name: 'Printouts', icon: Printer, isIncome: false, slot: null },
  { id: 'books', name: 'Books', icon: BookOpen, isIncome: false, slot: null },
  { id: 'shopping', name: 'Shopping', icon: ShoppingBag, isIncome: false, slot: null },
  { id: 'health', name: 'Health', icon: HeartPulse, isIncome: false, slot: null },
  { id: 'fun', name: 'Fun', icon: Clapperboard, isIncome: false, slot: null },
  { id: 'other', name: 'Other', icon: Ellipsis, isIncome: false, slot: null },
  { id: 'allowance', name: 'Allowance', icon: IndianRupee, isIncome: true, slot: null },
  { id: 'stipend', name: 'Stipend', icon: GraduationCap, isIncome: true, slot: null },
  { id: 'other-income', name: 'Other income', icon: Banknote, isIncome: true, slot: null },
];

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export function category(id: string): CategoryDef {
  return BY_ID.get(id) ?? BY_ID.get('other')!;
}

export function hueFor(id: string): string {
  const slot = category(id).slot;
  return slot === null ? OTHER_HUE : CHART_HUES[slot]!;
}

export const EXPENSE_CATEGORIES = CATEGORIES.filter((c) => !c.isIncome);
export const INCOME_CATEGORIES = CATEGORIES.filter((c) => c.isIncome);

export const ACCOUNTS: { id: AccountId; name: string }[] = [
  { id: 'upi', name: 'UPI' },
  { id: 'cash', name: 'Cash' },
  { id: 'bank', name: 'Bank' },
  { id: 'wallet', name: 'Wallet' },
];

export function accountName(id: AccountId): string {
  return ACCOUNTS.find((a) => a.id === id)?.name ?? 'Cash';
}
