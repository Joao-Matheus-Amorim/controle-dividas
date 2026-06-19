import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";

import { AppCard, AppSectionTitle } from "@/components/app/app-card";

export type DashboardReadinessChecklistItem = {
  href: string;
  title: string;
  detail: string;
  isComplete: boolean;
};

type DashboardReadinessChecklistProps = {
  items: DashboardReadinessChecklistItem[];
};

export function DashboardReadinessChecklist({ items }: DashboardReadinessChecklistProps) {
  if (items.length === 0) {
    return null;
  }

  const completedCount = items.filter((item) => item.isComplete).length;

  return (
    <AppCard className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <AppSectionTitle>Pronto para testar</AppSectionTitle>
          <h2 className="mt-1 text-lg font-black text-foreground">Ciclo operacional do owner</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Base minima para validar gastos, contas, recebimentos e bancos no uso real.
          </p>
        </div>
        <div className="rounded-full border border-border bg-ff-bg-soft px-3 py-1 text-xs font-bold text-foreground">
          {completedCount}/{items.length} completos
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => {
          const Icon = item.isComplete ? CheckCircle2 : Circle;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex min-w-0 items-start gap-3 rounded-ff-md border border-border bg-ff-bg-soft p-3 transition duration-ff-base hover:border-primary/40 hover:bg-card"
            >
              <span
                className={
                  item.isComplete
                    ? "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-ff-md bg-ff-success-soft text-ff-success"
                    : "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-ff-md bg-muted text-ff-subtle-foreground"
                }
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-foreground">{item.title}</span>
                <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{item.detail}</span>
              </span>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-ff-subtle-foreground transition group-hover:text-primary" />
            </Link>
          );
        })}
      </div>
    </AppCard>
  );
}
