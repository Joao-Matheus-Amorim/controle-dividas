"use client";

import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createAuthorizedFamilyAccess } from "@/app/auth/sign-up/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [authorizedName, setAuthorizedName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setAuthorizedName(null);

    if (password !== repeatPassword) {
      setError("As senhas não conferem.");
      setIsLoading(false);
      return;
    }

    try {
      const authorization = await createAuthorizedFamilyAccess(email, password);

      if (!authorization.allowed) {
        setError(authorization.error || "Este email ainda não foi autorizado pelo Admin familiar.");
        return;
      }

      setAuthorizedName(authorization.name ?? null);

      router.push("/auth/sign-up-success");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Não foi possível criar o acesso.");
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
            primeiro acesso
          </div>
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.24em] text-ff-subtle-foreground">
          FamilyFinance
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.06em] text-foreground">
          Criar acesso
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Use apenas o email que o Admin familiar cadastrou para você.
        </p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.18em] text-ff-subtle-foreground">
            Email autorizado
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ff-subtle-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="email cadastrado pelo Admin"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-13 rounded-2xl border-border bg-background/70 pl-11 text-base text-foreground placeholder:text-ff-subtle-foreground focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.18em] text-ff-subtle-foreground">
            Criar senha
          </Label>
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

        <div className="space-y-2">
          <Label htmlFor="repeat-password" className="text-xs font-bold uppercase tracking-[0.18em] text-ff-subtle-foreground">
            Repetir senha
          </Label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ff-subtle-foreground" />
            <Input
              id="repeat-password"
              type="password"
              required
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              className="h-13 rounded-2xl border-border bg-background/70 pl-11 text-base text-foreground placeholder:text-ff-subtle-foreground focus-visible:ring-ring"
            />
          </div>
        </div>

        {authorizedName ? (
          <div className="rounded-2xl border border-ff-success bg-ff-success-soft px-4 py-3 text-sm text-ff-success">
            Acesso autorizado para {authorizedName}.
          </div>
        ) : null}

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
          {isLoading ? "Validando..." : "Criar acesso"}
          <ArrowRight className="h-4 w-4" />
        </Button>

        <div className="rounded-2xl border border-border bg-background/45 p-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ff-success-soft text-ff-success">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <p className="text-xs leading-5 text-ff-subtle-foreground">
              O cadastro só funciona para emails previamente liberados pelo Admin familiar.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Já tem acesso?{" "}
          <Link href="/auth/login" className="font-semibold text-foreground underline-offset-4 hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}
