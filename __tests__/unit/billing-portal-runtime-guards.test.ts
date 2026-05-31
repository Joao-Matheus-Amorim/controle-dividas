import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("billing portal runtime guards", () => {
  const action = read("app/protected/configuracoes/billing-actions.ts");
  const portalHelper = read("lib/billing/stripe-portal.ts");
  const component = read("components/settings/settings-billing-plan-status.tsx");
  const flowContract = read("docs/audits/BILLING_SUBSCRIPTION_FLOW_CONTRACT.md");
  const settingsContract = read("docs/audits/BILLING_SETTINGS_STATUS_CONTRACT.md");
  const rateLimitPlan = read("docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md");
  const controlsContract = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("creates portal sessions only from server-resolved billing customer context", () => {
    expect(action).toContain("requireorganizationadmin(orgslug)");
    expect(action).toContain("createstripebillingportalsession");
    expect(action).not.toContain("stripe_customer_id:");
    expect(portalHelper).toContain("organization.stripe_customer_id");
    expect(portalHelper).toContain("stripe.billingportal.sessions.create");
    expect(portalHelper).toContain("return_url");
    expect(portalHelper).toContain("missing_customer");
  });

  it("rate limits portal opens before Stripe and records redacted audit events", () => {
    expect(action).toContain('operationkey: "billing.portal.start"');
    expect(action).toContain("actorkey: membership.auth_user_id");
    expect(action).toContain("organizationid: organization.id");
    expect(action.indexOf("const ratelimit = checksensitiveoperationratelimit")).toBeLessThan(
      action.indexOf("const session = await createstripebillingportalsession"),
    );
    expect(action).toContain("billing.portal.start");
    expect(action).toContain("billing.portal.failed");
    expect(action).toContain('targettype: "billing_portal"');
    expect(action).toContain("rate_limited");
  });

  it("keeps portal separated from webhook, schema, RLS, and commercial enforcement", () => {
    for (const source of [action, portalHelper, component]) {
      expect(source).not.toContain("stripe.webhooks");
      expect(source).not.toContain("alter table");
      expect(source).not.toContain("create policy");
      expect(source).not.toContain("subscriptions");
      expect(source).not.toContain("commercial enforcement");
    }
  });

  it("keeps docs aligned with the dedicated billing portal runtime step", () => {
    for (const source of [
      flowContract,
      settingsContract,
      rateLimitPlan,
      controlsContract,
      roadmap,
      liveStatus,
      gapRegister,
    ]) {
      expect(source).toContain("billing portal runtime");
      expect(source).toContain("billing.portal.start");
    }

    expect(gapRegister).toContain("webhook, subscriptions, and commercial enforcement are not implemented");
  });
});
