import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/016_user_module_permissions_organization_rls.sql"),
  "utf8",
);

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

describe("user_module_permissions RLS policies", () => {
  it("uses organization membership and legacy owner fallback for reads", () => {
    const selectPolicy = policyBlock(
      "create policy \"module_permissions_select_organization_or_legacy\"",
      "create policy \"module_permissions_insert_owner_organization_or_legacy\"",
    );

    expect(selectPolicy).toContain("for select");
    expect(selectPolicy).toContain("public.is_organization_member(organization_id)");
    expect(selectPolicy).toContain("organization_id is null");
    expect(selectPolicy).toContain("owner_id = auth.uid()");
  });

  it("requires row ownership for inserts", () => {
    const insertPolicy = policyBlock(
      "create policy \"module_permissions_insert_owner_organization_or_legacy\"",
      "create policy \"module_permissions_update_owner_organization_or_legacy\"",
    );

    expect(insertPolicy).toContain("for insert");
    expect(insertPolicy).toContain("owner_id = auth.uid()");
    expect(insertPolicy).toContain("public.is_organization_member(organization_id)");
    expect(insertPolicy).toContain("organization_id is null");
  });

  it("requires row ownership for updates", () => {
    const updatePolicy = policyBlock(
      "create policy \"module_permissions_update_owner_organization_or_legacy\"",
      "create policy \"module_permissions_delete_owner_organization_or_legacy\"",
    );

    expect(updatePolicy).toContain("for update");
    expect(updatePolicy).toContain("owner_id = auth.uid()");
    expect(updatePolicy).toContain("public.is_organization_member(organization_id)");
    expect(updatePolicy).toContain("with check");
  });

  it("requires row ownership for deletes without WITH CHECK", () => {
    const deletePolicy = policyBlock(
      "create policy \"module_permissions_delete_owner_organization_or_legacy\"",
    );

    expect(deletePolicy).toContain("for delete");
    expect(deletePolicy).toContain("owner_id = auth.uid()");
    expect(deletePolicy).toContain("public.is_organization_member(organization_id)");
    expect(deletePolicy.toLowerCase()).not.toContain("with check");
  });
});
