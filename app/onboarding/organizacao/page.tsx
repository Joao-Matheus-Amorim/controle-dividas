import { OrganizationOnboardingForm } from "@/components/onboarding/organization-onboarding-form";

export default function InitialOrganizationOnboardingPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(139,114,248,0.24),transparent_65%)]" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center gap-6">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-ff-bg-soft text-sm font-black text-primary shadow-lg shadow-black/20">
            FF
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ff-subtle-foreground">
            Onboarding inicial
          </p>
          <h1 className="text-3xl font-black tracking-tight">
            Crie seu espaco financeiro
          </h1>
          <p className="text-sm leading-6 text-foreground">
            Este espaco vai agrupar pessoas, contas, gastos, bancos, permissoes e
            relatorios. Ao continuar, seu espaco financeiro inicial sera criado e
            seu usuario sera vinculado como responsavel principal.
          </p>
        </div>

        <div className="rounded-[2rem] border border-border bg-ff-bg-soft p-5 shadow-2xl shadow-black/30">
          <OrganizationOnboardingForm />
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm leading-6 text-foreground/80">
          Escolha um nome para o espaco financeiro e, se quiser, ajuste o
          identificador do link. Depois da criacao, use Voltar para o app para
          acessar o ambiente protegido como responsavel principal.
        </div>

        <a
          href="/protected"
          className="text-center text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          Voltar para o app
        </a>
      </section>
    </main>
  );
}
