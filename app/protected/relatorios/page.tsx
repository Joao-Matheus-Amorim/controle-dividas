import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  PieChart,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import { CategorySummary } from "@/components/finance/category-summary";
import { StatCard } from "@/components/finance/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/finance/calculations";
import { getReportsDashboardData } from "@/lib/finance/reports-server";

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
}

export default async function RelatoriosPage() {
  const report = await getReportsDashboardData();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-background p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
          FamilyFinance
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Relatórios
        </h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Analise o mês da família por pessoa, categoria, contas pendentes, rendas recebidas, bancos e saldo final.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Gasto total"
          value={formatCurrency(report.totalExpenses)}
          description={`${report.counts.expenses} lançamento(s) no período`}
          icon={TrendingDown}
        />
        <StatCard
          title="Contas pendentes"
          value={formatCurrency(report.totalPendingBills)}
          description={`${report.counts.pendingBills} conta(s) pendente(s) ou atrasada(s)`}
          icon={CalendarClock}
        />
        <StatCard
          title="Rendas recebidas"
          value={formatCurrency(report.totalReceivedIncomes)}
          description={`${report.counts.receivedIncomes} entrada(s) confirmada(s)`}
          icon={TrendingUp}
        />
        <StatCard
          title="Saldo final projetado"
          value={formatCurrency(report.finalMonthlyBalance)}
          description="Limites + recebidos - gastos - contas pendentes"
          icon={CircleDollarSign}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Limite familiar</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(report.totalMonthlyLimit)}</p>
            <p className="text-xs text-muted-foreground">Soma dos limites por pessoa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">A receber</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(report.totalExpectedIncomes)}</p>
            <p className="text-xs text-muted-foreground">Previstos e atrasados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo em bancos</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(report.totalBankBalance)}</p>
            <p className="text-xs text-muted-foreground">{report.counts.bankAccounts} conta(s) cadastrada(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categorias usadas</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{report.expensesByCategory.length}</p>
            <p className="text-xs text-muted-foreground">Categorias com gastos</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Gastos por pessoa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.expensesByPerson.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma pessoa cadastrada.</p>
            ) : (
              report.expensesByPerson.map((person) => (
                <div key={person.id} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{person.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Limite: {formatCurrency(person.limit)} · Usado: {person.usedPercent.toFixed(1)}%
                      </p>
                    </div>
                    <Badge variant={person.exceeded ? "destructive" : "secondary"}>
                      {person.exceeded ? "excedido" : "ok"}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Gasto</p>
                      <p className="font-semibold">{formatCurrency(person.spent)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Saldo</p>
                      <p className="font-semibold">{formatCurrency(person.remaining)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Limite</p>
                      <p className="font-semibold">{formatCurrency(person.limit)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {report.expensesByCategory.length > 0 ? (
          <CategorySummary categories={report.expensesByCategory} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Gastos por categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Cadastre gastos para visualizar a categoria com maior gasto.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contas pendentes e atrasadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.pendingBills.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma conta pendente ou atrasada.</p>
            ) : (
              report.pendingBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{bill.name}</p>
                      <Badge variant={bill.computed_status === "atrasado" ? "destructive" : "outline"}>
                        {bill.computed_status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {bill.category || "Sem categoria"} · {bill.family_members?.name || "Sem responsável"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Vence em {formatDate(bill.due_date)}</p>
                  </div>
                  <p className="font-bold">{formatCurrency(Number(bill.amount))}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rendas recebidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.receivedIncomes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma renda recebida cadastrada.</p>
            ) : (
              report.receivedIncomes.map((income) => (
                <div key={income.id} className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{income.source}</p>
                      <Badge variant="secondary">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> recebido
                      </Badge>
                      <Badge variant="outline">renda {income.income_type}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {income.family_members?.name || "Sem pessoa vinculada"} · {income.receiving_bank || "Sem banco"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Data: {formatDate(income.expected_date)}</p>
                  </div>
                  <p className="font-bold">{formatCurrency(Number(income.amount))}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
