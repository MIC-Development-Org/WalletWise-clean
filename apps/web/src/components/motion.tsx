import { Children, useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';

/**
 * One place for every landing page animation, so a section never hand-rolls its own.
 *  - Motion: reveal an element when it scrolls into view (several styles)
 *  - Stagger: reveal a list of children one after another
 *  - CountUp: a number that counts up from zero when it appears
 *  - Float: a gentle idle bob for chips and devices
 *  - Parallax: drifts at a different speed from the scroll
 * All of them do nothing for visitors who prefer reduced motion.
 */

export type MotionVariant = 'fade-up' | 'fade-down' | 'left' | 'right' | 'scale' | 'blur' | 'rise';

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True once the element has been on screen. Fires once. */
export function useInView<T extends Element>(threshold = 0.15, rootMargin = '0px 0px -8% 0px') {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);
  return [ref, seen] as const;
}

export function Motion({
  children,
  variant = 'fade-up',
  delay = 0,
  distance,
  as,
  className,
  style,
}: {
  children: ReactNode;
  variant?: MotionVariant;
  /** Milliseconds. */
  delay?: number;
  /** Pixels the element travels. */
  distance?: number;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}) {
  const Tag = (as ?? 'div') as ElementType;
  const [ref, seen] = useInView<HTMLElement>();
  return (
    <Tag
      ref={ref}
      data-motion={variant}
      className={`${className ?? ''} ${seen ? 'is-in' : ''}`.trim()}
      style={{ ['--motion-delay' as string]: `${delay}ms`, ...(distance !== undefined && { ['--motion-distance' as string]: `${distance}px` }), ...style }}
    >
      {children}
    </Tag>
  );
}

/** Reveals each child in turn. Children keep their own layout, so wrap list items in their own element. */
export function Stagger({
  children,
  step = 90,
  start = 0,
  variant = 'fade-up',
  className,
  itemClassName,
  as,
  itemAs,
}: {
  children: ReactNode;
  step?: number;
  start?: number;
  variant?: MotionVariant;
  className?: string;
  itemClassName?: string;
  as?: ElementType;
  itemAs?: ElementType;
}) {
  const Tag = (as ?? 'div') as ElementType;
  return (
    <Tag className={className}>
      {Children.toArray(children).map((child, i) => (
        <Motion key={i} variant={variant} delay={start + i * step} className={itemClassName} as={itemAs}>
          {child}
        </Motion>
      ))}
    </Tag>
  );
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Counts from `from` up to `to` once, when it scrolls into view. */
export function CountUp({
  to,
  from = 0,
  duration = 1600,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: {
  to: number;
  from?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const [ref, seen] = useInView<HTMLSpanElement>(0.4);
  const [value, setValue] = useState(prefersReducedMotion() ? to : from);

  useEffect(() => {
    if (!seen) return;
    if (prefersReducedMotion()) {
      setValue(to);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      setValue(from + (to - from) * easeOutCubic(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, from, duration]);

  return (
    <span ref={ref} className={className} aria-label={`${prefix}${to}${suffix}`}>
      <span aria-hidden="true" className="tabular-nums">
        {prefix}
        {value.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
        {suffix}
      </span>
    </span>
  );
}

/** A gentle idle bob. Offset `delay` between neighbours so they do not move in lockstep. */
export function Float({
  children,
  amplitude = 10,
  duration = 6,
  delay = 0,
  className,
}: {
  children: ReactNode;
  amplitude?: number;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={`motion-float ${className ?? ''}`}
      style={{ ['--float-amp' as string]: `${amplitude}px`, ['--float-dur' as string]: `${duration}s`, ['--float-delay' as string]: `${delay}s` }}
    >
      {children}
    </div>
  );
}

/** Moves a little against the scroll. `speed` of 0.1 shifts by 10% of the distance scrolled past the element. */
export function Parallax({ children, speed = 0.08, className }: { children: ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const center = r.top + r.height / 2 - window.innerHeight / 2;
      el.style.transform = `translate3d(0, ${(-center * speed).toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed]);
  return (
    <div ref={ref} className={className} style={{ willChange: 'transform' }}>
      {children}
    </div>
  );
}
