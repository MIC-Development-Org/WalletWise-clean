import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV, isActive } from '@/lib/nav';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Account } from './account';

/** Phone menu: the hamburger in the top bar opens a sheet with every page and your account. */
export function MobileNav({ name, photo, reviewCount }: { name: string; photo?: string | null; reviewCount: number }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const link = (active: boolean) =>
    cn('flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors', active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent/60');

  return (
    <>
      <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setOpen(true)} aria-label="Open menu" data-mobile-tap-target>
        <Menu className="h-5 w-5" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <Logo className="h-7" />
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-2" aria-label="Menu">
            {NAV.map((item) => (
              <Link key={item.href} to={item.href} onClick={() => setOpen(false)} className={link(isActive(pathname, item.href))}>
                <item.icon className="h-[18px] w-[18px]" />
                <span className="flex-1">{item.label}</span>
                {item.key === 'review' && reviewCount > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground tabular-nums">{reviewCount}</span>
                )}
              </Link>
            ))}
          </nav>
          <div className="mt-auto border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Account name={name} photo={photo} onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
