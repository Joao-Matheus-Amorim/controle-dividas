import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("ADR 0006 current SaaS transition architecture", () => {
  const adr = read("docs/adr/0006-current-saas-transition-architecture.md");
  const index = read("docs/adr/README.md");

  it("keeps ADR 0006 indexed", () => {
    expect(index).toContain("0006-current-saas-transition-architecture.md");
    expect(index).toContain("estado saas transicional atual");
  });

  it("records the accepted current transition decision", () => {
    expect(adr).toContain("# adr 0006");
    expect(adr).toContain("aceito");
    expect(adr).toContain("fase transicional");
    expect(adr).toContain("nao deve ser tratado como arquitetura final");
  });

  it("documents the active organization contract", () => {
    expect(adr).toContain("memberships ativas");
    expect(adr).toContain("membership ativa com role owner");
    expect(adr).toContain("primeiro contexto ativo");
    expect(adr).toContain("indicador e a troca de organizacao ativa ja existem");
    expect(adr).toContain("rotas por `orgslug`");
    expect(adr).toContain("billing");
  });

  it("documents the transitional data contract", () => {
    expect(adr).toContain("organization_id");
    expect(adr).toContain("owner_id");
    expect(adr).toContain("compatibilidade transicional");
    expect(adr).toContain("expense_categories");
    expect(adr).toContain("family_members");
    expect(adr).toContain("profiles");
    expect(adr).toContain("fallback rls legado `organization_id is null` foi removido");
  });

  it("keeps runtime, schema, RLS, UI, billing, E2E, data, and legacy fallback out of scope", () => {
    expect(adr).toContain("nao altera runtime");
    expect(adr).toContain("schema");
    expect(adr).toContain("rls");
    expect(adr).toContain("ui");
    expect(adr).toContain("billing");
    expect(adr).toContain("e2e");
    expect(adr).toContain("dados");
    expect(adr).toContain("fallback legado");
  });
});
