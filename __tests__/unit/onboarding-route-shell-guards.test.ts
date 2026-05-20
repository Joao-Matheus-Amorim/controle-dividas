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
    expect(source).toContain("Crie sua organizacao financeira");
    expect(source).toContain("OrganizationOnboardingForm");
    expect(source).not.toContain("createClient");
    expect(source).not.toContain("createAdminClient");
    expect(source).not.toContain('from("organizations")');
    expect(source).not.toContain('from("organization_memberships")');
  });

  it("keeps onboarding copy aligned with organization creation behavior", () => {
    const source = readSource("app/onboarding/organizacao/page.tsx");

    expect(source).toContain("organizacao financeira inicial sera");
    expect(source).toContain("criada");
    expect(source).toContain("usuario sera vinculado como owner");
    expect(source).toContain("Depois da");
    expect(source).toContain("criacao");
    expect(source).toContain("use Voltar para o app");
    expect(source).toContain("ambiente protegido");
    expect(source).not.toContain("os dados são apenas validados");
    expect(source).not.toContain("dados são apenas validados");
    expect(source).not.toContain("não grava dados no banco");
    expect(source).not.toContain("nao grava dados no banco");
    expect(source).not.toContain("não cria organization");
    expect(source).not.toContain("nao cria organization");
    expect(source).not.toContain("próxima PR segura");
    expect(source).not.toContain("proxima PR segura");
    expect(source).not.toContain("antes da etapa funcional");
  });

  it("does not promise automatic navigation after organization creation", () => {
    const source = readSource("app/onboarding/organizacao/page.tsx");

    expect(source).not.toContain("voce sera direcionado");
    expect(source).not.toContain("será direcionado");
    expect(source).not.toContain("direcionado para o app protegido");
  });

  it("keeps organization creation limited to the onboarding action", () => {
    const source = readSource("app/onboarding/organizacao/actions.ts");

    expect(source).toContain("createInitialOrganizationFromOnboarding");
    expect(source).toContain("validateCurrentUserEligibility");
    expect(source).toContain("validateOrganizationSlugAvailability");
    expect(source).toContain("createInitialOrganization");
    expect(source).toContain("isUniqueConstraintError");
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
    expect(source).toContain("rollbackInitialOrganization");
    expect(source).toContain(".delete().eq(\"id\", organizationId)");
    expect(source).not.toContain(".upsert(");
  });

  it("creates or links profile only inside the explicit onboarding action", () => {
    const source = readSource("app/onboarding/organizacao/actions.ts");

    expect(source).toContain("getOnboardingProfile");
    expect(source).toContain("ensureInitialOnboardingProfile");
    expect(source).toContain('select("id, is_active, organization_id")');
    expect(source).toContain("getInitialOnboardingProfileName");
    expect(source).toContain("organization_id: organizationId");
    expect(source).toContain('role: "admin"');
    expect(source).toContain("Seu perfil está inativo.");
    expect(source).toContain("existingProfile: profile");
  });

  it("promotes the initial owner profile to admin while linking it", () => {
    const source = readSource("app/onboarding/organizacao/actions.ts");

    expect(source).toContain(".update({\n        organization_id: organizationId,\n        role: \"admin\",");
    expect(source).toContain('role: "admin"');
    expect(source).toContain('role: "owner"');
  });

  it("blocks inconsistent active profiles already linked to an organization", () => {
    const source = readSource("app/onboarding/organizacao/actions.ts");

    expect(source).toContain("profile?.organization_id");
    expect(source).toContain("Seu perfil já está vinculado a uma organização");
    expect(source).toContain(".is(\"organization_id\", null)");
    expect(source).not.toContain(".update({ organization_id: organizationId })\n      .eq(\"id\", existingProfile.id)\n      .eq(\"auth_user_id\", authUserId)\n      .eq(\"is_active\", true)");
  });

  it("links profile after organization and owner membership creation", () => {
    const source = readSource("app/onboarding/organizacao/actions.ts");

    const organizationInsertIndex = source.indexOf('from("organizations")', source.indexOf("async function createInitialOrganization"));
    const membershipInsertIndex = source.indexOf('from("organization_memberships")', organizationInsertIndex);
    const profileLinkIndex = source.indexOf("const profileError = await ensureInitialOnboardingProfile", membershipInsertIndex);

    expect(organizationInsertIndex).toBeGreaterThan(-1);
    expect(membershipInsertIndex).toBeGreaterThan(organizationInsertIndex);
    expect(profileLinkIndex).toBeGreaterThan(membershipInsertIndex);
  });

  it("keeps a transitional database guard against concurrent active memberships", () => {
    const source = readSource("supabase/migrations/018_one_active_membership_per_user.sql");

    expect(source).toContain("organization_memberships_one_active_per_user_idx");
    expect(source).toContain("on public.organization_memberships(auth_user_id)");
    expect(source).toContain("where is_active = true");
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
