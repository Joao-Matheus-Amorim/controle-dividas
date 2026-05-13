import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const navigation = [
  { href: "/protected", label: "Dashboard" },
  { href: "/protected/pessoas", label: "Pessoas" },
  { href: "/protected/gastos", label: "Gastos" },
  { href: "/protected/contas-a-pagar", label: "Contas a pagar" },
  { href: "/protected/contas-a-receber", label: "Contas a receber" },
  { href: "/protected/bancos", label: "Bancos" },
  { href: "/protected/relatorios", label: "Relatórios" },
  { href: "/protected/configuracoes", label: "Configurações" },
];

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-muted/30">
      <nav className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-col gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <Link href="/protected" className="text-lg font-bold tracking-tight">
              FamilyFinance
            </Link>
            <div className="flex items-center gap-3">
              {!hasEnvVars ? (
                <EnvVarWarning />
              ) : (
                <Suspense>
                  <AuthButton />
                </Suspense>
              )}
              <ThemeSwitcher />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 text-sm">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-full border bg-background px-3 py-1.5 text-muted-foreground transition hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
        {children}
      </div>
    </main>
  );
}
