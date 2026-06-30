"use client";

import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { requestPasswordReset } from "@/app/auth/forgot-password/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function getFriendlyAuthError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Nao foi possivel enviar o email de recuperacao. Confira o email informado e tente novamente.";
}

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await requestPasswordReset(email);

      if (!result.success) {
        throw new Error(result.error);
      }

      setSuccess(true);
    } catch (error: unknown) {
      setError(getFriendlyAuthError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "w-full rounded-[2rem] border border-border bg-ff-bg-soft p-5 text-foreground shadow-ff-lg sm:p-6",
        className,
      )}
      {...props}
    >
      <div className="mb-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.35rem] border border-border bg-primary text-xl font-black text-foreground shadow-ff-lg">
            F
          </div>
          <div className="rounded-full border border-border bg-background/65 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-ff-success">
            recuperacao
          </div>
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.24em] text-ff-subtle-foreground">
          FamilyFinance
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.06em] text-foreground">
          Recuperar senha
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Informe seu email cadastrado. Enviaremos um link seguro para criar uma nova senha.
        </p>
      </div>

      {success ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-ff-success bg-ff-success-soft px-4 py-4 text-sm text-ff-success">
            Email enviado. Se este email estiver cadastrado, voce recebera as instrucoes de recuperacao em instantes.
          </div>

          <Button
            asChild
            className="h-13 w-full rounded-2xl bg-primary text-base font-bold text-foreground shadow-ff-lg transition active:scale-[0.98] hover:bg-ff-primary-hover"
          >
            <Link href="/auth/login">
              <ArrowLeft className="h-4 w-4" />
              Voltar para entrada
            </Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleForgotPassword} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.18em] text-ff-subtle-foreground">
              Email cadastrado
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ff-subtle-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="voce@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-13 rounded-2xl border-border bg-background/70 pl-11 text-base text-foreground placeholder:text-ff-subtle-foreground focus-visible:ring-ring"
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-ff-destructive bg-ff-destructive-soft px-4 py-3 text-sm text-ff-destructive">
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            className="h-13 w-full rounded-2xl bg-primary text-base font-bold text-foreground shadow-ff-lg transition active:scale-[0.98] hover:bg-ff-primary-hover"
            disabled={isLoading}
          >
            {isLoading ? "Enviando..." : "Enviar link de recuperacao"}
          </Button>

          <div className="rounded-2xl border border-border bg-background/45 p-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ff-success-soft text-ff-success">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <p className="text-xs leading-5 text-ff-subtle-foreground">
                Por seguranca, nao informamos se o email existe ou nao. Confira sua caixa de entrada e spam.
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Lembrou a senha?{" "}
            <Link href="/auth/login" className="font-semibold text-foreground underline-offset-4 hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
