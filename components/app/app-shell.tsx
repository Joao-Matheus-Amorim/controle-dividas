import { ActiveOrganizationIndicator } from "@/components/app/active-organization-indicator";
import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Separator } from "@/components/ui/separator";
import { getVisibleModuleKeys } from "@/lib/finance/access-control";
import type { FinanceModuleKey } from "@/lib/finance/permissions";
import { getOrgPathFromProtectedPath } from "@/lib/organizations/paths";
import { getCurrentOrganization, getUserOrganizations } from "@/lib/organizations/server";
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

type AppShellProps = {
  children: React.ReactNode;
  orgSlug?: string;
};

function scopedHref(href: string, orgSlug?: string) {
  return getOrgPathFromProtectedPath(href, orgSlug);
}

export async function AppShell({ children, orgSlug }: AppShellProps) {
  const modulesToCheck = Array.from(
    new Set([...navigation, ...mobileNavigation].map((item) => item.module)),
  );
  const [visibleModuleKeys, currentOrganization, organizationContexts] = await Promise.all([
    getVisibleModuleKeys(modulesToCheck, orgSlug),
    getCurrentOrganization(orgSlug),
    getUserOrganizations(),
  ]);
  const organizationOptions = organizationContexts.map((context) => context.organization);
  const visibleModules = new Set(visibleModuleKeys);
  const visibleNavigation = navigation.filter((item) => visibleModules.has(item.module));
  const visibleMobileNavigation = mobileNavigation.filter((item) => visibleModules.has(item.module));
  const homeHref = scopedHref("/protected", orgSlug);

  return (
    <main className="app-no-x-scroll min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-40 max-w-full overflow-hidden border-b border-border bg-card">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-col gap-3 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link href={homeHref} className="group flex min-w-0 shrink-0 items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ff-md border border-border bg-ff-bg-soft text-sm font-black text-primary transition group-hover:border-primary/40 group-hover:bg-ff-primary-soft">
                  FF
                </span>
                <span className="min-w-0 leading-none">
                  <span className="block truncate text-lg font-bold tracking-tight text-foreground">
                    FamilyFinance
                  </span>
                  <span className="hidden text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground sm:block">
                    SaaS financeiro
                  </span>
                </span>
              </Link>
              <Separator orientation="vertical" className="hidden h-8 bg-border lg:block" />
              <div className="hidden min-w-0 lg:block">
                <ActiveOrganizationIndicator
                  organization={currentOrganization}
                  organizationOptions={organizationOptions}
                  currentPath={homeHref}
                />
              </div>
            </div>
            <div className="flex min-w-0 shrink items-center justify-end gap-2 overflow-hidden">
              <ThemeSwitcher />
              {!hasEnvVars ? (
                <EnvVarWarning />
              ) : (
                <Suspense>
                  <AuthButton />
                </Suspense>
              )}
            </div>
          </div>
          <div className="flex min-w-0 lg:hidden">
            <ActiveOrganizationIndicator
              organization={currentOrganization}
              organizationOptions={organizationOptions}
              currentPath={homeHref}
            />
          </div>
          {visibleNavigation.length > 0 ? (
            <>
              <Separator className="hidden bg-border md:block" />
              <div className="hidden md:block">
                <div className="flex max-w-full flex-wrap gap-1 rounded-full border border-border bg-muted p-1 text-sm">
                  {visibleNavigation.map((item) => (
                    <Link
                      key={item.href}
                      href={scopedHref(item.href, orgSlug)}
                      className="rounded-full px-3 py-1.5 font-medium text-muted-foreground transition hover:bg-card hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </nav>

      <div className="relative z-10 mx-auto w-full max-w-7xl overflow-x-clip px-4 py-6 pb-28 md:px-6 md:py-8 md:pb-8">
        {children}
      </div>

      {visibleMobileNavigation.length > 0 ? (
        <nav
          className="fixed inset-x-0 bottom-0 z-50 max-w-full overflow-hidden border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
        >
          <div className="mx-auto flex w-full items-stretch">
            {visibleMobileNavigation.map((item) => {
              const Icon = item.icon ?? Home;

              return (
                <Link
                  key={item.href}
                  href={scopedHref(item.href, orgSlug)}
                  className="group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground transition hover:text-primary"
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
