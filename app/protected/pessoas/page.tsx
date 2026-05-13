import { UserRoundCheck, UserRoundX } from "lucide-react";

import { toggleFamilyMemberStatus } from "./actions";
import { FamilyMemberForm } from "@/components/finance/family-member-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/finance/calculations";
import { getFamilyMembers } from "@/lib/finance/server";

export default async function PessoasPage() {
  const members = await getFamilyMembers();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-background p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
          FamilyFinance
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Pessoas
        </h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Cadastre os membros da familia, defina o limite mensal de cada pessoa e acompanhe quem esta ativo no controle financeiro.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Cadastrar nova pessoa</CardTitle>
        </CardHeader>
        <CardContent>
          <FamilyMemberForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membros cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  {member.is_active ? (
                    <UserRoundCheck className="h-5 w-5" />
                  ) : (
                    <UserRoundX className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{member.name}</p>
                    <Badge variant={member.is_active ? "secondary" : "outline"}>
                      {member.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {member.role || "Sem perfil informado"}
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    Limite mensal: {formatCurrency(Number(member.monthly_limit))}
                  </p>
                </div>
              </div>

              <form action={toggleFamilyMemberStatus}>
                <input type="hidden" name="id" value={member.id} />
                <input
                  type="hidden"
                  name="is_active"
                  value={String(member.is_active)}
                />
                <Button type="submit" variant="outline">
                  {member.is_active ? "Desativar" : "Ativar"}
                </Button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
