import * as React from "react";

import { cn } from "@/lib/utils";

type AppCardVariant = "raised" | "solid" | "inner" | "hero";
type AppCardPadding = "none" | "sm" | "md" | "lg";

const variantClasses: Record<AppCardVariant, string> = {
  raised: "border border-border bg-card shadow-ff-sm",
  solid: "border border-border bg-card",
  inner: "border border-border bg-muted",
  hero: "border border-primary/20 bg-ff-primary-soft",
};

const paddingClasses: Record<AppCardPadding, string> = {
  none: "p-0",
  sm: "p-3.5 sm:p-4",
  md: "p-4 sm:p-5",
  lg: "p-5 sm:p-6",
};

export interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AppCardVariant;
  padding?: AppCardPadding;
  interactive?: boolean;
}

export function AppCard({
  className,
  variant = "raised",
  padding = "md",
  interactive = false,
  ...props
}: AppCardProps) {
  return (
    <div
      className={cn(
        "rounded-ff-2xl",
        "overflow-hidden",
        variantClasses[variant],
        paddingClasses[padding],
        interactive &&
          "transition duration-ff-base hover:-translate-y-0.5 hover:border-border-strong hover:shadow-ff-md",
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
        "text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
