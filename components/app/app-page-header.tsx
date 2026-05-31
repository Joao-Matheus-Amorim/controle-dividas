import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface AppPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  badge?: string;
  action?: ReactNode;
  className?: string;
}

export function AppPageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  badge,
  action,
  className,
}: AppPageHeaderProps) {
  return (
    <section className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {action || badge || Icon ? (
        <div className="flex shrink-0 items-center gap-2">
          {badge ? (
            <div className="rounded-full border border-border bg-ff-primary-soft px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              {badge}
            </div>
          ) : null}
          {Icon ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-ff-md border border-border bg-ff-primary-soft text-primary">
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
          {action}
        </div>
      ) : null}
    </section>
  );
}
