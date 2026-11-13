import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight, Cloud, Download, FlaskConical, Inbox, LogOut, Smartphone, Trash2, UserX, Wallet } from 'lucide-react';
import { AppDialog, Field, NativeSelect, primaryAction } from '@/components/kit';
import { MoneyInput, parseAmount } from '@/components/MoneyInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Panel } from '@/components/ui/panel';
import { hasSession } from '@/lib/api';
import { countPending, getMeta } from '@/lib/db';
import { useInstall } from '@/lib/install';
import { rupees } from '@/lib/format';
import type { Snapshot } from '@/lib/snapshot';
import { deleteAccount, signOut, syncNow, useSyncState } from '@/lib/sync';
import { eraseAll, exportCsv, loadSample, updateAllowance } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

function Row({ icon, title, sub, onClick, to, tone }: { icon: ReactNode; title: string; sub?: string; onClick?: () => void; to?: string; tone?: 'danger' }) {
  const cls = cn('flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-muted/50', tone === 'danger' && 'text-destructive');
  const inner = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        {sub && <span className="mt-0.5 block text-xs text-muted-foreground">{sub}</span>}
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </>
  );
  return to ? (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

function AllowanceDialog({ s, onClose }: { s: Snapshot; onClose: () => void }) {
  const [amount, setAmount] = useState(String(s.allowancePaise / 100));
  const [day, setDay] = useState(String(Math.min(28, s.cycle.start.getDate())));
  const [touched, setTouched] = useState(false);
  const parsed = parseAmount(amount);
  return (
    <AppDialog open onClose={onClose} title="Allowance and cycle" description="Your budget cycle restarts on the day your allowance lands.">
      <form
        noValidate
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setTouched(true);
          if (parsed.paise === null) return;
          await updateAllowance({ name: s.name, allowancePaise: parsed.paise, cycleStartDay: Number(day) });
          onClose();
        }}
      >
        <MoneyInput label="Monthly allowance" value={amount} onChange={setAmount} error={touched ? parsed.error : ''} />
        <Field label="Allowance lands on day">
          {(id) => (
            <NativeSelect id={id} value={day} onChange={(e) => setDay(e.target.value)}>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>
        <Button type="submit" className={primaryAction}>
          Save
        </Button>
      </form>
    </AppDialog>
  );
}

function InstallDialog({ onClose }: { onClose: () => void }) {
  const items = [
    ['iPhone and iPad', 'Open this page in Safari, tap Share, then Add to Home Screen. Notifications only work from the Home Screen app.'],
    ['Mac', 'In Safari, use File, then Add to Dock. In Chrome or Edge, use the install icon in the address bar.'],
    ['Android', 'Use the browser menu, then Install app. For SMS capture, install the APK from the download page and allow restricted settings once on Android 13 and later.'],
    ['Windows and Linux', 'In Chrome or Edge, use the install icon in the address bar.'],
  ];
  return (
    <AppDialog open onClose={onClose} title="Install WalletWise" description="It opens in its own window like any other app and works offline.">
      <div className="space-y-3">
        {items.map(([t, b]) => (
          <div key={t} className="rounded-xl border border-border p-4">
            <p className="text-sm font-medium">{t}</p>
            <p className="mt-1.5 text-sm text-muted-foreground">{b}</p>
          </div>
        ))}
      </div>
    </AppDialog>
  );
}

function ConfirmDialog({ title, body, confirm, danger, busy, error, children, onConfirm, onClose }: {
  title: string; body: string; confirm: string; danger?: boolean; busy?: boolean; error?: string; children?: ReactNode; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <AppDialog open onClose={onClose} title={title} description={body}>
      <div className="space-y-4">
        {children}
        {error && (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-11 md:h-9" autoFocus onClick={onClose}>
            Cancel
          </Button>
          <Button variant={danger ? 'destructive' : 'default'} className="h-11 md:h-9" disabled={busy} onClick={onConfirm}>
            {confirm}
          </Button>
        </div>
      </div>
    </AppDialog>
  );
}

export function More({ s }: { s: Snapshot }) {
  const toast = useToast();
  const nav = useNavigate();
  const { install } = useInstall();
  const sync = useSyncState();
  const account = useLiveQuery(() => getMeta<{ email: string; name: string }>('account'), []);
  const pending = useLiveQuery(countPending, [], 0) ?? 0;
  const signedIn = hasSession();
  const [dialog, setDialog] = useState<'allowance' | 'install' | 'erase' | 'signout' | 'delete' | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const close = () => {
    setDialog(null);
    setPassword('');
    setError('');
  };

  async function download() {
    const csv = await exportCsv();
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `walletwise-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Exported your transactions');
  }

  return (
    <div className="@container flex max-w-3xl flex-col gap-6">
      <PageHeader eyebrow="Settings" title="More" description="Your account, your data and how the app works for you." />

      <Panel title="Account">
        {signedIn ? (
          <div className="flex flex-col gap-4 p-4 @lg:flex-row @lg:items-center @lg:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{account?.email ?? 'Signed in'}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {sync.phase === 'syncing'
                  ? 'Syncing now…'
                  : sync.phase === 'offline'
                    ? `Offline. ${pending} change${pending === 1 ? '' : 's'} will sync when you are back.`
                    : sync.phase === 'error'
                      ? `Could not sync: ${sync.error}`
                      : pending
                        ? `${pending} change${pending === 1 ? '' : 's'} waiting to sync`
                        : sync.lastSyncAt
                          ? `Everything is backed up. Last synced ${new Date(sync.lastSyncAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}.`
                          : 'Signed in'}
                {sync.refused > 0 && ` ${sync.refused} entr${sync.refused === 1 ? 'y was' : 'ies were'} refused by the server.`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void syncNow()} disabled={sync.phase === 'syncing'}>
                <Cloud /> Sync now
              </Button>
              <Button variant="outline" onClick={() => setDialog('signout')}>
                <LogOut /> Sign out
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4 @lg:flex-row @lg:items-center @lg:justify-between">
            <div>
              <p className="text-sm font-medium">Your data is only on this device</p>
              <p className="mt-0.5 max-w-md text-xs text-muted-foreground">Sign in to back it up and use the same wallet on your phone and laptop. Everything you have added so far comes with you.</p>
            </div>
            <div className="flex gap-2">
              <Button render={<Link to="/login?mode=register" />}>Create account</Button>
              <Button variant="outline" render={<Link to="/login" />}>
                Sign in
              </Button>
            </div>
          </div>
        )}
      </Panel>

      <Panel>
        <ul className="divide-y divide-border">
          <li>
            <Row icon={<Wallet className="h-4 w-4 text-primary" />} title="Allowance and cycle" sub={`${rupees(s.allowancePaise)} a month, resets on day ${s.cycle.start.getDate()}`} onClick={() => setDialog('allowance')} />
          </li>
          <li>
            <Row icon={<Inbox className="h-4 w-4" />} title="Review list" sub={s.review.length ? `${s.review.length} waiting` : 'Nothing waiting'} to="/app/review" />
          </li>
          <li>
            <Row icon={<Download className="h-4 w-4" />} title="Export as CSV" sub="Opens in Excel or Google Sheets" onClick={download} />
          </li>
          <li>
            <Row icon={<Smartphone className="h-4 w-4" />} title="Install the app" sub="iPhone, Mac, Android and Windows" onClick={install} />
          </li>
        </ul>
      </Panel>

      <Panel title="Data">
        <ul className="divide-y divide-border">
          <li>
            <Row
              icon={<FlaskConical className="h-4 w-4" />}
              title="Fill with sample data"
              sub="See the app with a month of example spending"
              onClick={async () => {
                await loadSample();
                toast('Sample data added');
              }}
            />
          </li>
          <li>
            {signedIn ? (
              <Row icon={<UserX className="h-4 w-4" />} title="Delete account" sub="Removes your account and all of your data everywhere" tone="danger" onClick={() => setDialog('delete')} />
            ) : (
              <Row icon={<Trash2 className="h-4 w-4" />} title="Erase all data" sub="Removes everything stored on this device" tone="danger" onClick={() => setDialog('erase')} />
            )}
          </li>
        </ul>
      </Panel>

      <p className="text-center text-xs text-muted-foreground">WalletWise 0.1 · Team G, Microsoft Innovations Club, VIT Chennai</p>

      {dialog === 'allowance' && <AllowanceDialog s={s} onClose={close} />}
      {dialog === 'install' && <InstallDialog onClose={close} />}
      {dialog === 'erase' && (
        <ConfirmDialog
          title="Erase everything?"
          body="This removes every transaction, budget, goal and setting stored on this device. It cannot be undone."
          confirm="Erase all"
          danger
          onClose={close}
          onConfirm={async () => {
            await eraseAll();
            close();
          }}
        />
      )}
      {dialog === 'signout' && (
        <ConfirmDialog
          title="Sign out?"
          body="Your data is safe on your account. It is removed from this device so the next person to use it does not see it."
          confirm="Sign out"
          busy={busy}
          error={error}
          onClose={close}
          onConfirm={async () => {
            setBusy(true);
            const r = await signOut();
            setBusy(false);
            if (r.ok) nav('/', { replace: true });
            else setError(`${r.unsynced} change${r.unsynced === 1 ? ' has' : 's have'} not synced yet. Connect to the internet and try again, so nothing is lost.`);
          }}
        />
      )}
      {dialog === 'delete' && (
        <ConfirmDialog
          title="Delete your account?"
          body="This permanently removes your account and every transaction, budget and goal, on all your devices. It cannot be undone."
          confirm="Delete everything"
          danger
          busy={busy}
          error={error}
          onClose={close}
          onConfirm={async () => {
            if (!password) return setError('Enter your password to confirm.');
            setBusy(true);
            try {
              await deleteAccount(password);
              nav('/', { replace: true });
            } catch (e) {
              setError((e as Error).message === 'invalid_credentials' ? 'That password is not right.' : 'Could not delete the account. Check your connection and try again.');
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Confirm with your password">
            {(id) => <Input id={id} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 md:h-9" />}
          </Field>
        </ConfirmDialog>
      )}
    </div>
  );
}
