import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const rootDir = process.cwd();

function readSource(path: string) {
  return readFileSync(join(rootDir, path), "utf8");
}

describe("active organization indicator guard", () => {
  it("keeps the shared app shell wired to the active organization indicator", () => {
    const source = readSource("components/app/app-shell.tsx");

    expect(source).toContain("@/components/app/active-organization-indicator");
    expect(source).toContain("ActiveOrganizationIndicator");
    expect(source).toContain("@/lib/organizations/server");
    expect(source).toContain("getCurrentOrganization");
    expect(source).toContain("getUserOrganizations");
    expect(source).toContain("organizationOptions");
    expect(source).toContain("organization={currentOrganization}");
  });

  it("keeps the shared app shell using the Separator primitive for visual nav separation", () => {
    const source = readSource("components/app/app-shell.tsx");

    expect(source).toContain("@/components/ui/separator");
    expect(source).toContain("Separator");
    expect(source).toContain('orientation="vertical"');
    expect(source).toContain("hidden h-8 bg-border lg:block");
    expect(source).toContain("hidden bg-border md:block");
  });

  it("keeps the shared app shell hierarchy SaaS-ready", () => {
    const source = readSource("components/app/app-shell.tsx");

    expect(source).toContain("FF");
    expect(source).toContain("FamilyFinance");
    expect(source).toContain("SaaS financeiro");
    expect(source).toContain("rounded-full");
    expect(source).toContain("border-border");
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
    expect(source).toContain("current_path");
    expect(source).not.toContain("useRouter");
  });

  it("keeps multi-org switch E2E behind an explicit cleanup-backed gate", () => {
    const spec = readSource("tests/e2e/multi-org-switch-authenticated-gated.spec.ts");
    const env = readSource("tests/e2e/helpers/e2e-env.ts");

    expect(env).toContain("RUN_MULTI_ORG_SWITCH_E2E");
    expect(env).toContain("E2E_MULTI_ORG_EMAIL");
    expect(env).toContain("E2E_MULTI_ORG_PASSWORD");
    expect(spec).toContain("e2e-multi-org-switch-");
    expect(spec).toContain("cleanupMultiOrgSwitchOrganizations");
    expect(spec).toContain("organization_id");
    expect(spec).toContain("selectOption");
    expect(spec).toContain("page.reload");
  });
});
