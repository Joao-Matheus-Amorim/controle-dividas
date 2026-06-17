import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("financial movements page guards", () => {
  const permissions = read("lib/finance/permissions.ts");
  const paths = read("lib/organizations/paths.ts");
  const appShell = read("components/app/app-shell.tsx");
  const mobileNavigation = read("components/app/mobile-bottom-navigation.tsx");
  const movementsPage = read("features/protected-pages/movimentacoes-page.tsx");
  const payableActions = read("app/protected/contas-a-pagar/actions.ts");
  const receivableActions = read("app/protected/contas-a-receber/actions.ts");

  it("registers movements as an app module and route", () => {
    expect(permissions).toContain('{ key: "MOVIMENTACOES", label: "Movimentacoes" }');
    expect(paths).toContain('"/protected/movimentacoes": "movimentacoes"');
    expect(appShell).toContain('href: "/protected/movimentacoes"');
    expect(appShell).toContain('module: "MOVIMENTACOES"');
    expect(mobileNavigation).toContain("movements: Repeat2");
  });

  it("renders movements from the organization ledger read model", () => {
    expect(movementsPage).toContain("getOrganizationFinancialMovements");
    expect(movementsPage).toContain("totalInflow");
    expect(movementsPage).toContain("totalOutflow");
    expect(movementsPage).toContain("<MovementList movements={movements}");
  });

  it("revalidates movements after status actions create ledger entries", () => {
    expect(payableActions).toContain('"/protected/movimentacoes"');
    expect(receivableActions).toContain('"/protected/movimentacoes"');
  });
});
