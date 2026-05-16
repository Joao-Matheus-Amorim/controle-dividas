import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Repeat2,
  WalletCards,
} from "lucide-react";

import { AppStatCard } from "@/components/app/app-stat-card";
import { compactCurrency } from "./payable-utils";

interface PayableSummaryCardsProps {
  totalPending: number;
  totalOverdue: number;
  totalPaid: number;
  totalOneOff: number;
  totalFixed: number;
  oneOffCount: number;
  fixedCount: number;
}

export function PayableSummaryCards({
  totalPending,
  totalOverdue,
  totalPaid,
  totalOneOff,
  totalFixed,
  oneOffCount,
  fixedCount,
}: PayableSummaryCardsProps) {
  return (
    <section className="grid grid-cols-2 gap-2 md:grid-cols-5">
      <AppStatCard title="Pendentes" value={compactCurrency(totalPending)} icon={CalendarDays} tone="warning" />
      <AppStatCard title="Atraso" value={compactCurrency(totalOverdue)} icon={AlertTriangle} tone="danger" />
      <AppStatCard title="Pagas" value={compactCurrency(totalPaid)} icon={CheckCircle2} tone="success" />
      <AppStatCard title="Avulsas" value={`${oneOffCount} · ${compactCurrency(totalOneOff)}`} icon={WalletCards} tone="primary" />
      <AppStatCard title="Fixas" value={`${fixedCount} · ${compactCurrency(totalFixed)}`} icon={Repeat2} tone="primary" />
    </section>
  );
}
