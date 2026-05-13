import {
  Banknote,
  CalendarClock,
  CreditCard,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import { CategorySummary } from "@/components/finance/category-summary";
import { PersonBalanceCard } from "@/components/finance/person-balance-card";
import { StatCard } from "@/components/finance/stat-card";
import { UpcomingBills } from "@/components/finance/upcoming-bills";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCurrency,
  getDashboardSummary,
  getMemberName,
} from "@/lib/finance/calculations";
import { bankAccounts, receivableIncomes } from "@/lib/finance/mock-data";

export default function ProtectedPage() {
  const summary = getDashboardSummary();

  return (
    <div className="flex w-full flex-col gap-8">
      <section className="rounded-3xl border bg-gradient-to-br from-primary via-primary to-primary/80 p-8 text-primary-foreground shadow-sm">
        <div className="max-w-3xl space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary-foreground/70">
            Finanças Familiares
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Dashboard financeiro da família
          </h1>
          <p className="text-sm leading-6 text-primary-foreground/80 md:text-base">
            Acompanhe limites mensais, gastos por pessoa, contas a pagar,
            recebimentos, bancos e saldos em euro em uma única visão.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Saldo mensal restante"
          value={formatCurrency(summary.remainingMonthlyLimit)}
          description={`${formatCurrency(summary.totalExpenses)} gastos de ${formatCurrency(summary.totalMonthlyLimit)} disponíveis`}
          icon={Users}
        />
        <StatCard
          title="Contas a pagar"
          value={formatCurrency(summary.totalPayableBills)}
          description="Pendentes e atrasadas no mês atual"
          icon={CalendarClock}
        />
        <StatCard
          title="Contas a receber"
          value={formatCurrency(summary.totalReceivableIncomes)}
          description="Valores previstos ainda não recebidos"
          icon={TrendingUp}
        />
        <StatCard
          title="Saldo nos bancos"
          value={formatCurrency(summary.totalBankBalance)}
          description="Soma das contas cadastradas por pessoa"
          icon={Banknote}
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Saldo restante por pessoa
          </h2>
          <p className="text-sm text-muted-foreground">
            O sistema desconta automaticamente os gastos do limite mensal de cada membro.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {summary.memberSummaries.map((member) => (
            <PersonBalanceCard key={member.id} {...member} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <CategorySummary categories={summary.categorySummaries} />
        <UpcomingBills bills={summary.upcomingBills} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resumo de bancos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bankAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{account.bankName}</p>
                  <p className="text-xs text-muted-foreground">
                    {getMemberName(account.familyMemberId)} · {account.accountType}
                  </p>
                </div>
                <p className="font-semibold">{formatCurrency(account.currentBalance)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo de rendas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {receivableIncomes.map((income) => (
              <div
                key={income.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-muted p-2">
                    {income.incomeType === "fixa" ? (
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{income.source}</p>
                    <p className="text-xs text-muted-foreground">
                      {getMemberName(income.receiverMemberId)} · renda {income.incomeType} · {income.bank}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(income.amount)}</p>
                  <p className="text-xs capitalize text-muted-foreground">{income.status}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
