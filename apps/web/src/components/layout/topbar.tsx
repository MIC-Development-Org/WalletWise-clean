import { InstallButton } from '@/components/install-button';
import { SearchPalette } from '@/components/search-palette';
import { SyncBadge } from '@/components/SyncBadge';
import type { LocalTransaction } from '@/lib/db';
import { MobileNav } from './mobile-nav';

export function Topbar({ name, reviewCount, transactions }: { name: string; reviewCount: number; transactions: LocalTransaction[] }) {
  return (
    <header className="safe-top sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <MobileNav name={name} reviewCount={reviewCount} />
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <SearchPalette transactions={transactions} />
        <SyncBadge />
        <InstallButton />
      </div>
    </header>
  );
}
