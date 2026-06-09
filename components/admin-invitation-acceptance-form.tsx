"use client";

import { ArrowRight, CheckCircle2, KeyRound, LogIn, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import {
  acceptAdminInvitation,
  type AcceptAdminInvitationState,
} from "@/app/auth/convite/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const initialState: AcceptAdminInvitationState = {};

type AdminInvitationAcceptanceFormProps = {
  token: string;
  className?: string;
};

export function AdminInvitationAcceptanceForm({
  token,
  className,
}: AdminInvitationAcceptanceFormProps) {
  const [state, formAction, isPending] = useActionState(acceptAdminInvitation, initialState);
  const hasToken = token.length > 0;

  return (
    <div
      className={cn(
        "w-full rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 text-white shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6",
        className,
      )}
    >
      <div className="mb-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.35rem] border border-white/10 bg-[#1de9b2] text-[#06110f] shadow-[0_18px_45px_rgba(29,233,178,0.24)]">
            <KeyRound className="h-6 w-6" />
          </div>
          <div className="rounded-full border border-white/10 bg-[#080810]/65 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#1de9b2]">
            convite admin
          </div>
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/30">
          FamilyFinance
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.06em] text-white">
          Aceitar convite
        </h1>
        <p className="mt-2 text-sm leading-6 text-white/40">
          Confirme o aceite para vincular sua conta ao painel da organizacao.
        </p>
      </div>

      {state.success ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#1de9b2]/20 bg-[#1de9b2]/10 px-4 py-4 text-sm text-[#1de9b2]">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{state.success}</span>
            </div>
          </div>

          <Button
            asChild
            className="h-13 w-full rounded-2xl bg-[#8b72f8] text-base font-bold text-white shadow-[0_18px_45px_rgba(139,114,248,0.28)] transition active:scale-[0.98] hover:bg-[#7d66e4]"
          >
            <Link href="/protected">
              Ir para o painel
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="token" value={token} />

          {!hasToken ? (
            <div className="rounded-2xl border border-[#f0506e]/20 bg-[#f0506e]/10 px-4 py-3 text-sm text-[#ff8da0]">
              Convite invalido ou ja utilizado.
            </div>
          ) : null}

          {state.error ? (
            <div className="rounded-2xl border border-[#f0506e]/20 bg-[#f0506e]/10 px-4 py-3 text-sm text-[#ff8da0]">
              {state.error}
            </div>
          ) : null}

          <Button
            type="submit"
            className="h-13 w-full rounded-2xl bg-[#8b72f8] text-base font-bold text-white shadow-[0_18px_45px_rgba(139,114,248,0.28)] transition active:scale-[0.98] hover:bg-[#7d66e4]"
            disabled={!hasToken || isPending}
          >
            {isPending ? "Validando convite..." : "Aceitar convite"}
            <ArrowRight className="h-4 w-4" />
          </Button>

          <div className="rounded-2xl border border-white/10 bg-[#080810]/45 p-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1de9b2]/10 text-[#1de9b2]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <p className="text-xs leading-5 text-white/35">
                O aceite acontece no servidor. O link do convite nao e salvo em armazenamento do navegador.
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-white/40">
            Ainda nao entrou na conta?{" "}
            <Link href="/auth/login" className="font-semibold text-white underline-offset-4 hover:underline">
              <LogIn className="mr-1 inline h-3.5 w-3.5" />
              Entrar
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
