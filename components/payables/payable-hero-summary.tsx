import { AppHeroCard, AppHeroSplit } from "@/components/app/app-hero-card";
import { compactCurrency } from "./payable-utils";

interface PayableHeroSummaryProps {
  totalPending: number;
  totalOverdue: number;
  pendingCount: number;
  overdueCount: number;
}

export function PayableHeroSummary({
  totalPending,
  totalOverdue,
  pendingCount,
  overdueCount,
}: PayableHeroSummaryProps) {
  return (
    <AppHeroCard
      eyebrow="Total em aberto"
      value={compactCurrency(totalPending + totalOverdue)}
      tone="warning"
    >
      <AppHeroSplit
        items={[
          {
            label: "Pendentes",
            value: <span className="text-ff-warning">{pendingCount} · {compactCurrency(totalPending)}</span>,
          },
          {
            label: "Atrasadas",
            value: <span className="text-ff-destructive">{overdueCount} · {compactCurrency(totalOverdue)}</span>,
          },
        ]}
      />
    </AppHeroCard>
  );
}
