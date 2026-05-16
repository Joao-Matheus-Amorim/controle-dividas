import { ReceiptText, TrendingDown, Users } from "lucide-react";

import { AppStatCard } from "@/components/app/app-stat-card";
import { compactCurrency } from "./expense-utils";

interface ExpenseSummaryCardsProps {
  totalExpenses: number;
  memberCount: number;
  categoryCount: number;
}

export function ExpenseSummaryCards({
  totalExpenses,
  memberCount,
  categoryCount,
}: ExpenseSummaryCardsProps) {
  return (
    <section className="grid grid-cols-3 gap-2 md:grid-cols-4">
      <AppStatCard
        title="Gastos"
        value={compactCurrency(totalExpenses)}
        icon={ReceiptText}
        tone="danger"
      />
      <AppStatCard
        title="Pessoas"
        value={memberCount}
        icon={Users}
        tone="primary"
      />
      <AppStatCard
        title="Categorias"
        value={categoryCount}
        icon={TrendingDown}
        tone="warning"
      />
    </section>
  );
}
