"use client";

import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { loginWithPassword } from "@/app/auth/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function LoginForm({
  redirectTo,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { redirectTo?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await loginWithPassword(email, password);

      if (!result.success) {
        throw new Error(result.error);
      }

      router.push(redirectTo ?? "/convites");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Não foi possível entrar.");
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
            S
          </div>
          <div className="rounded-full border border-border bg-background/65 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-ff-success">
            seguro
          </div>
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.24em] text-ff-subtle-foreground">
          FamilyFinance
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.06em] text-foreground">
          Entrar
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Acesse seu painel privado para acompanhar gastos, contas e permissões.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.18em] text-ff-subtle-foreground">
            Email
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

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.18em] text-ff-subtle-foreground">
              Senha
            </Label>
            <Link
              href="/auth/forgot-password"
              className="text-xs font-semibold text-primary underline-offset-4 transition hover:text-foreground hover:underline"
            >
              Esqueci a senha
            </Link>
          </div>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ff-subtle-foreground" />
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          {isLoading ? "Entrando..." : "Entrar"}
          <ArrowRight className="h-4 w-4" />
        </Button>

        <div className="rounded-2xl border border-border bg-background/45 p-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ff-success-soft text-ff-success">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <p className="text-xs leading-5 text-ff-subtle-foreground">
              Ambiente privado. Os dados financeiros ficam protegidos pelo acesso da sua organizacao.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link href="/auth/sign-up" className="font-semibold text-foreground underline-offset-4 hover:underline">
            Criar conta
          </Link>
        </p>
      </form>
    </div>
  );
}
