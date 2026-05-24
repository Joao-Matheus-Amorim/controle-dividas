import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const auditPath = "docs/audits/PROFILES_READINESS.md";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").toLowerCase();
}

describe("profiles readiness audit", () => {
  const audit = read(auditPath);

  it("does not claim profiles schema hardening is ready", () => {
    expect(audit).toContain("profiles should not be schema-hardened in this pr");
    expect(audit).toContain("the next safe step after this runtime alignment is to review");
    expect(audit).not.toContain("readiness: ready");
    expect(audit).not.toContain("current status: hardened");
    expect(audit).not.toContain("profiles are ready for schema hardening");
  });

  it("documents the reviewed code surface", () => {
    expect(audit).toContain("lib/finance/bootstrap-admin-profile.ts");
    expect(audit).toContain("lib/finance/access-control.ts");
    expect(audit).toContain("lib/finance/admin-server.ts");
    expect(audit).toContain("lib/organizations/server.ts");
    expect(audit).toContain("app/protected/admin/actions.ts");
  });

  it("keeps this PR explicitly limited to runtime boundary alignment and read-only preparation", () => {
    expect(audit).toContain("read-only sql preparation");
    expect(audit).toContain("profile bootstrap runtime boundary");
    expect(audit).toContain("docs/sql/profile-organization-null-check.sql");
    expect(audit).toContain("docs/sql/profile-organization-dry-run.sql");
    expect(audit).toContain("/onboarding/organizacao");
    expect(audit).toContain("no schema change");
    expect(audit).toContain("no data change");
    expect(audit).toContain("no rls change");
    expect(audit).toContain("no e2e change");
  });
});
