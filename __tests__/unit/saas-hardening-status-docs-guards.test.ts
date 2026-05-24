import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const docs = {
  readme: "README.md",
  liveStatus: "docs/SAAS_RLS_LIVE_STATUS.md",
  hardeningPlan: "docs/audits/ORGANIZATION_SCOPE_HARDENING_PLAN.md",
} as const;

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("SaaS hardening status docs", () => {
  const readme = read(docs.readme);
  const liveStatus = read(docs.liveStatus);
  const hardeningPlan = read(docs.hardeningPlan);

  it("keeps README aligned with completed organization scope hardening migrations", () => {
    expect(readme).toContain("020_expense_categories_organization_scope_hardening.sql");
    expect(readme).toContain("021_family_members_organization_scope_hardening.sql");
    expect(readme).toContain("expense_categories");
    expect(readme).toContain("family_members");
    expect(readme).toContain("demais tabelas tenant-scoped seguem transicionais");
  });

  it("keeps live SaaS status aligned with partial NOT NULL hardening", () => {
    expect(liveStatus).toContain("020_expense_categories_organization_scope_hardening.sql");
    expect(liveStatus).toContain("021_family_members_organization_scope_hardening.sql");
    expect(liveStatus).toContain("expense_categories.organization_id");
    expect(liveStatus).toContain("family_members.organization_id");
    expect(liveStatus).toContain(
      "`organization_id` ainda e nullable nas demais tabelas tenant-scoped nao endurecidas",
    );
    expect(liveStatus).not.toContain("nenhuma torna `organization_id not null`");
  });

  it("keeps the hardening plan explicit about completed and remaining tables", () => {
    expect(hardeningPlan).toContain("`expense_categories` | hardened");
    expect(hardeningPlan).toContain("`family_members` | hardened");
    expect(hardeningPlan).toContain("`expenses` | candidate");
    expect(hardeningPlan).toContain("`profiles` | special handling required");
    expect(hardeningPlan).toContain("already completed in this sequence");
  });
});
