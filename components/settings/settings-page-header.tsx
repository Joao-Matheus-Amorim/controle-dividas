import { ShieldCheck } from "lucide-react";

export function SettingsPageHeader() {
  return (
    <section className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/25">Sistema</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">Configurações</h1>
        <p className="mt-1 text-sm text-white/40">Limites, categorias e regras</p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#b09cff]">
        <ShieldCheck className="h-5 w-5" />
      </div>
    </section>
  );
}
