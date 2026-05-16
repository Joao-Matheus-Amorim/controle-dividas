import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { AppSectionTitle } from "@/components/app/app-card";

export type DashboardQuickAction = {
  href: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  bg: string;
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
        <p className="text-xs font-medium text-white/30">Atalhos liberados</p>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex min-w-0 items-center gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-3 shadow-[0_14px_34px_rgba(0,0,0,0.2)] transition active:scale-[0.97] hover:bg-white/[0.07]"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${action.bg} transition group-hover:scale-105`} style={{ color: action.color }}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-bold text-white">{action.title}</p>
                <p className="truncate text-xs text-white/30">{action.subtitle}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
