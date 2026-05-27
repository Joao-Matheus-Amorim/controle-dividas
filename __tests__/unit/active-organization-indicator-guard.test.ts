import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

describe("active organization indicator guard", () => {
  it("keeps the protected layout wired to the active organization indicator", () => {
    const source = readSource("app/protected/layout.tsx");

    expect(source).toContain("@/components/app/active-organization-indicator");
    expect(source).toContain("ActiveOrganizationIndicator");
    expect(source).toContain("@/lib/organizations/server");
    expect(source).toContain("getCurrentOrganization");
    expect(source).toContain("getUserOrganizations");
    expect(source).toContain("organizationOptions");
    expect(source).toContain("organization={currentOrganization}");
  });

  it("keeps the protected layout using the Separator primitive for visual nav separation", () => {
    const source = readSource("app/protected/layout.tsx");

    expect(source).toContain("@/components/ui/separator");
    expect(source).toContain("Separator");
    expect(source).toContain('orientation="vertical"');
    expect(source).toContain("hidden h-8 bg-white/10 lg:block");
    expect(source).toContain("hidden bg-white/5 md:block");
  });

  it("keeps the layout hierarchy SaaS-ready", () => {
    const source = readSource("app/protected/layout.tsx");

    expect(source).toContain("FF");
    expect(source).toContain("FamilyFinance");
    expect(source).toContain("SaaS financeiro");
    expect(source).toContain("rounded-full");
    expect(source).toContain("border-white/10");
  });

  it("keeps active organization indicator with explicit organization switch control", () => {
    const source = readSource("components/app/active-organization-indicator.tsx");

    expect(source).toContain("type ActiveOrganizationIndicatorProps");
    expect(source).toContain("organization:");
    expect(source).toContain("organizationOptions:");
    expect(source).toContain("Organizacao");
    expect(source).toContain("Nao selecionada");
    expect(source).toContain("organization.name");
    expect(source).toContain("organization.slug");
    expect(source).toContain("setActiveOrganization");
    expect(source).toContain("action={setActiveOrganization}");
    expect(source).toContain("<form");
    expect(source).toContain("organization_id");
    expect(source).not.toContain("useRouter");
  });
});
