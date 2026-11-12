import { useState, type FormEvent } from 'react';
import { rupeesToPaise } from '@money-tracker/shared';
import { AppDialog, CategoryTile, Field, primaryAction } from '@/components/kit';
import { MoneyInput } from '@/components/MoneyInput';
import { Button } from '@/components/ui/button';
import { FilterPills } from '@/components/ui/filter-pills';
import { Input } from '@/components/ui/input';
import { ACCOUNTS, EXPENSE_CATEGORIES, INCOME_CATEGORIES, category } from '@/lib/categories';
import type { AccountId } from '@/lib/db';
import { pad, rupees } from '@/lib/format';
import { addTransaction, deleteTransaction } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

/** 20 crore paise = ₹2 crore. Mirrors the server schema cap. */
const MAX_PAISE = 2_000_000_000;

const remember = (key: string, fallback: string) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};
const save = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode: fine, we just forget the preference */
  }
};

function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const chip = (on: boolean) =>
  cn('rounded-full border px-4 py-2 text-sm transition-colors', on ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:bg-muted');

export function AddForm({ initialType, onDone }: { initialType: 'EXPENSE' | 'INCOME'; onDone: () => void }) {
  const toast = useToast();
  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState('');
  const [touched, setTouched] = useState(false);
  const [categoryId, setCategoryId] = useState(() => (initialType === 'INCOME' ? 'allowance' : remember('ww.lastCategory', 'canteen')));
  const [accountId, setAccountId] = useState<AccountId>(() => remember('ww.lastAccount', 'upi') as AccountId);
  const [when, setWhen] = useState(() => toLocalInput(new Date()));
  const [note, setNote] = useState('');

  const paise = rupeesToPaise(amount);
  const error =
    amount.trim() === ''
      ? 'Enter an amount'
      : paise === null || paise <= 0
        ? 'Use digits only, like 120 or 85.50'
        : paise > MAX_PAISE
          ? 'That is above the limit of ₹2,00,00,000'
          : '';
  const list = type === 'EXPENSE' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  function switchType(next: 'EXPENSE' | 'INCOME') {
    setType(next);
    setCategoryId(next === 'INCOME' ? 'allowance' : remember('ww.lastCategory', 'canteen'));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (error || paise === null) return;
    const id = await addTransaction({ type, amountPaise: paise, categoryId, accountId, occurredAt: new Date(when), note });
    if (type === 'EXPENSE') save('ww.lastCategory', categoryId);
    save('ww.lastAccount', accountId);
    onDone();
    toast(`${rupees(paise)} saved to ${category(categoryId).name}`, () => void deleteTransaction(id));
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <FilterPills
        pills={[
          { id: 'EXPENSE', label: 'Expense' },
          { id: 'INCOME', label: 'Income' },
        ]}
        value={type}
        onChange={(v) => switchType(v as 'EXPENSE' | 'INCOME')}
        className="w-full [&>button]:flex-1 [&>button]:justify-center"
      />

      <MoneyInput label="Amount" value={amount} onChange={setAmount} error={touched ? error : ''} autoFocus large />

      <fieldset>
        <legend className="mb-2 text-sm text-muted-foreground">Category</legend>
        <div className="grid grid-cols-4 gap-2">
          {list.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              aria-pressed={categoryId === c.id}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 text-xs transition-colors',
                categoryId === c.id ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              <CategoryTile id={c.id} size="sm" />
              <span className="w-full truncate text-center">{c.name}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm text-muted-foreground">Paid with</legend>
        <div className="flex flex-wrap gap-2">
          {ACCOUNTS.map((a) => (
            <button key={a.id} type="button" onClick={() => setAccountId(a.id)} aria-pressed={accountId === a.id} className={chip(accountId === a.id)}>
              {a.name}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="When">{(id) => <Input id={id} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="h-11 md:h-9" />}</Field>
        <Field label="Note (optional)">
          {(id) => <Input id={id} value={note} maxLength={140} onChange={(e) => setNote(e.target.value)} placeholder="Chai with friends" className="h-11 md:h-9" />}
        </Field>
      </div>

      <Button type="submit" className={primaryAction}>
        Save {type === 'EXPENSE' ? 'expense' : 'income'}
      </Button>
    </form>
  );
}

export function AddSheet({ open, type, onClose }: { open: boolean; type: 'EXPENSE' | 'INCOME'; onClose: () => void }) {
  return (
    <AppDialog open={open} onClose={onClose} title="Add transaction">
      <AddForm initialType={type} onDone={onClose} />
    </AppDialog>
  );
}
