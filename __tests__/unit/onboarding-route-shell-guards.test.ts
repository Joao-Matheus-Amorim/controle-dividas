import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

describe("initial organization onboarding route shell guards", () => {
  it("keeps the onboarding route outside the current protected layout", () => {
    expect(existsSync(join(rootDir, "app/onboarding/organizacao/page.tsx"))).toBe(true);
    expect(existsSync(join(rootDir, "app/protected/onboarding/organizacao/page.tsx"))).toBe(false);
  });

  it("keeps the onboarding page wired to validation form", () => {
    const source = readSource("app/onboarding/organizacao/page.tsx");

    expect(source).toContain("InitialOrganizationOnboardingPage");
    expect(source).toContain("Onboarding inicial");
    expect(source).toContain("Crie sua organização financeira");
    expect(source).toContain("OrganizationOnboardingForm");
    expect(source).toContain("ainda não grava dados no");
    expect(source).not.toContain("createClient");
    expect(source).not.toContain("createAdminClient");
    expect(source).not.toContain('from("organizations")');
    expect(source).not.toContain('from("organization_memberships")');
  });

  it("keeps the onboarding action validation-only while checking eligibility", () => {
    const source = readSource("app/onboarding/organizacao/actions.ts");

    expect(source).toContain("validateInitialOrganizationOnboarding");
    expect(source).toContain("validateCurrentUserEligibility");
    expect(source).toContain("normalizeOrganizationSlug");
    expect(source).toContain("slugPattern");
    expect(source).toContain("supabase.auth.getClaims()");
    expect(source).toContain('from("profiles")');
    expect(source).toContain('from("organization_memberships")');
    expect(source).toContain('from("organizations")');
    expect(source).toContain("Você já possui uma organização ativa.");
    expect(source).toContain("Este slug já está em uso.");
    expect(source).toContain("Validação concluída");
    expect(source).not.toContain("createAdminClient");
    expect(source).not.toContain(".insert(");
    expect(source).not.toContain(".upsert(");
    expect(source).not.toContain(".update(");
    expect(source).not.toContain(".delete(");
  });
});
