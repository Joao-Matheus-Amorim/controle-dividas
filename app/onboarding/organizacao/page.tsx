import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function InitialOrganizationOnboardingPage() {
  return (
    <main className="min-h-screen bg-[#080810] px-4 py-8 text-white">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(139,114,248,0.24),transparent_65%)]" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center gap-6">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-sm font-black text-[#b09cff] shadow-lg shadow-black/20">
            FF
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/35">
            Onboarding inicial
          </p>
          <h1 className="text-3xl font-black tracking-tight">
            Crie sua organização financeira
          </h1>
          <p className="text-sm leading-6 text-white/55">
            Este espaço vai agrupar pessoas, contas, gastos, bancos, permissões e
            relatórios. A criação definitiva será ligada em uma próxima etapa
            segura.
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organization_name">Nome da organização</Label>
              <Input
                id="organization_name"
                name="organization_name"
                placeholder="Ex: Família Amorim"
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization_slug">Slug</Label>
              <Input
                id="organization_slug"
                name="organization_slug"
                placeholder="familia-amorim"
                disabled
              />
              <p className="text-xs leading-5 text-white/35">
                O slug será usado para identificar a organização de forma segura
                em fluxos futuros.
              </p>
            </div>

            <Button
              type="button"
              disabled
              className="w-full rounded-2xl bg-[#8b72f8] font-bold text-white hover:bg-[#7d66e4]"
            >
              Criar organização em breve
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#8b72f8]/20 bg-[#8b72f8]/10 p-4 text-sm leading-6 text-[#d8d0ff]">
          Esta tela é apenas a shell visual inicial. Ela ainda não grava dados no
          banco e não cria organization ou membership.
        </div>

        <Link
          href="/protected"
          className="text-center text-sm font-semibold text-white/45 transition hover:text-white"
        >
          Voltar para o app
        </Link>
      </section>
    </main>
  );
}
