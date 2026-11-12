import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChartPie, Pencil, Plus, Target } from 'lucide-react';
import { AppDialog, CategoryTile, EmptyState, Field, NativeSelect, primaryAction } from '@/components/kit';
import { MoneyInput, parseAmount } from '@/components/MoneyInput';
import { Button } from '@/components/ui/button';
import { FilterPills } from '@/components/ui/filter-pills';
import { Input } from '@/components/ui/input';
import { Meter } from '@/components/ui/meter';
import { PageHeader } from '@/components/ui/page-header';
import { Panel } from '@/components/ui/panel';
import { category, EXPENSE_CATEGORIES } from '@/lib/categories';
import { rupees, shortDate } from '@/lib/format';
import type { BudgetView, GoalView, Snapshot } from '@/lib/snapshot';
import { addGoal, addToGoal, removeBudget, removeGoal, setBudget } from '@/lib/store';
import { cn } from '@/lib/utils';

const whole = (p: number) => rupees(Math.floor(p / 100) * 100);
const asInput = (paise: number) => String(paise / 100);

/* ---------- Budgets ---------- */

function BudgetDialog({ onClose, existing, taken }: { onClose: () => void; existing: BudgetView | null; taken: Set<string> }) {
  const options = EXPENSE_CATEGORIES.filter((c) => !taken.has(c.id) || c.id === existing?.categoryId);
  const [cat, setCat] = useState(existing?.categoryId ?? options[0]?.id ?? 'mess');
  const [amount, setAmount] = useState(existing ? asInput(existing.limitPaise) : '');
  const [touched, setTouched] = useState(false);
  const parsed = parseAmount(amount);

  return (
    <AppDialog open onClose={onClose} title={existing ? 'Edit budget' : 'New budget'} description="You get one alert each at 50%, 80% and 100% of this limit.">
      <form
        noValidate
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setTouched(true);
          if (parsed.paise === null) return;
          await setBudget(cat, parsed.paise);
          onClose();
        }}
      >
        <Field label="Category">
          {(id) => (
            <NativeSelect id={id} value={cat} disabled={!!existing} onChange={(e) => setCat(e.target.value)}>
              {options.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>
        <MoneyInput label="Limit per cycle" value={amount} onChange={setAmount} error={touched ? parsed.error : ''} autoFocus />
        <Button type="submit" className={primaryAction}>
          Save budget
        </Button>
        {existing && (
          <Button
            type="button"
            variant="destructive"
            className={primaryAction}
            onClick={async () => {
              await removeBudget(existing.id);
              onClose();
            }}
          >
            Remove budget
          </Button>
        )}
      </form>
    </AppDialog>
  );
}

function CycleBudgetDialog({ onClose, current }: { onClose: () => void; current: number }) {
  const [amount, setAmount] = useState(asInput(current));
  const [touched, setTouched] = useState(false);
  const parsed = parseAmount(amount);
  return (
    <AppDialog open onClose={onClose} title="Cycle budget" description="Safe to spend today is worked out from this.">
      <form
        noValidate
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setTouched(true);
          if (parsed.paise === null) return;
          await setBudget(null, parsed.paise);
          onClose();
        }}
      >
        <MoneyInput label="Total to spend this cycle" value={amount} onChange={setAmount} error={touched ? parsed.error : ''} autoFocus />
        <Button type="submit" className={primaryAction}>
          Save
        </Button>
      </form>
    </AppDialog>
  );
}

