import { KeyRound, ShieldCheck, UsersRound } from "lucide-react";

import { AppStatCard } from "@/components/app/app-stat-card";

interface AdminPermissionsSummaryCardsProps {
  familyUserCount: number;
  permissionCount: number;
  moduleCount: number;
}

export function AdminPermissionsSummaryCards({
  familyUserCount,
  permissionCount,
  moduleCount,
}: AdminPermissionsSummaryCardsProps) {
  return (
    <section className="grid grid-cols-3 gap-2">
      <AppStatCard
        title="Usuários"
        value={familyUserCount}
        icon={UsersRound}
        tone="info"
      />
      <AppStatCard
        title="Regras"
        value={permissionCount}
        icon={KeyRound}
        tone="primary"
      />
      <AppStatCard
        title="Módulos"
        value={moduleCount}
        icon={ShieldCheck}
        tone="success"
      />
    </section>
  );
}
