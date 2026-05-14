import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
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
    <main className="dark min-h-screen bg-[#080810] text-foreground">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(139,114,248,0.24),transparent_65%)]" />

      <nav className="sticky top-0 z-40 border-b border-white/5 bg-[#080810]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-col gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <Link href="/protected" className="text-lg font-bold tracking-tight text-white">
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
            </div>
          </div>
          <div className="hidden gap-2 overflow-x-auto pb-1 text-sm md:flex">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-white/55 transition hover:bg-white/[0.07] hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 pb-28 md:px-6 md:py-8 md:pb-8">
        {children}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-[#080810] via-[#080810]/98 to-transparent px-3 pb-5 pt-3 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1 rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-1.5 shadow-2xl shadow-black/40">
          {mobileNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-white/35 transition hover:bg-white/[0.08] hover:text-[#b09cff]"
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
