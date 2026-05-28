import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("billing subscription flow contract", () => {
  const contract = read("docs/audits/BILLING_SUBSCRIPTION_FLOW_CONTRACT.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");
  const billingAdr = read("docs/adr/0008-billing-plan-contract-before-stripe.md");

  it("defines checkout, portal, webhook, and local-state boundaries before runtime", () => {
    expect(contract).toContain("gap-006");
    expect(contract).toContain("entrada de checkout");
    expect(contract).toContain("portal de billing");
    expect(contract).toContain("webhook");
    expect(contract).toContain("idempotente");
    expect(contract).toContain("organizations.plan");
    expect(contract).toContain("organization.id");
    expect(contract).toContain("configuracoes > plano da organizacao");
  });

  it("keeps the contract out of runtime Stripe implementation", () => {
    expect(contract).toContain("nao implementa sdk");
    expect(contract).toContain("nao implementa");
    expect(contract).toContain("rota de checkout");
    expect(contract).toContain("endpoint webhook");
    expect(contract).toContain("tabelas de assinatura");
    expect(contract).toContain("mudanca rls");
    expect(contract).toContain("e2e data-changing");
  });

  it("documents secrets and rollback before implementation", () => {
    expect(contract).toContain("stripe_secret_key");
    expect(contract).toContain("stripe_webhook_secret");
    expect(contract).toContain("next_public_stripe_publishable_key");
    expect(contract).toContain("next_public_app_url");
    expect(contract).toContain("rollback operacional");
    expect(contract).toContain("eventos atrasados");
  });

  it("keeps roadmap, gap register, and ADR 0008 aligned with the next Stripe-safe step", () => {
    expect(roadmap).toContain("docs/audits/billing_subscription_flow_contract.md");
    expect(roadmap).toContain("fronteira de configuracao stripe");
    expect(gapRegister).toContain("subscription flow contract is documented");
    expect(gapRegister).toContain("implement the stripe configuration boundary before checkout runtime");
    expect(billingAdr).toContain("billing_subscription_flow_contract.md");
    expect(billingAdr).toContain("fronteira de configuracao stripe");
  });
});
