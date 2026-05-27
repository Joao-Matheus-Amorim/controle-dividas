import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/035_banks_rls_remove_legacy_fallback.sql"),
  "utf8",
);
const migrationSql = migration
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("--"))
  .join("\n");

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

describe("banks RLS policies", () => {
  it("uses organization membership for reads", () => {
    const selectPolicy = policyBlock(
      "create policy \"banks_select_organization\"",
      "create policy \"banks_insert_owner_organization\"",
    );

    expect(selectPolicy).toContain("for select");
    expect(selectPolicy).toContain("public.is_organization_member(organization_id)");
    expect(selectPolicy).not.toContain("organization_id is null");
    expect(selectPolicy).not.toContain("owner_id = auth.uid()");
  });

  it("requires row ownership for updates", () => {
    const updatePolicy = policyBlock(
      "create policy \"banks_update_owner_organization\"",
      "create policy \"banks_delete_owner_organization\"",
    );

    expect(updatePolicy).toContain("for update");
    expect(updatePolicy).toContain("owner_id = auth.uid()");
    expect(updatePolicy).toContain("public.is_organization_member(organization_id)");
  });

  it("requires row ownership for deletes without WITH CHECK", () => {
    const deletePolicy = policyBlock(
      "create policy \"banks_delete_owner_organization\"",
    );

    expect(deletePolicy).toContain("for delete");
    expect(deletePolicy).toContain("owner_id = auth.uid()");
    expect(deletePolicy).toContain("public.is_organization_member(organization_id)");
    expect(deletePolicy.toLowerCase()).not.toContain("with check");
  });

  it("does not depend on member active status in executable SQL", () => {
    expect(migrationSql).not.toContain("is_active");
  });

  it("removes legacy null-organization fallback from bank policies", () => {
    expect(migrationSql.toLowerCase()).not.toContain("organization_id is null");
    expect(migrationSql.toLowerCase()).not.toContain("or organization_id is null");
    expect(migrationSql).toContain("banks_select_organization");
    expect(migrationSql).toContain("banks_insert_owner_organization");
    expect(migrationSql).toContain("banks_update_owner_organization");
    expect(migrationSql).toContain("banks_delete_owner_organization");
  });
});
