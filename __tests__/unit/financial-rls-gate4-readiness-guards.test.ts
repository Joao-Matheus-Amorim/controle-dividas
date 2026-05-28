import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("financial RLS Gate 4 readiness", () => {
  it("keeps the readiness document reconciled as a historical gate", () => {
    const source = readSource("docs/audits/FINANCIAL_RLS_GATE4_READINESS.md");

    expect(source).toContain("Gate 4 deixou de ser um gate pendente");
    expect(source).toContain("docs/SAAS_RLS_LIVE_STATUS.md");
    expect(source).toContain("docs/SAAS_OPERATIONAL_ROADMAP.md");
    expect(source).toContain("docs/audits/CURRENT_RLS_POLICIES_INVENTORY.md");
  });

  it("records completed prerequisites and hardening migrations", () => {
    const source = readSource("docs/audits/FINANCIAL_RLS_GATE4_READINESS.md");

    expect(source).toContain("Gate 1 concluiu");
    expect(source).toContain("Gate 2 concluiu");
    expect(source).toContain("Gate 3 concluiu");
    expect(source).toContain("Gate 5 concluiu");
    expect(source).toContain("029_drop_one_active_membership_per_user_limit.sql");
    expect(source).toContain("CURRENT_RLS_POLICIES_INVENTORY.md");
    expect(source).toContain("028_profiles_organization_scope_hardening.sql");
  });

  it("records the completed RLS fallback removal migrations", () => {
    const source = readSource("docs/audits/FINANCIAL_RLS_GATE4_READINESS.md");

    expect(source).toContain("030_expense_categories_rls_remove_legacy_fallback.sql");
    expect(source).toContain("031_family_members_rls_remove_legacy_fallback.sql");
    expect(source).toContain("032_expenses_rls_remove_legacy_fallback.sql");
    expect(source).toContain("038_user_feature_permissions_rls_remove_legacy_fallback.sql");
    expect(source).toContain("fallback RLS legado `organization_id IS NULL`");
  });

  it("keeps the current gap focused on versioning old policy cleanup", () => {
    const source = readSource("docs/audits/FINANCIAL_RLS_GATE4_READINESS.md");

    expect(source).toContain("policies `*_own`");
    expect(source).toContain("policies `profiles_*_family`");
    expect(source).toContain("policies `feature_permissions_*_family`");
    expect(source).toContain("039_drop_legacy_owner_family_policies.sql");
    expect(source).toContain("RLS Live Gate");
  });
});
