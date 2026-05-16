import { WalletCards } from "lucide-react";

import { AppPageHeader } from "@/components/app/app-page-header";

interface ReceivablePageHeaderProps {
  periodLabel: string;
}

export function ReceivablePageHeader({ periodLabel }: ReceivablePageHeaderProps) {
  return (
    <AppPageHeader
      eyebrow={periodLabel}
      title="Receber"
      description="Entradas e rendas"
      icon={WalletCards}
    />
  );
}
