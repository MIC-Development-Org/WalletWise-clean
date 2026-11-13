import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  ChartPie,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Filter,
  LayoutDashboard,
  Lock,
  MessageSquareText,
  Plus,
  Send,
  Star,
  Target,
  Wallet,
  Wifi,
} from 'lucide-react';
import { CountUp, Float, Motion, Stagger } from '../components/motion';
import { Reveal } from '../components/Reveal';
import type { Snapshot } from '../lib/snapshot';
import { AnglePhone, AngleStage } from './AngledPhones';
import { FAQ, TESTIMONIALS } from './content';
import { AndroidGlyph, AppleGlyph, WindowsGlyph } from './glyphs';
import { Container, DownloadButton, Heading, LimeIcon, PlatformLine, pillGhost } from './parts';
import { ActivityPhone, BudgetsPhone, HomePhone } from './previews';

/* ---------- Hero ---------- */

function HeroStage({ s }: { s: Snapshot }) {
  return (
    <AngleStage perspective={3000} className="mx-auto mt-14 h-[27rem] max-w-5xl overflow-hidden [mask-image:linear-gradient(to_bottom,#000_58%,transparent)] sm:mt-16 sm:h-[35rem]">
      <svg className="pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 text-white" width="1180" height="640" viewBox="0 0 1180 640" fill="none" aria-hidden="true">
        <ellipse cx="590" cy="430" rx="580" ry="340" stroke="currentColor" strokeOpacity="0.1" />
        <ellipse cx="590" cy="450" rx="420" ry="250" stroke="currentColor" strokeOpacity="0.07" />
        <circle cx="64" cy="318" r="6" fill="var(--color-lime)" />
        <circle cx="1118" cy="250" r="4" fill="var(--color-lime)" opacity="0.7" />
      </svg>

      <Motion variant="scale" delay={600} className="absolute top-40 left-[calc(50%-31rem)] z-0 hidden lg:block">
        <Float amplitude={9} duration={5.5}>
          <span className="grid h-14 w-14 place-items-center rounded-full border border-border bg-card text-primary shadow-xl">
            <Wallet size={22} />
          </span>
        </Float>
      </Motion>
      <Motion variant="scale" delay={760} className="absolute top-56 right-[calc(50%-31rem)] z-0 hidden lg:block">
        <Float amplitude={11} duration={6.5} delay={1}>
          <span className="grid h-14 w-14 place-items-center rounded-full border border-border bg-card text-primary shadow-xl">
            <BarChart3 size={22} />
          </span>
        </Float>
      </Motion>

      {/* Side phones turn in toward the middle one, so the three read as one arc. */}
      <div className="hidden md:block">
        <AnglePhone x={-340} y={70} rotY={17} rotZ={-3} z={1} delay={420}>
          <ActivityPhone s={s} scale={0.72} />
        </AnglePhone>
        <AnglePhone x={340} y={70} rotY={-17} rotZ={3} z={1} delay={540}>
          <BudgetsPhone s={s} scale={0.72} />
        </AnglePhone>
      </div>
      <AnglePhone z={2} delay={300}>
        <div className="sm:hidden">
          <HomePhone s={s} scale={0.74} />
        </div>
        <div className="hidden sm:block">
          <HomePhone s={s} scale={0.84} />
        </div>
      </AnglePhone>
    </AngleStage>
  );
}

