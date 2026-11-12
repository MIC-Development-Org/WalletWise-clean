/**
 * Built-in hostel categories. The ids are stable slugs, used by the apps, the database seed and the
 * API alike, so a transaction recorded offline keeps its category after it syncs.
 */
export interface BuiltinCategory {
  id: string;
  name: string;
  icon: string;
  isIncome: boolean;
}

export const BUILTIN_CATEGORIES: readonly BuiltinCategory[] = [
  { id: 'mess', name: 'Mess', icon: 'utensils', isIncome: false },
  { id: 'recharge', name: 'Recharge', icon: 'zap', isIncome: false },
  { id: 'canteen', name: 'Canteen', icon: 'coffee', isIncome: false },
  { id: 'laundry', name: 'Laundry', icon: 'shirt', isIncome: false },
  { id: 'travel', name: 'Travel home', icon: 'train-front', isIncome: false },
  { id: 'printouts', name: 'Printouts', icon: 'printer', isIncome: false },
  { id: 'books', name: 'Books', icon: 'book-open', isIncome: false },
  { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', isIncome: false },
  { id: 'health', name: 'Health', icon: 'heart-pulse', isIncome: false },
  { id: 'fun', name: 'Fun', icon: 'clapperboard', isIncome: false },
  { id: 'other', name: 'Other', icon: 'ellipsis', isIncome: false },
  { id: 'allowance', name: 'Allowance', icon: 'indian-rupee', isIncome: true },
  { id: 'stipend', name: 'Stipend', icon: 'graduation-cap', isIncome: true },
  { id: 'other-income', name: 'Other income', icon: 'banknote', isIncome: true },
] as const;
