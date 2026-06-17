import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = "supabase/migrations/057_financial_movements_ledger_base.sql";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function normalized(path: string) {
  return read(path)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.replace(/--.*$/g, ""))
    .join("\n")
    .replace(/\s+/g, " ")
    .trim();
}

describe("financial movements ledger base", () => {
  const migration = normalized(migrationPath);
  const types = read("lib/finance/types.ts");
  const readModel = read("lib/organizations/financial-movements.ts");

  it("creates the central ledger with automatic occurrence time and required financial links", () => {
    expect(migration).toContain("create table if not exists public.financial_movements");
    expect(migration).toContain("organization_id uuid not null references public.organizations(id) on delete restrict");
    expect(migration).toContain("family_member_id uuid not null references public.family_members(id) on delete restrict");
    expect(migration).toContain("bank_id uuid not null references public.banks(id) on delete restrict");
    expect(migration).toContain("amount numeric(12,2) not null");
    expect(migration).toContain("currency text not null default 'eur'");
    expect(migration).toContain("occurred_at timestamptz not null default now()");
    expect(migration).toContain("recorded_timezone text");
  });

  it("only accepts movement types for currently implemented payable and receivable flows", () => {
    expect(migration).toContain("check (movement_type in ('payable_bill_payment', 'receivable_income_receipt'))");
    expect(migration).toContain("movement_type <> 'payable_bill_payment'");
    expect(migration).toContain("direction = 'outflow'");
    expect(migration).toContain("payable_bill_id is not null");
    expect(migration).toContain("movement_type <> 'receivable_income_receipt'");
    expect(migration).toContain("direction = 'inflow'");
    expect(migration).toContain("receivable_income_id is not null");
    expect(migration).not.toContain("'expense'");
    expect(migration).not.toContain("'transfer'");
    expect(migration).not.toContain("'adjustment'");
  });

  it("keeps ledger rows organization scoped and reference checked before writes", () => {
    expect(migration).toContain("alter table public.financial_movements enable row level security");
    expect(migration).toContain("revoke all on public.financial_movements from anon");
    expect(migration).toContain("financial_movement_refs_match_organization");
    expect(migration).toContain("can_manage_organization_financial_movement");
    expect(migration).toContain("financial_movements_select_organization");
    expect(migration).toContain("financial_movements_insert_organization");
    expect(migration).toContain("financial_movements_update_organization");
    expect(migration).toContain("financial_movements_delete_organization");
    expect(migration).toContain("public.can_manage_organization_payable_bill");
    expect(migration).toContain("public.can_manage_organization_receivable_income");
    expect(migration).toContain("else 'can_edit'");
  });

  it("exposes typed read contracts for future movement screens and reports", () => {
    expect(types).toContain('export type FinancialMovementType = "payable_bill_payment" | "receivable_income_receipt" | "expense_payment"');
    expect(types).toContain('export type FinancialMovementDirection = "inflow" | "outflow"');
    expect(types).toContain("export type DbFinancialMovement");
    expect(types).toContain("recorded_timezone: string | null");
    expect(types).toContain("payable_bill_id: string | null");
    expect(types).toContain("receivable_income_id: string | null");

    expect(readModel).toContain("getOrganizationFinancialMovements");
    expect(readModel).toContain("const [payableMemberIds, receivableMemberIds, expenseMemberIds] = await Promise.all");
    expect(readModel).toContain('getAccessibleMemberIds("CONTAS_A_PAGAR", "can_view"');
    expect(readModel).toContain('getAccessibleMemberIds("CONTAS_A_RECEBER", "can_view"');
    expect(readModel).toContain('getAccessibleMemberIds("GASTOS", "can_view"');
    expect(readModel).toContain('.from("financial_movements")');
    expect(readModel).toContain('.eq("organization_id", organization.id)');
    expect(readModel).toContain('.eq("movement_type", "payable_bill_payment")');
    expect(readModel).toContain('.in("family_member_id", payableMemberIds)');
    expect(readModel).toContain('.eq("movement_type", "receivable_income_receipt")');
    expect(readModel).toContain('.in("family_member_id", receivableMemberIds)');
    expect(readModel).toContain('.eq("movement_type", "expense_payment")');
    expect(readModel).toContain('.in("family_member_id", expenseMemberIds)');
    expect(readModel).not.toContain("moduleMemberIds.flat()");
    expect(readModel).not.toContain('.in("family_member_id", accessibleMemberIds)');
    expect(readModel).toContain('.order("occurred_at", { ascending: false })');
  });
});
