import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("onboarding terminology contract guards", () => {
  const contract = read("docs/audits/ONBOARDING_TERMINOLOGY_CONTRACT.md");
  const page = read("app/onboarding/organizacao/page.tsx");
  const actions = read("app/onboarding/organizacao/actions.ts");
  const form = read("components/onboarding/organization-onboarding-form.tsx");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const auditsReadme = read("docs/audits/README.md");
  const docStatus = read("docs/DOCUMENTATION_STATUS.md");

  it("defines GAP-016 copy adoption without changing route or data boundaries", () => {
    expect(contract).toContain("gap-016");
    expect(contract).toContain("altera apenas copy runtime do onboarding");
    expect(contract).toContain("nao altera layout");
    expect(contract).toContain("nao altera rota");
    expect(contract).toContain("nao altera schema");
    expect(contract).toContain("nao altera rls");
    expect(contract).toContain("nao altera billing");
    expect(contract).toContain("nao muda /onboarding/organizacao");
  });

  it("defines user-facing terminology boundaries", () => {
    expect(contract).toContain("espaco financeiro");
    expect(contract).toContain("responsavel principal");
    expect(contract).toContain("identificador do link");
    expect(contract).toContain("organizacao");
    expect(contract).toContain("owner");
    expect(contract).toContain("slug");
  });

  it("keeps runtime copy aligned with the adopted user-facing terms", () => {
    expect(page).toContain("crie seu espaco financeiro");
    expect(page).toContain("responsavel principal");
    expect(page).not.toContain("owner");
    expect(actions).toContain("nome do espaco financeiro");
    expect(actions).toContain("identificador do link");
    expect(form).toContain("nome do espaco financeiro");
    expect(form).toContain("identificador do link");
    expect(form).toContain("familia-amorim");

    expect(contract).toContain("crie seu espaco financeiro");
    expect(contract).toContain("nome do espaco financeiro");
    expect(contract).toContain("identificador do link");
    expect(contract).toContain("responsavel principal");
    expect(contract).toContain("crie sua organizacao financeira");
    expect(contract).toContain("nome da organizacao");
    expect(contract).toContain("familia-amorim");
  });

  it("keeps planning and DocDoc indexes aligned", () => {
    for (const source of [gapRegister, roadmap, auditsReadme, docStatus]) {
      expect(source).toContain("onboarding_terminology_contract.md");
      expect(source).toContain("gap-016");
    }

    expect(gapRegister).toContain("onboarding terminology contract exists");
    expect(roadmap).toContain("onboarding terminology adoption");
    expect(auditsReadme).toContain("contrato vigente do gap-016");
    expect(docStatus).toContain("runtime de copy inicial implementado; nao altera rota");
  });
});
