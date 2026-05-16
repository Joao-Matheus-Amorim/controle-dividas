import { AlertTriangle, CheckCircle2, Clock3, Repeat, WalletCards } from "lucide-react";

import { AppStatCard } from "@/components/app/app-stat-card";
import { compactCurrency } from "./receivable-utils";

interface ReceivableSummaryCardsProps {
  totalExpected: number;
  totalReceived: number;
  totalOverdue: number;
  totalFixed: number;
  totalVariable: number;
}

export function ReceivableSummaryCards({
  totalExpected,
  totalReceived,
  totalOverdue,
  totalFixed,
  totalVariable,
}: ReceivableSummaryCardsProps) {
  return (
    <section className="grid grid-cols-3 gap-2 md:grid-cols-5">
      <AppStatCard title="Previsto" value={compactCurrency(totalExpected)} icon={Clock3} tone="warning" />
      <AppStatCard title="Recebido" value={compactCurrency(totalReceived)} icon={CheckCircle2} tone="success" />
      <AppStatCard title="Atraso" value={compactCurrency(totalOverdue)} icon={AlertTriangle} tone="danger" />
      <AppStatCard title="Fixa" value={compactCurrency(totalFixed)} icon={Repeat} tone="primary" className="hidden md:block" />
      <AppStatCard title="Variável" value={compactCurrency(totalVariable)} icon={WalletCards} tone="info" className="hidden md:block" />
    </section>
  );
}
