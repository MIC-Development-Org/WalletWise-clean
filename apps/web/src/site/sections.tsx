import { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  ChartPie,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Globe,
  LayoutDashboard,
  Plus,
  Smartphone,
  Star,
  Target,
} from 'lucide-react';
import { Reveal } from '../components/Reveal';
import { useInstall } from '../lib/install';
import type { Snapshot } from '../lib/snapshot';
import { FAQ, TESTIMONIALS } from './content';
import { ApkLink, Container, Heading, LimeIcon, StoreButtons } from './parts';
import { ActivityPhone, BudgetsPhone, HomePhone } from './previews';

/* ---------- Hero ---------- */

export function Hero({ s }: { s: Snapshot }) {
  return (
    <section className="relative overflow-hidden">
      <Container className="relative pt-16 text-center sm:pt-20">
        <h1 className="mx-auto max-w-4xl text-[2.6rem] leading-[1.1] font-medium text-balance sm:text-6xl sm:leading-[1.13]">
          Know what you can spend <span className="text-lime">today</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-7 text-muted-foreground text-pretty">
          WalletWise tracks mess, canteen, laundry and recharge, reads your bank SMS on Android, and tells you one number
          each morning: what is safe to spend.
        </p>
        <StoreButtons className="mt-9" />
      </Container>

      <div className="relative mx-auto mt-14 flex h-[26rem] max-w-5xl items-start justify-center gap-4 overflow-hidden [mask-image:linear-gradient(to_bottom,#000_62%,transparent)] sm:mt-16 sm:h-[33rem]">
        <svg
          className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 text-white"
          width="1100"
          height="640"
          viewBox="0 0 1100 640"
          fill="none"
          aria-hidden="true"
        >
          <ellipse cx="550" cy="420" rx="540" ry="340" stroke="currentColor" strokeOpacity="0.1" />
          <ellipse cx="550" cy="440" rx="390" ry="250" stroke="currentColor" strokeOpacity="0.07" />
          <circle cx="96" cy="300" r="7" fill="var(--color-lime)" />
        </svg>
        <span className="absolute top-[7.5rem] right-[calc(50%-31rem)] hidden h-14 w-14 place-items-center rounded-full bg-surface text-lime lg:grid">
          <BarChart3 size={22} />
        </span>
        <div className="relative mt-16 hidden md:block">
          <ActivityPhone s={s} scale={0.66} />
        </div>
        <div className="relative">
          <div className="sm:hidden">
            <HomePhone s={s} scale={0.74} />
          </div>
          <div className="hidden sm:block">
            <HomePhone s={s} scale={0.82} />
          </div>
        </div>
        <div className="relative mt-16 hidden md:block">
          <BudgetsPhone s={s} scale={0.66} />
        </div>
      </div>
    </section>
  );
}

/* ---------- Numbers ---------- */

