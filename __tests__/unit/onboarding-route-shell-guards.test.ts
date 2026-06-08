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
    expect(source).toContain("Crie seu espaco financeiro");
    expect(source).toContain("OrganizationOnboardingForm");
    expect(source).not.toContain("createClient");
    expect(source).not.toContain("createAdminClient");
    expect(source).not.toContain('from("organizations")');
    expect(source).not.toContain('from("organization_memberships")');
  });

  it("keeps onboarding copy aligned with organization creation behavior", () => {
    const source = readSource("app/onboarding/organizacao/page.tsx");

    expect(source).toContain("espaco financeiro inicial sera");
    expect(source).toContain("criado");
    expect(source).toContain("usuario sera vinculado como responsavel principal");
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

  it("keeps the server action delegating writes to the transactional RPC", () => {
    const source = readSource("app/onboarding/organizacao/actions.ts");

    expect(source).toContain("createInitialOrganizationFromOnboarding");
    expect(source).toContain("createClient");
    expect(source).toContain('supabase.rpc("create_initial_organization_onboarding"');
    expect(source).toContain("p_name: name");
    expect(source).toContain("p_slug: slug");
    expect(source).toContain("getOnboardingErrorMessage");
    expect(source).not.toContain("createAdminClient");
    expect(source).not.toContain('from("profiles")');
    expect(source).not.toContain('from("organization_memberships")');
    expect(source).not.toContain('from("organizations")');
    expect(source).not.toContain("rollbackInitialOrganization");
  });

  it("keeps the transactional onboarding RPC hardened", () => {
    const source = readSource("supabase/migrations/019_initial_organization_onboarding_rpc.sql");

    expect(source).toContain("create or replace function public.create_initial_organization_onboarding");
    expect(source).toContain("language plpgsql");
    expect(source).toContain("security definer");
    expect(source).toContain("set search_path = public");
    expect(source).toContain("auth.uid()");
    expect(source).toContain("auth.jwt() ->> 'email'");
    expect(source).toContain("revoke all on function public.create_initial_organization_onboarding(text, text) from public");
    expect(source).toContain("revoke all on function public.create_initial_organization_onboarding(text, text) from anon");
    expect(source).toContain("grant execute on function public.create_initial_organization_onboarding(text, text) to authenticated");
  }, 10_000);

  it("keeps the transactional onboarding RPC enforcing tenant safety", () => {
    const source = readSource("supabase/migrations/019_initial_organization_onboarding_rpc.sql");

    expect(source).toContain("Seu perfil está inativo.");
    expect(source).toContain("Seu perfil já está vinculado a uma organização");
    expect(source).toContain("Você já possui uma organização ativa.");
    expect(source).toContain("Este slug já está em uso.");
    expect(source).toContain("insert into public.organizations");
    expect(source).toContain("insert into public.organization_memberships");
    expect(source).toContain("insert into public.profiles");
    expect(source).toContain("update public.profiles");
    expect(source).toContain("role = 'admin'");
    expect(source).toContain("'owner'");
    expect(source).toContain("unique_violation");
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