function BudgetsTab({ s }: { s: Snapshot }) {
  const [editing, setEditing] = useState<BudgetView | null>(null);
  const [creating, setCreating] = useState(false);
  const [overall, setOverall] = useState(false);
  const taken = new Set(s.budgets.map((b) => b.categoryId!));
  const allTaken = EXPENSE_CATEGORIES.every((c) => taken.has(c.id));

  return (
    <div className="grid gap-4 @3xl:grid-cols-[1fr_1.5fr] @3xl:items-start">
      <Panel
        title="Cycle budget"
        action={
          <Button variant="ghost" size="sm" onClick={() => setOverall(true)} aria-label="Edit cycle budget">
            <Pencil /> Edit
          </Button>
        }
        padded
      >
        <p className="text-4xl font-semibold tracking-tight tabular-nums">{whole(s.budgetPaise)}</p>
        <div className="mt-5">
          <Meter pct={s.usedPct} label="Cycle budget used" ticks />
          <p className="mt-2 text-xs text-muted-foreground">
            {whole(s.spentPaise)} spent · resets {shortDate(s.cycle.end)}
          </p>
        </div>
        <p className="mt-5 rounded-xl bg-muted/60 p-3.5 text-xs leading-relaxed text-muted-foreground">
          Alerts fire once at 50%, 80% and 100% of each budget, then stay quiet until the next cycle.
        </p>
      </Panel>

      <Panel
        title="By category"
        action={
          <Button variant="ghost" size="sm" disabled={allTaken} onClick={() => setCreating(true)}>
            <Plus /> Add
          </Button>
        }
      >
        {s.budgets.length === 0 ? (
          <EmptyState
            icon={<ChartPie size={22} />}
            title="No category budgets yet"
            body="Cap the things that usually run away, like canteen or fun."
            action={<Button onClick={() => setCreating(true)}>Add a budget</Button>}
          />
        ) : (
          <ul className="divide-y divide-border">
            {s.budgets.map((b) => (
              <li key={b.id}>
                <button type="button" onClick={() => setEditing(b)} className="block w-full px-4 py-3.5 text-left transition-colors hover:bg-muted/50">
                  <span className="mb-2.5 flex items-center gap-3">
                    <CategoryTile id={b.categoryId!} size="sm" />
                    <span className="flex-1 text-sm font-medium">{category(b.categoryId!).name}</span>
                    <span className={cn('text-xs tabular-nums', b.pct >= 100 ? 'text-destructive' : 'text-muted-foreground')}>
                      {whole(b.spentPaise)} / {whole(b.limitPaise)}
                    </span>
                  </span>
                  <Meter pct={b.pct} label={`${category(b.categoryId!).name} budget used`} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {creating && <BudgetDialog onClose={() => setCreating(false)} existing={null} taken={taken} />}
      {editing && <BudgetDialog onClose={() => setEditing(null)} existing={editing} taken={taken} />}
      {overall && <CycleBudgetDialog onClose={() => setOverall(false)} current={s.budgetPaise} />}
    </div>
  );
}

/* ---------- Goals ---------- */

function GoalDialog({ onClose, goal }: { onClose: () => void; goal: GoalView | null }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [add, setAdd] = useState('');
  const [touched, setTouched] = useState(false);
  const t = parseAmount(target);
  const a = parseAmount(add);
  const nameError = name.trim() === '' ? 'Give the goal a name' : '';

  if (goal) {
    return (
      <AppDialog open onClose={onClose} title={goal.name}>
        <form
          noValidate
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setTouched(true);
            if (a.paise === null) return;
            await addToGoal(goal.id, a.paise);
            onClose();
          }}
        >
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-muted-foreground">Saved</span>
              <span className="tabular-nums">
                {whole(goal.savedPaise)} / {whole(goal.targetPaise)}
              </span>
            </div>
            <Meter pct={goal.pct} label={`${goal.name} saved`} tone="primary" />
            {goal.perDayPaise ? <p className="mt-2 text-xs text-muted-foreground">Set aside {rupees(goal.perDayPaise)} a day to finish on time.</p> : null}
          </div>
          <MoneyInput label="Add money" value={add} onChange={setAdd} error={touched ? a.error : ''} autoFocus />
          <Button type="submit" className={primaryAction}>
            Add to goal
          </Button>
          <Button
            type="button"
            variant="destructive"
            className={primaryAction}
            onClick={async () => {
              await removeGoal(goal.id);
              onClose();
            }}
          >
            Delete goal
          </Button>
        </form>
      </AppDialog>
    );
  }

  return (
    <AppDialog open onClose={onClose} title="New savings goal">
      <form
        noValidate
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setTouched(true);
          if (nameError || t.paise === null) return;
          await addGoal(name, t.paise, deadline || null);
          onClose();
        }}
      >
        <Field label="What are you saving for?" error={touched ? nameError : ''}>
          {(id) => <Input id={id} autoFocus value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="Headphones" className="h-11 md:h-9" />}
        </Field>
        <MoneyInput label="Target amount" value={target} onChange={setTarget} error={touched ? t.error : ''} />
        <Field label="Finish by (optional)" hint="We will work out how much to set aside each day.">
          {(id) => <Input id={id} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="h-11 md:h-9" />}
        </Field>
        <Button type="submit" className={primaryAction}>
          Create goal
        </Button>
      </form>
    </AppDialog>
  );
}

function GoalsTab({ s, creating, setCreating }: { s: Snapshot; creating: boolean; setCreating: (v: boolean) => void }) {
  const [open, setOpen] = useState<GoalView | null>(null);
  return (
    <div>
      {s.goals.length === 0 ? (
        <Panel>
          <EmptyState
            icon={<Target size={22} />}
            title="No goals yet"
            body="Saving for headphones, a trip home or a laptop? Set a target and we will tell you how much to put aside each day."
            action={<Button onClick={() => setCreating(true)}>Create a goal</Button>}
          />
        </Panel>
      ) : (
        <ul className="grid gap-4 @2xl:grid-cols-2">
          {s.goals.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => setOpen(g)}
                className="block w-full overflow-hidden rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:bg-muted/40"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">
                    <Target className="h-5 w-5" />
                  </span>
                  <span className="text-xs text-muted-foreground">{g.deadline ? `By ${shortDate(new Date(`${g.deadline}T00:00:00`))}` : 'No deadline'}</span>
                </span>
                <span className="mt-4 block text-base font-semibold">{g.name}</span>
                <span className="mt-1 block text-sm text-muted-foreground tabular-nums">
                  {whole(g.savedPaise)} of {whole(g.targetPaise)}
                </span>
                <span className="mt-4 block">
                  <Meter pct={g.pct} label={`${g.name} saved`} tone="primary" />
                </span>
                {g.perDayPaise ? (
                  <span className="mt-3 block text-xs text-muted-foreground">Set aside {rupees(g.perDayPaise)} a day</span>
                ) : g.pct >= 100 ? (
                  <span className="mt-3 block text-xs text-primary">Goal reached</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
      {creating && <GoalDialog onClose={() => setCreating(false)} goal={null} />}
      {open && <GoalDialog onClose={() => setOpen(null)} goal={open} />}
    </div>
  );
}

export function Budgets({ s }: { s: Snapshot }) {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'goals' ? 'goals' : 'budgets';
  const [creatingGoal, setCreatingGoal] = useState(false);
  const [creatingBudget, setCreatingBudget] = useState(false);
  const taken = new Set(s.budgets.map((b) => b.categoryId!));
  const allTaken = EXPENSE_CATEGORIES.every((c) => taken.has(c.id));

  return (
    <div className="@container flex flex-col gap-6">
      <PageHeader
        eyebrow={`Cycle ends ${shortDate(s.cycle.end)}`}
        title="Budgets & goals"
        description="Limits that warn you early, and savings you can see building."
        actions={
          tab === 'goals' ? (
            <Button onClick={() => setCreatingGoal(true)} className="h-9 gap-1.5 px-3.5">
              <Plus className="h-4 w-4" /> New goal
            </Button>
          ) : (
            <Button onClick={() => setCreatingBudget(true)} disabled={allTaken} className="h-9 gap-1.5 px-3.5">
              <Plus className="h-4 w-4" /> New budget
            </Button>
          )
        }
      />
      <FilterPills
        pills={[
          { id: 'budgets', label: 'Budgets', count: s.budgets.length },
          { id: 'goals', label: 'Goals', count: s.goals.length },
        ]}
        value={tab}
        onChange={(v) => setParams(v === 'goals' ? { tab: 'goals' } : {}, { replace: true })}
        className="w-fit"
      />
      {tab === 'budgets' ? <BudgetsTab s={s} /> : <GoalsTab s={s} creating={creatingGoal} setCreating={setCreatingGoal} />}
      {creatingBudget && tab === 'budgets' && <BudgetDialog onClose={() => setCreatingBudget(false)} existing={null} taken={taken} />}
    </div>
  );
}
