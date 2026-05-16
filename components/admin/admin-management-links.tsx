import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function AdminManagementLinks() {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Usuários e membros</p>
          <p className="mt-2 text-sm text-white/45">Cadastre familiares, vincule membros financeiros e ative acessos.</p>
        </div>
        <Button asChild className="h-11 rounded-2xl bg-[#8b72f8] font-semibold text-white hover:bg-[#7d66e4]">
          <Link href="/protected/admin/usuarios">
            Gerenciar usuários
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">Permissões por módulo</p>
          <p className="mt-2 text-sm text-white/45">Configure quem pode ver, criar, editar ou excluir em cada área.</p>
        </div>
        <Button asChild variant="outline" className="h-11 rounded-2xl border-white/10 bg-transparent font-semibold text-white/70 hover:bg-white/10 hover:text-white">
          <Link href="/protected/admin/permissoes">
            Gerenciar permissões
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
