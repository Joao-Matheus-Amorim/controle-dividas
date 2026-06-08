import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("client state strategy contract guards", () => {
  const contract = read("docs/audits/CLIENT_STATE_STRATEGY_CONTRACT.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const auditsReadme = read("docs/audits/README.md");
  const docStatus = read("docs/DOCUMENTATION_STATUS.md");
  const packageJson = read("package.json");

  it("documents GAP-019 without claiming runtime or dependency changes", () => {
    expect(contract).toContain("gap-019");
    expect(contract).toContain("estado local react");
    expect(contract).toContain("searchparams");
    expect(contract).toContain("url state");
    expect(contract).toContain("useactionstate");
    expect(contract).toContain("usetransition");
    expect(contract).toContain("@tanstack/react-table");
    expect(contract).toContain("server data primeiro");
    expect(contract).toContain("nao implementa runtime novo");
    expect(contract).toContain("nao adiciona dependencias");
    expect(contract).toContain(
      "nao introduzir zustand, jotai, redux, swr ou react query sem pr dedicado",
    );
  });

  it("keeps current code patterns mapped to the contract", () => {
    const appDataTable = read("components/app/app-data-table.tsx");
    const expenseListClient = read("components/finance/expense-list-client.tsx");
    const payablePage = read("features/protected-pages/contas-a-pagar-page.tsx");
    const payableUtils = read("components/payables/payable-utils.ts");
    const expenseForm = read("components/finance/expense-form.tsx");

    expect(appDataTable).toContain("@tanstack/react-table");
    expect(appDataTable).toContain("usestate<sortingstate>");
    expect(expenseListClient).toContain("usetransition");
    expect(payablePage).toContain("searchparams");
    expect(payableUtils).toContain("urlsearchparams");
    expect(expenseForm).toContain("useactionstate");
  });

  it("blocks accidental introduction of a global state library without a new contract", () => {
    expect(packageJson).not.toContain("zustand");
    expect(packageJson).not.toContain("jotai");
    expect(packageJson).not.toContain("redux");
    expect(packageJson).not.toContain("@reduxjs");
    expect(packageJson).not.toContain("swr");
    expect(packageJson).not.toContain("@tanstack/react-query");
  });

  it("keeps live planning and DocDoc indexes aligned", () => {
    for (const source of [gapRegister, roadmap, auditsReadme, docStatus]) {
      expect(source).toContain("client_state_strategy_contract.md");
      expect(source).toContain("gap-019");
    }

    expect(gapRegister).toContain("client state strategy contract exists");
    expect(gapRegister).toContain(
      "no runtime, ui, schema, rls, billing, or dependency change is implemented",
    );
    expect(roadmap).toContain("client state strategy adoption");
    expect(auditsReadme).toContain("contrato vigente do gap-019");
    expect(docStatus).toContain("nao implementa runtime nem adiciona dependencia");
  });
});
