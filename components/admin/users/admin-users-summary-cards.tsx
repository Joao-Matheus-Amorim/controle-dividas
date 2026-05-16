import { ShieldCheck, UserRoundCheck, UsersRound } from "lucide-react";

import { AppStatCard } from "@/components/app/app-stat-card";

interface AdminUsersSummaryCardsProps {
  activeProfileCount: number;
  memberCount: number;
}

export function AdminUsersSummaryCards({ activeProfileCount, memberCount }: AdminUsersSummaryCardsProps) {
  return (
    <section className="grid grid-cols-3 gap-2">
      <AppStatCard title="Admin" value={1} icon={ShieldCheck} tone="primary" />
      <AppStatCard title="Ativos" value={activeProfileCount} icon={UserRoundCheck} tone="success" />
      <AppStatCard title="Membros" value={memberCount} icon={UsersRound} tone="info" />
    </section>
  );
}
