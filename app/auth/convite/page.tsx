import { AdminInvitationAcceptanceForm } from "@/components/admin-invitation-acceptance-form";

type InvitationPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getToken(searchParams?: Record<string, string | string[] | undefined>) {
  const value = searchParams?.token;

  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

export default async function AdminInvitationPage({ searchParams }: InvitationPageProps) {
  const resolvedSearchParams = await searchParams;
  const token = getToken(resolvedSearchParams);

  return (
    <main className="dark relative min-h-svh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_16%,rgba(198,142,77,0.15),transparent_32%),radial-gradient(circle_at_80%_78%,rgba(198,142,77,0.12),transparent_30%),linear-gradient(135deg,#14110F_0%,#1a1613_48%,#14110F_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="pointer-events-none absolute -left-28 top-20 h-72 w-72 rounded-full border border-border bg-ff-bg-soft blur-sm" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full border border-ff-success bg-ff-success-soft/5 blur-sm" />

      <div className="relative z-10 grid min-h-svh items-center gap-10 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 xl:px-20">
        <section className="hidden max-w-2xl lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-ff-subtle-foreground shadow-2xl shadow-black/20">
            Acesso por convite
          </div>
          <h1 className="mt-7 max-w-xl text-6xl font-black leading-[0.92] tracking-[-0.07em] text-foreground xl:text-7xl">
            Entre na organizacao certa.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">
            O aceite confirma sua conta autenticada e vincula o acesso ao painel correto sem expor dados financeiros.
          </p>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            <div className="rounded-[1.5rem] border border-border bg-card p-4 shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Token</p>
              <p className="mt-3 text-2xl font-bold text-ff-success">01</p>
            </div>
            <div className="translate-y-5 rounded-[1.5rem] border border-border bg-card p-4 shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Conta</p>
              <p className="mt-3 text-2xl font-bold text-primary">02</p>
            </div>
            <div className="rounded-[1.5rem] border border-border bg-card p-4 shadow-[0_22px_70px_rgba(0,0,0,0.28)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-ff-subtle-foreground">Painel</p>
              <p className="mt-3 text-2xl font-bold text-primary">03</p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <AdminInvitationAcceptanceForm token={token} />
        </section>
      </div>
    </main>
  );
}
