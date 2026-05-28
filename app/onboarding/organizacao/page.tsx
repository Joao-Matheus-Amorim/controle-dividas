import { OrganizationOnboardingForm } from "@/components/onboarding/organization-onboarding-form";

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
            Crie sua organizacao financeira
          </h1>
          <p className="text-sm leading-6 text-white/55">
            Este espaco vai agrupar pessoas, contas, gastos, bancos, permissoes e
            relatorios. Ao continuar, sua organizacao financeira inicial sera
            criada e seu usuario sera vinculado como owner dela.
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl shadow-black/30 backdrop-blur">
          <OrganizationOnboardingForm />
        </div>

        <div className="rounded-2xl border border-[#8b72f8]/20 bg-[#8b72f8]/10 p-4 text-sm leading-6 text-[#d8d0ff]">
          Escolha um nome e um slug para identificar sua organizacao. Depois da
          criacao, use Voltar para o app para acessar o ambiente protegido com
          acesso inicial de owner.
        </div>

        <a
          href="/protected"
          className="text-center text-sm font-semibold text-white/45 transition hover:text-white"
        >
          Voltar para o app
        </a>
      </section>
    </main>
  );
}
