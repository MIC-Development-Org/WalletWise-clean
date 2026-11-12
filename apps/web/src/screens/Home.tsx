import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CalendarDays,
  ChartPie,
  Download,
  Gauge,
  Inbox,
  Plus,
  Target,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { Donut, DailyBars, Legend, donutSlices } from '@/components/charts';
import { TxnRow } from '@/components/TxnRow';
import { Meter } from '@/components/ui/meter';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { useAddSheet } from '@/lib/addSheet';
import { category } from '@/lib/categories';
import { addDays, greeting, rupees, shortDate } from '@/lib/format';
import type { Snapshot } from '@/lib/snapshot';
import { cn } from '@/lib/utils';

const whole = (paise: number) => rupees(Math.floor(paise / 100) * 100);

const card = 'overflow-hidden rounded-2xl border border-border bg-card';
const cardHead = 'flex items-center justify-between border-b border-border px-4 py-3.5';
const viewAll = 'text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline';

/** The money highlight: the one number that matters, in the primary colour. */
function Hero({ s }: { s: Snapshot }) {
  const { openAdd } = useAddSheet();
  const over = s.leftPaise < 0;
  const delta = s.prevSpentPaise > 0 ? ((s.spentPaise - s.prevSpentPaise) / s.prevSpentPaise) * 100 : null;
  return (
    <div className="flex flex-col justify-between gap-8 rounded-2xl bg-primary p-5 text-primary-foreground @lg:p-7">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm text-primary-foreground/70">
            <Wallet className="h-4 w-4" /> Safe to spend today
          </p>
          <p className="mt-2 truncate text-5xl font-semibold tracking-tight tabular-nums @lg:text-6xl">{whole(s.safeToSpendPaise)}</p>
          <p className="mt-2 text-sm text-primary-foreground/70">
            {over ? (
              <>You are {whole(-s.leftPaise)} over this cycle&apos;s budget</>
            ) : (
              <>
                {whole(s.leftPaise)} left for {s.cycle.daysLeft} {s.cycle.daysLeft === 1 ? 'day' : 'days'}
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openAdd()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary-foreground px-3.5 py-2 text-sm font-medium text-primary transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> <span className="hidden @lg:inline">Add transaction</span>
          <span className="@lg:hidden">Add</span>
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-primary-foreground/10 p-3.5 @lg:p-4">
            <p className="flex items-center gap-1.5 text-xs text-primary-foreground/70">
              <ArrowUpRight className="h-3.5 w-3.5" /> Spent this cycle
            </p>
            <p className="mt-1 truncate text-xl font-semibold tabular-nums @lg:text-2xl">{whole(s.spentPaise)}</p>
          </div>
          <div className="rounded-xl bg-primary-foreground/10 p-3.5 @lg:p-4">
            <p className="flex items-center gap-1.5 text-xs text-primary-foreground/70">
              <ArrowDownLeft className="h-3.5 w-3.5" /> Received this cycle
            </p>
            <p className="mt-1 truncate text-xl font-semibold tabular-nums @lg:text-2xl">{whole(s.incomePaise)}</p>
          </div>
        </div>
        <div>
          <div
            role="progressbar"
            aria-label="Share of this cycle's budget spent"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(100, Math.round(s.usedPct))}
            className="h-1.5 overflow-hidden rounded-full bg-primary-foreground/20"
          >
            <div className="h-full rounded-full bg-primary-foreground" style={{ width: `${Math.min(100, s.usedPct)}%` }} />
          </div>
          <p className="mt-1.5 flex flex-wrap justify-between gap-x-3 text-xs text-primary-foreground/70">
            <span>
              Spent {Math.round(s.usedPct)}% of {whole(s.budgetPaise)}
            </span>
            {delta !== null && (
              <span>
                {Math.abs(Math.round(delta))}% {delta <= 0 ? 'less' : 'more'} than last cycle
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function Recent({ s }: { s: Snapshot }) {
  const rows = s.transactions.slice(0, 5);
  return (
    <div className={card}>
      <div className={cardHead}>
        <h2 className="text-sm font-semibold">Recent activity</h2>
        <Link to="/app/activity" className={viewAll}>
          View all
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-muted-foreground">No transactions yet. Tap + to add your first.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((t) => (
            <li key={t.id}>
              <TxnRow t={t} detail="date" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Shortcuts({ s }: { s: Snapshot }) {
  const { openAdd } = useAddSheet();
  const row = 'group flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-muted/60';
  const item = (Icon: LucideIcon, label: string, hint: string) => (
    <>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </>
  );
  return (
    <div className={cn(card, 'h-fit')}>
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Shortcuts</h2>
      </div>
      <ul className="p-2">
        <li>
          <button type="button" onClick={() => openAdd()} className={row}>
            {item(Plus, 'Add a transaction', 'Amount and category, about ten seconds')}
          </button>
        </li>
        <li>
          <Link to="/app/budgets" className={row}>
            {item(ChartPie, 'Set a budget', 'Alerts at 50, 80 and 100%')}
          </Link>
        </li>
        <li>
          <Link to="/app/review" className={row}>
            {item(Inbox, 'Review captures', s.review.length ? `${s.review.length} waiting for you` : 'Nothing waiting')}
          </Link>
        </li>
        <li>
          <Link to="/app/more" className={row}>
            {item(Download, 'Install or export', 'Get the app, download your data')}
          </Link>
        </li>
      </ul>
    </div>
  );
}

export function Home({ s }: { s: Snapshot }) {
  const slices = donutSlices(s.byCategory);
  const top = s.budgets.slice(0, 4);
  const stat = 'flex-col items-start gap-3 rounded-2xl';
  return (
    <div className="@container flex flex-col gap-8">
      <PageHeader
        eyebrow={`${shortDate(s.cycle.start)} – ${shortDate(addDays(s.cycle.end, -1))} · ${s.cycle.daysLeft} ${s.cycle.daysLeft === 1 ? 'day' : 'days'} to allowance`}
        title={`${greeting(s.now)}${s.name ? `, ${s.name}` : ''}`}
        actions={
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm">
            <CalendarDays className="h-4 w-4" strokeWidth={1.6} />
            <span className="font-semibold tabular-nums">
              Day {s.cycle.daysElapsed} of {s.cycle.daysTotal}
            </span>
          </div>
        }
      />

      {/* Money: the main highlight */}
      <section className="grid gap-4 @3xl:grid-cols-[1.25fr_1fr]">
        <Hero s={s} />
        <Recent s={s} />
      </section>

      {/* This cycle at a glance */}
      <section className="grid gap-4 @3xl:grid-cols-[1.25fr_1fr]">
        <div className={cn(card, 'p-5')}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">This cycle</h2>
            <span className="text-xs text-muted-foreground">Spend per day</span>
          </div>
          <DailyBars snapshot={s} />
          <p className="mt-3 text-xs text-muted-foreground">The dashed line is the daily pace that exactly uses your budget.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard className={stat} icon={CalendarClock} label="Money lasts till" value={s.runway ? shortDate(s.runway) : '—'} hint={s.runway ? 'At your current pace' : 'Nothing spent yet'} />
          <StatCard className={stat} icon={Wallet} label="Left this cycle" value={whole(s.leftPaise)} hint={`of ${whole(s.budgetPaise)}`} />
          <StatCard className={stat} icon={Gauge} label="Budget used" value={`${Math.round(s.usedPct)}%`} hint={s.usedPct >= 80 ? 'Running close' : 'On track'} />
          <StatCard className={stat} icon={Inbox} label="Needs review" value={s.review.length} hint={s.review.length ? 'Not counted yet' : 'All clear'} />
        </div>
      </section>

      <section className="grid gap-4 @3xl:grid-cols-[1.25fr_1fr]">
        <div className="space-y-4">
          <div className={cn(card, 'p-5')}>
            <h2 className="mb-4 text-sm font-semibold">Where it went</h2>
            {slices.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">Nothing spent yet this cycle.</p>
            ) : (
              <div className="flex flex-col items-center gap-6 @md:flex-row">
                <Donut slices={slices} total={s.spentPaise} />
                <Legend slices={slices} />
              </div>
            )}
          </div>

          <div className={card}>
            <div className={cardHead}>
              <h2 className="text-sm font-semibold">Budgets</h2>
              <Link to="/app/budgets" className={viewAll}>
                View all
              </Link>
            </div>
            {top.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">Set a limit per category to get alerts at 50, 80 and 100%.</p>
            ) : (
              <ul className="divide-y divide-border">
                {top.map((b) => (
                  <li key={b.id} className="px-4 py-3.5">
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{category(b.categoryId!).name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {whole(b.spentPaise)} / {whole(b.limitPaise)}
                      </span>
                    </div>
                    <Meter pct={b.pct} label={`${category(b.categoryId!).name} budget used`} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {s.goals.length > 0 && (
            <div className={card}>
              <div className={cardHead}>
                <h2 className="text-sm font-semibold">Savings goals</h2>
                <Link to="/app/budgets?tab=goals" className={viewAll}>
                  View all
                </Link>
              </div>
              <ul className="divide-y divide-border">
                {s.goals.slice(0, 3).map((g) => (
                  <li key={g.id} className="px-4 py-3.5">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Target className="h-4 w-4" />
                      </div>
                      <span className="flex-1 truncate text-sm font-medium">{g.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {whole(g.savedPaise)} / {whole(g.targetPaise)}
                      </span>
                    </div>
                    <Meter pct={g.pct} label={`${g.name} saved`} tone="primary" />
                    {g.perDayPaise ? <p className="mt-1.5 text-xs text-muted-foreground">Set aside {rupees(g.perDayPaise)} a day</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Shortcuts s={s} />
        </div>
      </section>
    </div>
  );
}
