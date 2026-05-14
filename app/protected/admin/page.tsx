import { ShieldCheck, UsersRound, KeyRound, ArrowRight } from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminDashboardData } from "@/lib/finance/admin-server";

export default async function AdminPage() {
  const { adminProfile, profiles, permissions, modules } = await getAdminDashboardData();

  const familyUsers = profiles.filter((profile) => profile.role === "user");
  const activeUsers = profiles.filter((profile) => profile.is_active);
  const configuredProfiles = new Set(permissions.map((permission) => permission.profile_id));

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-background p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
          FamilyFinance
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Admin familiar
        </h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Gerencie usuarios familiares e defina o que cada pessoa pode ver, criar, editar ou excluir dentro do sistema.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Perfil Admin</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{adminProfile.name}</p>
            <p className="text-xs text-muted-foreground">{adminProfile.email || "Email nao informado"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios familiares</CardTitle>
            <UsersRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{familyUsers.length}</p>
            <p className="text-xs text-muted-foreground">{activeUsers.length} perfil(is) ativo(s) no total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Permissoes</CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{permissions.length}</p>
            <p className="text-xs text-muted-foreground">{configuredProfiles.size} perfil(is) com permissoes</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Usuarios e membros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cadastre usuarios familiares, vincule cada usuario a um membro financeiro e ative ou desative acessos.
            </p>
            <Button asChild>
              <Link href="/protected/admin/usuarios">
                Gerenciar usuarios
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissoes por modulo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure quais modulos cada usuario pode ver, criar, editar ou excluir.
            </p>
            <Button asChild variant="outline">
              <Link href="/protected/admin/permissoes">
                Gerenciar permissoes
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Modulos controlaveis</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {modules.map((module) => (
            <Badge key={module.key} variant="secondary">
              {module.label}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
