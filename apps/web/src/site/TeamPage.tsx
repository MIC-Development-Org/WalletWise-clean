import { Globe } from 'lucide-react';
import { Reveal } from '../components/Reveal';
import { GithubGlyph, LinkedinGlyph } from './glyphs';
import { Container, Heading } from './parts';
import { PAGES, Seo } from './seo';
import { LEAD, MEMBERS, type Member } from './team';

const initials = (n: string) =>
  n
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');

const HUES = ['#D6FF66', '#7dd3fc', '#f9a8d4', '#fcd34d', '#a5b4fc', '#86efac'];

const icon =
  'grid size-10 place-items-center rounded-full border border-white/10 text-white/70 transition-colors hover:border-[#D6FF66]/60 hover:text-[#D6FF66] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6FF66]';

function Links({ m }: { m: Member }) {
  const items = [
    { href: m.github, label: 'GitHub', node: <GithubGlyph className="size-4" /> },
    { href: m.linkedin, label: 'LinkedIn', node: <LinkedinGlyph className="size-4" /> },
    { href: m.website, label: 'website', node: <Globe className="size-4" /> },
  ].filter((i) => i.href);
  return (
    <div className="flex h-10 justify-center gap-2">
      {items.map((i) => (
        <a key={i.label} href={i.href} target="_blank" rel="noreferrer" aria-label={`${m.name} on ${i.label}`} className={icon}>
          {i.node}
        </a>
      ))}
    </div>
  );
}

/** Every person gets the same card: square portrait, name, role, batch, and a fixed-height link row. */
function MemberCard({ m, i }: { m: Member; i: number }) {
  const lead = m === LEAD;
  return (
    <article className={`flex h-full flex-col items-center rounded-3xl border p-6 text-center ${lead ? 'border-[#D6FF66]/40 bg-[#D6FF66]/[0.04]' : 'border-white/10 bg-white/[0.03]'}`}>
      <div className="aspect-square w-full max-w-[11rem] overflow-hidden rounded-2xl">
        {m.photo ? (
          <img src={m.photo} alt={m.name} width={176} height={176} loading="lazy" className="size-full object-cover" />
        ) : (
          <div aria-hidden="true" className="grid size-full place-items-center text-5xl font-semibold text-black" style={{ background: HUES[i % HUES.length] }}>
            {initials(m.name)}
          </div>
        )}
      </div>
      <h3 className="mt-5 text-xl font-medium tracking-tight">{m.name}</h3>
      <p className={`mt-1 text-sm ${lead ? 'text-[#D6FF66]' : 'text-white/60'}`}>{m.role}</p>
      <p className="text-sm text-white/40">{m.batch}</p>
      <div className="mt-auto w-full pt-5">
        <Links m={m} />
      </div>
    </article>
  );
}

function Backer({ src, alt, name, line, wide }: { src: string; alt: string; name: string; line: string; wide?: boolean }) {
  return (
    <div className="flex h-full flex-col items-center rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center sm:p-8">
      <div className="grid h-24 place-items-center">
        <img src={src} alt={alt} loading="lazy" className={`max-h-24 w-auto object-contain ${wide ? 'max-w-[15rem]' : 'max-w-[6rem]'}`} />
      </div>
      <h3 className="mt-5 text-lg font-medium">{name}</h3>
      <p className="mt-1 text-sm text-white/60">{line}</p>
    </div>
  );
}

export function TeamPage() {
  return (
    <>
      <Seo page={PAGES.team} />
      <section className="pb-10 pt-32 sm:pt-40">
        <Container>
          <Reveal>
            <p className="mb-3 text-center text-sm font-medium uppercase tracking-widest text-[#D6FF66]">Team G</p>
            <Heading
              title="Undercut Engineers"
              sub="Six students from the Microsoft Innovations Club, VIT Chennai, building WalletWise this project cycle for people who live on a hostel allowance."
            />
          </Reveal>
        </Container>
      </section>

      <section className="py-8">
        <Container>
          <ul className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {MEMBERS.map((m, i) => (
              <li key={m.name}>
                <Reveal delay={(i % 3) * 70} className="h-full">
                  <MemberCard m={m} i={i} />
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="pb-24 pt-12">
        <Container>
          <Reveal>
            <h2 className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-white/40">Where we build</h2>
          </Reveal>
          <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
            <Reveal className="h-full">
              <Backer src="/team/mic.png" alt="Microsoft Innovations Club logo" name="Microsoft Innovations Club" line="The student club that runs the project cycle." />
            </Reveal>
            <Reveal delay={80} className="h-full">
              <Backer src="/team/vit.png" alt="VIT Chennai logo" name="VIT Chennai" line="Our campus, and the hostels we built this for." wide />
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
