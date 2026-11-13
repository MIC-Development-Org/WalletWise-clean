import { useState } from 'react';
import { Check, Inbox, X } from 'lucide-react';
import { CategoryTile, EmptyState, NativeSelect } from '@/components/kit';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Panel } from '@/components/ui/panel';
import { accountName, EXPENSE_CATEGORIES } from '@/lib/categories';
import type { LocalTransaction } from '@/lib/db';
import { rupees, timeOf } from '@/lib/format';
import type { Snapshot } from '@/lib/snapshot';
import { acceptReview, deleteTransaction, restoreTransaction } from '@/lib/store';
import { useToast } from '@/lib/toast';

export function ReviewCard({ t }: { t: LocalTransaction }) {
  const toast = useToast();
  const [cat, setCat] = useState(t.categoryId === 'other' ? 'canteen' : t.categoryId);
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card p-4 @lg:p-5">
      <div className="flex items-start gap-3">
        <CategoryTile id={cat} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{t.merchant ?? 'Unknown merchant'}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            {accountName(t.accountId)} · {timeOf(new Date(t.occurredAt))}
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {t.source === 'SMS' ? 'SMS' : t.source === 'EMAIL' ? 'Email' : t.source === 'SCAN' ? 'Scan' : 'Added'}
            </Badge>
          </p>
        </div>
        <p className="text-lg font-semibold tabular-nums">{rupees(t.amountPaise)}</p>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">We could not tell what this was for, or it looks like a payment you already have. Pick a category, or reject it if it is not yours.</p>
      <label className="mt-3 block">
        <span className="sr-only">Category</span>
        <NativeSelect value={cat} onChange={(e) => setCat(e.target.value)}>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
      </label>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-11 md:h-9"
          onClick={() => {
            void deleteTransaction(t.id);
            toast('Capture rejected', () => void restoreTransaction(t.id));
          }}
        >
          <X /> Reject
        </Button>
        <Button className="h-11 md:h-9" onClick={() => void acceptReview(t.id, cat)}>
          <Check /> Confirm
        </Button>
      </div>
    </section>
  );
}

export function Review({ s }: { s: Snapshot }) {
  return (
    <div className="@container flex flex-col gap-6">
      <PageHeader
        eyebrow={s.review.length ? `${s.review.length} waiting` : 'All clear'}
        title="Review"
        description="Anything the app is unsure about waits here. It is not counted in your totals until you confirm it, and nothing is ever dropped."
      />
      {s.review.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<Inbox size={22} />}
            title="Nothing to review"
            body="Bank messages the app cannot read with confidence, and payments that look like duplicates, will wait here for you."
          />
        </Panel>
      ) : (
        <ul className="grid gap-4 @2xl:grid-cols-2">
          {s.review.map((t) => (
            <li key={t.id}>
              <ReviewCard t={t} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
