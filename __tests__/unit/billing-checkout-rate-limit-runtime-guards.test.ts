import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("billing checkout rate limit runtime guards", () => {
  const billingAction = read("app/protected/configuracoes/billing-actions.ts");
  const limiter = read("lib/security/sensitive-rate-limit.ts");
  const rateLimitPlan = read("docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md");
  const controlsContract = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("limits checkout using server-derived actor and organization context before Stripe", () => {
    expect(billingAction).toContain("checkSensitiveOperationRateLimit".toLowerCase());
    expect(billingAction).toContain('operationkey: "billing.checkout.start"');
    expect(billingAction).toContain("actorkey: membership.auth_user_id");
    expect(billingAction).toContain("organizationid: organization.id");
    expect(billingAction).toContain("targetkey: plan");
    expect(billingAction.indexOf("const ratelimit = checksensitiveoperationratelimit")).toBeLessThan(
      billingAction.indexOf("const session = await createstripecheckoutsession"),
    );
  });

  it("uses a process-local fixed window limiter with a rollback env flag", () => {
    expect(limiter).toContain("new map");
    expect(limiter).toContain("disablesensitiveratelimits");
    expect(limiter).toContain("sweepexpiredratelimitbuckets");
    expect(limiter).toContain("buckets.delete");
    expect(limiter).toContain("process.env.disable_sensitive_rate_limits");
    expect(limiter).toContain("windowms");
    expect(limiter).toContain("retryafterms");
    expect(limiter).not.toContain("service_role");
    expect(limiter).not.toContain("email");
  });

  it("returns a safe blocked checkout outcome and audit event", () => {
    expect(billingAction).toContain("rate_limited");
    expect(billingAction).toContain('outcome: "denied"');
    expect(billingAction).toContain("redirecttosettings");
    expect(billingAction).not.toContain("retryafterms");
  });

  it("keeps docs aligned with the billing checkout rate limit runtime", () => {
    for (const source of [rateLimitPlan, controlsContract, roadmap, liveStatus, gapRegister]) {
      expect(source).toContain("billing checkout rate limit runtime");
      expect(source).toContain("billing.checkout.start");
      expect(source).toContain("disable_sensitive_rate_limits");
    }

    expect(gapRegister).toContain("data retention runtime controls are not implemented");
  });
});
