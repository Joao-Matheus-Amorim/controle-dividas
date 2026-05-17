import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/010_family_members_organization_rls.sql"),
  "utf8",
);

describe("family_members RLS policies", () => {
  it("uses organization membership for reads", () => {
    const selectPolicy = migration.slice(
      migration.indexOf("create policy \"family_members_select_organization_or_legacy\""),
      migration.indexOf("create policy \"family_members_insert_owner_organization_or_legacy\""),
    );

    expect(selectPolicy).toContain("for select");
    expect(selectPolicy).toContain("public.is_organization_member(organization_id)");
    expect(selectPolicy).toContain("organization_id is null");
    expect(selectPolicy).toContain("owner_id = auth.uid()");
  });

  it("requires row ownership for updates", () => {
    const updatePolicy = migration.slice(
      migration.indexOf("create policy \"family_members_update_owner_organization_or_legacy\""),
      migration.indexOf("create policy \"family_members_delete_owner_organization_or_legacy\""),
    );

    expect(updatePolicy).toContain("for update");
    expect(updatePolicy).toContain("owner_id = auth.uid()");
    expect(updatePolicy).toContain("public.is_organization_member(organization_id)");
  });

  it("requires row ownership for deletes without WITH CHECK", () => {
    const deletePolicy = migration.slice(
      migration.indexOf("create policy \"family_members_delete_owner_organization_or_legacy\""),
    );

    expect(deletePolicy).toContain("for delete");
    expect(deletePolicy).toContain("owner_id = auth.uid()");
    expect(deletePolicy).toContain("public.is_organization_member(organization_id)");
    expect(deletePolicy.toLowerCase()).not.toContain("with check");
  });
});
