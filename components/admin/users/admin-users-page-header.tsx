import { UsersRound } from "lucide-react";

import { AppPageHeader } from "@/components/app/app-page-header";

export function AdminUsersPageHeader() {
  return (
    <AppPageHeader
      eyebrow="Admin"
      title="Usuários"
      description="Acessos da família"
      icon={UsersRound}
    />
  );
}
