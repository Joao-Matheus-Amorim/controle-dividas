import { ArrowDownLeft, ArrowUpRight, ListChecks, Scale } from "lucide-react";

import { AppStatCard } from "@/components/app/app-stat-card";
import { compactCurrency } from "./movement-utils";

interface MovementSummaryCardsProps {
  totalInflow: number;
  totalOutflow: number;
  netTotal: number;
  movementCount: number;
}

export function MovementSummaryCards({
  totalInflow,
  totalOutflow,
  netTotal,
  movementCount,
}: MovementSummaryCardsProps) {
  return (
    <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <AppStatCard title="Entradas" value={compactCurrency(totalInflow)} icon={ArrowDownLeft} tone="success" />
      <AppStatCard title="Saidas" value={compactCurrency(totalOutflow)} icon={ArrowUpRight} tone="danger" />
      <AppStatCard title="Saldo liquido" value={compactCurrency(netTotal)} icon={Scale} tone="info" />
      <AppStatCard title="Movimentos" value={movementCount} icon={ListChecks} tone="primary" />
    </section>
  );
}
