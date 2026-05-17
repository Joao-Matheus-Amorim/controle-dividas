import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/009_expense_categories_owner_write_rls.sql"),
  "utf8",
);

describe("expense category RLS write policies", () => {
  it("requires row ownership for updates", () => {
    const updatePolicy = migration.slice(
      migration.indexOf("create policy \"expense_categories_update_owner_organization_or_legacy\""),
      migration.indexOf("create policy \"expense_categories_delete_owner_organization_or_legacy\""),
    );

    expect(updatePolicy).toContain("for update");
    expect(updatePolicy).toContain("owner_id = auth.uid()");
    expect(updatePolicy).toContain("public.is_organization_member(organization_id)");
  });

  it("requires row ownership for deletes without WITH CHECK", () => {
    const deletePolicy = migration.slice(
      migration.indexOf("create policy \"expense_categories_delete_owner_organization_or_legacy\""),
    );

    expect(deletePolicy).toContain("for delete");
    expect(deletePolicy).toContain("owner_id = auth.uid()");
    expect(deletePolicy).toContain("public.is_organization_member(organization_id)");
    expect(deletePolicy.toLowerCase()).not.toContain("with check");
  });
});
