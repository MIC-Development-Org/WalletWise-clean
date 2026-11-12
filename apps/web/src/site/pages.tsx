import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check, Minus } from 'lucide-react';
import { Reveal } from '../components/Reveal';
import { WorkflowGrid } from '../components/workflow-grid';
import { PAGES, Seo } from './seo';
import { Bento } from './Bento';
import { DeviceShowcase } from './DeviceShowcase';
import { StackCard, StackCards } from './StackCards';
import { ApkLink, Container, Heading, pillGhost } from './parts';
import { AddPhone, BudgetsPhone, HomePhone, ReviewPhone, useSample } from './previews';
import { ControlCenter, DownloadCards, Faq, FinalCta, Hero, Numbers, Steps, Testimonials } from './sections';

/* ---------- Home ---------- */

export function HomePage() {
  const s = useSample();
  return (
    <>
      <Seo page={PAGES.home} />
      <Hero s={s} />
      <Numbers />
      <section className="py-16 lg:py-20">
        <Container>
          <Reveal>
            <Heading
              title="Your everyday money, simplified"
              sub="From a quick coffee to the mess fee, WalletWise brings the essentials into one clean, fast app built for a student budget."
            />
          </Reveal>
          <div className="mt-14">
            <Bento s={s} />
          </div>
        </Container>
      </section>
      <ControlCenter s={s} />
      <DeviceShowcase />
      <Steps />
      <Testimonials />
      <DownloadCards />
      <Faq />
      <FinalCta />
    </>
  );
}

/* ---------- Features ---------- */

function FeatureRow({
  index,
  title,
  body,
  bullets,
  cta,
  phone,
}: {
  index: number;
  title: string;
  body: string;
  bullets: string[];
  cta: { to: string; label: string };
  phone: ReactNode;
}) {
  return (
    <StackCard index={index} className="grid gap-3 p-3 shadow-[0_-24px_48px_-24px_rgb(0_0_0/0.7)] lg:grid-cols-2">
      <div className="flex flex-col justify-center px-5 py-8 lg:px-12">
        <h3 className="text-[1.75rem] leading-tight font-medium sm:text-4xl">{title}</h3>
        <p className="mt-4 text-base leading-7 text-muted-foreground">{body}</p>
        <ul className="mt-6 space-y-2.5 text-sm text-muted-foreground">
          {bullets.map((b) => (
            <li key={b} className="flex gap-3">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted" />
              {b}
            </li>
          ))}
        </ul>
        <div className="mt-8">
          <Link to={cta.to} className={pillGhost}>
            {cta.label}
          </Link>
        </div>
      </div>
      <div className="relative flex h-[27rem] items-start justify-center overflow-hidden rounded-2xl bg-surface-3 pt-12 sm:h-[31rem]">
        <div className="rotate-[7deg]">{phone}</div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-surface-3 to-transparent" />
      </div>
    </StackCard>
  );
}

export function FeaturesPage() {
  const s = useSample();
  return (
    <>
      <Seo page={PAGES.features} />
      <section className="py-16 lg:py-20">
        <Container>
          <Reveal>
            <Heading
              title="Your everyday money, simplified"
              sub="From logging a canteen bill to checking what is safe to spend, everything is built for speed, clarity and privacy."
            />
          </Reveal>
          <div className="mt-14">
            <Bento s={s} />
          </div>
        </Container>
      </section>

      <section className="py-16 lg:py-20">
        <Container>
          <Reveal>
            <Heading
              title="Everything you need to stay on top"
              sub="Four things that do the work, so you do not have to."
            />
          </Reveal>
          <div className="mt-14">
            <StackCards>
            <FeatureRow
              index={0}
              title="Smart dashboard"
              body="One screen answers the only question that matters on a fixed allowance: what can I spend today?"
              bullets={['Safe to spend today and when the money runs out', 'Budget used, with marks at 50 and 80%', 'Each day against the pace that fits your budget']}
              cta={{ to: '/app', label: 'Open web app' }}
              phone={<HomePhone s={s} scale={0.66} />}
            />
            <FeatureRow
              index={1}
              title="Quick add and capture"
              body="Type an amount and tap a category, or let Android read your bank SMS and fill it in for you."
              bullets={['Amount and category in about ten seconds', 'Android reads bank SMS on the phone, never uploading the text', 'Works offline and syncs when you are back']}
              cta={{ to: '/compare', label: 'Compare platforms' }}
              phone={<AddPhone s={s} scale={0.66} />}
            />
            <FeatureRow
              index={2}
              title="Budgets and goals"
              body="Cap the things that run away, and save towards the things you want, with a daily amount to aim for."
              bullets={['A limit per category and an overall cycle budget', 'One alert each at 50, 80 and 100%, then quiet', 'Cycles start on your allowance day']}
              cta={{ to: '/#faq', label: 'Read the FAQ' }}
              phone={<BudgetsPhone s={s} scale={0.66} />}
            />
            <FeatureRow
              index={3}
              title="Review, never guess"
              body="If a message is unclear or a payment looks like a duplicate, it waits for you instead of being saved on a hunch."
              bullets={['Unsure captures go to a review list', 'Same reference number is one payment, close matches are flagged', 'Nothing is silently merged or dropped']}
              cta={{ to: '#privacy', label: 'How privacy works' }}
              phone={<ReviewPhone s={s} scale={0.66} />}
            />
            </StackCards>
          </div>
        </Container>
      </section>

      <WorkflowGrid className="py-16 lg:py-24" />

      <FinalCta />
    </>
  );
}

