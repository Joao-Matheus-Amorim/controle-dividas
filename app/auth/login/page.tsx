import { LoginForm } from "@/components/login-form";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getInviteReturnPath(searchParams?: Record<string, string | string[] | undefined>) {
  const value = searchParams?.next;
  const nextPath = Array.isArray(value) ? value[0] : value;

  if (typeof nextPath !== "string") {
    return undefined;
  }

  try {
    const url = new URL(nextPath, "https://familyfinance.local");

    if (url.origin !== "https://familyfinance.local") {
      return undefined;
    }

    if (url.pathname !== "/auth/convite" || !url.searchParams.get("token")) {
      return undefined;
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return undefined;
  }
}

export default async function Page({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const inviteReturnPath = getInviteReturnPath(resolvedSearchParams);

  return (
    <main className="dark relative min-h-svh overflow-hidden bg-[#080810] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(139,114,248,0.22),transparent_34%),radial-gradient(circle_at_82%_72%,rgba(29,233,178,0.12),transparent_28%),linear-gradient(135deg,#080810_0%,#0f0b22_48%,#07070c_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="pointer-events-none absolute -left-28 top-20 h-72 w-72 rounded-full border border-white/10 bg-white/[0.025] blur-sm" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full border border-[#8b72f8]/20 bg-[#8b72f8]/5 blur-sm" />

      <div className="relative z-10 grid min-h-svh items-center gap-10 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 xl:px-20">
        <section className="hidden max-w-2xl lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-white/35 shadow-2xl shadow-black/20 backdrop-blur-xl">
            Finanças familiares
          </div>
          <h1 className="mt-7 max-w-xl text-6xl font-black leading-[0.92] tracking-[-0.07em] text-white xl:text-7xl">
            Controle da família, sem ruído.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/45">
            Um painel privado para acompanhar gastos, bancos, contas, recebimentos e permissões com clareza de app financeiro premium.
          </p>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/25">Gastos</p>
              <p className="mt-3 text-2xl font-bold text-[#f0506e]">01</p>
            </div>
            <div className="translate-y-5 rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/25">Bancos</p>
              <p className="mt-3 text-2xl font-bold text-[#5caaff]">02</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/25">Regras</p>
              <p className="mt-3 text-2xl font-bold text-[#1de9b2]">03</p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <LoginForm redirectTo={inviteReturnPath} />
        </section>
      </div>
    </main>
  );
}
