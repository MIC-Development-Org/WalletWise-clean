import { cn } from "@/lib/utils";

/** Section title with a count and a hairline rule, as used on midgreen's Team page. */
export function SectionHeading({ title, count, className }: { title: string; count?: number | string; className?: string }) {
  return (
    <div className={cn("mb-4 flex items-center gap-3", className)}>
      <h2 className="text-xl font-semibold">{title}</h2>
      {count !== undefined && <span className="text-sm text-muted-foreground">{count}</span>}
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
