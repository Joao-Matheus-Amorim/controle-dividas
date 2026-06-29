import { AlertTriangle, CheckCircle2, Sparkles, TrendingUp } from "lucide-react";

import { AppCard, AppSectionTitle } from "@/components/app/app-card";
import type { DashboardInsight, DashboardInsightTone } from "@/lib/finance/dashboard-insights";

const toneClasses: Record<DashboardInsightTone, { icon: string; surface: string }> = {
  success: {
    icon: "bg-ff-success-soft text-ff-success",
    surface: "border-ff-success/20 bg-ff-success-soft/40",
  },
  warning: {
    icon: "bg-ff-warning-soft text-ff-warning",
    surface: "border-ff-warning/20 bg-ff-warning-soft/40",
  },
  danger: {
    icon: "bg-ff-destructive-soft text-ff-destructive",
    surface: "border-ff-destructive/20 bg-ff-destructive-soft/40",
  },
  info: {
    icon: "bg-ff-primary-soft text-primary",
    surface: "border-primary/20 bg-ff-primary-soft/40",
  },
};

function InsightIcon({ tone }: { tone: DashboardInsightTone }) {
  if (tone === "success") return <CheckCircle2 className="h-4 w-4" />;
  if (tone === "danger" || tone === "warning") return <AlertTriangle className="h-4 w-4" />;
  return <TrendingUp className="h-4 w-4" />;
}

export function DashboardAiInsights({ insights }: { insights: DashboardInsight[] }) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <AppCard className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <AppSectionTitle>Insights do copiloto</AppSectionTitle>
          <p className="mt-1 text-sm text-muted-foreground">Leitura deterministica, sem provider e sem salvamento</p>
        </div>
        <Sparkles className="h-4 w-4 text-primary" />
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {insights.map((insight) => {
          const classes = toneClasses[insight.tone];

          return (
            <div key={`${insight.title}-${insight.detail}`} className={`rounded-ff-xl border p-3 ${classes.surface}`}>
              <div className={`flex h-9 w-9 items-center justify-center rounded-ff-md ${classes.icon}`}>
                <InsightIcon tone={insight.tone} />
              </div>
              <p className="mt-3 text-sm font-black text-foreground">{insight.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{insight.detail}</p>
            </div>
          );
        })}
      </div>
    </AppCard>
  );
}
