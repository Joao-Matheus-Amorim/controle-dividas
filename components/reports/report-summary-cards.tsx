import { Banknote, CalendarClock, TrendingDown, TrendingUp } from "lucide-react";

import { AppStatCard } from "@/components/app/app-stat-card";
import { compactCurrency } from "./report-utils";

interface ReportSummaryCardsProps {
  totalExpenses: number;
  totalPendingBills: number;
  totalReceivedIncomes: number;
  totalBankBalance: number;
}

export function ReportSummaryCards({
  totalExpenses,
  totalPendingBills,
  totalReceivedIncomes,
  totalBankBalance,
}: ReportSummaryCardsProps) {
  return (
    <section className="grid grid-cols-3 gap-2 md:grid-cols-4">
      <AppStatCard title="Gastos" value={compactCurrency(totalExpenses)} icon={TrendingDown} tone="danger" />
      <AppStatCard title="Pendentes" value={compactCurrency(totalPendingBills)} icon={CalendarClock} tone="warning" />
      <AppStatCard title="Rendas" value={compactCurrency(totalReceivedIncomes)} icon={TrendingUp} tone="success" />
      <AppStatCard title="Bancos" value={compactCurrency(totalBankBalance)} icon={Banknote} tone="info" className="hidden md:block" />
    </section>
  );
}
