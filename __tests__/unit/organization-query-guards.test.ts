import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

const migratedPages = [
  "features/protected-pages/dashboard-page.tsx",
  "features/protected-pages/pessoas-page.tsx",
  "features/protected-pages/configuracoes-page.tsx",
  "features/protected-pages/contas-a-pagar-page.tsx",
  "features/protected-pages/contas-a-receber-page.tsx",
  "features/protected-pages/gastos-page.tsx",
  "features/protected-pages/bancos-page.tsx",
  "features/protected-pages/relatorios-page.tsx",
];

const organizationHelpersWithoutLegacyFallback = [
  "lib/organizations/banks.ts",
  "lib/organizations/categories.ts",
  "lib/organizations/expenses.ts",
  "lib/organizations/payables.ts",
  "lib/organizations/people.ts",
  "lib/organizations/receivables.ts",
];

const organizationHelpersWithLegacyFallback: string[] = [];

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
    const source = readSource("features/protected-pages/dashboard-page.tsx");

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

  it("keeps critical organization finance loaders independent from PostgREST embedded relationships", () => {
    const loaders = [
      "lib/organizations/banks.ts",
      "lib/organizations/expenses.ts",
      "lib/organizations/payables.ts",
      "lib/organizations/receivables.ts",
    ];

    for (const path of loaders) {
      const source = readSource(path);

      expect(source, `${path} must not depend on family_members embedded select`).not.toContain("family_members(");
      expect(source, `${path} must not depend on expense_categories embedded select`).not.toContain("expense_categories(");
    }
  });

  it("preserves transitional organization-or-legacy filters only in remaining organization helpers", () => {
    for (const path of organizationHelpersWithLegacyFallback) {
      const source = readSource(path);

      expect(source, `${path} must keep organization filter`).toContain("organization_id.eq.${organizationId}");
      expect(source, `${path} must keep legacy compatibility`).toContain("organization_id.is.null");
    }

    for (const path of organizationHelpersWithoutLegacyFallback) {
      const source = readSource(path);

      expect(source, `${path} must not keep legacy helper`).not.toContain("organizationOrLegacyFilter");
      expect(source, `${path} must not keep legacy organization filter`).not.toContain("organization_id.eq.${organizationId}");
      expect(source, `${path} must not keep null organization fallback`).not.toContain("organization_id.is.null");
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

    expect(source).toContain("seedInitialFinanceDataForOwner");
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

  it("keeps expense helper reads on active organization equality after scoped fallback removal", () => {
    const source = readSource("lib/organizations/expenses.ts");

    expect(source).toContain("@/lib/organizations/categories");
    expect(source).not.toContain("export async function getOrganizationExpenseCategories");
    expect(source).toContain('.eq("organization_id", organization.id)');
    expect(source).not.toContain("organizationOrLegacyFilter");
    expect(source).not.toContain("organization_id.eq.${organizationId}");
    expect(source).not.toContain("organization_id.is.null");
  });

  it("keeps receivable helper reads on active organization equality after scoped fallback removal", () => {
    const source = readSource("lib/organizations/receivables.ts");

    expect(source).toContain('.eq("organization_id", organization.id)');
    expect(source).not.toContain("organizationOrLegacyFilter");
    expect(source).not.toContain("organization_id.eq.${organizationId}");
    expect(source).not.toContain("organization_id.is.null");
  });

  it("keeps people helper reads on active organization equality after scoped fallback removal", () => {
    const source = readSource("lib/organizations/people.ts");

    expect(source).toContain('.eq("organization_id", organization.id)');
    expect(source).not.toContain("organizationOrLegacyFilter");
    expect(source).not.toContain("organization_id.eq.${organizationId}");
    expect(source).not.toContain("organization_id.is.null");
  });

  it("keeps people protected page profile reads on active organization equality", () => {
    const source = readSource("features/protected-pages/pessoas-page.tsx");

    expect(source).toContain('.eq("organization_id", organizationId)');
    expect(source).not.toContain("organizationOrLegacyFilter");
    expect(source).not.toContain("organization_id.eq.${organizationId}");
    expect(source).not.toContain("organization_id.is.null");
  });
});
