import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("bank balance movement rpc guards", () => {
  const migration = read("supabase/migrations/059_bank_balance_from_financial_movements.sql");
  const payableActions = read("app/protected/contas-a-pagar/actions.ts");
  const receivableActions = read("app/protected/contas-a-receber/actions.ts");

  it("updates bank balances in the same RPC that records payable payments", () => {
    expect(migration).toContain("mark_payable_bill_paid_with_movement");
    expect(migration).toContain("for update");
    expect(migration).toContain("insert into public.financial_movements");
    expect(migration).toContain("current_balance = current_balance - target_bill.amount");
  });

  it("updates bank balances in the same RPC that records receivable receipts", () => {
    expect(migration).toContain("mark_receivable_income_received_with_movement");
    expect(migration).toContain("for update");
    expect(migration).toContain("insert into public.financial_movements");
    expect(migration).toContain("current_balance = current_balance + target_income.amount");
  });

  it("revalidates bank pages after movement-backed status changes", () => {
    expect(payableActions).toContain('"/protected/bancos"');
    expect(receivableActions).toContain('"/protected/bancos"');
  });
});
