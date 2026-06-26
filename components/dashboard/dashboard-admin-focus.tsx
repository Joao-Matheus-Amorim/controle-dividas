import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  WalletCards,
} from "lucide-react";

import { AppCard, AppSectionTitle } from "@/components/app/app-card";

export type DashboardAdminFocusItem = {
  title: string;
  detail: string;
  href?: string;
  tone: "danger" | "warning" | "success";
};

interface DashboardAdminFocusProps {
  items: DashboardAdminFocusItem[];
}

const toneClasses: Record<DashboardAdminFocusItem["tone"], string> = {
  danger: "border-ff-destructive/20 bg-ff-destructive-soft text-ff-destructive",
  warning: "border-ff-warning/20 bg-ff-warning-soft text-ff-warning",
  success: "border-ff-success/20 bg-ff-success-soft text-ff-success",
};

const toneIcons = {
  danger: AlertTriangle,
  warning: CircleAlert,
  success: CheckCircle2,
} as const;

export function DashboardAdminFocus({ items }: DashboardAdminFocusProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <AppSectionTitle>Atenção do admin</AppSectionTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            O que vale atacar primeiro para a operação andar bem
          </p>
        </div>
        <WalletCards className="h-4 w-4 text-ff-subtle-foreground" />
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        {items.map((item) => {
          const ToneIcon = toneIcons[item.tone];

          const content = (
            <AppCard
              padding="sm"
              className="flex h-full flex-col gap-3 border-border bg-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                </div>
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${toneClasses[item.tone]}`}
                >
                  <ToneIcon className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  {item.href ? "Abrir agora" : "Sem ação imediata"}
                </span>
                {item.href ? <ArrowRight className="h-4 w-4 text-primary" /> : null}
              </div>
            </AppCard>
          );

          if (!item.href) {
            return <div key={item.title}>{content}</div>;
          }

          return (
            <Link key={item.title} href={item.href} className="block">
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
