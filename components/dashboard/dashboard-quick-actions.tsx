import type { LucideIcon } from "lucide-react";
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
        <p className="text-xs font-medium text-muted-foreground">Atalhos liberados</p>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex min-w-0 items-center gap-3 rounded-ff-xl border border-border bg-card p-3 shadow-ff-xs transition duration-ff-base ease-ff-spring active:scale-[0.98] hover:border-ff-border-strong hover:bg-ff-bg-soft"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-ff-md bg-ff-primary-soft text-primary transition duration-ff-base group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-semibold text-foreground">{action.title}</p>
                <p className="truncate text-xs text-muted-foreground">{action.subtitle}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
