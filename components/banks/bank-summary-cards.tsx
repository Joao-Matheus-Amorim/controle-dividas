import { Banknote, CreditCard, Users } from "lucide-react";

import { AppStatCard } from "@/components/app/app-stat-card";

interface BankSummaryCardsProps {
  totalBalanceLabel: string;
  totalAccounts: number;
  memberCount: number;
}

export function BankSummaryCards({ totalBalanceLabel, totalAccounts, memberCount }: BankSummaryCardsProps) {
  return (
    <section className="grid grid-cols-2 gap-2 md:grid-cols-3">
      <AppStatCard title="Saldo" value={totalBalanceLabel} icon={Banknote} tone="info" />
      <AppStatCard title="Contas" value={totalAccounts} icon={CreditCard} tone="primary" />
      <AppStatCard title="Pessoas" value={memberCount} icon={Users} tone="success" className="hidden md:block" />
    </section>
  );
}
