import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const readMigration = (file: string) => readFileSync(
  join(process.cwd(), "supabase/migrations", file),
  "utf8",
);

const baseMigration = readMigration("032_expenses_rls_remove_legacy_fallback.sql");
const writeMigration = readMigration("052_expenses_organization_write_rls.sql");
const migration = `${baseMigration}\n${writeMigration}`;
const migrationSql = migration
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");
const writeMigrationSql = writeMigration
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");

const runbook = readFileSync(
  join(process.cwd(), "docs/runbooks/EXPENSES_RLS_FALLBACK_REMOVAL.md"),
  "utf8",
);

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

describe("expenses RLS policies", () => {
  it("uses organization membership for reads", () => {
    const selectPolicy = policyBlock(
      "create policy \"expenses_select_organization\"",
      "create policy \"expenses_insert_owner_organization\"",
    );

    expect(selectPolicy).toContain("for select");
    expect(selectPolicy).toContain("public.is_organization_member(organization_id)");
    expect(selectPolicy).not.toContain("organization_id is null");
    expect(selectPolicy).not.toContain("owner_id = auth.uid()");
  });

  it("requires GASTOS write permission and matching legacy owner for inserts and updates", () => {
    const insertPolicy = writePolicyBlock(
      "create policy \"expenses_insert_organization\"",
      "create policy \"expenses_update_organization\"",
    );
    const updatePolicy = writePolicyBlock(
      "create policy \"expenses_update_organization\"",
      "create policy \"expenses_delete_organization\"",
    );

    expect(insertPolicy).toContain("for insert");
    expect(insertPolicy).toContain("public.can_manage_organization_expense(organization_id, family_member_id, category_id, 'can_create')");
    expect(insertPolicy).toContain("public.organization_legacy_owner_matches(organization_id, owner_id)");
    expect(insertPolicy).not.toContain("owner_id = auth.uid()");

    expect(updatePolicy).toContain("for update");
    expect(updatePolicy).toContain("public.can_manage_organization_expense(organization_id, family_member_id, category_id, 'can_edit')");
    expect(updatePolicy).toContain("public.organization_legacy_owner_matches(organization_id, owner_id)");
    expect(updatePolicy).not.toContain("owner_id = auth.uid()");
  });

  it("uses GASTOS delete permission for deletes without WITH CHECK", () => {
    const deletePolicy = writePolicyBlock(
      "create policy \"expenses_delete_organization\"",
    );

    expect(deletePolicy).toContain("for delete");
    expect(deletePolicy).toContain("public.can_manage_organization_expense(organization_id, family_member_id, category_id, 'can_delete')");
    expect(deletePolicy).not.toContain("owner_id = auth.uid()");
    expect(deletePolicy.toLowerCase()).not.toContain("with check");
  });

  it("keeps the direct-client RLS helper tied to GASTOS permissions and tenant relationships", () => {
    expect(writeMigrationSql).toContain("create or replace function public.can_manage_organization_expense");
    expect(writeMigrationSql).toContain("security definer");
    expect(writeMigrationSql).toContain("set search_path = public");
    expect(writeMigrationSql).toContain("from public.family_members fm");
    expect(writeMigrationSql).toContain("fm.id = target_family_member_id");
    expect(writeMigrationSql).toContain("fm.organization_id = target_organization_id");
    expect(writeMigrationSql).toContain("from public.expense_categories ec");
    expect(writeMigrationSql).toContain("ec.id = target_category_id");
    expect(writeMigrationSql).toContain("ec.organization_id = target_organization_id");
    expect(writeMigrationSql).toContain("not public.is_organization_member(target_organization_id) then false");
    expect(writeMigrationSql).toContain("public.is_organization_admin(target_organization_id)");
    expect(writeMigrationSql).toContain("ump.module = 'GASTOS'");
    expect(writeMigrationSql).toContain("ump.scope = 'family'");
    expect(writeMigrationSql).toContain("ump.scope = 'selected'");
    expect(writeMigrationSql).toContain("ump.scope = 'own'");
    expect(writeMigrationSql).toContain("grant execute on function public.can_manage_organization_expense(uuid, uuid, uuid, text) to authenticated");
  });

  it("checks active organization membership before honoring admin or module permissions", () => {
    const membershipCheckIndex = writeMigrationSql.indexOf(
      "not public.is_organization_member(target_organization_id) then false",
    );
    const adminCheckIndex = writeMigrationSql.indexOf(
      "public.is_organization_admin(target_organization_id)",
    );
    const permissionsCheckIndex = writeMigrationSql.indexOf("ump.module = 'GASTOS'");

    expect(membershipCheckIndex).toBeGreaterThanOrEqual(0);
    expect(adminCheckIndex).toBeGreaterThan(membershipCheckIndex);
    expect(permissionsCheckIndex).toBeGreaterThan(membershipCheckIndex);
  });

  it("does not depend on family member active status in executable SQL", () => {
    expect(migrationSql).toContain("from public.family_members fm");
    expect(migrationSql).not.toContain("fm.is_active");
    expect(migrationSql).toContain("p.is_active = true");
  });

  it("removes legacy null-organization fallback from expense policies", () => {
    expect(migrationSql.toLowerCase()).not.toContain("organization_id is null");
    expect(migrationSql.toLowerCase()).not.toContain("or organization_id is null");
    expect(migrationSql).toContain("expenses_select_organization");
    expect(writeMigrationSql).toContain('drop policy if exists "expenses_insert_owner_organization"');
    expect(writeMigrationSql).toContain("expenses_insert_organization");
    expect(writeMigrationSql).toContain("expenses_update_organization");
    expect(writeMigrationSql).toContain("expenses_delete_organization");
  });

  it("documents concrete rollback SQL for the fallback removal", () => {
    expect(runbook).toContain("Rollback SQL");
    expect(runbook).toContain('drop policy if exists "expenses_select_organization"');
    expect(runbook).toContain('create policy "expenses_select_organization_or_legacy"');
    expect(runbook).toContain('create policy "expenses_insert_owner_organization_or_legacy"');
    expect(runbook).toContain('create policy "expenses_update_owner_organization_or_legacy"');
    expect(runbook).toContain('create policy "expenses_delete_owner_organization_or_legacy"');
  });
});
