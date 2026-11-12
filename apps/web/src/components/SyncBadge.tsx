import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { AlertTriangle, Cloud, CloudCheck, CloudOff, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { countPending } from '@/lib/db';
import { syncNow, useSyncState } from '@/lib/sync';

/** Where your data lives right now: this device only, syncing, up to date, offline, or in trouble. */
export function SyncBadge() {
  const { phase, lastSyncAt, error } = useSyncState();
  const pending = useLiveQuery(countPending, [], 0) ?? 0;

  if (phase === 'signed-out') {
    return (
      <Button variant="outline" render={<Link to="/login" />} title="Your data is only on this device. Sign in to back it up and use it everywhere.">
        <CloudOff className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Local only</span>
      </Button>
    );
  }

  const label =
    phase === 'syncing'
      ? 'Syncing'
      : phase === 'offline'
        ? pending
          ? `Offline · ${pending} waiting`
          : 'Offline'
        : phase === 'error'
          ? 'Sync problem'
          : pending
            ? `${pending} waiting`
            : 'Synced';
  const title =
    phase === 'error'
      ? `Could not sync: ${error}. Click to try again.`
      : phase === 'offline'
        ? 'You are offline. Changes are saved here and will sync when you are back.'
        : lastSyncAt
          ? `Last synced ${new Date(lastSyncAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`
          : 'Sync';
  const Icon = phase === 'syncing' ? LoaderCircle : phase === 'offline' ? CloudOff : phase === 'error' ? AlertTriangle : pending ? Cloud : CloudCheck;

  return (
    <Button variant="outline" onClick={() => void syncNow()} title={title} aria-label={`${label}. ${title}`} disabled={phase === 'syncing'}>
      <Icon className={`h-3.5 w-3.5 ${phase === 'syncing' ? 'animate-spin' : phase === 'error' ? 'text-destructive' : ''}`} />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
