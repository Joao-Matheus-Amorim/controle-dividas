import { Plus } from "lucide-react";

import { AppPageHeader } from "@/components/app/app-page-header";

interface ExpensePageHeaderProps {
  periodLabel: string;
  canCreate: boolean;
}

export function ExpensePageHeader({ periodLabel, canCreate }: ExpensePageHeaderProps) {
  return (
    <AppPageHeader
      eyebrow={periodLabel}
      title="Gastos"
      description="Lançamentos da família"
      icon={canCreate ? Plus : undefined}
    />
  );
}
