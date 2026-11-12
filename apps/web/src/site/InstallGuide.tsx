import { useState } from 'react';
import { ArrowLeft, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal } from '../components/Reveal';
import { GUIDES, guideBySlug, type Guide, type GuideSection, type Step } from './guides';
import { ApkLink, Container } from './parts';
import { PAGES, Seo } from './seo';

const AT: Record<NonNullable<Step['at']>, string> = {
  'top-left': 'left-[14%] top-[13%]',
  'top-right': 'right-[8%] top-[13%]',
  center: 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
  bottom: 'left-1/2 bottom-[10%] -translate-x-1/2',
  'bottom-right': 'right-[10%] bottom-[12%]',
};

/** The highlighted spot, like the red circle in a Scribe capture. */
function Target({ step }: { step: Step }) {
  const Icon = step.icon;
  return (
    <div className={`absolute z-10 flex flex-col items-center gap-2 ${AT[step.at ?? 'center']}`}>
      <span className="relative grid size-12 place-items-center rounded-full bg-lime text-lime-ink shadow-[0_0_0_6px_rgb(214_255_102/0.22)]">
        <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-lime/40" />
        <Icon size={20} className="relative" aria-hidden="true" />
      </span>
      {step.target && <span className="whitespace-nowrap rounded-full bg-lime px-3 py-1 text-xs font-semibold text-lime-ink">{step.target}</span>}
    </div>
  );
}

const bar = 'rounded-full bg-white/[0.07]';

/** Stand-in picture used until a real screenshot is dropped into /public/install. */
function Template({ step, frame }: { step: Step; frame: 'phone' | 'browser' }) {
  if (frame === 'phone') {
    return (
      <div className="relative mx-auto aspect-[9/17] h-[26rem] max-w-full overflow-hidden rounded-[2.2rem] border-[6px] border-line-strong bg-ink" aria-hidden="true">
        <div className="mx-auto mt-2 h-5 w-24 rounded-full bg-line-strong" />
        <div className="space-y-3 px-5 pt-6">
          <div className={`h-5 w-2/3 ${bar}`} />
          <div className={`h-3 w-1/2 ${bar}`} />
          <div className="mt-5 h-24 rounded-2xl bg-white/[0.05]" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-white/[0.07]" />
              <div className="flex-1 space-y-2">
                <div className={`h-3 w-3/4 ${bar}`} />
                <div className={`h-2.5 w-1/2 ${bar}`} />
              </div>
            </div>
          ))}
        </div>
        <Target step={step} />
      </div>
    );
  }
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-line-strong bg-ink" aria-hidden="true">
      <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
        </div>
        <div className={`h-6 flex-1 ${bar}`} />
        <div className="size-5 rounded bg-white/[0.07]" />
      </div>
      <div className="grid grid-cols-[1fr_2fr] gap-5 p-6">
        <div className="space-y-3">
          <div className={`h-5 w-3/4 ${bar}`} />
          <div className={`h-3 w-full ${bar}`} />
          <div className={`h-3 w-5/6 ${bar}`} />
        </div>
        <div className="space-y-3">
          <div className="h-24 rounded-2xl bg-white/[0.05]" />
          <div className={`h-3 w-2/3 ${bar}`} />
          <div className={`h-3 w-1/2 ${bar}`} />
        </div>
      </div>
      <Target step={step} />
    </div>
  );
}

/** A real screenshot when the file exists, otherwise the template picture. */
function Shot({ step, frame }: { step: Step; frame: 'phone' | 'browser' }) {
  const [ok, setOk] = useState(Boolean(step.shot));
  return (
    <div className="rounded-3xl border border-line bg-surface p-4 sm:p-6">
      {ok && step.shot ? (
        <img
          src={`/install/${step.shot}`}
          alt={`Screenshot: ${step.title}`}
          loading="lazy"
          onError={() => setOk(false)}
          className="mx-auto max-h-[30rem] w-auto max-w-full rounded-xl object-contain"
        />
      ) : (
        <Template step={step} frame={frame} />
      )}
    </div>
  );
}

