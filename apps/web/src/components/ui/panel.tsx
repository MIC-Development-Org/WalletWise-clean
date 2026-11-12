import { cn } from '@/lib/utils';

/**
 * The bordered card every dashboard section uses: an optional header row with a title and an action,
 * then the content. Matches the cards on the Home page.
 */
export function Panel({
  title,
  action,
  children,
  className,
  padded = false,
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Adds inner padding, for content that is not a list. */
  padded?: boolean;
}) {
  return (
    <section className={cn('overflow-hidden rounded-2xl border border-border bg-card', className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </div>
      )}
      <div className={cn(padded && 'p-4 @lg:p-5')}>{children}</div>
    </section>
  );
}
