import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { accountName, category } from '@/lib/categories';
import type { LocalTransaction } from '@/lib/db';
import { signedRupees, timeOf } from '@/lib/format';
import { cn } from '@/lib/utils';

const SOURCE: Record<LocalTransaction['source'], string | null> = { MANUAL: null, SMS: 'SMS', EMAIL: 'Email', SCAN: 'Scan' };

export const txnTitle = (t: LocalTransaction) => t.merchant || t.note || category(t.categoryId).name;

/** One transaction, the same everywhere: direction icon, title, details and signed amount. */
export function TxnRow({ t, onOpen, detail = 'time' }: { t: LocalTransaction; onOpen?: (t: LocalTransaction) => void; detail?: 'time' | 'date' }) {
  const credit = t.type === 'INCOME';
  const at = new Date(t.occurredAt);
  const source = SOURCE[t.source];
  const body = (
    <>
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', credit ? 'bg-primary/15 text-primary' : 'bg-muted')}>
        {credit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium">{txnTitle(t)}</p>
        <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          <span className="truncate">
            {detail === 'date' ? at.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : timeOf(at)} · {category(t.categoryId).name} · {accountName(t.accountId)}
          </span>
          {source && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {source}
            </Badge>
          )}
        </p>
      </div>
      <p className={cn('shrink-0 text-sm font-semibold tabular-nums', credit && 'text-primary')}>{signedRupees(t.amountPaise, t.type)}</p>
    </>
  );
  const cls = 'flex w-full items-center gap-3 px-4 py-3';
  return onOpen ? (
    <button type="button" onClick={() => onOpen(t)} className={cn(cls, 'transition-colors hover:bg-muted/50')} aria-label={`${txnTitle(t)}, ${signedRupees(t.amountPaise, t.type)}. Open details`}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}
