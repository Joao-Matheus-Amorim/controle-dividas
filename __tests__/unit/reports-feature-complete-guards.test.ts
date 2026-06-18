import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("reports feature completeness guards", () => {
  it("keeps organization reports connected to the financial ledger", () => {
    const reports = read("lib/organizations/reports.ts");

    expect(reports).toContain("getOrganizationFinancialMovements");
    expect(reports).toContain("filteredMovements");
    expect(reports).toContain("totalMovementInflow");
    expect(reports).toContain("totalMovementOutflow");
    expect(reports).toContain("cashFlowByBank");
    expect(reports).toContain("recentMovements");
    expect(reports).not.toContain("@/lib/finance/reports-server");
  });

  it("renders export, cash flow and expected-income sections on the reports page", () => {
    const page = read("features/protected-pages/relatorios-page.tsx");

    expect(page).toContain("ReportExportActions");
    expect(page).toContain("ReportCashFlow");
    expect(page).toContain("ReportExpectedIncomes");
    expect(page).toContain("financialMovements={report.financialMovements}");
    expect(page).toContain("cashFlowByBank={report.cashFlowByBank}");
  });

  it("keeps filtered reports shareable and organization-route aware", () => {
    const filterBar = read("components/reports/report-filter-bar.tsx");

    expect(filterBar).toContain("getOrgPathFromProtectedPath");
    expect(filterBar).toContain('href={getOrgPathFromProtectedPath("/protected/relatorios", orgSlug)}');
    expect(filterBar).toContain('method="get"');
  });

  it("offers a CSV export from the filtered server data", () => {
    const exportActions = read("components/reports/report-export-actions.tsx");

    expect(exportActions).toContain("data:text/csv;charset=utf-8");
    expect(exportActions).toContain("download=\"relatorios-familyfinance.csv\"");
    expect(exportActions).toContain("financialMovements.map");
    expect(exportActions).toContain("movementBankLabel");
  });

  it("keeps transfers out of expense report totals", () => {
    const organizationReports = read("lib/organizations/reports.ts");
    const legacyReports = read("lib/finance/reports-server.ts");

    for (const source of [organizationReports, legacyReports]) {
      expect(source).toContain("isTransferCategoryOrDescendant");
      expect(source).toContain("reportableExpenses");
      expect(source).toContain("const totalExpenses = reportableExpenses.reduce");
      expect(source).toContain(".filter((category) => !isTransferCategoryOrDescendant(category, categoriesById))");
    }
  });
});
