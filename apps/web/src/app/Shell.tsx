import { useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { MobileTabBar } from '../components/Nav';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { Skeleton } from '@/components/ui/skeleton';
import { AddSheetContext } from '../lib/addSheet';
import { InstallProvider } from '../lib/install';
import { activeKey } from '../lib/nav';
import type { Snapshot } from '../lib/snapshot';
import { useSettings, useSnapshot } from '../lib/store';
import { hasSession } from '../lib/api';
import { startAutoSync, useSyncState } from '../lib/sync';
import { ToastProvider } from '../lib/toast';
import { AddSheet } from './AddSheet';

export const useSnap = () => useOutletContext<Snapshot>();

export function Shell() {
  const settings = useSettings();
  const snap = useSnapshot();
  const { pathname } = useLocation();
  const [add, setAdd] = useState<{ open: boolean; type: 'EXPENSE' | 'INCOME' }>({ open: false, type: 'EXPENSE' });
  const api = useMemo(() => ({ openAdd: (type: 'EXPENSE' | 'INCOME' = 'EXPENSE') => setAdd({ open: true, type }) }), []);

  // Keep this device and the server in step while the app is open.
  useEffect(() => startAutoSync(), []);
  const sync = useSyncState();
  // A signed in user on a new device has nothing local yet. Wait for the first sync instead of showing setup.
  const restoring =
    settings !== undefined && !settings.onboarded && hasSession() && sync.lastSyncAt === null && sync.phase !== 'offline' && sync.phase !== 'error';

  if (settings === undefined || snap === undefined || restoring) {
    return (
      <div className="flex h-dvh w-full bg-background">
        <Skeleton className="hidden h-full w-64 rounded-none md:block" />
        <div className="flex-1 space-y-4 p-4 md:p-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }
  if (!settings.onboarded) return <Navigate to="/welcome" replace />;

  return (
    <InstallProvider>
      <ToastProvider>
        <AddSheetContext.Provider value={api}>
          <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
            <Sidebar reviewCount={snap.review.length} name={snap.name} photo={snap.photo} onAdd={() => api.openAdd()} />
            <div className="flex min-w-0 flex-1 flex-col">
              <Topbar name={snap.name} photo={snap.photo} reviewCount={snap.review.length} transactions={snap.transactions} />
              <main className="flex-1 overflow-y-auto p-4 pb-32 md:p-8 md:pb-10">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
                  <Outlet context={snap} />
                </div>
              </main>
              <MobileTabBar active={activeKey(pathname)} onAdd={() => api.openAdd()} className="fixed inset-x-0 bottom-0 z-30 md:hidden" />
            </div>
          </div>
          <AddSheet open={add.open} type={add.type} onClose={() => setAdd((a) => ({ ...a, open: false }))} />
        </AddSheetContext.Provider>
      </ToastProvider>
    </InstallProvider>
  );
}
