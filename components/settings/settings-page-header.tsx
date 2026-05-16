import { ShieldCheck } from "lucide-react";

import { AppPageHeader } from "@/components/app/app-page-header";

export function SettingsPageHeader() {
  return (
    <AppPageHeader
      eyebrow="Sistema"
      title="Configurações"
      description="Limites, categorias e regras"
      icon={ShieldCheck}
    />
  );
}
