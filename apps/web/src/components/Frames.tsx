import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Download, Menu, Search } from 'lucide-react';
import { SidebarView } from '@/components/layout/sidebar';
import { MobileTabBar, type NavKey } from './Nav';

export const PHONE_W = 390;
export const PHONE_H = 844;

/** Renders children at a fixed design size and scales the whole thing, so previews are the real screens. */
export function Scaled({
  width,
  height,
  scale,
  children,
  className = '',
}: {
  width: number;
  height: number;
  scale: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className} style={{ width: width * scale, height: height * scale }}>
      <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
    </div>
  );
}

/** Scales a fixed design size to whatever width the parent gives it. */
export function FitWidth({ width, height, children }: { width: number; height: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e!.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = w ? w / width : 0;
  return (
    <div ref={ref} className="w-full" style={{ height: height * (scale || 0.5) }}>
      {scale > 0 && (
        <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
      )}
    </div>
  );
}

function StatusBar() {
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex h-12 items-center justify-between px-8 text-[0.8rem] font-medium">
      <span>9:41</span>
      <span className="absolute left-1/2 top-2.5 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-4 rounded-sm bg-fg/80" />
        <span className="h-2.5 w-6 rounded-[4px] border border-fg/60 p-px">
          <span className="block h-full w-4/5 rounded-[2px] bg-fg/80" />
        </span>
      </span>
    </div>
  );
}

/**
 * A phone showing a real screen. `inert` keeps the preview from stealing focus or clicks.
 * `sheet` shows a bottom-sheet style overlay instead of the tab bar.
 */
export function PhoneFrame({
  active,
  scale = 0.7,
  children,
  overlay,
  label,
}: {
  active: NavKey;
  scale?: number;
  children: ReactNode;
  overlay?: ReactNode;
  label: string;
}) {
  const bezel = 10;
  return (
    <Scaled width={PHONE_W + bezel * 2} height={PHONE_H + bezel * 2} scale={scale}>
      <div
        role="img"
        aria-label={label}
        className="relative h-full w-full rounded-[3.4rem] border border-line-strong bg-surface-3 p-[10px] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)]"
      >
        <div className="relative h-full w-full overflow-hidden rounded-[2.7rem] bg-ink" inert aria-hidden="true">
          <StatusBar />
          <div className="absolute inset-x-0 top-12 z-10 flex h-14 items-center gap-2 border-b border-border bg-background px-4">
            <Menu size={20} />
            <div className="ml-auto flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground">
                <Search size={16} />
              </span>
              <span className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs">
                <Download size={13} />
              </span>
            </div>
          </div>
          <div className="h-full overflow-hidden px-4 pt-[6.75rem]">{children}</div>
          {overlay ? (
            overlay
          ) : (
            <MobileTabBar active={active} onAdd={() => {}} className="absolute inset-x-0 bottom-0" />
          )}
        </div>
      </div>
    </Scaled>
  );
}

export const LAPTOP_W = 1280;
export const LAPTOP_H = 800;

/** The desktop dashboard: the real sidebar, top bar and content area, drawn at 1280 wide and scaled to fit. */
export function LaptopFrame({
  active,
  name,
  reviewCount,
  children,
}: {
  active: NavKey;
  name: string;
  reviewCount: number;
  children: ReactNode;
}) {
  return (
    <div
      role="img"
      aria-label="WalletWise dashboard on a laptop"
      className="overflow-hidden rounded-2xl border border-line-strong bg-ink shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9)]"
    >
      <div className="flex h-9 items-center gap-2 border-b border-line bg-surface px-4" aria-hidden="true">
        <span className="h-2.5 w-2.5 rounded-full bg-surface-3" />
        <span className="h-2.5 w-2.5 rounded-full bg-surface-3" />
        <span className="h-2.5 w-2.5 rounded-full bg-surface-3" />
      </div>
      <FitWidth width={LAPTOP_W} height={LAPTOP_H}>
        <LaptopApp active={active} name={name} reviewCount={reviewCount}>
          {children}
        </LaptopApp>
      </FitWidth>
    </div>
  );
}

/** The app window itself, without a browser frame. Shared by the laptop and tablet previews. */
export function LaptopApp({ active, name, reviewCount, children }: { active: NavKey; name: string; reviewCount: number; children: ReactNode }) {
  return (
    <div className="flex h-full w-full bg-background text-foreground" inert aria-hidden="true">
      <SidebarView open active={active} reviewCount={reviewCount} name={name} onAdd={() => {}} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-6">
          <div className="ml-auto flex items-center gap-2">
            <span className="flex h-8 w-56 items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-sm text-muted-foreground">
              <Search size={16} /> Search…
              <kbd className="ml-auto rounded border border-border px-1.5 text-[10px]">Ctrl K</kbd>
            </span>
            <span className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-sm">
              <Download size={14} /> Install app
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-hidden p-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
