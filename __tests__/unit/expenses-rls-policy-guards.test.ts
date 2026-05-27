import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/032_expenses_rls_remove_legacy_fallback.sql"),
  "utf8",
);

const runbook = readFileSync(
  join(process.cwd(), "docs/runbooks/EXPENSES_RLS_FALLBACK_REMOVAL.md"),
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

describe("expenses RLS policies", () => {
  it("uses organization membership for reads", () => {
    const selectPolicy = policyBlock(
      "create policy \"expenses_select_organization\"",
      "create policy \"expenses_insert_owner_organization\"",
    );

    expect(selectPolicy).toContain("for select");
    expect(selectPolicy).toContain("public.is_organization_member(organization_id)");
    expect(selectPolicy).not.toContain("organization_id is null");
  });

  it("requires row ownership for updates", () => {
    const updatePolicy = policyBlock(
      "create policy \"expenses_update_owner_organization\"",
      "create policy \"expenses_delete_owner_organization\"",
    );

    expect(updatePolicy).toContain("for update");
    expect(updatePolicy).toContain("owner_id = auth.uid()");
    expect(updatePolicy).toContain("public.is_organization_member(organization_id)");
  });

  it("requires row ownership for deletes without WITH CHECK", () => {
    const deletePolicy = policyBlock(
      "create policy \"expenses_delete_owner_organization\"",
    );

    expect(deletePolicy).toContain("for delete");
    expect(deletePolicy).toContain("owner_id = auth.uid()");
    expect(deletePolicy).toContain("public.is_organization_member(organization_id)");
    expect(deletePolicy.toLowerCase()).not.toContain("with check");
  });

  it("removes legacy null-organization fallback from expense policies", () => {
    const executablePolicySql = migration
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("--"))
      .join("\n")
      .toLowerCase();

    expect(executablePolicySql).not.toContain("organization_id is null");
    expect(executablePolicySql).not.toContain("or organization_id is null");
    expect(executablePolicySql).toContain("expenses_select_organization");
    expect(executablePolicySql).toContain("expenses_insert_owner_organization");
    expect(executablePolicySql).toContain("expenses_update_owner_organization");
    expect(executablePolicySql).toContain("expenses_delete_owner_organization");
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
