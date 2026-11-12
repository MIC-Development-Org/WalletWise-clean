import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { ArrowLeft, ArrowRight, Check, Mail, MessageSquareText, PenLine } from 'lucide-react';
import { Field, NativeSelect, primaryAction } from '@/components/kit';
import { Logo } from '@/components/Logo';
import { MoneyInput, parseAmount } from '@/components/MoneyInput';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { hasSession } from '@/lib/api';
import { cycleFor, safeToSpend } from '@/lib/cycle';
import { addDays, rupees, shortDate } from '@/lib/format';
import { completeOnboarding, loadSample, useSettings } from '@/lib/store';
import { syncNow } from '@/lib/sync';
import { cn } from '@/lib/utils';

const PRESETS = [3000, 5000, 8000, 10000];
const DAYS = [1, 5, 7, 10, 15, 20, 25];
const STEPS = 5;

function Capture({ android }: { android: boolean }) {
  const rows = [
    { icon: PenLine, title: 'Quick add', body: 'Type an amount and tap a category. About ten seconds, and it works offline.', status: 'Ready', ok: true },
    {
      icon: MessageSquareText,
      title: 'Bank SMS',
      body: android
        ? 'Read on your phone, never uploaded. You can turn this on from More after setup.'
        : 'Only the Android app can read SMS, because iOS does not allow it. iPhone and web use quick add and email.',
      status: android ? 'Set up later' : 'Android only',
      ok: false,
    },
    { icon: Mail, title: 'Bank emails', body: 'Connect Gmail so bank alerts are picked up for you, on every device.', status: 'Coming soon', ok: false },
  ];
  return (
    <ul className="space-y-3">
      {rows.map(({ icon: Icon, title, body, status, ok }) => (
        <li key={title} className="flex gap-4 rounded-xl border border-border bg-card p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className={cn('h-[18px] w-[18px]', ok ? 'text-primary' : 'text-muted-foreground')} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{title}</span>
              <Badge variant={ok ? 'default' : 'secondary'}>{status}</Badge>
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">{body}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Onboarding() {
  const settings = useSettings();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [day, setDay] = useState(1);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const primary = useRef<HTMLButtonElement>(null);
  const parsed = parseAmount(amount);

  // Steps 0 and 1 focus their field. The rest focus the main button, so Enter always moves on.
  useEffect(() => {
    if (step >= 2) primary.current?.focus();
  }, [step]);

  if (settings?.onboarded) return <Navigate to="/app" replace />;

  const now = new Date();
  const cycle = cycleFor(now, day);
  const perDay = parsed.paise ? safeToSpend(parsed.paise, 0, cycle.daysLeft) : 0;
  const android = Capacitor.getPlatform() === 'android';

  async function finish(withSample: boolean) {
    if (parsed.paise === null || busy) return;
    setBusy(true);
    await completeOnboarding({ name, allowancePaise: parsed.paise, cycleStartDay: day });
    if (withSample) await loadSample();
    if (hasSession()) void syncNow();
    nav('/app', { replace: true });
  }

  function next(e?: FormEvent) {
    e?.preventDefault();
    if (step === 1) {
      setTouched(true);
      if (parsed.paise === null) return;
    }
    setStep((s) => Math.min(STEPS - 1, s + 1));
  }

  const titles = [
    'Let’s set up your wallet',
    'How much is your monthly allowance?',
    'Which day does it arrive?',
    'How entries get in',
    perDay ? `You can spend ${rupees(Math.floor(perDay / 100) * 100)} a day` : 'You are all set',
  ];

  return (
    <div className="min-h-dvh bg-background text-foreground lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <aside className="relative hidden overflow-hidden border-r border-border bg-card lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-[110px]" aria-hidden="true" />
        <Logo className="h-10" />
        <div className="relative">
          <p className="max-w-md text-5xl leading-[1.08] font-medium tracking-tight text-balance">
            Know what you can spend <span className="text-primary">today</span>.
          </p>
          <p className="mt-5 max-w-sm text-muted-foreground">Tell us your allowance and the day it lands. We work out the rest, and keep it on your device until you choose to sign in.</p>
        </div>
        <p className="relative text-xs text-muted-foreground">Team G, Microsoft Innovations Club, VIT Chennai</p>
      </aside>

      <main className="flex min-h-dvh flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:min-h-0 lg:items-center lg:justify-center lg:px-12">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col lg:flex-none">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Logo className="h-8" />
            <Link to="/login" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              I have an account
            </Link>
          </div>

          <div className="mb-8 flex items-center gap-3">
            {step > 0 && (
              <Button variant="outline" size="icon" onClick={() => setStep((s) => s - 1)} aria-label="Back" className="h-10 w-10 shrink-0 rounded-full">
                <ArrowLeft />
              </Button>
            )}
            <div role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step + 1} className="flex flex-1 gap-1.5">
              {Array.from({ length: STEPS }, (_, i) => (
                <span key={i} className={cn('h-1 flex-1 rounded-full transition-colors', i <= step ? 'bg-primary' : 'bg-muted')} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {step + 1}/{STEPS}
            </span>
          </div>

          <form onSubmit={next} noValidate className="flex flex-1 flex-col">
            <h1 aria-live="polite" className="text-[1.9rem] leading-tight font-medium tracking-tight lg:text-4xl">
              {titles[step]}
            </h1>

            <div className="mt-8 flex-1">
              {step === 0 && (
                <div className="space-y-6">
                  <p className="text-muted-foreground">Two quick questions and you can start logging. Everything stays on this device until you choose to sign in.</p>
                  <Field label="What should we call you? (optional)">
                    {(id) => <Input id={id} autoFocus value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Arjun" autoComplete="given-name" className="h-11" />}
                  </Field>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <MoneyInput label="Monthly allowance" value={amount} onChange={setAmount} error={touched ? parsed.error : ''} autoFocus />
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Quick amounts">
                    {PRESETS.map((p) => (
                      <Button key={p} type="button" variant="outline" className="rounded-full" onClick={() => setAmount(String(p))}>
                        ₹{p.toLocaleString('en-IN')}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <p className="text-muted-foreground">Your budget cycle restarts on this day, not on the 1st. That is what makes “safe to spend today” honest.</p>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Allowance day">
                    {DAYS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        role="radio"
                        aria-checked={day === d}
                        onClick={() => setDay(d)}
                        className={cn('h-12 min-w-12 rounded-xl border px-4 text-lg font-medium transition-colors', day === d ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted')}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <Field label="Another day">
                    {(id) => (
                      <NativeSelect id={id} value={day} onChange={(e) => setDay(Number(e.target.value))}>
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            Day {d}
                          </option>
                        ))}
                      </NativeSelect>
                    )}
                  </Field>
                  <p className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
                    This cycle runs <span className="text-foreground">{shortDate(cycle.start)}</span> to <span className="text-foreground">{shortDate(addDays(cycle.end, -1))}</span>, which leaves {cycle.daysLeft}{' '}
                    {cycle.daysLeft === 1 ? 'day' : 'days'}.
                  </p>
                </div>
              )}

              {step === 3 && <Capture android={android} />}

              {step === 4 && (
                <div className="space-y-5">
                  <p className="text-muted-foreground">
                    That is {rupees(parsed.paise ?? 0)} over {cycle.daysLeft} {cycle.daysLeft === 1 ? 'day' : 'days'} until {shortDate(cycle.end)}. Add what you spend and this number keeps itself honest.
                  </p>
                  <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
                    <p className="text-sm text-primary-foreground/70">Safe to spend today</p>
                    <p className="mt-2 text-5xl font-semibold tracking-tight tabular-nums">{rupees(Math.floor(perDay / 100) * 100)}</p>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {['An alert at 50, 80 and 100% of each budget', 'Works offline, and syncs when you sign in', 'Nothing is saved on a guess. Unsure entries wait for you'].map((t) => (
                      <li key={t} className="flex items-center gap-2.5">
                        <Check size={16} className="text-primary" /> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-8 space-y-3">
              {step < STEPS - 1 ? (
                <Button ref={primary} type="submit" className={primaryAction}>
                  Continue <ArrowRight />
                </Button>
              ) : (
                <>
                  <Button ref={primary} type="button" disabled={busy} onClick={() => finish(false)} className={primaryAction}>
                    Open my wallet
                  </Button>
                  <Button type="button" variant="ghost" disabled={busy} onClick={() => finish(true)} className="h-11 w-full">
                    Look around with sample data first
                  </Button>
                </>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
