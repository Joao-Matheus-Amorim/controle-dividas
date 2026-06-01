import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").toLowerCase();
}

describe("validacao tecnica current state guards", () => {
  const validation = read("docs/VALIDACAO_TECNICA.md");
  const checklist = read("docs/audits/CODEBASE_SCAN_GAP_CHECKLIST_2026-06-01.md");

  it("keeps deployment and dependency validation aligned with current CI", () => {
    expect(validation).toContain("npm audit --audit-level=moderate");
    expect(validation).toContain("vitest `4.1.8`");
    expect(validation).toContain("npm run typecheck");
    expect(validation).toContain("supabase_db_url");
    expect(validation).toContain("vercel_org_id");
    expect(validation).toContain("vercel_project_id");
  });

  it("tracks the full migration history through the finance relationship restore", () => {
    expect(validation).toContain("001_family_finance_schema.sql");
    expect(validation).toContain("039_drop_legacy_owner_family_policies.sql");
    expect(validation).toContain("040_audit_events_schema.sql");
    expect(validation).toContain("041_audit_events_write_boundary.sql");
    expect(validation).toContain("042_audit_events_retention_cleanup.sql");
    expect(validation).toContain("043_restore_finance_relationships_and_rls_cleanup.sql");
    expect(validation).not.toContain("...");
  });

  it("expects restored finance foreign keys to be validated after migration 043", () => {
    expect(validation).toContain("convalidated = true");
    expect(validation).toContain("expenses_family_member_id_fkey");
    expect(validation).toContain("expenses_category_id_fkey");
    expect(validation).toContain("payable_bills_responsible_member_id_fkey");
    expect(validation).toContain("receivable_incomes_receiver_member_id_fkey");
    expect(validation).toContain("banks_family_member_id_fkey");
    expect(validation).toContain("finance-relationships-orphan-preflight.sql");
    expect(validation).toContain("nao trate `convalidated = false` como estado saudavel");
  });

  it("marks the operational checklist item as covered by this validation update", () => {
    expect(checklist).toContain("status: coberto por pr docs de atualizacao de `validacao_tecnica.md`");
    expect(checklist).toContain("[x] atualizar lista de migrations obrigatorias ate `043`");
    expect(checklist).toContain("[x] incluir `supabase_db_url` como secret de deploy");
    expect(checklist).toContain("[x] incluir validacao de fks restauradas");
  });
});
