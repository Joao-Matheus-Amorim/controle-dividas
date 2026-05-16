"use client";

import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function getFriendlyAuthError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Nao foi possivel atualizar a senha. Tente novamente.";
}

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password.length < 6) {
      setError("A nova senha precisa ter pelo menos 6 caracteres.");
      setIsLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setError("As senhas nao conferem.");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push("/protected");
    } catch (error: unknown) {
      setError(getFriendlyAuthError(error));
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
            F
          </div>
          <div className="rounded-full border border-white/10 bg-[#080810]/65 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#1de9b2]">
            nova senha
          </div>
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/30">
          FamilyFinance
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.06em] text-white">
          Atualizar senha
        </h1>
        <p className="mt-2 text-sm leading-6 text-white/40">
          Crie uma nova senha segura para continuar acessando o painel da familia.
        </p>
      </div>

      <form onSubmit={handleUpdatePassword} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
            Nova senha
          </Label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <Input
              id="password"
              type="password"
              placeholder="minimo de 6 caracteres"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-13 rounded-2xl border-white/10 bg-[#080810]/70 pl-11 text-base text-white placeholder:text-white/20 focus-visible:ring-[#8b72f8]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="repeat-password" className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
            Repetir nova senha
          </Label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
            <Input
              id="repeat-password"
              type="password"
              required
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
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
          {isLoading ? "Salvando..." : "Salvar nova senha"}
          <ArrowRight className="h-4 w-4" />
        </Button>

        <div className="rounded-2xl border border-white/10 bg-[#080810]/45 p-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1de9b2]/10 text-[#1de9b2]">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <p className="text-xs leading-5 text-white/35">
              Depois de salvar, voce sera redirecionado para o painel protegido.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
