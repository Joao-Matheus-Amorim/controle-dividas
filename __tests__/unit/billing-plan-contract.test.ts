import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  BILLING_PLAN_KEYS,
  BILLING_PLANS,
  getBillingPlan,
  isBillingPlanKey,
  isPaidBillingPlan,
  normalizeBillingPlanKey,
} from "@/lib/billing/plans";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("billing plan contract", () => {
  it("keeps the local plan catalog aligned with the organizations schema constraint", () => {
    const migration = read("supabase/migrations/006_organizations_memberships.sql");

    for (const planKey of BILLING_PLAN_KEYS) {
      expect(migration).toContain(`'${planKey}'`);
      expect(BILLING_PLANS[planKey].key).toBe(planKey);
    }

    expect(BILLING_PLAN_KEYS).toEqual([
      "free",
      "family_basic",
      "family_plus",
      "family_pro",
    ]);
  });

  it("normalizes unknown or missing plan values to the free compatibility plan", () => {
    expect(normalizeBillingPlanKey("family_plus")).toBe("family_plus");
    expect(normalizeBillingPlanKey("unknown")).toBe("free");
    expect(normalizeBillingPlanKey(null)).toBe("free");
    expect(getBillingPlan(undefined)).toEqual(BILLING_PLANS.free);
  });

  it("distinguishes paid plans without introducing Stripe runtime coupling", () => {
    expect(isBillingPlanKey("family_pro")).toBe(true);
    expect(isBillingPlanKey("enterprise")).toBe(false);
    expect(isPaidBillingPlan("free")).toBe(false);
    expect(isPaidBillingPlan("family_basic")).toBe(true);
    expect(isPaidBillingPlan("family_plus")).toBe(true);
    expect(isPaidBillingPlan("family_pro")).toBe(true);
  });
});
