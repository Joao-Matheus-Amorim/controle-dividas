import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("financial RLS Gate 4 readiness", () => {
  it("keeps the readiness document focused on planning instead of schema changes", () => {
    const source = readSource("docs/audits/FINANCIAL_RLS_GATE4_READINESS.md");

    expect(source).toContain("Esta PR nao altera:");
    expect(source).toContain("migrations");
    expect(source).toContain("policies RLS");
    expect(source).toContain("codigo runtime");
    expect(source).toContain("organization_id NOT NULL");
    expect(source).toContain("remocao de `owner_id`");
  });

  it("records completed prerequisites before the first RLS hardening migration", () => {
    const source = readSource("docs/audits/FINANCIAL_RLS_GATE4_READINESS.md");

    expect(source).toContain("Gate 1 concluiu");
    expect(source).toContain("Gate 2 concluiu");
    expect(source).toContain("Gate 3 concluiu");
    expect(source).toContain("Gate 5 concluiu");
    expect(source).toContain("029_drop_one_active_membership_per_user_limit.sql");
    expect(source).toContain("CURRENT_RLS_POLICIES_INVENTORY.md");
    expect(source).toContain("FINANCIAL_RLS_MULTI_TENANT_PLAN.md");
  });

  it("keeps existing SQL helpers as the first-phase RLS strategy", () => {
    const source = readSource("docs/audits/FINANCIAL_RLS_GATE4_READINESS.md");

    expect(source).toContain("public.current_user_organization_ids()");
    expect(source).toContain("public.is_organization_member(target_organization_id uuid)");
    expect(source).toContain("public.is_organization_admin(target_organization_id uuid)");
    expect(source).toContain("Nao ha justificativa atual para criar helper novo");
    expect(source).toContain("ausencia de policy recursiva em `organization_memberships`");
  });

  it("keeps the first migration target small and rollback-oriented", () => {
    const source = readSource("docs/audits/FINANCIAL_RLS_GATE4_READINESS.md");

    expect(source).toContain("Primeiro alvo recomendado:");
    expect(source).toContain("expense_categories");
    expect(source).toContain("migration `020`");
    expect(source).toContain("030_expense_categories_rls_remove_legacy_fallback.sql");
    expect(source).toContain("031_family_members_rls_remove_legacy_fallback.sql");
    expect(source).toContain("teste RLS gated versionado");
    expect(source).toContain("teste RLS gated especifico");
    expect(source).toContain("migration pequena");
    expect(source).toContain("rollback SQL claro");
    expect(source).toContain("organization_id IS NULL");
  });
});
