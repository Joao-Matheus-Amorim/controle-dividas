import { Banknote } from "lucide-react";

import { AppPageHeader } from "@/components/app/app-page-header";

export function BankPageHeader() {
  return (
    <AppPageHeader
      eyebrow="Família"
      title="Bancos"
      description="Contas e saldos"
      icon={Banknote}
    />
  );
}
