import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { AppCard } from "./app-card";

type AppTone = "primary" | "success" | "warning" | "danger" | "info" | "neutral";

const toneClasses: Record<AppTone, string> = {
  primary: "text-[#b09cff] bg-[#8b72f8]/15",
  success: "text-[#1de9b2] bg-[#1de9b2]/10",
  warning: "text-[#f7b84b] bg-[#f7b84b]/10",
  danger: "text-[#f0506e] bg-[#f0506e]/10",
  info: "text-[#5caaff] bg-[#5caaff]/10",
  neutral: "text-white/55 bg-white/10",
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
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-2xl", toneClasses[tone])}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/25">
        {title}
      </p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
      {helper ? <p className="mt-1 truncate text-[11px] text-white/30">{helper}</p> : null}
    </AppCard>
  );
}
