import { KeyRound, ShieldCheck, UsersRound } from "lucide-react";

import { AppStatCard } from "@/components/app/app-stat-card";

interface AdminSummaryCardsProps {
  activeUserCount: number;
  configuredProfileCount: number;
}

export function AdminSummaryCards({ activeUserCount, configuredProfileCount }: AdminSummaryCardsProps) {
  return (
    <section className="grid grid-cols-3 gap-2">
      <AppStatCard title="Admin" value={1} icon={ShieldCheck} tone="primary" />
      <AppStatCard title="Ativos" value={activeUserCount} icon={UsersRound} tone="info" />
      <AppStatCard title="Perfis" value={configuredProfileCount} icon={KeyRound} tone="success" />
    </section>
  );
}
