import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const audit = readFileSync(
  join(process.cwd(), "docs/audits/LEGACY_ORGANIZATION_FALLBACK_REMOVAL_READINESS.md"),
  "utf8",
).toLowerCase();

const sourcePaths = [
  "lib/finance/access-control.ts",
  "lib/finance/admin-server.ts",
  "app/protected/admin/actions.ts",
  "lib/organizations/banks.ts",
  "lib/organizations/categories.ts",
  "lib/organizations/expenses.ts",
  "lib/organizations/payables.ts",
  "lib/organizations/receivables.ts",
  "lib/organizations/people.ts",
  "app/protected/configuracoes/actions.ts",
  "app/protected/pessoas/actions.ts",
  "app/protected/gastos/actions.ts",
  "app/protected/contas-a-pagar/actions.ts",
  "app/protected/contas-a-receber/actions.ts",
  "app/protected/bancos/actions.ts",
];

describe("legacy organization fallback removal readiness", () => {
  it("keeps this PR explicitly audit-only", () => {
    expect(audit).toContain("documentation-only readiness audit");
    expect(audit).toContain("does not remove runtime fallback");
    expect(audit).toContain("does not change schema");
    expect(audit).toContain("does not change rls policies");
    expect(audit).toContain("does not change ui");
    expect(audit).toContain("does not change billing");
    expect(audit).toContain("does not add e2e coverage");
  });

  it("documents the reviewed fallback source inventory", () => {
    for (const sourcePath of sourcePaths) {
      expect(audit).toContain(sourcePath);
    }
  });

  it("keeps runtime fallback removal as a later scoped PR", () => {
    expect(audit).toContain("legacy fallback removal is not ready to happen in this pr");
    expect(audit).toContain("separate scoped runtime pr");
    expect(audit).toContain("removes one fallback surface at a time");
    expect(audit).toContain("avoid schema, rls, billing, ui, and e2e mixing");
  });

  it("records the exact transitional fallback pattern", () => {
    expect(audit).toContain("organizationorlegacyfilter");
    expect(audit).toContain("organization_id.eq.<active organization id>,organization_id.is.null");
    expect(audit).toContain("new writes in these actions already write the active organization id");
  });
});
