import { BellRing, Euro, ShieldCheck } from "lucide-react";

import { AppStatCard } from "@/components/app/app-stat-card";
import { compactCurrency } from "./settings-utils";

interface SettingsSummaryCardsProps {
  totalLimit: number;
  categoryCount: number;
}

export function SettingsSummaryCards({ totalLimit, categoryCount }: SettingsSummaryCardsProps) {
  return (
    <section className="grid grid-cols-3 gap-2">
      <AppStatCard title="Limite" value={compactCurrency(totalLimit)} icon={Euro} tone="success" />
      <AppStatCard title="Categorias" value={categoryCount} icon={ShieldCheck} tone="primary" />
      <AppStatCard title="Moeda" value="EUR" icon={BellRing} tone="warning" />
    </section>
  );
}
