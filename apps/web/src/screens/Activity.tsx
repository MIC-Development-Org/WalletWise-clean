import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Receipt, Search } from 'lucide-react';
import { AppDialog, CategoryTile, EmptyState, primaryAction } from '@/components/kit';
import { TxnRow, txnTitle } from '@/components/TxnRow';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FilterPills } from '@/components/ui/filter-pills';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Panel } from '@/components/ui/panel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAddSheet } from '@/lib/addSheet';
import { accountName, category, EXPENSE_CATEGORIES } from '@/lib/categories';
import type { LocalTransaction } from '@/lib/db';
import { dayKey, dayLabel, rupees, signedRupees } from '@/lib/format';
import type { Snapshot } from '@/lib/snapshot';
import { deleteTransaction, restoreTransaction } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

type Kind = 'all' | 'EXPENSE' | 'INCOME';
const PAGE = 60;

const SOURCE_NAME: Record<LocalTransaction['source'], string> = { MANUAL: 'Added by you', SMS: 'Bank SMS', EMAIL: 'Bank email', SCAN: 'Bill scan' };

function Detail({ t, onClose }: { t: LocalTransaction | null; onClose: () => void }) {
  const toast = useToast();
  return (
    <AppDialog open={!!t} onClose={onClose} title="Transaction">
      {t && (
        <div className="space-y-5">
          <div className="flex flex-col items-center text-center">
            <CategoryTile id={t.categoryId} size="lg" />
            <p className={cn('mt-4 text-4xl font-semibold tabular-nums', t.type === 'INCOME' && 'text-primary')}>{signedRupees(t.amountPaise, t.type)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{txnTitle(t)}</p>
          </div>
          <dl className="divide-y divide-border rounded-xl border border-border">
            {[
              ['Category', category(t.categoryId).name],
              ['Paid with', accountName(t.accountId)],
              ['When', new Date(t.occurredAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })],
              ['Source', SOURCE_NAME[t.source]],
              ...(t.note ? [['Note', t.note]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-6 px-4 py-3 text-sm">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
          <Button
            variant="destructive"
            className={primaryAction}
            onClick={() => {
              const id = t.id;
              void deleteTransaction(id);
              onClose();
              toast('Transaction deleted', () => void restoreTransaction(id));
            }}
          >
            Delete transaction
          </Button>
        </div>
      )}
    </AppDialog>
  );
}

export function Activity({ s }: { s: Snapshot }) {
  const { openAdd } = useAddSheet();
  const [params] = useSearchParams();
  // The search palette links here with ?q= so a result opens already filtered.
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [kind, setKind] = useState<Kind>('all');
  const [cat, setCat] = useState('all');
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState<LocalTransaction | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return s.transactions.filter((t) => {
      if (kind !== 'all' && t.type !== kind) return false;
      if (cat !== 'all' && t.categoryId !== cat) return false;
      if (!q) return true;
      return [t.merchant ?? '', t.note, category(t.categoryId).name].some((x) => x.toLowerCase().includes(q));
    });
  }, [s.transactions, query, kind, cat]);

  const spent = filtered.filter((t) => t.type === 'EXPENSE').reduce((a, t) => a + t.amountPaise, 0);
  const shown = filtered.slice(0, limit);
  const filtering = query !== '' || kind !== 'all' || cat !== 'all';

  const groups = useMemo(() => {
    const m = new Map<string, LocalTransaction[]>();
    for (const t of shown) {
      const k = dayKey(new Date(t.occurredAt));
      (m.get(k) ?? m.set(k, []).get(k)!).push(t);
    }
    return [...m];
  }, [shown]);

  return (
    <div className="@container flex flex-col gap-6">
      <PageHeader
        eyebrow={`${s.transactions.length} transaction${s.transactions.length === 1 ? '' : 's'}`}
        title="Activity"
        description="Everything you have spent or received, searchable."
        actions={
          <Button onClick={() => openAdd()} className="h-9 gap-1.5 px-3.5">
            <Plus className="h-4 w-4" /> Add transaction
          </Button>
        }
      />

      <div className="flex flex-col gap-3 @3xl:flex-row @3xl:items-center">
        <label className="relative block flex-1">
          <span className="sr-only">Search transactions</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
            placeholder="Search by merchant, note or category"
            className="h-11 pl-9 md:h-9"
          />
        </label>
        <FilterPills
          pills={[
            { id: 'all', label: 'All' },
            { id: 'EXPENSE', label: 'Spending' },
            { id: 'INCOME', label: 'Income' },
          ]}
          value={kind}
          onChange={(v) => setKind(v as Kind)}
        />
      </div>

      <FilterPills
        pills={[{ id: 'all', label: 'All categories' }, ...EXPENSE_CATEGORIES.map((c) => ({ id: c.id, label: c.name }))]}
        value={cat}
        onChange={setCat}
      />

      <Panel>
        {filtered.length === 0 ? (
          filtering ? (
            <EmptyState
              icon={<Search size={22} />}
              title="No matches"
              body="Try a different word or clear the filters."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery('');
                    setKind('all');
                    setCat('all');
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<Receipt size={22} />}
              title="Nothing here yet"
              body="Add what you spend and it shows up here the moment you save it. It takes about ten seconds."
              action={<Button onClick={() => openAdd()}>Add your first</Button>}
            />
          )
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-border px-4 py-3 text-xs text-muted-foreground">
              <span>
                {filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}
              </span>
              {spent > 0 && <span className="tabular-nums">{rupees(spent)} spent</span>}
            </div>

            {/* Wide screens: a table. Phones: the same rows as the dashboard, grouped by day. */}
            <div className="hidden @3xl:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-4">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Paid with</TableHead>
                    <TableHead className="px-4 text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shown.map((t) => (
                    <TableRow key={t.id} onClick={() => setOpen(t)} className="cursor-pointer">
                      <TableCell className="px-4 text-muted-foreground">{new Date(t.occurredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          {txnTitle(t)}
                          {t.source !== 'MANUAL' && (
                            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                              {SOURCE_NAME[t.source].replace('Bank ', '')}
                            </Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{category(t.categoryId).name}</TableCell>
                      <TableCell className="text-muted-foreground">{accountName(t.accountId)}</TableCell>
                      <TableCell className={cn('px-4 text-right font-semibold tabular-nums', t.type === 'INCOME' && 'text-primary')}>{signedRupees(t.amountPaise, t.type)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="@3xl:hidden">
              {groups.map(([key, list]) => (
                <section key={key} aria-label={dayLabel(key, s.now)}>
                  <h3 className="bg-muted/40 px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">{dayLabel(key, s.now)}</h3>
                  <ul className="divide-y divide-border">
                    {list.map((t) => (
                      <li key={t.id}>
                        <TxnRow t={t} onOpen={setOpen} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            {filtered.length > shown.length && (
              <div className="flex justify-center border-t border-border p-4">
                <Button variant="outline" onClick={() => setLimit((l) => l + PAGE)}>
                  Show more
                </Button>
              </div>
            )}
          </>
        )}
      </Panel>

      <Detail t={open} onClose={() => setOpen(null)} />
    </div>
  );
}
