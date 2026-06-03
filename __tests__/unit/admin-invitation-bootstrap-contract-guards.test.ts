import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("admin invitation bootstrap contract guards", () => {
  const contract = read("docs/audits/ADMIN_INVITATION_BOOTSTRAP_CONTRACT.md");
  const ownerContract = read("docs/audits/ADMIN_ACCESS_CONTROL_OWNER_ID_RETIREMENT_CONTRACT.md");
  const activeConsumers = read("docs/audits/OWNER_ID_ACTIVE_CONSUMERS_2026-06-01.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");
  const pmbokPlan = read("docs/audits/PMBOK_GAP_DEBT_CONTROL_PLAN_2026-06-01.md");
  const auditsReadme = read("docs/audits/README.md");
  const statusMap = read("docs/DOCUMENTATION_STATUS.md");

  it("keeps ADMIN_EMAIL transitional instead of final SaaS admin authority", () => {
    expect(contract).toContain("status docdoc: atual como contrato pre-runtime");
    expect(contract).toContain("admin_email apenas como bootstrap emergencial/transicional");
    expect(contract).toContain("admin_email como modelo saas final de administracao");
    expect(contract).toContain("estado proibido como conclusao");
    expect(contract).toContain("organization_memberships(role owner/admin)");
    expect(contract).toContain("fallback emergencial/dev-only");
  });

  it("defines the invitation lifecycle before runtime implementation", () => {
    expect(contract).toContain("armazenamento do convite ou rpc equivalente");
    expect(contract).toContain("email convidado normalizado");
    expect(contract).toContain("organizacao alvo resolvida no servidor");
    expect(contract).toContain("pendente, aceito, revogado e expirado");
    expect(contract).toContain("auditoria para criar, reenviar, aceitar, revogar e expirar convite");
    expect(contract).toContain("rate limit para criar, reenviar e aceitar convite");
    expect(contract).toContain("rollback que mantenha `admin_email` emergencial");
  });

  it("blocks owner_id retirement and ADMIN_EMAIL removal until the gates exist", () => {
    expect(contract).toContain("remover `admin_email` e remover `owner_id` nao podem ocorrer no mesmo pr");
    expect(contract).toContain("runtime final de convite/admin ainda nao implementado");
    expect(contract).toContain("sem remover admin_email e sem retirar owner_id");
    expect(ownerContract).toContain("admin_invitation_bootstrap_contract.md");
    expect(activeConsumers).toContain("admin_invitation_bootstrap_contract.md");
  });

  it("registers the contract in live planning and DocDoc sources", () => {
    for (const source of [gapRegister, pmbokPlan, auditsReadme, statusMap]) {
      expect(source).toContain("admin_invitation_bootstrap_contract.md");
    }

    expect(gapRegister).toContain("runtime is not implemented");
    expect(pmbokPlan).toContain("contrato pre-runtime criado");
  });
});
