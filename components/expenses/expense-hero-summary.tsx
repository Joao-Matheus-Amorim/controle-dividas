import { AppHeroCard, AppHeroSplit } from "@/components/app/app-hero-card";
import { compactCurrency } from "./expense-utils";

interface ExpenseHeroSummaryProps {
  totalExpenses: number;
  totalRemaining: number;
  expenseCount: number;
}

export function ExpenseHeroSummary({
  totalExpenses,
  totalRemaining,
  expenseCount,
}: ExpenseHeroSummaryProps) {
  return (
    <AppHeroCard
      eyebrow="Total gasto no mês"
      value={compactCurrency(totalExpenses)}
      tone="danger"
    >
      <AppHeroSplit
        items={[
          {
            label: "Saldo restante",
            value: (
              <span className={totalRemaining < 0 ? "text-[#f0506e]" : "text-[#1de9b2]"}>
                {compactCurrency(totalRemaining)}
              </span>
            ),
          },
          {
            label: "Lançamentos",
            value: expenseCount,
          },
        ]}
      />
    </AppHeroCard>
  );
}
