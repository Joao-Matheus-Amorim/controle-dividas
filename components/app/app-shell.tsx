import { ActiveOrganizationIndicator } from "@/components/app/active-organization-indicator";
import {
  MobileBottomNavigation,
  type MobileNavigationIconKey,
  type MobileNavigationItem,
} from "@/components/app/mobile-bottom-navigation";
import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Separator } from "@/components/ui/separator";
import { getVisibleModuleKeys } from "@/lib/finance/access-control";
import type { FinanceModuleKey } from "@/lib/finance/permissions";
import { getOrgPathFromProtectedPath } from "@/lib/organizations/paths";
import { getCurrentOrganization, getUserOrganizations } from "@/lib/organizations/server";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

type NavItem = {
  href: string;
  label: string;
  module: FinanceModuleKey;
  iconKey: MobileNavigationIconKey;
};

const navigation: NavItem[] = [
  { href: "/protected", label: "Dashboard", module: "DASHBOARD", iconKey: "dashboard" },
  { href: "/protected/pessoas", label: "Pessoas", module: "PESSOAS", iconKey: "people" },
  { href: "/protected/gastos", label: "Gastos", module: "GASTOS", iconKey: "expenses" },
  { href: "/protected/contas-a-pagar", label: "Contas a pagar", module: "CONTAS_A_PAGAR", iconKey: "payables" },
  { href: "/protected/contas-a-receber", label: "Contas a receber", module: "CONTAS_A_RECEBER", iconKey: "receivables" },
  { href: "/protected/movimentacoes", label: "Movimentacoes", module: "MOVIMENTACOES", iconKey: "movements" },
  { href: "/protected/bancos", label: "Bancos", module: "BANCOS", iconKey: "banks" },
  { href: "/protected/relatorios", label: "Relatórios", module: "RELATORIOS", iconKey: "reports" },
  { href: "/protected/configuracoes", label: "Configurações", module: "CONFIGURACOES", iconKey: "settings" },
  { href: "/protected/admin", label: "Admin", module: "ADMIN", iconKey: "admin" },
];

const mobilePrimaryModules: FinanceModuleKey[] = ["DASHBOARD", "GASTOS", "CONTAS_A_PAGAR", "BANCOS"];

type AppShellProps = {
  children: React.ReactNode;
  orgSlug?: string;
};

function scopedHref(href: string, orgSlug?: string) {
  return getOrgPathFromProtectedPath(href, orgSlug);
}

export async function AppShell({ children, orgSlug }: AppShellProps) {
  const modulesToCheck = navigation.map((item) => item.module);
  const [visibleModuleKeys, currentOrganization, organizationContexts] = await Promise.all([
    getVisibleModuleKeys(modulesToCheck, orgSlug),
    getCurrentOrganization(orgSlug),
    getUserOrganizations(),
  ]);
  const organizationOptions = organizationContexts.map((context) => context.organization);
  const visibleModules = new Set(visibleModuleKeys);
  const visibleNavigation = navigation.filter((item) => visibleModules.has(item.module));
  const visibleMobilePrimaryNavigation = visibleNavigation.filter((item) =>
    mobilePrimaryModules.includes(item.module),
  );
  const homeHref = scopedHref("/protected", orgSlug);
  const toMobileNavigationItem = (item: NavItem): MobileNavigationItem => ({
    href: scopedHref(item.href, orgSlug),
    label: item.module === "DASHBOARD" ? "Início" : item.label,
    iconKey: item.iconKey,
  });
  const mobilePrimaryItems = visibleMobilePrimaryNavigation.map(toMobileNavigationItem);
  const mobileAllItems = visibleNavigation.map(toMobileNavigationItem);

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

      <MobileBottomNavigation primaryItems={mobilePrimaryItems} allItems={mobileAllItems} />
    </main>
  );
}