/* ---------- Compare ---------- */

type Cell = true | false | string;
const ROWS: { label: string; cells: [Cell, Cell, Cell] }[] = [
  { label: 'Install as an app', cells: [true, true, true] },
  { label: 'Quick add and offline entry', cells: [true, true, true] },
  { label: 'Budgets and savings goals', cells: [true, true, true] },
  { label: 'Dashboard and insights', cells: [true, true, true] },
  { label: 'Sync across your devices', cells: [true, true, true] },
  { label: 'Bank SMS capture', cells: [false, false, true] },
  { label: 'Review list for unsure captures', cells: [true, true, true] },
  { label: 'Push notifications', cells: [true, 'Home Screen app', true] },
  { label: 'Bank email capture (Gmail)', cells: ['Soon', 'Soon', 'Soon'] },
  { label: 'Bill scan', cells: ['Soon', 'Soon', 'Soon'] },
];

function Mark({ v }: { v: Cell }) {
  if (v === true) return <Check size={18} className="mx-auto" aria-label="Included" />;
  if (v === false) return <Minus size={18} className="mx-auto text-faint" aria-label="Not available" />;
  return <span className="text-sm text-muted-foreground">{v}</span>;
}

export function ComparePage() {
  const head = 'rounded-2xl border border-line px-5 py-6 text-center';
  const small = 'mt-5 inline-flex w-full items-center justify-center rounded-full border border-line-strong px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface-3';
  return (
    <>
      <Seo page={PAGES.compare} />
      <section className="py-16 lg:py-20">
        <Container>
          <Reveal>
            <Heading
              title="Compare platforms"
              sub="Same account and same app everywhere. The difference is how entries get in, and Android is the only one that reads SMS."
            />
          </Reveal>

          <Reveal className="mt-14">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] border-separate border-spacing-x-3 border-spacing-y-0 text-left">
                <caption className="sr-only">Feature comparison across web and laptop, iPhone and Mac, and Android</caption>
                <thead>
                  <tr>
                    <th scope="col" className="w-[26%] pr-4 pb-4 align-top">
                      <p className="text-base font-medium">How you install</p>
                      <p className="mt-2 text-sm leading-6 font-normal text-muted-foreground">
                        Every option is free and uses one account. Pick the one that matches your device.
                      </p>
                    </th>
                    <th scope="col" className="pb-4 align-top font-normal">
                      <div className={head}>
                        <p className="text-base font-medium">Web and laptop</p>
                        <p className="mt-1 text-sm text-muted-foreground">Chrome, Edge, Safari</p>
                        <Link to="/app" className={small}>
                          Open web app
                        </Link>
                      </div>
                    </th>
                    <th scope="col" className="pb-4 align-top font-normal">
                      <div className={head}>
                        <p className="text-base font-medium">iPhone and Mac</p>
                        <p className="mt-1 text-sm text-muted-foreground">Add to Home Screen or Dock</p>
                        <Link to="/install/apple" className={small}>
                          Show me how
                        </Link>
                      </div>
                    </th>
                    <th scope="col" className="rounded-t-3xl bg-surface px-3 pt-3 pb-4 align-top font-normal">
                      <div className="px-2 py-3 text-center">
                        <p className="text-base font-medium">Android</p>
                        <p className="mt-1 text-sm text-muted-foreground">With SMS capture</p>
                        <ApkLink
                          className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-lime px-4 py-2.5 text-sm font-medium text-lime-ink hover:opacity-90"
                          pending="Publishing soon"
                        >
                          Download APK
                        </ApkLink>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((r, i) => (
                    <tr key={r.label}>
                      <th scope="row" className="border-t border-line py-5 pr-4 text-sm font-normal text-muted-foreground">
                        {r.label}
                      </th>
                      {r.cells.map((c, j) => (
                        <td key={j} className={`border-t border-line py-5 text-center ${j === 2 ? `bg-surface ${i === ROWS.length - 1 ? 'rounded-b-3xl' : ''}` : ''}`}>
                          <Mark v={c} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-6 text-center text-sm text-faint">Items marked Soon are on the roadmap and not available yet.</p>
          </Reveal>
        </Container>
      </section>
      <Faq />
      <FinalCta />
    </>
  );
}
