import { PieChart } from "lucide-react";

import { AppPageHeader } from "@/components/app/app-page-header";

interface ReportPageHeaderProps {
  periodContextLabel: string;
}

export function ReportPageHeader({ periodContextLabel }: ReportPageHeaderProps) {
  return (
    <AppPageHeader
      eyebrow={periodContextLabel}
      title="Relatórios"
      description="Resumo financeiro"
      icon={PieChart}
    />
  );
}
