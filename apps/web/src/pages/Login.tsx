import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Cloud, ShieldCheck, WifiOff } from 'lucide-react';
import { Field, primaryAction } from '@/components/kit';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, setSession } from '@/lib/api';
import { syncNow } from '@/lib/sync';

const MESSAGES: Record<string, string> = {
  invalid_credentials: 'That email and password do not match.',
  email_taken: 'An account with that email already exists. Try signing in.',
  invalid_request: 'Check your details. The password needs at least 10 characters.',
  unauthorized: 'That email and password do not match.',
};

/** Optional. The app works fully without an account. Signing in backs your data up and shares it between your devices. */
export function Login() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>(params.get('mode') === 'register' ? 'register' : 'login');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const f = new FormData(e.currentTarget);
    try {
      const tokens = await api<{ accessToken: string; refreshToken: string }>(`/api/v1/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(f)),
      });
      setSession(tokens);
      // Pull this account's data (or send this device's data up) before landing on the dashboard.
      await syncNow();
      nav('/app', { replace: true });
    } catch (err) {
      const code = (err as Error).message;
      setError(MESSAGES[code] ?? 'Could not reach the server. Your data is safe on this device. Try again in a bit.');
    } finally {
      setBusy(false);
    }
  }

  const points = [
    [Cloud, 'Back up your data and use the same wallet on every device'],
    [WifiOff, 'Keeps working offline, and syncs when you are back'],
    [ShieldCheck, 'Your bank messages are read on your phone and never uploaded'],
  ] as const;

  return (
    <div className="min-h-dvh bg-background text-foreground lg:grid lg:grid-cols-2">
      <aside className="hidden flex-col justify-between border-r border-border bg-card p-12 lg:flex">
        <Logo className="h-9" />
        <div>
          <h2 className="max-w-md text-4xl leading-tight font-medium text-balance">Your wallet, safe and in sync.</h2>
          <ul className="mt-8 space-y-4">
            {points.map(([Icon, text]) => (
              <li key={text} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="pt-1">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">Team G, Microsoft Innovations Club, VIT Chennai</p>
      </aside>

      <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5 py-10">
        <Link to="/app" aria-label="Back to the app" className="mb-10 lg:hidden">
          <Logo />
        </Link>
        <h1 className="text-3xl font-medium tracking-tight">{mode === 'login' ? 'Sign in' : 'Create your account'}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === 'login' ? 'Welcome back. Your data will be here on every device.' : 'Everything you have added on this device comes with you.'}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          {mode === 'register' && (
            <Field label="Name">{(id) => <Input id={id} name="name" required maxLength={60} autoComplete="name" className="h-11" />}</Field>
          )}
          <Field label="Email">{(id) => <Input id={id} name="email" type="email" required autoComplete="email" className="h-11" />}</Field>
          <Field label="Password" hint={mode === 'register' ? 'At least 10 characters.' : undefined}>
            {(id) => (
              <Input id={id} name="password" type="password" required minLength={10} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="h-11" />
            )}
          </Field>
          {error && (
            <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy} className={primaryAction}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <button
          type="button"
          className="mt-6 text-left text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
          }}
        >
          {mode === 'login' ? 'New here? Create an account' : 'Have an account? Sign in'}
        </button>
        <Link to="/app" className="mt-3 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          Continue without an account
        </Link>
      </main>
    </div>
  );
}
