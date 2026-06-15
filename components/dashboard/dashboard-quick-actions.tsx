import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { AppSectionTitle } from "@/components/app/app-card";

export type DashboardQuickAction = {
  href: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
};

interface DashboardQuickActionsProps {
  actions: DashboardQuickAction[];
}

export function DashboardQuickActions({ actions }: DashboardQuickActionsProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <AppSectionTitle>Ações rápidas</AppSectionTitle>
        <p className="text-xs font-semibold text-primary">{actions.length} disponíveis</p>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          const isPrimary = index === 0;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={isPrimary ? "group col-span-2 flex min-w-0 items-center gap-3 rounded-[1.15rem] border border-primary/25 bg-primary p-3 text-primary-foreground shadow-ff-md transition duration-ff-base ease-ff-spring active:scale-[0.98] hover:bg-ff-primary-hover md:col-span-1" : "group flex min-w-0 items-center gap-3 rounded-[1.15rem] border border-border bg-card p-3 shadow-ff-xs transition duration-ff-base ease-ff-spring active:scale-[0.98] hover:border-ff-border-strong hover:bg-ff-bg-soft"}
            >
              <span className={isPrimary ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-primary-foreground transition duration-ff-base" : "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ff-primary-soft text-primary transition duration-ff-base group-hover:bg-primary group-hover:text-primary-foreground"}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1 text-left">
                <p className={isPrimary ? "truncate text-sm font-black text-primary-foreground" : "truncate text-sm font-semibold text-foreground"}>{action.title}</p>
                <p className={isPrimary ? "truncate text-xs text-primary-foreground/75" : "truncate text-xs text-muted-foreground"}>{action.subtitle}</p>
              </div>
              <ChevronRight className={isPrimary ? "h-4 w-4 shrink-0 text-primary-foreground/75" : "hidden h-4 w-4 shrink-0 text-muted-foreground transition group-hover:block"} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
