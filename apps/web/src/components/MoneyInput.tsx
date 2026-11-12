import { rupeesToPaise } from '@money-tracker/shared';
import { Field } from '@/components/kit';

const MAX_PAISE = 2_000_000_000;

export function parseAmount(text: string): { paise: number | null; error: string } {
  if (text.trim() === '') return { paise: null, error: 'Enter an amount' };
  const paise = rupeesToPaise(text);
  if (paise === null || paise <= 0) return { paise: null, error: 'Use digits only, like 500 or 85.50' };
  if (paise > MAX_PAISE) return { paise: null, error: 'That is above the limit of ₹2,00,00,000' };
  return { paise, error: '' };
}

export function MoneyInput({
  label,
  value,
  onChange,
  error,
  autoFocus,
  hint,
  large = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoFocus?: boolean;
  hint?: string;
  /** The big amount field at the top of the add sheet. */
  large?: boolean;
}) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(id) => (
        <div className="flex items-baseline gap-2 rounded-lg border border-input bg-transparent px-3 py-2.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
          <span className={large ? 'text-3xl text-muted-foreground' : 'text-xl text-muted-foreground'} aria-hidden="true">
            ₹
          </span>
          <input
            id={id}
            autoFocus={autoFocus}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={!!error}
            className={`w-full bg-transparent font-semibold tabular-nums outline-none placeholder:text-muted-foreground/50 ${large ? 'text-4xl tracking-tight' : 'text-2xl'}`}
          />
        </div>
      )}
    </Field>
  );
}
