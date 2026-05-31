import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("onboarding organization rate limit runtime guards", () => {
  const onboardingAction = read("app/onboarding/organizacao/actions.ts");
  const onboardingForm = read("components/onboarding/organization-onboarding-form.tsx");
  const contract = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const rateLimitPlan = read("docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("rate limits initial organization onboarding server-side before the RPC", () => {
    expect(onboardingAction).toContain("createinitialorganizationfromonboarding");
    expect(onboardingAction).toContain("checksensitiveoperationratelimit");
    expect(onboardingAction).toContain('operationkey: "onboarding.organization.create"');
    expect(onboardingAction).toContain("getclaims");
    expect(onboardingAction).toContain("actorkey");
    expect(onboardingAction).toContain('"missing-session"');
    expect(onboardingAction).toContain('organizationid: "onboarding"');
    expect(onboardingAction).toContain("limit: 5");
    expect(onboardingAction).toContain("windowms: 10 * 60 * 1000");
    expect(onboardingAction.indexOf("const ratelimit = checksensitiveoperationratelimit")).toBeLessThan(
      onboardingAction.indexOf('rpc("create_initial_organization_onboarding"'),
    );
    expect(onboardingAction.indexOf("if (!name)")).toBeLessThan(
      onboardingAction.indexOf("const ratelimit = checksensitiveoperationratelimit"),
    );
  });

  it("keeps the onboarding form wired to the rate-limited server action", () => {
    expect(onboardingForm).toContain("createinitialorganizationfromonboarding");
    expect(onboardingForm).toContain("useactionstate");
    expect(onboardingForm).not.toContain("createclient");
    expect(onboardingForm).not.toContain("create_initial_organization_onboarding");
  });

  it("keeps docs aligned with the scoped onboarding organization rate limit boundary", () => {
    for (const source of [contract, rateLimitPlan, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("onboarding.organization.create");
      expect(source).toContain("onboarding organization rate limit runtime");
    }

    expect(contract).toContain("no onboarding audit runtime");
    expect(rateLimitPlan).toContain("organization key `onboarding`");
    expect(roadmap).toContain("sem audit runtime");
    expect(liveStatus).toContain("sem audit runtime");
    expect(gapRegister).toContain("sem audit runtime");
  });
});
