import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getOrgPathFromProtectedPath } from "@/lib/organizations/paths";

type AdminManagementLinksProps = {
  orgSlug?: string;
};

export function AdminManagementLinks({ orgSlug }: AdminManagementLinksProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4 rounded-[1.5rem] border border-border bg-ff-bg-soft p-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Usuários e membros</p>
          <p className="mt-2 text-sm text-muted-foreground">Cadastre familiares, vincule membros financeiros e ative acessos.</p>
        </div>
        <Button asChild className="h-11 rounded-2xl bg-primary font-semibold text-foreground hover:bg-ff-primary-hover">
          <Link href={getOrgPathFromProtectedPath("/protected/admin/usuarios", orgSlug)}>
            Gerenciar usuários
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="space-y-4 rounded-[1.5rem] border border-border bg-ff-bg-soft p-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Permissões por módulo</p>
          <p className="mt-2 text-sm text-muted-foreground">Configure quem pode ver, criar, editar ou excluir em cada área.</p>
        </div>
        <Button asChild variant="outline" className="h-11 rounded-2xl border-border bg-transparent font-semibold text-foreground hover:bg-ff-bg-soft hover:text-foreground">
          <Link href={getOrgPathFromProtectedPath("/protected/admin/permissoes", orgSlug)}>
            Gerenciar permissões
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
