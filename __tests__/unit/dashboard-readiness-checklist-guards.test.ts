import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

describe("dashboard owner readiness checklist guards", () => {
  const dashboardPage = readSource("features/protected-pages/dashboard-page.tsx");
  const checklist = readSource("components/dashboard/dashboard-readiness-checklist.tsx");

  it("keeps the owner operational checklist wired to the routed dashboard", () => {
    expect(dashboardPage).toContain("DashboardReadinessChecklist");
    expect(dashboardPage).toContain("readinessChecklistItems");
    expect(dashboardPage).toContain('"/protected/pessoas"');
    expect(dashboardPage).toContain('"/protected/bancos"');
    expect(dashboardPage).toContain('"/protected/gastos"');
    expect(dashboardPage).toContain('"/protected/contas-a-pagar"');
    expect(dashboardPage).toContain('"/protected/contas-a-receber"');
    expect(dashboardPage).toContain("getOrgPathFromProtectedPath");
    expect(dashboardPage).not.toContain('href="/protected/contas-a-receber"');
  });

  it("uses existing dashboard data instead of adding a new readiness query", () => {
    expect(dashboardPage).toContain("expenseData.expenses.length > 0");
    expect(dashboardPage).toContain("payableData.bills.length > 0");
    expect(dashboardPage).toContain("receivableData.incomes.length > 0");
    expect(dashboardPage).toContain("bankData.accounts.length > 0");
    expect(dashboardPage).toContain("hasAccessibleMember");
    expect(dashboardPage).not.toContain("getOrganizationReadiness");
  });

  it("renders progress and direct actions for the owner validation flow", () => {
    expect(checklist).toContain("Pronto para testar");
    expect(checklist).toContain("Ciclo operacional do owner");
    expect(checklist).toContain("completedCount");
    expect(checklist).toContain("CheckCircle2");
    expect(checklist).toContain("ArrowRight");
    expect(checklist).toContain("items.length === 0");
  });
});
