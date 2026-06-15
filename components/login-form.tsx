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

      router.push(redirectTo ?? "/protected");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Não foi possível entrar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "w-full rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 text-white shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6",
        className,
      )}
      {...props}
    >
      <div className="mb-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.35rem] border border-white/10 bg-[#8b72f8] text-xl font-black text-white shadow-[0_18px_45px_rgba(139,114,248,0.35)]">
            S
          </div>
          <div className="rounded-full border border-white/10 bg-[#080810]/65 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#1de9b2]">
            seguro
          </div>
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/30">
          FamilyFinance
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.06em] text-white">
          Entrar
        </h1>
        <p className="mt-2 text-sm leading-6 text-white/40">
          Acesse seu painel privado para acompanhar gastos, contas e permissões.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
            Email
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <Input
              id="email"
              type="email"
              placeholder="voce@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-13 rounded-2xl border-white/10 bg-[#080810]/70 pl-11 text-base text-white placeholder:text-white/20 focus-visible:ring-[#8b72f8]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
              Senha
            </Label>
            <Link
              href="/auth/forgot-password"
              className="text-xs font-semibold text-[#b09cff] underline-offset-4 transition hover:text-white hover:underline"
            >
              Esqueci a senha
            </Link>
          </div>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-13 rounded-2xl border-white/10 bg-[#080810]/70 pl-11 text-base text-white placeholder:text-white/20 focus-visible:ring-[#8b72f8]"
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-[#f0506e]/20 bg-[#f0506e]/10 px-4 py-3 text-sm text-[#ff8da0]">
            {error}
          </div>
        ) : null}

        <Button
          type="submit"
          className="h-13 w-full rounded-2xl bg-[#8b72f8] text-base font-bold text-white shadow-[0_18px_45px_rgba(139,114,248,0.28)] transition active:scale-[0.98] hover:bg-[#7d66e4]"
          disabled={isLoading}
        >
          {isLoading ? "Entrando..." : "Entrar"}
          <ArrowRight className="h-4 w-4" />
        </Button>

        <div className="rounded-2xl border border-white/10 bg-[#080810]/45 p-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1de9b2]/10 text-[#1de9b2]">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <p className="text-xs leading-5 text-white/35">
              Ambiente privado. Os dados financeiros ficam protegidos pelo acesso da sua organizacao.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-white/40">
          Ainda não tem conta?{" "}
          <Link href="/auth/sign-up" className="font-semibold text-white underline-offset-4 hover:underline">
            Criar conta
          </Link>
        </p>
      </form>
    </div>
  );
}
