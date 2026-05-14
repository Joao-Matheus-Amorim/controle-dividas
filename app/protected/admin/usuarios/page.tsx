import { ShieldCheck, UserRoundCheck, UserRoundX } from "lucide-react";

import { toggleFamilyUserStatus } from "../actions";
import { FamilyUserForm } from "@/components/finance/family-user-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminDashboardData } from "@/lib/finance/admin-server";

export default async function AdminUsuariosPage() {
  const { adminProfile, profiles, members } = await getAdminDashboardData();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-background p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
          FamilyFinance
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Usuarios familiares
        </h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Cadastre usuarios da familia, vincule cada usuario a um membro financeiro e controle quais perfis estao ativos.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Cadastrar usuario familiar</CardTitle>
        </CardHeader>
        <CardContent>
          <FamilyUserForm members={members} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Perfis cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {profiles.map((profile) => {
            const isCurrentAdmin = profile.id === adminProfile.id;

            return (
              <div
                key={profile.id}
                className="flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    {profile.role === "admin" ? (
                      <ShieldCheck className="h-5 w-5" />
                    ) : profile.is_active ? (
                      <UserRoundCheck className="h-5 w-5" />
                    ) : (
                      <UserRoundX className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{profile.name}</p>
                      <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
                        {profile.role === "admin" ? "Admin" : "Usuario"}
                      </Badge>
                      <Badge variant={profile.is_active ? "outline" : "destructive"}>
                        {profile.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                      {isCurrentAdmin ? <Badge variant="outline">voce</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {profile.email || "Email nao informado"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Membro financeiro: {profile.family_members?.name || "Sem vinculo"}
                    </p>
                  </div>
                </div>

                <form action={toggleFamilyUserStatus}>
                  <input type="hidden" name="id" value={profile.id} />
                  <input type="hidden" name="is_active" value={String(profile.is_active)} />
                  <Button type="submit" variant="outline" disabled={isCurrentAdmin}>
                    {profile.is_active ? "Desativar" : "Ativar"}
                  </Button>
                </form>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
