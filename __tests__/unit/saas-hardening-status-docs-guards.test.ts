import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("SaaS hardening status docs", () => {
  const readme = read("README.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const hardeningPlan = read("docs/audits/ORGANIZATION_SCOPE_HARDENING_PLAN.md");

  it("keeps README aligned with completed organization scope hardening migrations", () => {
    expect(readme).toContain("020_expense_categories_organization_scope_hardening.sql");
    expect(readme).toContain("021_family_members_organization_scope_hardening.sql");
    expect(readme).toContain("expense_categories");
    expect(readme).toContain("family_members");
    expect(readme).toContain("demais tabelas tenant-scoped seguem transicionais");
  });

  it("keeps live SaaS status aligned with the existing partial hardening summary", () => {
    expect(liveStatus).toContain("020_expense_categories_organization_scope_hardening.sql");
    expect(liveStatus).toContain("021_family_members_organization_scope_hardening.sql");
    expect(liveStatus).toContain("expense_categories.organization_id");
    expect(liveStatus).toContain("family_members.organization_id");
  });

  it("records the live Supabase RLS policy application evidence", () => {
    expect(liveStatus).toContain("evidencia operacional de 2026-05-28");
    expect(liveStatus).toContain("policies rls finais de remocao");
    expect(liveStatus).toContain("policies antigas owner-centric");
    expect(liveStatus).toContain("policies `*_own` das tabelas financeiras");
    expect(liveStatus).toContain("policies `profiles_*_family`");
    expect(liveStatus).toContain("policies `feature_permissions_*_family`");
    expect(liveStatus).toContain("9 test files passed; 18 tests passed");
    expect(liveStatus).toContain("gate local completo foi reportado como aprovado");
    expect(liveStatus).toContain("npm audit --audit-level=moderate");
    expect(liveStatus).toContain("npm run test:e2e");
  });

  it("keeps the hardening plan explicit about completed profiles hardening", () => {
    expect(hardeningPlan).toContain("`expense_categories` | hardened");
    expect(hardeningPlan).toContain("`family_members` | hardened");
    expect(hardeningPlan).toContain("`expenses` | hardened");
    expect(hardeningPlan).toContain("`profiles` | hardened");
    expect(hardeningPlan).toContain("028_profiles_organization_scope_hardening.sql");
    expect(hardeningPlan).toContain("profiles note");
    expect(hardeningPlan).toContain("already completed in this sequence");
  });
});
