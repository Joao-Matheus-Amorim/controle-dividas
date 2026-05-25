import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8").toLowerCase();
}

describe("admin organization scope fallback guard", () => {
  it("keeps admin actions scoped to active organization equality", () => {
    const source = readSource("app/protected/admin/actions.ts");

    expect(source).toContain('requireorganizationaccess');
    expect(source).toContain('.eq("owner_id", adminprofile.owner_id)');
    expect(source).toContain('.eq("organization_id", organization.id)');
    expect(source).not.toContain('organization_id.is.null');
    expect(source).not.toContain('.or(organizationorlegacyfilter');
  });

  it("keeps organization helper fallback work separate", () => {
    const audit = readSource("docs/audits/LEGACY_ORGANIZATION_FALLBACK_REMOVAL_READINESS.md");

    expect(audit).toContain("must continue one surface at a time");
    expect(audit).toContain("organization helper files still use active organization or legacy null organization filtering");
    expect(audit).toContain("avoid schema, rls, billing, ui, and e2e mixing");
  });
});
