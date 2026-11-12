import { cn } from '@/lib/utils';

/**
 * Progress toward a limit, in the workspace app's style. Ticks sit at 50 and 80 percent, the same
 * thresholds budget alerts fire at. Colour shifts to amber at 80% and red at 100%.
 */
export function Meter({
  pct,
  label,
  ticks = false,
  tone = 'auto',
  className,
}: {
  pct: number;
  label: string;
  ticks?: boolean;
  tone?: 'auto' | 'primary';
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const bar = tone === 'primary' ? 'bg-primary' : pct >= 100 ? 'bg-destructive' : pct >= 80 ? 'bg-[#ffb547]' : 'bg-primary';
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn('relative h-1.5 rounded-full bg-muted', className)}
    >
      <div className={cn('h-full rounded-full', bar)} style={{ width: `${clamped}%` }} />
      {ticks && (
        <>
          <span className="absolute -top-0.5 left-1/2 h-2.5 w-px bg-background/80" />
          <span className="absolute -top-0.5 left-[80%] h-2.5 w-px bg-background/80" />
        </>
      )}
    </div>
  );
}
