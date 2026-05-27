import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/036_profiles_rls_remove_legacy_fallback.sql"),
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

describe("profiles RLS policies", () => {
  it("uses direct self-profile access and organization membership for reads", () => {
    const selectPolicy = policyBlock(
      "create policy \"profiles_select_organization\"",
      "create policy \"profiles_insert_owner_organization\"",
    );

    expect(selectPolicy).toContain("for select");
    expect(selectPolicy).toContain("auth_user_id = auth.uid()");
    expect(selectPolicy).toContain("public.is_organization_member(organization_id)");
    expect(selectPolicy).not.toContain("organization_id is null");
  });

  it("requires row ownership for inserts", () => {
    const insertPolicy = policyBlock(
      "create policy \"profiles_insert_owner_organization\"",
      "create policy \"profiles_update_owner_organization\"",
    );

    expect(insertPolicy).toContain("for insert");
    expect(insertPolicy).toContain("owner_id = auth.uid()");
    expect(insertPolicy).toContain("public.is_organization_member(organization_id)");
    expect(insertPolicy).not.toContain("organization_id is null");
  });

  it("requires row ownership for updates", () => {
    const updatePolicy = policyBlock(
      "create policy \"profiles_update_owner_organization\"",
      "create policy \"profiles_delete_owner_organization\"",
    );

    expect(updatePolicy).toContain("for update");
    expect(updatePolicy).toContain("owner_id = auth.uid()");
    expect(updatePolicy).toContain("public.is_organization_member(organization_id)");
    expect(updatePolicy).toContain("with check");
  });

  it("requires row ownership for deletes without WITH CHECK", () => {
    const deletePolicy = policyBlock(
      "create policy \"profiles_delete_owner_organization\"",
    );

    expect(deletePolicy).toContain("for delete");
    expect(deletePolicy).toContain("owner_id = auth.uid()");
    expect(deletePolicy).toContain("public.is_organization_member(organization_id)");
    expect(deletePolicy.toLowerCase()).not.toContain("with check");
  });

  it("removes legacy null-organization fallback from profile policies", () => {
    const executablePolicySql = migration
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("--"))
      .join("\n")
      .toLowerCase();

    expect(executablePolicySql).not.toContain("organization_id is null");
    expect(executablePolicySql).not.toContain("or organization_id is null");
    expect(executablePolicySql).toContain("profiles_select_organization");
    expect(executablePolicySql).toContain("profiles_insert_owner_organization");
    expect(executablePolicySql).toContain("profiles_update_owner_organization");
    expect(executablePolicySql).toContain("profiles_delete_owner_organization");
  });
});
