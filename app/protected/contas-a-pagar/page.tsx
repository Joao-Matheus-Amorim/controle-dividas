import { AlertTriangle, CalendarDays, CheckCircle2, Trash2 } from "lucide-react";

import { deletePayableBill, updatePayableBillStatus } from "./actions";
import { PayableBillForm } from "@/components/finance/payable-bill-form";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/finance/calculations";
import { getPayableBillsDashboardData } from "@/lib/finance/server";

function statusVariant(status: string): BadgeProps["variant"] {
  if (status === "pago") return "secondary";
  if (status === "atrasado") return "destructive";
  return "outline";
}

export default async function ContasAPagarPage() {
  const {
    members,
    bills,
    totalPending,
    totalOverdue,
    totalPaid,
    pendingCount,
    overdueCount,
    paidCount,
  } = await getPayableBillsDashboardData();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-background p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
          FamilyFinance
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Contas a pagar
        </h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Controle vencimentos, responsaveis, recorrencia, banco utilizado e status das contas da familia.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
            <p className="text-xs text-muted-foreground">{pendingCount} conta(s) pendente(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Atrasadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(totalOverdue)}</p>
            <p className="text-xs text-muted-foreground">{overdueCount} conta(s) atrasada(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pagas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-muted-foreground">{paidCount} conta(s) paga(s)</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Cadastrar nova conta</CardTitle>
        </CardHeader>
        <CardContent>
          <PayableBillForm members={members} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contas cadastradas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bills.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada ainda.</p>
          ) : (
            bills.map((bill) => (
              <div
                key={bill.id}
                className="flex flex-col gap-4 rounded-xl border p-4 xl:flex-row xl:items-center xl:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{bill.name}</p>
                    <Badge variant={statusVariant(bill.computed_status)}>
                      {bill.computed_status}
                    </Badge>
                    {bill.recurrence ? <Badge variant="outline">{bill.recurrence}</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {bill.category || "Sem categoria"} · {bill.family_members?.name || "Sem responsavel"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Vencimento: {new Date(`${bill.due_date}T00:00:00`).toLocaleDateString("pt-BR")}
                    {bill.bank_used ? ` · Banco: ${bill.bank_used}` : ""}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
                  <p className="text-lg font-bold">{formatCurrency(Number(bill.amount))}</p>

                  <form action={updatePayableBillStatus} className="flex gap-2">
                    <input type="hidden" name="id" value={bill.id} />
                    <select
                      name="status"
                      defaultValue={bill.status}
                      className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="pago">Pago</option>
                      <option value="atrasado">Atrasado</option>
                    </select>
                    <Button type="submit" variant="outline">Salvar</Button>
                  </form>

                  <form action={deletePayableBill}>
                    <input type="hidden" name="id" value={bill.id} />
                    <Button type="submit" variant="outline" size="icon" aria-label="Excluir conta">
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
