import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { AppCard } from "./app-card";

interface AppEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function AppEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: AppEmptyStateProps) {
  return (
    <AppCard
      variant="inner"
      className={cn("flex flex-col items-center justify-center py-8 text-center", className)}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-card text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm font-semibold text-foreground">{title}</p>
      {description ? <p className="mt-1 max-w-xs text-sm text-ff-subtle-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </AppCard>
  );
}
