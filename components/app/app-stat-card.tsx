import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { AppCard } from "./app-card";

type AppTone = "primary" | "success" | "warning" | "danger" | "info" | "neutral";

const toneClasses: Record<AppTone, string> = {
  primary: "text-primary bg-ff-primary-soft",
  success: "text-ff-success bg-ff-success-soft",
  warning: "text-ff-warning bg-ff-warning-soft",
  danger: "text-ff-destructive bg-ff-destructive-soft",
  info: "text-ff-info bg-ff-info-soft",
  neutral: "text-muted-foreground bg-muted",
};

interface AppStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  tone?: AppTone;
  helper?: string;
  className?: string;
}

export function AppStatCard({
  title,
  value,
  icon: Icon,
  tone = "primary",
  helper,
  className,
}: AppStatCardProps) {
  return (
    <AppCard padding="sm" interactive className={cn("min-h-[104px]", className)}>
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-ff-md", toneClasses[tone])}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <p className="mt-1 text-sm font-bold text-foreground">{value}</p>
      {helper ? <p className="mt-1 truncate text-[11px] text-muted-foreground">{helper}</p> : null}
    </AppCard>
  );
}