export function Hero({ s }: { s: Snapshot }) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute top-0 left-1/2 h-[26rem] w-[52rem] -translate-x-1/2 rounded-full bg-lime/[0.07] blur-[110px]" aria-hidden="true" />
      <Container className="relative pt-14 text-center sm:pt-20">
        <Motion variant="blur">
          <h1 className="mx-auto max-w-4xl text-[2.6rem] leading-[1.1] font-medium text-balance sm:text-6xl sm:leading-[1.13]">
            Know what you can spend <span className="text-lime">today</span>
          </h1>
        </Motion>
        <Motion delay={140}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-7 text-muted-foreground text-pretty">
            WalletWise tracks mess, canteen, laundry and recharge, reads your bank SMS on Android, and tells you one number each morning: what is safe to spend.
          </p>
        </Motion>
        <Motion delay={260} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <DownloadButton />
          <Link to="/features" className={`${pillGhost} px-7 py-4 text-base`}>
            See how it works
          </Link>
        </Motion>
        <Motion delay={360}>
          <PlatformLine className="mt-6" />
        </Motion>
      </Container>
      <HeroStage s={s} />
    </section>
  );
}

/* ---------- Numbers ---------- */

export function Numbers() {
  const stats = [
    { to: 14, suffix: '', label: 'categories built in', note: 'Mess, canteen, laundry, recharge and more, ready on day one' },
    { to: 3, suffix: '', label: 'alerts on every budget', note: 'One each at 50, 80 and 100 percent' },
    { to: 10, suffix: 's', label: 'to log a spend', note: 'Type an amount and tap a category' },
    { to: 100, suffix: '%', label: 'works offline', note: 'Entries wait on your phone and sync later' },
  ];
  return (
    <section className="py-16 lg:py-20">
      <Container>
        <Reveal>
          <Heading
            title="Made for a hostel month"
            sub="Most money apps are built around a salary. WalletWise starts from an allowance, a canteen bill and a recharge due on the 20th."
          />
        </Reveal>
        <Stagger as="dl" step={110} className="mt-14 grid grid-cols-2 gap-y-12 lg:grid-cols-4 lg:divide-x lg:divide-line">
          {stats.map((st) => (
            <div key={st.label} className="px-4 text-center lg:px-8">
              <dd className="text-6xl font-medium tracking-tight sm:text-7xl">
                <CountUp to={st.to} suffix={st.suffix} className="text-white" />
              </dd>
              <dt className="mt-3 text-base font-medium">{st.label}</dt>
              <p className="mx-auto mt-1.5 max-w-[14rem] text-sm leading-5 text-muted-foreground">{st.note}</p>
            </div>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}

/* ---------- Control centre ---------- */

/** Two angled phones. If /screens/control-center.webp exists it is shown instead. */
function ControlVisual({ s }: { s: Snapshot }) {
  const [custom, setCustom] = useState(true);
  return (
    <Motion variant="right" distance={60} className="min-w-0">
      <div className="relative h-[30rem] overflow-hidden rounded-3xl bg-surface sm:h-[35rem]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_55%_100%,rgb(214_255_102/0.22),transparent_70%)]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(rgb(255_255_255/0.12)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_45%,#000,transparent)]"
          aria-hidden="true"
        />
        {custom && (
          <img
            src="/screens/control-center.webp"
            alt="WalletWise on two phones, one showing the dashboard and one showing budgets"
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setCustom(false)}
          />
        )}
        {!custom && (
          <AngleStage className="absolute inset-x-0 top-10 h-full">
            <AnglePhone x={-92} y={44} rotY={24} rotZ={-9} z={1} delay={200}>
              <ActivityPhone s={s} scale={0.6} />
            </AnglePhone>
            <AnglePhone x={86} y={0} rotY={-18} rotZ={6} z={2} delay={350}>
              <HomePhone s={s} scale={0.66} />
            </AnglePhone>
          </AngleStage>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-surface to-transparent" />
      </div>
    </Motion>
  );
}

export function ControlCenter({ s }: { s: Snapshot }) {
  const items = [
    { icon: LayoutDashboard, title: 'Smart dashboard', body: 'Safe to spend, budget used and when the money runs out, at a glance.' },
    { icon: Plus, title: 'Quick add', body: 'An amount and a category. Works with no signal too.' },
    { icon: ChartPie, title: 'Budgets', body: 'Limits per category with alerts at 50, 80 and 100%.' },
    { icon: Target, title: 'Savings goals', body: 'See how much to set aside each day to reach one.' },
  ];
  return (
    <section className="py-16 lg:py-20">
      <Container className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="min-w-0">
          <Motion variant="left" distance={32}>
            <h2 className="max-w-md text-[2rem] leading-[1.1] font-medium text-balance sm:text-5xl sm:leading-[1.05]">Your money control center for hostel life</h2>
          </Motion>
          <Stagger as="ul" itemAs="li" step={90} start={150} className="mt-12 grid gap-x-8 gap-y-9 sm:grid-cols-2">
            {items.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <LimeIcon>
                  <Icon size={20} />
                </LimeIcon>
                <h3 className="mt-4 text-base font-medium">{title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{body}</p>
              </div>
            ))}
          </Stagger>
        </div>
        <ControlVisual s={s} />
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
    <section id="how-it-works" className="scroll-mt-28 py-16 lg:py-20">
      <Container>
        <Reveal>
          <Heading title="Up and running in a minute" sub="From install to your first safe-to-spend number, in three steps." />
        </Reveal>
        <ol className="mt-14 grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
          {steps.map(([t, b], i) => (
            <li key={t} className="py-8 md:px-10 md:py-2 md:first:pl-0 md:last:pr-0">
              <Motion delay={i * 120}>
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-lime text-lg font-semibold text-lime-ink shadow-[0_0_28px_-4px_rgb(214_255_102/0.55)]">{i + 1}</span>
                <h3 className="mt-8 text-base font-medium">{t}</h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{b}</p>
              </Motion>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/* ---------- Testimonials ---------- */

const AVATAR_HUES = ['#68a817', '#3b8be0', '#c98022', '#8c68e0', '#d0507e'];

function Avatar({ name, photo, i }: { name: string; photo?: string; i: number }) {
  const hue = AVATAR_HUES[i % AVATAR_HUES.length]!;
  return photo ? (
    <img src={photo} alt={name} width={44} height={44} loading="lazy" className="h-11 w-11 rounded-full object-cover ring-2 ring-white/10" />
  ) : (
    <span
      aria-hidden="true"
      className="grid h-11 w-11 place-items-center rounded-full text-base font-semibold ring-2 ring-white/10"
      style={{ background: `linear-gradient(135deg, ${hue}, color-mix(in oklab, ${hue} 45%, #000))`, color: '#fff' }}
    >
      {name.slice(0, 1)}
    </span>
  );
}

export function Testimonials() {
  const rail = useRef<HTMLUListElement>(null);
  const go = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * 340, behavior: 'smooth' });
  return (
    <section className="py-16 lg:py-20">
      <Container>
        <Reveal className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <Heading align="left" title="Trusted by students every day" sub="What people say about using WalletWise to manage their allowance." />
          <div className="flex gap-3">
            <button type="button" onClick={() => go(-1)} aria-label="Previous" className="grid h-11 w-11 place-items-center rounded-full bg-surface-3 text-white transition-colors hover:bg-white/20">
              <ChevronLeft size={20} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next" className="grid h-11 w-11 place-items-center rounded-full bg-surface-3 text-white transition-colors hover:bg-white/20">
              <ChevronRight size={20} />
            </button>
          </div>
        </Reveal>
        <ul ref={rail} className="mt-12 flex snap-x gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TESTIMONIALS.map((t, i) => (
            <li key={t.quote} className="w-[19rem] shrink-0 snap-start">
              <Motion delay={i * 110} variant="fade-up" className="h-full">
                <figure className="flex h-full flex-col rounded-3xl bg-surface p-6 transition-transform duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex gap-0.5 text-[#facc15]" aria-label="5 out of 5 stars">
                      {Array.from({ length: 5 }, (_, k) => (
                        <Star key={k} size={16} fill="currentColor" strokeWidth={0} />
                      ))}
                    </span>
                    {t.sample && <span className="rounded-full bg-surface-3 px-2.5 py-0.5 text-[0.65rem] tracking-wide text-muted-foreground uppercase">Sample</span>}
                  </div>
                  <blockquote className="mt-5 flex-1 text-[0.95rem] leading-7">{t.quote}</blockquote>
                  <figcaption className="mt-7 flex items-center gap-3">
                    <Avatar name={t.name} photo={t.photo} i={i} />
                    <span className="leading-tight">
                      <span className="block text-sm font-medium">{t.name}</span>
                      <span className="block text-xs text-muted-foreground">{t.role}</span>
                    </span>
                  </figcaption>
                </figure>
              </Motion>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ---------- Download ---------- */

function PlatformCard({ glyph, title, body, chips, meta, to }: { glyph: React.ReactNode; title: string; body: string; chips: string[]; meta: string; to: string }) {
  return (
    <Link
      to={to}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-lime/40"
    >
      <span aria-hidden="true" className="pointer-events-none absolute -right-6 -bottom-8 text-white/[0.04] transition-colors duration-300 group-hover:text-lime/10 [&>svg]:size-44">
        {glyph}
      </span>
      <div className="relative flex items-start justify-between">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-3 text-white transition-colors duration-300 group-hover:bg-lime group-hover:text-lime-ink [&>svg]:size-7">{glyph}</span>
        <span className="rounded-full border border-line-strong px-3 py-1 text-xs text-muted-foreground">{meta}</span>
      </div>
      <h3 className="relative mt-7 text-2xl font-medium">{title}</h3>
      <p className="relative mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
      <ul className="relative mt-5 flex flex-1 flex-wrap content-start gap-2">
        {chips.map((c) => (
          <li key={c} className="rounded-full bg-surface-3 px-3 py-1 text-xs text-white/80">
            {c}
          </li>
        ))}
      </ul>
      <span className="relative mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-lime px-6 py-3.5 text-sm font-medium text-lime-ink transition-opacity group-hover:opacity-90">
        Show me how <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export function DownloadCards() {
  return (
    <section id="download" className="scroll-mt-28 py-16 lg:py-20">
      <Container>
        <Reveal>
          <Heading title="Get WalletWise" sub="Which device are you on? Pick one and we will show you how, step by step." />
        </Reveal>
        <Stagger step={110} className="mt-14 grid gap-4 lg:grid-cols-3" itemClassName="h-full">
          <PlatformCard glyph={<AppleGlyph />} title="Mac and iPhone" body="Add it to your Home Screen or Dock from Safari." chips={['iPhone', 'iPad', 'Mac', 'Safari']} meta="1 minute" to="/install/apple" />
          <PlatformCard glyph={<WindowsGlyph />} title="Windows and Linux" body="Install it in one click from Chrome or Edge." chips={['Windows 10 and 11', 'Linux', 'Chrome', 'Edge']} meta="30 seconds" to="/install/windows" />
          <PlatformCard glyph={<AndroidGlyph />} title="Android" body="Install the web app, or the APK for SMS capture." chips={['Web app', 'APK', 'SMS capture']} meta="2 minutes" to="/install/android" />
        </Stagger>
      </Container>
    </section>
  );
}

/* ---------- Privacy ---------- */

const PRIVACY_STEPS = [
  { icon: MessageSquareText, title: 'Read on the phone', body: 'The app looks at messages since your last scan, on your device and nowhere else.' },
  { icon: Filter, title: 'Filter by sender', body: 'Only known bank sender IDs pass. OTPs, promotions and personal chats never reach the app.' },
  { icon: Lock, title: 'Parse on the device', body: 'The amount, merchant, last 4 digits and reference are pulled out right there.' },
  { icon: Send, title: 'Send only the fields', body: 'The server receives those few fields. The message itself stays on your phone.' },
];

export function PrivacyFlow() {
  const stays = ['The full message text', 'OTPs and verification codes', 'Personal chats', 'Promotions'];
  const sent = [
    ['Amount', '₹85'],
    ['Merchant', 'Canteen'],
    ['Last 4 digits', '1234'],
    ['Reference', '4455667788'],
  ];
  return (
    <div className="mt-16 grid items-start gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
      <ol className="relative">
        <span className="absolute top-8 bottom-8 left-[1.65rem] w-px bg-gradient-to-b from-lime/60 via-line-strong to-transparent" aria-hidden="true" />
        {PRIVACY_STEPS.map(({ icon: Icon, title, body }, i) => (
          <li key={title} className="relative">
            <Motion variant="left" distance={28} delay={i * 110}>
              <div className="flex gap-5 py-5 sm:gap-6">
                <span className="relative z-10 grid h-[3.3rem] w-[3.3rem] shrink-0 place-items-center rounded-2xl bg-lime text-lime-ink shadow-[0_0_30px_-6px_rgb(214_255_102/0.6)]">
                  <Icon size={22} />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-medium text-lime">Step 0{i + 1}</p>
                  <h3 className="mt-1 text-xl font-medium sm:text-2xl">{title}</h3>
                  <p className="mt-2 max-w-md text-[0.95rem] leading-7 text-muted-foreground">{body}</p>
                </div>
              </div>
            </Motion>
          </li>
        ))}
      </ol>

      <Motion variant="right" distance={40}>
        <div className="space-y-3 lg:sticky lg:top-28">
          <div className="rounded-3xl border border-line bg-surface p-6">
            <p className="flex items-center gap-2 text-sm font-medium">
              <EyeOff size={16} className="text-muted-foreground" /> Stays on your phone
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {stays.map((x) => (
                <li key={x} className="flex items-center gap-2 rounded-xl bg-surface-3 px-3 py-2.5 text-sm text-muted-foreground">
                  <Lock size={13} className="shrink-0" /> {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center py-0.5" aria-hidden="true">
            <Float amplitude={4} duration={2.4}>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-lime/15 text-lime">
                <ChevronDown size={18} />
              </span>
            </Float>
          </div>
          <div className="rounded-3xl border border-lime/30 bg-lime/[0.06] p-6">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Wifi size={16} className="text-lime" /> Sent to the server
            </p>
            <dl className="mt-4 grid gap-2 sm:grid-cols-2">
              {sent.map(([k, v]) => (
                <div key={k} className="rounded-xl bg-ink/60 px-3 py-2.5">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="mt-0.5 text-sm font-medium tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Motion>
    </div>
  );
}

/* ---------- FAQ ---------- */

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-28 py-16 lg:py-20">
      <Container className="max-w-3xl">
        <Reveal>
          <Heading title="Frequently asked questions" sub="Quick answers about using the app securely and confidently." />
        </Reveal>
        <Stagger step={70} className="mt-12 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-2xl bg-surface px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-medium [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown size={20} className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}

/* ---------- Final CTA ---------- */

export function FinalCta() {
  return (
    <section className="py-16 lg:py-20">
      <Container>
        <Motion variant="scale">
          <div className="relative overflow-hidden rounded-3xl bg-surface px-6 py-16 text-center sm:py-20">
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-60 bg-[radial-gradient(ellipse_60%_100%_at_50%_100%,rgb(214_255_102/0.25),transparent)]" />
            <h2 className="relative mx-auto max-w-2xl text-[2rem] leading-[1.1] font-medium text-balance sm:text-5xl sm:leading-[1.05]">Take control of your money today</h2>
            <p className="relative mx-auto mt-5 max-w-lg text-lg leading-7 text-muted-foreground">Install WalletWise and know what is safe to spend before you reach the canteen.</p>
            <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <DownloadButton />
              <Link to="/features" className={`${pillGhost} px-7 py-4 text-base`}>
                See all features <ArrowRight size={16} />
              </Link>
            </div>
            <PlatformLine className="relative mt-6" />
          </div>
        </Motion>
      </Container>
    </section>
  );
}
