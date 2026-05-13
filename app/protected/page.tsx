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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/finance/calculations";
import { getBanksDashboardData } from "@/lib/finance/banks-server";
import {
  getExpenseDashboardData,
  getPayableBillsDashboardData,
  getReceivableIncomesDashboardData,
} from "@/lib/finance/server";

export default async function ProtectedPage() {
  const [expenseData, payableData, receivableData, bankData] = await Promise.all([
    getExpenseDashboardData(),
    getPayableBillsDashboardData(),
    getReceivableIncomesDashboardData(),
    getBanksDashboardData(),
  ]);

  const totalMonthlyLimit = expenseData.memberSummaries.reduce(
    (total, member) => total + Number(member.monthly_limit),
    0,
  );
  const remainingMonthlyLimit = totalMonthlyLimit - expenseData.totalExpenses;
  const totalPayableBills = payableData.totalPending + payableData.totalOverdue;
  const totalReceivableIncomes = receivableData.totalExpected + receivableData.totalOverdue;

  const categorySummaries = expenseData.categories
    .map((category) => {
      const total = expenseData.expenses
        .filter((expense) => expense.category_id === category.id)
        .reduce((sum, expense) => sum + Number(expense.amount), 0);

      return {
        id: category.id,
        name: category.name,
        total,
      };
    })
    .filter((category) => category.total > 0)
    .sort((a, b) => b.total - a.total);

  const upcomingBills = payableData.bills
    .filter((bill) => bill.computed_status !== "pago")
    .slice(0, 5);

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
          value={formatCurrency(remainingMonthlyLimit)}
          description={`${formatCurrency(expenseData.totalExpenses)} gastos de ${formatCurrency(totalMonthlyLimit)} disponíveis`}
          icon={Users}
        />
        <StatCard
          title="Contas a pagar"
          value={formatCurrency(totalPayableBills)}
          description={`${payableData.pendingCount} pendente(s) e ${payableData.overdueCount} atrasada(s)`}
          icon={CalendarClock}
        />
        <StatCard
          title="Contas a receber"
          value={formatCurrency(totalReceivableIncomes)}
          description={`${receivableData.expectedCount} prevista(s) e ${receivableData.overdueCount} atrasada(s)`}
          icon={TrendingUp}
        />
        <StatCard
          title="Saldo nos bancos"
          value={formatCurrency(bankData.totalBalance)}
          description={`${bankData.totalAccounts} conta(s) bancária(s) cadastrada(s)`}
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
          {expenseData.memberSummaries.map((member) => (
            <PersonBalanceCard
              key={member.id}
              name={member.name}
              role={member.role || "Membro"}
              monthlyLimit={Number(member.monthly_limit)}
              spent={member.spent}
              remaining={member.remaining}
              usedPercent={member.usedPercent}
              exceeded={member.exceeded}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        {categorySummaries.length > 0 ? (
          <CategorySummary categories={categorySummaries} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Gastos por categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Cadastre gastos para visualizar o resumo por categoria.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Próximos vencimentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingBills.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma conta pendente ou atrasada cadastrada.
              </p>
            ) : (
              upcomingBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{bill.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {bill.category || "Sem categoria"} · {bill.family_members?.name || "Sem responsável"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vencimento: {new Date(`${bill.due_date}T00:00:00`).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(Number(bill.amount))}</p>
                    <p className={bill.computed_status === "atrasado" ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                      {bill.computed_status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resumo de bancos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bankData.accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Cadastre bancos para visualizar o saldo por conta.
              </p>
            ) : (
              bankData.accounts.slice(0, 6).map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{account.bank_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {account.family_members?.name || "Sem pessoa vinculada"} · {account.account_type || "Tipo não informado"}
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(Number(account.current_balance))}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo de rendas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {receivableData.incomes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Cadastre contas a receber para visualizar rendas fixas e variáveis.
              </p>
            ) : (
              receivableData.incomes.slice(0, 6).map((income) => (
                <div
                  key={income.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-muted p-2">
                      {income.income_type === "fixa" ? (
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{income.source}</p>
                      <p className="text-xs text-muted-foreground">
                        {income.family_members?.name || "Sem pessoa vinculada"} · renda {income.income_type} · {income.receiving_bank || "Sem banco"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(Number(income.amount))}</p>
                    <p className="text-xs capitalize text-muted-foreground">{income.computed_status}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
