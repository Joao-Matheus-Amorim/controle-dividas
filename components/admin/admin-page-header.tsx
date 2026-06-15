import { ShieldCheck } from "lucide-react";

import { AppPageHeader } from "@/components/app/app-page-header";

export function AdminPageHeader() {
  return (
    <AppPageHeader
      eyebrow="Administracao"
      title="Admin"
      description="Gerenciamento da organizacao"
      icon={ShieldCheck}
    />
  );
}
