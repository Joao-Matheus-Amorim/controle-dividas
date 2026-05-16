import { Banknote, CreditCard, Users } from "lucide-react";

import { AppStatCard } from "@/components/app/app-stat-card";
import { compactCurrency } from "./bank-utils";

interface BankSummaryCardsProps {
  totalBalance: number;
  totalAccounts: number;
  memberCount: number;
}

export function BankSummaryCards({ totalBalance, totalAccounts, memberCount }: BankSummaryCardsProps) {
  return (
    <section className="grid grid-cols-2 gap-2 md:grid-cols-3">
      <AppStatCard title="Saldo" value={compactCurrency(totalBalance)} icon={Banknote} tone="info" />
      <AppStatCard title="Contas" value={totalAccounts} icon={CreditCard} tone="primary" />
      <AppStatCard title="Pessoas" value={memberCount} icon={Users} tone="success" className="hidden md:block" />
    </section>
  );
}
