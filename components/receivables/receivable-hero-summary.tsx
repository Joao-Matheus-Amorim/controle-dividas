import { AppHeroCard, AppHeroSplit } from "@/components/app/app-hero-card";
import { compactCurrency } from "./receivable-utils";

interface ReceivableHeroSummaryProps {
  totalExpected: number;
  totalOverdue: number;
  totalReceived: number;
  receivedCount: number;
  overdueCount: number;
}

export function ReceivableHeroSummary({
  totalExpected,
  totalOverdue,
  totalReceived,
  receivedCount,
  overdueCount,
}: ReceivableHeroSummaryProps) {
  return (
    <AppHeroCard
      eyebrow="Total previsto"
      value={compactCurrency(totalExpected + totalOverdue)}
      tone="success"
    >
      <AppHeroSplit
        items={[
          {
            label: "Recebido",
            value: <span className="text-[#1de9b2]">{receivedCount} · {compactCurrency(totalReceived)}</span>,
          },
          {
            label: "Atrasado",
            value: <span className="text-[#f0506e]">{overdueCount} · {compactCurrency(totalOverdue)}</span>,
          },
        ]}
      />
    </AppHeroCard>
  );
}
