import type { ReactNode } from 'react';
import { Motion } from '../components/motion';

/**
 * A phone placed in 3D space. The parent supplies perspective, so rotating around the Y axis gives
 * real depth: the far edge shrinks, the way a photographed phone does.
 */
export interface Placement {
  /** Pixels from the centre, left to right. */
  x?: number;
  /** Pixels down from the top. */
  y?: number;
  /** Turn around the vertical axis, in degrees. Positive turns the right edge away. */
  rotY?: number;
  rotX?: number;
  /** Tilt in the screen plane. */
  rotZ?: number;
  /** Stacking order. */
  z?: number;
  /** Reveal delay in ms. */
  delay?: number;
  children: ReactNode;
}

export function AnglePhone({ x = 0, y = 0, rotY = 0, rotX = 0, rotZ = 0, z = 1, delay = 0, children }: Placement) {
  return (
    <div
      className="absolute top-0 left-1/2"
      style={{
        zIndex: z,
        transform: `translateX(-50%) translate3d(${x}px, ${y}px, 0) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* The reveal sits inside the placement, so entering never fights the angle. */}
      <Motion variant="rise" delay={delay} distance={110}>
        <div className="drop-shadow-[0_40px_50px_rgb(0_0_0/0.65)]">{children}</div>
      </Motion>
    </div>
  );
}

export function AngleStage({ children, className = '', perspective = 1800 }: { children: ReactNode; className?: string; /** Lower values exaggerate depth. Higher values look flatter and keep tilted phones from looking squeezed. */ perspective?: number }) {
  return (
    <div className={`relative ${className}`} style={{ perspective: `${perspective}px`, perspectiveOrigin: '50% 40%' }}>
      {children}
    </div>
  );
}
