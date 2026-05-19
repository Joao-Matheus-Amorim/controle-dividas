import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

const profileBootstrapFiles = [
  "lib/finance/access-control.ts",
  "lib/finance/admin-server.ts",
];

describe("profile bootstrap organization guards", () => {
  it.each(profileBootstrapFiles)(
    "keeps %s from creating organizations or memberships implicitly",
    (path) => {
      const source = readSource(path);

      expect(source).toContain("createBootstrapAdminProfile");
      expect(source).toContain("profiles");
      expect(source).not.toContain('from("organizations")');
      expect(source).not.toContain("from('organizations')");
      expect(source).not.toContain('from("organization_memberships")');
      expect(source).not.toContain("from('organization_memberships')");
      expect(source).not.toContain('organization_memberships").insert');
      expect(source).not.toContain('organization_memberships").upsert');
      expect(source).not.toContain('organizations").insert');
      expect(source).not.toContain('organizations").upsert');
    },
  );

  it("keeps organization context reads centralized in the organization server helper", () => {
    const source = readSource("lib/organizations/server.ts");

    expect(source).toContain("export async function getUserOrganizations");
    expect(source).toContain('from("organization_memberships")');
    expect(source).toContain('from("organizations")');
    expect(source).toContain("export async function requireOrganizationAccess");
  });
});
