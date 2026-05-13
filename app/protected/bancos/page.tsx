import { Banknote, CreditCard, Trash2, Users } from "lucide-react";

import { deleteBankAccount, updateBankAccountBalance } from "./actions";
import { BankAccountForm } from "@/components/finance/bank-account-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/finance/calculations";
import { getBanksDashboardData } from "@/lib/finance/banks-server";

export default async function BancosPage() {
  const { members, accounts, accountsByMember, totalBalance, totalAccounts } =
    await getBanksDashboardData();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-background p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
          FamilyFinance
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Bancos
        </h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Cadastre bancos e contas por pessoa para relacionar gastos, contas a pagar e recebimentos.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo total em bancos</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
            <p className="text-xs text-muted-foreground">Soma das contas cadastradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contas cadastradas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalAccounts}</p>
            <p className="text-xs text-muted-foreground">Bancos, cartoes e contas por pessoa</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Cadastrar novo banco</CardTitle>
        </CardHeader>
        <CardContent>
          <BankAccountForm members={members} />
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Saldo por pessoa</h2>
          <p className="text-sm text-muted-foreground">
            Veja quais bancos estao vinculados a cada membro da familia.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {accountsByMember.map((member) => (
            <Card key={member.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">{member.name}</CardTitle>
                  <Badge variant="secondary">{formatCurrency(member.totalBalance)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {member.accounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma conta vinculada.</p>
                ) : (
                  member.accounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{account.bank_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {account.account_type || "Tipo nao informado"}
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(Number(account.current_balance))}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Todos os bancos cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum banco cadastrado ainda.</p>
          ) : (
            accounts.map((account) => (
              <div
                key={account.id}
                className="flex flex-col gap-4 rounded-xl border p-4 xl:flex-row xl:items-center xl:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{account.bank_name}</p>
                      <Badge variant="outline">{account.currency}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {account.family_members?.name || "Sem pessoa vinculada"} · {account.account_type || "Tipo nao informado"}
                    </p>
                    {account.notes ? (
                      <p className="mt-1 text-sm text-muted-foreground">{account.notes}</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
                  <form action={updateBankAccountBalance} className="flex gap-2">
                    <input type="hidden" name="id" value={account.id} />
                    <Input
                      name="current_balance"
                      type="number"
                      step="0.01"
                      defaultValue={Number(account.current_balance)}
                      className="w-32"
                    />
                    <Button type="submit" variant="outline">Salvar</Button>
                  </form>

                  <form action={deleteBankAccount}>
                    <input type="hidden" name="id" value={account.id} />
                    <Button type="submit" variant="outline" size="icon" aria-label="Excluir banco">
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
