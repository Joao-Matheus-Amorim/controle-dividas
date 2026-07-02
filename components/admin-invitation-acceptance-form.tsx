"use client";

import { ArrowRight, CheckCircle2, KeyRound, LogIn, ShieldCheck, UserPlus } from "lucide-react";
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

function getLoginHref(token: string) {
  if (!token) {
    return "/auth/login";
  }

  const invitePath = `/auth/convite?token=${encodeURIComponent(token)}`;
  return `/auth/login?next=${encodeURIComponent(invitePath)}`;
}

function getSignUpHref(token: string) {
  if (!token) {
    return "/auth/sign-up";
  }

  const invitePath = `/auth/convite?token=${encodeURIComponent(token)}`;
  return `/auth/sign-up?next=${encodeURIComponent(invitePath)}`;
}

export function AdminInvitationAcceptanceForm({
  token,
  className,
}: AdminInvitationAcceptanceFormProps) {
  const [state, formAction, isPending] = useActionState(acceptAdminInvitation, initialState);
  const hasToken = token.length > 0;
  const loginHref = getLoginHref(token);
  const signUpHref = getSignUpHref(token);
  const needsAuthentication = state.status === "unauthenticated";

  return (
    <div
      className={cn(
        "w-full rounded-[2rem] border border-border bg-ff-bg-soft p-5 text-foreground shadow-ff-lg sm:p-6",
        className,
      )}
    >
      <div className="mb-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.35rem] border border-border bg-ff-success-soft text-ff-success-foreground shadow-[0_18px_45px_rgba(29,233,178,0.24)]">
            <KeyRound className="h-6 w-6" />
          </div>
          <div className="rounded-full border border-border bg-background/65 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-ff-success">
            convite admin
          </div>
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.24em] text-ff-subtle-foreground">
          FamilyFinance
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.06em] text-foreground">
          Aceitar convite
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Confirme o aceite para vincular sua conta ao painel da organizacao.
        </p>
      </div>

      {state.success ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-ff-success bg-ff-success-soft px-4 py-4 text-sm text-ff-success">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{state.success}</span>
            </div>
          </div>

          <Button
            asChild
            className="h-13 w-full rounded-2xl bg-primary text-base font-bold text-foreground shadow-ff-lg transition active:scale-[0.98] hover:bg-ff-primary-hover"
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
            <div className="rounded-2xl border border-ff-destructive bg-ff-destructive-soft px-4 py-3 text-sm text-ff-destructive">
              Convite invalido ou ja utilizado.
            </div>
          ) : null}

          {needsAuthentication ? (
            <div className="space-y-4 rounded-2xl border border-border bg-background/55 p-4">
              <div>
                <p className="text-sm font-bold text-foreground">Este convite precisa de uma conta</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Crie sua conta com o mesmo email convidado. Se voce ja tem conta, entre para continuar o aceite.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  asChild
                  className="h-11 rounded-2xl bg-primary text-sm font-bold text-foreground shadow-ff-sm transition active:scale-[0.98] hover:bg-ff-primary-hover"
                >
                  <Link href={signUpHref}>
                    <UserPlus className="h-4 w-4" />
                    Criar conta
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-2xl border-border bg-card text-sm font-bold text-foreground transition active:scale-[0.98] hover:bg-ff-bg-soft"
                >
                  <Link href={loginHref}>
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </Link>
                </Button>
              </div>
            </div>
          ) : state.error ? (
            <div className="rounded-2xl border border-ff-destructive bg-ff-destructive-soft px-4 py-3 text-sm text-ff-destructive">
              {state.error}
            </div>
          ) : null}

          <Button
            type="submit"
            className="h-13 w-full rounded-2xl bg-primary text-base font-bold text-foreground shadow-ff-lg transition active:scale-[0.98] hover:bg-ff-primary-hover"
            disabled={!hasToken || isPending}
          >
            {isPending ? "Validando convite..." : "Aceitar convite"}
            <ArrowRight className="h-4 w-4" />
          </Button>

          <div className="rounded-2xl border border-border bg-background/45 p-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ff-success-soft text-ff-success">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <p className="text-xs leading-5 text-ff-subtle-foreground">
                O aceite acontece no servidor. O link do convite nao e salvo em armazenamento do navegador.
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Ainda nao tem conta?{" "}
            <Link href={signUpHref} className="font-semibold text-foreground underline-offset-4 hover:underline">
              Criar conta
            </Link>
            {" ou "}
            <Link href={loginHref} className="font-semibold text-foreground underline-offset-4 hover:underline">
              <LogIn className="mr-1 inline h-3.5 w-3.5" />
              Entrar
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
