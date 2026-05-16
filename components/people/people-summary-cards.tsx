import { UserRoundCheck, UserRoundX, UsersRound } from "lucide-react";

import { AppStatCard } from "@/components/app/app-stat-card";

interface PeopleSummaryCardsProps {
  memberCount: number;
  activeCount: number;
  missingLoginCount: number;
}

export function PeopleSummaryCards({ memberCount, activeCount, missingLoginCount }: PeopleSummaryCardsProps) {
  return (
    <section className="grid grid-cols-2 gap-2 md:grid-cols-3">
      <AppStatCard title="Membros" value={memberCount} icon={UsersRound} tone="primary" />
      <AppStatCard title="Ativos" value={activeCount} icon={UserRoundCheck} tone="success" />
      <AppStatCard title="Sem login" value={missingLoginCount} icon={UserRoundX} tone="danger" className="hidden md:block" />
    </section>
  );
}
