"use client";

import { cn } from "@/lib/utils";

export interface Pill {
  id: string;
  label: string;
  count?: number;
}

/** Segmented filter control: scrolls sideways on narrow screens. */
export function FilterPills({ pills, value, onChange, className }: { pills: Pill[]; value: string; onChange: (id: string) => void; className?: string }) {
  return (
    <div className={cn("hide-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-lg bg-muted p-1 text-sm", className)}>
      {pills.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onChange(p.id)}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 transition-colors",
            value === p.id ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {p.label}
          {p.count !== undefined && <span className="text-xs text-muted-foreground">{p.count}</span>}
        </button>
      ))}
    </div>
  );
}
