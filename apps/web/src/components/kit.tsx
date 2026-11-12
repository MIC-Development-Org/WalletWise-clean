import { useId, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { category, hueFor } from '@/lib/categories';
import { cn } from '@/lib/utils';

/**
 * Small pieces shared by every dashboard page, built on the workspace components in components/ui,
 * so a field, a dialog or an empty state looks and behaves the same everywhere.
 */

/** Bottom sheet on phones, centred dialog on larger screens. Focus, Esc and scroll lock come from the dialog. */
export function AppDialog({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : <DialogDescription className="sr-only">{title}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm text-muted-foreground">
        {label}
      </label>
      {children(id)}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-muted-foreground/70">{hint}</p>
      )}
    </div>
  );
}

/** Touch friendly input height on phones, compact on desktop. */
export const inputSize = 'h-11 md:h-9';

/** A native select (best on phones) dressed like the workspace Input. */
export function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(
          'w-full appearance-none rounded-lg border border-input bg-transparent px-3 pr-9 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 md:text-sm dark:bg-input/30',
          inputSize,
          className,
        )}
      />
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export function CategoryTile({ id, size = 'md' }: { id: string; size?: 'sm' | 'md' | 'lg' }) {
  const c = category(id);
  const Icon = c.icon;
  const box = size === 'sm' ? 'h-8 w-8 rounded-md' : size === 'lg' ? 'h-12 w-12 rounded-xl' : 'h-10 w-10 rounded-lg';
  const tint = c.isIncome ? 'var(--primary)' : hueFor(id);
  return (
    <span
      aria-hidden="true"
      className={cn('grid shrink-0 place-items-center', box)}
      style={{ background: `color-mix(in oklab, ${tint} 16%, var(--muted))`, color: tint }}
    >
      <Icon size={size === 'sm' ? 15 : size === 'lg' ? 22 : 18} strokeWidth={2} />
    </span>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground">{icon}</span>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** The primary action in a form or dialog: full width and a real touch target on phones. */
export const primaryAction = 'h-11 w-full text-sm font-semibold md:h-10';
