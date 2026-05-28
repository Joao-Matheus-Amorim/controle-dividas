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
    expect(component).toContain("iniciar checkout");
    expect(component).toContain("checkoutenabled");
    expect(settingsPage).toContain("requireorganizationaccess(orgslug)");
    expect(settingsPage).toContain("settingsbillingplanstatus");
    expect(settingsPage).toContain("organization.organization.plan");
    expect(settingsPage).toContain("organization.organization.trial_ends_at");
    expect(settingsPage).toContain("canmanagebilling");
  });

  it("keeps checkout separated from portal, webhook, and commercial enforcement", () => {
    for (const source of [component, settingsPage]) {
      expect(source).not.toContain("billing portal");
      expect(source).not.toContain("createcustomer");
      expect(source).not.toContain("stripe.webhooks");
    }
  });

  it("documents GAP-006 as status UI before Stripe", () => {
    expect(contract).toContain("gap-006");
    expect(contract).toContain("configuracoes > plano da organizacao");
    expect(contract).toContain("ctas de checkout");
    expect(contract).toContain("enable_stripe_checkout");
    expect(contract).toContain("requireorganizationaccess(orgslug)");
    expect(contract).toContain("permissao de billing por membership");
    expect(contract).toContain("checkout");
    expect(contract).toContain("webhooks");
    expect(contract).toContain("evidencia real de checkout stripe segue pendente");
    expect(contract).toContain("contratos relacionados");
  });

  it("keeps roadmap and gap register aligned with billing status progress", () => {
    expect(roadmap).toContain("docs/audits/billing_settings_status_contract.md");
    expect(roadmap).toContain("plano atual da organizacao");
    expect(gapRegister).toContain("billing settings status ui");
    expect(gapRegister).toContain("subscription flow contract");
    expect(gapRegister).toContain("stripe configuration boundary");
    expect(gapRegister).toContain("stripe checkout runtime is implemented");
  });
});
