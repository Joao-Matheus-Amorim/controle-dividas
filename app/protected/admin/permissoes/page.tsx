import { PermissionsForm } from "@/components/finance/permissions-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminDashboardData } from "@/lib/finance/admin-server";

export default async function AdminPermissoesPage() {
  const { profiles, permissions, modules } = await getAdminDashboardData();
  const familyUsers = profiles.filter((profile) => profile.role !== "admin");

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-background p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
          FamilyFinance
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Permissoes
        </h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          Defina o que cada usuario familiar pode ver, criar, editar ou excluir em cada modulo.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{familyUsers.length}</p>
            <p className="text-sm text-muted-foreground">Usuarios familiares configuraveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissoes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{permissions.length}</p>
            <p className="text-sm text-muted-foreground">Regras salvas no banco</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modulos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{modules.length}</p>
            <p className="text-sm text-muted-foreground">Modulos controlaveis</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Configurar permissoes</CardTitle>
        </CardHeader>
        <CardContent>
          <PermissionsForm profiles={profiles} permissions={permissions} />
        </CardContent>
      </Card>
    </div>
  );
}
