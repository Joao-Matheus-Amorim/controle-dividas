import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

describe("initial organization onboarding route guards", () => {
  it("keeps the onboarding route outside the current protected layout", () => {
    expect(existsSync(join(rootDir, "app/onboarding/organizacao/page.tsx"))).toBe(true);
    expect(existsSync(join(rootDir, "app/protected/onboarding/organizacao/page.tsx"))).toBe(false);
  });

  it("keeps the onboarding page wired to the organization form", () => {
    const source = readSource("app/onboarding/organizacao/page.tsx");

    expect(source).toContain("InitialOrganizationOnboardingPage");
    expect(source).toContain("Onboarding inicial");
    expect(source).toContain("Crie sua organização financeira");
    expect(source).toContain("OrganizationOnboardingForm");
    expect(source).not.toContain("createClient");
    expect(source).not.toContain("createAdminClient");
    expect(source).not.toContain('from("organizations")');
    expect(source).not.toContain('from("organization_memberships")');
  });

  it("keeps organization creation limited to the onboarding action", () => {
    const source = readSource("app/onboarding/organizacao/actions.ts");

    expect(source).toContain("createInitialOrganizationFromOnboarding");
    expect(source).toContain("validateCurrentUserEligibility");
    expect(source).toContain("validateOrganizationSlugAvailability");
    expect(source).toContain("createInitialOrganization");
    expect(source).toContain("supabase.auth.getClaims()");
    expect(source).toContain("createAdminClient");
    expect(source).toContain('from("profiles")');
    expect(source).toContain('from("organization_memberships")');
    expect(source).toContain('from("organizations")');
    expect(source).toContain("Você já possui uma organização ativa.");
    expect(source).toContain("Este slug já está em uso.");
    expect(source).toContain("Organização criada com sucesso.");
    expect(source).toContain("owner_auth_user_id: authUserId");
    expect(source).toContain("auth_user_id: authUserId");
    expect(source).toContain('role: "owner"');
    expect(source).toContain('plan: "free"');
    expect(source).toContain('status: "active"');
    expect(source).toContain(".insert({");
    expect(source).toContain(".delete().eq(\"id\", organization.id)");
    expect(source).not.toContain(".upsert(");
    expect(source).not.toContain(".update(");
  });

  it("keeps profile bootstrap from creating organizations or memberships", () => {
    const accessControl = readSource("lib/finance/access-control.ts");
    const adminServer = readSource("lib/finance/admin-server.ts");

    for (const source of [accessControl, adminServer]) {
      expect(source).not.toContain('from("organizations")');
      expect(source).not.toContain('from("organization_memberships")');
      expect(source).not.toContain("owner_auth_user_id");
      expect(source).not.toContain('role: "owner"');
    }
  });
});
