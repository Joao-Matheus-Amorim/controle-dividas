import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("billing settings status contract", () => {
  const component = read("components/settings/settings-billing-plan-status.tsx");
  const settingsPage = read("features/protected-pages/configuracoes-page.tsx");
  const contract = read("docs/audits/BILLING_SETTINGS_STATUS_CONTRACT.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("renders the current organization plan from the local billing catalog", () => {
    expect(component).toContain("getbillingplan");
    expect(component).toContain("plano da organizacao");
    expect(component).toContain("billing comercial ainda nao esta ativo");
    expect(component).toContain("contrato local de planos");
    expect(settingsPage).toContain("getcurrentorganization(orgslug)");
    expect(settingsPage).toContain("settingsbillingplanstatus");
    expect(settingsPage).toContain("organization.plan");
    expect(settingsPage).toContain("organization.trial_ends_at");
  });

  it("keeps this step read-only and out of Stripe runtime coupling", () => {
    for (const source of [component, settingsPage]) {
      expect(source).not.toContain("stripe");
      expect(source).not.toContain("checkout");
      expect(source).not.toContain("webhook");
      expect(source).not.toContain("billing portal");
      expect(source).not.toContain("createcustomer");
      expect(source).not.toContain("subscription");
    }
  });

  it("documents GAP-006 as status UI before Stripe", () => {
    expect(contract).toContain("gap-006");
    expect(contract).toContain("configuracoes > plano da organizacao");
    expect(contract).toContain("read-only");
    expect(contract).toContain("stripe sdk");
    expect(contract).toContain("checkout");
    expect(contract).toContain("webhooks");
    expect(contract).toContain("contrato de fluxo de assinatura");
  });

  it("keeps roadmap and gap register aligned with billing status progress", () => {
    expect(roadmap).toContain("docs/audits/billing_settings_status_contract.md");
    expect(roadmap).toContain("plano atual da organizacao");
    expect(gapRegister).toContain("billing settings status ui is implemented");
    expect(gapRegister).toContain("subscription flow contract is documented");
    expect(gapRegister).toContain("stripe configuration boundary is implemented");
    expect(gapRegister).toContain(
      "implement checkout runtime in a dedicated pr, keeping webhook and portal separated",
    );
  });
});
