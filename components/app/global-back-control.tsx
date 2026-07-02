"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

function fallbackForPath(pathname: string) {
  if (pathname.startsWith("/auth")) {
    return "/";
  }

  if (pathname.startsWith("/onboarding")) {
    return "/protected";
  }

  return "/protected";
}

export function GlobalBackControl() {
  const router = useRouter();
  const pathname = usePathname() || "/";

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackForPath(pathname));
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleBack}
      className="app-soft-press fixed bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] left-4 z-50 h-10 rounded-full border-border bg-card/95 px-3 text-xs font-bold text-foreground shadow-ff-lg md:bottom-4 md:left-5"
      aria-label="Voltar para a tela anterior"
    >
      <ArrowLeft className="mr-1.5 h-4 w-4" />
      Voltar
    </Button>
  );
}
