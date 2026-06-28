import { BellRing, Euro, ShieldCheck } from "lucide-react";

import { AppStatCard } from "@/components/app/app-stat-card";

interface SettingsSummaryCardsProps {
  totalLimitLabel: string;
  totalLimitHelper?: string;
  categoryCount: number;
  currencyLabel: string;
  currencyHelper?: string;
}

export function SettingsSummaryCards({
  totalLimitLabel,
  totalLimitHelper,
  categoryCount,
  currencyLabel,
  currencyHelper,
}: SettingsSummaryCardsProps) {
  return (
    <section className="grid grid-cols-3 gap-2">
      <AppStatCard
        title="Limite"
        value={totalLimitLabel}
        helper={totalLimitHelper}
        icon={Euro}
        tone="success"
      />
      <AppStatCard title="Categorias" value={categoryCount} icon={ShieldCheck} tone="primary" />
      <AppStatCard
        title="Moeda"
        value={currencyLabel}
        helper={currencyHelper}
        icon={BellRing}
        tone="warning"
      />
    </section>
  );
}
