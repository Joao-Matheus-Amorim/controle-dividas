import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("billing webhook runtime contract guards", () => {
  const contract = read("docs/audits/BILLING_WEBHOOK_RUNTIME_CONTRACT.md");
  const flowContract = read("docs/audits/BILLING_SUBSCRIPTION_FLOW_CONTRACT.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const runbook = read("docs/runbooks/BILLING_STRIPE_TEST_ACCOUNT_RUNBOOK.md");

  it("defines the future webhook surface without implementing runtime", () => {
    expect(contract).toContain("app/api/stripe/webhook/route.ts");
    expect(contract).toContain("post");
    expect(contract).toContain("stripe_webhook_secret");
    expect(contract).toContain("stripe.webhooks.constructevent");
    expect(contract).toContain("corpo bruto");
    expect(contract).toContain("sem alterar estado local");
  });

  it("keeps webhook blocked until checkout and portal evidence exists", () => {
    expect(contract).toContain("checkout e portal stripe em modo teste");
    expect(contract).toContain("billing_stripe_test_account_runbook.md");
    expect(contract).toContain("evidencia de que checkout e portal stripe reais foram validados antes do webhook runtime");
    expect(contract).not.toContain("deferimento");
    expect(runbook).toContain("nao iniciar webhook");
  });

  it("keeps idempotency, state mapping, and write boundary decisions explicit", () => {
    expect(contract).toContain("idempotente");
    expect(contract).toContain("idempotency/event ids processados");
    expect(contract).toContain("mapear stripe price ids");
    expect(contract).toContain("service-role boundary ou rpc dedicada");
    expect(contract).toContain("sem armazenar payload bruto");
  });

  it("keeps the subscription flow linked to the dedicated webhook contract", () => {
    expect(flowContract).toContain("billing_webhook_runtime_contract.md");
    expect(flowContract).toContain("endpoint dedicado valida assinatura");
    expect(gapRegister).toContain("webhook pre-runtime contract");
    expect(gapRegister).toContain("billing webhook and subscription sync work should not start");
    expect(gapRegister).not.toContain("billing webhook and subscription " + "work should not start");
    expect(gapRegister).toContain("checkout and portal evidence gates have real stripe test evidence");
    expect(gapRegister).not.toContain("explicitly deferred");
    expect(liveStatus).toContain("billing_webhook_runtime_contract.md");
    expect(liveStatus).toContain("runtime bloqueado ate a evidencia real de checkout e portal");
    expect(liveStatus).toContain("webhook, subscription sync e enforcement comercial ainda nao foram implementados");
    expect(liveStatus).not.toContain("assinatura " + "sincronizada");
    expect(roadmap).toContain("webhook, subscription sync e enforcement comercial ainda nao");
    expect(roadmap).not.toContain("subscription sync, " + "webhook");
    expect(roadmap).not.toContain("deferimento");
    expect(roadmap).toContain("implementar webhook e subscription sync em prs separados");
    expect(roadmap).not.toContain("webhook e " + "assinatura");
    expect(roadmap).toContain("billing_webhook_runtime_contract.md");
  });
});
