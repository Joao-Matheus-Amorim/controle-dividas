import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("billing stripe configuration boundary contract", () => {
  const helper = read("lib/billing/stripe-config.ts");
  const contract = read("docs/audits/BILLING_STRIPE_CONFIGURATION_BOUNDARY.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");
  const billingAdr = read("docs/adr/0008-billing-plan-contract-before-stripe.md");

  it("keeps Stripe configuration boundary explicit and Vitest-compatible", () => {
    expect(helper).not.toContain('import "server-only"');
    expect(helper).toContain("enable_stripe_checkout");
    expect(helper).toContain("stripe_secret_key");
    expect(helper).toContain("stripe_webhook_secret");
    expect(helper).toContain("next_public_stripe_publishable_key");
    expect(helper).toContain("next_public_app_url");
    expect(helper).toContain("shouldfailfastformissingruntimeenv");
  });

  it("documents the boundary with checkout still separated from webhook and portal", () => {
    expect(contract).toContain("gap-006");
    expect(contract).toContain("enable_stripe_checkout");
    expect(contract).toContain("lib/billing/stripe-config.ts");
    expect(contract).toContain("compatibilidade com vitest/vite");
    expect(contract).toContain("stripe_price_family_basic");
    expect(contract).toContain("checkout runtime");
    expect(contract).toContain("billing portal runtime");
    expect(contract).toContain("lib/billing/stripe-checkout.ts");
    expect(contract).toContain("lib/billing/stripe-portal.ts");
    expect(contract).toContain("endpoint webhook");
    expect(contract).toContain("validar checkout e portal reais");
    expect(contract).toContain("nao declarar checkout ou portal stripe validado");
  });

  it("keeps roadmap, gap register, and ADR aligned with the post-boundary next step", () => {
    expect(roadmap).toContain("docs/audits/billing_stripe_configuration_boundary.md");
    expect(roadmap).toContain("lib/billing/stripe-config.ts");
    expect(roadmap).toContain("checkout runtime esta implementado");

    expect(gapRegister).toContain("stripe configuration boundary");
    expect(gapRegister).toContain("stripe checkout runtime");

    expect(billingAdr).toContain("billing_stripe_configuration_boundary.md");
    expect(billingAdr).toContain("implementar checkout runtime em pr proprio");
    expect(billingAdr).toContain("implementar billing portal runtime em pr proprio");
  });
});
