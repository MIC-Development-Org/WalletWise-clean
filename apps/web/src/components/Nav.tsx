import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { NAV, type NavKey } from '@/lib/nav';
import { cn } from '@/lib/utils';

export type { NavKey };

const TAB_KEYS: NavKey[] = ['home', 'activity', 'budgets', 'more'];
const tab = (k: NavKey) => NAV.find((n) => n.key === k)!;

function TabLink({ k, active }: { k: NavKey; active: boolean }) {
  const item = tab(k);
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-14 flex-col items-center justify-center gap-1 text-[0.7rem] transition-colors',
        active ? 'text-primary' : 'text-muted-foreground/70 hover:text-muted-foreground',
      )}
    >
      <Icon size={22} strokeWidth={active ? 2.4 : 1.9} />
      {k === 'budgets' ? 'Budgets' : item.label}
    </Link>
  );
}

/** Phone bottom bar. The centre + is the primary action, reachable with one thumb. */
export function MobileTabBar({ active, onAdd, className = '' }: { active: NavKey; onAdd: () => void; className?: string }) {
  const [home, activity, budgets, more] = TAB_KEYS;
  return (
    <nav
      aria-label="Primary"
      className={cn('grid grid-cols-5 items-end border-t border-border bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl', className)}
    >
      <TabLink k={home!} active={active === home} />
      <TabLink k={activity!} active={active === activity} />
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onAdd}
          aria-label="Add transaction"
          className="-mt-5 mb-1 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_rgb(214_255_102/0.5)] transition-transform active:scale-95"
        >
          <Plus size={26} strokeWidth={2.6} />
        </button>
      </div>
      <TabLink k={budgets!} active={active === budgets} />
      <TabLink k={more!} active={active === more} />
    </nav>
  );
}
