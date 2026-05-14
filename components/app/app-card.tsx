import * as React from "react";

import { cn } from "@/lib/utils";

type AppCardVariant = "glass" | "solid" | "inner";
type AppCardPadding = "none" | "sm" | "md" | "lg";

const variantClasses: Record<AppCardVariant, string> = {
  glass:
    "border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/20 backdrop-blur-xl",
  solid: "border border-white/10 bg-[#10101a] shadow-xl shadow-black/20",
  inner: "border border-white/10 bg-[#080810]/55",
};

const paddingClasses: Record<AppCardPadding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

export interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AppCardVariant;
  padding?: AppCardPadding;
  interactive?: boolean;
}

export function AppCard({
  className,
  variant = "glass",
  padding = "md",
  interactive = false,
  ...props
}: AppCardProps) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem]",
        variantClasses[variant],
        paddingClasses[padding],
        interactive &&
          "transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.065]",
        className,
      )}
      {...props}
    />
  );
}

export function AppSectionTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-[11px] font-bold uppercase tracking-[0.22em] text-white/25",
        className,
      )}
      {...props}
    />
  );
}
