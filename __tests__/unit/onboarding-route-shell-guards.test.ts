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

  it("keeps the onboarding route as a non-mutating shell", () => {
    const source = readSource("app/onboarding/organizacao/page.tsx");

    expect(source).toContain("InitialOrganizationOnboardingPage");
    expect(source).toContain("Onboarding inicial");
    expect(source).toContain("Crie sua organização financeira");
    expect(source).toContain("disabled");
    expect(source).toContain("Criar organização em breve");
    expect(source).toContain("ainda não grava dados no");
    expect(source).not.toContain("createClient");
    expect(source).not.toContain("createAdminClient");
    expect(source).not.toContain('from("organizations")');
    expect(source).not.toContain('from("organization_memberships")');
    expect(source).not.toContain("server action");
  });
});
