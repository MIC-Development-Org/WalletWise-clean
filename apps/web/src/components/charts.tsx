import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { category, hueFor, OTHER_HUE } from '../lib/categories';
import { rupees } from '../lib/format';
import type { Snapshot } from '../lib/snapshot';

export interface Slice {
  id: string;
  name: string;
  paise: number;
  pct: number;
  color: string;
}

/**
 * Five main hostel categories keep their own hue. Everything else folds into "Other"
 * instead of inventing a sixth colour.
 */
export function donutSlices(byCategory: Snapshot['byCategory']): Slice[] {
  const slices: Slice[] = [];
  let otherPaise = 0;
  let otherPct = 0;
  for (const c of byCategory) {
    if (category(c.id).slot === null) {
      otherPaise += c.paise;
      otherPct += c.pct;
    } else slices.push({ id: c.id, name: category(c.id).name, paise: c.paise, pct: c.pct, color: hueFor(c.id) });
  }
  if (otherPaise > 0) slices.push({ id: 'other', name: 'Other', paise: otherPaise, pct: otherPct, color: OTHER_HUE });
  return slices;
}

export function Donut({ slices, total, size = 132 }: { slices: Slice[]; total: number; size?: number }) {
  let offset = 0;
  const gap = slices.length > 1 ? 1.2 : 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="-rotate-90" width={size} height={size} role="img" aria-label="Spending by category">
        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--color-surface-3)" strokeWidth="3.6" />
        {slices.map((s) => {
          const len = Math.max(0, s.pct - gap);
          const el = (
            <circle
              key={s.id}
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              stroke={s.color}
              strokeWidth="3.6"
              strokeLinecap="butt"
              strokeDasharray={`${len} ${100 - len}`}
              strokeDashoffset={-offset}
            >
              <title>{`${s.name}: ${rupees(s.paise)} (${Math.round(s.pct)}%)`}</title>
            </circle>
          );
          offset += s.pct;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <span className="text-[0.65rem] tracking-wide text-muted-foreground uppercase">Spent</span>
        <span className="font-display text-lg leading-tight font-semibold tabular-nums">{rupees(Math.floor(total / 100) * 100)}</span>
      </div>
    </div>
  );
}

export function Legend({ slices }: { slices: Slice[] }) {
  return (
    <ul className="min-w-0 flex-1 space-y-2.5">
      {slices.map((s) => (
        <li key={s.id} className="flex items-center gap-2.5 text-sm">
          <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: s.color }} aria-hidden="true" />
          <span className="flex-1 truncate">{s.name}</span>
          <span className="text-muted-foreground tabular-nums">{rupees(Math.floor(s.paise / 100) * 100)}</span>
          <span className="w-9 text-right text-faint tabular-nums">{Math.round(s.pct)}%</span>
        </li>
      ))}
    </ul>
  );
}

interface TipProps {
  active?: boolean;
  payload?: { payload: { label: string; paise: number } }[];
}
function DayTip({ active, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0]!.payload;
  return (
    <div className="rounded-xl border border-line-strong bg-surface-3 px-3 py-2 text-xs shadow-xl">
      <p className="text-muted-foreground">{p.label}</p>
      <p className="mt-0.5 font-medium text-fg tabular-nums">{p.paise ? rupees(p.paise) : 'Nothing spent'}</p>
    </div>
  );
}

/** Spend per day this cycle. The dashed line is the daily pace that would exactly use the budget. */
export function DailyBars({ snapshot, height = 180 }: { snapshot: Snapshot; height?: number }) {
  const pace = snapshot.budgetPaise / Math.max(1, snapshot.cycle.daysTotal);
  const data = snapshot.daily.map((d) => ({
    key: d.key,
    day: d.date.getDate(),
    label: d.date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
    paise: d.paise,
    isToday: d.isToday,
  }));
  const max = Math.max(pace * 1.25, ...data.map((d) => d.paise));
  return (
    <div style={{ height }} role="img" aria-label={`Daily spending this cycle. Pace to stay within budget is ${rupees(Math.round(pace))} a day.`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} barCategoryGap="22%">
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            tick={{ fill: 'var(--color-faint)', fontSize: 11 }}
            minTickGap={14}
          />
          <YAxis hide domain={[0, max]} />
          <Tooltip cursor={{ fill: 'rgb(255 255 255 / 0.05)', radius: 6 }} content={<DayTip />} />
          <ReferenceLine y={pace} stroke="var(--color-line-strong)" strokeDasharray="4 4" />
          <Bar dataKey="paise" radius={[4, 4, 0, 0]} isAnimationActive={false} minPointSize={2}>
            {data.map((d) => (
              <Cell key={d.key} fill="var(--color-lime)" fillOpacity={d.isToday ? 1 : d.paise > pace ? 0.9 : 0.5} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
