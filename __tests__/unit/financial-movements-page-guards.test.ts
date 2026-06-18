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
  const movementFilterBar = read("components/movements/movement-filter-bar.tsx");
  const movementList = read("components/movements/movement-list.tsx");
  const movementReversalForm = read("components/movements/movement-reversal-form.tsx");
  const movementUtils = read("components/movements/movement-utils.ts");
  const movementActions = read("app/protected/movimentacoes/actions.ts");
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
    expect(movementsPage).toContain("<MovementList movements={filteredMovements}");
    expect(movementsPage).toContain("<MovementFilterBar");
    expect(movementsPage).toContain("movement.movement_type === filters.movementType");
    expect(movementsPage).toContain("movement.direction === filters.direction");
    expect(movementsPage).toContain("movement.family_member_id === filters.memberId");
    expect(movementsPage).toContain("movement.bank_id === filters.bankId");
  });

  it("keeps movement filters constrained to generated app movement types", () => {
    expect(movementFilterBar).toContain("movementTypeLabelFromType");
    expect(movementFilterBar).toContain('name="tipo"');
    expect(movementFilterBar).toContain('name="direcao"');
    expect(movementFilterBar).toContain('value="inflow"');
    expect(movementFilterBar).toContain('value="outflow"');
    expect(movementFilterBar).toContain('name="pessoa"');
    expect(movementFilterBar).toContain('name="banco"');
    expect(movementFilterBar).toContain('name="de"');
    expect(movementFilterBar).toContain('name="ate"');
  });

  it("shows bank, currency, and source details in movement rows", () => {
    expect(movementList).toContain("movementBankLabel(movement)");
    expect(movementList).toContain("movementReferenceLabel(movement)");
    expect(movementUtils).toContain("movementCurrencyLabel");
    expect(movementUtils).toContain("movement.banks?.account_type");
    expect(movementUtils).toContain("movement.banks?.currency");
    expect(movementUtils).toContain("movement.expenses?.payment_method");
  });

  it("exposes movement reversal only for active payable and receivable ledger rows", () => {
    expect(movementList).toContain("MovementReversalForm");
    expect(movementList).toContain("!movement.reversed_at");
    expect(movementList).toContain('movement.movement_type === "payable_bill_payment"');
    expect(movementList).toContain('movement.movement_type === "receivable_income_receipt"');
    expect(movementList).toContain("estornado");
    expect(movementReversalForm).toContain("reverseFinancialMovement");
    expect(movementReversalForm).toContain('name="id"');
    expect(movementActions).toContain("finance.movement.reverse");
    expect(movementActions).toContain("reverse_financial_movement");
    expect(movementActions).toContain('"/protected/relatorios"');
  });

  it("revalidates movements after status actions create ledger entries", () => {
    expect(payableActions).toContain('"/protected/movimentacoes"');
    expect(receivableActions).toContain('"/protected/movimentacoes"');
  });
});
