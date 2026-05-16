import { UsersRound } from "lucide-react";

import { AppPageHeader } from "@/components/app/app-page-header";

export function PeoplePageHeader() {
  return (
    <AppPageHeader
      eyebrow="Família"
      title="Pessoas"
      description="Membros, limites e acessos vinculados"
      icon={UsersRound}
    />
  );
}
