import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/031_family_members_rls_remove_legacy_fallback.sql"),
  "utf8",
);

const runbook = readFileSync(
  join(process.cwd(), "docs/runbooks/FAMILY_MEMBERS_RLS_FALLBACK_REMOVAL.md"),
  "utf8",
);

describe("family_members RLS policies", () => {
  it("uses organization membership for reads", () => {
    const selectPolicy = migration.slice(
      migration.indexOf("create policy \"family_members_select_organization\""),
      migration.indexOf("create policy \"family_members_insert_owner_organization\""),
    );

    expect(selectPolicy).toContain("for select");
    expect(selectPolicy).toContain("public.is_organization_member(organization_id)");
    expect(selectPolicy).not.toContain("organization_id is null");
  });

  it("requires row ownership for updates", () => {
    const updatePolicy = migration.slice(
      migration.indexOf("create policy \"family_members_update_owner_organization\""),
      migration.indexOf("create policy \"family_members_delete_owner_organization\""),
    );

    expect(updatePolicy).toContain("for update");
    expect(updatePolicy).toContain("owner_id = auth.uid()");
    expect(updatePolicy).toContain("public.is_organization_member(organization_id)");
  });

  it("requires row ownership for deletes without WITH CHECK", () => {
    const deletePolicy = migration.slice(
      migration.indexOf("create policy \"family_members_delete_owner_organization\""),
    );

    expect(deletePolicy).toContain("for delete");
    expect(deletePolicy).toContain("owner_id = auth.uid()");
    expect(deletePolicy).toContain("public.is_organization_member(organization_id)");
    expect(deletePolicy.toLowerCase()).not.toContain("with check");
  });

  it("removes legacy null-organization fallback from family member policies", () => {
    const executablePolicySql = migration
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("--"))
      .join("\n")
      .toLowerCase();

    expect(executablePolicySql).not.toContain("organization_id is null");
    expect(executablePolicySql).not.toContain("or organization_id is null");
    expect(executablePolicySql).toContain("family_members_select_organization");
    expect(executablePolicySql).toContain("family_members_insert_owner_organization");
    expect(executablePolicySql).toContain("family_members_update_owner_organization");
    expect(executablePolicySql).toContain("family_members_delete_owner_organization");
  });

  it("documents concrete rollback SQL for the fallback removal", () => {
    expect(runbook).toContain("Rollback SQL");
    expect(runbook).toContain('drop policy if exists "family_members_select_organization"');
    expect(runbook).toContain('create policy "family_members_select_organization_or_legacy"');
    expect(runbook).toContain('create policy "family_members_insert_owner_organization_or_legacy"');
    expect(runbook).toContain('create policy "family_members_update_owner_organization_or_legacy"');
    expect(runbook).toContain('create policy "family_members_delete_owner_organization_or_legacy"');
  });
});
