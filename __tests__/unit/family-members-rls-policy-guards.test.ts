import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/031_family_members_rls_remove_legacy_fallback.sql"),
  "utf8",
);

const organizationWriteMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/049_family_members_organization_write_rls.sql"),
  "utf8",
);

const legacyOwnerWriteConstraintMigration = readFileSync(
  join(process.cwd(), "supabase/migrations/050_family_members_legacy_owner_write_constraint.sql"),
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

  it("replaces owner-scoped writes with organization admin writes constrained to the organization legacy owner", () => {
    const insertPolicy = legacyOwnerWriteConstraintMigration.slice(
      legacyOwnerWriteConstraintMigration.indexOf("create policy \"family_members_insert_organization\""),
      legacyOwnerWriteConstraintMigration.indexOf("create policy \"family_members_update_organization\""),
    );
    const updatePolicy = legacyOwnerWriteConstraintMigration.slice(
      legacyOwnerWriteConstraintMigration.indexOf("create policy \"family_members_update_organization\""),
      legacyOwnerWriteConstraintMigration.indexOf("create policy \"family_members_delete_organization\""),
    );
    const deletePolicy = legacyOwnerWriteConstraintMigration.slice(
      legacyOwnerWriteConstraintMigration.indexOf("create policy \"family_members_delete_organization\""),
    );

    for (const policy of [insertPolicy, updatePolicy]) {
      expect(policy).toContain("public.is_organization_admin(organization_id)");
      expect(policy).toContain("public.organization_legacy_owner_matches(organization_id, owner_id)");
      expect(policy).not.toContain("owner_id = auth.uid()");
      expect(policy).not.toContain("public.is_organization_member(organization_id)");
    }

    expect(deletePolicy).toContain("public.is_organization_admin(organization_id)");
    expect(deletePolicy).not.toContain("owner_id = auth.uid()");
    expect(deletePolicy).not.toContain("public.organization_legacy_owner_matches(organization_id, owner_id)");
    expect(updatePolicy).toContain("for update");
    expect(deletePolicy).toContain("for delete");
    expect(deletePolicy.toLowerCase()).not.toContain("with check");
  });

  it("defines the legacy owner match helper as a security definer organization lookup", () => {
    expect(legacyOwnerWriteConstraintMigration).toContain(
      "create or replace function public.organization_legacy_owner_matches",
    );
    expect(legacyOwnerWriteConstraintMigration).toContain("security definer");
    expect(legacyOwnerWriteConstraintMigration).toContain("set search_path = public");
    expect(legacyOwnerWriteConstraintMigration).toContain("from public.organizations o");
    expect(legacyOwnerWriteConstraintMigration).toContain("o.id = target_organization_id");
    expect(legacyOwnerWriteConstraintMigration).toContain("o.owner_auth_user_id = target_owner_id");
    expect(legacyOwnerWriteConstraintMigration).toContain(
      "grant execute on function public.organization_legacy_owner_matches(uuid, uuid) to authenticated",
    );
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

    const executableWritePolicySql = organizationWriteMigration
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("--"))
      .join("\n")
      .toLowerCase();

    expect(executableWritePolicySql).toContain("family_members_insert_organization");
    expect(executableWritePolicySql).toContain("family_members_update_organization");
    expect(executableWritePolicySql).toContain("family_members_delete_organization");

    const executableConstrainedWritePolicySql = legacyOwnerWriteConstraintMigration
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("--"))
      .join("\n")
      .toLowerCase();

    expect(executableConstrainedWritePolicySql).toContain("organization_legacy_owner_matches");
    expect(executableConstrainedWritePolicySql).toContain("family_members_insert_organization");
    expect(executableConstrainedWritePolicySql).toContain("family_members_update_organization");
    expect(executableConstrainedWritePolicySql).toContain("family_members_delete_organization");
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
