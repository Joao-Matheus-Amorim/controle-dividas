import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("billing checkout runtime contract", () => {
  const checkoutHelper = read("lib/billing/stripe-checkout.ts");
  const action = read("app/protected/configuracoes/billing-actions.ts");
  const component = read("components/settings/settings-billing-plan-status.tsx");
  const flowContract = read("docs/audits/BILLING_SUBSCRIPTION_FLOW_CONTRACT.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("creates checkout sessions from server-resolved organization context", () => {
    expect(action).toContain("requireorganizationadmin(orgslug)");
    expect(action).toContain("createstripecheckoutsession");
    expect(action).not.toContain("organization_id");
    expect(checkoutHelper).toContain("client_reference_id: organization.id");
    expect(checkoutHelper).toContain("organization.stripe_customer_id");
    expect(checkoutHelper).toContain("requested_plan");
  });

  it("keeps checkout buttons disabled for non-admin viewers before form submit", () => {
    const settingsPage = read("features/protected-pages/configuracoes-page.tsx");

    expect(settingsPage).toContain("requireorganizationaccess(orgslug)");
    expect(settingsPage).toContain('["owner", "admin"].includes');
    expect(component).toContain("canmanagebilling");
    expect(component).toContain("const checkoutavailable = canmanagebilling && checkoutenabled && checkoutready");
    expect(component).toContain("apenas owner/admin");
  });

  it("keeps checkout behind the Stripe flag and price env vars", () => {
    expect(checkoutHelper).toContain("assertstripeconfigurationboundary");
    expect(checkoutHelper).toContain("checkout_disabled");
    expect(checkoutHelper).toContain("stripe_not_configured");
    expect(checkoutHelper).toContain("missing_price");
    expect(component).toContain("checkoutenabled");
    expect(component).toContain("checkoutready");
  });

  it("does not implement webhook, portal, schema, RLS, or commercial enforcement", () => {
    for (const source of [checkoutHelper, action, component]) {
      expect(source).not.toContain("billing portal");
      expect(source).not.toContain("alter table");
      expect(source).not.toContain("create policy");
      expect(source).not.toContain("stripe.webhooks");
    }
  });

  it("keeps live docs aligned with the dedicated checkout-runtime step", () => {
    expect(flowContract).toContain("checkout runtime implementado");
    expect(flowContract).toContain("sem webhook runtime");
    expect(flowContract).toContain("sem portal runtime");
    expect(roadmap).toContain("checkout runtime esta implementado");
    expect(gapRegister).toContain("stripe checkout runtime is implemented");
  });
});
