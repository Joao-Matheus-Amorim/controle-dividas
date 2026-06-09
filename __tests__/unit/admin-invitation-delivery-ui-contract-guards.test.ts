import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("admin invitation delivery and UI contract guards", () => {
  const contract = read("docs/audits/ADMIN_INVITATION_DELIVERY_UI_CONTRACT.md");
  const bootstrapContract = read("docs/audits/ADMIN_INVITATION_BOOTSTRAP_CONTRACT.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");
  const auditsReadme = read("docs/audits/README.md");
  const statusMap = read("docs/DOCUMENTATION_STATUS.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");

  it("tracks delivery adapter runtime while keeping UI pending", () => {
    expect(contract).toContain("status docdoc: atual como contrato com delivery adapter parcial");
    expect(contract).toContain("delivery adapter server-only versionado");
    expect(contract).toContain("lib/admin-invitations/delivery.ts");
    expect(contract).toContain("delivery adapter server-only existem; ui ainda e pendente");
    expect(contract).toContain("ui de aceite, cron de expiracao, remocao de admin_email");
  });

  it("blocks raw token storage, logging, audits, and client returns", () => {
    expect(contract).toContain("`organization_invitations` deve armazenar somente token hash");
    expect(contract).toContain("server actions de criar e reenviar convite nao podem retornar token bruto");
    expect(contract).toContain("audit metadata, logs, erros, rate-limit keys e mensagens de ui nao podem");
    expect(contract).toContain("qualquer resend deve gerar novo token bruto");
    expect(contract).toContain("raw invitation token must never be stored, logged, audited, returned");
  });

  it("requires fail-closed server-only email delivery before provider runtime", () => {
    expect(contract).toContain("provider server-only");
    expect(contract).toContain("feature flag de delivery");
    expect(contract).toContain("comportamento fail closed");
    expect(contract).toContain("compensacao para convite preparado mas nao entregue");
    expect(contract).toContain("rollback transacional/compensatorio que revoga o convite preparado");
    expect(contract).toContain("delivery adapter atual usa provider server-only");
    expect(contract).toContain("delivery falha fechado se");
  });

  it("defines the invitation acceptance UI without browser token persistence", () => {
    expect(contract).toContain("/auth/convite?token=...");
    expect(contract).toContain("a pagina nao pode imprimir token bruto");
    expect(contract).toContain("a pagina nao pode salvar token em localstorage, sessionstorage ou cookie");
    expect(contract).toContain("acceptadmininvitation");
    expect(contract).toContain("email mismatch");
  });

  it("registers the contract in live planning surfaces", () => {
    for (const source of [bootstrapContract, gapRegister, auditsReadme, statusMap, roadmap]) {
      expect(source).toContain("admin_invitation_delivery_ui_contract.md");
    }

    expect(gapRegister).toContain("delivery/ui contract exists");
    expect(gapRegister).toContain("delivery adapter runtime is versioned");
    expect(gapRegister).toContain("invitation ui, cron expiry");
    expect(bootstrapContract).toContain("contrato delivery/ui versionado");
  });
});
