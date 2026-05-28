import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

function readNormalized(path: string) {
  return readSource(path)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("dashboard UI contract guards", () => {
  const contract = readNormalized("docs/audits/DASHBOARD_UI_CONTRACT.md");
  const dashboardPage = readSource("features/protected-pages/dashboard-page.tsx");
  const header = readSource("components/dashboard/dashboard-header.tsx");
  const hero = readSource("components/dashboard/dashboard-hero-summary.tsx");
  const summary = readSource("components/dashboard/dashboard-summary-section.tsx");
  const details = readSource("components/dashboard/dashboard-detail-sections.tsx");

  it("documents dashboard scope without introducing broad visual redesign or snapshots", () => {
    expect(contract).toContain("gap-011");
    expect(contract).toContain("dashboard principal");
    expect(contract).toContain("nao muda a ui");
    expect(contract).toContain("nao");
    expect(contract).toContain("snapshot visual amplo");
    expect(contract).toContain("redesenha telas");
    expect(contract).toContain("proxima expansao segura");
  });

  it("keeps protected and orgSlug routes using the shared dashboard implementation", () => {
    expect(readSource("app/protected/page.tsx")).toContain("DashboardPage");
    expect(readSource("app/org/[orgSlug]/page.tsx")).toContain("DashboardPage");
    expect(dashboardPage).toContain("type DashboardPageProps");
    expect(dashboardPage).toContain("orgSlug?: string");
    expect(dashboardPage).toContain("getOrgPathFromProtectedPath");
    expect(dashboardPage).toContain('"/protected/gastos"');
    expect(dashboardPage).toContain('"/protected/contas-a-pagar"');
    expect(dashboardPage).toContain('"/protected/bancos"');
    expect(dashboardPage).toContain('"/protected/admin"');
  });

  it("preserves the real dashboard heading and avoids mojibake selectors", () => {
    expect(header).toContain("Vis\u00e3o do m\u00eas");
    expect(header).toContain("Vis\u00e3o limitada pelo Admin");
    expect(header).not.toContain("VisÃ");
    expect(header).not.toContain("mÃ");
  });

  it("keeps permission-gated dashboard sections explicit", () => {
    expect(dashboardPage).toContain('visibleModules.has("GASTOS")');
    expect(dashboardPage).toContain('visibleModules.has("CONTAS_A_PAGAR")');
    expect(dashboardPage).toContain('visibleModules.has("CONTAS_A_RECEBER")');
    expect(dashboardPage).toContain('visibleModules.has("BANCOS")');
    expect(dashboardPage).toContain('visibleModules.has("ADMIN")');
    expect(dashboardPage).toContain("<DashboardLimitedNotice />");
  });

  it("keeps the critical dashboard summary blocks stable", () => {
    expect(hero).toContain("DashboardHeroSummary");
    expect(hero).toContain("compactCurrency(remainingMonthlyLimit)");
    expect(hero).toContain("totalOpenDebts");
    expect(hero).toContain("totalReceivableIncomes");

    expect(summary).toContain("DashboardSummarySection");
    expect(summary).toContain("Resumo financeiro");
    expect(summary).toContain("Contas e dividas");
    expect(summary).toContain("Uso do limite");
  });

  it("keeps the dashboard detail sections named and bounded", () => {
    expect(details).toContain("DashboardUpcomingBills");
    expect(details).toContain("DashboardCategorySummary");
    expect(details).toContain("DashboardBankSummary");
    expect(details).toContain("DashboardIncomeSummary");
    expect(details).toContain("Pr\u00f3ximos vencimentos");
    expect(details).toContain("Categorias");
    expect(details).toContain("Bancos");
    expect(details).toContain("Rendas");
  });
});