export function Numbers() {
  const items = [
    ['10 sec', 'to log an expense'],
    ['0', 'raw SMS messages uploaded'],
    ['3', 'budget alerts: 50, 80 and 100%'],
  ];
  return (
    <section className="py-16 lg:py-20">
      <Container>
        <Reveal>
          <Heading title="Built around how hostel money actually moves" />
        </Reveal>
        <dl className="mt-14 grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {items.map(([n, label], i) => (
            <div key={label} className="px-6 py-8 text-center sm:py-4">
              <Reveal delay={i * 80} className="flex flex-col-reverse">
                <dt className="mt-3 text-base text-muted-foreground">{label}</dt>
                <dd className="text-5xl font-medium sm:text-6xl">{n}</dd>
              </Reveal>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

/* ---------- Control centre ---------- */

export function ControlCenter({ s }: { s: Snapshot }) {
  const items = [
    { icon: LayoutDashboard, title: 'Smart dashboard', body: 'Safe to spend, budget used and runway at a glance.' },
    { icon: Plus, title: 'Quick add', body: 'Amount, category, done. Works with no signal too.' },
    { icon: ChartPie, title: 'Budgets', body: 'Limits per category with alerts at 50, 80 and 100%.' },
    { icon: Target, title: 'Savings goals', body: 'See how much to set aside each day to reach one.' },
  ];
  return (
    <section className="py-16 lg:py-20">
      <Container className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Reveal>
            <h2 className="max-w-md text-[2rem] leading-[1.1] font-medium text-balance sm:text-5xl sm:leading-[1.05]">
              Your money control center for hostel life
            </h2>
          </Reveal>
          <ul className="mt-12 grid gap-x-8 gap-y-9 sm:grid-cols-2">
            {items.map(({ icon: Icon, title, body }, i) => (
              <li key={title}>
                <Reveal delay={i * 70}>
                  <LimeIcon>
                    <Icon size={20} />
                  </LimeIcon>
                  <h3 className="mt-4 text-base font-medium">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{body}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
        <Reveal>
          <div className="relative flex h-[30rem] justify-center gap-3 overflow-hidden rounded-3xl bg-surface p-3 pt-10 sm:h-[34rem]">
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-surface to-transparent" />
            <div className="mt-8 hidden sm:block">
              <ActivityPhone s={s} scale={0.62} />
            </div>
            <div className="-rotate-0 sm:-mt-2">
              <HomePhone s={s} scale={0.66} />
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ---------- Steps ---------- */

export function Steps() {
  const steps = [
    ['Install the app', 'Add WalletWise to your Home Screen, Dock or desktop. No store account needed.'],
    ['Set your allowance', 'Tell us how much and which day it lands. Your budget cycle starts there.'],
    ['Start tracking', 'Add spends in seconds, or let Android read your bank SMS on the phone.'],
  ];
  return (
    <section id="how-it-works" className="scroll-mt-24 py-16 lg:py-20">
      <Container>
        <Reveal>
          <Heading title="Up and running in a minute" sub="From install to your first safe-to-spend number, in three steps." />
        </Reveal>
        <ol className="mt-14 grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
          {steps.map(([t, b], i) => (
            <li key={t} className="py-8 md:px-10 md:py-2 md:first:pl-0 md:last:pr-0">
              <Reveal delay={i * 80}>
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-lime text-lg font-semibold text-lime-ink shadow-[0_0_28px_-4px_rgb(214_255_102/0.55)]">
                  {i + 1}
                </span>
                <h3 className="mt-8 text-base font-medium">{t}</h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{b}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/* ---------- Testimonials ---------- */

export function Testimonials() {
  const rail = useRef<HTMLUListElement>(null);
  const go = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * 340, behavior: 'smooth' });
  return (
    <section className="py-16 lg:py-20">
      <Container>
        <Reveal className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <Heading align="left" title="Trusted by students every day" sub="What people say about using WalletWise to manage their allowance." />
          <div className="flex gap-3">
            <button type="button" onClick={() => go(-1)} aria-label="Previous" className="grid h-11 w-11 place-items-center rounded-full bg-surface-3 text-white hover:bg-white/20">
              <ChevronLeft size={20} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next" className="grid h-11 w-11 place-items-center rounded-full bg-surface-3 text-white hover:bg-white/20">
              <ChevronRight size={20} />
            </button>
          </div>
        </Reveal>
        <ul ref={rail} className="mt-12 flex snap-x gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TESTIMONIALS.map((t) => (
            <li key={t.quote} className="w-[19rem] shrink-0 snap-start rounded-3xl bg-surface p-6">
              <div className="flex items-center justify-between">
                <span className="flex gap-0.5 text-[#facc15]" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={16} fill="currentColor" strokeWidth={0} />
                  ))}
                </span>
                {t.sample && <span className="rounded-full bg-surface-3 px-2.5 py-0.5 text-[0.65rem] tracking-wide text-muted-foreground uppercase">Sample</span>}
              </div>
              <p className="mt-5 text-[0.95rem] leading-7">{t.quote}</p>
              <div className="mt-7 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-3 text-sm font-medium text-lime">{t.name.slice(0, 1)}</span>
                <span className="leading-tight">
                  <span className="block text-sm font-medium">{t.name}</span>
                  <span className="block text-xs text-muted-foreground">{t.role}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Download ---------- */

export function DownloadCards() {
  const { install, installed } = useInstall();
  const card = 'flex flex-col rounded-3xl bg-surface p-7';
  const btn = 'mt-7 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium transition-opacity hover:opacity-90';
  return (
    <section id="download" className="scroll-mt-24 py-16 lg:py-20">
      <Container>
        <Reveal>
          <Heading title="Get WalletWise on every device" sub="One account everywhere. Install it as an app, no store account needed." />
        </Reveal>
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          <Reveal>
            <article className={`${card} h-full`}>
              <LimeIcon>
                <Smartphone size={20} />
              </LimeIcon>
              <h3 className="mt-6 text-xl font-medium">iPhone and iPad</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
                Install from Safari with Add to Home Screen. It opens full screen like a native app, and notifications work from the Home Screen.
              </p>
              <button type="button" onClick={install} className={`${btn} bg-lime text-lime-ink`}>
                {installed ? 'Open WalletWise' : 'Show me how'}
              </button>
            </article>
          </Reveal>
          <Reveal delay={80}>
            <article className={`${card} h-full`}>
              <LimeIcon>
                <Globe size={20} />
              </LimeIcon>
              <h3 className="mt-6 text-xl font-medium">Mac, Windows and Linux</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
                Install from Chrome or Edge with one click, or add it to the Dock from Safari. It runs in its own window and works offline.
              </p>
              <button type="button" onClick={install} className={`${btn} bg-lime text-lime-ink`}>
                {installed ? 'Open WalletWise' : 'Install on this computer'}
              </button>
            </article>
          </Reveal>
          <Reveal delay={160}>
            <article className={`${card} h-full`}>
              <LimeIcon>
                <Download size={20} />
              </LimeIcon>
              <h3 className="mt-6 text-xl font-medium">Android with SMS capture</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
                The only version that reads bank SMS on your phone, so most spends log themselves. On Android 13 and later, allow restricted settings once.
              </p>
              <ApkLink className={`${btn} border border-line-strong hover:bg-surface-3`} pending="APK publishing soon">
                Download APK
              </ApkLink>
            </article>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ---------- FAQ ---------- */

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 py-16 lg:py-20">
      <Container className="max-w-3xl">
        <Reveal>
          <Heading title="Frequently asked questions" sub="Quick answers about using the app securely and confidently." />
        </Reveal>
        <div className="mt-12 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-2xl bg-surface px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-medium [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown size={20} className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Final CTA ---------- */

export function FinalCta() {
  return (
    <section className="py-16 lg:py-20">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-surface px-6 py-16 text-center sm:py-20">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-60 bg-[radial-gradient(ellipse_60%_100%_at_50%_100%,rgb(214_255_102/0.25),transparent)]" />
            <h2 className="relative mx-auto max-w-2xl text-[2rem] leading-[1.1] font-medium text-balance sm:text-5xl sm:leading-[1.05]">
              Take control of your money today
            </h2>
            <p className="relative mx-auto mt-5 max-w-lg text-lg leading-7 text-muted-foreground">
              Install WalletWise and know what is safe to spend before you reach the canteen.
            </p>
            <StoreButtons className="relative mt-9" />
            <Link to="/features" className="relative mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white">
              See all features <ArrowRight size={15} />
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
