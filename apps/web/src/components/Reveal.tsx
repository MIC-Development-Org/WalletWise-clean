import type { ReactNode } from 'react';
import { Motion, type MotionVariant } from './motion';

/** The default reveal: fade up when scrolled into view. Kept as a short name; it is Motion underneath. */
export function Reveal({
  children,
  delay = 0,
  className = '',
  variant = 'fade-up',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  variant?: MotionVariant;
}) {
  return (
    <Motion variant={variant} delay={delay} className={className}>
      {children}
    </Motion>
  );
}
