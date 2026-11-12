import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, CornerDownLeft, Search, type LucideIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { category } from '@/lib/categories';
import type { LocalTransaction } from '@/lib/db';
import { rupees } from '@/lib/format';
import { NAV } from '@/lib/nav';
import { cn } from '@/lib/utils';

type Hit = { key: string; group: string; title: string; sub?: string; href: string; icon: LucideIcon };

/** Ctrl/Cmd+K (or "/") searches pages and every transaction on this device. */
export function SearchPalette({ transactions }: { transactions: LocalTransaction[] }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === '/' && !typing) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) {
      setQ('');
      setActive(0);
    }
  }, [open]);

  const hits: Hit[] = useMemo(() => {
    const term = q.trim().toLowerCase();
    const out: Hit[] = [];
    NAV.filter((n) => !term || n.label.toLowerCase().includes(term))
      .slice(0, term ? 3 : 5)
      .forEach((n) => out.push({ key: `p${n.href}`, group: term ? 'Pages' : 'Go to', title: n.label, sub: n.desc, href: n.href, icon: n.icon }));
    if (term.length >= 2) {
      transactions
        .filter((t) => [t.merchant ?? '', t.note, category(t.categoryId).name].some((x) => x.toLowerCase().includes(term)))
        .slice(0, 8)
        .forEach((t) =>
          out.push({
            key: `t${t.id}`,
            group: 'Transactions',
            title: t.merchant || t.note || category(t.categoryId).name,
            sub: `${new Date(t.occurredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${category(t.categoryId).name} · ${t.type === 'INCOME' ? '+' : '-'}${rupees(t.amountPaise)}`,
            href: `/app/activity?q=${encodeURIComponent(t.merchant || t.note || category(t.categoryId).name)}`,
            icon: t.type === 'INCOME' ? ArrowDownLeft : ArrowUpRight,
          }),
        );
    }
    return out;
  }, [q, transactions]);

  const go = useCallback(
    (h: Hit) => {
      setOpen(false);
      navigate(h.href);
    },
    [navigate],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && hits[active]) {
      e.preventDefault();
      go(hits[active]!);
    }
  };

  let lastGroup = '';
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        data-mobile-tap-target
        className="flex h-8 items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:w-56"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden flex-1 text-left sm:block">Search…</span>
        <kbd className="hidden rounded border border-border px-1.5 text-[10px] font-medium sm:block">Ctrl K</kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="top-[12%] max-h-[76dvh] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl max-sm:top-0 max-sm:max-h-dvh max-sm:rounded-none">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <DialogDescription className="sr-only">Search pages and transactions</DialogDescription>
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search pages and transactions…"
              aria-label="Search"
              className="h-12 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm"
            />
          </div>
          <div className="max-h-[56dvh] overflow-y-auto p-2" role="listbox">
            {hits.map((h, i) => {
              const header = h.group !== lastGroup;
              lastGroup = h.group;
              return (
                <div key={h.key}>
                  {header && <p className="px-2 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{h.group}</p>}
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    onMouseMove={() => setActive(i)}
                    onClick={() => go(h)}
                    className={cn('flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left', i === active ? 'bg-muted' : 'hover:bg-muted/60')}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                      <h.icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{h.title}</span>
                      {h.sub && <span className="block truncate text-xs text-muted-foreground">{h.sub}</span>}
                    </span>
                    {i === active && <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                </div>
              );
            })}
            {q.trim().length >= 2 && hits.every((h) => h.group !== 'Transactions') && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">No transactions match “{q.trim()}”.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
