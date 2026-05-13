import { AlertTriangle, CheckCircle2, Clock3, Repeat, Trash2, WalletCards } from "lucide-react";

import { deleteReceivableIncome, updateReceivableIncomeStatus } from "./actions";
import { ReceivableIncomeForm } from "@/components/finance/receivable-income-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/finance/calculations";
import { getReceivableIncomesDashboardData } from "@/lib/finance/server";

function statusVariant(status: string) {
  if (status === "recebido") return "secondary";
  if (status === "atrasado") return "destructive";
  return "outline";
}

export default async function ContasAReceberPage() {
  const {
    members,
    incomes,
    totalExpected,
    totalOverdue,
    totalReceived,
    totalFixed,
    totalVariable,
    expectedCount,
    overdueCount,
    receivedCount,
  } = await getReceivableIncomesDashboardData();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-background p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
          FamilyFinance
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Contas a receber
        </h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Controle salarios, empresa, servicos, mesadas e outras entradas da familia, separando renda fixa e variavel.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Previsto</CardTitle>
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalExpected)}</p>
            <p className="text-xs text-muted-foreground">{expectedCount} recebimento(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recebido</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalReceived)}</p>
            <p className="text-xs text-muted-foreground">{receivedCount} recebido(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Atrasado</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totalOverdue)}</p>
            <p className="text-xs text-muted-foreground">{overdueCount} atrasado(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Renda fixa</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalFixed)}</p>
            <p className="text-xs text-muted-foreground">Entradas recorrentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Renda variavel</CardTitle>
            <WalletCards className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalVariable)}</p>
            <p className="text-xs text-muted-foreground">Servicos, vendas e extras</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Cadastrar novo recebimento</CardTitle>
        </CardHeader>
        <CardContent>
          <ReceivableIncomeForm members={members} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recebimentos cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {incomes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conta a receber cadastrada ainda.</p>
          ) : (
            incomes.map((income) => (
              <div
                key={income.id}
                className="flex flex-col gap-4 rounded-xl border p-4 xl:flex-row xl:items-center xl:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{income.source}</p>
                    <Badge variant={statusVariant(income.computed_status)}>
                      {income.computed_status}
                    </Badge>
                    <Badge variant="outline">
                      renda {income.income_type}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {income.family_members?.name || "Sem pessoa vinculada"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Data prevista: {new Date(`${income.expected_date}T00:00:00`).toLocaleDateString("pt-BR")}
                    {income.receiving_bank ? ` · Banco: ${income.receiving_bank}` : ""}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
                  <p className="text-lg font-bold">{formatCurrency(Number(income.amount))}</p>

                  <form action={updateReceivableIncomeStatus} className="flex gap-2">
                    <input type="hidden" name="id" value={income.id} />
                    <select
                      name="status"
                      defaultValue={income.status}
                      className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                    >
                      <option value="previsto">Previsto</option>
                      <option value="recebido">Recebido</option>
                      <option value="atrasado">Atrasado</option>
                    </select>
                    <Button type="submit" variant="outline">Salvar</Button>
                  </form>

                  <form action={deleteReceivableIncome}>
                    <input type="hidden" name="id" value={income.id} />
                    <Button type="submit" variant="outline" size="icon" aria-label="Excluir recebimento">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
