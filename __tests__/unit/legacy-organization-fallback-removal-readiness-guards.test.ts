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
  it("keeps fallback removal scoped by surface", () => {
    expect(audit).toContain("must continue one surface at a time");
    expect(audit).toContain("do not remove fallback broadly");
    expect(audit).toContain("avoid schema, rls, billing, ui, and e2e mixing");
  });

  it("documents the reviewed fallback source inventory", () => {
    for (const sourcePath of sourcePaths) {
      expect(audit).toContain(sourcePath);
    }
  });

  it("records completed scoped fallback removals", () => {
    expect(audit).toContain("#643 runtime permission reads in lib/finance/access-control.ts");
    expect(audit).toContain("#645 admin dashboard reads in lib/finance/admin-server.ts");
    expect(audit).toContain("lib/finance/access-control.ts no longer accepts legacy null organization rows");
    expect(audit).toContain("lib/finance/admin-server.ts no longer accepts legacy null organization rows");
  });

  it("keeps remaining fallback categories explicit", () => {
    expect(audit).toContain("app/protected/admin/actions.ts still accepts legacy null organization rows");
    expect(audit).toContain("organization helper files still use active organization or legacy null organization filtering");
    expect(audit).toContain("organization_id.eq.<active organization id>,organization_id.is.null");
    expect(audit).toContain("new writes in these actions already write the active organization id");
  });
});
