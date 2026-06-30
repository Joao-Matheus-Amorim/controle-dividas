"use client";

import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { updatePassword } from "@/app/auth/update-password/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      const result = await updatePassword(password);

      if (!result.success) {
        setError(result.error);
        return;
      }

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
            nova senha
          </div>
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.24em] text-ff-subtle-foreground">
          FamilyFinance
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.06em] text-foreground">
          Atualizar senha
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Crie uma nova senha segura para continuar acessando o painel da familia.
        </p>
      </div>

      <form onSubmit={handleUpdatePassword} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs font-bold uppercase tracking-[0.18em] text-ff-subtle-foreground">
            Nova senha
          </Label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ff-subtle-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="minimo de 6 caracteres"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-13 rounded-2xl border-border bg-background/70 pl-11 text-base text-foreground placeholder:text-ff-subtle-foreground focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="repeat-password" className="text-xs font-bold uppercase tracking-[0.18em] text-ff-subtle-foreground">
            Repetir nova senha
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
          {isLoading ? "Salvando..." : "Salvar nova senha"}
          <ArrowRight className="h-4 w-4" />
        </Button>

        <div className="rounded-2xl border border-border bg-background/45 p-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ff-success-soft text-ff-success">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <p className="text-xs leading-5 text-ff-subtle-foreground">
              Depois de salvar, voce sera redirecionado para o painel protegido.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
