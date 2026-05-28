import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("billing Stripe test account runbook", () => {
  const runbook = read("docs/runbooks/BILLING_STRIPE_TEST_ACCOUNT_RUNBOOK.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");
  const flowContract = read("docs/audits/BILLING_SUBSCRIPTION_FLOW_CONTRACT.md");
  const boundaryContract = read("docs/audits/BILLING_STRIPE_CONFIGURATION_BOUNDARY.md");

  it("documents the Stripe test account and checkout evidence prerequisites", () => {
    expect(runbook).toContain("conta stripe em modo teste");
    expect(runbook).toContain("stripe_price_family_basic");
    expect(runbook).toContain("stripe_price_family_plus");
    expect(runbook).toContain("stripe_price_family_pro");
    expect(runbook).toContain("enable_stripe_checkout=true");
    expect(runbook).toContain("organizations.plan nao mudou");
  });

  it("keeps webhook, portal, schema, RLS, and commercial enforcement out of scope", () => {
    expect(runbook).toContain("nao implementa");
    expect(runbook).toContain("webhook runtime");
    expect(runbook).toContain("billing portal runtime");
    expect(runbook).toContain("enforcement comercial");
    expect(runbook).toContain("migrations");
    expect(runbook).toContain("rls");
  });

  it("keeps live GAP-006 docs pointed at the runbook before webhook or portal work", () => {
    const runbookPath = "docs/runbooks/billing_stripe_test_account_runbook.md";

    expect(roadmap).toContain(runbookPath);
    expect(gapRegister).toContain("stripe test account runbook");
    expect(flowContract).toContain(runbookPath);
    expect(boundaryContract).toContain(runbookPath);
    expect(runbook).toContain("nao iniciar webhook, portal");
  });
});
