import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import {
  Banknote,
  Home,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

const navigation = [
  { href: "/protected", label: "Dashboard" },
  { href: "/protected/pessoas", label: "Pessoas" },
  { href: "/protected/gastos", label: "Gastos" },
  { href: "/protected/contas-a-pagar", label: "Contas a pagar" },
  { href: "/protected/contas-a-receber", label: "Contas a receber" },
  { href: "/protected/bancos", label: "Bancos" },
  { href: "/protected/relatorios", label: "Relatórios" },
  { href: "/protected/configuracoes", label: "Configurações" },
  { href: "/protected/admin", label: "Admin" },
];

const mobileNavigation = [
  { href: "/protected", label: "Início", icon: Home },
  { href: "/protected/gastos", label: "Gastos", icon: ReceiptText },
  { href: "/protected/contas-a-pagar", label: "Contas", icon: WalletCards },
  { href: "/protected/bancos", label: "Bancos", icon: Banknote },
  { href: "/protected/admin", label: "Admin", icon: ShieldCheck },
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
          <div className="hidden gap-2 overflow-x-auto pb-1 text-sm md:flex">
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

      <div className="mx-auto w-full max-w-7xl px-4 py-6 pb-28 md:px-6 md:py-8 md:pb-8">
        {children}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-3 pb-5 pt-2 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1 rounded-3xl border bg-muted/40 p-1.5 shadow-lg">
          {mobileNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold text-muted-foreground transition hover:bg-background hover:text-foreground"
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
