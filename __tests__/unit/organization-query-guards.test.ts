import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

const migratedPages = [
  "app/protected/page.tsx",
  "app/protected/pessoas/page.tsx",
  "app/protected/configuracoes/page.tsx",
  "app/protected/contas-a-pagar/page.tsx",
  "app/protected/contas-a-receber/page.tsx",
  "app/protected/gastos/page.tsx",
  "app/protected/bancos/page.tsx",
  "app/protected/relatorios/page.tsx",
];

const organizationHelpersWithLegacyFallback = [
  "lib/organizations/people.ts",
  "lib/organizations/receivables.ts",
  "lib/organizations/expenses.ts",
];

describe("organization-aware query guards", () => {
  it("keeps migrated protected pages away from owner-only finance helpers", () => {
    const forbiddenImports = [
      "@/lib/finance/server",
      "@/lib/finance/banks-server",
    ];

    for (const path of migratedPages) {
      const source = readSource(path);

      for (const forbiddenImport of forbiddenImports) {
        expect(source, `${path} must not import ${forbiddenImport}`).not.toContain(forbiddenImport);
      }
    }
  });

  it("keeps dashboard wired to organization-aware module data helpers", () => {
    const source = readSource("app/protected/page.tsx");

    expect(source).toContain("@/lib/organizations/banks");
    expect(source).toContain("@/lib/organizations/expenses");
    expect(source).toContain("@/lib/organizations/payables");
    expect(source).toContain("@/lib/organizations/receivables");
    expect(source).toContain("getOrganizationBanksDashboardData");
    expect(source).toContain("getOrganizationExpenseDashboardData");
    expect(source).toContain("getOrganizationPayableBillsDashboardData");
    expect(source).toContain("getOrganizationReceivableIncomesDashboardData");
    expect(source).not.toContain("getExpenseDashboardData");
    expect(source).not.toContain("getPayableBillsDashboardData");
    expect(source).not.toContain("getReceivableIncomesDashboardData");
    expect(source).not.toContain("getBanksDashboardData");
  });

  it("keeps reports away from legacy owner-only finance aggregators", () => {
    const source = readSource("lib/organizations/reports.ts");

    expect(source).toContain("@/lib/organizations/expenses");
    expect(source).toContain("@/lib/organizations/payables");
    expect(source).toContain("@/lib/organizations/receivables");
    expect(source).toContain("@/lib/organizations/banks");
    expect(source).not.toContain("@/lib/finance/server");
    expect(source).not.toContain("@/lib/finance/banks-server");
  });

  it("preserves transitional organization-or-legacy filters only in remaining organization helpers", () => {
    for (const path of organizationHelpersWithLegacyFallback) {
      const source = readSource(path);

      expect(source, `${path} must keep organization filter`).toContain("organization_id.eq.${organizationId}");
      expect(source, `${path} must keep legacy compatibility`).toContain("organization_id.is.null");
    }
  });

  it("keeps bank helper reads on active organization equality after scoped fallback removal", () => {
    const source = readSource("lib/organizations/banks.ts");

    expect(source).toContain('.eq("organization_id", organization.id)');
    expect(source).not.toContain("organization_id.eq.${organizationId}");
    expect(source).not.toContain("organization_id.is.null");
  });

  it("keeps category helper reads on active organization equality after scoped fallback removal", () => {
    const source = readSource("lib/organizations/categories.ts");

    expect(source).toContain('.eq("organization_id", organization.id)');
    expect(source).not.toContain("organizationOrLegacyFilter");
    expect(source).not.toContain("organization_id.eq.${organizationId}");
    expect(source).not.toContain("organization_id.is.null");
  });

  it("keeps payable helper reads on active organization equality after scoped fallback removal", () => {
    const source = readSource("lib/organizations/payables.ts");

    expect(source).toContain('.eq("organization_id", organization.id)');
    expect(source).not.toContain("organizationOrLegacyFilter");
    expect(source).not.toContain("organization_id.eq.${organizationId}");
    expect(source).not.toContain("organization_id.is.null");
  });
});
