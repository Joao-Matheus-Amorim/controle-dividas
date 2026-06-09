import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const readMigration = (file: string) => readFileSync(
  join(process.cwd(), "supabase/migrations", file),
  "utf8",
);

const baseMigration = readMigration("034_receivable_incomes_rls_remove_legacy_fallback.sql");
const writeMigration = readMigration("054_receivable_incomes_organization_write_rls.sql");
const migration = `${baseMigration}\n${writeMigration}`;
const migrationSql = migration
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");
const writeMigrationSql = writeMigration
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");

const writePolicyBlock = (startMarker: string, endMarker?: string) => {
  const start = writeMigration.indexOf(startMarker);
  expect(start, `Missing write policy marker: ${startMarker}`).toBeGreaterThanOrEqual(0);

  if (!endMarker) {
    return writeMigration.slice(start);
  }

  const end = writeMigration.indexOf(endMarker, start + startMarker.length);
  expect(end, `Missing write policy marker: ${endMarker}`).toBeGreaterThan(start);

  return writeMigration.slice(start, end);
};

function policyBlock(startMarker: string, endMarker?: string) {
  const start = migration.indexOf(startMarker);
  expect(start, `Missing policy marker: ${startMarker}`).toBeGreaterThanOrEqual(0);

  if (!endMarker) {
    return migration.slice(start);
  }

  const end = migration.indexOf(endMarker, start + startMarker.length);
  expect(end, `Missing policy marker: ${endMarker}`).toBeGreaterThan(start);

  return migration.slice(start, end);
}

describe("receivable_incomes RLS policies", () => {
  it("uses organization membership for reads", () => {
    const selectPolicy = policyBlock(
      "create policy \"receivable_incomes_select_organization\"",
      "create policy \"receivable_incomes_insert_owner_organization\"",
    );

    expect(selectPolicy).toContain("for select");
    expect(selectPolicy).toContain("public.is_organization_member(organization_id)");
    expect(selectPolicy).not.toContain("organization_id is null");
    expect(selectPolicy).not.toContain("owner_id = auth.uid()");
  });

  it("requires CONTAS_A_RECEBER write permission and matching legacy owner for inserts and updates", () => {
    const insertPolicy = writePolicyBlock(
      "create policy \"receivable_incomes_insert_organization\"",
      "create policy \"receivable_incomes_update_organization\"",
    );
    const updatePolicy = writePolicyBlock(
      "create policy \"receivable_incomes_update_organization\"",
      "create policy \"receivable_incomes_delete_organization\"",
    );

    expect(insertPolicy).toContain("for insert");
    expect(insertPolicy).toContain("public.can_manage_organization_receivable_income(organization_id, receiver_member_id, 'can_create')");
    expect(insertPolicy).toContain("public.organization_legacy_owner_matches(organization_id, owner_id)");
    expect(insertPolicy).not.toContain("owner_id = auth.uid()");

    expect(updatePolicy).toContain("for update");
    expect(updatePolicy).toContain("public.can_manage_organization_receivable_income(organization_id, receiver_member_id, 'can_edit')");
    expect(updatePolicy).toContain("public.organization_legacy_owner_matches(organization_id, owner_id)");
    expect(updatePolicy).not.toContain("owner_id = auth.uid()");
  });

  it("uses CONTAS_A_RECEBER delete permission for deletes without WITH CHECK", () => {
    const deletePolicy = writePolicyBlock(
      "create policy \"receivable_incomes_delete_organization\"",
    );

    expect(deletePolicy).toContain("for delete");
    expect(deletePolicy).toContain("public.can_manage_organization_receivable_income(organization_id, receiver_member_id, 'can_delete')");
    expect(deletePolicy).not.toContain("owner_id = auth.uid()");
    expect(deletePolicy.toLowerCase()).not.toContain("with check");
  });

  it("keeps the direct-client RLS helper tied to CONTAS_A_RECEBER permissions and member scope", () => {
    expect(writeMigrationSql).toContain("create or replace function public.can_manage_organization_receivable_income");
    expect(writeMigrationSql).toContain("security definer");
    expect(writeMigrationSql).toContain("set search_path = public");
    expect(writeMigrationSql).toContain("from public.family_members fm");
    expect(writeMigrationSql).toContain("fm.id = target_receiver_member_id");
    expect(writeMigrationSql).toContain("fm.organization_id = target_organization_id");
    expect(writeMigrationSql).toContain("not public.is_organization_member(target_organization_id) then false");
    expect(writeMigrationSql).toContain("public.is_organization_admin(target_organization_id)");
    expect(writeMigrationSql).toContain("ump.module = 'CONTAS_A_RECEBER'");
    expect(writeMigrationSql).toContain("ump.scope = 'family'");
    expect(writeMigrationSql).toContain("ump.scope = 'selected'");
    expect(writeMigrationSql).toContain("ump.scope = 'own'");
    expect(writeMigrationSql).toContain("grant execute on function public.can_manage_organization_receivable_income(uuid, uuid, text) to authenticated");
  });

  it("checks active organization membership before honoring admin or module permissions", () => {
    const membershipCheckIndex = writeMigrationSql.indexOf(
      "not public.is_organization_member(target_organization_id) then false",
    );
    const adminCheckIndex = writeMigrationSql.indexOf(
      "public.is_organization_admin(target_organization_id)",
    );
    const permissionsCheckIndex = writeMigrationSql.indexOf("ump.module = 'CONTAS_A_RECEBER'");

    expect(membershipCheckIndex).toBeGreaterThanOrEqual(0);
    expect(adminCheckIndex).toBeGreaterThan(membershipCheckIndex);
    expect(permissionsCheckIndex).toBeGreaterThan(membershipCheckIndex);
  });

  it("does not depend on family member active status in executable SQL", () => {
    expect(migrationSql).toContain("from public.family_members fm");
    expect(migrationSql).not.toContain("fm.is_active");
    expect(migrationSql).toContain("p.is_active = true");
  });

  it("removes legacy null-organization fallback from receivable policies", () => {
    expect(migrationSql.toLowerCase()).not.toContain("organization_id is null");
    expect(migrationSql.toLowerCase()).not.toContain("or organization_id is null");
    expect(migrationSql).toContain("receivable_incomes_select_organization");
    expect(writeMigrationSql).toContain('drop policy if exists "receivable_incomes_insert_owner_organization"');
    expect(writeMigrationSql).toContain("receivable_incomes_insert_organization");
    expect(writeMigrationSql).toContain("receivable_incomes_update_organization");
    expect(writeMigrationSql).toContain("receivable_incomes_delete_organization");
  });
});
