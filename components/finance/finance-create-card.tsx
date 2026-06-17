import type { ReactNode } from "react";
import Link from "next/link";

interface FinanceCreateCardProps {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  memberCount: number;
  peopleHref: string;
  children: ReactNode;
}

export function FinanceCreateCard({
  id,
  eyebrow,
  title,
  description,
  memberCount,
  peopleHref,
  children,
}: FinanceCreateCardProps) {
  const hasMembers = memberCount > 0;

  return (
    <section id={id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/25">{eyebrow}</p>
          <p className="mt-1 text-sm leading-5 text-white/45">{hasMembers ? description : "Cadastre uma pessoa antes de criar lancamentos financeiros."}</p>
        </div>

        {hasMembers ? (
          <div className="w-full sm:w-auto">{children}</div>
        ) : (
          <Link
            href={peopleHref}
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#8b72f8] px-4 text-sm font-bold text-white shadow-lg shadow-[#8b72f8]/20 transition hover:bg-[#7d66e4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b72f8]/40 sm:w-auto sm:min-w-[12rem]"
          >
            Cadastrar pessoa
          </Link>
        )}
      </div>

      {!hasMembers ? (
        <div className="mt-4 rounded-2xl border border-[#8b72f8]/20 bg-[#8b72f8]/10 p-3">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-xs leading-5 text-white/50">
            Pessoas definem responsavel, permissao e escopo dos dados. Depois disso, os formularios ficam liberados aqui.
          </p>
        </div>
      ) : null}
    </section>
  );
}
