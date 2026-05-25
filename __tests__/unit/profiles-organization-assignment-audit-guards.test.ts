import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").toLowerCase();
}

describe("profiles organization assignment audit", () => {
  const audit = read("docs/audits/PROFILES_READINESS.md");
  const accessControl = read("lib/finance/access-control.ts");
  const adminServer = read("lib/finance/admin-server.ts");
  const onboardingAction = read("app/onboarding/organizacao/actions.ts");
  const onboardingRpc = read("supabase/migrations/019_initial_organization_onboarding_rpc.sql");
  const adminActions = read("app/protected/admin/actions.ts");

  it("keeps bootstrap callers organization-first instead of hidden profile creation", () => {
    expect(accessControl).toContain('redirect("/onboarding/organizacao")');
    expect(adminServer).toContain('redirect("/onboarding/organizacao")');
    expect(accessControl).not.toContain("createbootstrapadminprofile");
    expect(adminServer).not.toContain("createbootstrapadminprofile");
    expect(accessControl).not.toContain('.from("profiles").insert');
    expect(adminServer).not.toContain('.from("profiles").insert');
  });

  it("keeps initial onboarding assigning organization scope transactionally", () => {
    expect(onboardingAction).toContain("create_initial_organization_onboarding");
    expect(onboardingRpc).toContain("insert into public.organizations");
    expect(onboardingRpc).toContain("insert into public.organization_memberships");
    expect(onboardingRpc).toContain("insert into public.profiles");
    expect(onboardingRpc).toContain("organization_id,");
    expect(onboardingRpc).toContain("new_organization_id");
    expect(onboardingRpc).toContain("update public.profiles");
    expect(onboardingRpc).toContain("organization_id = new_organization_id");
    expect(onboardingRpc).toContain("and organization_id is null");
  });

  it("keeps admin profile writes assigning active organization scope", () => {
    expect(adminActions).toContain("export async function createfamilyuser");
    expect(adminActions).toContain("organization_id: organization.id");
    expect(adminActions).toContain("export async function updatefamilyuser");
    expect(adminActions).toContain("export async function syncfamilyuserauthlink");
    expect(adminActions).toContain("export async function togglefamilyuserstatus");
    expect(adminActions).toContain("organizationorlegacyfilter(organization.id)");
  });

  it("keeps profiles readiness audit evidence-only", () => {
    expect(audit).toContain("current review: #636");
    expect(audit).toContain("profiles are ready for target-environment evidence review only");
    expect(audit).toContain("no profiles hardening migration should be created");
    expect(audit).toContain("no schema change");
    expect(audit).toContain("no data change");
    expect(audit).toContain("no runtime change");
  });
});
