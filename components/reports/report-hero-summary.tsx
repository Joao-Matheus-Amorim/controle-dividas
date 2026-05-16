import { AppHeroCard, AppHeroSplit } from "@/components/app/app-hero-card";
import { compactCurrency } from "./report-utils";

interface ReportHeroSummaryProps {
  finalMonthlyBalance: number;
  totalExpenses: number;
  totalReceivedIncomes: number;
}

export function ReportHeroSummary({
  finalMonthlyBalance,
  totalExpenses,
  totalReceivedIncomes,
}: ReportHeroSummaryProps) {
  return (
    <AppHeroCard
      eyebrow="Saldo final projetado"
      value={compactCurrency(finalMonthlyBalance)}
      tone="primary"
    >
      <AppHeroSplit
        items={[
          {
            label: "Gastos",
            value: <span className="text-[#f0506e]">{compactCurrency(totalExpenses)}</span>,
          },
          {
            label: "Recebido",
            value: <span className="text-[#1de9b2]">{compactCurrency(totalReceivedIncomes)}</span>,
          },
        ]}
      />
    </AppHeroCard>
  );
}
