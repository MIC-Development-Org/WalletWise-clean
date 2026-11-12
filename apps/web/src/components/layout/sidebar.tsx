import { Link, useLocation } from 'react-router-dom';
import { Menu, Plus, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/hooks/use-sidebar';
import { NAV, activeKey, isActive, type NavKey } from '@/lib/nav';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Account } from './account';

const row = (open: boolean) =>
  cn('flex items-center rounded-md transition-all duration-200', open ? 'gap-4 px-4 py-3 text-base font-medium' : 'justify-center p-3');

interface ViewProps {
  open: boolean;
  active: NavKey;
  reviewCount: number;
  name: string;
  onToggle?: () => void;
  onAdd: () => void;
  className?: string;
}

/**
 * The desktop rail. Presentational so the landing page can draw the same sidebar in its laptop preview.
 * Collapses to icons with tooltips, as in the workspace app.
 */
export function SidebarView({ open, active, reviewCount, name, onToggle, onAdd, className }: ViewProps) {
  return (
    <aside className={cn('flex h-full shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-300', open ? 'w-64' : 'w-16', className)}>
      <div className={cn('flex h-14 shrink-0 items-center border-b border-border', open ? 'justify-between px-4' : 'justify-center')}>
        {open && (
          <Link to="/app" aria-label="WalletWise home" className="flex min-w-0 items-center">
            <Logo className="h-7" />
          </Link>
        )}
        <Button variant="ghost" size="icon" onClick={onToggle} aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'} className="h-8 w-8 shrink-0 text-sidebar-foreground">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto py-4">
        <TooltipProvider delay={0}>
          <nav className="flex flex-col gap-1 px-2" aria-label="Primary">
            {NAV.map((item) => {
              const on = item.key === active;
              const link = (
                <Link
                  to={item.href}
                  aria-current={on ? 'page' : undefined}
                  className={cn(
                    'relative',
                    row(open),
                    on ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )}
                >
                  <item.icon className={cn('shrink-0', open ? 'h-5 w-5' : 'h-6 w-6', on && 'text-primary')} />
                  {open && <span className="flex-1">{item.label}</span>}
                  {item.key === 'review' && reviewCount > 0 && (
                    <span className={cn('rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground tabular-nums', !open && 'absolute top-1 right-1 px-1.5 text-[10px]')}>
                      {reviewCount}
                    </span>
                  )}
                </Link>
              );
              return open ? (
                <div key={item.href}>{link}</div>
              ) : (
                <Tooltip key={item.href}>
                  <TooltipTrigger render={link} />
                  <TooltipContent side="right" className="ml-2">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          <div className="flex flex-col gap-1 px-2 pt-3">
            {open ? (
              <Button onClick={onAdd} className="h-11 w-full gap-2 text-sm font-semibold">
                <Plus className="h-4 w-4" strokeWidth={2.6} /> Add transaction
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger render={<Button onClick={onAdd} aria-label="Add transaction" className="h-11 w-full" />}>
                  <Plus className="h-5 w-5" strokeWidth={2.6} />
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  Add transaction
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      </div>

      <div className="shrink-0 border-t border-border p-4">
        <Account name={name} compact={!open} />
      </div>
    </aside>
  );
}

export function Sidebar({ reviewCount, name, onAdd }: { reviewCount: number; name: string; onAdd: () => void }) {
  const { isOpen, toggle } = useSidebar();
  const { pathname } = useLocation();
  return (
    <SidebarView
      open={isOpen}
      active={activeKey(pathname)}
      reviewCount={reviewCount}
      name={name}
      onToggle={toggle}
      onAdd={onAdd}
      className="hidden md:flex"
    />
  );
}

export { isActive };
export const SettingsIcon = Settings;
