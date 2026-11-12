import type { ReactNode } from 'react';
import { Code, KeyRound, Smartphone } from 'lucide-react';
import { Motion, Stagger } from '@/components/motion';
import { Container, Heading } from '@/site/parts';

/*
  Three numbered circles in the style of Quarry UI's Workflow Grid, written plainly for WalletWise:
  flat dark surface, thin borders, one lime accent for the numbers. No glow, no gradient.
*/

type Item = { n: string; icon: ReactNode; title: string; body: string; proof: string };

const ITEMS: Item[] = [
  {
    n: '01',
    icon: <Smartphone className="size-10" strokeWidth={1.4} />,
    title: 'Messages stay on your phone',
    body: 'Your bank SMS is read and parsed on the phone. The text is never uploaded. Only the extracted fields are sent.',
    proof: 'Amount, merchant, last 4 digits, reference',
  },
  {
    n: '02',
    icon: <KeyRound className="size-10" strokeWidth={1.4} />,
    title: 'Passwords are hashed',
    body: 'Argon2id hashing resists GPU cracking. Sessions rotate on every refresh, and a reused token signs everything out.',
    proof: '15 minute tokens, reuse detection',
  },
  {
    n: '03',
    icon: <Code className="size-10" strokeWidth={1.4} />,
    title: 'Open source, by students',
    body: 'The code is open for anyone to read and check. Built by Team G of the Microsoft Innovations Club, VIT Chennai.',
    proof: 'Free, made for hostel life',
  },
];

export function WorkflowGrid({ className = '' }: { className?: string }) {
  return (
    <section id="privacy" className={`scroll-mt-28 ${className}`}>
      <Container>
        <Motion>
          <Heading
            title="Private by design"
            sub="Reading SMS is sensitive, so WalletWise is built to never need your raw messages."
          />
        </Motion>

        <div className="relative mx-auto mt-16 max-w-5xl">
          {/* The thin line that runs through the three circles on wide screens. */}
          <div aria-hidden="true" className="absolute inset-x-[16%] top-[4.5rem] hidden border-t border-dashed border-line-strong md:block" />
          <Stagger as="ol" itemAs="li" step={120} className="relative grid gap-14 md:grid-cols-3 md:gap-8">
            {ITEMS.map((it) => (
              <div key={it.n} className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="grid size-36 place-items-center rounded-full border border-line-strong bg-surface text-foreground">{it.icon}</div>
                  <span className="absolute -top-1 -right-1 rounded-full bg-lime px-2.5 py-1 text-xs font-semibold text-lime-ink">{it.n}</span>
                </div>
                <h3 className="mt-8 text-xl font-medium">{it.title}</h3>
                <p className="mt-3 max-w-xs text-[0.95rem] leading-7 text-muted-foreground">{it.body}</p>
                <p className="mt-5 border-t border-line pt-4 text-xs text-muted-foreground/80">{it.proof}</p>
              </div>
            ))}
          </Stagger>
        </div>
      </Container>
    </section>
  );
}
