import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("notification scope contract guards", () => {
  const contract = read("docs/audits/NOTIFICATION_SCOPE_CONTRACT.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const auditsReadme = read("docs/audits/README.md");
  const docStatus = read("docs/DOCUMENTATION_STATUS.md");
  const packageJson = read("package.json");

  it("documents GAP-017 without claiming notification runtime", () => {
    expect(contract).toContain("gap-017");
    expect(contract).toContain("sem implementar runtime novo");
    expect(contract).toContain("nao adiciona dependencia");
    expect(contract).toContain("nao altera ui");
    expect(contract).toContain("nao cria cron");
    expect(contract).toContain("nao envia email");
    expect(contract).toContain("nao envia push");
    expect(contract).toContain("nao cria tabela");
    expect(contract).toContain("nao altera rls");
    expect(contract).toContain("nao declara gap-017 runtime como implementado");
  });

  it("defines first alert candidates, channels, opt-in, and tenant boundaries", () => {
    expect(contract).toContain("vencimento de conta a pagar");
    expect(contract).toContain("conta a pagar atrasada");
    expect(contract).toContain("vencimento de conta a receber");
    expect(contract).toContain("fase 1: in-app");
    expect(contract).toContain("fase 2: email");
    expect(contract).toContain("fase 3: push");
    expect(contract).toContain("opt-in");
    expect(contract).toContain("deduplicacao");
    expect(contract).toContain("tenant scope");
    expect(contract).toContain("organizacao ativa");
    expect(contract).toContain("permissao");
    expect(contract).toContain("rollback");
  });

  it("blocks notification providers and schedulers until a dedicated runtime PR exists", () => {
    expect(contract).toContain("provider externo exige boundary");
    expect(contract).toContain("jobs ou crons devem ter idempotencia");
    expect(contract).toContain("nenhum envio externo sem opt-in explicito");
    expect(packageJson).not.toContain("resend");
    expect(packageJson).not.toContain("nodemailer");
    expect(packageJson).not.toContain("sendgrid");
    expect(packageJson).not.toContain("postmark");
    expect(packageJson).not.toContain("web-push");
    expect(packageJson).not.toContain("firebase-admin");
  });

  it("keeps live planning and DocDoc indexes aligned", () => {
    for (const source of [gapRegister, roadmap, auditsReadme, docStatus]) {
      expect(source).toContain("notification_scope_contract.md");
      expect(source).toContain("gap-017");
    }

    expect(gapRegister).toContain("notification scope contract exists");
    expect(gapRegister).toContain(
      "no notification runtime, ui, cron, schema, rls, billing, or dependency change is implemented",
    );
    expect(roadmap).toContain("notification scope adoption");
    expect(auditsReadme).toContain("contrato vigente do gap-017");
    expect(docStatus).toContain("nao implementa runtime, ui, cron, schema ou dependencia");
  });
});
