import { Trash2 } from "lucide-react";

import { deleteExpense } from "./actions";
import { ExpenseForm } from "@/components/finance/expense-form";
import { PersonBalanceCard } from "@/components/finance/person-balance-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/finance/calculations";
import { getExpenseDashboardData } from "@/lib/finance/server";

export default async function GastosPage() {
  const { members, categories, expenses, memberSummaries, totalExpenses } =
    await getExpenseDashboardData();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-background p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
          FamilyFinance
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Gastos
        </h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Registre despesas diarias por pessoa. Cada lancamento entra no total gasto e reduz automaticamente o saldo mensal disponivel do membro.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cadastrar novo gasto</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseForm members={members} categories={categories} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo do mes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Total gasto</p>
              <p className="mt-1 text-3xl font-bold">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-sm text-muted-foreground">Lancamentos</p>
              <p className="mt-1 text-3xl font-bold">{expenses.length}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              O saldo restante e recalculado com base no limite mensal menos todos os gastos lancados.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Impacto por pessoa</h2>
          <p className="text-sm text-muted-foreground">
            Veja quanto cada membro ja usou do limite mensal.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {memberSummaries.map((member) => (
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

      <Card>
        <CardHeader>
          <CardTitle>Gastos cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum gasto cadastrado ainda.
            </p>
          ) : (
            expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{expense.description}</p>
                    <Badge variant="secondary">
                      {expense.expense_categories?.name || "Sem categoria"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {expense.family_members?.name || "Pessoa nao informada"} · {new Date(`${expense.expense_date}T00:00:00`).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {expense.purchase_location || "Local nao informado"}
                    {expense.payment_method ? ` · ${expense.payment_method}` : ""}
                    {expense.bank_or_card ? ` · ${expense.bank_or_card}` : ""}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 md:justify-end">
                  <p className="text-lg font-bold">{formatCurrency(Number(expense.amount))}</p>
                  <form action={deleteExpense}>
                    <input type="hidden" name="id" value={expense.id} />
                    <Button type="submit" variant="outline" size="icon" aria-label="Excluir gasto">
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
