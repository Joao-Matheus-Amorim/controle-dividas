import { Repeat2 } from "lucide-react";

import { AppPageHeader } from "@/components/app/app-page-header";

export function MovementPageHeader() {
  return (
    <AppPageHeader
      eyebrow="Ledger"
      title="Movimentacoes"
      description="Entradas e saidas geradas pelas areas financeiras"
      icon={Repeat2}
    />
  );
}
