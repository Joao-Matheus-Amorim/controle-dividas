import { KeyRound } from "lucide-react";

import { AppPageHeader } from "@/components/app/app-page-header";

export function AdminPermissionsPageHeader() {
  return (
    <AppPageHeader
      eyebrow="Admin"
      title="Permissões"
      description="Acessos por módulo"
      icon={KeyRound}
    />
  );
}
