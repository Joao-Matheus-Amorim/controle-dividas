import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const preflightPath = "docs/sql/feature-permissions-organization-null-preflight.sql";
const dryRunPath = "docs/sql/feature-permissions-organization-dry-run.sql";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").toLowerCase();
}

function withoutComments(sql: string) {
  return sql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");
}

function forbiddenStatementPattern(token: string) {
  return new RegExp(`(^|[^a-z0-9_])${token}([^a-z0-9_]|$)`, "i");
}

describe("feature permissions organization preflight and dry-run guards", () => {
  const preflight = read(preflightPath);
  const dryRun = read(dryRunPath);
  const combinedSql = withoutComments(`${preflight}\n${dryRun}`);
  const forbiddenTokens = [
    "insert",
    "update",
    "delete",
    "alter",
    "drop",
    "truncate",
    "create",
    "grant",
    "revoke",
    "merge",
    "call",
  ];

  it("keeps the SQL checks table-scoped to feature permissions and profiles", () => {
    expect(preflight).toContain('"public"."user_feature_permissions"');
    expect(preflight).toContain('"public"."profiles"');
    expect(dryRun).toContain('"public"."user_feature_permissions"');
    expect(dryRun).toContain('"public"."profiles"');
    expect(combinedSql).not.toContain('"public"."user_module_permissions"');
    expect(combinedSql).not.toContain('"public"."expenses"');
    expect(combinedSql).not.toContain('"public"."banks"');
  });

  it("keeps the SQL checks read-only with robust token boundaries", () => {
    for (const token of forbiddenTokens) {
      expect(combinedSql).not.toMatch(forbiddenStatementPattern(token));
    }
  });

  it("keeps preflight focused on null organization rows and unsafe profile mappings", () => {
    expect(preflight).toContain("null_organization_rows");
    expect(preflight).toContain('permission."organization_id" is null');
    expect(preflight).toContain("profile_organization_id");
    expect(preflight).toContain('profile."owner_id" <> permission."owner_id"');
  });

  it("keeps dry-run classification explicit and non-mutating", () => {
    expect(dryRun).toContain("deterministically_mappable");
    expect(dryRun).toContain("needs_review");
    expect(dryRun).toContain("mapping_status");
    expect(dryRun).toContain("profile_organization_id is not null");
  });
});
