import { BellRing, Euro, ShieldCheck, Trash2 } from "lucide-react";

import {
  deleteExpenseCategory,
  updateFamilyMemberLimit,
} from "./actions";
import { ExpenseCategoryForm } from "@/components/finance/expense-category-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/finance/calculations";
import { getExpenseCategories, getFamilyMembers } from "@/lib/finance/server";

export default async function ConfiguracoesPage() {
  const [members, categories] = await Promise.all([
    getFamilyMembers(),
    getExpenseCategories(),
  ]);

  const totalLimit = members.reduce(
    (total, member) => total + Number(member.monthly_limit),
    0,
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-background p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
          FamilyFinance
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Configurações
        </h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Gerencie categorias, limites mensais, moeda padrão e regras automáticas do controle financeiro familiar.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Limite familiar</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalLimit)}</p>
            <p className="text-xs text-muted-foreground">Soma dos limites mensais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categorias</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{categories.length}</p>
            <p className="text-xs text-muted-foreground">Categorias de gastos cadastradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Moeda padrão</CardTitle>
            <BellRing className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">EUR</p>
            <p className="text-xs text-muted-foreground">Valores exibidos em euro</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Limites mensais por pessoa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{member.name}</p>
                  <Badge variant={member.is_active ? "secondary" : "outline"}>
                    {member.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Limite atual: {formatCurrency(Number(member.monthly_limit))}
                </p>
              </div>

              <form action={updateFamilyMemberLimit} className="flex gap-2">
                <input type="hidden" name="id" value={member.id} />
                <Input
                  name="monthly_limit"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={Number(member.monthly_limit)}
                  className="w-36"
                />
                <Button type="submit" variant="outline">Salvar</Button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Cadastrar categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseCategoryForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categorias de gastos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between gap-4 rounded-xl border p-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{category.name}</p>
                    {category.is_default ? <Badge variant="secondary">padrão</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {category.description || "Sem descrição"}
                  </p>
                </div>

                {!category.is_default ? (
                  <form action={deleteExpenseCategory}>
                    <input type="hidden" name="id" value={category.id} />
                    <Button type="submit" variant="outline" size="icon" aria-label="Excluir categoria">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Regras automáticas do sistema</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {[
            "Gastos cadastrados reduzem automaticamente o saldo mensal da pessoa.",
            "Contas a pagar vencidas aparecem como atrasadas no dashboard.",
            "Contas a receber vencidas e não recebidas aparecem como atrasadas.",
            "Alterar limite mensal recalcula dashboard, gastos e relatórios.",
            "Categorias padrão ficam protegidas contra exclusão acidental.",
            "Todos os valores usam euro como moeda padrão do sistema.",
          ].map((rule) => (
            <div key={rule} className="rounded-xl border p-4 text-sm text-muted-foreground">
              {rule}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
