import { WalletCards } from "lucide-react";

import { AppPageHeader } from "@/components/app/app-page-header";

interface PayablePageHeaderProps {
  periodLabel: string;
}

export function PayablePageHeader({ periodLabel }: PayablePageHeaderProps) {
  return (
    <AppPageHeader
      eyebrow={periodLabel}
      title="Contas e dividas"
      description="Contas fixas, avulsas, pagamentos e vencimentos"
      icon={WalletCards}
    />
  );
}
