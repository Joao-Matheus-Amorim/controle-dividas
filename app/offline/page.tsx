"use client";

import { usePathname } from "next/navigation";
import { WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  const pathname = usePathname();
  const fallbackHref = pathname && pathname !== "/offline" ? pathname : "/protected";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-ff-2xl bg-ff-bg-soft">
        <WifiOff className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Sem conexão</h1>
      <p className="max-w-xs text-muted-foreground">
        Você está offline. Conecte-se à internet para usar o FamilyFinance.
      </p>
      <Link
        href={fallbackHref}
        className="rounded-ff-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-ff-primary-hover"
      >
        Tentar novamente
      </Link>
    </div>
  );
}
