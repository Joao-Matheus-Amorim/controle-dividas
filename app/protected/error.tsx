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
      <section className="w-full max-w-xl rounded-[2rem] border border-[#f0506e]/20 bg-[#f0506e]/10 p-6 text-center shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[#f0506e]/15 text-[#f0506e]">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-[#ff8da0]">
          Erro ao carregar
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">
          Nao foi possivel abrir esta area
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/45">
          Tente carregar novamente. Se o problema continuar, revise sua conexao, permissoes ou variaveis do Supabase.
        </p>

        {error.message ? (
          <p className="mt-4 rounded-2xl border border-white/10 bg-[#080810]/55 p-3 text-left text-xs text-white/45">
            {error.message}
          </p>
        ) : null}

        <Button
          type="button"
          onClick={unstable_retry}
          className="mt-5 rounded-2xl bg-[#8b72f8] px-5 font-bold text-white hover:bg-[#7d66e4]"
        >
          <RotateCcw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </section>
    </div>
  );
}
