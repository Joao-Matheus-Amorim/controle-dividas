import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AppHeroTone = "primary" | "danger" | "success" | "warning";

const toneClasses: Record<AppHeroTone, string> = {
  primary: "border-primary/20 bg-ff-primary-soft",
  danger: "border-ff-destructive/20 bg-ff-destructive-soft",
  success: "border-ff-success/20 bg-ff-success-soft",
  warning: "border-ff-warning/20 bg-ff-warning-soft",
};

const toneAccentText: Record<AppHeroTone, string> = {
  primary: "text-primary",
  danger: "text-ff-destructive",
  success: "text-ff-success",
  warning: "text-ff-warning",
};

interface AppHeroCardProps {
  eyebrow: string;
  value: string;
  children?: ReactNode;
  tone?: AppHeroTone;
  className?: string;
}

export function AppHeroCard({
  eyebrow,
  value,
  children,
  tone = "primary",
  className,
}: AppHeroCardProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-ff-2xl border p-5 shadow-ff-sm",
        toneClasses[tone],
        className,
      )}
    >
      <div className="relative">
        <p
          className={cn(
            "text-[10px] font-bold uppercase tracking-[0.22em]",
            toneAccentText[tone],
          )}
        >
          {eyebrow}
        </p>
        <p className="mt-2 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          {value}
        </p>
        {children}
      </div>
    </section>
  );
}

export function AppHeroSplit({
  items,
}: {
  items: Array<{ label: string; value: ReactNode; className?: string }>;
}) {
  return (
    <div className="mt-5 grid grid-cols-2 divide-x divide-border">
      {items.map((item, index) => (
        <div key={item.label} className={cn(index === 0 ? "pr-4" : "pl-4", item.className)}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {item.label}
          </p>
          <div className="mt-1 text-sm font-semibold text-foreground">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
