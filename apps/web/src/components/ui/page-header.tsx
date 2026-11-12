import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 @xl:flex-row @xl:items-end @xl:justify-between", className)}>
      <div>
        {eyebrow && (
          <p className="text-eyebrow text-muted-foreground mb-1.5">{eyebrow}</p>
        )}
        <h1 className="text-3xl @xl:text-4xl font-display tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="text-sm @xl:text-base text-muted-foreground mt-1.5 max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 @xl:shrink-0">{actions}</div>}
    </div>
  );
}
