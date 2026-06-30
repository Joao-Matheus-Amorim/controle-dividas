"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ProtectedError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <div className="app-container flex min-h-[60vh] items-center justify-center">
      <section className="w-full max-w-xl rounded-[2rem] border border-ff-destructive bg-ff-destructive-soft p-6 text-center shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-ff-destructive/15 text-ff-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-ff-destructive">
          Erro ao carregar
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] text-foreground">
          Nao foi possivel abrir esta area
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Tente carregar novamente. Se o problema continuar, revise sua conexao, permissoes ou variaveis do Supabase.
        </p>

        {error.message ? (
          <p className="mt-4 rounded-2xl border border-border bg-background/55 p-3 text-left text-xs text-muted-foreground">
            {error.message}
          </p>
        ) : null}

        <Button
          type="button"
          onClick={unstable_retry}
          className="mt-5 rounded-2xl bg-primary px-5 font-bold text-foreground hover:bg-ff-primary-hover"
        >
          <RotateCcw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </section>
    </div>
  );
}
