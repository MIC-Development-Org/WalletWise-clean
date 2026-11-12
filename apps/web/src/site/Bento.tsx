import type { ReactNode } from 'react';
import { Download, SlidersHorizontal, Wallet, Zap } from 'lucide-react';
import { Reveal } from '../components/Reveal';
import type { Snapshot } from '../lib/snapshot';
import { ActivityPhone, AddPhone, ReviewPhone } from './previews';

function Card({
  title,
  body,
  panel,
  className = '',
  panelClass = '',
}: {
  title: string;
  body: string;
  panel: ReactNode;
  className?: string;
  panelClass?: string;
}) {
  return (
    <article className={`rounded-3xl bg-surface p-3 ${className}`}>
      <div className={`relative overflow-hidden rounded-2xl bg-surface-3 ${panelClass}`}>{panel}</div>
      <div className="px-3 pt-5 pb-3">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
      </div>
    </article>
  );
}

function Node({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`absolute grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-lime text-lime-ink ${className}`}>
      {children}
    </span>
  );
}

/** Everything in one place: nodes radiating from the W mark. */
function OneView() {
  return (
    <div className="h-52">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_100%,rgb(214_255_102/0.35),transparent_70%)]" />
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/10" />
      <div className="absolute top-[42%] right-0 left-0 h-px bg-white/10" />
      <Node className="top-[18%] left-1/2">
        <Wallet size={18} />
      </Node>
      <Node className="top-[42%] left-[22%]">
        <SlidersHorizontal size={18} />
      </Node>
      <Node className="top-[42%] left-[78%]">
        <Download size={18} />
      </Node>
      <span className="absolute top-[74%] left-1/2 grid h-[4.5rem] w-[4.5rem] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-lime shadow-[0_0_60px_8px_rgb(214_255_102/0.45)]">
        <img src="/brand/mark.png" alt="" width={640} height={417} className="w-11" />
      </span>
    </div>
  );
}

/** Income and spending chart with the hatched "today" bar, using this month's sample numbers. */
function Bars({ today }: { today: string }) {
  const bars = [62, 40, 100, 74, 36, 58];
  return (
    <div className="flex h-52 items-end justify-between gap-3 px-5 pb-0">
      {bars.map((h, i) => (
        <div
          key={i}
          className={`relative flex-1 rounded-t-md ${i === 2 ? 'hatch bg-lime/25' : 'bg-lime/[0.22]'}`}
          style={{ height: `${h * 0.78}%` }}
        >
          {i === 2 && (
            <>
              <span className="absolute -top-1.5 left-full h-3 w-3 -translate-x-1/2 rounded-full border-2 border-lime bg-ink" />
              <span className="absolute -top-12 -left-8 rounded-lg bg-lime/90 px-3 py-1.5 text-left text-xs leading-tight whitespace-nowrap text-lime-ink">
                <span className="block text-[0.65rem] opacity-70">Today</span>
                <span className="font-semibold tabular-nums">{today}</span>
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export function Bento({ s }: { s: Snapshot }) {
  return (
    <div className="grid gap-4 md:grid-cols-6">
      <Reveal className="md:col-span-2">
        <Card
          title="Everything in one view"
          body="Safe to spend, what is left and what needs a look, all on the first screen."
          panel={<OneView />}
        />
      </Reveal>
      <Reveal delay={80} className="md:col-span-2">
        <Card
          title="Track spending and income"
          body="See each day against your budget pace, so a heavy week never surprises you."
          panel={<Bars today={`₹${Math.floor(s.safeToSpendPaise / 100)} safe to spend`} />}
        />
      </Reveal>
      <Reveal delay={160} className="md:col-span-2">
        <article className="relative flex h-full min-h-[22rem] flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-lime via-lime to-[#a8d93a] p-7 text-lime-ink">
          <Zap size={190} strokeWidth={1} className="absolute top-3 -left-6 text-lime-ink/15" aria-hidden="true" />
          <p className="relative mt-6 text-right text-[7rem] leading-none font-medium tracking-tight sm:text-[8rem]">10s</p>
          <div className="relative">
            <h3 className="text-lg font-medium">Log in about 10 seconds</h3>
            <p className="mt-2 text-sm leading-6 text-lime-ink/75">
              Type an amount and tap a category. Your last choices are remembered.
            </p>
          </div>
        </article>
      </Reveal>

      <Reveal className="md:col-span-3">
        <Card
          title="Quick add, even offline"
          body="Entries are saved on your device first and sync when you are back online, without duplicates."
          panelClass="flex h-80 justify-center pt-8 bg-gradient-to-b from-surface-3 to-surface-2"
          panel={<AddPhone s={s} scale={0.55} />}
        />
      </Reveal>
      <Reveal delay={100} className="md:col-span-3">
        <Card
          title="Anything unsure waits for you"
          body="Captures the app cannot read with confidence go to a review list. Nothing is saved on a guess."
          panelClass="flex h-80 justify-center gap-4 pt-8 bg-gradient-to-b from-surface-3 to-surface-2"
          panel={
            <>
              <div className="mt-10 hidden sm:block">
                <ActivityPhone s={s} scale={0.5} />
              </div>
              <ReviewPhone s={s} scale={0.55} />
            </>
          }
        />
      </Reveal>
    </div>
  );
}
