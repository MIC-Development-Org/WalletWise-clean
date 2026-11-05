import { useLiveQuery } from 'dexie-react-hooks';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { formatPaise } from '@money-tracker/shared';
import { db } from '../lib/db';

export function Dashboard() {
  const txns = useLiveQuery(() => db.transactions.orderBy('occurredAt').reverse().limit(200).toArray(), []);
  const spent = (txns ?? []).filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amountPaise, 0);

  const byDay = new Map<string, number>();
  for (const t of txns ?? []) {
    if (t.type !== 'EXPENSE') continue;
    const day = t.occurredAt.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + t.amountPaise / 100);
  }
  const data = [...byDay].map(([day, rupees]) => ({ day, rupees })).reverse();

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <section className="rounded-lg bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Spent (recent)</p>
        <p className="text-3xl font-semibold">{formatPaise(spent)}</p>
      </section>
      <section className="h-56 rounded-lg bg-white p-4 shadow-sm">
        {data.length === 0 ? (
          <p className="text-sm text-slate-500">No transactions yet.</p>
        ) : (
          <ResponsiveContainer>
            <BarChart data={data}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Bar dataKey="rupees" fill="#0f766e" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>
    </main>
  );
}