function StepRow({ step, n, frame }: { step: Step; n: number; frame: 'phone' | 'browser' }) {
  const Icon = step.icon;
  return (
    <li>
      <Reveal className="grid gap-6 py-8 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-12 lg:py-10">
        <div>
          <span className="grid size-11 place-items-center rounded-full bg-lime text-base font-semibold text-lime-ink">{n}</span>
          <h3 className="mt-5 flex items-start gap-2.5 text-xl font-medium">
            <Icon size={20} className="mt-1 shrink-0 text-lime" aria-hidden="true" /> {step.title}
          </h3>
          <p className="mt-3 leading-7 text-muted-foreground">{step.body}</p>
        </div>
        <Shot step={step} frame={frame} />
      </Reveal>
    </li>
  );
}

function Section({ s }: { s: GuideSection }) {
  return (
    <section id={s.id} className="scroll-mt-28 border-t border-line pt-14 first:border-t-0 first:pt-0">
      <Reveal>
        <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">{s.title}</h2>
        {s.intro && <p className="mt-3 max-w-2xl text-lg leading-8 text-muted-foreground">{s.intro}</p>}
        {s.apk && (
          <div className="mt-6">
            <ApkLink
              className="inline-flex items-center justify-center gap-2 rounded-full bg-lime px-6 py-3.5 text-sm font-medium text-lime-ink hover:opacity-90"
              pending="APK coming soon"
            >
              <Smartphone size={16} /> Download the APK
            </ApkLink>
          </div>
        )}
      </Reveal>
      {s.steps.length > 0 && (
        <ol className="mt-6 divide-y divide-line">
          {s.steps.map((st, i) => (
            <StepRow key={st.title} step={st} n={i + 1} frame={s.frame} />
          ))}
        </ol>
      )}
      {s.note && <p className="mt-6 max-w-3xl rounded-2xl border border-line bg-surface px-6 py-5 leading-7 text-muted-foreground">{s.note}</p>}
    </section>
  );
}

const SEO_KEY = { apple: 'installApple', windows: 'installWindows', android: 'installAndroid' } as const;

export function InstallGuidePage({ slug }: { slug: Guide['slug'] }) {
  const g = guideBySlug(slug);
  const others = GUIDES.filter((x) => x.slug !== slug);
  return (
    <>
      <Seo page={PAGES[SEO_KEY[slug]]} />
      <section className="pb-24 pt-32 sm:pt-40">
        <Container className="max-w-6xl">
          <Link to="/#download" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-white">
            <ArrowLeft size={16} /> All devices
          </Link>

          <header className="mt-6 grid items-end gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <h1 className="text-4xl font-medium tracking-tight text-balance sm:text-6xl">Install WalletWise on {g.name}</h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">{g.lead}</p>
            </div>
            <nav aria-label="On this page" className="lg:justify-self-end">
              <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/40">On this page</p>
              <ul className="flex flex-wrap gap-2">
                {g.sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="inline-flex rounded-full border border-line-strong px-4 py-2 text-sm transition-colors hover:bg-surface-3">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </header>

          <div className="mt-14 space-y-14">
            {g.sections.map((s) => (
              <Section key={s.id} s={s} />
            ))}
          </div>

          <Reveal>
            <div className="mt-20 grid items-center gap-8 rounded-3xl bg-surface p-8 sm:p-10 lg:grid-cols-[1fr_auto]">
              <div>
                <h2 className="text-3xl font-medium tracking-tight">All done</h2>
                <p className="mt-3 max-w-md text-muted-foreground">Sign in once and your entries sync across every device you use.</p>
                <Link to="/app" className="mt-7 inline-flex items-center justify-center rounded-full bg-lime px-6 py-3.5 text-sm font-medium text-lime-ink hover:opacity-90">
                  Open the web app
                </Link>
              </div>
              <div className="flex items-end gap-5">
                {g.after.map((a) => (
                  <img key={a.src} src={a.src} alt={a.alt} loading="lazy" className={`w-auto max-w-full rounded-2xl ${a.tall ? 'h-64' : 'h-44 sm:h-56'}`} />
                ))}
              </div>
            </div>
          </Reveal>

          <nav aria-label="Other devices" className="mt-12 flex flex-wrap items-center gap-3">
            <p className="mr-2 text-sm text-muted-foreground">Another device?</p>
            {others.map((o) => (
              <Link key={o.slug} to={`/install/${o.slug}`} className="inline-flex rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium transition-colors hover:bg-surface-3">
                {o.name}
              </Link>
            ))}
          </nav>
        </Container>
      </section>
    </>
  );
}
