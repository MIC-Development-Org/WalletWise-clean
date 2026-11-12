import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Cards that stick under the header one after another, each sliding over the last.
 * The covered card shrinks and dims slightly as the next one arrives. Children must be the cards
 * themselves, and each needs `lg:sticky` plus a `top` offset (see StackCard).
 */
export function StackCards({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const cards = [...root.children] as HTMLElement[];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const wide = window.matchMedia('(min-width: 1024px)');
    let raf = 0;

    const update = () => {
      raf = 0;
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (!next || !wide.matches || reduce.matches) {
          card.style.setProperty('--s', '1');
          card.style.setProperty('--d', '0');
          return;
        }
        const stickyTop = parseFloat(getComputedStyle(card).top) || 0;
        // How far the next card still is from covering this one: 0 = fully covered.
        const gap = next.getBoundingClientRect().top - stickyTop;
        const p = Math.min(1, Math.max(0, 1 - gap / card.offsetHeight));
        card.style.setProperty('--s', String(1 - 0.05 * p));
        card.style.setProperty('--d', String(p * 0.55));
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="space-y-6 lg:space-y-14">
      {children}
    </div>
  );
}

export function StackCard({ index, children, className = '' }: { index: number; children: ReactNode; className?: string }) {
  return (
    <article
      className={`rounded-3xl bg-surface will-change-transform lg:sticky ${className}`}
      style={{
        top: `calc(6rem + ${index * 1.1}rem)`,
        transform: 'scale(var(--s, 1))',
        transformOrigin: 'top center',
        filter: 'brightness(calc(1 - var(--d, 0)))',
      }}
    >
      {children}
    </article>
  );
}
