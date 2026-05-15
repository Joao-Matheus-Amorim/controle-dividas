import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { getVisibleModuleKeys } from "@/lib/finance/access-control";
import type { FinanceModuleKey } from "@/lib/finance/permissions";
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

type NavItem = {
  href: string;
  label: string;
  module: FinanceModuleKey;
  icon?: typeof Home;
};

const navigation: NavItem[] = [
  { href: "/protected", label: "Dashboard", module: "DASHBOARD" },
  { href: "/protected/pessoas", label: "Pessoas", module: "PESSOAS" },
  { href: "/protected/gastos", label: "Gastos", module: "GASTOS" },
  { href: "/protected/contas-a-pagar", label: "Contas a pagar", module: "CONTAS_A_PAGAR" },
  { href: "/protected/contas-a-receber", label: "Contas a receber", module: "CONTAS_A_RECEBER" },
  { href: "/protected/bancos", label: "Bancos", module: "BANCOS" },
  { href: "/protected/relatorios", label: "Relatórios", module: "RELATORIOS" },
  { href: "/protected/configuracoes", label: "Configurações", module: "CONFIGURACOES" },
  { href: "/protected/admin", label: "Admin", module: "ADMIN" },
];

const mobileNavigation: NavItem[] = [
  { href: "/protected", label: "Início", module: "DASHBOARD", icon: Home },
  { href: "/protected/gastos", label: "Gastos", module: "GASTOS", icon: ReceiptText },
  { href: "/protected/contas-a-pagar", label: "Contas", module: "CONTAS_A_PAGAR", icon: WalletCards },
  { href: "/protected/bancos", label: "Bancos", module: "BANCOS", icon: Banknote },
  { href: "/protected/admin", label: "Admin", module: "ADMIN", icon: ShieldCheck },
];

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const modulesToCheck = Array.from(
    new Set([...navigation, ...mobileNavigation].map((item) => item.module)),
  );
  const visibleModules = new Set(await getVisibleModuleKeys(modulesToCheck));
  const visibleNavigation = navigation.filter((item) => visibleModules.has(item.module));
  const visibleMobileNavigation = mobileNavigation.filter((item) => visibleModules.has(item.module));

  return (
    <main className="app-no-x-scroll dark min-h-screen bg-[#080810] text-foreground">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 max-w-full bg-[radial-gradient(ellipse_at_top,rgba(139,114,248,0.24),transparent_65%)]" />

      <nav className="sticky top-0 z-40 max-w-full overflow-hidden border-b border-white/5 bg-[#080810]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-col gap-3 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <Link href="/protected" className="min-w-0 shrink-0 text-lg font-bold tracking-tight text-white">
              FamilyFinance
            </Link>
            <div className="flex min-w-0 shrink items-center justify-end gap-3 overflow-hidden">
              {!hasEnvVars ? (
                <EnvVarWarning />
              ) : (
                <Suspense>
                  <AuthButton />
                </Suspense>
              )}
            </div>
          </div>
          {visibleNavigation.length > 0 ? (
            <div className="hidden gap-2 overflow-x-auto pb-1 text-sm md:flex">
              {visibleNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-white/55 transition hover:bg-white/[0.07] hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </nav>

      <div className="relative z-10 mx-auto w-full max-w-7xl overflow-x-clip px-4 py-6 pb-28 md:px-6 md:py-8 md:pb-8">
        {children}
      </div>

      {visibleMobileNavigation.length > 0 ? (
        <nav className="fixed inset-x-0 bottom-0 z-50 max-w-full overflow-hidden bg-gradient-to-t from-[#080810] via-[#080810]/98 to-transparent px-3 pb-5 pt-3 backdrop-blur md:hidden">
          <div className="mx-auto flex w-full max-w-md items-stretch gap-1 rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-1.5 shadow-2xl shadow-black/40">
            {visibleMobileNavigation.map((item) => {
              const Icon = item.icon ?? Home;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2 text-[10px] font-semibold uppercase tracking-wide text-white/35 transition hover:bg-white/[0.08] hover:text-[#b09cff]"
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="max-w-full truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </main>
  );
}
